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

    const { email, full_name, unit_number, role, relationship_type, is_primary_contact } = await req.json();

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
      subject: "Welcome to Poipu Shores - Complete Your Registration",
      headers: {
        'X-Entity-Ref-ID': crypto.randomUUID(),
      },
      text: `Hi ${full_name},

You've been invited to join the Poipu Shores community platform. Complete your registration by clicking the link below:

${inviteLink}

${unit_number ? `Your Unit: ${unit_number}\n\n` : ''}If you didn't expect this invitation, you can safely ignore this email.

Best regards,
The Poipu Shores Team`,
      html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Welcome to Poipu Shores</title>
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
              <h2 style="color: #1e293b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 28px; font-weight: 600; margin: 0 0 20px 0;">Welcome to Poipu Shores!</h2>
              <p style="color: #334155; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Hi ${full_name},</p>
              <p style="color: #475569; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">You've been invited to join the Poipu Shores community platform. Complete your registration and set your password to access all community features:</p>
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
                          <a href="${inviteLink}" target="_blank" style="background-color: #3b82f6; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; font-weight: 600; text-decoration: none; padding: 16px 36px; border-radius: 8px; display: inline-block; border: none;">Complete Registration</a>
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
