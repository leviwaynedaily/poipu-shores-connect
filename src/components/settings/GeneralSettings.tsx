import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Save } from "lucide-react";

export function GeneralSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    app_name: "",
    app_description: "",
    support_email: "",
    support_phone: "",
    address: "",
    welcome_message: "",
  });

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

      setSettings({
        app_name: settingsMap.app_name || "",
        app_description: settingsMap.app_description || "",
        support_email: settingsMap.support_email || "",
        support_phone: settingsMap.support_phone || "",
        address: settingsMap.address || "",
        welcome_message: settingsMap.welcome_message || "",
      });
    } catch (error: any) {
      toast.error("Failed to load settings: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
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

      toast.success("Settings saved successfully");
    } catch (error: any) {
      toast.error("Failed to save settings: " + error.message);
    } finally {
      setSaving(false);
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
    <Card>
      <CardHeader>
        <CardTitle>General Application Settings</CardTitle>
        <CardDescription>Configure general application settings and information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 md:space-y-6">
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

        <div className="flex justify-end pt-2">
          <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
