import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload, Wand2, Palette, Smartphone, Image as ImageIcon, RotateCcw, Sun, Moon } from "lucide-react";
import { BackgroundImageDialog } from "./BackgroundImageDialog";
import { StickyActionBar } from "@/components/ui/sticky-action-bar";

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
    color?: string; // Legacy single value
    colorLight?: string;
    colorDark?: string;
    gradientStart?: string;
    gradientEnd?: string;
    gradientDirection?: string;
  };
  homeBackground: {
    type: 'default' | 'uploaded' | 'generated' | 'color' | 'gradient';
    url: string | null;
    opacity: number;
    color?: string; // Legacy single value
    colorLight?: string;
    colorDark?: string;
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
  navBarColor: string; // Legacy single value
  navBar?: {
    light: { color: string };
    dark: { color: string };
  };
  headerStyle: 'solid' | 'translucent';
  headerOpacity: number;
  headerColor: string; // Legacy single value
  header?: {
    light: { color: string; titleColor: string; subtitleColor: string };
    dark: { color: string; titleColor: string; subtitleColor: string };
  };
  headerTitleFont: 'system' | 'Outfit' | 'Merriweather';
  headerTitleSize: 'text-lg' | 'text-xl' | 'text-2xl' | 'text-3xl';
  headerTitleWeight: 'normal' | 'medium' | 'semibold' | 'bold';
  headerTitleColor: string; // Legacy single value
  headerSubtitleFont: 'system' | 'Outfit' | 'Merriweather';
  headerSubtitleSize: 'text-xs' | 'text-sm' | 'text-base';
  headerSubtitleWeight: 'normal' | 'medium' | 'semibold';
  headerSubtitleColor: string; // Legacy single value
  usePageHeaderLogos?: boolean;
}

// Legacy export - kept for backwards compatibility but not recommended
export function MobileThemeConfig() {
  return <MobileDisplaySettings />;
}

