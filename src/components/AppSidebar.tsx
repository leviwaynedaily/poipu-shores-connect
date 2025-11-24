import { Home, Megaphone, MessageSquare, FileText, Camera, Users, User, LogOut, Settings, Edit } from "lucide-react";
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

const menuItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Announcements", url: "/announcements", icon: Megaphone },
  { title: "Community Chat", url: "/chat", icon: MessageSquare },
  { title: "Poipu Shores Documents", url: "/documents", icon: FileText },
  { title: "Community Photos", url: "/photos", icon: Camera },
  { title: "Poipu Members", url: "/members", icon: Users },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, isAdmin } = useAuth();
  const { isGlassTheme, glassIntensity } = useTheme();
  const currentPath = location.pathname;
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

  const isActive = (path: string) => currentPath === path;

  // Calculate opacity based on intensity (0-100 scale)
  const opacity = isGlassTheme ? 5 + (glassIntensity * 0.95) : 100;
  const borderOpacity = isGlassTheme ? 15 + (glassIntensity * 0.85) : 100;

  return (
    <Sidebar
      className={`${!open ? "w-20" : "w-64"} ${
        isGlassTheme 
          ? "backdrop-blur-sm" 
          : "bg-sidebar border-sidebar-border"
      }`}
      style={isGlassTheme ? {
        backgroundColor: `hsl(var(--card) / ${opacity}%)`,
        borderColor: `hsl(var(--border) / ${borderOpacity}%)`
      } : undefined}
      collapsible="icon"
    >
      <SidebarContent>
        <SidebarGroup>
          <div className={`flex items-center h-12 border-b border-border/20 ${open ? "px-4" : "justify-center px-0"}`}>
            <div className="flex items-center gap-3">
              <img src={logoIcon} alt="Poipu Shores Logo" className="h-8 w-8 object-contain" />
              {open && <img src={logoText} alt="Poipu Shores" className="h-6 w-auto" />}
            </div>
          </div>
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
                            className="flex items-center gap-3 py-4 text-base"
                            activeClassName="bg-accent text-accent-foreground font-semibold"
                          >
                            <item.icon className="h-5 w-5" />
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
                        className="flex items-center gap-3 py-4 text-base"
                        activeClassName="bg-accent text-accent-foreground font-semibold"
                      >
                        <item.icon className="h-5 w-5" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  {!open ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton asChild>
                          <NavLink
                            to="/settings"
                            end
                            className="flex items-center gap-3 py-4 text-base"
                            activeClassName="bg-accent text-accent-foreground font-semibold"
                          >
                            <Settings className="h-5 w-5" />
                          </NavLink>
                        </SidebarMenuButton>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="font-medium">
                        Settings
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <SidebarMenuButton asChild>
                      <NavLink
                        to="/settings"
                        end
                        className="flex items-center gap-3 py-4 text-base"
                        activeClassName="bg-accent text-accent-foreground font-semibold"
                      >
                        <Settings className="h-5 w-5" />
                        <span>Settings</span>
                      </NavLink>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
        
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
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="h-4 w-4 mr-2" />
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