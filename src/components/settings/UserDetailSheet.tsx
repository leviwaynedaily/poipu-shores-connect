import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  Mail, Phone, Home, Calendar, Clock, Shield, 
  UserCheck, UserX, Archive, KeyRound, Pencil,
  MapPin, Monitor, Smartphone, Tablet, Globe, Copy, Check
} from "lucide-react";
import { formatPhoneNumber } from "@/lib/phoneUtils";
import { format, formatDistanceToNow } from "date-fns";

interface UserWithRoles {
  id: string;
  full_name: string;
  phone: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  is_active: boolean;
  deactivated_at: string | null;
  deactivation_reason: string | null;
  roles: string[];
  units: string[];
}

interface LoginHistoryEntry {
  id: string;
  logged_in_at: string;
  browser: string | null;
  device_type: string | null;
  ip_address: string | null;
  location_city: string | null;
  location_country: string | null;
}

interface UnitOwnerDetails {
  unit_number: string;
  relationship_type: string;
  is_primary_contact: boolean;
}

interface UserDetailSheetProps {
  user: UserWithRoles | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (user: UserWithRoles) => void;
  onResetPassword: (user: UserWithRoles) => void;
  onDeactivate: (user: UserWithRoles) => void;
  onReactivate: (userId: string, fullName: string) => void;
  onToggleRole: (userId: string, role: "admin" | "owner" | "board", currentlyHas: boolean) => void;
}

