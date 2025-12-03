import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Phone, Mail, User, Home } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { usePageConfig } from "@/hooks/use-page-config";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatPhoneNumber } from "@/lib/phoneUtils";

// Interface for member
interface Member {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  show_contact_info: boolean;
  avatar_url: string | null;
  unit_number: string | null;
  relationship_type: string | null;
  is_primary_contact: boolean | null;
}

const Members = () => {
  const { pageConfig } = usePageConfig();
  const isMobile = useIsMobile();
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    filterMembers();
  }, [searchTerm, members]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Please log in to view members");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('get-members', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) {
        console.error("Error fetching members:", error);
        toast.error("Failed to load members");
        return;
      }

      setMembers(data.members || []);
      setFilteredMembers(data.members || []);
    } catch (error) {
      console.error("Error in fetchMembers:", error);
      toast.error("An error occurred while loading members");
    } finally {
      setLoading(false);
    }
  };

  const filterMembers = () => {
    if (!searchTerm.trim()) {
      setFilteredMembers(members);
      return;
    }

    const searchLower = searchTerm.toLowerCase();
    const filtered = members.filter(member =>
      member.full_name.toLowerCase().includes(searchLower) ||
      (member.unit_number && member.unit_number.toLowerCase().includes(searchLower))
    );

    setFilteredMembers(filtered);
  };

  const handleMemberClick = (member: Member) => {
    setSelectedMember(member);
    setProfileDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Poipu Shores Members"
        description="Connect with your neighbors at Poipu Shores"
        logoUrl={pageConfig?.headerLogoUrl}
      />

      <Card>
        <CardHeader>
          <CardTitle>Member Directory</CardTitle>
          <CardDescription>
            Search and browse Poipu Shores members. Click on a member to view their profile.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name or unit number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {isMobile ? (
            // Mobile card view
            <div className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredMembers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  {searchTerm ? "No members found matching your search" : "No members found"}
                </div>
              ) : (
                filteredMembers.map((member) => (
                  <Card 
                    key={member.id} 
                    className="cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => handleMemberClick(member)}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-14 w-14">
                          <AvatarImage src={member.avatar_url || undefined} />
                          <AvatarFallback>
                            {member.full_name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-semibold text-base">{member.full_name}</h3>
                          {member.unit_number && (
                            <p className="text-sm text-muted-foreground">
                              Unit {member.unit_number}
                            </p>
                          )}
                          {member.is_primary_contact && (
                            <Badge variant="secondary" className="text-xs mt-1">
                              Primary Contact
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          ) : (
            // Desktop table view
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredMembers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        {searchTerm ? "No members found matching your search" : "No members found"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMembers.map((member) => (
                      <TableRow 
                        key={member.id} 
                        className="cursor-pointer hover:bg-accent/50"
                        onClick={() => handleMemberClick(member)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={member.avatar_url || undefined} />
                              <AvatarFallback>
                                {member.full_name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="font-medium">{member.full_name}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {member.unit_number ? (
                            <div className="font-medium text-primary">
                              Unit {member.unit_number}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {member.show_contact_info && member.phone ? (
                            <span className="text-muted-foreground">
                              {formatPhoneNumber(member.phone)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {member.is_primary_contact && (
                            <Badge variant="secondary" className="text-xs">
                              Primary Contact
                            </Badge>
                          )}
                          {member.relationship_type && member.relationship_type !== 'primary' && (
                            <Badge variant="outline" className="text-xs capitalize">
                              {member.relationship_type}
                            </Badge>
                          )}
                          {!member.is_primary_contact && (!member.relationship_type || member.relationship_type === 'primary') && (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {!loading && filteredMembers.length > 0 && (
            <div className="flex items-center justify-between px-2 py-4">
              <p className="text-sm text-muted-foreground">
                {filteredMembers.length} {filteredMembers.length === 1 ? 'Member' : 'Members'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Member Profile Dialog */}
      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Member Profile</DialogTitle>
          </DialogHeader>
          {selectedMember && (
            <div className="space-y-6">
              {/* Avatar and Name */}
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarImage src={selectedMember.avatar_url || undefined} />
                  <AvatarFallback className="text-2xl">
                    {selectedMember.full_name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-semibold">{selectedMember.full_name}</h2>
                {selectedMember.unit_number && (
                  <p className="text-muted-foreground">Unit {selectedMember.unit_number}</p>
                )}
                <div className="flex gap-2 mt-2">
                  {selectedMember.is_primary_contact && (
                    <Badge variant="secondary">Primary Contact</Badge>
                  )}
                  {selectedMember.relationship_type && selectedMember.relationship_type !== 'primary' && (
                    <Badge variant="outline" className="capitalize">
                      {selectedMember.relationship_type}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              {selectedMember.show_contact_info ? (
                <div className="space-y-3 border-t pt-4">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    Contact Information
                  </h3>
                  
                  {selectedMember.unit_number && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/50">
                      <Home className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Unit</p>
                        <p className="font-medium">{selectedMember.unit_number}</p>
                      </div>
                    </div>
                  )}
                  
                  {selectedMember.phone && (
                    <a 
                      href={`tel:${selectedMember.phone}`}
                      className="flex items-center gap-3 p-3 rounded-lg bg-accent/50 hover:bg-accent transition-colors"
                    >
                      <Phone className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="font-medium">{formatPhoneNumber(selectedMember.phone)}</p>
                      </div>
                    </a>
                  )}
                  
                  {selectedMember.email && (
                    <a 
                      href={`mailto:${selectedMember.email}`}
                      className="flex items-center gap-3 p-3 rounded-lg bg-accent/50 hover:bg-accent transition-colors"
                    >
                      <Mail className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">{selectedMember.email}</p>
                      </div>
                    </a>
                  )}
                  
                  {!selectedMember.phone && !selectedMember.email && (
                    <p className="text-muted-foreground text-center py-4">
                      No contact information available
                    </p>
                  )}
                </div>
              ) : (
                <div className="border-t pt-4 text-center">
                  <p className="text-muted-foreground">
                    This member has chosen not to share their contact information
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Members;
