import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface BackgroundSetting {
  type: "default" | "generated" | "uploaded" | "color" | "gradient";
  url: string | null;
  opacity: number;
  color?: string;
  gradientStart?: string;
  gradientEnd?: string;
  gradientDirection?: string;
  overlayColor?: string;
  overlayOpacity?: number;
}

interface BackgroundContextType {
  homeBackground: BackgroundSetting;
  appBackground: BackgroundSetting;
  setHomeBackground: (bg: BackgroundSetting) => void;
  setAppBackground: (bg: BackgroundSetting) => void;
  refreshBackgrounds: () => Promise<void>;
  loading: boolean;
}

const defaultBackground: BackgroundSetting = {
  type: "default",
  url: null,
  opacity: 100,
};

const getInitialBackground = (key: string): BackgroundSetting => {
  try {
    const cached = localStorage.getItem(key);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (e) {
    console.error("Failed to load cached background", e);
  }
  return defaultBackground;
};

const BackgroundContext = createContext<BackgroundContextType | undefined>(undefined);

export const BackgroundProvider = ({ children }: { children: React.ReactNode }) => {
  const [homeBackground, setHomeBackground] = useState<BackgroundSetting>(
    () => getInitialBackground("home_background")
  );
  const [appBackground, setAppBackground] = useState<BackgroundSetting>(
    () => getInitialBackground("app_background")
  );
  const [loading, setLoading] = useState(true);

  const refreshBackgrounds = async () => {
    try {
      const { data: homeData } = await supabase
        .from("app_settings")
        .select("setting_value")
        .eq("setting_key", "home_background")
        .maybeSingle();

      const { data: appData } = await supabase
        .from("app_settings")
        .select("setting_value")
        .eq("setting_key", "app_background")
        .maybeSingle();

      const imagesToPreload: Promise<void>[] = [];

      if (homeData?.setting_value) {
        const bgValue = homeData.setting_value as any;
        
        // Preload image if it's a custom background
        if (bgValue.url && (bgValue.type === "generated" || bgValue.type === "uploaded")) {
          const preloadPromise = new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => resolve();
            img.onerror = () => resolve(); // Don't block forever if image fails
            img.src = bgValue.url;
          });
          imagesToPreload.push(preloadPromise);
        }
        
        setHomeBackground(bgValue);
        localStorage.setItem("home_background", JSON.stringify(bgValue));
      }
      
      if (appData?.setting_value) {
        const bgValue = appData.setting_value as any;
        
        // Preload image if it's a custom background
        if (bgValue.url && (bgValue.type === "generated" || bgValue.type === "uploaded")) {
          const preloadPromise = new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => resolve();
            img.onerror = () => resolve(); // Don't block forever if image fails
            img.src = bgValue.url;
          });
          imagesToPreload.push(preloadPromise);
        }
        
        setAppBackground(bgValue);
        localStorage.setItem("app_background", JSON.stringify(bgValue));
      }

      // Wait for all images to preload
      await Promise.all(imagesToPreload);
    } catch (error) {
      console.error("Failed to refresh backgrounds", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshBackgrounds();
  }, []);

  return (
    <BackgroundContext.Provider
      value={{
        homeBackground,
        appBackground,
        setHomeBackground,
        setAppBackground,
        refreshBackgrounds,
        loading,
      }}
    >
      {children}
    </BackgroundContext.Provider>
  );
};

export const useBackground = () => {
  const context = useContext(BackgroundContext);
  if (context === undefined) {
    throw new Error("useBackground must be used within a BackgroundProvider");
  }
  return context;
};
