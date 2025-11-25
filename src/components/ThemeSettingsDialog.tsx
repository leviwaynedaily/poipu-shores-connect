import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useTheme } from '@/contexts/ThemeContext';
import { useBackground } from '@/contexts/BackgroundContext';
import { Sparkles, Upload, Image, Palette, Wand2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ThemeSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ThemeSettingsDialog = ({ open, onOpenChange }: ThemeSettingsDialogProps) => {
  const { isGlassTheme, toggleGlassTheme, glassIntensity, setGlassIntensity } = useTheme();
  const { appBackground, setAppBackground, refreshBackgrounds } = useBackground();
  const [localIntensity, setLocalIntensity] = useState(glassIntensity);
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

  const handleSaveIntensity = async () => {
    await setGlassIntensity(localIntensity);
    onOpenChange(false);
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

    // Validate file type
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

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Save to app_settings
      const { error: settingsError } = await supabase
        .from('app_settings')
        .upsert({
          setting_key: 'favicon_url',
          setting_value: publicUrl,
        }, {
          onConflict: 'setting_key',
        });

      if (settingsError) throw settingsError;

      // Update favicon in document head
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Theme Settings
          </DialogTitle>
          <DialogDescription>
            Customize your viewing experience
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="theme" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="theme">Theme</TabsTrigger>
            <TabsTrigger value="background">Background</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="theme" className="space-y-6">
            {/* Theme Mode Toggle */}
            <div className="space-y-3">
              <Label>Display Mode</Label>
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleToggleTheme}
                  variant={isGlassTheme ? "default" : "outline"}
                  className="flex-1"
                >
                  {isGlassTheme ? "✨ Glass Mode" : "Classic Mode"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Glass mode adds beautiful translucent effects to cards and panels
              </p>
            </div>

            {/* Glass Intensity Slider */}
            {isGlassTheme && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Glass Effect Intensity</Label>
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
                <p className="text-xs text-muted-foreground">
                  Adjust glass effect for cards and sidebar (0% = transparent glass, 100% = completely solid)
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="background" className="space-y-6">
            {/* Background Opacity */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Background Opacity</Label>
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
            </div>

            {/* Upload Background */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload Custom Image
              </Label>
              <Input
                type="file"
                accept="image/*"
                onChange={handleBackgroundUpload}
                disabled={uploading}
              />
              {uploading && (
                <span className="text-sm text-muted-foreground">Uploading...</span>
              )}
            </div>

            {/* Generate with AI */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Wand2 className="h-4 w-4" />
                Generate with AI
              </Label>
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
            </div>

            {/* Solid Color */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Solid Color
              </Label>
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
            </div>

            {/* Gradient */}
            <div className="space-y-3">
              <Label>Gradient Background</Label>
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
            </div>

            {/* Reset to Default */}
            <div className="space-y-3">
              <Button onClick={handleResetToDefault} variant="outline" className="w-full">
                Reset to Default Background
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6">
            {/* Favicon Upload */}
            <div className="space-y-3">
              <Label>Custom Favicon</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={handleFaviconUpload}
                disabled={uploading}
              />
              {uploading && (
                <span className="text-sm text-muted-foreground">Uploading...</span>
              )}
              <p className="text-xs text-muted-foreground">
                Upload a custom favicon (PNG, ICO, SVG). Recommended size: 32x32 or 64x64 pixels.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handleSaveIntensity}>
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
