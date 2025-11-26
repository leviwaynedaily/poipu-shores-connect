import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

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

    const { token, password } = await req.json();

    if (!token || !password) {
      return new Response(JSON.stringify({ error: "Token and password are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (password.length < 6) {
      return new Response(JSON.stringify({ error: "Password must be at least 6 characters" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Completing invite for token: ${token.substring(0, 8)}...`);

    // Look up the token
    const { data: invite, error: lookupError } = await supabaseClient
      .from("pending_invites")
      .select("*")
      .eq("token", token)
      .maybeSingle();

    if (lookupError || !invite) {
      console.error("Error looking up token:", lookupError);
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if already used
    if (invite.used_at) {
      return new Response(JSON.stringify({ error: "This invitation has already been used" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if expired
    const expiresAt = new Date(invite.expires_at);
    if (expiresAt < new Date()) {
      return new Response(JSON.stringify({ error: "This invitation has expired" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Setting password for user: ${invite.email}`);

    // Update user's password
    const { error: updateError } = await supabaseClient.auth.admin.updateUserById(
      invite.user_id,
      { 
        password,
        email_confirm: true, // Confirm their email as part of accepting invite
      }
    );

    if (updateError) {
      console.error("Failed to update user password:", updateError);
      return new Response(JSON.stringify({ error: "Failed to set password" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark invite as used
    const { error: markUsedError } = await supabaseClient
      .from("pending_invites")
      .update({ used_at: new Date().toISOString() })
      .eq("token", token);

    if (markUsedError) {
      console.error("Failed to mark invite as used:", markUsedError);
      // Don't fail the request - password was set successfully
    }

    console.log(`Invite completed successfully for ${invite.email}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Password set successfully",
        email: invite.email,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in complete-invite function:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
