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

    // Send the email with password reset link
    console.log(`Attempting to send email to ${email} from noreply@poipu-shores.com`);
    
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "Poipu Shores <noreply@poipu-shores.com>",
      replyTo: "support@poipu-shores.com",
      to: [email],
      subject: "Poipu Shores - Complete Your Registration",
      headers: {
        'X-Entity-Ref-ID': crypto.randomUUID(),
      },
      text: `Hi ${full_name},

You were invited to join Poipu Shores but haven't completed your registration yet. Click the link below to set your password and access your account:

${inviteLink}

${unit_number ? `Your Unit: ${unit_number}\n\n` : ''}If you didn't expect this invitation, you can safely ignore this email.

Best regards,
The Poipu Shores Team`,
      html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Complete Your Poipu Shores Registration</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f4;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); overflow: hidden;">
          <!-- Header -->
          <tr>
            <td align="center" style="background-color: #1e40af; padding: 40px 30px;">
              <h1 style="color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 32px; font-weight: 700; margin: 0; letter-spacing: -0.5px;">Poipu Shores</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #1e293b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 28px; font-weight: 600; margin: 0 0 20px 0;">Complete Your Registration</h2>
              <p style="color: #334155; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Hi ${full_name},</p>
              <p style="color: #475569; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">You were invited to join Poipu Shores but haven't completed your registration yet. Click the button below to set your password and access your account:</p>
              ${unit_number ? `<div style="background-color: #f1f5f9; border-left: 4px solid #3b82f6; padding: 16px 20px; margin: 0 0 30px 0; border-radius: 4px;">
                <p style="color: #1e293b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; font-weight: 600; margin: 0;"><strong>Your Unit:</strong> ${unit_number}</p>
              </div>` : ''}
              <!-- Button -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding: 10px 0 30px 0;">
                    <table border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="background-color: #3b82f6; border-radius: 8px;">
                          <a href="${inviteLink}" target="_blank" style="background-color: #3b82f6; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; font-weight: 600; text-decoration: none; padding: 16px 36px; border-radius: 8px; display: inline-block; border: none;">Set Your Password</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <p style="color: #64748b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; line-height: 1.6; margin: 0 0 10px 0;">If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="color: #3b82f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 13px; line-height: 1.6; margin: 0 0 20px 0; word-break: break-all; background-color: #f8fafc; padding: 12px; border-radius: 6px;">${inviteLink}</p>
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                <p style="color: #94a3b8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 13px; line-height: 1.6; margin: 0;">If you didn't expect this invitation, you can safely ignore this email.</p>
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="background-color: #f8fafc; padding: 30px; border-top: 1px solid #e2e8f0;">
              <p style="color: #64748b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; line-height: 1.6; margin: 0 0 10px 0;">Poipu Shores Community</p>
              <p style="color: #94a3b8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; line-height: 1.6; margin: 0;">© ${new Date().getFullYear()} Poipu Shores. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    });

    if (emailError) {
      console.error("Failed to send invitation email:", emailError);
      throw new Error("Failed to send invitation email");
    }

    console.log(`Email sent successfully to ${email}. Email ID:`, emailData?.id);

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
