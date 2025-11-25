import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Phone, Home } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatPhoneNumber } from "@/lib/phoneUtils";
import { PageHeader } from "@/components/PageHeader";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Member {
  id: string;
  full_name: string;
  unit_number: string | null;
  phone: string | null;
  show_contact_info: boolean;
  avatar_url: string | null;
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
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, unit_number, phone, show_contact_info, avatar_url")
      .order("unit_number", { ascending: true, nullsFirst: false })
      .order("full_name", { ascending: true });

    if (!error && data) {
      setMembers(data);
      setFilteredMembers(data);
    }
    setLoading(false);
  };

  const filterMembers = () => {
    if (!searchTerm.trim()) {
      setFilteredMembers(members);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = members.filter(
      (member) =>
        member.full_name.toLowerCase().includes(term) ||
        member.unit_number?.toLowerCase().includes(term)
    );
    setFilteredMembers(filtered);
  };

  const getMemberEmail = (memberId: string) => {
    // Email is stored in auth.users, we'd need to query separately
    // For now, we'll hide emails unless contact info is shown
    return null;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Poipu Shores Owners"
        description="Connect with your neighbors at Poipu Shores"
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Owner Directory</CardTitle>
          <CardDescription className="text-lg">
            Search and browse Poipu Shores owners
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
              className="pl-10 text-lg py-6"
            />
          </div>

          {loading ? (
            <div className="text-center py-8">
              <p className="text-lg text-muted-foreground">Loading owners...</p>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-lg text-muted-foreground">
                {searchTerm ? "No owners found matching your search." : "No owners found."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Owner</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Contact</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={member.avatar_url || ""} />
                          <AvatarFallback>
                            {member.full_name.split(" ").map(n => n[0]).join("").toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{member.full_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {member.unit_number ? (
                        <Badge variant="secondary" className="w-fit">
                          <Home className="h-3 w-3 mr-1" />
                          {member.unit_number}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {member.show_contact_info ? (
                        <>
                          {member.phone ? (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <a href={`tel:${member.phone}`} className="hover:text-primary transition-colors">
                                {formatPhoneNumber(member.phone)}
                              </a>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">No contact info</span>
                          )}
                        </>
                      ) : (
                        <span className="text-sm text-muted-foreground">Contact info hidden</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <div className="mt-6 pt-6 border-t">
            <p className="text-sm text-muted-foreground">
              Total Owners: {filteredMembers.length}
              {searchTerm && ` (filtered from ${members.length})`}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Members;
