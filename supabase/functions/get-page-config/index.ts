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
    const includeTheme = url.searchParams.get('include') === 'theme';

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

    const response: any = {
      platform,
      pages: visiblePages,
      timestamp: new Date().toISOString(),
    };

    // Include theme data if requested
    if (includeTheme) {
      const { data: themeData } = await supabaseClient
        .from('app_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['app_background', 'home_background', 'favicon_url']);

      const themeSettings: any = {};
      themeData?.forEach((setting) => {
        themeSettings[setting.setting_key] = setting.setting_value;
      });

      response.theme = {
        appBackground: themeSettings.app_background || { type: 'default' },
        homeBackground: themeSettings.home_background || { type: 'default' },
        faviconUrl: themeSettings.favicon_url || null,
        colors: {
          // Light mode colors (HSL format)
          light: {
            background: '0 0% 100%',
            foreground: '265 4% 12.9%',
            card: '0 0% 100%',
            cardForeground: '265 4% 12.9%',
            primary: '266 4% 20.8%',
            primaryForeground: '248 0.3% 98.4%',
            secondary: '248 0.7% 96.8%',
            secondaryForeground: '266 4% 20.8%',
            muted: '248 0.7% 96.8%',
            mutedForeground: '257 4.6% 55.4%',
            accent: '248 0.7% 96.8%',
            accentForeground: '266 4% 20.8%',
            destructive: '27 24.5% 57.7%',
            destructiveForeground: '0 0% 100%',
            border: '256 1.3% 92.9%',
            input: '256 1.3% 92.9%',
            ring: '257 4% 70.4%',
          },
          // Dark mode colors (HSL format)
          dark: {
            background: '0 0% 15%',
            foreground: '248 0.3% 98.4%',
            card: '266 4% 20.8%',
            cardForeground: '248 0.3% 98.4%',
            primary: '256 1.3% 92.9%',
            primaryForeground: '266 4% 20.8%',
            secondary: '260 4.1% 27.9%',
            secondaryForeground: '248 0.3% 98.4%',
            muted: '260 4.1% 27.9%',
            mutedForeground: '257 4% 70.4%',
            accent: '260 4.1% 27.9%',
            accentForeground: '248 0.3% 98.4%',
            destructive: '22 19.1% 70.4%',
            destructiveForeground: '248 0.3% 98.4%',
            border: '0 0% 100% / 10%',
            input: '0 0% 100% / 15%',
            ring: '264 2.7% 55.1%',
          }
        },
        glassEffect: {
          defaultIntensity: 90,
          description: 'Users can customize glass intensity per-profile. Default is 90.',
          css: 'backdrop-filter: blur(10px); background: rgba(255, 255, 255, var(--glass-opacity));',
          implementation: 'Use SwiftUI .background(.ultraThinMaterial) or .regularMaterial for glass effect'
        }
      };
    }

    return new Response(
      JSON.stringify(response),
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
