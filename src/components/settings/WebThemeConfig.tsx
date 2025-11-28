import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Helper functions for color conversion
const hslToHex = (hsl: string): string => {
  const parts = hsl.split(' ').map(p => parseFloat(p.replace('%', '')));
  const h = parts[0];
  const s = parts[1] / 100;
  const l = parts[2] / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }

  const toHex = (n: number) => {
    const hex = Math.round((n + m) * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const hexToHsl = (hex: string): string => {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

interface WebThemeConfig {
  colors: {
    light: Record<string, string>;
    dark: Record<string, string>;
  };
}

export function WebThemeConfig() {
  const { toast } = useToast();
  const [config, setConfig] = useState<WebThemeConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('setting_value')
        .eq('setting_key', 'web_theme_config')
        .maybeSingle();

      if (error) throw error;

      if (data?.setting_value) {
        setConfig(data.setting_value as any as WebThemeConfig);
      } else {
        // Use default theme if none exists
        setConfig({
          colors: {
            light: {
              primary: '266 4% 20.8%',
            },
            dark: {
              primary: '256 1.3% 92.9%',
            },
          },
        });
      }
    } catch (error: any) {
      console.error('Error fetching web theme config:', error);
      toast({
        title: "Error",
        description: "Failed to load web theme configuration",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async (updatedConfig: WebThemeConfig) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert([{
          setting_key: 'web_theme_config',
          setting_value: updatedConfig as any,
        }], {
          onConflict: 'setting_key',
        });

      if (error) throw error;

      setConfig(updatedConfig);
      toast({
        title: "Success",
        description: "Web theme configuration saved. Refresh the page to see changes.",
      });
    } catch (error: any) {
      console.error('Error saving web theme config:', error);
      toast({
        title: "Error",
        description: "Failed to save web theme configuration",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !config) {
    return <div className="text-center py-8 text-muted-foreground">Loading web theme configuration...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Primary Color</CardTitle>
          <CardDescription>
            Customize the primary color for light and dark modes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Light Mode Primary</Label>
              <div className="flex items-center gap-3">
                <Input
                  type="color"
                  value={`#${hslToHex(config.colors.light.primary)}`}
                  onChange={(e) => {
                    const hsl = hexToHsl(e.target.value);
                    const updatedConfig = {
                      ...config,
                      colors: {
                        ...config.colors,
                        light: {
                          ...config.colors.light,
                          primary: hsl,
                        },
                      },
                    };
                    setConfig(updatedConfig);
                  }}
                  className="w-20 h-10"
                />
                <code className="flex-1 text-xs bg-muted px-3 py-2 rounded">
                  {config.colors.light.primary}
                </code>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Dark Mode Primary</Label>
              <div className="flex items-center gap-3">
                <Input
                  type="color"
                  value={`#${hslToHex(config.colors.dark.primary)}`}
                  onChange={(e) => {
                    const hsl = hexToHsl(e.target.value);
                    const updatedConfig = {
                      ...config,
                      colors: {
                        ...config.colors,
                        dark: {
                          ...config.colors.dark,
                          primary: hsl,
                        },
                      },
                    };
                    setConfig(updatedConfig);
                  }}
                  className="w-20 h-10"
                />
                <code className="flex-1 text-xs bg-muted px-3 py-2 rounded">
                  {config.colors.dark.primary}
                </code>
              </div>
            </div>
          </div>

          <Button
            onClick={() => saveConfig(config)}
            disabled={saving}
            className="w-full"
          >
            {saving ? "Saving..." : "Save Color Changes"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
