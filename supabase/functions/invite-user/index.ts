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

// Generate a temporary password using Hawaiian words
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

    const { email, full_name, phone, role, unit_number, is_primary_owner } = await req.json();

    // Generate temporary password
    const tempPassword = generateTempPassword();

    // Create user with temp password and force password change on first login
    const { data: newUser, error: createError } = await supabaseClient.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name,
        phone,
        force_password_change: true
      },
    });

    if (createError || !newUser.user) {
      throw createError || new Error('Failed to create user');
    }

    // Update user profile
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .update({
        full_name,
        phone,
        unit_number,
      })
      .eq('id', newUser.user.id);

    if (profileError) {
      throw profileError;
    }

    // Add role if specified
    if (role && ['admin', 'board', 'owner'].includes(role)) {
      await supabaseClient
        .from('user_roles')
        .insert({
          user_id: newUser.user.id,
          role: role
        });
    }

    // Add unit ownership if unit_number is provided
    if (unit_number) {
      await supabaseClient
        .from('unit_owners')
        .insert({
          user_id: newUser.user.id,
          unit_number,
          relationship_type: 'owner',
          is_primary_contact: is_primary_owner || false,
        });
    }

    // Send email notification
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
    const loginUrl = 'https://poipu-shores.com';

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Welcome to Poipu Shores!</h2>
        <p>Hello ${full_name},</p>
        <p>You've been invited to join the Poipu Shores community platform.</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0 0 10px 0;"><strong>Login URL:</strong> ${loginUrl}</p>
          <p style="margin: 0 0 10px 0;"><strong>Email:</strong> ${email}</p>
          <p style="margin: 0;"><strong>Temporary Password:</strong> <code style="background-color: #e5e7eb; padding: 4px 8px; border-radius: 4px; font-size: 16px;">${tempPassword}</code></p>
        </div>

        ${phone ? '<p><em>An SMS with login details has also been sent to your phone.</em></p>' : ''}
        ${unit_number ? `<p><strong>Your Unit:</strong> ${unit_number}</p>` : ''}
        
        <p style="color: #dc2626; font-weight: 600;">You will be required to change your password upon first login.</p>
        
        <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px;">
          If you didn't expect this invitation, please contact the Poipu Shores admin.
        </p>
      </div>
    `;

    try {
      await resend.emails.send({
        from: 'Poipu Shores <onboarding@resend.dev>',
        to: email,
        subject: 'Welcome to Poipu Shores - Your Login Details',
        html: emailHtml,
      });
      console.log('Email sent successfully to:', email);
    } catch (emailError) {
      console.error('Email error for', email, ':', emailError);
    }

    // Send SMS if phone number exists
    if (phone) {
      try {
        const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
        const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
        const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

        if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
          console.error('Twilio credentials not configured - skipping SMS');
        } else {
          const smsMessage = `Welcome to Poipu Shores! Login at ${loginUrl} with email: ${email} and password: ${tempPassword}. An email with details was also sent. You'll need to change your password on first login.`;

          const response = await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
            {
              method: 'POST',
              headers: {
                'Authorization': 'Basic ' + btoa(`${twilioAccountSid}:${twilioAuthToken}`),
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: new URLSearchParams({
                To: phone,
                From: twilioPhoneNumber,
                Body: smsMessage,
              }),
            }
          );

          if (!response.ok) {
            const errorText = await response.text();
            console.error('SMS error for', phone, ':', errorText);
          } else {
            console.log('SMS sent successfully to:', phone);
          }
        }
      } catch (smsError) {
        console.error('SMS error for', phone, ':', smsError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'User invited successfully',
        user_id: newUser.user.id,
        temp_password: tempPassword
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
