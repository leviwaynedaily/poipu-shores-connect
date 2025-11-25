import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Palette, Webcam, Phone, Users, Sparkles, Upload, Wand2, Image as ImageIcon } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { UserManagement } from "@/components/settings/UserManagement";
import { WebcamManagement } from "@/components/settings/WebcamManagement";
import { EmergencyContactManagement } from "@/components/settings/EmergencyContactManagement";
import { GeneralSettings } from "@/components/settings/GeneralSettings";
import { useState, useEffect } from "react";
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
  const [uploadingAuth, setUploadingAuth] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [customColor, setCustomColor] = useState(appBackground.color || '#0066cc');
  const [gradientStart, setGradientStart] = useState(appBackground.gradientStart || '#0066cc');
  const [gradientEnd, setGradientEnd] = useState(appBackground.gradientEnd || '#00ccff');
  const [aiPrompt, setAiPrompt] = useState('');
  const [currentAuthLogo, setCurrentAuthLogo] = useState<string | null>(null);
  const [currentFavicon, setCurrentFavicon] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchCustomImages = async () => {
      const { data: authLogoData } = await supabase
        .from('app_settings')
        .select('setting_value')
        .eq('setting_key', 'auth_logo')
        .maybeSingle();
      
      if (authLogoData?.setting_value) {
        setCurrentAuthLogo(authLogoData.setting_value as string);
      }

      const { data: faviconData } = await supabase
        .from('app_settings')
        .select('setting_value')
        .eq('setting_key', 'favicon_url')
        .maybeSingle();
      
      if (faviconData?.setting_value) {
        setCurrentFavicon(faviconData.setting_value as string);
      }
    };

    fetchCustomImages();
  }, []);

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

  const handleAuthLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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

    setUploadingAuth(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `auth-logo-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      await supabase
        .from('app_settings')
        .upsert({
          setting_key: 'auth_logo',
          setting_value: publicUrl,
        }, {
          onConflict: 'setting_key',
        });

      setCurrentAuthLogo(publicUrl);

      toast({
        title: "Success",
        description: "Sign-in logo uploaded successfully",
      });
    } catch (error: any) {
      console.error('Error uploading auth logo:', error);
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploadingAuth(false);
    }
  };

  const convertIcoToPng = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width || 32;
          canvas.height = img.height || 32;
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }
          
          ctx.drawImage(img, 0, 0);
          URL.revokeObjectURL(url);
          
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to convert image to PNG'));
            }
          }, 'image/png');
        } catch (error) {
          URL.revokeObjectURL(url);
          reject(error);
        }
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };
      
      img.src = url;
    });
  };

  const handleFaviconUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (PNG, JPG, ICO, SVG, etc.)",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      let uploadFile: File | Blob = file;
      let fileName = file.name;
      
      // Convert ICO files to PNG
      if (file.name.toLowerCase().endsWith('.ico') || file.type === 'image/x-icon' || file.type === 'image/vnd.microsoft.icon') {
        const pngBlob = await convertIcoToPng(file);
        uploadFile = pngBlob;
        fileName = file.name.replace(/\.ico$/i, '.png');
        
        toast({
          title: "Converting",
          description: "ICO file converted to PNG format",
        });
      }
      
      const fileExt = fileName.split('.').pop();
      const filePath = `favicon-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, uploadFile);

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

      setCurrentFavicon(publicUrl);

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

            <TabsContent value="display" className="space-y-4 pt-4">
              {/* Theme Mode Toggle */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Display Mode</CardTitle>
                  <CardDescription className="text-sm">
                    Glass mode adds translucent effects
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={handleToggleTheme}
                    variant={isGlassTheme ? "default" : "outline"}
                    className="w-full"
                  >
                    {isGlassTheme ? "✨ Glass Mode" : "Classic Mode"}
                  </Button>
                </CardContent>
              </Card>

              {/* Glass Intensity Sliders */}
              {isGlassTheme && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Glass Intensity</CardTitle>
                    <CardDescription className="text-sm">
                      Adjust opacity for different areas
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Cards</Label>
                        <span className="text-xs text-muted-foreground">{localIntensity}%</span>
                      </div>
                      <Slider
                        value={[localIntensity]}
                        onValueChange={handleIntensityChange}
                        min={0}
                        max={100}
                        step={5}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Sidebar</Label>
                        <span className="text-xs text-muted-foreground">{localSidebarOpacity}%</span>
                      </div>
                      <Slider
                        value={[localSidebarOpacity]}
                        onValueChange={handleSidebarOpacityChange}
                        min={0}
                        max={100}
                        step={5}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Auth Page</Label>
                        <span className="text-xs text-muted-foreground">{localAuthPageOpacity}%</span>
                      </div>
                      <Slider
                        value={[localAuthPageOpacity]}
                        onValueChange={handleAuthPageOpacityChange}
                        min={0}
                        max={100}
                        step={5}
                        className="w-full"
                      />
                    </div>

                    <Button onClick={handleSaveIntensity} className="w-full" size="sm">
                      Apply Changes
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="background" className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Background Opacity */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Opacity</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{backgroundOpacity}%</span>
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
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Upload className="h-4 w-4" />
                      Upload Image
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {appBackground.type === 'uploaded' && appBackground.url && (
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Current Image</Label>
                        <div className="rounded-md border border-border overflow-hidden">
                          <img 
                            src={appBackground.url} 
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
                      className="text-sm"
                    />
                  </CardContent>
                </Card>

                {/* Solid Color */}
                <Card>
                  <CardHeader className="pb-3">
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
                        className="w-16 h-9"
                      />
                      <Button onClick={handleSolidColor} variant="outline" size="sm" className="flex-1">
                        Apply
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Gradient */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Gradient</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={gradientStart}
                        onChange={(e) => setGradientStart(e.target.value)}
                        className="w-16 h-9"
                      />
                      <Input
                        type="color"
                        value={gradientEnd}
                        onChange={(e) => setGradientEnd(e.target.value)}
                        className="w-16 h-9"
                      />
                      <Button onClick={handleGradient} variant="outline" size="sm" className="flex-1">
                        Apply
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sign-in Logo - Full Width */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Upload className="h-4 w-4" />
                    Sign-in Logo
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Upload a custom logo for the sign-in card
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {currentAuthLogo && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Current Logo</Label>
                      <div className="flex justify-center p-4 rounded-md border border-border bg-muted/30">
                        <img 
                          src={currentAuthLogo} 
                          alt="Current sign-in logo" 
                          className="h-20 w-auto object-contain"
                        />
                      </div>
                    </div>
                  )}
                  {!currentAuthLogo && (
                    <div className="text-xs text-muted-foreground text-center py-2">
                      No custom logo set
                    </div>
                  )}
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleAuthLogoUpload}
                    disabled={uploadingAuth}
                    className="text-sm"
                  />
                </CardContent>
              </Card>

              {/* Generate with AI - Full Width */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Wand2 className="h-4 w-4" />
                    Generate with AI
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {appBackground.type === 'generated' && appBackground.url && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Current Generated Image</Label>
                      <div className="rounded-md border border-border overflow-hidden">
                        <img 
                          src={appBackground.url} 
                          alt="AI generated background" 
                          className="w-full h-24 object-cover"
                        />
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Describe your background..."
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      disabled={generating}
                      className="text-sm"
                    />
                    <Button onClick={handleGenerateBackground} disabled={generating} size="sm">
                      {generating ? "..." : "Generate"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Reset to Default */}
              <div className="flex justify-end">
                <Button onClick={handleResetToDefault} variant="outline" size="sm">
                  Reset to Default
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4 pt-4">
              {/* Favicon Upload */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Custom Favicon</CardTitle>
                  <CardDescription className="text-sm">
                    Upload favicon (PNG, ICO, SVG) - 32x32 or 64x64 pixels
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {currentFavicon && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Current Favicon</Label>
                      <div className="flex items-center gap-3 p-3 rounded-md border border-border bg-muted/30">
                        <img 
                          src={currentFavicon} 
                          alt="Current favicon" 
                          className="h-8 w-8 object-contain"
                        />
                        <span className="text-xs text-muted-foreground">32x32 pixels</span>
                      </div>
                    </div>
                  )}
                  {!currentFavicon && (
                    <div className="text-xs text-muted-foreground text-center py-2">
                      No custom favicon set
                    </div>
                  )}
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFaviconUpload}
                    disabled={uploading}
                    className="text-sm"
                  />
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
