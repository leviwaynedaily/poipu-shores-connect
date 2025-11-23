import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Footer } from "@/components/Footer";
import { useTheme } from "@/contexts/ThemeContext";
import beachImage from "@/assets/condo-oceanfront.jpeg";

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const { isGlassTheme, glassIntensity } = useTheme();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full relative">
        {/* Background - conditional based on theme */}
        {isGlassTheme ? (
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
            className="sticky top-0 z-10 flex h-16 items-center border-b px-4 shadow-sm backdrop-blur-sm"
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
            <SidebarTrigger className="mr-4" />
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Poipu Shores
              </h1>
              <span className="text-xl">🌺</span>
            </div>
          </header>
          <div className="p-6 flex-1">
            {children}
          </div>
          <Footer />
        </main>
      </div>
    </SidebarProvider>
  );
};