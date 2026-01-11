import { useState, useMemo } from "react";
import { icons } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search } from "lucide-react";

// Get all icon names (filter out non-icon exports)
const allIconNames = Object.keys(icons).filter(
  (name) => typeof icons[name as keyof typeof icons] === "function" || 
    (typeof icons[name as keyof typeof icons] === "object" && 
     icons[name as keyof typeof icons] !== null &&
     'displayName' in (icons[name as keyof typeof icons] as object))
) as (keyof typeof icons)[];

interface IconPickerProps {
  value: string;
  onChange: (iconName: string) => void;
  triggerClassName?: string;
}

export function IconPicker({ value, onChange, triggerClassName }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Get the current icon component safely
  const getIconSafe = (name: string): LucideIcon | null => {
    const iconEntry = icons[name as keyof typeof icons];
    // Check if it's a valid React component (ForwardRefExoticComponent)
    if (
      iconEntry &&
      typeof iconEntry === "object" &&
      "$$typeof" in (iconEntry as Record<string, unknown>)
    ) {
      return iconEntry as unknown as LucideIcon;
    }
    return null;
  };
  
  const CurrentIcon = getIconSafe(value);

  // Filter icons based on search
  const filteredIcons = useMemo(() => {
    if (!search.trim()) {
      // Return popular icons when no search
      const popularIcons = [
        "Home", "Settings", "User", "Users", "MessageSquare", "FileText", 
        "Camera", "Image", "Bell", "Mail", "Calendar", "Clock", "Star",
        "Heart", "Search", "Menu", "MoreHorizontal", "ChevronRight",
        "Plus", "Minus", "Check", "X", "Edit", "Trash", "Download",
        "Upload", "Share", "Link", "ExternalLink", "Eye", "EyeOff",
        "Lock", "Unlock", "Key", "Shield", "AlertCircle", "Info",
        "HelpCircle", "Lightbulb", "Zap", "Activity", "BarChart",
        "PieChart", "TrendingUp", "DollarSign", "CreditCard", "ShoppingCart",
        "Package", "Truck", "MapPin", "Navigation", "Compass", "Globe",
        "Phone", "Smartphone", "Laptop", "Monitor", "Wifi", "Bluetooth",
        "Sun", "Moon", "Cloud", "Umbrella", "Thermometer", "Droplet",
        "Flame", "Wind", "Megaphone", "Bird", "Coffee", "Music", "Video",
        "Mic", "Volume2", "Headphones", "Play", "Pause", "SkipForward",
        "Folder", "File", "FileImage", "FilePlus", "Archive", "Bookmark",
        "Tag", "Flag", "Award", "Gift", "Smile", "Frown", "Meh",
      ];
      return popularIcons.filter(name => name in icons);
    }

    const searchLower = search.toLowerCase();
    return allIconNames
      .filter((name) => name.toLowerCase().includes(searchLower))
      .slice(0, 150); // Limit for performance
  }, [search]);

  const handleSelect = (iconName: string) => {
    onChange(iconName);
    setOpen(false);
    setSearch("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={triggerClassName}>
          {CurrentIcon ? (
            <CurrentIcon className="h-4 w-4 mr-2" />
          ) : (
            <div className="h-4 w-4 mr-2 bg-muted rounded" />
          )}
          {value || "Select icon"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Select Icon</DialogTitle>
        </DialogHeader>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search 1,500+ icons..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            autoFocus
          />
        </div>

        <ScrollArea className="h-[300px] mt-2">
          <div className="grid grid-cols-6 gap-2 p-1">
            {filteredIcons.map((iconName) => {
              const IconComponent = getIconSafe(iconName);
              if (!IconComponent) return null;
              
              const isSelected = value === iconName;
              
              return (
                <button
                  key={iconName}
                  onClick={() => handleSelect(iconName)}
                  className={`
                    flex flex-col items-center justify-center p-2 rounded-md
                    hover:bg-accent transition-colors
                    ${isSelected ? "bg-accent ring-2 ring-primary" : ""}
                  `}
                  title={iconName}
                >
                  <IconComponent className="h-5 w-5 text-foreground" />
                  <span className="text-[10px] text-muted-foreground mt-1 truncate w-full text-center">
                    {iconName}
                  </span>
                </button>
              );
            })}
          </div>
          
          {filteredIcons.length === 0 && (
            <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
              <Search className="h-8 w-8 mb-2" />
              <p>No icons found for "{search}"</p>
            </div>
          )}
        </ScrollArea>

        <p className="text-xs text-muted-foreground text-center">
          {search ? `Showing ${filteredIcons.length} icons` : `Showing popular icons • Type to search all ${allIconNames.length}+`}
        </p>
      </DialogContent>
    </Dialog>
  );
}

// Export helper for dynamic icon rendering
export function getIconComponent(iconName: string): LucideIcon | null {
  const iconEntry = icons[iconName as keyof typeof icons];
  // Check if it's a valid React component (ForwardRefExoticComponent)
  if (
    iconEntry &&
    typeof iconEntry === "object" &&
    "$$typeof" in (iconEntry as Record<string, unknown>)
  ) {
    return iconEntry as unknown as LucideIcon;
  }
  return null;
}
