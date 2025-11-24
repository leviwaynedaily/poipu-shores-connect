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
}

interface BackgroundContextType {
  homeBackground: BackgroundSetting;
  appBackground: BackgroundSetting;
  setHomeBackground: (bg: BackgroundSetting) => void;
  setAppBackground: (bg: BackgroundSetting) => void;
  refreshBackgrounds: () => Promise<void>;
}

const defaultBackground: BackgroundSetting = {
  type: "default",
  url: null,
  opacity: 100,
};

const BackgroundContext = createContext<BackgroundContextType | undefined>(undefined);

export const BackgroundProvider = ({ children }: { children: React.ReactNode }) => {
  const [homeBackground, setHomeBackground] = useState<BackgroundSetting>(defaultBackground);
  const [appBackground, setAppBackground] = useState<BackgroundSetting>(defaultBackground);

  const refreshBackgrounds = async () => {
    const { data: homeData } = await supabase
      .from("app_settings")
      .select("setting_value")
      .eq("setting_key", "home_background")
      .single();

    const { data: appData } = await supabase
      .from("app_settings")
      .select("setting_value")
      .eq("setting_key", "app_background")
      .single();

    if (homeData?.setting_value) {
      setHomeBackground(homeData.setting_value as any);
    }
    if (appData?.setting_value) {
      setAppBackground(appData.setting_value as any);
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
