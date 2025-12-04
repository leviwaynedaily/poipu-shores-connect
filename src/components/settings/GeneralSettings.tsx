import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { StickyActionBar } from "@/components/ui/sticky-action-bar";

interface Settings {
  app_name: string;
  app_description: string;
  support_email: string;
  support_phone: string;
  address: string;
  welcome_message: string;
}

export function GeneralSettings() {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<Settings>({
    app_name: "",
    app_description: "",
    support_email: "",
    support_phone: "",
    address: "",
    welcome_message: "",
  });
  const initialSettingsRef = useRef<Settings | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("app_settings")
        .select("*");

      if (error) throw error;

      const settingsMap: any = {};
      data?.forEach((setting) => {
        settingsMap[setting.setting_key] = setting.setting_value;
      });

      const loadedSettings = {
        app_name: settingsMap.app_name || "",
        app_description: settingsMap.app_description || "",
        support_email: settingsMap.support_email || "",
        support_phone: settingsMap.support_phone || "",
        address: settingsMap.address || "",
        welcome_message: settingsMap.welcome_message || "",
      };

      setSettings(loadedSettings);
      initialSettingsRef.current = { ...loadedSettings };
    } catch (error: any) {
      toast.error("Failed to load settings: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const hasChanges = () => {
    if (!initialSettingsRef.current) return false;
    return Object.keys(settings).some(
      (key) => settings[key as keyof Settings] !== initialSettingsRef.current![key as keyof Settings]
    );
  };

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    const updates = Object.entries(settings).map(([key, value]) => ({
      setting_key: key,
      setting_value: value,
      updated_by: user?.id,
    }));

    for (const update of updates) {
      const { error } = await supabase
        .from("app_settings")
        .upsert(update, { onConflict: "setting_key" });
      
      if (error) throw error;
    }

    initialSettingsRef.current = { ...settings };
    toast.success("Settings saved");
  };

  const handleDiscard = () => {
    if (initialSettingsRef.current) {
      setSettings({ ...initialSettingsRef.current });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Loading settings...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>General Application Settings</CardTitle>
          <CardDescription>Configure general application settings and information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 md:space-y-6 pb-20">
          <div className="space-y-4 md:space-y-5">
            <div>
              <Label htmlFor="app_name">Application Name</Label>
              <Input
                id="app_name"
                value={settings.app_name}
                onChange={(e) => setSettings({ ...settings, app_name: e.target.value })}
                placeholder="Community Portal"
              />
            </div>

            <div>
              <Label htmlFor="app_description">Application Description</Label>
              <Textarea
                id="app_description"
                value={settings.app_description}
                onChange={(e) => setSettings({ ...settings, app_description: e.target.value })}
                placeholder="A portal for community members to stay connected..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="support_email">Support Email</Label>
                <Input
                  id="support_email"
                  type="email"
                  value={settings.support_email}
                  onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
                  placeholder="support@example.com"
                />
              </div>

              <div>
                <Label htmlFor="support_phone">Support Phone</Label>
                <Input
                  id="support_phone"
                  type="tel"
                  value={settings.support_phone}
                  onChange={(e) => setSettings({ ...settings, support_phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="address">Community Address</Label>
              <Textarea
                id="address"
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                placeholder="123 Main Street, City, State, ZIP"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="welcome_message">Welcome Message</Label>
              <Textarea
                id="welcome_message"
                value={settings.welcome_message}
                onChange={(e) => setSettings({ ...settings, welcome_message: e.target.value })}
                placeholder="Welcome to our community portal..."
                rows={4}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <StickyActionBar
        hasChanges={hasChanges()}
        onSave={handleSave}
        onDiscard={handleDiscard}
        autoDismissOnSuccess
      />
    </>
  );
}
