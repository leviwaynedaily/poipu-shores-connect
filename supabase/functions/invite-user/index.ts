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

    const { email, full_name, unit_number, phone, role, relationship_type, is_primary_contact } = await req.json();

    if (!email || !full_name) {
      return new Response(JSON.stringify({ error: "Email and full name are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate a temporary password
    const tempPassword = crypto.randomUUID();

    // Create the user without email confirmation
    const { data: newUser, error: createError } = await supabaseClient.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: false, // Don't confirm yet - they'll confirm via the invite link
      user_metadata: {
        full_name,
        unit_number: unit_number || null,
      },
    });

    if (createError) {
      console.error("Failed to create user:", createError);
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`User created successfully: ${email}`);

    // Update profile with phone number if provided
    if (phone) {
      const { error: phoneError } = await supabaseClient
        .from("profiles")
        .update({ phone })
        .eq("id", newUser.user.id);
      
      if (phoneError) {
        console.error("Failed to update phone number:", phoneError);
      } else {
        console.log(`Updated phone number for user ${email}`);
      }
    }

    // Assign role if specified
    if (role && (role === "admin" || role === "owner" || role === "board")) {
      const { error: roleError } = await supabaseClient
        .from("user_roles")
        .insert({ user_id: newUser.user.id, role });
      
      if (roleError) {
        console.error("Failed to assign role:", roleError);
      } else {
        console.log(`Assigned role ${role} to user ${email}`);
      }
    }

    // Create unit_owners entry if unit_number is provided
    if (unit_number) {
      const { error: unitOwnerError } = await supabaseClient
        .from("unit_owners")
        .insert({
          user_id: newUser.user.id,
          unit_number,
          relationship_type: relationship_type || 'primary',
          is_primary_contact: is_primary_contact || false,
        });
      
      if (unitOwnerError) {
        console.error("Failed to assign unit:", unitOwnerError);
      } else {
        console.log(`Assigned unit ${unit_number} to user ${email} as ${relationship_type || 'primary'}`);
      }
    }

    // Generate an invite link (for signup with password)
    const { data: inviteData, error: inviteError } = await supabaseClient.auth.admin.generateLink({
      type: 'invite',
      email: email,
    });

    if (inviteError || !inviteData.properties?.action_link) {
      console.error("Failed to generate invite link:", inviteError);
      // User was created, but we can't send email - return partial success
      return new Response(JSON.stringify({ 
        error: "User created but failed to generate invite link",
        user: { id: newUser.user.id, email }
      }), {
        status: 207, // Multi-status
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const inviteLink = inviteData.properties.action_link;
    console.log(`Generated invite link for ${email}`);

    // Send invitation email
    const { error: emailError } = await resend.emails.send({
      from: "Poipu Shores <noreply@poipu-shores.com>",
      replyTo: "support@poipu-shores.com",
      to: [email],
      subject: "Complete Your Poipu Shores Registration",
      headers: {
        'X-Entity-Ref-ID': crypto.randomUUID(),
        'List-Unsubscribe': '<mailto:unsubscribe@poipu-shores.com>',
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
      text: `Complete Your Poipu Shores Registration

Hi ${full_name},

You've been invited to join the Poipu Shores community platform. This is an account notification to complete your registration.

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
    Complete your Poipu Shores account registration ${unit_number ? `for Unit ${unit_number}` : ''} - Action required
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
              <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.5; color: #374151;">You've been invited to join the Poipu Shores community platform. This is an account notification to complete your registration and set your password.</p>
              ${unit_number ? `<p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.5; color: #374151;"><strong>Your Unit:</strong> ${unit_number}</p>` : ''}
            </td>
          </tr>
          
          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 0 24px 0;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color: #2563eb; border-radius: 6px;">
                    <a href="${inviteLink}" target="_blank" style="display: inline-block; padding: 14px 28px; font-size: 16px; font-weight: 500; color: #ffffff; text-decoration: none; border-radius: 6px;">Complete Registration</a>
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
      // User was created but email failed - return partial success
      return new Response(JSON.stringify({ 
        error: "User created but failed to send email",
        user: { id: newUser.user.id, email }
      }), {
        status: 207, // Multi-status
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Invitation email sent successfully to ${email}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "User invited successfully",
        user: { id: newUser.user.id, email }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
