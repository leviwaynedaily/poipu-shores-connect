import { useState, useEffect } from "react";
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
  currentFolderId?: string | null;
}

interface Folder {
  id: string;
  name: string;
  parent_folder_id: string | null;
}

export function DocumentUpload({ onUploadComplete, folders: _folders, currentFolderId }: DocumentUploadProps) {
  const { toast } = useToast();
  const [allFolders, setAllFolders] = useState<Folder[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("general");
  const [folderId, setFolderId] = useState<string | null>(currentFolderId || null);
  const [newFolderName, setNewFolderName] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [unitNumber, setUnitNumber] = useState("");
  const [uploadMode, setUploadMode] = useState<"files" | "folder">("files");

  useEffect(() => {
    fetchFolders();
  }, []);

  useEffect(() => {
    if (currentFolderId) {
      setFolderId(currentFolderId);
    }
  }, [currentFolderId]);

  const fetchFolders = async () => {
    const { data } = await supabase
      .from("folders")
      .select("*")
      .order("name");
    
    setAllFolders(data || []);
  };

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

      // Create new folder if needed
      let targetFolderId = folderId;
      if (folderId === "__new__" && newFolderName) {
        const { data: newFolder, error: folderError } = await supabase
          .from("folders")
          .insert({
            name: newFolderName.trim(),
            parent_folder_id: null,
            created_by: user.id,
          })
          .select()
          .single();

        if (folderError) throw folderError;
        targetFolderId = newFolder.id;
      }

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        try {
          const fileExt = file.name.split(".").pop();
          const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = fileName;

          const { error: uploadError } = await supabase.storage
            .from("documents")
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          // Use the file name as title if only uploading one file with a specified title
          // Otherwise, use the original filename
          const documentTitle = files.length === 1 && title ? title : file.name.replace(/\.[^/.]+$/, "");

          const { data: insertedDoc, error: dbError } = await supabase
            .from("documents")
            .insert({
              title: documentTitle,
              category,
              folder_id: targetFolderId === "none" ? null : targetFolderId,
              file_path: filePath,
              file_size: file.size,
              file_type: file.type,
              uploaded_by: user.id,
              unit_number: unitNumber || null,
            })
            .select()
            .single();

          if (dbError) throw dbError;

          // Extract document content in the background
          if (insertedDoc) {
            supabase.functions
              .invoke("extract-document-content", {
                body: {
                  documentId: insertedDoc.id,
                  filePath: filePath,
                },
              })
              .then(({ error }) => {
                if (error) {
                  console.error("Error extracting document content:", error);
                }
              });
          }

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
      setFolderId(currentFolderId); // Keep the current folder instead of resetting to null
      setNewFolderName("");
      setFiles(null);
      setUnitNumber("");
      setUploadMode("files");
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
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Upload a new document to the community portal
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <Label>Upload Type</Label>
            <div className="flex gap-2 mt-2">
              <Button
                type="button"
                variant={uploadMode === "files" ? "default" : "outline"}
                onClick={() => {
                  setUploadMode("files");
                  setFiles(null);
                }}
                className="flex-1"
              >
                Files
              </Button>
              <Button
                type="button"
                variant={uploadMode === "folder" ? "default" : "outline"}
                onClick={() => {
                  setUploadMode("folder");
                  setFiles(null);
                }}
                className="flex-1"
              >
                Folder
              </Button>
            </div>
          </div>
          <div>
            <Label htmlFor="file">{uploadMode === "folder" ? "Select Folder" : "File(s)"}</Label>
            <Input
              id="file"
              type="file"
              onChange={(e) => setFiles(e.target.files)}
              required
              multiple={uploadMode === "files"}
              {...(uploadMode === "folder" ? { 
                webkitdirectory: "" as any, 
                directory: "" as any 
              } : {})}
              accept={uploadMode === "files" ? ".pdf,.doc,.docx,.txt,.xlsx,.xls,.pptx,.ppt" : undefined}
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
            <Select value={folderId || "none"} onValueChange={setFolderId}>
              <SelectTrigger>
                <SelectValue placeholder="Select or create new" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {allFolders.map((f) => (
                  <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                ))}
                <SelectItem value="__new__">+ Create New Folder</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {folderId === "__new__" && (
            <div>
              <Label htmlFor="newFolder">New Folder Name</Label>
              <Input
                id="newFolder"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Enter folder name"
                required
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
