import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { useTheme } from '@/contexts/ThemeContext';
import { Sparkles } from 'lucide-react';

interface ThemeSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ThemeSettingsDialog = ({ open, onOpenChange }: ThemeSettingsDialogProps) => {
  const { isGlassTheme, toggleGlassTheme, glassIntensity, setGlassIntensity } = useTheme();
  const [localIntensity, setLocalIntensity] = useState(glassIntensity);

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
                <span className="text-sm text-muted-foreground">{localIntensity}/10</span>
              </div>
              <Slider
                value={[localIntensity]}
                onValueChange={handleIntensityChange}
                min={0}
                max={10}
                step={1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Adjust how transparent and blurred cards appear
              </p>
            </div>
          )}
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
