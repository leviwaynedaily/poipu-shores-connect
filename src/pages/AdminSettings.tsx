import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Palette, Webcam, Phone, Users, Sparkles, Upload, Wand2, Image as ImageIcon } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { UserManagement } from "@/components/settings/UserManagement";
import { WebcamManagement } from "@/components/settings/WebcamManagement";
import { EmergencyContactManagement } from "@/components/settings/EmergencyContactManagement";
import { GeneralSettings } from "@/components/settings/GeneralSettings";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/contexts/ThemeContext";
import { useBackground } from "@/contexts/BackgroundContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AdminSettings() {
  const { isGlassTheme, toggleGlassTheme, glassIntensity, setGlassIntensity, sidebarOpacity, setSidebarOpacity, authPageOpacity, setAuthPageOpacity } = useTheme();
  const { appBackground, setAppBackground, refreshBackgrounds } = useBackground();
  const [localIntensity, setLocalIntensity] = useState(glassIntensity);
  const [localSidebarOpacity, setLocalSidebarOpacity] = useState(sidebarOpacity);
  const [localAuthPageOpacity, setLocalAuthPageOpacity] = useState(authPageOpacity);
  const [backgroundOpacity, setBackgroundOpacity] = useState(appBackground.opacity);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [customColor, setCustomColor] = useState(appBackground.color || '#0066cc');
  const [gradientStart, setGradientStart] = useState(appBackground.gradientStart || '#0066cc');
  const [gradientEnd, setGradientEnd] = useState(appBackground.gradientEnd || '#00ccff');
  const [aiPrompt, setAiPrompt] = useState('');
  const { toast } = useToast();

  const handleToggleTheme = async () => {
    await toggleGlassTheme();
  };

  const handleIntensityChange = (value: number[]) => {
    setLocalIntensity(value[0]);
  };

  const handleSidebarOpacityChange = (value: number[]) => {
    setLocalSidebarOpacity(value[0]);
  };

  const handleAuthPageOpacityChange = (value: number[]) => {
    setLocalAuthPageOpacity(value[0]);
  };

  const handleSaveIntensity = async () => {
    await setGlassIntensity(localIntensity);
    await setSidebarOpacity(localSidebarOpacity);
    await setAuthPageOpacity(localAuthPageOpacity);
  };

  const handleBackgroundUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

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
      const fileExt = file.name.split('.').pop();
      const filePath = `background-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const newBackground = {
        type: 'uploaded' as const,
        url: publicUrl,
        opacity: backgroundOpacity,
      };

      await supabase
        .from('app_settings')
        .upsert({
          setting_key: 'app_background',
          setting_value: newBackground,
        }, {
          onConflict: 'setting_key',
        });

      setAppBackground(newBackground);
      await refreshBackgrounds();

      toast({
        title: "Success",
        description: "Background image uploaded successfully",
      });
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
    if (!aiPrompt.trim()) {
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

      const newBackground = {
        type: 'generated' as const,
        url: data.imageUrl,
        opacity: backgroundOpacity,
      };

      await supabase
        .from('app_settings')
        .upsert({
          setting_key: 'app_background',
          setting_value: newBackground,
        }, {
          onConflict: 'setting_key',
        });

      setAppBackground(newBackground);
      await refreshBackgrounds();

      toast({
        title: "Success",
        description: "AI background generated successfully",
      });
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

  const handleSolidColor = async () => {
    const newBackground = {
      type: 'color' as const,
      url: null,
      opacity: backgroundOpacity,
      color: customColor,
    };

    try {
      await supabase
        .from('app_settings')
        .upsert({
          setting_key: 'app_background',
          setting_value: newBackground,
        }, {
          onConflict: 'setting_key',
        });

      setAppBackground(newBackground);
      await refreshBackgrounds();

      toast({
        title: "Success",
        description: "Background color updated",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleGradient = async () => {
    const newBackground = {
      type: 'gradient' as const,
      url: null,
      opacity: backgroundOpacity,
      gradientStart,
      gradientEnd,
      gradientDirection: '135deg',
    };

    try {
      await supabase
        .from('app_settings')
        .upsert({
          setting_key: 'app_background',
          setting_value: newBackground,
        }, {
          onConflict: 'setting_key',
        });

      setAppBackground(newBackground);
      await refreshBackgrounds();

      toast({
        title: "Success",
        description: "Background gradient updated",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleResetToDefault = async () => {
    const newBackground = {
      type: 'default' as const,
      url: null,
      opacity: 100,
    };

    try {
      await supabase
        .from('app_settings')
        .upsert({
          setting_key: 'app_background',
          setting_value: newBackground,
        }, {
          onConflict: 'setting_key',
        });

      setAppBackground(newBackground);
      await refreshBackgrounds();

      toast({
        title: "Success",
        description: "Background reset to default",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleFaviconUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (PNG, ICO, SVG, etc.)",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `favicon-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: settingsError } = await supabase
        .from('app_settings')
        .upsert({
          setting_key: 'favicon_url',
          setting_value: publicUrl,
        }, {
          onConflict: 'setting_key',
        });

      if (settingsError) throw settingsError;

      const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement || document.createElement('link');
      link.type = 'image/x-icon';
      link.rel = 'icon';
      link.href = publicUrl;
      if (!document.querySelector("link[rel*='icon']")) {
        document.head.appendChild(link);
      }

      toast({
        title: "Success",
        description: "Favicon updated successfully",
      });
    } catch (error: any) {
      console.error('Error uploading favicon:', error);
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage app settings, theme, and system configuration"
      />

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="users">
            <Users className="mr-2 h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="theme">
            <Palette className="mr-2 h-4 w-4" />
            Theme
          </TabsTrigger>
          <TabsTrigger value="webcams">
            <Webcam className="mr-2 h-4 w-4" />
            Webcams
          </TabsTrigger>
          <TabsTrigger value="emergency">
            <Phone className="mr-2 h-4 w-4" />
            Emergency
          </TabsTrigger>
          <TabsTrigger value="general">
            <Settings className="mr-2 h-4 w-4" />
            General
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <UserManagement />
        </TabsContent>

        <TabsContent value="theme" className="space-y-4">
          <Tabs defaultValue="display" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="display">Display</TabsTrigger>
              <TabsTrigger value="background">Background</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="display" className="space-y-6 pt-6">
              {/* Theme Mode Toggle */}
              <Card>
                <CardHeader>
                  <CardTitle>Display Mode</CardTitle>
                  <CardDescription>
                    Glass mode adds beautiful translucent effects to cards and panels
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={handleToggleTheme}
                      variant={isGlassTheme ? "default" : "outline"}
                      className="flex-1"
                    >
                      {isGlassTheme ? "✨ Glass Mode" : "Classic Mode"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Glass Intensity Sliders */}
              {isGlassTheme && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle>Card Glass Intensity</CardTitle>
                      <CardDescription>
                        Adjust card opacity (0% = transparent glass, 100% = completely solid)
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{localIntensity}%</span>
                      </div>
                      <Slider
                        value={[localIntensity]}
                        onValueChange={handleIntensityChange}
                        min={0}
                        max={100}
                        step={5}
                        className="w-full"
                      />
                      <Button onClick={handleSaveIntensity} className="w-full">
                        Apply Card Intensity
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Sidebar Glass Intensity</CardTitle>
                      <CardDescription>
                        Adjust sidebar opacity (uses same formula as cards, so matching values = matching appearance)
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{localSidebarOpacity}%</span>
                      </div>
                      <Slider
                        value={[localSidebarOpacity]}
                        onValueChange={handleSidebarOpacityChange}
                        min={0}
                        max={100}
                        step={5}
                        className="w-full"
                      />
                      <Button onClick={handleSaveIntensity} className="w-full">
                        Apply Sidebar Intensity
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Auth Page Glass Intensity</CardTitle>
                      <CardDescription>
                        Adjust auth page opacity (uses same formula as cards, so matching values = matching appearance)
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{localAuthPageOpacity}%</span>
                      </div>
                      <Slider
                        value={[localAuthPageOpacity]}
                        onValueChange={handleAuthPageOpacityChange}
                        min={0}
                        max={100}
                        step={5}
                        className="w-full"
                      />
                      <Button onClick={handleSaveIntensity} className="w-full">
                        Apply Auth Page Intensity
                      </Button>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            <TabsContent value="background" className="space-y-6 pt-6">
              {/* Background Opacity */}
              <Card>
                <CardHeader>
                  <CardTitle>Background Opacity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{backgroundOpacity}%</span>
                  </div>
                  <Slider
                    value={[backgroundOpacity]}
                    onValueChange={(val) => setBackgroundOpacity(val[0])}
                    min={0}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </CardContent>
              </Card>

              {/* Upload Background */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Upload Custom Image
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleBackgroundUpload}
                    disabled={uploading}
                  />
                  {uploading && (
                    <span className="text-sm text-muted-foreground mt-2 block">Uploading...</span>
                  )}
                </CardContent>
              </Card>

              {/* Generate with AI */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
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
                      {generating ? "Generating..." : "Generate"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Solid Color */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Solid Color
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={customColor}
                      onChange={(e) => setCustomColor(e.target.value)}
                      className="w-20 h-10"
                    />
                    <Button onClick={handleSolidColor} variant="outline" className="flex-1">
                      Apply Color
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Gradient */}
              <Card>
                <CardHeader>
                  <CardTitle>Gradient Background</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2">
                    <div className="flex-1 space-y-2">
                      <Label className="text-xs">Start Color</Label>
                      <Input
                        type="color"
                        value={gradientStart}
                        onChange={(e) => setGradientStart(e.target.value)}
                        className="w-full h-10"
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      <Label className="text-xs">End Color</Label>
                      <Input
                        type="color"
                        value={gradientEnd}
                        onChange={(e) => setGradientEnd(e.target.value)}
                        className="w-full h-10"
                      />
                    </div>
                  </div>
                  <Button onClick={handleGradient} variant="outline" className="w-full">
                    Apply Gradient
                  </Button>
                </CardContent>
              </Card>

              {/* Reset to Default */}
              <Card>
                <CardContent className="pt-6">
                  <Button onClick={handleResetToDefault} variant="outline" className="w-full">
                    Reset to Default Background
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-6 pt-6">
              {/* Favicon Upload */}
              <Card>
                <CardHeader>
                  <CardTitle>Custom Favicon</CardTitle>
                  <CardDescription>
                    Upload a custom favicon (PNG, ICO, SVG). Recommended size: 32x32 or 64x64 pixels.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFaviconUpload}
                    disabled={uploading}
                  />
                  {uploading && (
                    <span className="text-sm text-muted-foreground mt-2 block">Uploading...</span>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="webcams" className="space-y-4">
          <WebcamManagement />
        </TabsContent>

        <TabsContent value="emergency" className="space-y-4">
          <EmergencyContactManagement />
        </TabsContent>

        <TabsContent value="general" className="space-y-4">
          <GeneralSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
