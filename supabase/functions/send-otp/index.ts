import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone } = await req.json();

    if (!phone) {
      return new Response(
        JSON.stringify({ error: "Phone number is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalize phone number (remove spaces, dashes, etc.)
    const normalizedPhone = phone.replace(/\D/g, "");
    
    console.log(`Sending OTP to phone: ${normalizedPhone.slice(-4)}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      console.error("Twilio credentials not configured");
      return new Response(
        JSON.stringify({ error: "SMS service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user exists with this phone number
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, phone")
      .eq("phone", normalizedPhone)
      .maybeSingle();

    if (profileError) {
      console.error("Error looking up profile:", profileError);
      return new Response(
        JSON.stringify({ error: "Error looking up user" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!profile) {
      // Don't reveal if user exists or not for security
      console.log("No user found with this phone number");
      return new Response(
        JSON.stringify({ error: "If an account exists with this phone number, you will receive an SMS" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check rate limiting - only 1 code per phone per 60 seconds
    const { data: recentCode } = await supabase
      .from("otp_codes")
      .select("created_at")
      .eq("phone", normalizedPhone)
      .gte("created_at", new Date(Date.now() - 60000).toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recentCode) {
      console.log("Rate limited - code sent too recently");
      return new Response(
        JSON.stringify({ error: "Please wait before requesting another code" }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Delete any existing codes for this phone
    await supabase
      .from("otp_codes")
      .delete()
      .eq("phone", normalizedPhone);

    // Generate a 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Store the code
    const { error: insertError } = await supabase
      .from("otp_codes")
      .insert({
        phone: normalizedPhone,
        code,
        user_id: profile.id,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
      });

    if (insertError) {
      console.error("Error storing OTP code:", insertError);
      return new Response(
        JSON.stringify({ error: "Error generating verification code" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Format phone number for Twilio (ensure it has + prefix)
    const formattedPhone = normalizedPhone.startsWith("1") 
      ? `+${normalizedPhone}` 
      : normalizedPhone.startsWith("+") 
        ? normalizedPhone 
        : `+1${normalizedPhone}`;

    // Send SMS via Twilio
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
    const twilioAuth = btoa(`${twilioAccountSid}:${twilioAuthToken}`);

    const smsResponse = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${twilioAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: formattedPhone,
        From: twilioPhoneNumber,
        Body: `Your Poipu Shores verification code is: ${code}. This code expires in 10 minutes.`,
      }),
    });

    if (!smsResponse.ok) {
      const errorText = await smsResponse.text();
      console.error("Twilio error:", errorText);
      
      // Delete the code since SMS failed
      await supabase
        .from("otp_codes")
        .delete()
        .eq("phone", normalizedPhone);

      return new Response(
        JSON.stringify({ error: "Failed to send SMS. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`OTP sent successfully to phone ending in ${normalizedPhone.slice(-4)}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Verification code sent",
        phone: formattedPhone.slice(-4) // Return last 4 digits for UI
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in send-otp:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
