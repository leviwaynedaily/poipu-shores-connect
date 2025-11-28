import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StickyActionBar } from "@/components/ui/sticky-action-bar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload, Copy, Home, MessageSquare, Camera, FileText, User, Bird, Users, Settings, ChevronDown, GripVertical, MoreHorizontal, Megaphone } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableMobilePage } from "./SortableMobilePage";

interface MobilePage {
  id: string;
  tabName: string;
  route: string;
  iconUrl: string | null;
  floatingIconUrl: string | null;
  headerLogoUrl: string | null;
  fallbackIcon: string;
  title: string;
  subtitle: string;
  order: number;
  isVisible: boolean;
  isFloating: boolean;
}

const defaultPages: MobilePage[] = [
  {
    id: "home",
    tabName: "Home",
    route: "/dashboard",
    iconUrl: null,
    floatingIconUrl: null,
    headerLogoUrl: null,
    fallbackIcon: "Home",
    title: "Dashboard",
    subtitle: "Welcome to Poipu Shores",
    order: 1,
    isVisible: true,
    isFloating: false,
  },
  {
    id: "chat",
    tabName: "Chat",
    route: "/chat",
    iconUrl: null,
    floatingIconUrl: null,
    headerLogoUrl: null,
    fallbackIcon: "MessageSquare",
    title: "Community Chat",
    subtitle: "Connect with neighbors",
    order: 2,
    isVisible: true,
    isFloating: false,
  },
  {
    id: "photos",
    tabName: "Photos",
    route: "/photos",
    iconUrl: null,
    floatingIconUrl: null,
    headerLogoUrl: null,
    fallbackIcon: "Camera",
    title: "Photo Gallery",
    subtitle: "Community photos",
    order: 3,
    isVisible: true,
    isFloating: false,
  },
  {
    id: "documents",
    tabName: "Docs",
    route: "/documents",
    iconUrl: null,
    floatingIconUrl: null,
    headerLogoUrl: null,
    fallbackIcon: "FileText",
    title: "Documents",
    subtitle: "Important files",
    order: 4,
    isVisible: true,
    isFloating: false,
  },
  {
    id: "more",
    tabName: "More",
    route: "#",
    iconUrl: null,
    floatingIconUrl: null,
    headerLogoUrl: null,
    fallbackIcon: "MoreHorizontal",
    title: "More",
    subtitle: "Additional pages",
    order: 5,
    isVisible: true,
    isFloating: false,
  },
  {
    id: "profile",
    tabName: "Profile",
    route: "/profile",
    iconUrl: null,
    floatingIconUrl: null,
    headerLogoUrl: null,
    fallbackIcon: "User",
    title: "My Profile",
    subtitle: "Account settings",
    order: 6,
    isVisible: true,
    isFloating: false,
  },
  {
    id: "assistant",
    tabName: "Ask",
    route: "/assistant",
    iconUrl: null,
    floatingIconUrl: null,
    headerLogoUrl: null,
    fallbackIcon: "Bird",
    title: "Ask the Chicken",
    subtitle: "AI Assistant",
    order: 7,
    isVisible: true,
    isFloating: false,
  },
  {
    id: "members",
    tabName: "Members",
    route: "/members",
    iconUrl: null,
    floatingIconUrl: null,
    headerLogoUrl: null,
    fallbackIcon: "Users",
    title: "Poipu Shores Members",
    subtitle: "Connect with neighbors",
    order: 8,
    isVisible: true,
    isFloating: false,
  },
  {
    id: "settings",
    tabName: "Settings",
    route: "/settings",
    iconUrl: null,
    floatingIconUrl: null,
    headerLogoUrl: null,
    fallbackIcon: "Settings",
    title: "Settings",
    subtitle: "App configuration",
    order: 9,
    isVisible: true,
    isFloating: false,
  },
  {
    id: "announcements",
    tabName: "News",
    route: "/announcements",
    iconUrl: null,
    floatingIconUrl: null,
    headerLogoUrl: null,
    fallbackIcon: "Megaphone",
    title: "Announcements",
    subtitle: "Community updates",
    order: 10,
    isVisible: true,
    isFloating: false,
  },
];

