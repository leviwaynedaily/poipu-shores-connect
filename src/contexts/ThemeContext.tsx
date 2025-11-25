import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface ThemeContextType {
  isGlassTheme: boolean;
  toggleGlassTheme: () => Promise<void>;
  glassIntensity: number;
  setGlassIntensity: (intensity: number) => Promise<void>;
  sidebarOpacity: number;
  setSidebarOpacity: (opacity: number) => Promise<void>;
  showThemeDialog: boolean;
  setShowThemeDialog: (show: boolean) => void;
  loading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [isGlassTheme, setIsGlassTheme] = useState(false);
  const [glassIntensity, setGlassIntensityState] = useState(90);
  const [sidebarOpacity, setSidebarOpacityState] = useState(50);
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
          .select('glass_theme_enabled, glass_intensity, sidebar_opacity')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        setIsGlassTheme(data?.glass_theme_enabled ?? false);
        setGlassIntensityState(data?.glass_intensity ?? 90);
        setSidebarOpacityState(data?.sidebar_opacity ?? 50);
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

  // Set sidebar opacity
  const setSidebarOpacity = async (opacity: number) => {
    if (!user) {
      toast.error('Please sign in to use theme preferences');
      return;
    }

    setSidebarOpacityState(opacity);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ sidebar_opacity: opacity })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Sidebar opacity updated');
    } catch (error) {
      console.error('Error saving sidebar opacity:', error);
      toast.error('Failed to save sidebar opacity');
    }
  };

  // Load saved favicon
  useEffect(() => {
    const loadFavicon = async () => {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('setting_value')
          .eq('setting_key', 'favicon_url')
          .single();

        if (!error && data?.setting_value) {
          const faviconUrl = data.setting_value as string;
          const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement || document.createElement('link');
          link.type = 'image/x-icon';
          link.rel = 'icon';
          link.href = faviconUrl;
          if (!document.querySelector("link[rel*='icon']")) {
            document.head.appendChild(link);
          }
        }
      } catch (error) {
        console.error('Error loading favicon:', error);
      }
    };

    loadFavicon();
  }, []);

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
      sidebarOpacity,
      setSidebarOpacity,
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
