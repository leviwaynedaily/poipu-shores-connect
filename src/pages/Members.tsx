import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Phone, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
      (member.unit_number && member.unit_number.toLowerCase().includes(searchLower)) ||
      (member.email && member.email.toLowerCase().includes(searchLower))
    );

    setFilteredMembers(filtered);
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
            Search and browse Poipu Shores members
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name, unit, or email..."
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
                  <Card key={member.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-14 w-14">
                          <AvatarImage src={member.avatar_url || undefined} />
                          <AvatarFallback>
                            {member.full_name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-3">
                          <div>
                            <h3 className="font-semibold text-base">{member.full_name}</h3>
                            {member.unit_number && (
                              <p className="text-sm font-medium text-primary">
                                Unit {member.unit_number}
                              </p>
                            )}
                          </div>
                          
                          {(member.relationship_type || member.is_primary_contact) && (
                            <div className="flex items-center gap-2 flex-wrap">
                              {member.relationship_type && member.relationship_type !== 'primary' && (
                                <Badge variant="outline" className="text-xs capitalize">
                                  {member.relationship_type}
                                </Badge>
                              )}
                              {member.is_primary_contact && (
                                <Badge variant="secondary" className="text-xs">
                                  Primary Contact
                                </Badge>
                              )}
                            </div>
                          )}
                          
                          {member.show_contact_info ? (
                            <div className="space-y-1">
                              {member.phone && (
                                <a
                                  href={`tel:${member.phone}`}
                                  className="flex items-center gap-2 text-primary hover:underline text-sm"
                                >
                                  <Phone className="h-4 w-4" />
                                  {formatPhoneNumber(member.phone)}
                                </a>
                              )}
                              {member.email && (
                                <a
                                  href={`mailto:${member.email}`}
                                  className="flex items-center gap-2 text-primary hover:underline text-sm"
                                >
                                  <Mail className="h-4 w-4" />
                                  {member.email}
                                </a>
                              )}
                              {!member.phone && !member.email && (
                                <p className="text-sm text-muted-foreground">No contact info</p>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">Contact not shared</p>
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
                    <TableHead>Email</TableHead>
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
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={member.avatar_url || undefined} />
                              <AvatarFallback>
                                {member.full_name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{member.full_name}</div>
                              {member.is_primary_contact && (
                                <Badge variant="secondary" className="text-xs mt-1">
                                  Primary Contact
                                </Badge>
                              )}
                            </div>
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
                            <a
                              href={`tel:${member.phone}`}
                              className="flex items-center gap-2 text-primary hover:underline"
                            >
                              <Phone className="h-4 w-4" />
                              {formatPhoneNumber(member.phone)}
                            </a>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {member.show_contact_info && member.email ? (
                            <a
                              href={`mailto:${member.email}`}
                              className="flex items-center gap-2 text-primary hover:underline"
                            >
                              <Mail className="h-4 w-4" />
                              {member.email}
                            </a>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
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
    </div>
  );
};

export default Members;
