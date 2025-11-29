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
import { BackgroundImageDialog } from "./BackgroundImageDialog";

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
  navBarOpacity: number;
  navBarColor: string;
  headerStyle: 'solid' | 'translucent';
  headerOpacity: number;
  headerColor: string;
  headerTitleFont: 'system' | 'Outfit' | 'Merriweather';
  headerTitleSize: 'text-lg' | 'text-xl' | 'text-2xl' | 'text-3xl';
  headerTitleWeight: 'normal' | 'medium' | 'semibold' | 'bold';
  headerTitleColor: string;
  headerSubtitleFont: 'system' | 'Outfit' | 'Merriweather';
  headerSubtitleSize: 'text-xs' | 'text-sm' | 'text-base';
  headerSubtitleWeight: 'normal' | 'medium' | 'semibold';
  headerSubtitleColor: string;
}

// Legacy export - kept for backwards compatibility but not recommended
export function MobileThemeConfig() {
  return <MobileDisplaySettings />;
}

// Display Settings Component
export function MobileDisplaySettings() {
  const { config, saveConfig } = useMobileThemeConfig();
  
  if (!config) {
    return <div className="text-center py-8 text-muted-foreground">Loading display settings...</div>;
  }

  return (
    <div className="space-y-4">
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
            <CardContent className="space-y-4">
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

              {config.navBarStyle === 'translucent' ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Opacity</Label>
                    <span className="text-sm text-muted-foreground">{config.navBarOpacity}%</span>
                  </div>
                  <Slider
                    value={[config.navBarOpacity]}
                    onValueChange={async ([value]) => {
                      const updatedConfig = {
                        ...config,
                        navBarOpacity: value,
                      };
                      await saveConfig(updatedConfig);
                    }}
                    min={0}
                    max={100}
                    step={5}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Background Color</Label>
                  <Input
                    type="color"
                    value={config.navBarColor}
                    onChange={async (e) => {
                      const updatedConfig = {
                        ...config,
                        navBarColor: e.target.value,
                      };
                      await saveConfig(updatedConfig);
                    }}
                    className="w-full h-10"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Header Style</CardTitle>
              <CardDescription>Customize the header background</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                value={config.headerStyle}
                onValueChange={async (value: 'solid' | 'translucent') => {
                  const updatedConfig = {
                    ...config,
                    headerStyle: value,
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

              {config.headerStyle === 'translucent' ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Opacity</Label>
                    <span className="text-sm text-muted-foreground">{config.headerOpacity}%</span>
                  </div>
                  <Slider
                    value={[config.headerOpacity]}
                    onValueChange={async ([value]) => {
                      const updatedConfig = {
                        ...config,
                        headerOpacity: value,
                      };
                      await saveConfig(updatedConfig);
                    }}
                    min={0}
                    max={100}
                    step={5}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Background Color</Label>
                  <Input
                    type="color"
                    value={config.headerColor}
                    onChange={async (e) => {
                      const updatedConfig = {
                        ...config,
                        headerColor: e.target.value,
                      };
                      await saveConfig(updatedConfig);
                    }}
                    className="w-full h-10"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Header Title</CardTitle>
              <CardDescription>Customize the header title appearance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Font</Label>
                  <Select
                    value={config.headerTitleFont}
                    onValueChange={async (value: 'system' | 'Outfit' | 'Merriweather') => {
                      const updatedConfig = {
                        ...config,
                        headerTitleFont: value,
                      };
                      await saveConfig(updatedConfig);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="system">System</SelectItem>
                      <SelectItem value="Outfit">Outfit</SelectItem>
                      <SelectItem value="Merriweather">Merriweather</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Weight</Label>
                  <Select
                    value={config.headerTitleWeight}
                    onValueChange={async (value: 'normal' | 'medium' | 'semibold' | 'bold') => {
                      const updatedConfig = {
                        ...config,
                        headerTitleWeight: value,
                      };
                      await saveConfig(updatedConfig);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="semibold">Semibold</SelectItem>
                      <SelectItem value="bold">Bold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Size</Label>
                <Select
                  value={config.headerTitleSize}
                  onValueChange={async (value: 'text-lg' | 'text-xl' | 'text-2xl' | 'text-3xl') => {
                    const updatedConfig = {
                      ...config,
                      headerTitleSize: value,
                    };
                    await saveConfig(updatedConfig);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text-lg">Large (18px)</SelectItem>
                    <SelectItem value="text-xl">X-Large (20px)</SelectItem>
                    <SelectItem value="text-2xl">2X-Large (24px)</SelectItem>
                    <SelectItem value="text-3xl">3X-Large (30px)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Text Color</Label>
                <Input
                  type="color"
                  value={config.headerTitleColor}
                  onBlur={async (e) => {
                    const updatedConfig = {
                      ...config,
                      headerTitleColor: e.target.value,
                    };
                    await saveConfig(updatedConfig);
                  }}
                  className="w-full h-10"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Header Subtitle</CardTitle>
              <CardDescription>Customize the header subtitle appearance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Font</Label>
                  <Select
                    value={config.headerSubtitleFont}
                    onValueChange={async (value: 'system' | 'Outfit' | 'Merriweather') => {
                      const updatedConfig = {
                        ...config,
                        headerSubtitleFont: value,
                      };
                      await saveConfig(updatedConfig);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="system">System</SelectItem>
                      <SelectItem value="Outfit">Outfit</SelectItem>
                      <SelectItem value="Merriweather">Merriweather</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Weight</Label>
                  <Select
                    value={config.headerSubtitleWeight}
                    onValueChange={async (value: 'normal' | 'medium' | 'semibold') => {
                      const updatedConfig = {
                        ...config,
                        headerSubtitleWeight: value,
                      };
                      await saveConfig(updatedConfig);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="semibold">Semibold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Size</Label>
                <Select
                  value={config.headerSubtitleSize}
                  onValueChange={async (value: 'text-xs' | 'text-sm' | 'text-base') => {
                    const updatedConfig = {
                      ...config,
                      headerSubtitleSize: value,
                    };
                    await saveConfig(updatedConfig);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text-xs">X-Small (12px)</SelectItem>
                    <SelectItem value="text-sm">Small (14px)</SelectItem>
                    <SelectItem value="text-base">Base (16px)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Text Color</Label>
                <Input
                  type="color"
                  value={config.headerSubtitleColor}
                  onBlur={async (e) => {
                    const updatedConfig = {
                      ...config,
                      headerSubtitleColor: e.target.value,
                    };
                    await saveConfig(updatedConfig);
                  }}
                  className="w-full h-10"
                />
              </div>
            </CardContent>
          </Card>
    </div>
  );
}

// Background Settings Component
export function MobileBackgroundSettings() {
  const { config, uploading, generating, aiPrompt, setAiPrompt, availableImages, saveConfig, handleBackgroundUpload, handleGenerateBackground, handleColorBackground, handleGradientBackground, handleResetBackground, handleSelectExistingImage } = useMobileThemeConfig();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentTarget, setCurrentTarget] = useState<'app' | 'home'>('app');
  
  if (!config) {
    return <div className="text-center py-8 text-muted-foreground">Loading background settings...</div>;
  }

  const openImageDialog = (target: 'app' | 'home') => {
    setCurrentTarget(target);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <BackgroundImageDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        images={availableImages}
        activeUrl={currentTarget === 'app' ? config.appBackground.url : config.homeBackground.url}
        onSelect={(url) => handleSelectExistingImage(url, currentTarget)}
      />
      
      <Tabs defaultValue="app" className="w-full">
            <TabsList className="w-full h-auto flex-wrap justify-start gap-1 p-1 md:grid md:grid-cols-2">
              <TabsTrigger value="app" className="flex-1 min-w-[140px]">App Background</TabsTrigger>
              <TabsTrigger value="home" className="flex-1 min-w-[140px]">Login Background</TabsTrigger>
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
                      onClick={() => openImageDialog(target)}
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
    </div>
  );
}

// Color Settings Component
export function MobileColorSettings() {
  const { config: globalConfig, saving, saveConfig } = useMobileThemeConfig();
  const [config, setConfig] = useState(globalConfig);

  // Update local state when global config changes
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

// Custom hook to share state across components
function useMobileThemeConfig() {
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

      // Only show actual background images, exclude header icons, logos, and avatars
      const imageFiles = (data || [])
        .filter(file => {
          const name = file.name.toLowerCase();
          return (
            name.match(/\.(jpg|jpeg|png|gif|webp)$/i) &&
            name.includes('background') &&
            !name.includes('header') &&
            !name.includes('icon') &&
            !name.includes('logo') &&
            !name.includes('avatar')
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
      const filePath = target === 'app' 
        ? 'mobile-app-background.png' 
        : 'mobile-login-background.png';

      await supabase.storage.from('avatars').remove([filePath]);

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      fetchAvailableImages();

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

      const response = await fetch(data.imageUrl);
      const blob = await response.blob();

      const filePath = target === 'app' 
        ? 'mobile-app-background.png' 
        : 'mobile-login-background.png';

      await supabase.storage.from('avatars').remove([filePath]);

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob, { upsert: true, contentType: 'image/png' });

      if (uploadError) throw uploadError;

      fetchAvailableImages();

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

  return { config, saving, uploading, generating, aiPrompt, setAiPrompt, availableImages, saveConfig, handleBackgroundUpload, handleGenerateBackground, handleColorBackground, handleGradientBackground, handleResetBackground, handleSelectExistingImage };
}
