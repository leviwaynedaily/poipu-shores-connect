import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload, Wand2, Palette, Smartphone, Image as ImageIcon } from "lucide-react";

interface MobileThemeConfig {
  appBackground: {
    type: 'default' | 'uploaded' | 'generated' | 'color' | 'gradient';
    url: string | null;
    opacity: number;
    color?: string;
    gradientStart?: string;
    gradientEnd?: string;
    gradientDirection?: string;
  };
  homeBackground: {
    type: 'default' | 'uploaded' | 'generated' | 'color' | 'gradient';
    url: string | null;
    opacity: number;
    color?: string;
    gradientStart?: string;
    gradientEnd?: string;
    gradientDirection?: string;
  };
  colors: {
    light: Record<string, string>;
    dark: Record<string, string>;
  };
  glassEffect: {
    enabled: boolean;
    defaultIntensity: number;
  };
  cardRadius: number;
  navBarStyle: 'solid' | 'translucent';
}

export function MobileThemeConfig() {
  const { toast } = useToast();
  const [config, setConfig] = useState<MobileThemeConfig | null>(null);
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
        .eq('setting_key', 'mobile_theme_config')
        .maybeSingle();

      if (error) throw error;

      if (data?.setting_value) {
        setConfig(data.setting_value as any as MobileThemeConfig);
      }
    } catch (error: any) {
      console.error('Error fetching mobile theme config:', error);
      toast({
        title: "Error",
        description: "Failed to load mobile theme configuration",
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

      const imageFiles = (data || [])
        .filter(file => file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i))
        .map(file => ({
          name: file.name,
          url: supabase.storage.from('avatars').getPublicUrl(file.name).data.publicUrl,
        }));

      setAvailableImages(imageFiles);
    } catch (error: any) {
      console.error('Error fetching available images:', error);
    }
  };

  const handleSelectExistingImage = async (imageUrl: string, target: 'app' | 'home') => {
    if (!config) return;

    const updatedConfig = { ...config };
    if (target === 'app') {
      updatedConfig.appBackground = {
        ...updatedConfig.appBackground,
        type: 'uploaded',
        url: imageUrl,
      };
    } else {
      updatedConfig.homeBackground = {
        ...updatedConfig.homeBackground,
        type: 'uploaded',
        url: imageUrl,
      };
    }

    await saveConfig(updatedConfig);
  };

  const saveConfig = async (updatedConfig: MobileThemeConfig) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert([{
          setting_key: 'mobile_theme_config',
          setting_value: updatedConfig as any,
        }], {
          onConflict: 'setting_key',
        });

      if (error) throw error;

      setConfig(updatedConfig);
      toast({
        title: "Success",
        description: "Mobile theme configuration saved",
      });
    } catch (error: any) {
      console.error('Error saving mobile theme config:', error);
      toast({
        title: "Error",
        description: "Failed to save mobile theme configuration",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleBackgroundUpload = async (event: React.ChangeEvent<HTMLInputElement>, target: 'app' | 'home') => {
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
      // Use fixed paths for stable URLs
      const filePath = target === 'app' 
        ? 'mobile-app-background.png' 
        : 'mobile-login-background.png';

      // Delete existing file first (ignore errors if doesn't exist)
      await supabase.storage.from('avatars').remove([filePath]);

      // Upload new file to the same path
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Refresh available images list
      fetchAvailableImages();

      // Get stable URL (always the same)
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const updatedConfig = { ...config };
      if (target === 'app') {
        updatedConfig.appBackground = {
          ...updatedConfig.appBackground,
          type: 'uploaded',
          url: publicUrl, // Store clean stable URL
        };
      } else {
        updatedConfig.homeBackground = {
          ...updatedConfig.homeBackground,
          type: 'uploaded',
          url: publicUrl, // Store clean stable URL
        };
      }

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

  const handleGenerateBackground = async (target: 'app' | 'home') => {
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

      // Download the generated image
      const response = await fetch(data.imageUrl);
      const blob = await response.blob();

      // Use fixed path for stable URL
      const filePath = target === 'app' 
        ? 'mobile-app-background.png' 
        : 'mobile-login-background.png';

      // Delete existing file first
      await supabase.storage.from('avatars').remove([filePath]);

      // Upload to stable path
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob, { upsert: true, contentType: 'image/png' });

      if (uploadError) throw uploadError;

      // Refresh available images list
      fetchAvailableImages();

      // Get stable URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const updatedConfig = { ...config };
      if (target === 'app') {
        updatedConfig.appBackground = {
          ...updatedConfig.appBackground,
          type: 'uploaded',
          url: publicUrl,
        };
      } else {
        updatedConfig.homeBackground = {
          ...updatedConfig.homeBackground,
          type: 'uploaded',
          url: publicUrl,
        };
      }

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

  const handleColorBackground = async (color: string, target: 'app' | 'home') => {
    if (!config) return;

    const updatedConfig = { ...config };
    if (target === 'app') {
      updatedConfig.appBackground = {
        ...updatedConfig.appBackground,
        type: 'color',
        url: null,
        color,
      };
    } else {
      updatedConfig.homeBackground = {
        ...updatedConfig.homeBackground,
        type: 'color',
        url: null,
        color,
      };
    }

    await saveConfig(updatedConfig);
  };

  const handleGradientBackground = async (start: string, end: string, target: 'app' | 'home') => {
    if (!config) return;

    const updatedConfig = { ...config };
    if (target === 'app') {
      updatedConfig.appBackground = {
        ...updatedConfig.appBackground,
        type: 'gradient',
        url: null,
        gradientStart: start,
        gradientEnd: end,
        gradientDirection: '135deg',
      };
    } else {
      updatedConfig.homeBackground = {
        ...updatedConfig.homeBackground,
        type: 'gradient',
        url: null,
        gradientStart: start,
        gradientEnd: end,
        gradientDirection: '135deg',
      };
    }

    await saveConfig(updatedConfig);
  };

  const handleResetBackground = async (target: 'app' | 'home') => {
    if (!config) return;

    const updatedConfig = { ...config };
    if (target === 'app') {
      updatedConfig.appBackground = {
        type: 'default',
        url: null,
        opacity: 100,
      };
    } else {
      updatedConfig.homeBackground = {
        type: 'default',
        url: null,
        opacity: 100,
      };
    }

    await saveConfig(updatedConfig);
  };

  if (loading || !config) {
    return <div className="text-center py-8 text-muted-foreground">Loading mobile theme configuration...</div>;
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="display" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="display">Display</TabsTrigger>
          <TabsTrigger value="backgrounds">Backgrounds</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="display" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Glass Effect</CardTitle>
              <CardDescription>Enable translucent glass effect on cards and UI elements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Enable Glass Effect</Label>
                <Button
                  variant={config.glassEffect.enabled ? "default" : "outline"}
                  size="sm"
                  onClick={async () => {
                    const updatedConfig = {
                      ...config,
                      glassEffect: {
                        ...config.glassEffect,
                        enabled: !config.glassEffect.enabled,
                      },
                    };
                    await saveConfig(updatedConfig);
                  }}
                >
                  {config.glassEffect.enabled ? "Enabled" : "Disabled"}
                </Button>
              </div>

              {config.glassEffect.enabled && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Default Intensity</Label>
                    <span className="text-sm text-muted-foreground">{config.glassEffect.defaultIntensity}%</span>
                  </div>
                  <Slider
                    value={[config.glassEffect.defaultIntensity]}
                    onValueChange={async ([value]) => {
                      const updatedConfig = {
                        ...config,
                        glassEffect: {
                          ...config.glassEffect,
                          defaultIntensity: value,
                        },
                      };
                      await saveConfig(updatedConfig);
                    }}
                    min={0}
                    max={100}
                    step={5}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Card Styling</CardTitle>
              <CardDescription>Customize the appearance of cards</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Card Radius</Label>
                  <span className="text-sm text-muted-foreground">{config.cardRadius}px</span>
                </div>
                <Slider
                  value={[config.cardRadius]}
                  onValueChange={async ([value]) => {
                    const updatedConfig = {
                      ...config,
                      cardRadius: value,
                    };
                    await saveConfig(updatedConfig);
                  }}
                  min={0}
                  max={24}
                  step={2}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Navigation Bar Style</CardTitle>
              <CardDescription>Choose the style for the navigation bar</CardDescription>
            </CardHeader>
            <CardContent>
              <Select
                value={config.navBarStyle}
                onValueChange={async (value: 'solid' | 'translucent') => {
                  const updatedConfig = {
                    ...config,
                    navBarStyle: value,
                  };
                  await saveConfig(updatedConfig);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solid">Solid</SelectItem>
                  <SelectItem value="translucent">Translucent</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backgrounds" className="space-y-4 pt-4">
          <Tabs defaultValue="app" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="app">App Background</TabsTrigger>
              <TabsTrigger value="home">Login Background</TabsTrigger>
            </TabsList>

            {(['app', 'home'] as const).map((target) => (
              <TabsContent key={target} value={target} className="space-y-4 pt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Opacity</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {target === 'app' ? config.appBackground.opacity : config.homeBackground.opacity}%
                      </span>
                    </div>
                    <Slider
                      value={[target === 'app' ? config.appBackground.opacity : config.homeBackground.opacity]}
                      onValueChange={async ([value]) => {
                        const updatedConfig = { ...config };
                        if (target === 'app') {
                          updatedConfig.appBackground = { ...updatedConfig.appBackground, opacity: value };
                        } else {
                          updatedConfig.homeBackground = { ...updatedConfig.homeBackground, opacity: value };
                        }
                        await saveConfig(updatedConfig);
                      }}
                      min={0}
                      max={100}
                      step={5}
                    />
                  </CardContent>
                </Card>

                {availableImages.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <ImageIcon className="h-4 w-4" />
                        Previously Uploaded Images
                      </CardTitle>
                      <CardDescription>Select from existing backgrounds</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-2">
                        {availableImages.map((image) => {
                          const isActive = (target === 'app' && config.appBackground.url === image.url) ||
                                         (target === 'home' && config.homeBackground.url === image.url);
                          return (
                            <button
                              key={image.name}
                              onClick={() => handleSelectExistingImage(image.url, target)}
                              className={`relative rounded-md overflow-hidden border-2 transition-all hover:scale-105 ${
                                isActive ? 'border-primary ring-2 ring-primary' : 'border-border'
                              }`}
                            >
                              <img
                                src={image.url}
                                alt={image.name}
                                className="w-full h-20 object-cover"
                              />
                              {isActive && (
                                <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                  <span className="text-xs font-medium text-primary-foreground bg-primary px-2 py-1 rounded">Active</span>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Upload className="h-4 w-4" />
                      Upload New Image
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {((target === 'app' && config.appBackground.type === 'uploaded' && config.appBackground.url) ||
                      (target === 'home' && config.homeBackground.type === 'uploaded' && config.homeBackground.url)) && (
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Current Background</Label>
                        <div className="rounded-md border border-border overflow-hidden">
                          <img
                            src={target === 'app' ? config.appBackground.url! : config.homeBackground.url!}
                            alt="Current background"
                            className="w-full h-24 object-cover"
                          />
                        </div>
                      </div>
                    )}
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleBackgroundUpload(e, target)}
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
                      <Button onClick={() => handleGenerateBackground(target)} disabled={generating}>
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
                        defaultValue={
                          target === 'app' 
                            ? (config.appBackground.color || '#0066cc')
                            : (config.homeBackground.color || '#0066cc')
                        }
                        onChange={(e) => handleColorBackground(e.target.value, target)}
                        className="w-16 h-9"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Gradient</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        defaultValue={
                          target === 'app'
                            ? (config.appBackground.gradientStart || '#0066cc')
                            : (config.homeBackground.gradientStart || '#0066cc')
                        }
                        onBlur={(e) => {
                          const end = target === 'app'
                            ? (config.appBackground.gradientEnd || '#00ccff')
                            : (config.homeBackground.gradientEnd || '#00ccff');
                          handleGradientBackground(e.target.value, end, target);
                        }}
                        className="w-16 h-9"
                      />
                      <Input
                        type="color"
                        defaultValue={
                          target === 'app'
                            ? (config.appBackground.gradientEnd || '#00ccff')
                            : (config.homeBackground.gradientEnd || '#00ccff')
                        }
                        onBlur={(e) => {
                          const start = target === 'app'
                            ? (config.appBackground.gradientStart || '#0066cc')
                            : (config.homeBackground.gradientStart || '#0066cc');
                          handleGradientBackground(start, e.target.value, target);
                        }}
                        className="w-16 h-9"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Button
                  variant="outline"
                  onClick={() => handleResetBackground(target)}
                  className="w-full"
                >
                  Reset to Default
                </Button>
              </TabsContent>
            ))}
          </Tabs>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Color System</CardTitle>
              <CardDescription>
                Advanced color customization coming soon. Currently using default HSL color palette.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                The mobile app uses a semantic HSL color system that adapts to light and dark modes automatically.
                Custom color editing will be available in a future update.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
