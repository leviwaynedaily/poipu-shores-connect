import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface ThemeContextType {
  isGlassTheme: boolean;
  toggleGlassTheme: () => Promise<void>;
  glassIntensity: number;
  setGlassIntensity: (intensity: number) => Promise<void>;
  showThemeDialog: boolean;
  setShowThemeDialog: (show: boolean) => void;
  loading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [isGlassTheme, setIsGlassTheme] = useState(false);
  const [glassIntensity, setGlassIntensityState] = useState(50);
  const [showThemeDialog, setShowThemeDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Load user's theme preference
  useEffect(() => {
    const loadThemePreference = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('glass_theme_enabled, glass_intensity')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        setIsGlassTheme(data?.glass_theme_enabled ?? false);
        setGlassIntensityState(data?.glass_intensity ?? 50);
      } catch (error) {
        console.error('Error loading theme preference:', error);
      } finally {
        setLoading(false);
      }
    };

    loadThemePreference();
  }, [user]);

  // Toggle glass theme
  const toggleGlassTheme = async () => {
    if (!user) {
      toast.error('Please sign in to use theme preferences');
      return;
    }

    const newValue = !isGlassTheme;
    setIsGlassTheme(newValue);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ glass_theme_enabled: newValue })
        .eq('id', user.id);

      if (error) throw error;

      toast.success(
        newValue ? '✨ Glass Theme Enabled' : 'Glass Theme Disabled'
      );
    } catch (error) {
      console.error('Error saving theme preference:', error);
      setIsGlassTheme(!newValue);
      toast.error('Failed to save theme preference');
    }
  };

  // Set glass intensity
  const setGlassIntensity = async (intensity: number) => {
    if (!user) {
      toast.error('Please sign in to use theme preferences');
      return;
    }

    setGlassIntensityState(intensity);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ glass_intensity: intensity })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Glass intensity updated');
    } catch (error) {
      console.error('Error saving glass intensity:', error);
      toast.error('Failed to save intensity preference');
    }
  };

  // Global keyboard shortcut
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Cmd+J on Mac, Ctrl+J on Windows/Linux
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
        e.preventDefault();
        setShowThemeDialog(true);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [user]);

  return (
    <ThemeContext.Provider value={{ 
      isGlassTheme, 
      toggleGlassTheme, 
      glassIntensity,
      setGlassIntensity,
      showThemeDialog,
      setShowThemeDialog,
      loading 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
