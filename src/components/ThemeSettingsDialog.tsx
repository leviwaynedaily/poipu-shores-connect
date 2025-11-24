import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useTheme } from '@/contexts/ThemeContext';
import { Sparkles, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ThemeSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ThemeSettingsDialog = ({ open, onOpenChange }: ThemeSettingsDialogProps) => {
  const { isGlassTheme, toggleGlassTheme, glassIntensity, setGlassIntensity } = useTheme();
  const [localIntensity, setLocalIntensity] = useState(glassIntensity);
  const [uploading, setUploading] = useState(false);
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Theme Settings
          </DialogTitle>
          <DialogDescription>
            Customize your viewing experience with glass effects
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Theme Mode Toggle */}
          <div className="space-y-3">
            <Label>Current Mode</Label>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleToggleTheme}
                variant={isGlassTheme ? "default" : "outline"}
                className="flex-1"
              >
                {isGlassTheme ? "✨ Glass Mode" : "Classic Mode"}
              </Button>
            </div>
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
                Adjust card opacity (0% = transparent glass, 100% = completely solid)
              </p>
            </div>
          )}

          {/* Favicon Upload */}
          <div className="space-y-3">
            <Label>Custom Favicon</Label>
            <div className="flex items-center gap-3">
              <Input
                type="file"
                accept="image/*"
                onChange={handleFaviconUpload}
                disabled={uploading}
                className="flex-1"
              />
              {uploading && (
                <span className="text-sm text-muted-foreground">Uploading...</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Upload a custom favicon (PNG, ICO, SVG). Recommended size: 32x32 or 64x64 pixels.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveIntensity}>
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
