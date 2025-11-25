import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: roles } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const isAdmin = roles?.some((r) => r.role === "admin");
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden: Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { user_id, full_name, unit_number } = await req.json();

    if (!user_id || !full_name) {
      return new Response(JSON.stringify({ error: "User ID and full name are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get the user's email using admin API
    const { data: targetUser, error: getUserError } = await supabaseClient.auth.admin.getUserById(user_id);

    if (getUserError || !targetUser?.user?.email) {
      return new Response(JSON.stringify({ error: "Failed to get user email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const email = targetUser.user.email;

    // Generate a password reset link (works for existing users who haven't logged in)
    const { data: resetData, error: resetError } = await supabaseClient.auth.admin.generateLink({
      type: 'recovery',
      email: email,
    });

    if (resetError || !resetData.properties?.action_link) {
      console.error("Failed to generate reset link:", resetError);
      throw new Error("Failed to generate reset link");
    }

    const inviteLink = resetData.properties.action_link;
    
    console.log(`Successfully generated reset link for ${email}`);

    // Send the email
    const { error: emailError } = await resend.emails.send({
      from: "Poipu Shores <noreply@poipu-shores.com>",
      to: [email],
      subject: "Welcome to Poipu Shores - Set Your Password",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to Poipu Shores!</h2>
          <p>Hi ${full_name},</p>
          <p>You've been invited to join the Poipu Shores community platform. Click the button below to set your password and access your account:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteLink}" style="background-color: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Set Your Password</a>
          </div>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${inviteLink}</p>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">If you didn't expect this invitation, you can safely ignore this email.</p>
        </div>
      `,
    });

    if (emailError) {
      console.error("Failed to send invitation email:", emailError);
      throw new Error("Failed to send invitation email");
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Invitation resent successfully",
        email
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in resend-invite function:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
