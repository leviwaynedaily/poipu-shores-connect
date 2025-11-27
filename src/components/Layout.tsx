import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Footer } from "@/components/Footer";
import { BottomNav } from "@/components/BottomNav";
import { useTheme } from "@/contexts/ThemeContext";
import { useBackground } from "@/contexts/BackgroundContext";
import beachImage from "@/assets/condo-oceanfront.jpeg";
import logoIcon from "@/assets/poipu-logo-icon.png";
import logoText from "@/assets/poipu-text.png";

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const { isGlassTheme } = useTheme();
  const { appBackground, loading: backgroundLoading } = useBackground();

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

  // Show a simple loading state while background is loading
  if (backgroundLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full relative">
        {/* Background - conditional based on type */}
        {appBackground.type !== "default" ? (
          <>
            <div className="absolute inset-0 z-0" style={getBackgroundStyle()} />
            {/* Color overlay for images */}
            {(appBackground.type === "uploaded" || appBackground.type === "generated") && 
             appBackground.overlayColor && (
              <div 
                className="absolute inset-0 z-0" 
                style={{
                  backgroundColor: appBackground.overlayColor,
                  opacity: (appBackground.overlayOpacity || 0) / 100,
                }}
              />
            )}
          </>
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
          {/* Mobile Header */}
          <header className="md:hidden sticky top-0 z-20 flex items-center gap-3 border-b border-border/20 px-4 py-3 backdrop-blur-sm bg-card/80">
            <SidebarTrigger className="h-8 w-8" />
            <div className="flex items-center gap-2">
              <img src={logoIcon} alt="Poipu Shores" className="h-7 w-7 object-contain" />
              <img src={logoText} alt="Poipu Shores" className="h-4 w-auto" />
            </div>
          </header>

          <div className="py-3 pl-3 pr-3 md:pr-6 flex-1 flex flex-col gap-3 pb-20 md:pb-3">
            {children}
            <Footer />
          </div>
          <BottomNav />
        </main>
      </div>
    </SidebarProvider>
  );
};