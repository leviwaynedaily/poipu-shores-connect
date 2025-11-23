import { Home, Megaphone, MessageSquare, FileText, Camera, User, Users, LogOut } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
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
  TooltipProvider,
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
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;

  return (
    <TooltipProvider delayDuration={0}>
      <Sidebar
        className={!open ? "w-16" : "w-64"}
        collapsible="icon"
      >
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="text-lg py-3">Menu</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
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
                            {open && <span>{item.title}</span>}
                          </NavLink>
                        </SidebarMenuButton>
                      </TooltipTrigger>
                      {!open && (
                        <TooltipContent side="right" className="font-medium">
                          {item.title}
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          
          {isAdmin && (
            <SidebarGroup>
              <SidebarGroupLabel className="text-lg py-3">Admin</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
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
                            {open && <span>User Management</span>}
                          </NavLink>
                        </SidebarMenuButton>
                      </TooltipTrigger>
                      {!open && (
                        <TooltipContent side="right" className="font-medium">
                          User Management
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
          
          <div className="mt-auto p-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={signOut}
                  variant="outline"
                  className="w-full text-base py-5"
                >
                  <LogOut className="h-5 w-5 mr-2" />
                  {open && <span>Sign Out</span>}
                </Button>
              </TooltipTrigger>
              {!open && (
                <TooltipContent side="right" className="font-medium">
                  Sign Out
                </TooltipContent>
              )}
            </Tooltip>
          </div>
        </SidebarContent>
      </Sidebar>
    </TooltipProvider>
  );
}