const iconOptions = [
  { value: "Home", label: "Home", Icon: Home },
  { value: "MessageSquare", label: "Message", Icon: MessageSquare },
  { value: "Camera", label: "Camera", Icon: Camera },
  { value: "FileText", label: "File", Icon: FileText },
  { value: "User", label: "User", Icon: User },
  { value: "Bird", label: "Bird", Icon: Bird },
  { value: "Users", label: "Users", Icon: Users },
  { value: "Settings", label: "Settings", Icon: Settings },
  { value: "MoreHorizontal", label: "More", Icon: MoreHorizontal },
  { value: "Megaphone", label: "Megaphone", Icon: Megaphone },
];

export function MobilePageConfig() {
  const [pages, setPages] = useState<MobilePage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [openPages, setOpenPages] = useState<Record<string, boolean>>({});
  const initialConfig = useRef<MobilePage[]>([]);
  const { toast } = useToast();

  const hasChanges = JSON.stringify(pages) !== JSON.stringify(initialConfig.current);

  const togglePage = (pageId: string) => {
    setOpenPages(prev => ({ ...prev, [pageId]: !prev[pageId] }));
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('app_settings')
        .select('setting_value')
        .eq('setting_key', 'mobile_pages_config')
        .maybeSingle();

      if (data?.setting_value) {
        const config = data.setting_value as any;
        if (config?.pages) {
          // Use saved pages directly from database
          const savedPages = config.pages as MobilePage[];
          
          // Backward compatibility: Add routes to saved pages that don't have them
          const pagesWithRoutes = savedPages.map(savedPage => {
            if (!savedPage.route) {
              const defaultPage = defaultPages.find(dp => dp.id === savedPage.id);
              return { ...savedPage, route: defaultPage?.route || "/" };
            }
            return savedPage;
          });
          
          // Add any new default pages that don't exist in saved config
          const savedPageIds = pagesWithRoutes.map(p => p.id);
          const newPages = defaultPages.filter(dp => !savedPageIds.includes(dp.id));
          
          // Combine saved pages with any new pages
          const allPages = [...pagesWithRoutes, ...newPages];
          setPages(allPages);
          initialConfig.current = allPages;
        } else {
          // No saved config, use defaults
          setPages(defaultPages);
          initialConfig.current = defaultPages;
        }
      } else {
        // No saved config, use defaults
        setPages(defaultPages);
        initialConfig.current = defaultPages;
      }
    } catch (error) {
      console.error('Error fetching config:', error);
      setPages(defaultPages);
      initialConfig.current = defaultPages;
    } finally {
      setLoading(false);
    }
  };

  const convertToPng = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }
          
          ctx.drawImage(img, 0, 0);
          URL.revokeObjectURL(url);
          
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to convert image to PNG'));
            }
          }, 'image/png');
        } catch (error) {
          URL.revokeObjectURL(url);
          reject(error);
        }
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };
      
      img.src = url;
    });
  };

  const handleIconUpload = async (pageId: string, file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    setUploading(`icon-${pageId}`);
    try {
      const pngBlob = await convertToPng(file);
      const fileName = `mobile-icon-${pageId}.png`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, pngBlob, {
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Add cache-busting timestamp
      const iconUrl = `${publicUrl}?t=${Date.now()}`;

      const updatedPages = pages.map(p => 
        p.id === pageId ? { ...p, iconUrl } : p
      );
      setPages(updatedPages);

      // Auto-save to database
      await supabase
        .from('app_settings')
        .upsert([{
          setting_key: 'mobile_pages_config',
          setting_value: { pages: updatedPages } as any,
        }], {
          onConflict: 'setting_key',
        });

      toast({
        title: "Success",
        description: "Icon uploaded and saved successfully",
      });
      
      // Refetch to ensure UI is in sync
      await fetchConfig();
    } catch (error: any) {
      console.error('Error uploading icon:', error);
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(null);
    }
  };

  const handleFloatingIconUpload = async (pageId: string, file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    setUploading(`floating-${pageId}`);
    try {
      const pngBlob = await convertToPng(file);
      const fileName = `mobile-floating-${pageId}.png`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, pngBlob, {
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Add cache-busting timestamp
      const floatingIconUrl = `${publicUrl}?t=${Date.now()}`;

      const updatedPages = pages.map(p => 
        p.id === pageId ? { ...p, floatingIconUrl } : p
      );
      setPages(updatedPages);

      // Auto-save to database
      await supabase
        .from('app_settings')
        .upsert([{
          setting_key: 'mobile_pages_config',
          setting_value: { pages: updatedPages } as any,
        }], {
          onConflict: 'setting_key',
        });

      toast({
        title: "Success",
        description: "Floating icon uploaded and saved successfully",
      });
      
      // Refetch to ensure UI is in sync
      await fetchConfig();
    } catch (error: any) {
      console.error('Error uploading floating icon:', error);
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(null);
    }
  };

  const handleHeaderLogoUpload = async (pageId: string, file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    setUploading(`header-${pageId}`);
    try {
      const pngBlob = await convertToPng(file);
      const fileName = `mobile-header-${pageId}.png`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, pngBlob, {
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Add cache-busting timestamp
      const headerLogoUrl = `${publicUrl}?t=${Date.now()}`;

      const updatedPages = pages.map(p => 
        p.id === pageId ? { ...p, headerLogoUrl } : p
      );
      setPages(updatedPages);

      // Auto-save to database
      await supabase
        .from('app_settings')
        .upsert([{
          setting_key: 'mobile_pages_config',
          setting_value: { pages: updatedPages } as any,
        }], {
          onConflict: 'setting_key',
        });

      toast({
        title: "Success",
        description: "Header logo uploaded and saved successfully",
      });
      
      // Refetch to ensure UI is in sync
      await fetchConfig();
    } catch (error: any) {
      console.error('Error uploading header logo:', error);
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await supabase
        .from('app_settings')
        .upsert([{
          setting_key: 'mobile_pages_config',
          setting_value: { pages } as any,
        }], {
          onConflict: 'setting_key',
        });

      toast({
        title: "Success",
        description: "Mobile page configuration saved successfully",
      });
      
      // Update initial config to match saved state
      initialConfig.current = pages;
    } catch (error: any) {
      toast({
        title: "Save failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} URL copied to clipboard`,
    });
  };

  const updatePage = (pageId: string, updates: Partial<MobilePage>) => {
    setPages(prev => prev.map(p => {
      // If setting isFloating to true, unset all other pages' isFloating
      if (updates.isFloating === true && p.id !== pageId) {
        return { ...p, isFloating: false };
      }
      return p.id === pageId ? { ...p, ...updates } : p;
    }));
  };

  const handleDiscard = () => {
    setPages(initialConfig.current);
    toast({
      title: "Changes discarded",
      description: "All changes have been reverted",
    });
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setPages((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        
        const newItems = arrayMove(items, oldIndex, newIndex);
        
        // Update order numbers based on new positions
        const updatedItems = newItems.map((item, index) => ({
          ...item,
          order: index + 1,
        }));
        
        return updatedItems;
      });
    }
  };

  const sortedPages = [...pages].sort((a, b) => a.order - b.order);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sortedPages.map(p => p.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            {sortedPages.map((page) => {
              const IconComponent = iconOptions.find(i => i.value === page.fallbackIcon)?.Icon || Home;
              
              return (
                <SortableMobilePage
                  key={page.id}
                  page={page}
                  isOpen={openPages[page.id] || false}
                  onToggle={() => togglePage(page.id)}
                  onUpdate={(updates) => updatePage(page.id, updates)}
                  onIconUpload={(file) => handleIconUpload(page.id, file)}
                  onFloatingIconUpload={(file) => handleFloatingIconUpload(page.id, file)}
                  onHeaderLogoUpload={(file) => handleHeaderLogoUpload(page.id, file)}
                  onCopyUrl={copyToClipboard}
                  uploading={uploading}
                  IconComponent={IconComponent}
                  iconOptions={iconOptions}
                />
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      <StickyActionBar
        hasChanges={hasChanges}
        onSave={handleSave}
        onDiscard={handleDiscard}
        saving={saving}
      />
    </div>
  );
}
