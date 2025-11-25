import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useBackground } from "@/contexts/BackgroundContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Footer } from "@/components/Footer";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatPhoneInput, formatPhoneNumber } from "@/lib/phoneUtils";
import beachImage from "@/assets/condo-oceanfront.jpeg";
import logo from "@/assets/logo.png";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});


const Auth = () => {
  const navigate = useNavigate();
  const { user, signIn, resetPassword } = useAuth();
  const { homeBackground } = useBackground();
  const { isGlassTheme, authPageOpacity } = useTheme();
  const { toast } = useToast();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [userHasPhone, setUserHasPhone] = useState(false);
  const [userPhone, setUserPhone] = useState("");
  const [showOtpLogin, setShowOtpLogin] = useState(false);
  const [otpMethod, setOtpMethod] = useState<'email' | 'phone' | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [authLogo, setAuthLogo] = useState<string>(logo);

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchAuthLogo = async () => {
      const { data } = await supabase
        .from('app_settings')
        .select('setting_value')
        .eq('setting_key', 'auth_logo')
        .maybeSingle();
      
      if (data?.setting_value) {
        setAuthLogo(data.setting_value as string);
      }
    };
    
    fetchAuthLogo();
  }, []);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      z.string().email().parse(email);
      setEmailVerified(true);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: "Please enter a valid email address",
          variant: "destructive",
        });
      }
    }
  };

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      loginSchema.parse({ email, password });
      setLoading(true);
      const { error } = await signIn(email, password);
      if (!error) {
        navigate("/dashboard");
      } else {
        // Reset to email entry if user not found
        if (error.message.includes('Invalid login credentials') || error.message.includes('not found')) {
          toast({
            title: "Account Not Found",
            description: "No account found with this email address",
            variant: "destructive",
          });
          setEmailVerified(false);
          setPassword("");
        }
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
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      z.string().email().parse(email);
      setLoading(true);
      await resetPassword(email);
      setShowResetPassword(false);
      setEmail("");
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: "Please enter a valid email address",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async () => {
    // For security, we only offer email OTP initially
    // Since we can't check if user has a phone without authentication
    // They'll need to have entered a valid registered email
    setShowOtpLogin(true);
    setOtpMethod('email'); // Default to email since we can't verify phone without auth
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      if (otpMethod === 'email') {
        z.string().email().parse(email);
        
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });
        
        if (error) {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        } else {
          setOtpSent(true);
          toast({
            title: "Code Sent!",
            description: `Check your email for the 6-digit code`,
          });
        }
      } else if (otpMethod === 'phone') {
        // Use the phone from user's profile
        if (!userPhone || userPhone.replace(/\D/g, '').length !== 10) {
          toast({
            title: "Error",
            description: "No valid phone number found in your profile",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        
        // Convert to E.164 format
        const e164Phone = `+1${userPhone.replace(/\D/g, '')}`;
        
        const { error } = await supabase.auth.signInWithOtp({
          phone: e164Phone,
        });
        
        if (error) {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        } else {
          setOtpSent(true);
          toast({
            title: "Code Sent!",
            description: `Check your phone for the 6-digit code`,
          });
        }
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: "Please enter a valid email address",
          variant: "destructive",
        });
      } else if (error instanceof Error) {
        toast({
          title: "Validation Error",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otpCode.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter a 6-digit code",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    let verifyOptions: any;
    
    if (otpMethod === 'email') {
      verifyOptions = {
        email,
        token: otpCode,
        type: 'email',
      };
    } else if (otpMethod === 'phone') {
      const e164Phone = `+1${userPhone.replace(/\D/g, '')}`;
      verifyOptions = {
        phone: e164Phone,
        token: otpCode,
        type: 'sms',
      };
    }
    
    const { error } = await supabase.auth.verifyOtp(verifyOptions);
    
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
    } else {
      toast({
        title: "Success!",
        description: "Signed in successfully",
      });
      navigate("/dashboard");
    }
  };

  const handleResendOtp = async () => {
    setOtpCode("");
    await handleSendOtp(new Event('submit') as any);
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0" style={getBackgroundStyle()} />
      
      {/* Color overlay for images */}
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
      
      {/* Default gradient overlay */}
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
          {showResetPassword ? (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="resetEmail" className="text-lg">Email</Label>
                <Input
                  id="resetEmail"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="text-lg p-6"
                  placeholder="Enter your email"
                />
                <p className="text-sm text-muted-foreground">
                  We'll send you a password reset link
                </p>
              </div>
              
              <Button type="submit" className="w-full text-lg py-6" disabled={loading}>
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>
              
              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowResetPassword(false);
                    setEmailVerified(false);
                    setEmail("");
                  }}
                  className="text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  Back to sign in
                </button>
              </div>
            </form>
          ) : showOtpLogin && !otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div className="space-y-2 text-center">
                <h3 className="text-lg font-medium">We'll send a code to your email</h3>
                <p className="text-sm text-muted-foreground">
                  A 6-digit code will be sent to {email}
                </p>
              </div>
              
              <Button type="submit" className="w-full text-lg py-6" disabled={loading}>
                {loading ? "Sending..." : "Send Code"}
              </Button>
              
              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowOtpLogin(false);
                    setOtpMethod(null);
                  }}
                  className="text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  Sign in with password instead
                </button>
              </div>
            </form>
          ) : showOtpLogin && otpSent ? (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="space-y-4">
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-medium">Enter the 6-digit code</h3>
                  <p className="text-sm text-muted-foreground">
                    Sent to {email}
                  </p>
                </div>
                
                <div className="flex justify-center">
                  <InputOTP 
                    maxLength={6} 
                    value={otpCode}
                    onChange={setOtpCode}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>
              
              <Button type="submit" className="w-full text-lg py-6" disabled={loading}>
                {loading ? "Verifying..." : "Verify"}
              </Button>
              
              <div className="text-center space-y-2">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="text-sm text-primary hover:text-primary/80 transition-colors block w-full"
                >
                  Didn't get it? Resend code
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowOtpLogin(false);
                    setOtpSent(false);
                    setOtpMethod(null);
                    setOtpCode("");
                    setEmailVerified(false);
                  }}
                  className="text-sm text-primary hover:text-primary/80 transition-colors block w-full"
                >
                  Back to sign in
                </button>
              </div>
            </form>
          ) : !emailVerified ? (
            <form onSubmit={handleEmailSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-lg">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="text-lg p-6"
                  placeholder="Enter your email"
                  autoComplete="email"
                />
                <p className="text-sm text-muted-foreground">
                  Enter the email associated with your account
                </p>
              </div>
              
              <Button type="submit" className="w-full text-lg py-6" disabled={loading}>
                {loading ? "Checking..." : "Continue"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="emailDisplay" className="text-lg">Email</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="emailDisplay"
                    type="email"
                    value={email}
                    disabled
                    className="text-lg p-6 bg-muted"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEmailVerified(false);
                      setPassword("");
                      setShowOtpLogin(false);
                    }}
                    className="text-sm"
                  >
                    Change
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-lg">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="text-lg p-6"
                  autoComplete="current-password"
                />
              </div>
              
              <Button type="submit" className="w-full text-lg py-6" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
              
              <div className="text-center space-y-2">
                <button
                  type="button"
                  onClick={handleRequestOtp}
                  disabled={loading}
                  className="text-sm text-primary hover:text-primary/80 transition-colors block w-full"
                >
                  Send me a code instead
                </button>
                <button
                  type="button"
                  onClick={() => setShowResetPassword(true)}
                  className="text-sm text-primary hover:text-primary/80 transition-colors block w-full"
                >
                  Forgot password?
                </button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
      </div>
      
      <Footer />
    </div>
  );
};

export default Auth;