// Helper component for light/dark color picker pair
function LightDarkColorPicker({
  label,
  lightValue,
  darkValue,
  onLightChange,
  onDarkChange,
}: {
  label: string;
  lightValue: string;
  darkValue: string;
  onLightChange: (value: string) => Promise<void>;
  onDarkChange: (value: string) => Promise<void>;
}) {
  const [localLightValue, setLocalLightValue] = useState(lightValue);
  const [localDarkValue, setLocalDarkValue] = useState(darkValue);

  useEffect(() => {
    setLocalLightValue(lightValue);
    setLocalDarkValue(darkValue);
  }, [lightValue, darkValue]);

  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sun className="h-4 w-4" />
            <span>Light Mode</span>
          </div>
          <div className="flex gap-2">
            <Input
              type="color"
              value={localLightValue}
              onChange={(e) => setLocalLightValue(e.target.value)}
              onBlur={async (e) => {
                await onLightChange(e.target.value);
              }}
              className="w-12 h-10 p-1 cursor-pointer"
            />
            <Input
              type="text"
              value={localLightValue}
              onChange={(e) => setLocalLightValue(e.target.value)}
              onBlur={async (e) => {
                const value = e.target.value.trim();
                if (value && value.match(/^#[0-9A-Fa-f]{3,6}$/)) {
                  await onLightChange(value);
                } else {
                  setLocalLightValue(lightValue);
                }
              }}
              placeholder="#ffffff"
              className="flex-1 font-mono text-sm"
            />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Moon className="h-4 w-4" />
            <span>Dark Mode</span>
          </div>
          <div className="flex gap-2">
            <Input
              type="color"
              value={localDarkValue}
              onChange={(e) => setLocalDarkValue(e.target.value)}
              onBlur={async (e) => {
                await onDarkChange(e.target.value);
              }}
              className="w-12 h-10 p-1 cursor-pointer"
            />
            <Input
              type="text"
              value={localDarkValue}
              onChange={(e) => setLocalDarkValue(e.target.value)}
              onBlur={async (e) => {
                const value = e.target.value.trim();
                if (value && value.match(/^#[0-9A-Fa-f]{3,6}$/)) {
                  await onDarkChange(value);
                } else {
                  setLocalDarkValue(darkValue);
                }
              }}
              placeholder="#000000"
              className="flex-1 font-mono text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Display Settings Component
export function MobileDisplaySettings() {
  const { config, saveConfig } = useMobileThemeConfig();
  
  // Local state for sliders (to avoid saving on every drag)
  const [localGlassIntensity, setLocalGlassIntensity] = useState<number | null>(null);
  const [localCardRadius, setLocalCardRadius] = useState<number | null>(null);
  const [localNavBarOpacity, setLocalNavBarOpacity] = useState<number | null>(null);
  const [localHeaderOpacity, setLocalHeaderOpacity] = useState<number | null>(null);

  // Sync local state with config when config loads
  useEffect(() => {
    if (config) {
      setLocalGlassIntensity(config.glassEffect.defaultIntensity);
      setLocalCardRadius(config.cardRadius);
      setLocalNavBarOpacity(config.navBarOpacity);
      setLocalHeaderOpacity(config.headerOpacity);
    }
  }, [config]);
  
  // Initialize light/dark values from config
  const getNavBarColors = () => ({
    light: config?.navBar?.light?.color || '#FFFFFF',
    dark: config?.navBar?.dark?.color || config?.navBarColor || '#000000',
  });
  
  const getHeaderColors = () => ({
    light: config?.header?.light?.color || config?.headerColor || '#FFFFFF',
    dark: config?.header?.dark?.color || '#1F2937',
  });
  
  const getTitleColors = () => ({
    light: config?.header?.light?.titleColor || config?.headerTitleColor || '#1F2937',
    dark: config?.header?.dark?.titleColor || '#F9FAFB',
  });
  
  const getSubtitleColors = () => ({
    light: config?.header?.light?.subtitleColor || config?.headerSubtitleColor || '#4B5563',
    dark: config?.header?.dark?.subtitleColor || '#9CA3AF',
  });
  
  if (!config) {
    return <div className="text-center py-8 text-muted-foreground">Loading display settings...</div>;
  }

  // Check if sliders have unsaved changes
  const hasSliderChanges = () => {
    return (
      localGlassIntensity !== config.glassEffect.defaultIntensity ||
      localCardRadius !== config.cardRadius ||
      localNavBarOpacity !== config.navBarOpacity ||
      localHeaderOpacity !== config.headerOpacity
    );
  };

  const saveSliderChanges = async () => {
    const updatedConfig = {
      ...config,
      glassEffect: {
        ...config.glassEffect,
        defaultIntensity: localGlassIntensity ?? config.glassEffect.defaultIntensity,
      },
      cardRadius: localCardRadius ?? config.cardRadius,
      navBarOpacity: localNavBarOpacity ?? config.navBarOpacity,
      headerOpacity: localHeaderOpacity ?? config.headerOpacity,
    };
    await saveConfig(updatedConfig);
  };

  const discardSliderChanges = () => {
    setLocalGlassIntensity(config.glassEffect.defaultIntensity);
    setLocalCardRadius(config.cardRadius);
    setLocalNavBarOpacity(config.navBarOpacity);
    setLocalHeaderOpacity(config.headerOpacity);
  };

  const updateNavBarColor = async (mode: 'light' | 'dark', value: string) => {
    const navBar = {
      light: { color: mode === 'light' ? value : getNavBarColors().light },
      dark: { color: mode === 'dark' ? value : getNavBarColors().dark },
    };
    await saveConfig({ ...config, navBar, navBarColor: navBar.dark.color });
  };

  const updateHeaderColor = async (mode: 'light' | 'dark', value: string) => {
    const current = {
      light: { 
        color: config?.header?.light?.color || '#FFFFFF',
        titleColor: config?.header?.light?.titleColor || config?.headerTitleColor || '#1F2937',
        subtitleColor: config?.header?.light?.subtitleColor || config?.headerSubtitleColor || '#4B5563',
      },
      dark: { 
        color: config?.header?.dark?.color || '#1F2937',
        titleColor: config?.header?.dark?.titleColor || '#F9FAFB',
        subtitleColor: config?.header?.dark?.subtitleColor || '#9CA3AF',
      },
    };
    const header = {
      light: { ...current.light, color: mode === 'light' ? value : current.light.color },
      dark: { ...current.dark, color: mode === 'dark' ? value : current.dark.color },
    };
    await saveConfig({ ...config, header, headerColor: header.light.color });
  };

  const updateTitleColor = async (mode: 'light' | 'dark', value: string) => {
    const current = {
      light: { 
        color: config?.header?.light?.color || config?.headerColor || '#FFFFFF',
        titleColor: config?.header?.light?.titleColor || config?.headerTitleColor || '#1F2937',
        subtitleColor: config?.header?.light?.subtitleColor || config?.headerSubtitleColor || '#4B5563',
      },
      dark: { 
        color: config?.header?.dark?.color || '#1F2937',
        titleColor: config?.header?.dark?.titleColor || '#F9FAFB',
        subtitleColor: config?.header?.dark?.subtitleColor || '#9CA3AF',
      },
    };
    const header = {
      light: { ...current.light, titleColor: mode === 'light' ? value : current.light.titleColor },
      dark: { ...current.dark, titleColor: mode === 'dark' ? value : current.dark.titleColor },
    };
    await saveConfig({ ...config, header, headerTitleColor: header.light.titleColor });
  };

  const updateSubtitleColor = async (mode: 'light' | 'dark', value: string) => {
    const current = {
      light: { 
        color: config?.header?.light?.color || config?.headerColor || '#FFFFFF',
        titleColor: config?.header?.light?.titleColor || config?.headerTitleColor || '#1F2937',
        subtitleColor: config?.header?.light?.subtitleColor || config?.headerSubtitleColor || '#4B5563',
      },
      dark: { 
        color: config?.header?.dark?.color || '#1F2937',
        titleColor: config?.header?.dark?.titleColor || '#F9FAFB',
        subtitleColor: config?.header?.dark?.subtitleColor || '#9CA3AF',
      },
    };
    const header = {
      light: { ...current.light, subtitleColor: mode === 'light' ? value : current.light.subtitleColor },
      dark: { ...current.dark, subtitleColor: mode === 'dark' ? value : current.dark.subtitleColor },
    };
    await saveConfig({ ...config, header, headerSubtitleColor: header.light.subtitleColor });
  };

  return (
    <>
      <div className="space-y-4 pb-20">
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
                    <span className="text-sm text-muted-foreground">{localGlassIntensity ?? config.glassEffect.defaultIntensity}%</span>
                  </div>
                  <Slider
                    value={[localGlassIntensity ?? config.glassEffect.defaultIntensity]}
                    onValueChange={([value]) => setLocalGlassIntensity(value)}
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
                  <span className="text-sm text-muted-foreground">{localCardRadius ?? config.cardRadius}px</span>
                </div>
                <Slider
                  value={[localCardRadius ?? config.cardRadius]}
                  onValueChange={([value]) => setLocalCardRadius(value)}
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

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Opacity</Label>
                  <span className="text-sm text-muted-foreground">{localNavBarOpacity ?? config.navBarOpacity}%</span>
                </div>
                <Slider
                  value={[localNavBarOpacity ?? config.navBarOpacity]}
                  onValueChange={([value]) => setLocalNavBarOpacity(value)}
                  min={0}
                  max={100}
                  step={5}
                />
              </div>

              {config.navBarStyle === 'solid' && (
                <LightDarkColorPicker
                  label="Background Color"
                  lightValue={getNavBarColors().light}
                  darkValue={getNavBarColors().dark}
                  onLightChange={(value) => updateNavBarColor('light', value)}
                  onDarkChange={(value) => updateNavBarColor('dark', value)}
                />
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

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Opacity</Label>
                  <span className="text-sm text-muted-foreground">{localHeaderOpacity ?? config.headerOpacity}%</span>
                </div>
                <Slider
                  value={[localHeaderOpacity ?? config.headerOpacity]}
                  onValueChange={([value]) => setLocalHeaderOpacity(value)}
                  min={0}
                  max={100}
                  step={5}
                />
              </div>

              {config.headerStyle === 'solid' && (
                <LightDarkColorPicker
                  label="Background Color"
                  lightValue={getHeaderColors().light}
                  darkValue={getHeaderColors().dark}
                  onLightChange={(value) => updateHeaderColor('light', value)}
                  onDarkChange={(value) => updateHeaderColor('dark', value)}
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Page Header Logos</CardTitle>
              <CardDescription>Show page-specific header logos in the app header</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Label htmlFor="use-page-logos">Use Page Header Logos</Label>
                <Button
                  variant={(config.usePageHeaderLogos ?? true) ? "default" : "outline"}
                  size="sm"
                  onClick={async () => {
                    const updatedConfig = {
                      ...config,
                      usePageHeaderLogos: !(config.usePageHeaderLogos ?? true),
                    };
                    await saveConfig(updatedConfig);
                  }}
                >
                  {(config.usePageHeaderLogos ?? true) ? "Enabled" : "Disabled"}
                </Button>
              </div>
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

              <LightDarkColorPicker
                label="Text Color"
                lightValue={getTitleColors().light}
                darkValue={getTitleColors().dark}
                onLightChange={(value) => updateTitleColor('light', value)}
                onDarkChange={(value) => updateTitleColor('dark', value)}
              />
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

              <LightDarkColorPicker
                label="Text Color"
                lightValue={getSubtitleColors().light}
                darkValue={getSubtitleColors().dark}
                onLightChange={(value) => updateSubtitleColor('light', value)}
                onDarkChange={(value) => updateSubtitleColor('dark', value)}
              />
            </CardContent>
          </Card>
      </div>

      <StickyActionBar
        hasChanges={hasSliderChanges()}
        onSave={saveSliderChanges}
        onDiscard={discardSliderChanges}
        autoDismissOnSuccess
      />
    </>
  );
}

// Background Settings Component
export function MobileBackgroundSettings() {
  const { config, uploading, generating, aiPrompt, setAiPrompt, availableImages, saveConfig, handleBackgroundUpload, handleGenerateBackground, handleColorBackground, handleGradientBackground, handleResetBackground, handleSelectExistingImage } = useMobileThemeConfig();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentTarget, setCurrentTarget] = useState<'app' | 'home'>('app');
  const [localGradientStart, setLocalGradientStart] = useState("");
  const [localGradientEnd, setLocalGradientEnd] = useState("");
  
  // Helper to get solid colors for a target
  const getSolidColors = (target: 'app' | 'home') => {
    const bg = target === 'app' ? config?.appBackground : config?.homeBackground;
    return {
      light: bg?.colorLight || bg?.color || '#0066cc',
      dark: bg?.colorDark || bg?.color || '#003366',
    };
  };
  
  useEffect(() => {
    if (config) {
      const target = currentTarget;
      setLocalGradientStart(
        target === 'app'
          ? (config.appBackground.gradientStart || '#0066cc')
          : (config.homeBackground.gradientStart || '#0066cc')
      );
      setLocalGradientEnd(
        target === 'app'
          ? (config.appBackground.gradientEnd || '#00ccff')
          : (config.homeBackground.gradientEnd || '#00ccff')
      );
    }
  }, [config, currentTarget]);
  
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
                    <CardDescription>Choose different colors for light and dark mode</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <LightDarkColorPicker
                      label="Background Color"
                      lightValue={getSolidColors(target).light}
                      darkValue={getSolidColors(target).dark}
                      onLightChange={(value) => handleColorBackground(value, target, 'light')}
                      onDarkChange={(value) => handleColorBackground(value, target, 'dark')}
                    />
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
                          value={localGradientStart}
                          onChange={(e) => setLocalGradientStart(e.target.value)}
                          className="w-16 h-9 p-1 cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={localGradientStart}
                          onChange={(e) => setLocalGradientStart(e.target.value)}
                          onBlur={(e) => {
                            const value = e.target.value.trim();
                            if (value && value.match(/^#[0-9A-Fa-f]{3,6}$/)) {
                              handleGradientBackground(value, localGradientEnd, target);
                            } else {
                              setLocalGradientStart(
                                target === 'app'
                                  ? (config.appBackground.gradientStart || '#0066cc')
                                  : (config.homeBackground.gradientStart || '#0066cc')
                              );
                            }
                          }}
                          placeholder="#0066cc"
                          className="flex-1 font-mono text-sm"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={localGradientEnd}
                          onChange={(e) => setLocalGradientEnd(e.target.value)}
                          className="w-16 h-9 p-1 cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={localGradientEnd}
                          onChange={(e) => setLocalGradientEnd(e.target.value)}
                          onBlur={(e) => {
                            const value = e.target.value.trim();
                            if (value && value.match(/^#[0-9A-Fa-f]{3,6}$/)) {
                              handleGradientBackground(localGradientStart, value, target);
                            } else {
                              setLocalGradientEnd(
                                target === 'app'
                                  ? (config.appBackground.gradientEnd || '#00ccff')
                                  : (config.homeBackground.gradientEnd || '#00ccff')
                              );
                            }
                          }}
                          placeholder="#00ccff"
                          className="flex-1 font-mono text-sm"
                        />
                      </div>
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
// Default colors from the edge function for reset functionality
const DEFAULT_COLORS = {
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
};

// Color groups for organized display
const COLOR_GROUPS = [
  {
    id: 'base',
    name: 'Base Colors',
    description: 'Main background and text colors',
    colors: [
      { key: 'background', label: 'Background' },
      { key: 'foreground', label: 'Foreground (Text)' },
    ],
  },
  {
    id: 'card',
    name: 'Card Colors',
    description: 'Card backgrounds and text',
    colors: [
      { key: 'card', label: 'Card Background' },
      { key: 'cardForeground', label: 'Card Text' },
    ],
  },
  {
    id: 'primary',
    name: 'Primary Colors',
    description: 'Buttons and interactive elements',
    colors: [
      { key: 'primary', label: 'Primary' },
      { key: 'primaryForeground', label: 'Primary Text' },
    ],
  },
  {
    id: 'secondary',
    name: 'Secondary Colors',
    description: 'Secondary buttons and elements',
    colors: [
      { key: 'secondary', label: 'Secondary' },
      { key: 'secondaryForeground', label: 'Secondary Text' },
    ],
  },
  {
    id: 'muted',
    name: 'Muted Colors',
    description: 'Subtle backgrounds and helper text',
    colors: [
      { key: 'muted', label: 'Muted Background' },
      { key: 'mutedForeground', label: 'Muted Text' },
    ],
  },
  {
    id: 'accent',
    name: 'Accent Colors',
    description: 'Highlights and accents',
    colors: [
      { key: 'accent', label: 'Accent' },
      { key: 'accentForeground', label: 'Accent Text' },
    ],
  },
  {
    id: 'destructive',
    name: 'Destructive Colors',
    description: 'Error states and delete actions',
    colors: [
      { key: 'destructive', label: 'Destructive' },
      { key: 'destructiveForeground', label: 'Destructive Text' },
    ],
  },
  {
    id: 'ui',
    name: 'UI Elements',
    description: 'Borders, inputs, and focus rings',
    colors: [
      { key: 'border', label: 'Border' },
      { key: 'input', label: 'Input Border' },
      { key: 'ring', label: 'Focus Ring' },
    ],
  },
];

interface ColorPickerRowProps {
  label: string;
  lightValue: string;
  darkValue: string;
  onLightChange: (hsl: string) => void;
  onDarkChange: (hsl: string) => void;
}

function ColorPickerRow({ label, lightValue, darkValue, onLightChange, onDarkChange }: ColorPickerRowProps) {
  const [localLightHex, setLocalLightHex] = useState(`#${hslToHex(lightValue)}`);
  const [localDarkHex, setLocalDarkHex] = useState(`#${hslToHex(darkValue)}`);

  useEffect(() => {
    setLocalLightHex(`#${hslToHex(lightValue)}`);
  }, [lightValue]);

  useEffect(() => {
    setLocalDarkHex(`#${hslToHex(darkValue)}`);
  }, [darkValue]);

  return (
    <div className="space-y-2">
      <Label className="text-sm">{label}</Label>
      <div className="grid grid-cols-2 gap-4">
        {/* Light Mode */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Sun className="h-3 w-3" />
            Light
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="color"
              value={localLightHex}
              onChange={(e) => {
                setLocalLightHex(e.target.value);
                const hsl = hexToHsl(e.target.value);
                onLightChange(hsl);
              }}
              className="w-10 h-8 p-0.5 cursor-pointer"
            />
            <Input
              type="text"
              value={localLightHex}
              onChange={(e) => {
                setLocalLightHex(e.target.value);
                const value = e.target.value.trim();
                if (value.match(/^#[0-9A-Fa-f]{6}$/)) {
                  const hsl = hexToHsl(value);
                  onLightChange(hsl);
                }
              }}
              placeholder="#000000"
              className="flex-1 font-mono text-xs h-8"
            />
          </div>
        </div>
        {/* Dark Mode */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Moon className="h-3 w-3" />
            Dark
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="color"
              value={localDarkHex}
              onChange={(e) => {
                setLocalDarkHex(e.target.value);
                const hsl = hexToHsl(e.target.value);
                onDarkChange(hsl);
              }}
              className="w-10 h-8 p-0.5 cursor-pointer"
            />
            <Input
              type="text"
              value={localDarkHex}
              onChange={(e) => {
                setLocalDarkHex(e.target.value);
                const value = e.target.value.trim();
                if (value.match(/^#[0-9A-Fa-f]{6}$/)) {
                  const hsl = hexToHsl(value);
                  onDarkChange(hsl);
                }
              }}
              placeholder="#ffffff"
              className="flex-1 font-mono text-xs h-8"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function MobileColorSettings() {
  const { config: globalConfig, saving, saveConfig } = useMobileThemeConfig();
  const [config, setConfig] = useState(globalConfig);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (globalConfig) {
      setConfig(globalConfig);
      setHasChanges(false);
    }
  }, [globalConfig]);

  if (!config) {
    return <div className="text-center py-8 text-muted-foreground">Loading color settings...</div>;
  }

  const handleColorChange = (mode: 'light' | 'dark', key: string, hsl: string) => {
    const updatedConfig = {
      ...config,
      colors: {
        ...config.colors,
        [mode]: {
          ...config.colors[mode],
          [key]: hsl,
        },
      },
    };
    setConfig(updatedConfig);
    setHasChanges(true);
  };

  const handleResetGroup = (groupId: string) => {
    const group = COLOR_GROUPS.find(g => g.id === groupId);
    if (!group) return;

    const updatedConfig = { ...config };
    group.colors.forEach(({ key }) => {
      updatedConfig.colors.light[key] = DEFAULT_COLORS.light[key as keyof typeof DEFAULT_COLORS.light];
      updatedConfig.colors.dark[key] = DEFAULT_COLORS.dark[key as keyof typeof DEFAULT_COLORS.dark];
    });
    setConfig(updatedConfig);
    setHasChanges(true);
  };

  const handleResetAll = () => {
    const updatedConfig = {
      ...config,
      colors: {
        light: { ...DEFAULT_COLORS.light },
        dark: { ...DEFAULT_COLORS.dark },
      },
    };
    setConfig(updatedConfig);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (config) {
      await saveConfig(config);
      setHasChanges(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Preview Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Color Preview</CardTitle>
          <CardDescription>Side-by-side preview of light and dark modes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {/* Light Preview */}
            <div 
              className="rounded-lg p-4 border"
              style={{ 
                backgroundColor: `hsl(${config.colors.light.background})`,
                borderColor: `hsl(${config.colors.light.border})`,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Sun className="h-4 w-4" style={{ color: `hsl(${config.colors.light.foreground})` }} />
                <span className="text-xs font-medium" style={{ color: `hsl(${config.colors.light.foreground})` }}>Light</span>
              </div>
              <div 
                className="rounded-md p-3 mb-2"
                style={{ 
                  backgroundColor: `hsl(${config.colors.light.card})`,
                  borderColor: `hsl(${config.colors.light.border})`,
                  borderWidth: '1px',
                }}
              >
                <p className="text-xs" style={{ color: `hsl(${config.colors.light.cardForeground})` }}>Card content</p>
              </div>
              <button 
                className="w-full rounded-md py-1.5 text-xs font-medium"
                style={{ 
                  backgroundColor: `hsl(${config.colors.light.primary})`,
                  color: `hsl(${config.colors.light.primaryForeground})`,
                }}
              >
                Primary Button
              </button>
            </div>
            {/* Dark Preview */}
            <div 
              className="rounded-lg p-4 border"
              style={{ 
                backgroundColor: `hsl(${config.colors.dark.background})`,
                borderColor: `hsl(${config.colors.dark.border})`,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Moon className="h-4 w-4" style={{ color: `hsl(${config.colors.dark.foreground})` }} />
                <span className="text-xs font-medium" style={{ color: `hsl(${config.colors.dark.foreground})` }}>Dark</span>
              </div>
              <div 
                className="rounded-md p-3 mb-2"
                style={{ 
                  backgroundColor: `hsl(${config.colors.dark.card})`,
                  borderColor: `hsl(${config.colors.dark.border})`,
                  borderWidth: '1px',
                }}
              >
                <p className="text-xs" style={{ color: `hsl(${config.colors.dark.cardForeground})` }}>Card content</p>
              </div>
              <button 
                className="w-full rounded-md py-1.5 text-xs font-medium"
                style={{ 
                  backgroundColor: `hsl(${config.colors.dark.primary})`,
                  color: `hsl(${config.colors.dark.primaryForeground})`,
                }}
              >
                Primary Button
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Color Groups */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Color Palette</CardTitle>
              <CardDescription>Customize all semantic colors for light and dark modes</CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleResetAll}
              className="gap-1"
            >
              <RotateCcw className="h-3 w-3" />
              Reset All
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <Accordion type="multiple" defaultValue={['base', 'primary']} className="w-full">
            {COLOR_GROUPS.map((group) => (
              <AccordionItem key={group.id} value={group.id}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {group.colors.slice(0, 2).map(({ key }) => (
                        <div
                          key={key}
                          className="w-4 h-4 rounded border"
                          style={{ backgroundColor: `hsl(${config.colors.light[key]})` }}
                        />
                      ))}
                    </div>
                    <span className="font-medium">{group.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">{group.description}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-4">
                  <div className="flex justify-end mb-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleResetGroup(group.id)}
                      className="h-7 text-xs gap-1"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Reset Group
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {group.colors.map(({ key, label }) => (
                      <ColorPickerRow
                        key={key}
                        label={label}
                        lightValue={config.colors.light[key] || DEFAULT_COLORS.light[key as keyof typeof DEFAULT_COLORS.light]}
                        darkValue={config.colors.dark[key] || DEFAULT_COLORS.dark[key as keyof typeof DEFAULT_COLORS.dark]}
                        onLightChange={(hsl) => handleColorChange('light', key, hsl)}
                        onDarkChange={(hsl) => handleColorChange('dark', key, hsl)}
                      />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={saving || !hasChanges}
        className="w-full"
      >
        {saving ? "Saving..." : hasChanges ? "Save Color Changes" : "No Changes"}
      </Button>
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
        const loadedConfig = data.setting_value as any as MobileThemeConfig;
        // Ensure usePageHeaderLogos defaults to true if not set
        if (loadedConfig.usePageHeaderLogos === undefined) {
          loadedConfig.usePageHeaderLogos = true;
        }
        setConfig(loadedConfig);
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

  const handleColorBackground = async (color: string, target: 'app' | 'home', mode: 'light' | 'dark') => {
    if (!config) return;

    const updatedConfig = { ...config };
    const currentBg = target === 'app' ? config.appBackground : config.homeBackground;
    
    // Get current colors, preserving existing values
    const currentLight = currentBg.colorLight || currentBg.color || '#0066cc';
    const currentDark = currentBg.colorDark || currentBg.color || '#003366';
    
    const newBackground = {
      ...currentBg,
      type: 'color' as const,
      url: null,
      colorLight: mode === 'light' ? color : currentLight,
      colorDark: mode === 'dark' ? color : currentDark,
      color: mode === 'light' ? color : currentLight, // Legacy: keep light as default
    };
    
    if (target === 'app') {
      updatedConfig.appBackground = newBackground;
    } else {
      updatedConfig.homeBackground = newBackground;
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
