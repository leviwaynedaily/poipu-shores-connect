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

    // Generate a secure random token for custom invitation flow
    const tokenBytes = new Uint8Array(32);
    crypto.getRandomValues(tokenBytes);
    const inviteToken = Array.from(tokenBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Store the token in pending_invites (or update existing)
    // First, delete any existing unused tokens for this user
    await supabaseClient
      .from("pending_invites")
      .delete()
      .eq("user_id", user_id)
      .is("used_at", null);

    // Create new token
    const { error: tokenError } = await supabaseClient
      .from("pending_invites")
      .insert({
        user_id,
        token: inviteToken,
        email,
        full_name,
        unit_number: unit_number || null,
      });

    if (tokenError) {
      console.error("Failed to create invite token:", tokenError);
      throw new Error("Failed to generate invite link");
    }

    const inviteLink = `https://poipu-shores.com/accept-invite?token=${inviteToken}`;
    
    console.log(`Successfully generated invite link for ${email}`);

    // Send the email with password reset link
    console.log(`Attempting to send email to ${email} from noreply@poipu-shores.com`);
    
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "Poipu Shores <noreply@poipu-shores.com>",
      replyTo: "support@poipu-shores.com",
      to: [email],
      subject: "Complete Your Poipu Shores Registration - Reminder",
      headers: {
        'X-Entity-Ref-ID': crypto.randomUUID(),
        'List-Unsubscribe': '<mailto:unsubscribe@poipu-shores.com>',
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
      text: `Complete Your Poipu Shores Registration - Reminder

Hi ${full_name},

You were invited to join Poipu Shores but haven't completed your registration yet. This is an account notification reminder to set your password and access your account.

Complete your registration: ${inviteLink}

${unit_number ? `Your Unit: ${unit_number}\n\n` : ''}This is an automated account notification. If you didn't request this, please disregard this message.

---
Poipu Shores Community
Koloa, Kauai, HI 96756

Questions? Reply to this email or contact support@poipu-shores.com`,
      html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <!--[if mso]>
  <style type="text/css">
    table {border-collapse: collapse;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #ffffff;">
  <!-- Preheader text (hidden) -->
  <div style="display: none; max-height: 0px; overflow: hidden;">
    Registration reminder ${unit_number ? `for Unit ${unit_number}` : ''} - Complete your Poipu Shores account setup
  </div>
  
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #ffffff;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto;">
          
          <!-- Header -->
          <tr>
            <td style="padding: 0 0 24px 0;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #111827; line-height: 1.25;">Poipu Shores</h1>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 0 0 24px 0;">
              <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.5; color: #111827;">Hi ${full_name},</p>
              <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.5; color: #374151;">You were invited to join Poipu Shores but haven't completed your registration yet. This is an account notification reminder to set your password and access your account.</p>
              ${unit_number ? `<p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.5; color: #374151;"><strong>Your Unit:</strong> ${unit_number}</p>` : ''}
            </td>
          </tr>
          
          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 0 24px 0;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color: #2563eb; border-radius: 6px;">
                    <a href="${inviteLink}" target="_blank" style="display: inline-block; padding: 14px 28px; font-size: 16px; font-weight: 500; color: #ffffff; text-decoration: none; border-radius: 6px;">Set Your Password</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Link Fallback -->
          <tr>
            <td style="padding: 0 0 32px 0; border-bottom: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px 0; font-size: 14px; line-height: 1.5; color: #6b7280;">Or copy this link:</p>
              <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #2563eb; word-break: break-all;">${inviteLink}</p>
            </td>
          </tr>
          
          <!-- Security Notice -->
          <tr>
            <td style="padding: 24px 0 32px 0; border-bottom: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #6b7280;">This is an automated account notification. If you didn't request this, please disregard this message.</p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 0 0 0;">
              <p style="margin: 0 0 8px 0; font-size: 14px; line-height: 1.5; color: #111827; font-weight: 500;">Poipu Shores Community</p>
              <p style="margin: 0 0 4px 0; font-size: 13px; line-height: 1.5; color: #6b7280;">Koloa, Kauai, HI 96756</p>
              <p style="margin: 0 0 16px 0; font-size: 13px; line-height: 1.5; color: #6b7280;">Questions? Reply to this email or contact support@poipu-shores.com</p>
              <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #9ca3af;">© ${new Date().getFullYear()} Poipu Shores. All rights reserved.</p>
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
