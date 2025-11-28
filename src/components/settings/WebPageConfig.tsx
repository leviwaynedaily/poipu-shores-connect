import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Home, Megaphone, MessageSquare, FileText, Camera, Users } from "lucide-react";

interface WebPage {
  id: string;
  title: string;
  route: string;
  icon: string;
  order: number;
  isVisible: boolean;
}

const defaultPages: WebPage[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    route: "/dashboard",
    icon: "Home",
    order: 1,
    isVisible: true,
  },
  {
    id: "announcements",
    title: "Announcements",
    route: "/announcements",
    icon: "Megaphone",
    order: 2,
    isVisible: true,
  },
  {
    id: "chat",
    title: "Community Chat",
    route: "/chat",
    icon: "MessageSquare",
    order: 3,
    isVisible: true,
  },
  {
    id: "documents",
    title: "Poipu Shores Documents",
    route: "/documents",
    icon: "FileText",
    order: 4,
    isVisible: true,
  },
  {
    id: "photos",
    title: "Community Photos",
    route: "/photos",
    icon: "Camera",
    order: 5,
    isVisible: true,
  },
  {
    id: "members",
    title: "Poipu Members",
    route: "/members",
    icon: "Users",
    order: 6,
    isVisible: true,
  },
];

const iconOptions = [
  { value: "Home", label: "Home", Icon: Home },
  { value: "Megaphone", label: "Megaphone", Icon: Megaphone },
  { value: "MessageSquare", label: "Message", Icon: MessageSquare },
  { value: "FileText", label: "File", Icon: FileText },
  { value: "Camera", label: "Camera", Icon: Camera },
  { value: "Users", label: "Users", Icon: Users },
];

export function WebPageConfig() {
  const [pages, setPages] = useState<WebPage[]>(defaultPages);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

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
        setPages(config.pages);
      }
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
        description: "Web page configuration saved. Refresh the page to see changes.",
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

  const updatePage = (pageId: string, updates: Partial<WebPage>) => {
    setPages(prev => prev.map(p => 
      p.id === pageId ? { ...p, ...updates } : p
    ));
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <CardDescription>
          Configure the pages shown in the sidebar. Changes will take effect after refreshing the page.
        </CardDescription>
        
        {pages
          .sort((a, b) => a.order - b.order)
          .map((page) => {
            const IconComponent = iconOptions.find(i => i.value === page.icon)?.Icon || Home;
            
            return (
              <Card key={page.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <IconComponent className="h-5 w-5 text-muted-foreground" />
                      <CardTitle className="text-base">{page.title}</CardTitle>
                    </div>
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
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm">Page Title</Label>
                      <Input
                        value={page.title}
                        onChange={(e) => updatePage(page.id, { title: e.target.value })}
                        placeholder="Page title"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm">Icon</Label>
                      <Select
                        value={page.icon}
                        onValueChange={(value) => updatePage(page.id, { icon: value })}
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
                          {[1, 2, 3, 4, 5, 6].map((num) => (
                            <SelectItem key={num} value={num.toString()}>
                              {num}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Route: <code className="bg-muted px-1 py-0.5 rounded">{page.route}</code>
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
