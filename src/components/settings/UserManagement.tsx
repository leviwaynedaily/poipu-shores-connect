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
import { UserPlus, Shield, Clock, Mail, UserCheck, UserX, Trash2, Archive, RotateCcw, Users, Pencil, MoreVertical, KeyRound } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  is_active: boolean;
  deactivated_at: string | null;
  deactivation_reason: string | null;
}

interface UserWithRoles extends Profile {
  roles: string[];
  units: string[]; // Array of unit numbers from unit_owners table
}

export function UserManagement() {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteFullName, setInviteFullName] = useState("");
  const [inviteUnitNumber, setInviteUnitNumber] = useState("");
  const [invitePhone, setInvitePhone] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "owner" | "board">("owner");
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
  const [deletingPermanentUserId, setDeletingPermanentUserId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserWithRoles | null>(null);
  const [bulkInviteDialogOpen, setBulkInviteDialogOpen] = useState(false);
  const [bulkInviteEntries, setBulkInviteEntries] = useState<Array<{
    email: string;
    full_name: string;
    unit_number: string;
    phone: string;
    role: "admin" | "owner" | "board";
  }>>([{ email: "", full_name: "", unit_number: "", phone: "", role: "owner" }]);
  const [bulkInviting, setBulkInviting] = useState(false);
  const [bulkInviteResults, setBulkInviteResults] = useState<{ email: string; success: boolean; error?: string }[]>([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithRoles | null>(null);
  const [editEmail, setEditEmail] = useState("");
  const [editFullName, setEditFullName] = useState("");
  const [editUnitNumber, setEditUnitNumber] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [selectedResetUser, setSelectedResetUser] = useState<UserWithRoles | null>(null);
  const [resetMethod, setResetMethod] = useState<"email" | "sms" | "both" | "show">("show");
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetPasswordResult, setResetPasswordResult] = useState<string | null>(null);

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
          phone: invitePhone,
          role: inviteRole,
          relationship_type: inviteRelationshipType,
          is_primary_contact: inviteIsPrimaryContact,
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
            <p>Email{invitePhone ? ' and SMS' : ''} sent to {inviteEmail}</p>
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
      setInvitePhone("");
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

  const handleDeleteUserPermanently = async () => {
    if (!userToDelete) return;

    setDeletingPermanentUserId(userToDelete.id);
    try {
      const response = await fetch(`https://rvqqnfsgovlxocjjugww.supabase.co/functions/v1/delete-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          userId: userToDelete.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete user");
      }

      toast({
        title: "User deleted",
        description: `${userToDelete.full_name} has been permanently deleted`,
      });

      setDeleteDialogOpen(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeletingPermanentUserId(null);
    }
  };

  const handleBulkInvite = async () => {
    setBulkInviting(true);
    setBulkInviteResults([]);
    
    try {
      const results: { email: string; success: boolean; error?: string }[] = [];
      
      for (const entry of bulkInviteEntries) {
        if (!entry.email || !entry.email.includes('@')) {
          if (entry.email) {
            results.push({ email: entry.email, success: false, error: 'Invalid email format' });
          }
          continue;
        }
        
        try {
          // Get the current session token
          const { data: { session } } = await supabase.auth.getSession();
          
          if (!session) {
            results.push({ email: entry.email, success: false, error: 'Not authenticated' });
            continue;
          }

          const { data, error } = await supabase.functions.invoke('invite-user', {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
            body: {
              email: entry.email,
              full_name: entry.full_name || entry.email.split('@')[0],
              unit_number: entry.unit_number || null,
              phone: entry.phone || null,
              role: entry.role,
              relationship_type: 'primary',
              is_primary_contact: false,
            },
          });

          if (error) {
            results.push({ email: entry.email, success: false, error: error.message || 'Failed to invite' });
          } else {
            results.push({ email: entry.email, success: true });
          }
        } catch (error: any) {
          results.push({ email: entry.email, success: false, error: error.message });
        }
      }
      
      setBulkInviteResults(results);
      
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;
      
      toast({
        title: "Bulk invite completed",
        description: `${successCount} invited successfully, ${failCount} failed`,
      });
      
      if (successCount > 0) {
        fetchUsers();
        // Close dialog and reset after successful invites
        setTimeout(() => {
          setBulkInviteDialogOpen(false);
          setBulkInviteEntries([{ email: "", full_name: "", unit_number: "", phone: "", role: "owner" }]);
          setBulkInviteResults([]);
        }, 2000);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setBulkInviting(false);
    }
  };

  const handleToggleRole = async (userId: string, role: "admin" | "owner" | "board", currentlyHas: boolean) => {
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

  const handleEditUser = (user: UserWithRoles) => {
    setEditingUser(user);
    setEditEmail("");
    setEditFullName(user.full_name);
    setEditUnitNumber(user.units[0] || "");
    setEditPhone(user.phone || "");
    setEditDialogOpen(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`https://rvqqnfsgovlxocjjugww.supabase.co/functions/v1/update-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          userId: editingUser.id,
          email: editEmail || undefined,
          full_name: editFullName,
          unit_number: editUnitNumber || null,
          phone: editPhone || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update user");
      }

      toast({
        title: "User updated",
        description: `${editFullName} has been updated successfully`,
      });

      setEditDialogOpen(false);
      setEditingUser(null);
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedResetUser) return;

    setIsResettingPassword(true);
    setResetPasswordResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Not authenticated");
      }

      const { data, error } = await supabase.functions.invoke('reset-password', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: {
          user_id: selectedResetUser.id,
          notification_method: resetMethod,
        },
      });

      if (error) throw error;

      if (resetMethod === 'show' && data.temp_password) {
        setResetPasswordResult(data.temp_password);
        toast({
          title: "Password Reset!",
          description: (
            <div className="space-y-2">
              <p>New password for {selectedResetUser.full_name}:</p>
              <div className="bg-muted p-2 rounded">
                <p className="font-mono text-sm">{data.temp_password}</p>
              </div>
            </div>
          ),
          duration: 10000,
        });
      } else {
        toast({
          title: "Password Reset Successfully",
          description: `Password reset notification sent${resetMethod === 'both' ? ' via email and SMS' : resetMethod === 'email' ? ' via email' : ' via SMS'}.`,
        });
        setResetPasswordDialogOpen(false);
        setSelectedResetUser(null);
        setResetMethod("show");
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

  return (
    <TooltipProvider>
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
            <Dialog open={bulkInviteDialogOpen} onOpenChange={setBulkInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Users className="mr-2 h-4 w-4" />
                  Bulk Invite
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Bulk Invite Users</DialogTitle>
                  <DialogDescription>
                    Add multiple users with their details. Click "Add Another User" to invite more people.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {bulkInviteEntries.map((entry, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-semibold">User {index + 1}</h4>
                        {bulkInviteEntries.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newEntries = bulkInviteEntries.filter((_, i) => i !== index);
                              setBulkInviteEntries(newEntries);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor={`bulk-email-${index}`}>Email *</Label>
                          <Input
                            id={`bulk-email-${index}`}
                            type="email"
                            placeholder="user@example.com"
                            value={entry.email}
                            onChange={(e) => {
                              const newEntries = [...bulkInviteEntries];
                              newEntries[index].email = e.target.value;
                              setBulkInviteEntries(newEntries);
                            }}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`bulk-name-${index}`}>Full Name</Label>
                          <Input
                            id={`bulk-name-${index}`}
                            placeholder="John Smith"
                            value={entry.full_name}
                            onChange={(e) => {
                              const newEntries = [...bulkInviteEntries];
                              newEntries[index].full_name = e.target.value;
                              setBulkInviteEntries(newEntries);
                            }}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`bulk-unit-${index}`}>Unit Number</Label>
                          <Input
                            id={`bulk-unit-${index}`}
                            placeholder="101"
                            value={entry.unit_number}
                            onChange={(e) => {
                              const newEntries = [...bulkInviteEntries];
                              newEntries[index].unit_number = e.target.value;
                              setBulkInviteEntries(newEntries);
                            }}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`bulk-phone-${index}`}>Phone Number</Label>
                          <Input
                            id={`bulk-phone-${index}`}
                            type="tel"
                            placeholder="(808) 555-1234"
                            value={entry.phone}
                            onChange={(e) => {
                              const newEntries = [...bulkInviteEntries];
                              newEntries[index].phone = e.target.value;
                              setBulkInviteEntries(newEntries);
                            }}
                          />
                        </div>
                        <div className="col-span-2">
                          <Label htmlFor={`bulk-role-${index}`}>Role</Label>
                          <Select 
                            value={entry.role} 
                            onValueChange={(value: any) => {
                              const newEntries = [...bulkInviteEntries];
                              newEntries[index].role = value;
                              setBulkInviteEntries(newEntries);
                            }}
                          >
                            <SelectTrigger id={`bulk-role-${index}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="owner">Owner</SelectItem>
                              <SelectItem value="board">Board Member</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </Card>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setBulkInviteEntries([
                        ...bulkInviteEntries,
                        { email: "", full_name: "", unit_number: "", phone: "", role: "owner" }
                      ]);
                    }}
                    disabled={bulkInviting}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Another User
                  </Button>

                  {bulkInviteResults.length > 0 && (
                    <div className="max-h-[200px] overflow-y-auto border rounded-md p-3">
                      <p className="font-semibold text-sm mb-2">Results:</p>
                      {bulkInviteResults.map((result, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm py-1">
                          {result.success ? (
                            <Badge variant="default" className="w-20">Success</Badge>
                          ) : (
                            <Badge variant="destructive" className="w-20">Failed</Badge>
                          )}
                          <span className="flex-1">{result.email}</span>
                          {result.error && (
                            <span className="text-xs text-muted-foreground">{result.error}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setBulkInviteDialogOpen(false);
                        setBulkInviteEntries([{ email: "", full_name: "", unit_number: "", phone: "", role: "owner" }]);
                        setBulkInviteResults([]);
                      }}
                      disabled={bulkInviting}
                    >
                      {bulkInviteResults.length > 0 ? "Close" : "Cancel"}
                    </Button>
                    <Button
                      onClick={handleBulkInvite}
                      disabled={bulkInviting || !bulkInviteEntries.some(e => e.email.trim())}
                    >
                      {bulkInviting ? "Inviting..." : "Send Invitations"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
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
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={invitePhone}
                    onChange={(e) => setInvitePhone(e.target.value)}
                    placeholder="(808) 555-1234"
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
                      <TableCell>{user.units.join(", ") || "—"}</TableCell>
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
                          {user.roles.includes("board") && (
                            <Badge variant="outline">Board</Badge>
                          )}
                        </div>
                      </TableCell>
                       <TableCell>
                        <div className="flex gap-2 justify-end">
                          {isArchived ? (
                            <>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => handleReactivateUser(user.id, user.full_name)}
                                    disabled={deactivatingUserId === user.id}
                                  >
                                    <RotateCcw className="h-4 w-4 mr-1" />
                                    {deactivatingUserId === user.id ? "Reactivating..." : "Reactivate"}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Restore access and unban this user</p>
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => {
                                      setUserToDelete(user);
                                      setDeleteDialogOpen(true);
                                    }}
                                    disabled={deletingPermanentUserId === user.id}
                                  >
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    {deletingPermanentUserId === user.id ? "Deleting..." : "Delete"}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Permanently delete this user and all related data</p>
                                </TooltipContent>
                              </Tooltip>
                            </>
                          ) : !hasLoggedIn ? (
                            <>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleResendInvite(user.id, user.full_name, user.units[0])}
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
                              <DropdownMenu>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <DropdownMenuTrigger asChild>
                                      <Button size="sm" variant="ghost">
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>More actions</p>
                                  </TooltipContent>
                                </Tooltip>
                                <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuCheckboxItem
                                    onSelect={() => {
                                      setSelectedResetUser(user);
                                      setResetPasswordDialogOpen(true);
                                    }}
                                  >
                                    <KeyRound className="h-4 w-4 mr-2" />
                                    Reset Password
                                  </DropdownMenuCheckboxItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </>
                          ) : (
                            <DropdownMenu>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <DropdownMenuTrigger asChild>
                                    <Button size="sm" variant="ghost">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>More actions</p>
                                </TooltipContent>
                              </Tooltip>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem
                                  onSelect={() => handleEditUser(user)}
                                >
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Edit User
                                </DropdownMenuItem>
                                
                                <DropdownMenuSub>
                                  <DropdownMenuSubTrigger>
                                    <Shield className="h-4 w-4 mr-2" />
                                    Manage Roles
                                  </DropdownMenuSubTrigger>
                                  <DropdownMenuSubContent>
                                    <DropdownMenuCheckboxItem
                                      checked={user.roles.includes("admin")}
                                      onCheckedChange={() => 
                                        handleToggleRole(user.id, "admin", user.roles.includes("admin"))
                                      }
                                    >
                                      <Shield className="h-4 w-4 mr-2" />
                                      Admin
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                      checked={user.roles.includes("owner")}
                                      onCheckedChange={() => 
                                        handleToggleRole(user.id, "owner", user.roles.includes("owner"))
                                      }
                                    >
                                      <Users className="h-4 w-4 mr-2" />
                                      Owner
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                      checked={user.roles.includes("board")}
                                      onCheckedChange={() => 
                                        handleToggleRole(user.id, "board", user.roles.includes("board"))
                                      }
                                    >
                                      <UserCheck className="h-4 w-4 mr-2" />
                                      Board Member
                                    </DropdownMenuCheckboxItem>
                                  </DropdownMenuSubContent>
                                </DropdownMenuSub>

                                <DropdownMenuItem
                                  onSelect={() => {
                                    setSelectedResetUser(user);
                                    setResetPasswordDialogOpen(true);
                                  }}
                                >
                                  <KeyRound className="h-4 w-4 mr-2" />
                                  Reset Password
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />

                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onSelect={() => {
                                    setSelectedUser(user);
                                    setDeactivateDialogOpen(true);
                                  }}
                                >
                                  <Archive className="h-4 w-4 mr-2" />
                                  Deactivate User
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
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

            {selectedUser?.units && selectedUser.units.length > 0 && (
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

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Permanently Delete User</DialogTitle>
            <DialogDescription>
              This action cannot be undone. Are you sure you want to permanently delete {userToDelete?.full_name}?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 space-y-2">
              <p className="text-sm font-semibold text-destructive">⚠️ Warning: This will permanently delete:</p>
              <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                <li>User account and authentication</li>
                <li>Profile information</li>
                <li>All roles and permissions</li>
                <li>Unit ownership records</li>
              </ul>
              <p className="text-sm font-medium text-muted-foreground mt-3">
                Their activity history (messages, photos, etc.) will be preserved but attributed to a deleted user.
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteDialogOpen(false);
                  setUserToDelete(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteUserPermanently}
                disabled={deletingPermanentUserId === userToDelete?.id}
              >
                {deletingPermanentUserId === userToDelete?.id ? "Deleting..." : "Delete Permanently"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information for {editingUser?.full_name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateUser} className="space-y-4">
            <div>
              <Label htmlFor="editEmail">Email</Label>
              <Input
                id="editEmail"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="Leave empty to keep current email"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty if you don't want to change the email
              </p>
            </div>
            <div>
              <Label htmlFor="editFullName">Full Name</Label>
              <Input
                id="editFullName"
                value={editFullName}
                onChange={(e) => setEditFullName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="editUnitNumber">Unit Number</Label>
              <Input
                id="editUnitNumber"
                value={editUnitNumber}
                onChange={(e) => setEditUnitNumber(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div>
              <Label htmlFor="editPhone">Phone Number</Label>
              <Input
                id="editPhone"
                type="tel"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="(808) 555-1234"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditDialogOpen(false);
                  setEditingUser(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? "Updating..." : "Update User"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={resetPasswordDialogOpen} onOpenChange={(open) => {
        setResetPasswordDialogOpen(open);
        if (!open) {
          setSelectedResetUser(null);
          setResetMethod("show");
          setResetPasswordResult(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Generate a new temporary password for {selectedResetUser?.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Notification Method</Label>
              <Select value={resetMethod} onValueChange={(value: any) => setResetMethod(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="show">Show Password (I'll tell them)</SelectItem>
                  <SelectItem value="email">Send Email</SelectItem>
                  {selectedResetUser?.phone && <SelectItem value="sms">Send SMS</SelectItem>}
                  {selectedResetUser?.phone && <SelectItem value="both">Send Email & SMS</SelectItem>}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-2">
                User will be required to change password on next login
              </p>
            </div>

            {resetPasswordResult && (
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm font-medium mb-2">New Temporary Password:</p>
                <p className="font-mono text-lg">{resetPasswordResult}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Share this password with the user. They will be required to change it upon login.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setResetPasswordDialogOpen(false);
                  setSelectedResetUser(null);
                  setResetMethod("show");
                  setResetPasswordResult(null);
                }}
              >
                {resetPasswordResult ? "Close" : "Cancel"}
              </Button>
              {!resetPasswordResult && (
                <Button onClick={handleResetPassword} disabled={isResettingPassword}>
                  {isResettingPassword ? "Resetting..." : "Reset Password"}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
    </TooltipProvider>
  );
}
