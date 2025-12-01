import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushMessage {
  to: string;
  sound: 'default';
  title: string;
  body: string;
  data?: Record<string, any>;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { user_ids, title, body, data, notification_type } = await req.json();

    if (!title || !body) {
      return new Response(
        JSON.stringify({ error: 'Title and body are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Sending push notifications to ${user_ids?.length || 'all'} users for ${notification_type}`);

    // Build query to get push tokens
    let query = supabaseClient
      .from('push_tokens')
      .select('token, user_id, notification_preferences(*)');

    // Filter by user_ids if provided, otherwise send to all
    if (user_ids && Array.isArray(user_ids) && user_ids.length > 0) {
      query = query.in('user_id', user_ids);
    }

    const { data: tokens, error: tokensError } = await query;

    if (tokensError) {
      console.error('Error fetching push tokens:', tokensError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch push tokens' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!tokens || tokens.length === 0) {
      console.log('No push tokens found for the specified users');
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: 'No tokens found' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Filter tokens based on notification preferences
    const filteredTokens = tokens.filter((tokenData: any) => {
      const prefs = tokenData.notification_preferences?.[0];
      if (!prefs) return true; // If no preferences, send by default

      // Check if the notification type is enabled
      switch (notification_type) {
        case 'announcements':
          return prefs.announcements_enabled !== false;
        case 'chat':
          return prefs.chat_enabled !== false;
        case 'photos':
          return prefs.photos_enabled !== false;
        case 'documents':
          return prefs.documents_enabled !== false;
        default:
          return true;
      }
    });

    if (filteredTokens.length === 0) {
      console.log('All users have disabled notifications for this type');
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: 'All users disabled this notification type' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare messages for Expo Push API
    const messages: PushMessage[] = filteredTokens.map((tokenData: any) => ({
      to: tokenData.token,
      sound: 'default',
      title,
      body,
      data: data || {},
    }));

    console.log(`Sending ${messages.length} push notifications to Expo`);

    // Send to Expo Push API
    const expoResponse = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        ...(Deno.env.get('EXPO_ACCESS_TOKEN') && {
          'Authorization': `Bearer ${Deno.env.get('EXPO_ACCESS_TOKEN')}`,
        }),
      },
      body: JSON.stringify(messages),
    });

    const expoResult = await expoResponse.json();
    console.log('Expo Push API response:', expoResult);

    if (!expoResponse.ok) {
      console.error('Expo Push API error:', expoResult);
      return new Response(
        JSON.stringify({ error: 'Failed to send push notifications', details: expoResult }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: messages.length,
        filtered_out: tokens.length - filteredTokens.length,
        expo_response: expoResult 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
