import { useState, useEffect } from "react";
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
import { UserPlus, Shield, Clock, Mail, UserCheck, UserX, Trash2, Archive, RotateCcw } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface Profile {
  id: string;
  full_name: string;
  unit_number: string | null;
  phone: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  is_active: boolean;
  deactivated_at: string | null;
  deactivation_reason: string | null;
}

interface UserWithRoles extends Profile {
  roles: string[];
}

export function UserManagement() {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteFullName, setInviteFullName] = useState("");
  const [inviteUnitNumber, setInviteUnitNumber] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "owner">("owner");
  const [inviteRelationshipType, setInviteRelationshipType] = useState<"primary" | "spouse" | "co-owner" | "family">("primary");
  const [inviteIsPrimaryContact, setInviteIsPrimaryContact] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [resendingUserId, setResendingUserId] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [deactivatingUserId, setDeactivatingUserId] = useState<string | null>(null);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [deactivationReason, setDeactivationReason] = useState("sold_unit");
  const [removeFromUnit, setRemoveFromUnit] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

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

      const userRolesMap = new Map<string, string[]>();
      rolesData?.forEach((role) => {
        if (!userRolesMap.has(role.user_id)) {
          userRolesMap.set(role.user_id, []);
        }
        userRolesMap.get(role.user_id)!.push(role.role);
      });

      const usersWithRoles = profiles?.map((profile) => ({
        ...profile,
        roles: userRolesMap.get(profile.id) || [],
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
      const response = await fetch(`https://rvqqnfsgovlxocjjugww.supabase.co/functions/v1/invite-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          email: inviteEmail,
          full_name: inviteFullName,
          unit_number: inviteUnitNumber,
          role: inviteRole,
          relationship_type: inviteRelationshipType,
          is_primary_contact: inviteIsPrimaryContact,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to invite user");
      }

      toast({
        title: "User invited",
        description: `Invitation sent to ${inviteEmail}`,
      });

      setInviteEmail("");
      setInviteFullName("");
      setInviteUnitNumber("");
      setInviteRole("owner");
      setInviteRelationshipType("primary");
      setInviteIsPrimaryContact(false);
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
    setResendingUserId(userId);
    try {
      const response = await fetch(`https://rvqqnfsgovlxocjjugww.supabase.co/functions/v1/resend-invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          user_id: userId,
          full_name: fullName,
          unit_number: unitNumber,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to resend invite");
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
    } finally {
      setResendingUserId(null);
    }
  };

  const handleDeleteInvite = async (userId: string, fullName: string) => {
    if (!confirm(`Are you sure you want to delete the invite for ${fullName}? This action cannot be undone.`)) {
      return;
    }

    setDeletingUserId(userId);
    try {
      const response = await fetch(`https://rvqqnfsgovlxocjjugww.supabase.co/functions/v1/delete-invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          user_id: userId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete invite");
      }

      toast({
        title: "Invite deleted",
        description: "User invitation has been deleted successfully",
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeletingUserId(null);
    }
  };

  const handleDeactivateUser = async () => {
    if (!selectedUser) return;

    setDeactivatingUserId(selectedUser.id);
    try {
      const response = await fetch(`https://rvqqnfsgovlxocjjugww.supabase.co/functions/v1/deactivate-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          reason: deactivationReason,
          removeFromUnit,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to deactivate user");
      }

      toast({
        title: "User deactivated",
        description: `${selectedUser.full_name} has been deactivated successfully`,
      });

      setDeactivateDialogOpen(false);
      setSelectedUser(null);
      setDeactivationReason("sold_unit");
      setRemoveFromUnit(false);
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeactivatingUserId(null);
    }
  };

  const handleReactivateUser = async (userId: string, fullName: string) => {
    setDeactivatingUserId(userId);
    try {
      const response = await fetch(`https://rvqqnfsgovlxocjjugww.supabase.co/functions/v1/reactivate-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          userId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to reactivate user");
      }

      toast({
        title: "User reactivated",
        description: `${fullName} has been reactivated successfully`,
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeactivatingUserId(null);
    }
  };

  const handleToggleRole = async (userId: string, role: "admin" | "owner", currentlyHas: boolean) => {
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

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle>User Management</CardTitle>
            <CardDescription>Invite and manage community members</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowArchived(!showArchived)}
            >
              <Archive className="mr-2 h-4 w-4" />
              {showArchived ? "Hide" : "Show"} Archived
            </Button>
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
                {inviteUnitNumber && (
                  <>
                    <div>
                      <Label htmlFor="relationshipType">Relationship Type</Label>
                      <Select value={inviteRelationshipType} onValueChange={(value: any) => setInviteRelationshipType(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="primary">Primary Owner</SelectItem>
                          <SelectItem value="spouse">Spouse</SelectItem>
                          <SelectItem value="co-owner">Co-Owner</SelectItem>
                          <SelectItem value="family">Family Member</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isPrimaryContact"
                        checked={inviteIsPrimaryContact}
                        onCheckedChange={(checked) => setInviteIsPrimaryContact(checked as boolean)}
                      />
                      <Label htmlFor="isPrimaryContact" className="cursor-pointer">
                        Primary Contact for Unit
                      </Label>
                    </div>
                  </>
                )}
                <div>
                  <Label htmlFor="role">Initial Role</Label>
                  <Select value={inviteRole} onValueChange={(value: any) => setInviteRole(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owner">Owner</SelectItem>
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
        </div>
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
                {users.filter(u => showArchived || u.is_active).map((user) => {
                  const hasLoggedIn = user.last_sign_in_at !== null;
                  const isUserActive = user.last_sign_in_at 
                    ? new Date(user.last_sign_in_at).getTime() > Date.now() - 24 * 60 * 60 * 1000
                    : false;
                  const isArchived = !user.is_active;
                  
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
                    <TableRow key={user.id} className={isArchived ? "opacity-50" : ""}>
                      <TableCell className="font-medium">
                        {user.full_name}
                        {isArchived && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            (Archived)
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{user.unit_number || "—"}</TableCell>
                      <TableCell>
                        {isArchived ? (
                          <Badge variant="destructive" className="gap-1">
                            <Archive className="h-3 w-3" />
                            Archived
                          </Badge>
                        ) : hasLoggedIn ? (
                          <Badge variant={isUserActive ? "default" : "secondary"} className="gap-1">
                            <UserCheck className="h-3 w-3" />
                            {isUserActive ? "Active" : "Registered"}
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
                          {user.roles.includes("owner") && (
                            <Badge variant="secondary">Owner</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {isArchived ? (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleReactivateUser(user.id, user.full_name)}
                              disabled={deactivatingUserId === user.id}
                            >
                              <RotateCcw className="h-4 w-4 mr-1" />
                              {deactivatingUserId === user.id ? "Reactivating..." : "Reactivate"}
                            </Button>
                          ) : !hasLoggedIn && (
                            <>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleResendInvite(user.id, user.full_name, user.unit_number)}
                                disabled={resendingUserId === user.id}
                              >
                                <Mail className="h-4 w-4 mr-1" />
                                {resendingUserId === user.id ? "Sending..." : "Resend"}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteInvite(user.id, user.full_name)}
                                disabled={deletingUserId === user.id}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                {deletingUserId === user.id ? "Deleting..." : "Delete"}
                              </Button>
                            </>
                          )}
                          {hasLoggedIn && !isArchived && (
                            <>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setDeactivateDialogOpen(true);
                                }}
                              >
                                <Archive className="h-4 w-4 mr-1" />
                                Deactivate
                              </Button>
                              <Button
                                size="sm"
                                variant={user.roles.includes("admin") ? "default" : "outline"}
                                onClick={() => handleToggleRole(user.id, "admin", user.roles.includes("admin"))}
                              >
                                <Shield className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant={user.roles.includes("owner") ? "default" : "outline"}
                                onClick={() => handleToggleRole(user.id, "owner", user.roles.includes("owner"))}
                              >
                                Owner
                              </Button>
                            </>
                          )}
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

      <Dialog open={deactivateDialogOpen} onOpenChange={setDeactivateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate User</DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate {selectedUser?.full_name}?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">Reason</Label>
              <Select value={deactivationReason} onValueChange={setDeactivationReason}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sold_unit">Sold unit</SelectItem>
                  <SelectItem value="no_longer_owner">No longer owner</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedUser?.unit_number && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="removeFromUnit"
                  checked={removeFromUnit}
                  onCheckedChange={(checked) => setRemoveFromUnit(checked as boolean)}
                />
                <Label htmlFor="removeFromUnit" className="cursor-pointer">
                  Remove from unit ownership
                </Label>
              </div>
            )}

            <div className="rounded-lg bg-muted p-4 space-y-2">
              <p className="text-sm font-medium">This will:</p>
              <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                <li>Prevent them from logging in</li>
                <li>Hide them from the Members directory</li>
                <li>Preserve their activity history</li>
                {removeFromUnit && <li>Remove them from unit ownership records</li>}
              </ul>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setDeactivateDialogOpen(false);
                  setSelectedUser(null);
                  setDeactivationReason("sold_unit");
                  setRemoveFromUnit(false);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeactivateUser}
                disabled={deactivatingUserId === selectedUser?.id}
              >
                {deactivatingUserId === selectedUser?.id ? "Deactivating..." : "Deactivate"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
