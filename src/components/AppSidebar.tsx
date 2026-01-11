import { Home, Megaphone, MessageSquare, FileText, Camera, Users, User, LogOut, Settings, Edit, LucideIcon } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import logoIcon from "@/assets/poipu-logo-icon.png";
import logoText from "@/assets/poipu-text.png";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const defaultMenuItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home, iconUrl: null },
  { title: "Announcements", url: "/announcements", icon: Megaphone, iconUrl: null },
  { title: "Community Chat", url: "/chat", icon: MessageSquare, iconUrl: null },
  { title: "Poipu Shores Documents", url: "/documents", icon: FileText, iconUrl: null },
  { title: "Community Photos", url: "/photos", icon: Camera, iconUrl: null },
  { title: "Poipu Members", url: "/members", icon: Users, iconUrl: null },
];

const iconMap: Record<string, LucideIcon> = {
  Home,
  Megaphone,
  MessageSquare,
  FileText,
  Camera,
  Users,
};

export function AppSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, isAdmin } = useAuth();
  const { isGlassTheme, sidebarOpacity } = useTheme();
  const currentPath = location.pathname;
  const [profile, setProfile] = useState<any>(null);
  const [menuItems, setMenuItems] = useState(defaultMenuItems);

  useEffect(() => {
    const fetchConfig = async () => {
      const { data } = await supabase
        .from('app_settings')
        .select('setting_value')
        .eq('setting_key', 'web_pages_config')
        .maybeSingle();

      if (data?.setting_value) {
        const config = data.setting_value as any;
        if (config?.pages) {
          const configuredPages = config.pages
            .filter((p: any) => p.isVisible)
            .sort((a: any, b: any) => a.order - b.order)
            .map((p: any) => ({
              title: p.title,
              url: p.route,
              icon: iconMap[p.icon] || Home,
              iconUrl: p.iconUrl || null,
            }));
          setMenuItems(configuredPages);
        }
      }
    };

    fetchConfig();
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      
      if (data) {
        // Fetch unit number from unit_owners
        const { data: unitsData } = await supabase
          .from("unit_owners")
          .select("unit_number")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle();
        
        setProfile({
          ...data,
          unit_number: unitsData?.unit_number || null,
        });
      }
    };

    fetchProfile();
  }, [user]);

  const isActive = (path: string) => currentPath === path;

  // Calculate opacity for sidebar using SAME FORMULA as cards (so matching values = matching appearance)
  const opacity = isGlassTheme ? 5 + (sidebarOpacity * 0.95) : 100;
  const borderOpacity = isGlassTheme ? 15 + (sidebarOpacity * 0.85) : 100;

  return (
    <Sidebar
      className={`${!open ? "w-20" : "w-64"}`}
      collapsible="icon"
      variant="floating"
    >
      <SidebarContent>
        <SidebarGroup>
          {open ? (
            <div className="flex items-center justify-between gap-1 h-12 border-b border-border/20 pl-3 pr-2">
              <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                <img src={logoIcon} alt="Poipu Shores Logo" className="h-7 w-7 object-contain flex-shrink-0" />
                <img src={logoText} alt="Poipu Shores" className="h-4 w-auto flex-shrink min-w-0" />
              </div>
              <SidebarTrigger className="h-8 w-8 flex-shrink-0" />
            </div>
          ) : (
            <div className="flex flex-col items-center border-b border-border/20 py-2">
              <SidebarTrigger className="h-8 w-8 mb-2" />
              <img src={logoIcon} alt="Poipu Shores Logo" className="h-10 w-10 object-contain" />
            </div>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {!open ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          end
                          className="flex items-center justify-center gap-3 py-4 text-base min-h-[44px]"
                          activeClassName="bg-accent text-accent-foreground font-semibold"
                        >
                          {item.iconUrl ? (
                            <img src={item.iconUrl} alt={item.title} className="h-9 w-9 object-contain dark:brightness-125" />
                          ) : (
                            <item.icon className="h-9 w-9 text-sidebar-foreground" />
                          )}
                        </NavLink>
                        </SidebarMenuButton>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="font-medium">
                        {item.title}
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end
                        className="flex items-center gap-3 py-4 text-base min-h-[44px]"
                        activeClassName="bg-accent text-accent-foreground font-semibold"
                      >
                        {item.iconUrl ? (
                          <img src={item.iconUrl} alt={item.title} className="h-5 w-5 object-contain dark:brightness-125" />
                        ) : (
                          <item.icon className="h-5 w-5 text-sidebar-foreground" />
                        )}
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        {profile && (
          <div className="mt-auto border-t border-border/20">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-full p-4 hover:bg-accent/50 transition-colors focus:outline-none">
                  {!open ? (
                    <div className="flex justify-center">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={profile.avatar_url || ""} />
                        <AvatarFallback>
                          {profile.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={profile.avatar_url || ""} />
                        <AvatarFallback>
                          {profile.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm font-semibold text-foreground truncate">{profile.full_name}</p>
                        {profile.unit_number && (
                          <p className="text-xs text-muted-foreground">Unit {profile.unit_number}</p>
                        )}
                      </div>
                    </div>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  <Edit className="h-4 w-4 mr-2 text-foreground" />
                  Edit Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="h-4 w-4 mr-2 text-foreground" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}