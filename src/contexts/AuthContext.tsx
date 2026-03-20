import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  rolesLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string, unitNumber: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (newPassword: string) => Promise<{ error: any }>;
  isAdmin: boolean;
  isOwner: boolean;
  isBoard: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [isBoard, setIsBoard] = useState(false);

  const trackLoginOnce = async (userId: string) => {
    // Only track once per browser session
    const sessionKey = `login_tracked_${userId}`;
    if (sessionStorage.getItem(sessionKey)) return;
    sessionStorage.setItem(sessionKey, 'true');

    try {
      const userAgent = navigator.userAgent;
      let browser = 'Unknown';
      if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) browser = 'Chrome';
      else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari';
      else if (userAgent.includes('Firefox')) browser = 'Firefox';
      else if (userAgent.includes('Edg')) browser = 'Edge';
      
      let deviceType = 'Desktop';
      if (/Mobi|Android/i.test(userAgent)) deviceType = 'Mobile';
      else if (/Tablet|iPad/i.test(userAgent)) deviceType = 'Tablet';

      await supabase.functions.invoke('track-login', {
        body: { userAgent, browser, deviceType },
      });
    } catch (error) {
      console.error('Error tracking login:', error);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Fetch user roles when session changes
        if (session?.user) {
          setRolesLoading(true);
          setTimeout(() => {
            void fetchUserRoles(session.user.id);
          }, 0);

          // Track login on sign-in events
          if (event === 'SIGNED_IN') {
            trackLoginOnce(session.user.id);
            // Update last sign-in timestamp
            supabase
              .from("profiles")
              .update({ last_sign_in_at: new Date().toISOString() })
              .eq("id", session.user.id);
          }
        } else {
          setIsAdmin(false);
          setIsOwner(false);
          setIsBoard(false);
          setRolesLoading(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchUserRoles(session.user.id);
      } else {
        setRolesLoading(false);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRoles = async (userId: string) => {
    setRolesLoading(true);

    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (error) {
        throw error;
      }

      const roles = data ?? [];
      setIsAdmin(roles.some(r => r.role === "admin"));
      setIsOwner(roles.some(r => r.role === "owner"));
      setIsBoard(roles.some(r => r.role === "board"));
    } catch (error) {
      console.error("Error fetching user roles:", error);
      setIsAdmin(false);
      setIsOwner(false);
      setIsBoard(false);
    } finally {
      setRolesLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error("Error", { description: error.message });
    } else {
      toast.success("Welcome back!");
    }

    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string, unitNumber: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          unit_number: unitNumber,
        },
      },
    });

    if (error) {
      toast.error("Error", { description: error.message });
    } else {
      toast.success("Account created!", { description: "Please check your email to verify your account." });
    }

    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
    setIsOwner(false);
    setIsBoard(false);
    setRolesLoading(false);
    toast.success("Signed out");
  };

  const resetPassword = async (email: string) => {
    const redirectUrl = `${window.location.origin}/auth`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) {
      toast.error("Error", { description: error.message });
    } else {
      toast.success("Password reset email sent", { description: "Check your email for the password reset link." });
    }

    return { error };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      toast.error("Error", { description: error.message });
    } else {
      toast.success("Password updated");
    }

    return { error };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        rolesLoading,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updatePassword,
        isAdmin,
        isOwner,
        isBoard,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
