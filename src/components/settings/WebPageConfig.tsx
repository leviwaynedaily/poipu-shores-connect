import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StickyActionBar } from "@/components/ui/sticky-action-bar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Home, Copy, ChevronDown } from "lucide-react";
import { icons } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { IconPicker } from "./IconPicker";

interface WebPage {
  id: string;
  title: string;
  subtitle?: string;
  route: string;
  icon: string;
  iconUrl: string | null;
  headerLogoUrl: string | null;
  order: number;
  isVisible: boolean;
}

const defaultPages: WebPage[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    route: "/dashboard",
    icon: "Home",
    iconUrl: null,
    headerLogoUrl: null,
    order: 1,
    isVisible: true,
  },
  {
    id: "announcements",
    title: "Announcements",
    route: "/announcements",
    icon: "Megaphone",
    iconUrl: null,
    headerLogoUrl: null,
    order: 2,
    isVisible: true,
  },
  {
    id: "chat",
    title: "Community Chat",
    route: "/chat",
    icon: "MessageSquare",
    iconUrl: null,
    headerLogoUrl: null,
    order: 3,
    isVisible: true,
  },
  {
    id: "documents",
    title: "Poipu Shores Documents",
    route: "/documents",
    icon: "FileText",
    iconUrl: null,
    headerLogoUrl: null,
    order: 4,
    isVisible: true,
  },
  {
    id: "photos",
    title: "Community Photos",
    route: "/photos",
    icon: "Camera",
    iconUrl: null,
    headerLogoUrl: null,
    order: 5,
    isVisible: true,
  },
  {
    id: "members",
    title: "Poipu Members",
    route: "/members",
    icon: "Users",
    iconUrl: null,
    headerLogoUrl: null,
    order: 6,
    isVisible: true,
  },
  {
    id: "admin-settings",
    title: "Admin Settings",
    route: "/settings",
    icon: "Settings",
    iconUrl: null,
    headerLogoUrl: null,
    order: 7,
    isVisible: true,
  },
];

// Helper to get icon component dynamically
const getIcon = (iconName: string): LucideIcon => {
  const iconEntry = icons[iconName as keyof typeof icons];
  if (
    iconEntry &&
    typeof iconEntry === "object" &&
    "$$typeof" in (iconEntry as Record<string, unknown>)
  ) {
    return iconEntry as unknown as LucideIcon;
  }
  return Home;
};

