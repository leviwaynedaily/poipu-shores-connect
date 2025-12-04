import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Convert HSL string (e.g., "210 40% 98%" or "0 0% 100% / 10%") to HEX
function hslToHex(hsl: string): string {
  try {
    // Handle HSL with alpha (e.g., "0 0% 100% / 10%")
    const hasAlpha = hsl.includes('/');
    let hslPart = hsl;
    let alpha = 1;
    
    if (hasAlpha) {
      const parts = hsl.split('/');
      hslPart = parts[0].trim();
      alpha = parseFloat(parts[1].trim().replace('%', '')) / 100;
    }
    
    // Parse "H S% L%" format
    const values = hslPart.trim().split(/\s+/);
    const h = parseFloat(values[0]) / 360;
    const s = parseFloat(values[1].replace('%', '')) / 100;
    const l = parseFloat(values[2].replace('%', '')) / 100;
    
    // HSL to RGB conversion
    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    
    // Convert to HEX
    const toHex = (x: number) => {
      const hex = Math.round(x * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    
    const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
    
    // If there's alpha, append it
    if (hasAlpha && alpha < 1) {
      const alphaHex = Math.round(alpha * 255).toString(16).padStart(2, '0').toUpperCase();
      return hex + alphaHex;
    }
    
    return hex;
  } catch (e) {
    console.error('Error converting HSL to HEX:', hsl, e);
    return '#000000';
  }
}

// Convert all HSL colors in an object to HEX
function convertColorsToHex(colors: Record<string, string>): Record<string, string> {
  const hexColors: Record<string, string> = {};
  for (const [key, value] of Object.entries(colors)) {
    hexColors[key] = hslToHex(value);
  }
  return hexColors;
}

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
    let pages = config?.pages || [];

    // Default mobile pages to merge with stored config
    if (platform === 'mobile') {
      const defaultMobilePages = [
        { id: "home", tabName: "Home", route: "/", fallbackIcon: "Home", title: "Home", subtitle: "Welcome home", order: 1, isVisible: true, isFloating: false },
        { id: "chat", tabName: "Chat", route: "/chat", fallbackIcon: "MessageSquare", title: "Chat", subtitle: "Community chat", order: 2, isVisible: true, isFloating: false },
        { id: "assistant", tabName: "Assistant", route: "/assistant", fallbackIcon: "Bird", title: "Assistant", subtitle: "AI Assistant", order: 3, isVisible: true, isFloating: true },
        { id: "photos", tabName: "Photos", route: "/photos", fallbackIcon: "Camera", title: "Photos", subtitle: "Community photos", order: 4, isVisible: true, isFloating: false },
        { id: "documents", tabName: "Documents", route: "/documents", fallbackIcon: "FileText", title: "Documents", subtitle: "Important documents", order: 5, isVisible: true, isFloating: false },
        { id: "announcements", tabName: "News", route: "/announcements", fallbackIcon: "Megaphone", title: "Announcements", subtitle: "Community news", order: 6, isVisible: true, isFloating: false },
        { id: "members", tabName: "Members", route: "/members", fallbackIcon: "Users", title: "Members", subtitle: "Community members", order: 7, isVisible: true, isFloating: false },
        { id: "profile", tabName: "Profile", route: "/profile", fallbackIcon: "User", title: "Profile", subtitle: "Your profile", order: 8, isVisible: true, isFloating: false },
        { id: "settings", tabName: "Settings", route: "/settings", fallbackIcon: "Settings", title: "Settings", subtitle: "App settings", order: 9, isVisible: true, isFloating: false },
        { id: "more", tabName: "More", route: "/more", fallbackIcon: "MoreHorizontal", title: "More", subtitle: "Additional options", order: 10, isVisible: true, isFloating: false },
        { id: "admin-settings", tabName: "Admin", route: "/admin-settings", fallbackIcon: "Shield", title: "Admin Settings", subtitle: "Administrative controls", order: 11, isVisible: true, isFloating: false },
      ];

      // Merge: add any default pages that don't exist in stored config
      const existingIds = new Set(pages.map((p: any) => p.id));
      for (const defaultPage of defaultMobilePages) {
        if (!existingIds.has(defaultPage.id)) {
          pages.push(defaultPage);
        }
      }
    }

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
      const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
      
      // Define stable URLs for backgrounds
      const STABLE_URLS = {
        mobile: {
          app: `${supabaseUrl}/storage/v1/object/public/avatars/mobile-app-background.png`,
          login: `${supabaseUrl}/storage/v1/object/public/avatars/mobile-login-background.png`,
        },
        web: {
          app: `${supabaseUrl}/storage/v1/object/public/avatars/web-app-background.png`,
        }
      };

      // Fetch platform-specific theme config
      const themeConfigKey = platform === 'web' ? 'web_theme_config' : 'mobile_theme_config';
      
      const { data: themeConfigData } = await supabaseClient
        .from('app_settings')
        .select('setting_value')
        .eq('setting_key', themeConfigKey)
        .maybeSingle();

      // Also fetch favicon which is shared across platforms
      const { data: faviconData } = await supabaseClient
        .from('app_settings')
        .select('setting_value')
        .eq('setting_key', 'favicon_url')
        .maybeSingle();

      // Default theme config if none exists
      const defaultThemeConfig: any = {
        appBackground: { type: 'default', url: null, opacity: 100 },
        homeBackground: { type: 'default', url: null, opacity: 100 },
        colors: {
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
          enabled: platform === 'web',
          defaultIntensity: platform === 'web' ? 90 : 50
        }
      };

      // Mobile-specific defaults
      if (platform === 'mobile') {
        defaultThemeConfig.cardRadius = 12;
        
        // Navigation Bar with light/dark variants
        defaultThemeConfig.navBarStyle = 'solid';
        defaultThemeConfig.navBarOpacity = 80;
        defaultThemeConfig.navBar = {
          light: { color: '#FFFFFF' },
          dark: { color: '#000000' }
        };
        // Keep legacy single value for backward compatibility
        defaultThemeConfig.navBarColor = '#000000';
        
        // Header Background with light/dark variants
        defaultThemeConfig.headerStyle = 'solid';
        defaultThemeConfig.headerOpacity = 80;
        defaultThemeConfig.header = {
          light: { 
            color: '#FFFFFF',
            titleColor: '#1F2937',
            subtitleColor: '#4B5563'
          },
          dark: { 
            color: '#1F2937',
            titleColor: '#F9FAFB',
            subtitleColor: '#9CA3AF'
          }
        };
        // Keep legacy single values for backward compatibility
        defaultThemeConfig.headerColor = '#FFFFFF';
        defaultThemeConfig.headerTitleColor = '#1F2937';
        defaultThemeConfig.headerSubtitleColor = '#4B5563';
        
        // Header Title typography
        defaultThemeConfig.headerTitleFont = 'system';
        defaultThemeConfig.headerTitleSize = 'text-xl';
        defaultThemeConfig.headerTitleWeight = 'bold';
        
        // Header Subtitle typography
        defaultThemeConfig.headerSubtitleFont = 'system';
        defaultThemeConfig.headerSubtitleSize = 'text-sm';
        defaultThemeConfig.headerSubtitleWeight = 'normal';
        
        // Page header logos (enabled by default)
        defaultThemeConfig.usePageHeaderLogos = true;
      }

      // Web-specific defaults
      if (platform === 'web') {
        defaultThemeConfig.authBackground = { type: 'default', url: null, opacity: 100 };
      }

      const themeConfig = themeConfigData?.setting_value || defaultThemeConfig;
      
      // Merge with defaults to ensure all properties exist
      const mergedThemeConfig = {
        ...defaultThemeConfig,
        ...themeConfig,
        colors: {
          light: {
            ...defaultThemeConfig.colors.light,
            ...(themeConfig.colors?.light || {}),
          },
          dark: {
            ...defaultThemeConfig.colors.dark,
            ...(themeConfig.colors?.dark || {}),
          }
        }
      };

      // Override URLs with stable URLs if type is 'uploaded'
      if (platform === 'mobile') {
        if (mergedThemeConfig.appBackground?.type === 'uploaded') {
          mergedThemeConfig.appBackground.url = STABLE_URLS.mobile.app;
        }
        if (mergedThemeConfig.homeBackground?.type === 'uploaded') {
          mergedThemeConfig.homeBackground.url = STABLE_URLS.mobile.login;
        }
      } else if (platform === 'web') {
        if (mergedThemeConfig.appBackground?.type === 'uploaded') {
          mergedThemeConfig.appBackground.url = STABLE_URLS.web.app;
        }
      }

      // Generate HEX versions of semantic colors for mobile convenience
      const colorsHex = {
        light: convertColorsToHex(mergedThemeConfig.colors.light),
        dark: convertColorsToHex(mergedThemeConfig.colors.dark),
      };

      response.theme = {
        ...mergedThemeConfig,
        colorsHex, // HEX versions of all semantic colors
        faviconUrl: faviconData?.setting_value || null,
      };

      // Add implementation notes for mobile
      if (platform === 'mobile') {
        response.theme.glassEffect.description = 'Glass effect using SwiftUI materials';
        response.theme.glassEffect.implementation = 'Use .background(.ultraThinMaterial) or .regularMaterial';
      }
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
