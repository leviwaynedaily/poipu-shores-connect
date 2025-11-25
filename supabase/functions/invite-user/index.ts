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
      from: "Poipu Shores <onboarding@resend.dev>",
      to: [email],
      subject: "Welcome to Poipu Shores - Complete Your Registration",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to Poipu Shores!</h2>
          <p>Hi ${full_name},</p>
          <p>You've been invited to join the Poipu Shores community platform. Click the button below to complete your registration and set your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteLink}" style="background-color: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Complete Registration</a>
          </div>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${inviteLink}</p>
          ${unit_number ? `<p style="margin-top: 20px;"><strong>Your Unit:</strong> ${unit_number}</p>` : ''}
          <p style="color: #666; font-size: 14px; margin-top: 30px;">If you didn't expect this invitation, you can safely ignore this email.</p>
        </div>
      `,
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
