import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Upload, X } from "lucide-react";
import { formatPhoneInput } from "@/lib/phoneUtils";
import { z } from "zod";

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
      setFullName(data.full_name || "");
      setUnitNumber(data.unit_number || "");
      setPhone(data.phone || "");
      setShowContactInfo(data.show_contact_info ?? true);
      setAvatarUrl(data.avatar_url || null);
    }
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
          unit_number: unitNumber,
          phone: phone.replace(/\D/g, ""), // Store only digits
          show_contact_info: showContactInfo,
          avatar_url: uploadedAvatarUrl,
        })
        .eq("id", user.id);

      if (error) throw error;

      setAvatarUrl(uploadedAvatarUrl);
      setAvatarFile(null);
      setAvatarPreview(null);

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
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-3xl font-bold text-foreground">My Profile</h2>
        <p className="text-lg text-muted-foreground">
          Manage your personal information
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Profile Information</CardTitle>
          <CardDescription className="text-lg">
            Update your personal details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-lg">Profile Photo</Label>
              <div className="flex items-center gap-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={avatarPreview || avatarUrl || ""} />
                  <AvatarFallback className="text-2xl">
                    {fullName.split(" ").map(n => n[0]).join("").toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="avatar" className="cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                      <Upload className="h-4 w-4" />
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
                      <X className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Max size: 5MB. Supported formats: JPG, PNG, WEBP, GIF
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-lg">Email</Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ""}
                disabled
                className="text-lg p-6"
              />
              <p className="text-base text-muted-foreground">
                Email cannot be changed
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-lg">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="text-lg p-6"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="unitNumber" className="text-lg">Unit Number</Label>
              <Input
                id="unitNumber"
                type="text"
                value={unitNumber}
                onChange={(e) => setUnitNumber(e.target.value)}
                className="text-lg p-6"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-lg">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="(808) 555-1234"
                className="text-lg p-6"
              />
              <p className="text-sm text-muted-foreground">
                Format: (XXX) XXX-XXXX
              </p>
            </div>
            
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="showContact" className="text-lg">Show Contact Info in Members Directory</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow other members to see your phone number in the community directory
                  </p>
                </div>
                <Switch
                  id="showContact"
                  checked={showContactInfo}
                  onCheckedChange={setShowContactInfo}
                />
              </div>
            </div>
            
            <Button type="submit" className="w-full text-lg py-6" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Change Password</CardTitle>
          <CardDescription className="text-lg">
            Update your password to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-lg">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="text-lg p-6"
                placeholder="Enter new password"
              />
              <p className="text-sm text-muted-foreground">
                Must be at least 6 characters
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-lg">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="text-lg p-6"
                placeholder="Confirm new password"
              />
            </div>
            
            <Button type="submit" className="w-full text-lg py-6" disabled={passwordLoading}>
              {passwordLoading ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;