import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useBackground } from "@/contexts/BackgroundContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Footer } from "@/components/Footer";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import beachImage from "@/assets/condo-oceanfront.jpeg";
import logo from "@/assets/logo.png";
import { Loader2 } from "lucide-react";

const AcceptInvite = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn } = useAuth();
  const { homeBackground } = useBackground();
  const { isGlassTheme, authPageOpacity } = useTheme();
  const { toast } = useToast();

  const [token] = useState(searchParams.get("token") || "");
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(true);
  const [inviteValid, setInviteValid] = useState(false);
  const [inviteData, setInviteData] = useState<{ email: string; full_name: string; unit_number?: string } | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [authLogo, setAuthLogo] = useState<string>(logo);

  useEffect(() => {
    const fetchAuthLogo = async () => {
      const { data } = await supabase
        .from('app_settings')
        .select('setting_value')
        .eq('setting_key', 'auth_logo')
        .maybeSingle();
      
      if (data?.setting_value) {
        let logoUrl = data.setting_value as string;
        // Handle double-encoded JSON strings
        if (logoUrl.startsWith('"') && logoUrl.endsWith('"')) {
          logoUrl = logoUrl.slice(1, -1);
        }
        setAuthLogo(logoUrl);
      }
    };
    
    fetchAuthLogo();
  }, []);

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        toast({
          title: "Invalid Link",
          description: "This invitation link is invalid",
          variant: "destructive",
        });
        setValidating(false);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('verify-invite', {
          body: { token },
        });

        if (error) throw error;

        if (data.valid) {
          setInviteValid(true);
          setInviteData(data);
        } else {
          toast({
            title: "Invalid Invitation",
            description: data.error || "This invitation is invalid or has expired",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error verifying token:", error);
        toast({
          title: "Error",
          description: "Failed to verify invitation",
          variant: "destructive",
        });
      } finally {
        setValidating(false);
        setLoading(false);
      }
    };

    verifyToken();
  }, [token, toast]);

  const getBackgroundStyle = () => {
    switch (homeBackground.type) {
      case "color":
        return {
          background: homeBackground.color || "#ffffff",
        };
      case "gradient":
        return {
          background: `linear-gradient(${homeBackground.gradientDirection || "to bottom"}, ${
            homeBackground.gradientStart || "#ffffff"
          }, ${homeBackground.gradientEnd || "#000000"})`,
        };
      case "generated":
      case "uploaded":
        return {
          backgroundImage: `url(${homeBackground.url})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        };
      default:
        return {
          backgroundImage: `url(${beachImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "brightness(0.7)",
        };
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "Please make sure your passwords match",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('complete-invite', {
        body: { token, password },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Success!",
          description: "Your password has been set. Signing you in...",
        });

        // Sign in the user
        const { error: signInError } = await signIn(inviteData!.email, password);
        
        if (signInError) {
          toast({
            title: "Sign In Error",
            description: "Password set but sign in failed. Please try signing in manually.",
            variant: "destructive",
          });
          navigate("/auth");
        } else {
          navigate("/dashboard");
        }
      }
    } catch (error) {
      console.error("Error completing invite:", error);
      toast({
        title: "Error",
        description: "Failed to set password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="min-h-screen flex flex-col relative overflow-hidden">
        <div className="absolute inset-0 z-0" style={getBackgroundStyle()} />
        
        {(homeBackground.type === "uploaded" || homeBackground.type === "generated") && 
         homeBackground.overlayColor && (
          <div 
            className="absolute inset-0 z-0" 
            style={{
              backgroundColor: homeBackground.overlayColor,
              opacity: (homeBackground.overlayOpacity || 0) / 100,
            }}
          />
        )}
        
        {homeBackground.type === "default" && (
          <div className="absolute inset-0 z-0 bg-gradient-to-br from-primary/20 via-background/60 to-secondary/20" />
        )}
        
        <div className="flex-1 flex items-center justify-center p-4">
          <Card 
            className={`w-full max-w-md relative z-10 shadow-xl ${
              isGlassTheme ? "backdrop-blur-md border-white/20" : ""
            }`}
            style={isGlassTheme ? {
              backgroundColor: `hsl(var(--card) / ${100 - authPageOpacity}%)`,
              borderColor: `hsl(var(--border) / 20%)`
            } : undefined}
          >
            <CardContent className="pt-6">
              <div className="flex flex-col items-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Verifying your invitation...</p>
              </div>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 z-0" style={getBackgroundStyle()} />
      
      {(homeBackground.type === "uploaded" || homeBackground.type === "generated") && 
       homeBackground.overlayColor && (
        <div 
          className="absolute inset-0 z-0" 
          style={{
            backgroundColor: homeBackground.overlayColor,
            opacity: (homeBackground.overlayOpacity || 0) / 100,
          }}
        />
      )}
      
      {homeBackground.type === "default" && (
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-primary/20 via-background/60 to-secondary/20" />
      )}
      
      <div className="flex-1 flex items-center justify-center p-4">
        <Card 
          className={`w-full max-w-md relative z-10 shadow-xl ${
            isGlassTheme ? "backdrop-blur-md border-white/20" : ""
          }`}
          style={isGlassTheme ? {
            backgroundColor: `hsl(var(--card) / ${100 - authPageOpacity}%)`,
            borderColor: `hsl(var(--border) / 20%)`
          } : undefined}
        >
          <CardHeader>
            <div className="flex justify-center">
              <img 
                src={authLogo} 
                alt="Poipu Shores" 
                className="h-40 w-auto"
              />
            </div>
          </CardHeader>
          <CardContent>
            {!inviteValid ? (
              <div className="space-y-4 text-center">
                <CardTitle>Invalid Invitation</CardTitle>
                <CardDescription>
                  This invitation link is invalid or has expired. Please contact an administrator for a new invitation.
                </CardDescription>
                <Button onClick={() => navigate("/auth")} className="w-full">
                  Go to Sign In
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSetPassword} className="space-y-5">
                <div className="space-y-2 text-center">
                  <CardTitle>Welcome to Poipu Shores!</CardTitle>
                  <CardDescription>
                    Hi {inviteData?.full_name}, set your password to complete your registration
                  </CardDescription>
                  {inviteData?.unit_number && (
                    <p className="text-sm text-muted-foreground">
                      Unit: {inviteData.unit_number}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-lg">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={inviteData?.email || ""}
                    disabled
                    className="text-lg p-6 bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-lg">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="text-lg p-6"
                    placeholder="Enter your password"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-lg">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="text-lg p-6"
                    placeholder="Confirm your password"
                  />
                </div>

                <Button type="submit" className="w-full text-lg py-6" disabled={loading}>
                  {loading ? "Setting Password..." : "Set Password & Sign In"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default AcceptInvite;
