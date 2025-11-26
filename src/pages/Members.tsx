import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";

// Interface for member
interface Member {
  id: string;
  full_name: string;
  phone: string | null;
  show_contact_info: boolean;
  avatar_url: string | null;
  unit_number: string | null;
  relationship_type: string | null;
  is_primary_contact: boolean | null;
}

const Members = () => {
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
      
      // Fetch all profiles with their unit information (if assigned)
      const { data: membersData, error } = await supabase
        .from("profiles")
        .select(`
          id,
          full_name,
          phone,
          show_contact_info,
          avatar_url,
          unit_owners (
            unit_number,
            relationship_type,
            is_primary_contact
          )
        `)
        .eq("is_active", true)
        .order("full_name");

      if (error) {
        console.error("Error fetching members:", error);
        toast.error("Failed to load members");
        return;
      }

      // Transform data to flat member list
      const membersList: Member[] = membersData?.map((profile: any) => {
        const unitOwner = profile.unit_owners?.[0]; // Take first unit if multiple
        
        return {
          id: profile.id,
          full_name: profile.full_name,
          phone: profile.phone,
          show_contact_info: profile.show_contact_info,
          avatar_url: profile.avatar_url,
          unit_number: unitOwner?.unit_number || null,
          relationship_type: unitOwner?.relationship_type || null,
          is_primary_contact: unitOwner?.is_primary_contact || null,
        };
      }) || [];

      // Sort: members with units first (by unit number), then others (alphabetically)
      membersList.sort((a, b) => {
        if (a.unit_number && !b.unit_number) return -1;
        if (!a.unit_number && b.unit_number) return 1;
        if (a.unit_number && b.unit_number) {
          return a.unit_number.localeCompare(b.unit_number, undefined, { numeric: true });
        }
        return a.full_name.localeCompare(b.full_name);
      });
      
      setMembers(membersList);
      setFilteredMembers(membersList);
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Poipu Shores Members"
        description="Connect with your neighbors at Poipu Shores"
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
              placeholder="Search by name or unit number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Relationship</TableHead>
                  <TableHead>Contact</TableHead>
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
                        {member.relationship_type ? (
                          <div className="flex items-center gap-2">
                            <span className="capitalize">{member.relationship_type}</span>
                            {member.is_primary_contact && (
                              <Badge variant="secondary" className="text-xs">
                                Primary Contact
                              </Badge>
                            )}
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
                            {member.phone}
                          </a>
                        ) : (
                          <span className="text-muted-foreground text-sm">Not shared</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

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
