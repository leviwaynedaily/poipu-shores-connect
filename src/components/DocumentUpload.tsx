import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload } from "lucide-react";

interface DocumentUploadProps {
  onUploadComplete: () => void;
  folders: string[];
}

const PREDEFINED_FOLDERS = [
  "Board Meeting Minutes",
  "Annual Meeting Minutes",
  "House Rules & Special Rules",
  "Financials & Reserve Study",
  "Insurance",
  "Maintenance & Property Projects",
  "Compliance & Legal",
];

export function DocumentUpload({ onUploadComplete, folders }: DocumentUploadProps) {
  const { toast } = useToast();
  
  // Merge predefined folders with existing folders
  const allFolders = Array.from(new Set([...PREDEFINED_FOLDERS, ...folders]));
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("general");
  const [folder, setFolder] = useState("none");
  const [newFolder, setNewFolder] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [unitNumber, setUnitNumber] = useState("");

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const uploadedCount = files.length;
    let successCount = 0;
    let failCount = 0;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        try {
          const fileExt = file.name.split(".").pop();
          const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          const actualFolder = folder === "none" ? "" : folder;
          const filePath = actualFolder || newFolder ? `${actualFolder || newFolder}/${fileName}` : fileName;

          const { error: uploadError } = await supabase.storage
            .from("documents")
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          // Use the file name as title if only uploading one file with a specified title
          // Otherwise, use the original filename
          const documentTitle = files.length === 1 && title ? title : file.name.replace(/\.[^/.]+$/, "");

          const { error: dbError } = await supabase
            .from("documents")
            .insert({
              title: documentTitle,
              category,
              folder: (folder === "none" ? null : folder) || newFolder || null,
              file_path: filePath,
              file_size: file.size,
              file_type: file.type,
              uploaded_by: user.id,
              unit_number: unitNumber || null,
            });

          if (dbError) throw dbError;
          successCount++;
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error);
          failCount++;
        }
      }

      if (successCount > 0) {
        toast({
          title: "Success",
          description: `${successCount} document${successCount > 1 ? 's' : ''} uploaded successfully${failCount > 0 ? `, ${failCount} failed` : ''}`,
        });
      }

      if (failCount > 0 && successCount === 0) {
        toast({
          title: "Error",
          description: `Failed to upload ${failCount} document${failCount > 1 ? 's' : ''}`,
          variant: "destructive",
        });
      }

      setTitle("");
      setCategory("general");
      setFolder("none");
      setNewFolder("");
      setFiles(null);
      setUnitNumber("");
      setIsOpen(false);
      onUploadComplete();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Upload Document
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Upload a new document to the community portal
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <Label htmlFor="file">File(s)</Label>
            <Input
              id="file"
              type="file"
              onChange={(e) => setFiles(e.target.files)}
              required
              multiple
              accept=".pdf,.doc,.docx,.txt,.xlsx,.xls,.pptx,.ppt"
            />
            {files && files.length > 1 && (
              <p className="text-sm text-muted-foreground mt-1">
                {files.length} files selected
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="title">Title {files && files.length > 1 && "(optional for multiple files)"}</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required={!files || files.length === 1}
              placeholder={files && files.length > 1 ? "Will use filenames" : "Document title"}
            />
            {files && files.length > 1 && (
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty to use original filenames as titles
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="financial">Financial</SelectItem>
                <SelectItem value="rules">Rules & Regulations</SelectItem>
                <SelectItem value="meeting">Meeting Minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="folder">Folder (Optional)</Label>
            <Select value={folder} onValueChange={setFolder}>
              <SelectTrigger>
                <SelectValue placeholder="Select or create new" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {allFolders.map((f) => (
                  <SelectItem key={f} value={f}>{f}</SelectItem>
                ))}
                <SelectItem value="__new__">+ Create New Folder</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {folder === "__new__" && (
            <div>
              <Label htmlFor="newFolder">New Folder Name</Label>
              <Input
                id="newFolder"
                value={newFolder}
                onChange={(e) => setNewFolder(e.target.value)}
                placeholder="Enter folder name"
              />
            </div>
          )}
          <div>
            <Label htmlFor="unitNumber">Unit Number (Optional)</Label>
            <Input
              id="unitNumber"
              value={unitNumber}
              onChange={(e) => setUnitNumber(e.target.value)}
              placeholder="Restrict to specific unit"
            />
          </div>
          <Button type="submit" className="w-full" disabled={isUploading}>
            {isUploading ? "Uploading..." : "Upload"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
