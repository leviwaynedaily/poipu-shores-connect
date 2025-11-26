import { Home, MessageSquare, Camera, FileText, User } from "lucide-react";
import { NavLink } from "./NavLink";

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-safe">
      <div className="flex items-center justify-around h-16 px-2">
        <NavLink
          to="/dashboard"
          className="flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
          activeClassName="text-primary font-medium"
        >
          <Home className="h-5 w-5" />
          <span className="text-xs">Home</span>
        </NavLink>

        <NavLink
          to="/chat"
          className="flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
          activeClassName="text-primary font-medium"
        >
          <MessageSquare className="h-5 w-5" />
          <span className="text-xs">Chat</span>
        </NavLink>

        <NavLink
          to="/photos"
          className="flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
          activeClassName="text-primary font-medium"
        >
          <Camera className="h-5 w-5" />
          <span className="text-xs">Photos</span>
        </NavLink>

        <NavLink
          to="/documents"
          className="flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
          activeClassName="text-primary font-medium"
        >
          <FileText className="h-5 w-5" />
          <span className="text-xs">Docs</span>
        </NavLink>

        <NavLink
          to="/profile"
          className="flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
          activeClassName="text-primary font-medium"
        >
          <User className="h-5 w-5" />
          <span className="text-xs">Profile</span>
        </NavLink>
      </div>
    </nav>
  );
}
