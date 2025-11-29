import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown } from "lucide-react";

interface Webcam {
  id: string;
  name: string;
  location: string;
  url: string;
  webcam_type: string;
  display_order: number;
  is_active: boolean;
}

export function WebcamManagement() {
  const [webcams, setWebcams] = useState<Webcam[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWebcam, setEditingWebcam] = useState<Webcam | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    url: "",
    webcam_type: "youtube",
    is_active: true,
  });

  useEffect(() => {
    fetchWebcams();
  }, []);

  const fetchWebcams = async () => {
    try {
      const { data, error } = await supabase
        .from("webcams")
        .select("*")
        .order("display_order");

      if (error) throw error;
      setWebcams(data || []);
    } catch (error: any) {
      toast.error("Failed to load webcams: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingWebcam) {
        const { error } = await supabase
          .from("webcams")
          .update(formData)
          .eq("id", editingWebcam.id);
        if (error) throw error;
        toast.success("Webcam updated successfully");
      } else {
        const maxOrder = webcams.length > 0 ? Math.max(...webcams.map(w => w.display_order)) : 0;
        const { error } = await supabase
          .from("webcams")
          .insert({ ...formData, display_order: maxOrder + 1 });
        if (error) throw error;
        toast.success("Webcam added successfully");
      }
      setDialogOpen(false);
      resetForm();
      fetchWebcams();
    } catch (error: any) {
      toast.error("Failed to save webcam: " + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this webcam?")) return;
    try {
      const { error } = await supabase.from("webcams").delete().eq("id", id);
      if (error) throw error;
      toast.success("Webcam deleted successfully");
      fetchWebcams();
    } catch (error: any) {
      toast.error("Failed to delete webcam: " + error.message);
    }
  };

  const handleReorder = async (id: string, direction: "up" | "down") => {
    const index = webcams.findIndex(w => w.id === id);
    if ((direction === "up" && index === 0) || (direction === "down" && index === webcams.length - 1)) return;

    const newIndex = direction === "up" ? index - 1 : index + 1;
    const newWebcams = [...webcams];
    [newWebcams[index], newWebcams[newIndex]] = [newWebcams[newIndex], newWebcams[index]];

    try {
      await Promise.all(
        newWebcams.map((webcam, i) =>
          supabase.from("webcams").update({ display_order: i }).eq("id", webcam.id)
        )
      );
      fetchWebcams();
    } catch (error: any) {
      toast.error("Failed to reorder: " + error.message);
    }
  };

  const resetForm = () => {
    setFormData({ name: "", location: "", url: "", webcam_type: "youtube", is_active: true });
    setEditingWebcam(null);
  };

  const openEditDialog = (webcam: Webcam) => {
    setEditingWebcam(webcam);
    setFormData({
      name: webcam.name,
      location: webcam.location,
      url: webcam.url,
      webcam_type: webcam.webcam_type,
      is_active: webcam.is_active,
    });
    setDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle>Webcam Management</CardTitle>
            <CardDescription>Manage live camera feeds displayed on the dashboard</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Add Webcam
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingWebcam ? "Edit Webcam" : "Add New Webcam"}</DialogTitle>
                <DialogDescription>Configure a live camera feed for the dashboard</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
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
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="url">URL</Label>
                  <Input
                    id="url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    placeholder="https://youtube.com/embed/..."
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select value={formData.webcam_type} onValueChange={(value) => setFormData({ ...formData, webcam_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="youtube">YouTube Embed</SelectItem>
                      <SelectItem value="external">External Link</SelectItem>
                    </SelectContent>
                  </Select>
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
                  <Button type="submit">{editingWebcam ? "Update" : "Add"} Webcam</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : webcams.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No webcams configured yet</p>
        ) : (
          <div className="border rounded-lg overflow-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {webcams.map((webcam, index) => (
                <TableRow key={webcam.id}>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleReorder(webcam.id, "up")}
                        disabled={index === 0}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleReorder(webcam.id, "down")}
                        disabled={index === webcams.length - 1}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{webcam.name}</TableCell>
                  <TableCell>{webcam.location}</TableCell>
                  <TableCell className="capitalize">{webcam.webcam_type}</TableCell>
                  <TableCell>
                    <span className={webcam.is_active ? "text-green-600" : "text-muted-foreground"}>
                      {webcam.is_active ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(webcam)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(webcam.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