export function UserDetailSheet({
  user,
  open,
  onOpenChange,
  onEdit,
  onResetPassword,
  onDeactivate,
  onReactivate,
  onToggleRole,
}: UserDetailSheetProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [loginHistory, setLoginHistory] = useState<LoginHistoryEntry[]>([]);
  const [unitDetails, setUnitDetails] = useState<UnitOwnerDetails[]>([]);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [resetPasswordResult, setResetPasswordResult] = useState<string | null>(null);
  const [resetMethod, setResetMethod] = useState<"email" | "sms" | "both" | "show">("show");
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  useEffect(() => {
    if (user && open) {
      fetchUserDetails();
    } else {
      // Reset state when closing
      setEmail(null);
      setLoginHistory([]);
      setUnitDetails([]);
      setResetPasswordResult(null);
    }
  }, [user, open]);

  const fetchUserDetails = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Fetch email
      const { data: emailData } = await supabase.functions.invoke('get-user-email', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: { userId: user.id },
      });
      if (emailData?.email) {
        setEmail(emailData.email);
      }

      // Fetch login history
      const { data: historyData } = await supabase
        .from("login_history")
        .select("*")
        .eq("user_id", user.id)
        .order("logged_in_at", { ascending: false })
        .limit(10);
      
      if (historyData) {
        setLoginHistory(historyData);
      }

      // Fetch unit ownership details
      const { data: unitsData } = await supabase
        .from("unit_owners")
        .select("unit_number, relationship_type, is_primary_contact")
        .eq("user_id", user.id);
      
      if (unitsData) {
        setUnitDetails(unitsData);
      }
    } catch (error) {
      console.error('Failed to fetch user details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!user) return;

    setIsResettingPassword(true);
    setResetPasswordResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke('reset-password', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: {
          user_id: user.id,
          notification_method: resetMethod,
        },
      });

      if (error) throw error;

      if (resetMethod === 'show' && data.temp_password) {
        setResetPasswordResult(data.temp_password);
        toast({
          title: "Password Reset!",
          description: "New temporary password generated. User must change it on next login.",
        });
      } else {
        toast({
          title: "Password Reset Successfully",
          description: `Notification sent${resetMethod === 'both' ? ' via email and SMS' : resetMethod === 'email' ? ' via email' : ' via SMS'}.`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedPassword(true);
    toast({ title: "Copied to clipboard" });
    setTimeout(() => setCopiedPassword(false), 2000);
  };

  const getDeviceIcon = (deviceType: string | null) => {
    switch (deviceType?.toLowerCase()) {
      case 'mobile': return <Smartphone className="h-4 w-4" />;
      case 'tablet': return <Tablet className="h-4 w-4" />;
      default: return <Monitor className="h-4 w-4" />;
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getStatusBadge = () => {
    if (!user) return null;
    
    if (!user.is_active) {
      return (
        <Badge variant="destructive" className="gap-1">
          <Archive className="h-3 w-3" />
          Archived
        </Badge>
      );
    }
    
    const hasLoggedIn = user.last_sign_in_at !== null;
    if (!hasLoggedIn) {
      return (
        <Badge variant="outline" className="gap-1">
          <UserX className="h-3 w-3" />
          Pending
        </Badge>
      );
    }
    
    const isRecentlyActive = new Date(user.last_sign_in_at!).getTime() > Date.now() - 24 * 60 * 60 * 1000;
    return (
      <Badge variant={isRecentlyActive ? "default" : "secondary"} className="gap-1">
        <UserCheck className="h-3 w-3" />
        {isRecentlyActive ? "Active" : "Registered"}
      </Badge>
    );
  };

  if (!user) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-hidden flex flex-col">
        <SheetHeader className="pb-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={undefined} />
              <AvatarFallback className="text-lg bg-primary/10 text-primary">
                {getInitials(user.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-xl truncate">{user.full_name}</SheetTitle>
              <div className="flex flex-wrap gap-2 mt-2">
                {getStatusBadge()}
                {user.roles.map(role => (
                  <Badge 
                    key={role} 
                    variant={role === 'admin' ? 'default' : role === 'owner' ? 'secondary' : 'outline'}
                  >
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </Badge>
                ))}
                {user.roles.length === 0 && <Badge variant="outline">Resident</Badge>}
              </div>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-4 pb-6">
            {/* Contact Information */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm font-medium">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="py-0 pb-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  {isLoading ? (
                    <Skeleton className="h-4 w-48" />
                  ) : (
                    <span className="text-sm truncate">{email || "Loading..."}</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm">
                    {user.phone ? formatPhoneNumber(user.phone) : "No phone"}
                  </span>
                </div>
                {unitDetails.map((unit, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <Home className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm">
                      Unit {unit.unit_number}
                      <span className="text-muted-foreground ml-2">
                        ({unit.relationship_type}{unit.is_primary_contact ? ', Primary Contact' : ''})
                      </span>
                    </span>
                  </div>
                ))}
                {unitDetails.length === 0 && (
                  <div className="flex items-center gap-3">
                    <Home className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm text-muted-foreground">No unit assigned</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Account Status */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm font-medium">Account Status</CardTitle>
              </CardHeader>
              <CardContent className="py-0 pb-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Member Since</span>
                  <span className="text-sm font-medium">
                    {format(new Date(user.created_at), 'MMM d, yyyy')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Last Sign In</span>
                  <span className="text-sm font-medium">
                    {user.last_sign_in_at 
                      ? formatDistanceToNow(new Date(user.last_sign_in_at), { addSuffix: true })
                      : "Never"}
                  </span>
                </div>
                {!user.is_active && user.deactivated_at && (
                  <>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Deactivated</span>
                      <span className="text-sm font-medium text-destructive">
                        {format(new Date(user.deactivated_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                    {user.deactivation_reason && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Reason</span>
                        <span className="text-sm">
                          {user.deactivation_reason.replace(/_/g, ' ')}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Roles & Permissions */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm font-medium">Roles & Permissions</CardTitle>
              </CardHeader>
              <CardContent className="py-0 pb-4">
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={user.roles.includes("admin") ? "default" : "outline"}
                    size="sm"
                    onClick={() => onToggleRole(user.id, "admin", user.roles.includes("admin"))}
                  >
                    <Shield className="h-4 w-4 mr-1" />
                    Admin
                  </Button>
                  <Button
                    variant={user.roles.includes("owner") ? "default" : "outline"}
                    size="sm"
                    onClick={() => onToggleRole(user.id, "owner", user.roles.includes("owner"))}
                  >
                    <Home className="h-4 w-4 mr-1" />
                    Owner
                  </Button>
                  <Button
                    variant={user.roles.includes("board") ? "default" : "outline"}
                    size="sm"
                    onClick={() => onToggleRole(user.id, "board", user.roles.includes("board"))}
                  >
                    <UserCheck className="h-4 w-4 mr-1" />
                    Board
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Password Reset */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm font-medium">Password Reset</CardTitle>
              </CardHeader>
              <CardContent className="py-0 pb-4 space-y-3">
                <div className="space-y-2">
                  <Label className="text-xs">Notification Method</Label>
                  <Select value={resetMethod} onValueChange={(v: any) => setResetMethod(v)}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="show">Show Password (I'll tell them)</SelectItem>
                      <SelectItem value="email">Send via Email</SelectItem>
                      <SelectItem value="sms">Send via SMS</SelectItem>
                      <SelectItem value="both">Send via Email & SMS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  onClick={handleResetPassword} 
                  disabled={isResettingPassword}
                  className="w-full"
                  size="sm"
                >
                  <KeyRound className="h-4 w-4 mr-2" />
                  {isResettingPassword ? "Resetting..." : "Reset Password"}
                </Button>

                {resetPasswordResult && (
                  <div className="p-3 bg-primary/10 border border-primary/20 rounded-md">
                    <p className="text-xs text-muted-foreground mb-1">New Temporary Password:</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 font-mono text-sm font-semibold bg-background px-2 py-1 rounded">
                        {resetPasswordResult}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(resetPasswordResult)}
                      >
                        {copiedPassword ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      User must change this on next login
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Login History */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm font-medium">
                  Recent Login Activity
                  {loginHistory.length > 0 && (
                    <span className="text-muted-foreground font-normal ml-2">
                      ({loginHistory.length})
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="py-0 pb-4">
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : loginHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No login history available
                  </p>
                ) : (
                  <div className="space-y-2">
                    {loginHistory.map((entry) => (
                      <div 
                        key={entry.id} 
                        className="flex items-start gap-3 p-2 rounded-md bg-muted/50 text-sm"
                      >
                        <div className="mt-0.5 text-muted-foreground">
                          {getDeviceIcon(entry.device_type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">
                              {entry.browser || 'Unknown Browser'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {entry.device_type || 'Unknown'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {format(new Date(entry.logged_in_at), 'MMM d, yyyy h:mm a')}
                          </div>
                          {entry.ip_address && entry.ip_address !== 'unknown' && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Globe className="h-3 w-3" />
                              {entry.ip_address}
                              {entry.location_city && ` • ${entry.location_city}`}
                              {entry.location_country && `, ${entry.location_country}`}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        {/* Actions Footer */}
        <div className="border-t pt-4 mt-auto space-y-2">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => {
                onOpenChange(false);
                onEdit(user);
              }}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit Details
            </Button>
            {user.is_active ? (
              <Button 
                variant="destructive"
                className="flex-1"
                onClick={() => {
                  onOpenChange(false);
                  onDeactivate(user);
                }}
              >
                <Archive className="h-4 w-4 mr-2" />
                Deactivate
              </Button>
            ) : (
              <Button 
                variant="secondary"
                className="flex-1"
                onClick={() => onReactivate(user.id, user.full_name)}
              >
                Reactivate
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
