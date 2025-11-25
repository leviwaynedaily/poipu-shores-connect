import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Phone, Home } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatPhoneNumber } from "@/lib/phoneUtils";
import { PageHeader } from "@/components/PageHeader";

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
        title="Community Members"
        description="Connect with your neighbors at Poipu Shores"
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Member Directory</CardTitle>
          <CardDescription className="text-lg">
            Search and browse community members
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
              <p className="text-lg text-muted-foreground">Loading members...</p>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-lg text-muted-foreground">
                {searchTerm ? "No members found matching your search." : "No members found."}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredMembers.map((member) => (
                <Card key={member.id} className="border-2">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={member.avatar_url || ""} />
                        <AvatarFallback>
                          {member.full_name.split(" ").map(n => n[0]).join("").toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-xl truncate">{member.full_name}</CardTitle>
                      </div>
                    </div>
                    {member.unit_number && (
                      <Badge variant="secondary" className="text-base w-fit">
                        <Home className="h-4 w-4 mr-1" />
                        Unit {member.unit_number}
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {member.show_contact_info ? (
                      <>
                        {member.phone && (
                          <div className="flex items-center gap-2 text-base text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            <a href={`tel:${member.phone}`} className="hover:text-foreground transition-colors">
                              {formatPhoneNumber(member.phone)}
                            </a>
                          </div>
                        )}
                        {!member.phone && (
                          <p className="text-sm text-muted-foreground">No contact info provided</p>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">Contact info hidden by user</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="mt-6 pt-6 border-t">
            <p className="text-sm text-muted-foreground">
              Total Members: {filteredMembers.length}
              {searchTerm && ` (filtered from ${members.length})`}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Members;
