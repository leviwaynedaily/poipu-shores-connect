import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Footer } from "@/components/Footer";
import { FloatingChatAssistant } from "@/components/FloatingChatAssistant";
import { useTheme } from "@/contexts/ThemeContext";
import { useBackground } from "@/contexts/BackgroundContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import beachImage from "@/assets/condo-oceanfront.jpeg";

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const { isGlassTheme, glassIntensity } = useTheme();
  const { appBackground } = useBackground();
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      
      if (data) setProfile(data);
    };

    fetchProfile();
  }, [user]);

  const getBackgroundStyle = () => {
    switch (appBackground.type) {
      case "color":
        return {
          background: appBackground.color || "#ffffff",
          opacity: appBackground.opacity / 100,
        };
      case "gradient":
        return {
          background: `linear-gradient(${appBackground.gradientDirection || "to bottom"}, ${
            appBackground.gradientStart || "#ffffff"
          }, ${appBackground.gradientEnd || "#000000"})`,
          opacity: appBackground.opacity / 100,
        };
      case "generated":
      case "uploaded":
        return {
          backgroundImage: `url(${appBackground.url})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
          opacity: appBackground.opacity / 100,
        };
      default:
        if (isGlassTheme) {
          return {
            backgroundImage: `url(${beachImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundAttachment: "fixed",
          };
        }
        return {};
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full relative">
        {/* Background - conditional based on type */}
        {appBackground.type !== "default" ? (
          <div className="absolute inset-0 z-0" style={getBackgroundStyle()} />
        ) : isGlassTheme ? (
          <>
            <div 
              className="absolute inset-0 z-0"
              style={{
                backgroundImage: `url(${beachImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed',
              }}
            />
            <div className="absolute inset-0 z-0 bg-gradient-to-br from-primary/20 via-background/60 to-secondary/20" />
          </>
        ) : (
          <div className="absolute inset-0 z-0 bg-gradient-to-br from-background via-accent/10 to-background" />
        )}

        <AppSidebar />
        <main className="flex-1 flex flex-col relative z-10">
          <header 
            className="sticky top-0 z-10 flex h-16 items-center justify-between border-b px-4 shadow-sm backdrop-blur-sm"
            style={
              isGlassTheme
                ? {
                    backgroundColor: `hsl(var(--card) / ${glassIntensity / 100})`,
                    borderColor: `hsl(var(--border) / ${Math.max(0.15, glassIntensity / 100)})`,
                  }
                : {
                    backgroundColor: 'hsl(var(--card) / 0.95)',
                    borderColor: 'hsl(var(--border))',
                  }
            }
          >
            <SidebarTrigger />
            {profile && (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">
                    {profile.full_name}
                  </p>
                  {profile.unit_number && (
                    <p className="text-xs text-muted-foreground">
                      Unit {profile.unit_number}
                    </p>
                  )}
                </div>
              </div>
            )}
          </header>
          <div className="p-6 flex-1">
            {children}
          </div>
          <Footer />
        </main>
      </div>
      <FloatingChatAssistant />
    </SidebarProvider>
  );
};