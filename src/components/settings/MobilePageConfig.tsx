import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload, Copy, Home, MessageSquare, Camera, FileText, User, Bird } from "lucide-react";

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
}

const defaultPages: MobilePage[] = [
  {
    id: "home",
    tabName: "Home",
    iconUrl: null,
    headerLogoUrl: null,
    fallbackIcon: "Home",
    title: "Dashboard",
    subtitle: "Welcome to Poipu Shores",
    order: 1,
    isVisible: true,
  },
  {
    id: "chat",
    tabName: "Chat",
    iconUrl: null,
    headerLogoUrl: null,
    fallbackIcon: "MessageSquare",
    title: "Community Chat",
    subtitle: "Connect with neighbors",
    order: 2,
    isVisible: true,
  },
  {
    id: "photos",
    tabName: "Photos",
    iconUrl: null,
    headerLogoUrl: null,
    fallbackIcon: "Camera",
    title: "Photo Gallery",
    subtitle: "Community photos",
    order: 3,
    isVisible: true,
  },
  {
    id: "documents",
    tabName: "Docs",
    iconUrl: null,
    headerLogoUrl: null,
    fallbackIcon: "FileText",
    title: "Documents",
    subtitle: "Important files",
    order: 4,
    isVisible: true,
  },
  {
    id: "profile",
    tabName: "Profile",
    iconUrl: null,
    headerLogoUrl: null,
    fallbackIcon: "User",
    title: "My Profile",
    subtitle: "Account settings",
    order: 5,
    isVisible: true,
  },
  {
    id: "assistant",
    tabName: "Ask",
    iconUrl: null,
    headerLogoUrl: null,
    fallbackIcon: "Bird",
    title: "Ask the Chicken",
    subtitle: "AI Assistant",
    order: 6,
    isVisible: true,
  },
];

const iconOptions = [
  { value: "Home", label: "Home", Icon: Home },
  { value: "MessageSquare", label: "Message", Icon: MessageSquare },
  { value: "Camera", label: "Camera", Icon: Camera },
  { value: "FileText", label: "File", Icon: FileText },
  { value: "User", label: "User", Icon: User },
  { value: "Bird", label: "Bird", Icon: Bird },
];

export function MobilePageConfig() {
  const [pages, setPages] = useState<MobilePage[]>(defaultPages);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    const { data } = await supabase
      .from('app_settings')
      .select('setting_value')
      .eq('setting_key', 'mobile_pages_config')
      .maybeSingle();

    if (data?.setting_value) {
      const config = data.setting_value as any;
      if (config?.pages) {
        setPages(config.pages);
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

      setPages(prev => prev.map(p => 
        p.id === pageId ? { ...p, iconUrl: publicUrl } : p
      ));

      toast({
        title: "Success",
        description: "Icon uploaded successfully",
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

      setPages(prev => prev.map(p => 
        p.id === pageId ? { ...p, headerLogoUrl: publicUrl } : p
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
          setting_key: 'mobile_pages_config',
          setting_value: { pages } as any,
        }], {
          onConflict: 'setting_key',
        });

      toast({
        title: "Success",
        description: "Mobile page configuration saved",
      });
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
    setPages(prev => prev.map(p => 
      p.id === pageId ? { ...p, ...updates } : p
    ));
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {pages
          .sort((a, b) => a.order - b.order)
          .map((page) => {
            const IconComponent = iconOptions.find(i => i.value === page.fallbackIcon)?.Icon || Home;
            
            return (
              <Card key={page.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base capitalize">{page.id}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs">Visible</Label>
                      <Switch
                        checked={page.isVisible}
                        onCheckedChange={(checked) => updatePage(page.id, { isVisible: checked })}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Tab Bar Icon Section */}
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold">Tab Bar Icon</Label>
                      <CardDescription className="text-xs">Recommended: 24-32px square</CardDescription>
                      
                      {page.iconUrl && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-center p-4 rounded-md border border-border bg-muted/30">
                            <img 
                              src={page.iconUrl} 
                              alt={`${page.id} icon`} 
                              className="h-8 w-8 object-contain"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Fixed URL</Label>
                            <div className="flex gap-2">
                              <code className="flex-1 text-xs bg-muted px-2 py-1.5 rounded overflow-x-auto block">
                                https://api.poipu-shores.com/storage/v1/object/public/avatars/mobile-icon-{page.id}.png
                              </code>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => copyToClipboard(`https://api.poipu-shores.com/storage/v1/object/public/avatars/mobile-icon-${page.id}.png`, `${page.id} icon`)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {!page.iconUrl && (
                        <div className="flex items-center justify-center p-4 rounded-md border border-border bg-muted/30">
                          <IconComponent className="h-8 w-8 text-muted-foreground" />
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
                        <Select
                          value={page.fallbackIcon}
                          onValueChange={(value) => updatePage(page.id, { fallbackIcon: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {iconOptions.map((icon) => (
                              <SelectItem key={icon.value} value={icon.value}>
                                <div className="flex items-center gap-2">
                                  <icon.Icon className="h-4 w-4" />
                                  {icon.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                              src={page.headerLogoUrl} 
                              alt={`${page.id} header`} 
                              className="h-16 max-w-full object-contain"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Fixed URL</Label>
                            <div className="flex gap-2">
                              <code className="flex-1 text-xs bg-muted px-2 py-1.5 rounded overflow-x-auto block">
                                https://api.poipu-shores.com/storage/v1/object/public/avatars/mobile-header-{page.id}.png
                              </code>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => copyToClipboard(`https://api.poipu-shores.com/storage/v1/object/public/avatars/mobile-header-${page.id}.png`, `${page.id} header logo`)}
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

                    {/* Text Fields */}
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label className="text-sm">Tab Name</Label>
                        <Input
                          value={page.tabName}
                          onChange={(e) => updatePage(page.id, { tabName: e.target.value })}
                          placeholder="Short name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm">Page Title</Label>
                        <Input
                          value={page.title}
                          onChange={(e) => updatePage(page.id, { title: e.target.value })}
                          placeholder="Page header"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm">Subtitle</Label>
                        <Input
                          value={page.subtitle}
                          onChange={(e) => updatePage(page.id, { subtitle: e.target.value })}
                          placeholder="Description"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm">Order</Label>
                        <Select
                          value={page.order.toString()}
                          onValueChange={(value) => updatePage(page.id, { order: parseInt(value) })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 5, 6].map((num) => (
                              <SelectItem key={num} value={num.toString()}>
                                {num}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Configuration"}
        </Button>
      </div>
    </div>
  );
}
