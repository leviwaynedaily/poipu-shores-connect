import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { Phone, Mail } from "lucide-react";
import { toast } from "sonner";

interface EmergencyContact {
  id: string;
  category: string;
  name: string;
  phone: string;
  email?: string;
  description?: string;
}

const getCategoryIcon = (category: string) => {
  const icons: Record<string, string> = {
    'Emergency': '🚨',
    'Police': '👮',
    'Medical': '🏥',
    'Fire': '🚒',
    'Property': '🏢',
    'Maintenance': '🔧',
  };
  return icons[category] || '📞';
};

export const EmergencyContacts = () => {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const { data, error } = await supabase
          .from('emergency_contacts')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (error) throw error;

        setContacts(data || []);
      } catch (error) {
        console.error('Error fetching emergency contacts:', error);
        toast.error('Failed to load emergency contacts');
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Emergency Contacts</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Emergency Contacts</CardTitle>
        <p className="text-xs text-muted-foreground">Important numbers for residents</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {contacts.map((contact) => (
          <div
            key={contact.id}
            className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
          >
            <div className="text-2xl">{getCategoryIcon(contact.category)}</div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{contact.name}</p>
              {contact.description && (
                <p className="text-xs text-muted-foreground mb-1">{contact.description}</p>
              )}
              <div className="flex flex-col gap-1">
                <a
                  href={`tel:${contact.phone}`}
                  className="flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  <Phone className="h-3 w-3" />
                  {contact.phone}
                </a>
                {contact.email && (
                  <a
                    href={`mailto:${contact.email}`}
                    className="flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    <Mail className="h-3 w-3" />
                    {contact.email}
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
