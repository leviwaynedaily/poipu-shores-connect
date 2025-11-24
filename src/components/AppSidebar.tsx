import { Home, Megaphone, MessageSquare, FileText, Camera, User, Users, LogOut } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
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
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const menuItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Announcements", url: "/announcements", icon: Megaphone },
  { title: "Community Chat", url: "/chat", icon: MessageSquare },
  { title: "Documents", url: "/documents", icon: FileText },
  { title: "Photos", url: "/photos", icon: Camera },
  { title: "Members", url: "/members", icon: Users },
  { title: "My Profile", url: "/profile", icon: User },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const { signOut, isAdmin } = useAuth();
  const { isGlassTheme, glassIntensity } = useTheme();
  const currentPath = location.pathname;

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
          <div className={`flex items-center justify-center border-b border-border/20 ${open ? "gap-3 px-4 py-6" : "py-6"}`}>
            <img src={logoIcon} alt="Poipu Shores Logo" className={open ? "h-8 w-auto" : "h-8 w-auto"} />
            {open && <img src={logoText} alt="Poipu Shores" className="h-6 w-auto" />}
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
                            to="/users"
                            end
                            className="flex items-center gap-3 py-4 text-base"
                            activeClassName="bg-accent text-accent-foreground font-semibold"
                          >
                            <Users className="h-5 w-5" />
                          </NavLink>
                        </SidebarMenuButton>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="font-medium">
                        User Management
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <SidebarMenuButton asChild>
                      <NavLink
                        to="/users"
                        end
                        className="flex items-center gap-3 py-4 text-base"
                        activeClassName="bg-accent text-accent-foreground font-semibold"
                      >
                        <Users className="h-5 w-5" />
                        <span>User Management</span>
                      </NavLink>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
        
        <div className="mt-auto p-4">
          {!open ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={signOut}
                  variant="outline"
                  className="w-full text-base py-5"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-medium">
                Sign Out
              </TooltipContent>
            </Tooltip>
          ) : (
            <Button
              onClick={signOut}
              variant="outline"
              className="w-full text-base py-5"
            >
              <LogOut className="h-5 w-5 mr-2" />
              <span>Sign Out</span>
            </Button>
          )}
        </div>
      </SidebarContent>
    </Sidebar>
  );
}