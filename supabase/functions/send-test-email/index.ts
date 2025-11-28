import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TestEmailRequest {
  to_email: string;
  subject: string;
  message: string;
  template?: string;
}

const emailTemplates = {
  "community-update": {
    subject: "Poipu Shores Community Update",
    getHtml: (message: string) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Poipu Shores Community</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="color: #1f2937; margin-bottom: 20px;">Community Update</h2>
          <div style="color: #4b5563; line-height: 1.6; white-space: pre-wrap;">${message}</div>
        </div>
        <div style="background: #e5e7eb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px;">
          <p>Poipu Shores Community • Kauai, Hawaii</p>
          <p style="margin: 5px 0;">This is a test email from your community management system.</p>
        </div>
      </div>
    `,
  },
  "weather-advisory": {
    subject: "Poipu Shores Weather Advisory",
    getHtml: (message: string) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #dc2626; padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">⚠️ Weather Advisory</h1>
        </div>
        <div style="padding: 30px; background: #fef2f2;">
          <div style="color: #991b1b; line-height: 1.6; white-space: pre-wrap;">${message}</div>
        </div>
        <div style="background: #e5e7eb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px;">
          <p>Poipu Shores Community • Kauai, Hawaii</p>
        </div>
      </div>
    `,
  },
  "photo-highlights": {
    subject: "Poipu Shores Photo Highlights",
    getHtml: (message: string) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">📸 Photo Highlights</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="color: #1f2937; margin-bottom: 20px;">Recent Community Photos</h2>
          <div style="color: #4b5563; line-height: 1.6; white-space: pre-wrap;">${message}</div>
        </div>
        <div style="background: #e5e7eb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px;">
          <p>Poipu Shores Community • Kauai, Hawaii</p>
        </div>
      </div>
    `,
  },
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    // Verify the user is authenticated
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    // Check if user is admin
    const { data: roles } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!roles) {
      throw new Error("Admin access required");
    }

    const { to_email, subject, message, template }: TestEmailRequest = await req.json();

    if (!to_email || !message) {
      throw new Error("Missing required fields: to_email and message");
    }

    // Get template or use custom subject
    const selectedTemplate = template && emailTemplates[template as keyof typeof emailTemplates];
    const emailSubject = selectedTemplate ? selectedTemplate.subject : subject || "Poipu Shores Test Email";
    const emailHtml = selectedTemplate 
      ? selectedTemplate.getHtml(message)
      : `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">Poipu Shores</h1>
          </div>
          <div style="padding: 30px; background: #f9fafb;">
            <div style="color: #4b5563; line-height: 1.6; white-space: pre-wrap;">${message}</div>
          </div>
          <div style="background: #e5e7eb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px;">
            <p>Poipu Shores Community • Kauai, Hawaii</p>
          </div>
        </div>
      `;

    console.log(`Sending test email to ${to_email} with subject: ${emailSubject}`);

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: "Poipu Shores <noreply@poipu-shores.com>",
      to: [to_email],
      subject: emailSubject,
      html: emailHtml,
      replyTo: "support@poipu-shores.com",
      headers: {
        "X-Entity-Ref-ID": crypto.randomUUID(),
      },
    });

    console.log("Email sent successfully:", emailResponse);

    // Log the email
    const { error: logError } = await supabaseClient
      .from("email_logs")
      .insert({
        from_email: "noreply@poipu-shores.com",
        to_email,
        subject: emailSubject,
        status: "sent",
        sent_by: user.id,
      });

    if (logError) {
      console.error("Error logging email:", logError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email sent successfully",
        data: emailResponse 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-test-email function:", error);

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: error.message === "Unauthorized" || error.message === "Admin access required" ? 403 : 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
