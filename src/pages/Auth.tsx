import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

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
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <img src={logo} alt="Poipu Shores - Kauai, Hawaii" className="w-full max-w-md" />
          </div>
        </CardHeader>
        <CardContent>
          {!showResetPassword ? (
            <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-lg">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="text-lg p-6"
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
                className="text-lg p-6"
              />
            </div>
              <Button type="submit" className="w-full text-lg py-6" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
              
              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => setShowResetPassword(true)}
                  className="text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            </form>
          ) : (
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
                    setEmail("");
                  }}
                  className="text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  Back to sign in
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