export function WebPageConfig() {
  const [pages, setPages] = useState<WebPage[]>(defaultPages);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [openPages, setOpenPages] = useState<Record<string, boolean>>({});
  const initialConfig = useRef<WebPage[]>(defaultPages);
  const { toast } = useToast();

  const hasChanges = JSON.stringify(pages) !== JSON.stringify(initialConfig.current);

  const togglePage = (pageId: string) => {
    setOpenPages(prev => ({ ...prev, [pageId]: !prev[pageId] }));
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    const { data } = await supabase
      .from('app_settings')
      .select('setting_value')
      .eq('setting_key', 'web_pages_config')
      .maybeSingle();

    if (data?.setting_value) {
      const config = data.setting_value as any;
      if (config?.pages) {
        // Merge saved pages with defaults to ensure new pages appear
        const savedPages = config.pages as WebPage[];
        const savedPageIds = savedPages.map((p: WebPage) => p.id);
        
        // Find any new default pages that aren't in saved config
        const newPages = defaultPages.filter(dp => !savedPageIds.includes(dp.id));
        
        // Combine: saved pages first, then any new defaults
        const allPages = [...savedPages, ...newPages];
        setPages(allPages);
        initialConfig.current = allPages;
      }
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
      const fileName = `web-icon-${pageId}.png`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, pngBlob, {
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setPages(prev => prev.map(p => 
        p.id === pageId ? { ...p, iconUrl: `${publicUrl}?t=${Date.now()}` } : p
      ));

      toast({
        title: "Success",
        description: "Sidebar icon uploaded successfully",
      });
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
      const fileName = `web-header-${pageId}.png`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, pngBlob, {
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setPages(prev => prev.map(p => 
        p.id === pageId ? { ...p, headerLogoUrl: `${publicUrl}?t=${Date.now()}` } : p
      ));

      toast({
        title: "Success",
        description: "Header logo uploaded successfully",
      });
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
          setting_key: 'web_pages_config',
          setting_value: { pages } as any,
        }], {
          onConflict: 'setting_key',
        });

      toast({
        title: "Success",
        description: "Web page configuration saved. Refreshing...",
      });
      
      // Update initial config to match saved state
      initialConfig.current = pages;
      
      setTimeout(() => {
        window.location.reload();
      }, 1000);
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

  const updatePage = (pageId: string, updates: Partial<WebPage>) => {
    setPages(prev => prev.map(p => 
      p.id === pageId ? { ...p, ...updates } : p
    ));
  };

  const handleDiscard = () => {
    setPages(initialConfig.current);
    toast({
      title: "Changes discarded",
      description: "All changes have been reverted",
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {pages
          .sort((a, b) => a.order - b.order)
          .map((page) => {
            const IconComponent = getIcon(page.icon);
            
            return (
              <Collapsible key={page.id} open={openPages[page.id]} onOpenChange={() => togglePage(page.id)}>
                <Card>
                  <CollapsibleTrigger className="w-full">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <ChevronDown className={`h-4 w-4 transition-transform ${openPages[page.id] ? 'rotate-180' : ''}`} />
                          {page.iconUrl ? (
                            <img 
                              src={`${page.iconUrl}?t=${Date.now()}`} 
                              alt={`${page.id} icon`} 
                              className="h-5 w-5 object-contain"
                            />
                          ) : (
                            <IconComponent className="h-5 w-5 text-muted-foreground" />
                          )}
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-normal text-muted-foreground">#{page.order}</span>
                            <CardTitle className="text-base">{page.title}</CardTitle>
                          </div>
                        </div>
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <Label className="text-xs">Visible</Label>
                          <Switch
                            checked={page.isVisible}
                            onCheckedChange={(checked) => updatePage(page.id, { isVisible: checked })}
                          />
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="space-y-4 pt-0">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Sidebar Icon Section */}
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold">Sidebar Icon</Label>
                      <CardDescription className="text-xs">Recommended: 20-24px square</CardDescription>
                      
                      {page.iconUrl && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-center p-4 rounded-md border border-border bg-muted/30">
                            <img 
                              src={`${page.iconUrl}?t=${Date.now()}`} 
                              alt={`${page.id} icon`} 
                              className="h-6 w-6 object-contain"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Fixed URL</Label>
                            <div className="flex gap-2">
                              <code className="flex-1 text-xs bg-muted px-2 py-1.5 rounded overflow-x-auto block">
                                https://api.poipu-shores.com/storage/v1/object/public/avatars/web-icon-{page.id}.png
                              </code>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => copyToClipboard(`https://api.poipu-shores.com/storage/v1/object/public/avatars/web-icon-${page.id}.png`, `${page.id} icon`)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {!page.iconUrl && (
                        <div className="flex items-center justify-center p-4 rounded-md border border-border bg-muted/30">
                          <IconComponent className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}

                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleIconUpload(page.id, file);
                        }}
                        disabled={uploading === `icon-${page.id}`}
                        className="text-sm"
                      />

                      <div className="space-y-2">
                        <Label className="text-xs">Fallback Icon</Label>
                        <IconPicker
                          value={page.icon}
                          onChange={(value) => updatePage(page.id, { icon: value })}
                          triggerClassName="w-full justify-start"
                        />
                      </div>
                    </div>

                    {/* Page Header Logo Section */}
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold">Page Header Logo</Label>
                      <CardDescription className="text-xs">Recommended: 120-200px wide</CardDescription>
                      
                      {page.headerLogoUrl && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-center p-4 rounded-md border border-border bg-muted/30">
                            <img 
                              src={`${page.headerLogoUrl}?t=${Date.now()}`} 
                              alt={`${page.id} header`} 
                              className="h-16 max-w-full object-contain"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Fixed URL</Label>
                            <div className="flex gap-2">
                              <code className="flex-1 text-xs bg-muted px-2 py-1.5 rounded overflow-x-auto block">
                                https://api.poipu-shores.com/storage/v1/object/public/avatars/web-header-{page.id}.png
                              </code>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => copyToClipboard(`https://api.poipu-shores.com/storage/v1/object/public/avatars/web-header-${page.id}.png`, `${page.id} header logo`)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {!page.headerLogoUrl && (
                        <div className="flex items-center justify-center p-4 rounded-md border border-border bg-muted/30 h-24">
                          <span className="text-xs text-muted-foreground">No logo uploaded</span>
                        </div>
                      )}

                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleHeaderLogoUpload(page.id, file);
                        }}
                        disabled={uploading === `header-${page.id}`}
                        className="text-sm"
                      />
                    </div>

                    {/* Page Settings */}
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label className="text-sm">Page Title</Label>
                        <Input
                          value={page.title}
                          onChange={(e) => updatePage(page.id, { title: e.target.value })}
                          placeholder="Page title"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm">Page Subtitle</Label>
                        <Input
                          value={page.subtitle || ""}
                          onChange={(e) => updatePage(page.id, { subtitle: e.target.value })}
                          placeholder="Page subtitle (optional)"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm">Display Order</Label>
                        <Select
                          value={page.order.toString()}
                          onValueChange={(value) => updatePage(page.id, { order: parseInt(value) })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                              <SelectItem key={num} value={num.toString()}>
                                {num}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="text-xs text-muted-foreground pt-2">
                        Route: <code className="bg-muted px-1 py-0.5 rounded">{page.route}</code>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        );
          })}
      </div>

      <StickyActionBar
        hasChanges={hasChanges}
        onSave={handleSave}
        onDiscard={handleDiscard}
        saving={saving}
      />
    </div>
  );
}
