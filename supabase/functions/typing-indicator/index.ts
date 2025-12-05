import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(authHeader);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, channel_id } = await req.json();

    if (!channel_id) {
      return new Response(
        JSON.stringify({ error: 'channel_id required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    switch (action) {
      case 'start': {
        // Upsert typing indicator
        const { error } = await supabaseClient
          .from('chat_typing_indicators')
          .upsert({
            channel_id,
            user_id: user.id,
            started_at: new Date().toISOString()
          }, { onConflict: 'channel_id,user_id' });

        if (error) {
          console.error('Error setting typing indicator:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to set typing indicator' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'stop': {
        // Remove typing indicator
        const { error } = await supabaseClient
          .from('chat_typing_indicators')
          .delete()
          .eq('channel_id', channel_id)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error removing typing indicator:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to remove typing indicator' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'cleanup': {
        // Remove stale typing indicators (older than 10 seconds)
        const tenSecondsAgo = new Date(Date.now() - 10000).toISOString();
        
        const { error } = await supabaseClient
          .from('chat_typing_indicators')
          .delete()
          .lt('started_at', tenSecondsAgo);

        if (error) {
          console.error('Error cleaning up typing indicators:', error);
        }

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
