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

    const { token } = await req.json();

    if (!token) {
      return new Response(JSON.stringify({ valid: false, error: "Token is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Verifying invite token: ${token.substring(0, 8)}...`);

    // Look up the token
    const { data: invite, error: lookupError } = await supabaseClient
      .from("pending_invites")
      .select("*")
      .eq("token", token)
      .maybeSingle();

    if (lookupError) {
      console.error("Error looking up token:", lookupError);
      return new Response(JSON.stringify({ valid: false, error: "Invalid token" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!invite) {
      console.log("Token not found");
      return new Response(JSON.stringify({ valid: false, error: "Invalid or expired token" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if already used
    if (invite.used_at) {
      console.log("Token already used");
      return new Response(JSON.stringify({ valid: false, error: "This invitation has already been used" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if expired
    const expiresAt = new Date(invite.expires_at);
    if (expiresAt < new Date()) {
      console.log("Token expired");
      return new Response(JSON.stringify({ valid: false, error: "This invitation has expired" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Token valid for user: ${invite.email}`);

    return new Response(
      JSON.stringify({
        valid: true,
        email: invite.email,
        full_name: invite.full_name,
        unit_number: invite.unit_number,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in verify-invite function:", errorMessage);
    return new Response(JSON.stringify({ valid: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
