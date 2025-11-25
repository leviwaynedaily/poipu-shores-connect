import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { OnboardingWizard } from "@/components/OnboardingWizard";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!loading && user) {
        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("onboarding_completed")
            .eq("id", user.id)
            .single();

          if (profile && !profile.onboarding_completed) {
            setShowOnboarding(true);
            setCheckingOnboarding(false);
          } else {
            navigate("/dashboard", { replace: true });
          }
        } catch (error) {
          console.error("Error checking onboarding status:", error);
          navigate("/dashboard", { replace: true });
        }
      } else if (!loading && !user) {
        navigate("/auth", { replace: true });
      }
    };

    checkOnboardingStatus();
  }, [user, loading, navigate]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    navigate("/dashboard", { replace: true });
  };

  if (checkingOnboarding || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-xl text-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-xl text-foreground">Loading...</div>
      </div>
      <OnboardingWizard open={showOnboarding} onComplete={handleOnboardingComplete} />
    </>
  );
};

export default Index;