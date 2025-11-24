import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Sparkles, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BackgroundSetting {
  type: "default" | "generated" | "uploaded";
  url: string | null;
  opacity: number;
}

interface CommunityPhoto {
  id: string;
  file_path: string;
  title: string;
}

export default function Settings() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [homeBackground, setHomeBackground] = useState<BackgroundSetting>({
    type: "default",
    url: null,
    opacity: 100,
  });
  const [appBackground, setAppBackground] = useState<BackgroundSetting>({
    type: "default",
    url: null,
    opacity: 100,
  });
  const [homePrompt, setHomePrompt] = useState("");
  const [appPrompt, setAppPrompt] = useState("");
  const [isGeneratingHome, setIsGeneratingHome] = useState(false);
  const [isGeneratingApp, setIsGeneratingApp] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [photos, setPhotos] = useState<CommunityPhoto[]>([]);

  useEffect(() => {
    if (!isAdmin) {
      navigate("/dashboard");
      return;
    }
    fetchSettings();
    fetchPhotos();
  }, [isAdmin, navigate]);

  const fetchSettings = async () => {
    const { data: homeData } = await supabase
      .from("app_settings")
      .select("setting_value")
      .eq("setting_key", "home_background")
      .single();

    const { data: appData } = await supabase
      .from("app_settings")
      .select("setting_value")
      .eq("setting_key", "app_background")
      .single();

    if (homeData?.setting_value) {
      const value = homeData.setting_value as any;
      setHomeBackground(value);
    }
    if (appData?.setting_value) {
      const value = appData.setting_value as any;
      setAppBackground(value);
    }
  };

  const fetchPhotos = async () => {
    const { data } = await supabase
      .from("community_photos")
      .select("id, file_path, title")
      .eq("is_approved", true)
      .order("created_at", { ascending: false });

    if (data) setPhotos(data);
  };

  const generateBackground = async (prompt: string, type: "home" | "app") => {
    const setIsGenerating = type === "home" ? setIsGeneratingHome : setIsGeneratingApp;
    const setBackground = type === "home" ? setHomeBackground : setAppBackground;

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-background", {
        body: { prompt },
      });

      if (error) throw error;

      if (data?.imageUrl) {
        setBackground((prev) => ({
          ...prev,
          type: "generated",
          url: data.imageUrl,
        }));
        toast.success("Background generated successfully!");
      }
    } catch (error: any) {
      console.error("Error generating background:", error);
      toast.error(error.message || "Failed to generate background");
    } finally {
      setIsGenerating(false);
    }
  };

  const selectPhoto = (photoPath: string, type: "home" | "app") => {
    const setBackground = type === "home" ? setHomeBackground : setAppBackground;
    const publicUrl = supabase.storage.from("community_photos").getPublicUrl(photoPath).data.publicUrl;

    setBackground((prev) => ({
      ...prev,
      type: "uploaded",
      url: publicUrl,
    }));
    toast.success("Photo selected!");
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      
      const homeUpdate = {
        setting_key: "home_background",
        setting_value: homeBackground as any,
        updated_by: user?.id,
      };
      
      const appUpdate = {
        setting_key: "app_background",
        setting_value: appBackground as any,
        updated_by: user?.id,
      };

      const { error: homeError } = await supabase
        .from("app_settings")
        .update(homeUpdate)
        .eq("setting_key", "home_background");

      if (homeError) throw homeError;

      const { error: appError } = await supabase
        .from("app_settings")
        .update(appUpdate)
        .eq("setting_key", "app_background");

      if (appError) throw appError;

      toast.success("Settings saved successfully!");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Background Settings</h1>
        <p className="text-muted-foreground">Customize the backgrounds for your application</p>
      </div>

      <Tabs defaultValue="home" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="home">Home Screen</TabsTrigger>
          <TabsTrigger value="app">App Background</TabsTrigger>
        </TabsList>

        <TabsContent value="home" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Generate with AI</CardTitle>
              <CardDescription>Use Lovable AI to create a custom background</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="home-prompt">Describe your background</Label>
                <Input
                  id="home-prompt"
                  placeholder="e.g., Beautiful Hawaiian beach at sunset with palm trees"
                  value={homePrompt}
                  onChange={(e) => setHomePrompt(e.target.value)}
                />
              </div>
              <Button
                onClick={() => generateBackground(homePrompt, "home")}
                disabled={!homePrompt || isGeneratingHome}
              >
                {isGeneratingHome ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Background
                  </>
                )}
              </Button>
              {homeBackground.url && (
                <div className="mt-4">
                  <img
                    src={homeBackground.url}
                    alt="Home background preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Choose from Uploaded Photos</CardTitle>
              <CardDescription>Select from community photos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="relative cursor-pointer group"
                    onClick={() => selectPhoto(photo.file_path, "home")}
                  >
                    <img
                      src={supabase.storage.from("community_photos").getPublicUrl(photo.file_path).data.publicUrl}
                      alt={photo.title}
                      className="w-full h-32 object-cover rounded-lg group-hover:opacity-75 transition-opacity"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Upload className="h-8 w-8 text-white" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Transparency</CardTitle>
              <CardDescription>Adjust background opacity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Opacity: {homeBackground.opacity}%</Label>
                </div>
                <Slider
                  value={[homeBackground.opacity]}
                  onValueChange={([value]) =>
                    setHomeBackground((prev) => ({ ...prev, opacity: value }))
                  }
                  min={0}
                  max={100}
                  step={1}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="app" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Generate with AI</CardTitle>
              <CardDescription>Use Lovable AI to create a custom background</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="app-prompt">Describe your background</Label>
                <Input
                  id="app-prompt"
                  placeholder="e.g., Subtle gradient with tropical theme"
                  value={appPrompt}
                  onChange={(e) => setAppPrompt(e.target.value)}
                />
              </div>
              <Button
                onClick={() => generateBackground(appPrompt, "app")}
                disabled={!appPrompt || isGeneratingApp}
              >
                {isGeneratingApp ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Background
                  </>
                )}
              </Button>
              {appBackground.url && (
                <div className="mt-4">
                  <img
                    src={appBackground.url}
                    alt="App background preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Choose from Uploaded Photos</CardTitle>
              <CardDescription>Select from community photos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="relative cursor-pointer group"
                    onClick={() => selectPhoto(photo.file_path, "app")}
                  >
                    <img
                      src={supabase.storage.from("community_photos").getPublicUrl(photo.file_path).data.publicUrl}
                      alt={photo.title}
                      className="w-full h-32 object-cover rounded-lg group-hover:opacity-75 transition-opacity"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Upload className="h-8 w-8 text-white" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Transparency</CardTitle>
              <CardDescription>Adjust background opacity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Opacity: {appBackground.opacity}%</Label>
                </div>
                <Slider
                  value={[appBackground.opacity]}
                  onValueChange={([value]) =>
                    setAppBackground((prev) => ({ ...prev, opacity: value }))
                  }
                  min={0}
                  max={100}
                  step={1}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-8 flex justify-end">
        <Button onClick={saveSettings} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Settings"
          )}
        </Button>
      </div>
    </div>
  );
}