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
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const url = new URL(req.url);
    const platform = url.searchParams.get('platform') || 'mobile';

    // Fetch the appropriate config based on platform
    const configKey = platform === 'web' ? 'web_pages_config' : 'mobile_pages_config';
    
    const { data, error } = await supabaseClient
      .from('app_settings')
      .select('setting_value')
      .eq('setting_key', configKey)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return new Response(
        JSON.stringify({
          error: 'Configuration not found',
          pages: []
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        }
      );
    }

    const config = data.setting_value as any;
    const pages = config?.pages || [];

    // Sort by order and filter visible pages
    const visiblePages = pages
      .filter((page: any) => page.isVisible)
      .sort((a: any, b: any) => a.order - b.order);

    return new Response(
      JSON.stringify({
        platform,
        pages: visiblePages,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error fetching page config:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
