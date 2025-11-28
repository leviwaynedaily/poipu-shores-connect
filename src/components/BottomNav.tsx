import { useState, useEffect } from "react";
import { Home, MessageSquare, Camera, FileText, User, Bird, Users, Settings, MoreHorizontal, Megaphone } from "lucide-react";
import { NavLink } from "./NavLink";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

interface MobilePage {
  id: string;
  tabName: string;
  iconUrl: string | null;
  headerLogoUrl: string | null;
  fallbackIcon: string;
  title: string;
  subtitle: string;
  order: number;
  isVisible: boolean;
  isFloating: boolean;
}

const iconMap: Record<string, any> = {
  Home,
  MessageSquare,
  Camera,
  FileText,
  User,
  Bird,
  Users,
  Settings,
  Megaphone,
};

const routeMap: Record<string, string> = {
  home: "/dashboard",
  chat: "/chat",
  photos: "/photos",
  documents: "/documents",
  profile: "/profile",
  assistant: "/assistant",
  members: "/members",
  settings: "/settings",
  announcements: "/announcements",
};

export function BottomNav() {
  const [pages, setPages] = useState<MobilePage[]>([]);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    fetchMobileConfig();
  }, []);

  const fetchMobileConfig = async () => {
    const { data } = await supabase
      .from('app_settings')
      .select('setting_value')
      .eq('setting_key', 'mobile_pages_config')
      .maybeSingle();

    if (data?.setting_value) {
      const config = data.setting_value as any;
      if (config?.pages) {
        setPages(config.pages as MobilePage[]);
      }
    }
  };

  // Filter and sort pages
  const visiblePages = pages
    .filter(p => p.isVisible)
    .sort((a, b) => a.order - b.order);

  const floatingPage = visiblePages.find(p => p.isFloating);
  const regularPages = visiblePages.filter(p => !p.isFloating);
  
  // First 3 regular pages in bottom nav
  const bottomNavPages = regularPages.slice(0, 3);
  
  // Remaining pages go in "More"
  const morePages = regularPages.slice(3);

  const renderIcon = (page: MobilePage, size: string = "h-5 w-5") => {
    if (page.iconUrl) {
      return (
        <img 
          src={page.iconUrl} 
          alt={`${page.tabName} icon`} 
          className={`${size} object-contain`}
        />
      );
    }
    const IconComponent = iconMap[page.fallbackIcon] || Home;
    return <IconComponent className={size} />;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-safe">
      <div className="flex items-end justify-around h-20 px-2 relative">
        {/* First 3 regular tabs */}
        {bottomNavPages.map((page) => (
          <NavLink
            key={page.id}
            to={routeMap[page.id] || "/"}
            className="flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
            activeClassName="text-primary font-medium"
          >
            {renderIcon(page)}
            <span className="text-xs">{page.tabName}</span>
          </NavLink>
        ))}

        {/* Floating Action Button - centered and elevated */}
        {floatingPage && (
          <NavLink
            to={routeMap[floatingPage.id] || "/"}
            className="absolute left-1/2 -translate-x-1/2 -top-6 flex flex-col items-center justify-center gap-1 bg-primary text-primary-foreground rounded-full w-16 h-16 shadow-lg hover:shadow-xl transition-all hover:scale-105"
            activeClassName="ring-2 ring-primary ring-offset-2"
          >
            {renderIcon(floatingPage, "h-6 w-6")}
            <span className="text-[10px] font-medium">{floatingPage.tabName}</span>
          </NavLink>
        )}

        {/* More Button */}
        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <SheetTrigger asChild>
            <button className="flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors">
              <MoreHorizontal className="h-5 w-5" />
              <span className="text-xs">More</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[50vh]">
            <SheetHeader>
              <SheetTitle>More Pages</SheetTitle>
              <SheetDescription>
                Additional navigation options
              </SheetDescription>
            </SheetHeader>
            <div className="grid grid-cols-3 gap-4 mt-6">
              {morePages.map((page) => (
                <NavLink
                  key={page.id}
                  to={routeMap[page.id] || "/"}
                  onClick={() => setMoreOpen(false)}
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg border bg-card text-card-foreground hover:bg-accent transition-colors"
                >
                  {renderIcon(page, "h-6 w-6")}
                  <span className="text-xs text-center">{page.tabName}</span>
                </NavLink>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
