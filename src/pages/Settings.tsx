import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useBackground } from "@/contexts/BackgroundContext";
import { useTheme } from "@/contexts/ThemeContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Sparkles, Upload, Save, X } from "lucide-react";
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
  const { isGlassTheme, toggleGlassTheme, glassIntensity, setGlassIntensity } = useTheme();
  const {
    homeBackground: contextHomeBackground,
    appBackground: contextAppBackground,
    setHomeBackground: setContextHomeBackground,
    setAppBackground: setContextAppBackground,
    refreshBackgrounds,
  } = useBackground();
  
  const [homeBackground, setHomeBackground] = useState(contextHomeBackground);
  const [appBackground, setAppBackground] = useState(contextAppBackground);
  const [localGlassIntensity, setLocalGlassIntensity] = useState(glassIntensity);
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
  const [initialGlassIntensity, setInitialGlassIntensity] = useState(glassIntensity);

  const handleGlassIntensityChange = (value: number[]) => {
    setLocalGlassIntensity(value[0]);
    setGlassIntensity(value[0]);
  };

  useEffect(() => {
    if (!isAdmin) {
      navigate("/dashboard");
      return;
    }
    fetchSettings();
    fetchPhotos();
  }, [isAdmin, navigate]);

  useEffect(() => {
    setContextHomeBackground(homeBackground);
  }, [homeBackground]);

  useEffect(() => {
    setContextAppBackground(appBackground);
  }, [appBackground]);

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

  const uploadCustomPhoto = async (file: File, type: "home" | "app") => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    const setBackground = type === "home" ? setHomeBackground : setAppBackground;
    
    try {
      const user = (await supabase.auth.getUser()).data.user;
      const fileExt = file.name.split(".").pop();
      const fileName = `${user?.id}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from("community_photos")
        .upload(fileName, file);

      if (error) throw error;

      const publicUrl = supabase.storage
        .from("community_photos")
        .getPublicUrl(fileName).data.publicUrl;

      setBackground((prev) => ({
        ...prev,
        type: "uploaded",
        url: publicUrl,
      }));
      
      toast.success("Photo uploaded successfully!");
    } catch (error: any) {
      console.error("Error uploading photo:", error);
      toast.error("Failed to upload photo");
    }
  };

  const clearBackground = (type: "home" | "app") => {
    const setBackground = type === "home" ? setHomeBackground : setAppBackground;
    setBackground({
      type: "default",
      url: null,
      opacity: 100,
    });
    toast.success("Background cleared!");
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
      setInitialGlassIntensity(localGlassIntensity);
      setHasChanges(false);
      await refreshBackgrounds();
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
    const intensityChanged = localGlassIntensity !== initialGlassIntensity;
    setHasChanges(homeChanged || appChanged || intensityChanged);
  }, [homeBackground, appBackground, initialHomeBackground, initialAppBackground, localGlassIntensity, initialGlassIntensity]);

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
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Generated Preview</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => clearBackground(type)}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Clear
                  </Button>
                </div>
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
            <CardDescription>Upload your own photo or select from community photos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Upload Custom Photo</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadCustomPhoto(file, type);
                }}
                className="cursor-pointer"
              />
            </div>

            {(background.type === "uploaded" || background.type === "generated") && background.url && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Current Background</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => clearBackground(type)}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Clear
                  </Button>
                </div>
                <div className="relative">
                  <img
                    src={background.url}
                    alt="Current background"
                    className="w-full h-32 object-cover rounded-lg"
                    onError={(e) => {
                      e.currentTarget.src = "https://placehold.co/400x300?text=Image+Not+Found";
                    }}
                  />
                </div>
              </div>
            )}
            {photos.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No community photos available yet. Upload photos in the Photos section.</p>
            ) : (
              <div className="space-y-2">
                <Label>Select a Photo</Label>
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
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-lg">
                        <Upload className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  ))}
                </div>
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
              <div className="flex items-center justify-between">
                <Label>Select Color</Label>
                {background.type === "color" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => clearBackground(type)}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Clear
                  </Button>
                )}
              </div>
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
            {background.type === "gradient" && (
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => clearBackground(type)}
                >
                  <X className="mr-2 h-4 w-4" />
                  Clear
                </Button>
              </div>
            )}
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
          <h1 className="text-4xl font-bold mb-2">Theme Settings</h1>
          <p className="text-muted-foreground">Customize your app's theme and backgrounds</p>
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="theme">Theme Mode</TabsTrigger>
          <TabsTrigger value="home">Home Screen</TabsTrigger>
          <TabsTrigger value="app" disabled={useSameBackground}>App Background</TabsTrigger>
        </TabsList>

        <TabsContent value="theme">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Theme Mode
              </CardTitle>
              <CardDescription>
                Choose between Classic and Glass theme modes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Current Mode</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={toggleGlassTheme}
                    variant={!isGlassTheme ? "default" : "outline"}
                    className="w-full"
                  >
                    Classic Mode
                  </Button>
                  <Button
                    onClick={toggleGlassTheme}
                    variant={isGlassTheme ? "default" : "outline"}
                    className="w-full"
                  >
                    ✨ Glass Mode
                  </Button>
                </div>
              </div>

              {isGlassTheme && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Glass Effect Intensity</Label>
                    <span className="text-sm text-muted-foreground">{localGlassIntensity}%</span>
                  </div>
                  <Slider
                    value={[localGlassIntensity]}
                    onValueChange={handleGlassIntensityChange}
                    min={0}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Adjust card opacity (0% = transparent glass, 100% = completely solid)
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

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