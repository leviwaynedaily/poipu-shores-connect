import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload, Wand2, Palette, ImageIcon } from "lucide-react";
import { BackgroundImageDialog } from "./BackgroundImageDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  appBackground?: {
    type: 'default' | 'uploaded' | 'color' | 'gradient';
    url: string | null;
    opacity: number;
    color?: string;
    gradientStart?: string;
    gradientEnd?: string;
  };
}

// Custom hook to share state across components
function useWebThemeConfig() {
  const { toast } = useToast();
  const [config, setConfig] = useState<WebThemeConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [availableImages, setAvailableImages] = useState<Array<{ name: string; url: string }>>([]);

  useEffect(() => {
    fetchConfig();
    fetchAvailableImages();
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
            light: { primary: '266 4% 20.8%' },
            dark: { primary: '256 1.3% 92.9%' },
          },
          appBackground: {
            type: 'default',
            url: null,
            opacity: 100,
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

  const fetchAvailableImages = async () => {
    try {
      const { data, error } = await supabase.storage
        .from('avatars')
        .list('', { limit: 100 });

      if (error) throw error;

      // Only show background images, exclude header icons and logos
      const imageFiles = (data || [])
        .filter(file => {
          const name = file.name.toLowerCase();
          return (
            name.match(/\.(jpg|jpeg|png|gif|webp)$/i) &&
            name.includes('background') &&
            !name.includes('header') &&
            !name.includes('icon') &&
            !name.includes('logo') &&
            !name.includes('avatar') &&
            !name.includes('mobile')
          );
        })
        .map(file => ({
          name: file.name,
          url: supabase.storage.from('avatars').getPublicUrl(file.name).data.publicUrl,
        }));

      setAvailableImages(imageFiles);
    } catch (error: any) {
      console.error('Error fetching available images:', error);
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
        description: "Web theme configuration saved",
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

  const handleSelectExistingImage = async (imageUrl: string) => {
    if (!config) return;

    const updatedConfig = {
      ...config,
      appBackground: {
        ...config.appBackground!,
        type: 'uploaded' as const,
        url: imageUrl,
      },
    };

    await saveConfig(updatedConfig);
  };

  const handleBackgroundUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !config) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const filePath = 'web-app-background.png';
      await supabase.storage.from('avatars').remove([filePath]);

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      fetchAvailableImages();

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const updatedConfig = {
        ...config,
        appBackground: {
          ...config.appBackground!,
          type: 'uploaded' as const,
          url: publicUrl,
        },
      };

      await saveConfig(updatedConfig);
    } catch (error: any) {
      console.error('Error uploading background:', error);
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleGenerateBackground = async () => {
    if (!aiPrompt.trim() || !config) {
      toast({
        title: "Error",
        description: "Please enter a description for the background",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-background', {
        body: { prompt: aiPrompt },
      });

      if (error) throw error;

      const response = await fetch(data.imageUrl);
      const blob = await response.blob();

      const filePath = 'web-app-background.png';
      await supabase.storage.from('avatars').remove([filePath]);

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob, { upsert: true, contentType: 'image/png' });

      if (uploadError) throw uploadError;

      fetchAvailableImages();

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const updatedConfig = {
        ...config,
        appBackground: {
          ...config.appBackground!,
          type: 'uploaded' as const,
          url: publicUrl,
        },
      };

      await saveConfig(updatedConfig);
      setAiPrompt('');
    } catch (error: any) {
      console.error('Error generating background:', error);
      toast({
        title: "Generation failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleColorBackground = async (color: string) => {
    if (!config) return;

    const updatedConfig = {
      ...config,
      appBackground: {
        ...config.appBackground!,
        type: 'color' as const,
        url: null,
        color,
      },
    };

    await saveConfig(updatedConfig);
  };

  const handleGradientBackground = async (start: string, end: string) => {
    if (!config) return;

    const updatedConfig = {
      ...config,
      appBackground: {
        ...config.appBackground!,
        type: 'gradient' as const,
        url: null,
        gradientStart: start,
        gradientEnd: end,
      },
    };

    await saveConfig(updatedConfig);
  };

  const handleResetBackground = async () => {
    if (!config) return;

    const updatedConfig = {
      ...config,
      appBackground: {
        type: 'default' as const,
        url: null,
        opacity: 100,
      },
    };

    await saveConfig(updatedConfig);
  };

  return {
    config,
    saving,
    uploading,
    generating,
    aiPrompt,
    setAiPrompt,
    availableImages,
    saveConfig,
    handleBackgroundUpload,
    handleGenerateBackground,
    handleColorBackground,
    handleGradientBackground,
    handleResetBackground,
    handleSelectExistingImage,
  };
}

// Background Settings Component
export function WebBackgroundSettings() {
  const {
    config,
    uploading,
    generating,
    aiPrompt,
    setAiPrompt,
    availableImages,
    saveConfig,
    handleBackgroundUpload,
    handleGenerateBackground,
    handleColorBackground,
    handleGradientBackground,
    handleResetBackground,
    handleSelectExistingImage,
  } = useWebThemeConfig();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [customColor, setCustomColor] = useState('#0066cc');
  const [gradientStart, setGradientStart] = useState('#0066cc');
  const [gradientEnd, setGradientEnd] = useState('#00ccff');

  if (!config) {
    return <div className="text-center py-8 text-muted-foreground">Loading background settings...</div>;
  }

  return (
    <div className="space-y-4">
      <BackgroundImageDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        images={availableImages}
        activeUrl={config.appBackground?.url || null}
        onSelect={(url) => handleSelectExistingImage(url)}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Opacity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{config.appBackground?.opacity || 100}%</span>
          </div>
          <Slider
            value={[config.appBackground?.opacity || 100]}
            onValueChange={async ([value]) => {
              const updatedConfig = {
                ...config,
                appBackground: {
                  ...config.appBackground!,
                  opacity: value,
                },
              };
              await saveConfig(updatedConfig);
            }}
            min={0}
            max={100}
            step={5}
          />
        </CardContent>
      </Card>

      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ImageIcon className="h-4 w-4" />
            Previously Uploaded Images
          </CardTitle>
          <CardDescription>Select from existing background images</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={() => setDialogOpen(true)}
            className="w-full"
          >
            <ImageIcon className="h-4 w-4 mr-2" />
            Browse {availableImages.length} Background{availableImages.length !== 1 ? 's' : ''}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Upload className="h-4 w-4" />
            Upload New Image
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {config.appBackground?.type === 'uploaded' && config.appBackground.url && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Current Background</Label>
              <div className="rounded-md border border-border overflow-hidden">
                <img
                  src={config.appBackground.url}
                  alt="Current background"
                  className="w-full h-24 object-cover"
                />
              </div>
            </div>
          )}
          <Input
            type="file"
            accept="image/*"
            onChange={handleBackgroundUpload}
            disabled={uploading}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Wand2 className="h-4 w-4" />
            Generate with AI
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Describe your background..."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              disabled={generating}
            />
            <Button onClick={handleGenerateBackground} disabled={generating}>
              Generate
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Palette className="h-4 w-4" />
            Solid Color
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              type="color"
              value={customColor}
              onChange={(e) => setCustomColor(e.target.value)}
              className="w-16 h-9 p-1 cursor-pointer"
            />
            <Input
              type="text"
              value={customColor}
              onChange={(e) => setCustomColor(e.target.value)}
              placeholder="#0066cc"
              className="flex-1 font-mono"
            />
            <Button onClick={() => handleColorBackground(customColor)} variant="outline" size="sm">
              Apply
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Gradient</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                type="color"
                value={gradientStart}
                onChange={(e) => setGradientStart(e.target.value)}
                className="w-16 h-9 p-1 cursor-pointer"
              />
              <Input
                type="text"
                value={gradientStart}
                onChange={(e) => setGradientStart(e.target.value)}
                placeholder="#0066cc"
                className="flex-1 font-mono text-sm"
              />
            </div>
            <div className="flex gap-2">
              <Input
                type="color"
                value={gradientEnd}
                onChange={(e) => setGradientEnd(e.target.value)}
                className="w-16 h-9 p-1 cursor-pointer"
              />
              <Input
                type="text"
                value={gradientEnd}
                onChange={(e) => setGradientEnd(e.target.value)}
                placeholder="#00ccff"
                className="flex-1 font-mono text-sm"
              />
            </div>
            <Button onClick={() => handleGradientBackground(gradientStart, gradientEnd)} variant="outline" size="sm" className="w-full">
              Apply Gradient
            </Button>
          </div>
        </CardContent>
      </Card>

      <Button
        variant="outline"
        onClick={handleResetBackground}
        className="w-full"
      >
        Reset to Default
      </Button>
    </div>
  );
}

// Color Settings Component
export function WebColorSettings() {
  const { config: globalConfig, saving, saveConfig } = useWebThemeConfig();
  const [config, setConfig] = useState(globalConfig);

  useEffect(() => {
    if (globalConfig) {
      setConfig(globalConfig);
    }
  }, [globalConfig]);

  if (!config) {
    return <div className="text-center py-8 text-muted-foreground">Loading color settings...</div>;
  }

  const handleSave = async () => {
    if (config) {
      await saveConfig(config);
    }
  };

  return (
    <div className="space-y-4">
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
              <div className="flex items-center gap-2">
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
                  className="w-16 h-10 p-1 cursor-pointer"
                />
                <Input
                  type="text"
                  value={`#${hslToHex(config.colors.light.primary)}`}
                  onChange={(e) => {
                    const value = e.target.value.trim();
                    if (value && value.match(/^#[0-9A-Fa-f]{3,6}$/)) {
                      const hsl = hexToHsl(value);
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
                    }
                  }}
                  placeholder="#000000"
                  className="flex-1 font-mono text-xs"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Dark Mode Primary</Label>
              <div className="flex items-center gap-2">
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
                  className="w-16 h-10 p-1 cursor-pointer"
                />
                <Input
                  type="text"
                  value={`#${hslToHex(config.colors.dark.primary)}`}
                  onChange={(e) => {
                    const value = e.target.value.trim();
                    if (value && value.match(/^#[0-9A-Fa-f]{3,6}$/)) {
                      const hsl = hexToHsl(value);
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
                    }
                  }}
                  placeholder="#ffffff"
                  className="flex-1 font-mono text-xs"
                />
              </div>
            </div>
          </div>

          <Button
            onClick={handleSave}
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

// Legacy export - kept for backwards compatibility
export function WebThemeConfig() {
  return <WebColorSettings />;
}
