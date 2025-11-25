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

    const { email, full_name, unit_number, role } = await req.json();

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
      <td align="center" style="padding: 20px 0;">
        <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #333333; font-family: Arial, sans-serif; font-size: 24px; margin: 0 0 20px 0;">Welcome to Poipu Shores!</h2>
              <p style="color: #333333; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Hi ${full_name},</p>
              <p style="color: #333333; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">You've been invited to join the Poipu Shores community platform. Click the button below to complete your registration and set your password:</p>
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${inviteLink}" style="background-color: #0066cc; color: #ffffff; font-family: Arial, sans-serif; font-size: 16px; font-weight: bold; text-decoration: none; padding: 14px 28px; border-radius: 4px; display: inline-block;">Complete Registration</a>
                  </td>
                </tr>
              </table>
              <p style="color: #666666; font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; margin: 0 0 10px 0;">If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="color: #0066cc; font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0; word-break: break-all;">${inviteLink}</p>
              ${unit_number ? `<p style="color: #333333; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.6; margin: 20px 0;"><strong>Your Unit:</strong> ${unit_number}</p>` : ''}
              <p style="color: #999999; font-family: Arial, sans-serif; font-size: 13px; line-height: 1.6; margin: 30px 0 0 0; padding-top: 20px; border-top: 1px solid #eeeeee;">If you didn't expect this invitation, you can safely ignore this email.</p>
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
