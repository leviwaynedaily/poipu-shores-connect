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

    // Get authenticated user from JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      console.error("Auth error:", authError);
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

    const { user_id, full_name, unit_number, method } = await req.json();
    // method: "email" (default), "sms", or "both"
    const sendMethod = method || "email";

    if (!user_id || !full_name) {
      return new Response(JSON.stringify({ error: "User ID and full name are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get the user's email and phone
    const { data: targetUser, error: getUserError } = await supabaseClient.auth.admin.getUserById(user_id);

    if (getUserError || !targetUser?.user) {
      return new Response(JSON.stringify({ error: "Failed to get user details" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const email = targetUser.user.email;
    const phone = targetUser.user.phone;

    // Get phone from profile if not in auth
    let profilePhone = phone;
    if (!profilePhone) {
      const { data: profile } = await supabaseClient
        .from("profiles")
        .select("phone")
        .eq("id", user_id)
        .single();
      
      if (profile?.phone) {
        // Format phone for SMS
        const cleaned = profile.phone.replace(/\D/g, '');
        if (cleaned.length === 10) {
          profilePhone = '+1' + cleaned;
        } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
          profilePhone = '+' + cleaned;
        } else {
          profilePhone = profile.phone;
        }
      }
    }

    if ((sendMethod === "sms" || sendMethod === "both") && !profilePhone) {
      return new Response(JSON.stringify({ error: "User has no phone number. Add one first via Edit User." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate invite token
    const tokenBytes = new Uint8Array(32);
    crypto.getRandomValues(tokenBytes);
    const inviteToken = Array.from(tokenBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Delete old unused tokens, create new one
    await supabaseClient
      .from("pending_invites")
      .delete()
      .eq("user_id", user_id)
      .is("used_at", null);

    const { error: tokenError } = await supabaseClient
      .from("pending_invites")
      .insert({
        user_id,
        token: inviteToken,
        email: email || '',
        full_name,
        unit_number: unit_number || null,
      });

    if (tokenError) {
      console.error("Failed to create invite token:", tokenError);
      throw new Error("Failed to generate invite link");
    }

    const inviteLink = `https://poipu-shores.com/accept-invite?token=${inviteToken}`;
    let emailSent = false;
    let smsSent = false;

    // Send email
    if ((sendMethod === "email" || sendMethod === "both") && email) {
      try {
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
          text: `Hi ${full_name},\n\nYou were invited to join Poipu Shores but haven't completed your registration yet.\n\nComplete your registration: ${inviteLink}\n\n${unit_number ? `Your Unit: ${unit_number}\n\n` : ''}Poipu Shores Community\nKoloa, Kauai, HI 96756`,
          html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #ffffff;">
  <div style="display: none; max-height: 0px; overflow: hidden;">Registration reminder - Complete your Poipu Shores account setup</div>
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #ffffff;">
    <tr><td style="padding: 40px 20px;">
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto;">
        <tr><td style="padding: 0 0 24px 0;"><h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #111827;">Poipu Shores</h1></td></tr>
        <tr><td style="padding: 0 0 24px 0;">
          <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.5; color: #111827;">Hi ${full_name},</p>
          <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.5; color: #374151;">You were invited to join Poipu Shores but haven't completed your registration yet.</p>
          ${unit_number ? `<p style="margin: 0 0 16px 0; font-size: 16px; color: #374151;"><strong>Your Unit:</strong> ${unit_number}</p>` : ''}
        </td></tr>
        <tr><td style="padding: 0 0 24px 0;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr>
            <td style="background-color: #2563eb; border-radius: 6px;">
              <a href="${inviteLink}" target="_blank" style="display: inline-block; padding: 14px 28px; font-size: 16px; font-weight: 500; color: #ffffff; text-decoration: none; border-radius: 6px;">Set Your Password</a>
            </td>
          </tr></table>
        </td></tr>
        <tr><td style="padding: 0 0 32px 0; border-bottom: 1px solid #e5e7eb;">
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280;">Or copy this link:</p>
          <p style="margin: 0; font-size: 13px; color: #2563eb; word-break: break-all;">${inviteLink}</p>
        </td></tr>
        <tr><td style="padding: 24px 0 0 0;">
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #111827; font-weight: 500;">Poipu Shores Community</p>
          <p style="margin: 0; font-size: 13px; color: #6b7280;">Koloa, Kauai, HI 96756</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
        });

        if (emailError) {
          console.error("Email send error:", emailError);
        } else {
          emailSent = true;
          console.log(`Email sent to ${email}, ID: ${emailData?.id}`);
          
          // Log email
          try {
            await supabaseClient.from("email_logs").insert({
              to_email: email,
              from_email: "noreply@poipu-shores.com",
              subject: "Complete Your Poipu Shores Registration - Reminder",
              status: "sent",
              sent_by: user.id,
              resend_email_id: emailData?.id,
              delivery_status: "sent",
            });
          } catch (logError) {
            console.error('Failed to log email:', logError);
          }
        }
      } catch (emailError) {
        console.error("Failed to send email:", emailError);
      }
    }

    // Send SMS
    if ((sendMethod === "sms" || sendMethod === "both") && profilePhone) {
      try {
        const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
        const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
        const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

        if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
          console.error('Twilio credentials not configured - skipping SMS');
        } else {
          const smsMessage = `Hi ${full_name}! You've been invited to Poipu Shores. Complete your registration here: ${inviteLink}`;

          const response = await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
            {
              method: 'POST',
              headers: {
                'Authorization': 'Basic ' + btoa(`${twilioAccountSid}:${twilioAuthToken}`),
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: new URLSearchParams({
                To: profilePhone,
                From: twilioPhoneNumber,
                Body: smsMessage,
              }),
            }
          );

          if (!response.ok) {
            const errorText = await response.text();
            console.error('SMS error:', errorText);
          } else {
            smsSent = true;
            console.log(`SMS sent to ${profilePhone}`);
          }
        }
      } catch (smsError) {
        console.error('SMS send error:', smsError);
      }
    }

    const sentVia = [emailSent && 'email', smsSent && 'SMS'].filter(Boolean).join(' and ');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: sentVia ? `Invitation resent via ${sentVia}` : "Invite link generated",
        email_sent: emailSent,
        sms_sent: smsSent,
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
