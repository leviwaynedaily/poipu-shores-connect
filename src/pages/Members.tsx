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

interface UnitOwner {
  unit_number: string;
  relationship_type: string;
  is_primary_contact: boolean;
  profiles: {
    id: string;
    full_name: string;
    phone: string | null;
    show_contact_info: boolean;
    avatar_url: string | null;
  };
}

interface GroupedUnit {
  unit_number: string;
  owners: UnitOwner[];
}

const Members = () => {
  const [units, setUnits] = useState<GroupedUnit[]>([]);
  const [filteredUnits, setFilteredUnits] = useState<GroupedUnit[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    filterUnits();
  }, [searchTerm, units]);

  const fetchMembers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("unit_owners")
      .select(`
        unit_number,
        relationship_type,
        is_primary_contact,
        profiles!inner (
          id,
          full_name,
          phone,
          show_contact_info,
          avatar_url
        )
      `)
      .order("unit_number", { ascending: true })
      .order("is_primary_contact", { ascending: false });

    if (!error && data) {
      // Group by unit number
      const grouped = data.reduce((acc: GroupedUnit[], item: any) => {
        const existingUnit = acc.find(u => u.unit_number === item.unit_number);
        const ownerData: UnitOwner = {
          unit_number: item.unit_number,
          relationship_type: item.relationship_type,
          is_primary_contact: item.is_primary_contact,
          profiles: item.profiles,
        };
        
        if (existingUnit) {
          existingUnit.owners.push(ownerData);
        } else {
          acc.push({
            unit_number: item.unit_number,
            owners: [ownerData],
          });
        }
        return acc;
      }, []);

      setUnits(grouped);
      setFilteredUnits(grouped);
    }
    setLoading(false);
  };

  const filterUnits = () => {
    if (!searchTerm.trim()) {
      setFilteredUnits(units);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = units
      .map(unit => ({
        ...unit,
        owners: unit.owners.filter(owner =>
          owner.profiles.full_name.toLowerCase().includes(term) ||
          unit.unit_number.toLowerCase().includes(term)
        ),
      }))
      .filter(unit => unit.owners.length > 0);
    
    setFilteredUnits(filtered);
  };

  const getRelationshipBadge = (type: string) => {
    const variants: { [key: string]: string } = {
      primary: "default",
      spouse: "secondary",
      "co-owner": "secondary",
      family: "outline",
    };
    return variants[type] || "outline";
  };

  const totalOwners = filteredUnits.reduce((sum, unit) => sum + unit.owners.length, 0);

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
          ) : filteredUnits.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-lg text-muted-foreground">
                {searchTerm ? "No owners found matching your search." : "No owners found."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Unit</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Relationship</TableHead>
                  <TableHead>Contact</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUnits.map((unit) => (
                  unit.owners.map((owner, idx) => (
                    <TableRow key={`${unit.unit_number}-${owner.profiles.id}`}>
                      {idx === 0 ? (
                        <TableCell rowSpan={unit.owners.length} className="font-medium align-top">
                          <Badge variant="secondary" className="w-fit">
                            <Home className="h-3 w-3 mr-1" />
                            {unit.unit_number}
                          </Badge>
                        </TableCell>
                      ) : null}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={owner.profiles.avatar_url || ""} />
                            <AvatarFallback>
                              {owner.profiles.full_name.split(" ").map(n => n[0]).join("").toUpperCase() || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-medium">{owner.profiles.full_name}</span>
                            {owner.is_primary_contact && (
                              <span className="text-xs text-muted-foreground">Primary Contact</span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRelationshipBadge(owner.relationship_type) as any}>
                          {owner.relationship_type.charAt(0).toUpperCase() + owner.relationship_type.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {owner.profiles.show_contact_info ? (
                          <>
                            {owner.profiles.phone ? (
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <a href={`tel:${owner.profiles.phone}`} className="hover:text-primary transition-colors">
                                  {formatPhoneNumber(owner.profiles.phone)}
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
                  ))
                ))}
              </TableBody>
            </Table>
          )}

          <div className="mt-6 pt-6 border-t">
            <p className="text-sm text-muted-foreground">
              {filteredUnits.length} {filteredUnits.length === 1 ? 'Unit' : 'Units'} • {totalOwners} {totalOwners === 1 ? 'Owner' : 'Owners'}
              {searchTerm && ` (filtered from ${units.length} units)`}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Members;
