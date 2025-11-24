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
import { Loader2, Sparkles, Upload, Save } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";

interface BackgroundSetting {
  type: "default" | "generated" | "uploaded" | "color" | "gradient";
  url: string | null;
  opacity: number;
  color?: string;
  gradientStart?: string;
  gradientEnd?: string;
  gradientDirection?: string;
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
  const [hasChanges, setHasChanges] = useState(false);
  const [initialHomeBackground, setInitialHomeBackground] = useState<BackgroundSetting | null>(null);
  const [initialAppBackground, setInitialAppBackground] = useState<BackgroundSetting | null>(null);
  const [useSameBackground, setUseSameBackground] = useState(false);

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
      setInitialHomeBackground(value);
    }
    if (appData?.setting_value) {
      const value = appData.setting_value as any;
      setAppBackground(value);
      setInitialAppBackground(value);
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

      setInitialHomeBackground(homeBackground);
      setInitialAppBackground(appBackground);
      setHasChanges(false);
      toast.success("Settings saved successfully!");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const homeChanged = JSON.stringify(homeBackground) !== JSON.stringify(initialHomeBackground);
    const appChanged = JSON.stringify(appBackground) !== JSON.stringify(initialAppBackground);
    setHasChanges(homeChanged || appChanged);
  }, [homeBackground, appBackground, initialHomeBackground, initialAppBackground]);

  useEffect(() => {
    if (useSameBackground) {
      setAppBackground(homeBackground);
    }
  }, [useSameBackground, homeBackground]);

  if (!isAdmin) return null;

  const renderBackgroundTabs = (
    background: BackgroundSetting,
    setBackground: React.Dispatch<React.SetStateAction<BackgroundSetting>>,
    prompt: string,
    setPrompt: React.Dispatch<React.SetStateAction<string>>,
    isGenerating: boolean,
    type: "home" | "app"
  ) => (
    <Tabs defaultValue="ai" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="ai">AI</TabsTrigger>
        <TabsTrigger value="photos">Photos</TabsTrigger>
        <TabsTrigger value="colors">Colors</TabsTrigger>
        <TabsTrigger value="transparency">Transparency</TabsTrigger>
      </TabsList>

      <TabsContent value="ai" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Generate with AI</CardTitle>
            <CardDescription>Use Lovable AI to create a custom background</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`${type}-prompt`}>Describe your background</Label>
              <Input
                id={`${type}-prompt`}
                placeholder="e.g., Beautiful Hawaiian beach at sunset with palm trees"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </div>
            <Button
              onClick={() => generateBackground(prompt, type)}
              disabled={!prompt || isGenerating}
            >
              {isGenerating ? (
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
            {background.url && background.url.trim() !== "" && background.type === "generated" && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-2">Preview:</p>
                <img
                  src={background.url}
                  alt="Background preview"
                  className="w-full h-48 object-cover rounded-lg"
                  onError={(e) => {
                    console.error("Failed to load image:", background.url);
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="photos" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Choose from Uploaded Photos</CardTitle>
            <CardDescription>Select from community photos</CardDescription>
          </CardHeader>
          <CardContent>
            {photos.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No community photos available yet</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="relative cursor-pointer group"
                    onClick={() => selectPhoto(photo.file_path, type)}
                  >
                    <img
                      src={supabase.storage.from("community_photos").getPublicUrl(photo.file_path).data.publicUrl}
                      alt={photo.title}
                      className="w-full h-32 object-cover rounded-lg group-hover:opacity-75 transition-opacity"
                      onError={(e) => {
                        e.currentTarget.src = "https://placehold.co/400x300?text=Image+Not+Found";
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Upload className="h-8 w-8 text-white" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="colors" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Solid Color</CardTitle>
            <CardDescription>Choose a solid background color</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Select Color</Label>
              <Input
                type="color"
                value={background.color || "#ffffff"}
                onChange={(e) =>
                  setBackground((prev) => ({
                    ...prev,
                    type: "color",
                    color: e.target.value,
                    url: null,
                  }))
                }
                className="h-12 w-full cursor-pointer"
              />
            </div>
            {background.type === "color" && (
              <div className="h-24 rounded-lg" style={{ backgroundColor: background.color }} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gradient</CardTitle>
            <CardDescription>Create a gradient background</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Color</Label>
                <Input
                  type="color"
                  value={background.gradientStart || "#ffffff"}
                  onChange={(e) =>
                    setBackground((prev) => ({
                      ...prev,
                      type: "gradient",
                      gradientStart: e.target.value,
                      url: null,
                    }))
                  }
                  className="h-12 w-full cursor-pointer"
                />
              </div>
              <div className="space-y-2">
                <Label>End Color</Label>
                <Input
                  type="color"
                  value={background.gradientEnd || "#000000"}
                  onChange={(e) =>
                    setBackground((prev) => ({
                      ...prev,
                      type: "gradient",
                      gradientEnd: e.target.value,
                      url: null,
                    }))
                  }
                  className="h-12 w-full cursor-pointer"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Direction</Label>
              <select
                value={background.gradientDirection || "to bottom"}
                onChange={(e) =>
                  setBackground((prev) => ({
                    ...prev,
                    gradientDirection: e.target.value,
                  }))
                }
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              >
                <option value="to bottom">Top to Bottom</option>
                <option value="to right">Left to Right</option>
                <option value="to bottom right">Diagonal ↘</option>
                <option value="to bottom left">Diagonal ↙</option>
              </select>
            </div>
            {background.type === "gradient" && background.gradientStart && background.gradientEnd && (
              <div
                className="h-24 rounded-lg"
                style={{
                  background: `linear-gradient(${background.gradientDirection || "to bottom"}, ${
                    background.gradientStart
                  }, ${background.gradientEnd})`,
                }}
              />
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="transparency" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Transparency</CardTitle>
            <CardDescription>Adjust background opacity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Opacity: {background.opacity}%</Label>
              </div>
              <Slider
                value={[background.opacity]}
                onValueChange={([value]) =>
                  setBackground((prev) => ({ ...prev, opacity: value }))
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
  );

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Background Settings</h1>
          <p className="text-muted-foreground">Customize the backgrounds for your application</p>
        </div>
        {hasChanges && (
          <Button onClick={saveSettings} disabled={isSaving} size="lg">
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        )}
      </div>

      <div className="mb-6 flex items-center space-x-2 p-4 bg-card rounded-lg border">
        <Switch
          id="same-background"
          checked={useSameBackground}
          onCheckedChange={setUseSameBackground}
        />
        <Label htmlFor="same-background" className="cursor-pointer">
          Use same background for both Home Screen and App Background
        </Label>
      </div>

      <Tabs defaultValue="home" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="home">Home Screen</TabsTrigger>
          <TabsTrigger value="app" disabled={useSameBackground}>App Background</TabsTrigger>
        </TabsList>

        <TabsContent value="home">
          {renderBackgroundTabs(
            homeBackground,
            setHomeBackground,
            homePrompt,
            setHomePrompt,
            isGeneratingHome,
            "home"
          )}
        </TabsContent>

        <TabsContent value="app">
          {renderBackgroundTabs(
            appBackground,
            setAppBackground,
            appPrompt,
            setAppPrompt,
            isGeneratingApp,
            "app"
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}