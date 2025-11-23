import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface ThemeContextType {
  isGlassTheme: boolean;
  toggleGlassTheme: () => Promise<void>;
  loading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [isGlassTheme, setIsGlassTheme] = useState(false);
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
          .select('glass_theme_enabled')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        setIsGlassTheme(data?.glass_theme_enabled ?? false);
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
        newValue ? '✨ Glass Theme Enabled' : 'Glass Theme Disabled',
        {
          description: 'Press Cmd+J (or Ctrl+J) to toggle anytime',
        }
      );
    } catch (error) {
      console.error('Error saving theme preference:', error);
      setIsGlassTheme(!newValue); // Revert on error
      toast.error('Failed to save theme preference');
    }
  };

  // Global keyboard shortcut
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Cmd+J on Mac, Ctrl+J on Windows/Linux
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
        e.preventDefault();
        toggleGlassTheme();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isGlassTheme, user]);

  return (
    <ThemeContext.Provider value={{ isGlassTheme, toggleGlassTheme, loading }}>
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
