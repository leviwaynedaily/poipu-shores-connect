import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { UserPlus, Shield, Clock, Activity, Mail, UserCheck, UserX } from "lucide-react";
import { Navigate } from "react-router-dom";

interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  created_at: string;
  last_sign_in_at: string | null;
}

interface UserRole {
  role: string;
}

interface UserWithRoles extends Profile {
  roles: string[];
  units: string[]; // Array of unit numbers from unit_owners table
}

export default function Users() {
  const { isAdmin, loading } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteFullName, setInviteFullName] = useState("");
  const [inviteUnitNumber, setInviteUnitNumber] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "board">("board");
  const [isInviting, setIsInviting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (!loading && isAdmin) {
      fetchUsers();
    }
  }, [loading, isAdmin]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      // Fetch unit ownership data
      const { data: unitsData, error: unitsError } = await supabase
        .from("unit_owners")
        .select("user_id, unit_number");

      if (unitsError) throw unitsError;

      const userRolesMap = new Map<string, string[]>();
      rolesData?.forEach((role) => {
        if (!userRolesMap.has(role.user_id)) {
          userRolesMap.set(role.user_id, []);
        }
        userRolesMap.get(role.user_id)!.push(role.role);
      });

      const userUnitsMap = new Map<string, string[]>();
      unitsData?.forEach((unit) => {
        if (!userUnitsMap.has(unit.user_id)) {
          userUnitsMap.set(unit.user_id, []);
        }
        userUnitsMap.get(unit.user_id)!.push(unit.unit_number);
      });

      const usersWithRoles = profiles?.map((profile) => ({
        ...profile,
        roles: userRolesMap.get(profile.id) || [],
        units: userUnitsMap.get(profile.id) || [],
      })) || [];

      setUsers(usersWithRoles);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsInviting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Not authenticated");
      }

      const { data, error } = await supabase.functions.invoke('invite-user', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: {
          email: inviteEmail,
          full_name: inviteFullName,
          unit_number: inviteUnitNumber,
          role: inviteRole,
        },
      });

      if (error) {
        throw new Error(error.message || "Failed to invite user");
      }

      const tempPassword = data.temp_password;
      
      toast({
        title: "User Invited Successfully!",
        description: (
          <div className="space-y-2">
            <p>Email sent to {inviteEmail}</p>
            <div className="bg-muted p-2 rounded">
              <p className="font-mono text-sm">Temp Password: {tempPassword}</p>
            </div>
            <p className="text-xs text-muted-foreground">Share this password with the user</p>
          </div>
        ),
        duration: 10000,
      });

      setInviteEmail("");
      setInviteFullName("");
      setInviteUnitNumber("");
      setInviteRole("board");
      setIsDialogOpen(false);
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsInviting(false);
    }
  };

  const handleResendInvite = async (userId: string, fullName: string, unitNumber: string | null) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Not authenticated");
      }

      const { data, error } = await supabase.functions.invoke('resend-invite', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: {
          user_id: userId,
          full_name: fullName,
          unit_number: unitNumber,
        },
      });

      if (error) {
        throw new Error(error.message || "Failed to resend invite");
      }

      toast({
        title: "Invite resent",
        description: "Invitation email has been resent successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleToggleRole = async (userId: string, role: "admin" | "board" | "owner", currentlyHas: boolean) => {
    try {
      if (currentlyHas) {
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId)
          .eq("role", role);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role });

        if (error) throw error;
      }

      toast({
        title: "Role updated",
        description: `Role ${currentlyHas ? "removed" : "added"} successfully`,
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Invite and manage community members</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Invite User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite New User</DialogTitle>
              <DialogDescription>
                Send an invitation email to a new community member
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleInviteUser} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={inviteFullName}
                  onChange={(e) => setInviteFullName(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="unitNumber">Unit Number</Label>
                <Input
                  id="unitNumber"
                  value={inviteUnitNumber}
                  onChange={(e) => setInviteUnitNumber(e.target.value)}
                  placeholder="Optional"
                />
              </div>
              <div>
                <Label htmlFor="role">Initial Role</Label>
                <Select value={inviteRole} onValueChange={(value: any) => setInviteRole(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="board">Board Member</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={isInviting}>
                {isInviting ? "Sending..." : "Send Invitation"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Community Members</CardTitle>
          <CardDescription>Manage roles and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading users...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Sign In</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => {
                  const hasLoggedIn = user.last_sign_in_at !== null;
                  const isActive = user.last_sign_in_at 
                    ? new Date(user.last_sign_in_at).getTime() > Date.now() - 24 * 60 * 60 * 1000
                    : false;
                  
                  const formatLastSignIn = (timestamp: string | null) => {
                    if (!timestamp) return "Never";
                    const date = new Date(timestamp);
                    const now = new Date();
                    const diffMs = now.getTime() - date.getTime();
                    const diffMins = Math.floor(diffMs / 60000);
                    const diffHours = Math.floor(diffMs / 3600000);
                    const diffDays = Math.floor(diffMs / 86400000);
                    
                    if (diffMins < 1) return "Just now";
                    if (diffMins < 60) return `${diffMins}m ago`;
                    if (diffHours < 24) return `${diffHours}h ago`;
                    if (diffDays < 7) return `${diffDays}d ago`;
                    return date.toLocaleDateString();
                  };
                  
                  return (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.full_name}
                      </TableCell>
                      <TableCell>{user.units.join(", ") || "—"}</TableCell>
                      <TableCell>
                        {hasLoggedIn ? (
                          <Badge variant={isActive ? "default" : "secondary"} className="gap-1">
                            <UserCheck className="h-3 w-3" />
                            {isActive ? "Active" : "Registered"}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1">
                            <UserX className="h-3 w-3" />
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {formatLastSignIn(user.last_sign_in_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {user.roles.length === 0 && (
                            <Badge variant="outline">Resident</Badge>
                          )}
                          {user.roles.includes("admin") && (
                            <Badge variant="default">Admin</Badge>
                          )}
                          {user.roles.includes("board") && (
                            <Badge variant="secondary">Board</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {!hasLoggedIn && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleResendInvite(user.id, user.full_name, user.units[0])}
                            >
                              <Mail className="h-4 w-4 mr-1" />
                              Resend
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant={user.roles.includes("admin") ? "default" : "outline"}
                            onClick={() => handleToggleRole(user.id, "admin", user.roles.includes("admin"))}
                          >
                            <Shield className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant={user.roles.includes("board") ? "default" : "outline"}
                            onClick={() => handleToggleRole(user.id, "board", user.roles.includes("board"))}
                          >
                            Board
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
