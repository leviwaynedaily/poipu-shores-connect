import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown } from "lucide-react";

interface EmergencyContact {
  id: string;
  category: string;
  name: string;
  phone: string;
  email: string | null;
  description: string | null;
  display_order: number;
  is_active: boolean;
}

export function EmergencyContactManagement() {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);
  const [formData, setFormData] = useState({
    category: "emergency",
    name: "",
    phone: "",
    email: "",
    description: "",
    is_active: true,
  });

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const { data, error } = await supabase
        .from("emergency_contacts")
        .select("*")
        .order("display_order");

      if (error) throw error;
      setContacts(data || []);
    } catch (error: any) {
      toast.error("Failed to load contacts: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        email: formData.email || null,
        description: formData.description || null,
      };

      if (editingContact) {
        const { error } = await supabase
          .from("emergency_contacts")
          .update(submitData)
          .eq("id", editingContact.id);
        if (error) throw error;
        toast.success("Contact updated successfully");
      } else {
        const maxOrder = contacts.length > 0 ? Math.max(...contacts.map(c => c.display_order)) : 0;
        const { error } = await supabase
          .from("emergency_contacts")
          .insert({ ...submitData, display_order: maxOrder + 1 });
        if (error) throw error;
        toast.success("Contact added successfully");
      }
      setDialogOpen(false);
      resetForm();
      fetchContacts();
    } catch (error: any) {
      toast.error("Failed to save contact: " + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this contact?")) return;
    try {
      const { error } = await supabase.from("emergency_contacts").delete().eq("id", id);
      if (error) throw error;
      toast.success("Contact deleted successfully");
      fetchContacts();
    } catch (error: any) {
      toast.error("Failed to delete contact: " + error.message);
    }
  };

  const handleReorder = async (id: string, direction: "up" | "down") => {
    const index = contacts.findIndex(c => c.id === id);
    if ((direction === "up" && index === 0) || (direction === "down" && index === contacts.length - 1)) return;

    const newIndex = direction === "up" ? index - 1 : index + 1;
    const newContacts = [...contacts];
    [newContacts[index], newContacts[newIndex]] = [newContacts[newIndex], newContacts[index]];

    try {
      await Promise.all(
        newContacts.map((contact, i) =>
          supabase.from("emergency_contacts").update({ display_order: i }).eq("id", contact.id)
        )
      );
      fetchContacts();
    } catch (error: any) {
      toast.error("Failed to reorder: " + error.message);
    }
  };

  const resetForm = () => {
    setFormData({ category: "emergency", name: "", phone: "", email: "", description: "", is_active: true });
    setEditingContact(null);
  };

  const openEditDialog = (contact: EmergencyContact) => {
    setEditingContact(contact);
    setFormData({
      category: contact.category,
      name: contact.name,
      phone: contact.phone,
      email: contact.email || "",
      description: contact.description || "",
      is_active: contact.is_active,
    });
    setDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Emergency Contact Management</CardTitle>
            <CardDescription>Manage emergency contact information for the community</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Contact
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingContact ? "Edit Contact" : "Add New Contact"}</DialogTitle>
                <DialogDescription>Configure emergency contact information</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="emergency">Emergency</SelectItem>
                      <SelectItem value="security">Security</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="medical">Medical</SelectItem>
                      <SelectItem value="utilities">Utilities</SelectItem>
                      <SelectItem value="management">Management</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email (optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="active">Active</Label>
                </div>
                <DialogFooter>
                  <Button type="submit">{editingContact ? "Update" : "Add"} Contact</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : contacts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No emergency contacts configured yet</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((contact, index) => (
                <TableRow key={contact.id}>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleReorder(contact.id, "up")}
                        disabled={index === 0}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleReorder(contact.id, "down")}
                        disabled={index === contacts.length - 1}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">{contact.category}</TableCell>
                  <TableCell className="font-medium">{contact.name}</TableCell>
                  <TableCell>{contact.phone}</TableCell>
                  <TableCell>
                    <span className={contact.is_active ? "text-green-600" : "text-muted-foreground"}>
                      {contact.is_active ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(contact)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(contact.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
