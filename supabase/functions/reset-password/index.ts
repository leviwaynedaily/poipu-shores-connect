import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Resend } from 'https://esm.sh/resend@4.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Hawaiian words for password generation
const hawaiianWords = [
  'aloha', 'mahalo', 'ohana', 'keiki', 'kai', 'makai', 'mauka', 'lanai',
  'pono', 'kuleana', 'kokua', 'malama', 'pau', 'wiki', 'hale', 'mana',
  'nani', 'aina', 'pua', 'mele', 'hula', 'wiki', 'lua', 'koa',
  'kula', 'luna', 'moana', 'pali', 'wai', 'lani', 'kane', 'wahine'
];

function generateTempPassword(): string {
  const word1 = hawaiianWords[Math.floor(Math.random() * hawaiianWords.length)];
  const word2 = hawaiianWords[Math.floor(Math.random() * hawaiianWords.length)];
  const number = Math.floor(Math.random() * 99) + 1;
  return `${word1}${word2}${number}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: roleData, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (roleError || !roleData) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Not an admin' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { user_id, notification_method } = await req.json();

    if (!user_id || !notification_method) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user info
    const { data: targetUser, error: targetUserError } = await supabaseClient.auth.admin.getUserById(user_id);
    
    if (targetUserError || !targetUser.user) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get profile for phone number
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('full_name, phone')
      .eq('id', user_id)
      .single();

    // Generate new temporary password
    const tempPassword = generateTempPassword();

    // Update user password
    const { error: updateError } = await supabaseClient.auth.admin.updateUserById(user_id, {
      password: tempPassword,
      user_metadata: {
        ...targetUser.user.user_metadata,
        force_password_change: true
      }
    });

    if (updateError) {
      throw updateError;
    }

    // Send notification based on method
    if (notification_method === 'email' || notification_method === 'both') {
      const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
      const loginUrl = 'https://poipu-shores.com';

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Password Reset - Poipu Shores</h2>
          <p>Hello ${profile?.full_name || 'there'},</p>
          <p>Your password has been reset by an administrator.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong>Login URL:</strong> ${loginUrl}</p>
            <p style="margin: 0 0 10px 0;"><strong>Email:</strong> ${targetUser.user.email}</p>
            <p style="margin: 0;"><strong>Temporary Password:</strong> <code style="background-color: #e5e7eb; padding: 4px 8px; border-radius: 4px; font-size: 16px;">${tempPassword}</code></p>
          </div>

          ${notification_method === 'both' && profile?.phone ? '<p><em>An SMS with login details has also been sent to your phone.</em></p>' : ''}
          
          <p style="color: #dc2626; font-weight: 600;">You will be required to change your password upon login.</p>
          
          <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px;">
            If you didn't request this password reset, please contact the Poipu Shores admin immediately.
          </p>
        </div>
      `;

      try {
        await resend.emails.send({
          from: 'Poipu Shores <onboarding@resend.dev>',
          to: targetUser.user.email!,
          subject: 'Your Password Has Been Reset - Poipu Shores',
          html: emailHtml,
        });
      } catch (emailError) {
        console.error('Email error:', emailError);
      }
    }

    if ((notification_method === 'sms' || notification_method === 'both') && profile?.phone) {
      try {
        const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
        const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
        const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

        const smsMessage = `Your Poipu Shores password has been reset. Login at poipu-shores.com with email: ${targetUser.user.email} and password: ${tempPassword}. ${notification_method === 'both' ? 'An email was also sent. ' : ''}You'll need to change your password on login.`;

        const response = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
          {
            method: 'POST',
            headers: {
              'Authorization': 'Basic ' + btoa(`${twilioAccountSid}:${twilioAuthToken}`),
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              To: profile.phone,
              From: twilioPhoneNumber!,
              Body: smsMessage,
            }),
          }
        );

        if (!response.ok) {
          console.error('SMS error:', await response.text());
        }
      } catch (smsError) {
        console.error('SMS error:', smsError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Password reset successfully',
        temp_password: notification_method === 'show' ? tempPassword : undefined
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return new Response(
      JSON.stringify({
        error: errorMessage
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
