import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  Phone,
  Users,
  FileText,
  Image as ImageIcon,
  MessageSquare,
  Megaphone,
  Settings,
  CloudSun,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { formatPhoneInput } from "@/lib/phoneUtils";
import { useEffect } from "react";

interface OnboardingWizardProps {
  open: boolean;
  onComplete: () => void;
  source?: 'onboarding' | 'profile';
}

const TOTAL_STEPS = 6;

export const OnboardingWizard = ({ open, onComplete, source = 'onboarding' }: OnboardingWizardProps) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [showContactInfo, setShowContactInfo] = useState(true);
  const [tourSlide, setTourSlide] = useState(0);
  const [fullName, setFullName] = useState("");
  const [hasPhone, setHasPhone] = useState(false);

  // Pre-populate data and check for existing phone
  useEffect(() => {
    if (user && open) {
      const fetchProfileData = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('phone, show_contact_info, avatar_url, full_name')
          .eq('id', user.id)
          .single();
        
        if (data) {
          if (data.full_name) setFullName(data.full_name);
          if (data.phone) {
            setPhone(data.phone);
            setHasPhone(true);
          }
          setShowContactInfo(data.show_contact_info);
          if (data.avatar_url) setAvatarPreview(data.avatar_url);
        }
      };
      fetchProfileData();
    }
  }, [user, open]);

  const tourSlides = [
    {
      icon: CloudSun,
      title: "Dashboard",
      description: "Stay informed with live weather updates, beach conditions, and webcam feeds of your beautiful Poipu Shores community.",
    },
    {
      icon: FileText,
      title: "Documents",
      description: "Access important community documents, meeting minutes, bylaws, and forms all in one convenient location.",
    },
    {
      icon: ImageIcon,
      title: "Photo Gallery",
      description: "Share and enjoy photos of community events, beautiful sunsets, and memorable moments with your neighbors.",
    },
    {
      icon: MessageSquare,
      title: "Chat",
      description: "Connect with your community through organized channels and private messages with other residents.",
    },
    {
      icon: Megaphone,
      title: "Announcements",
      description: "Never miss important community updates, event notifications, and board announcements.",
    },
    {
      icon: Settings,
      title: "Settings",
      description: "Customize your profile, manage your preferences, and control your privacy settings anytime.",
    },
  ];

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image under 5MB",
        variant: "destructive",
      });
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
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

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneInput(e.target.value);
    setPhone(formatted);
  };

  const handleNext = async () => {
    if (currentStep === 2 && avatarFile) {
      // Upload avatar
      setLoading(true);
      try {
        const fileExt = avatarFile.name.split(".").pop();
        const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, avatarFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("avatars")
          .getPublicUrl(filePath);

        await supabase
          .from("profiles")
          .update({ avatar_url: publicUrl })
          .eq("id", user?.id);

        toast({
          title: "Profile photo uploaded",
          description: "Your profile photo has been set successfully",
        });
      } catch (error: any) {
        toast({
          title: "Upload failed",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    if (currentStep === 3 && !hasPhone) {
      // Save contact info only if we asked for it
      setLoading(true);
      try {
        await supabase
          .from("profiles")
          .update({ 
            phone: phone || null,
            show_contact_info: showContactInfo 
          })
          .eq("id", user?.id);

        toast({
          title: "Contact info saved",
          description: "Your contact information has been updated",
        });
      } catch (error: any) {
        toast({
          title: "Save failed",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    // Skip step 3 if user already has phone
    if (currentStep === 2 && hasPhone) {
      setCurrentStep(4);
    } else if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      // Skip step 3 when going back if user has phone
      if (currentStep === 4 && hasPhone) {
        setCurrentStep(2);
      } else {
        setCurrentStep(currentStep - 1);
      }
      if (currentStep === 4 || currentStep === 5) {
        setTourSlide(0);
      }
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      // Only mark onboarding complete if this is first-time onboarding
      if (source === 'onboarding') {
        await supabase
          .from("profiles")
          .update({ onboarding_completed: true })
          .eq("id", user?.id);

        toast({
          title: "Welcome to Poipu Shores!",
          description: "Your profile setup is complete",
        });
      } else {
        toast({
          title: "Tour completed!",
          description: "You can restart the tour anytime from your profile",
        });
      }
      onComplete();
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

  const handleSkip = async () => {
    if (currentStep === TOTAL_STEPS) {
      await handleComplete();
    } else {
      // Skip step 3 if user already has phone
      if (currentStep === 2 && hasPhone) {
        setCurrentStep(4);
      } else {
        setCurrentStep(currentStep + 1);
      }
      if (currentStep === 4 || currentStep === 5) {
        setTourSlide(0);
      }
    }
  };

  const progress = (currentStep / TOTAL_STEPS) * 100;

  return (
    <Dialog open={open} onOpenChange={source === 'profile' ? onComplete : undefined}>
      <DialogContent className="sm:max-w-2xl" hideClose={source === 'onboarding'}>
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl">Welcome to Poipu Shores</DialogTitle>
              <span className="text-sm text-muted-foreground">
                Step {currentStep} of {TOTAL_STEPS}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step 1: Welcome */}
          {currentStep === 1 && (
            <div className="space-y-6 py-8 text-center">
              <div className="mx-auto w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="w-12 h-12 text-primary" />
              </div>
              <div className="space-y-3">
                <DialogTitle className="text-2xl">
                  {fullName ? `Welcome ${fullName}!` : 'Welcome to Poipu Shores!'}
                </DialogTitle>
                <DialogDescription className="text-lg">
                  Let's get you set up! We'll guide you through customizing your profile and exploring the features of your community portal.
                </DialogDescription>
                <p className="text-sm text-muted-foreground">
                  This will only take a few minutes, and you can always update these settings later.
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Profile Photo */}
          {currentStep === 2 && (
            <div className="space-y-6 py-4">
              <DialogDescription>
                Add a profile photo so your neighbors can recognize you in the community.
              </DialogDescription>
              <div className="flex flex-col items-center gap-6">
                <Avatar className="w-32 h-32">
                  <AvatarImage src={avatarPreview || undefined} />
                  <AvatarFallback className="text-2xl">
                    <Upload className="w-12 h-12" />
                  </AvatarFallback>
                </Avatar>
                <div className="w-full max-w-xs">
                  <Label htmlFor="avatar-upload" className="cursor-pointer">
                    <div className="flex items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 hover:bg-accent hover:text-accent-foreground">
                      <Upload className="w-4 h-4" />
                      <span>Choose Photo</span>
                    </div>
                    <Input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                  </Label>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    PNG, JPG up to 5MB
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Contact Information - Only show if no phone */}
          {currentStep === 3 && !hasPhone && (
            <div className="space-y-6 py-4">
              <DialogDescription>
                Add your contact information to help neighbors reach you when needed.
              </DialogDescription>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">
                    <Phone className="w-4 h-4 inline mr-2" />
                    Phone Number (Optional)
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(808) 555-1234"
                    value={phone}
                    onChange={handlePhoneChange}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="show-contact">Show in Members Directory</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow other residents to see your contact information
                    </p>
                  </div>
                  <Switch
                    id="show-contact"
                    checked={showContactInfo}
                    onCheckedChange={setShowContactInfo}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Platform Tour */}
          {currentStep === 4 && (
            <div className="space-y-6 py-4">
              <DialogDescription>
                Explore the key features of your Poipu Shores community portal.
              </DialogDescription>
              <div className="space-y-6">
                <div className="flex items-start gap-4 p-6 rounded-lg border bg-card">
                  {(() => {
                    const Icon = tourSlides[tourSlide].icon;
                    return (
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                    );
                  })()}
                  <div className="space-y-2 flex-1">
                    <h3 className="font-semibold text-lg">{tourSlides[tourSlide].title}</h3>
                    <p className="text-muted-foreground">{tourSlides[tourSlide].description}</p>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2">
                  {tourSlides.map((_, index) => (
                    <div
                      key={index}
                      className={`h-2 rounded-full transition-all ${
                        index === tourSlide ? "w-8 bg-primary" : "w-2 bg-muted"
                      }`}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setTourSlide(Math.max(0, tourSlide - 1))}
                    disabled={tourSlide === 0}
                    className="flex-1"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setTourSlide(Math.min(tourSlides.length - 1, tourSlide + 1))}
                    disabled={tourSlide === tourSlides.length - 1}
                    className="flex-1"
                  >
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Ask the Chicken */}
          {currentStep === 5 && (
            <div className="space-y-6 py-8 text-center">
              <div className="mx-auto w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-5xl">
                🐔
              </div>
              <div className="space-y-3">
                <DialogTitle className="text-2xl">Need Help?</DialogTitle>
                <DialogDescription className="text-lg">
                  Meet your friendly community assistant - the Poipu Shores Chicken! 
                </DialogDescription>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Have questions about the community, need to find a document, or want recommendations? 
                  The Chicken is here to help! You can find it in the Assistant section anytime.
                </p>
                <div className="pt-4">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary">
                    <MessageSquare className="w-4 h-4" />
                    <span className="text-sm font-medium">Try saying "Hello Chicken!"</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Completion */}
          {currentStep === 6 && (
            <div className="space-y-6 py-8 text-center">
              <div className="mx-auto w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="w-12 h-12 text-primary" />
              </div>
              <div className="space-y-3">
                <DialogTitle className="text-2xl">You're All Set!</DialogTitle>
                <DialogDescription className="text-lg">
                  Welcome to the Poipu Shores community! You can now:
                </DialogDescription>
                <ul className="text-sm text-muted-foreground space-y-2 text-left max-w-md mx-auto">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>View live weather and beach conditions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Access important community documents</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Connect with your neighbors through chat</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Stay updated with community announcements</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Share photos from community events</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Ask the Chicken assistant for help anytime</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 pt-4">
            {currentStep > 1 && currentStep < TOTAL_STEPS && (
              <Button variant="outline" onClick={handleBack} disabled={loading}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
            {currentStep < TOTAL_STEPS && (
              <>
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  disabled={loading}
                  className="ml-auto"
                >
                  Skip
                </Button>
                <Button onClick={handleNext} disabled={loading}>
                  {loading ? "Saving..." : "Next"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </>
            )}
            {currentStep === TOTAL_STEPS && (
              <Button onClick={handleComplete} disabled={loading} className="ml-auto">
                {loading ? "Loading..." : source === 'profile' ? "Done" : "Take me to Dashboard"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
