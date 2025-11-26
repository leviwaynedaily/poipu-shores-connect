import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Save, User, Lock, RotateCcw } from "lucide-react";
import { formatPhoneInput } from "@/lib/phoneUtils";
import { z } from "zod";
import { OnboardingWizard } from "@/components/OnboardingWizard";

const passwordSchema = z.object({
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const Profile = () => {
  const { user, updatePassword } = useAuth();
  const { toast } = useToast();
  const [fullName, setFullName] = useState("");
  const [unitNumber, setUnitNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [showContactInfo, setShowContactInfo] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  // Track initial state for change detection
  const [initialState, setInitialState] = useState({
    fullName: "",
    unitNumber: "",
    phone: "",
    showContactInfo: true,
  });
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    
    if (data) {
      // Fetch unit numbers from unit_owners table
      const { data: unitsData } = await supabase
        .from("unit_owners")
        .select("unit_number")
        .eq("user_id", user.id);
      
      const unitNumber = unitsData?.[0]?.unit_number || "";
      
      const state = {
        fullName: data.full_name || "",
        unitNumber: unitNumber,
        phone: data.phone || "",
        showContactInfo: data.show_contact_info ?? true,
      };
      
      setFullName(state.fullName);
      setUnitNumber(state.unitNumber);
      setPhone(state.phone);
      setShowContactInfo(state.showContactInfo);
      setAvatarUrl(data.avatar_url || null);
      setInitialState(state);
    }
  };

  // Detect changes
  useEffect(() => {
    const changed = 
      fullName !== initialState.fullName ||
      unitNumber !== initialState.unitNumber ||
      phone !== initialState.phone ||
      showContactInfo !== initialState.showContactInfo ||
      avatarFile !== null;
    setHasChanges(changed);
  }, [fullName, unitNumber, phone, showContactInfo, avatarFile, initialState]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5242880) {
      toast({
        title: "Error",
        description: "Image must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "File must be an image",
        variant: "destructive",
      });
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeAvatar = async () => {
    if (!user) return;
    
    setLoading(true);
    
    try {
      // Delete from storage if exists
      if (avatarUrl) {
        const filePath = avatarUrl.split("/").pop();
        if (filePath) {
          await supabase.storage
            .from("avatars")
            .remove([`${user.id}/${filePath}`]);
        }
      }

      // Update profile
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: null })
        .eq("id", user.id);

      if (error) throw error;

      setAvatarUrl(null);
      setAvatarFile(null);
      setAvatarPreview(null);
      
      toast({
        title: "Success",
        description: "Profile photo removed",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneInput(e.target.value);
    setPhone(formatted);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    
    try {
      let uploadedAvatarUrl = avatarUrl;

      // Upload avatar if new file selected
      if (avatarFile) {
        const fileExt = avatarFile.name.split(".").pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, avatarFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("avatars")
          .getPublicUrl(filePath);

        uploadedAvatarUrl = publicUrl;
      }

      // Update profile
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          phone: phone.replace(/\D/g, ""), // Store only digits
          show_contact_info: showContactInfo,
          avatar_url: uploadedAvatarUrl,
        })
        .eq("id", user.id);

      if (error) throw error;

      // Update unit ownership if unit number changed
      if (unitNumber) {
        // First, get existing unit ownership
        const { data: existingUnits } = await supabase
          .from("unit_owners")
          .select("unit_number")
          .eq("user_id", user.id);

        const oldUnitNumber = existingUnits?.[0]?.unit_number;

        if (oldUnitNumber !== unitNumber) {
          if (oldUnitNumber) {
            // Update existing unit ownership
            await supabase
              .from("unit_owners")
              .update({ unit_number: unitNumber })
              .eq("user_id", user.id)
              .eq("unit_number", oldUnitNumber);
          } else {
            // Insert new unit ownership
            await supabase
              .from("unit_owners")
              .insert({
                user_id: user.id,
                unit_number: unitNumber,
                relationship_type: "primary",
                is_primary_contact: true,
              });
          }
        }
      }

      setAvatarUrl(uploadedAvatarUrl);
      setAvatarFile(null);
      setAvatarPreview(null);
      
      // Update initial state
      setInitialState({
        fullName,
        unitNumber,
        phone,
        showContactInfo,
      });

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      passwordSchema.parse({ newPassword, confirmPassword });
      setPasswordLoading(true);
      const { error } = await updatePassword(newPassword);
      
      if (!error) {
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl sm:text-2xl md:text-3xl">My Profile</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Manage your personal information and security
              </CardDescription>
            </div>
            {hasChanges && (
              <Button onClick={() => handleSubmit()} disabled={loading} size="sm" className="sm:size-default">
                {loading ? (
                  "Saving..."
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Save Changes</span>
                    <span className="sm:hidden">Save</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profile">
            <User className="mr-2 h-4 w-4" />
            Profile Information
          </TabsTrigger>
          <TabsTrigger value="password">
            <Lock className="mr-2 h-4 w-4" />
            Change Password
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center gap-4 pb-4 border-b">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={avatarPreview || avatarUrl || ""} />
                    <AvatarFallback className="text-lg">
                      {fullName.split(" ").map(n => n[0]).join("").toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex gap-2">
                    <Label htmlFor="avatar" className="cursor-pointer">
                      <div className="flex items-center gap-2 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                        <Upload className="h-3.5 w-3.5" />
                        <span>Upload Photo</span>
                      </div>
                      <Input
                        id="avatar"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarChange}
                      />
                    </Label>
                    {(avatarUrl || avatarPreview) && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={removeAvatar}
                        disabled={loading}
                      >
                        <X className="h-3.5 w-3.5 mr-1" />
                        Remove
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="unitNumber">Unit Number</Label>
                    <Input
                      id="unitNumber"
                      type="text"
                      value={unitNumber}
                      onChange={(e) => setUnitNumber(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={user?.email || ""}
                      disabled
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={handlePhoneChange}
                      placeholder="(808) 555-1234"
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="space-y-0.5">
                    <Label htmlFor="showContact">Show Contact Info in Members Directory</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow other members to see your phone number
                    </p>
                  </div>
                  <Switch
                    id="showContact"
                    checked={showContactInfo}
                    onCheckedChange={setShowContactInfo}
                  />
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="password">
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-4 max-w-md">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      placeholder="Enter new password (min. 6 characters)"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="Confirm new password"
                    />
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={passwordLoading}>
                    {passwordLoading ? "Updating..." : "Update Password"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Platform Tour</CardTitle>
              <CardDescription>
                Want a refresher on how to use the platform? Restart the onboarding tour.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                onClick={() => setShowOnboarding(true)}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Restart Tour
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <OnboardingWizard 
        open={showOnboarding} 
        onComplete={() => setShowOnboarding(false)}
        source="profile"
      />
    </div>
  );
};

export default Profile;
