import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Folder,
  Download,
  Trash2,
  MoreVertical,
  FolderPlus,
  Edit,
  FolderInput,
  Home,
  Eye,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { DocumentViewer } from "./DocumentViewer";

interface FolderItem {
  id: string;
  name: string;
  parent_folder_id: string | null;
  created_at: string;
}

interface DocumentItem {
  id: string;
  title: string;
  category: string;
  folder_id: string | null;
  file_path: string;
  file_size: number | null;
  file_type: string | null;
  created_at: string;
  uploaded_by: string;
  uploader_name?: string;
}

interface DocumentBrowserProps {
  canManage: boolean;
  onRefresh?: () => void;
}

export function DocumentBrowser({ canManage, onRefresh }: DocumentBrowserProps) {
  const { toast } = useToast();
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<FolderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Dialogs
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [renameTarget, setRenameTarget] = useState<{ id: string; name: string; type: "folder" | "document" } | null>(null);
  const [moveTarget, setMoveTarget] = useState<{ id: string; type: "folder" | "document" } | null>(null);
  const [targetFolderId, setTargetFolderId] = useState<string | null>(null);
  const [viewingDocument, setViewingDocument] = useState<{ id: string; title: string; filePath: string; fileType: string | null } | null>(null);

  useEffect(() => {
    fetchData();
  }, [currentFolderId]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch folders - handle null parent_folder_id properly
      const foldersQuery = supabase
        .from("folders")
        .select("*")
        .order("name");
      
      const { data: foldersData, error: foldersError } = currentFolderId
        ? await foldersQuery.eq("parent_folder_id", currentFolderId)
        : await foldersQuery.is("parent_folder_id", null);

      if (foldersError) throw foldersError;

      // Fetch documents - handle null folder_id properly
      const docsQuery = supabase
        .from("documents")
        .select("*")
        .order("title");
      
      const { data: docsData, error: docsError } = currentFolderId
        ? await docsQuery.eq("folder_id", currentFolderId)
        : await docsQuery.is("folder_id", null);

      if (docsError) throw docsError;

      // Fetch uploader names
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name");

      const profilesMap = new Map(
        profilesData?.map((p) => [p.id, p.full_name]) || []
      );

      const enrichedDocs =
        docsData?.map((doc) => ({
          ...doc,
          uploader_name: profilesMap.get(doc.uploaded_by) || "Unknown",
        })) || [];

      setFolders(foldersData || []);
      setDocuments(enrichedDocs);

      // Build breadcrumbs
      if (currentFolderId) {
        await buildBreadcrumbs(currentFolderId);
      } else {
        setBreadcrumbs([]);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const buildBreadcrumbs = async (folderId: string) => {
    const crumbs: FolderItem[] = [];
    let currentId: string | null = folderId;

    while (currentId) {
      const { data } = await supabase
        .from("folders")
        .select("*")
        .eq("id", currentId)
        .single();

      if (data) {
        crumbs.unshift(data);
        currentId = data.parent_folder_id;
      } else {
        break;
      }
    }

    setBreadcrumbs(crumbs);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      const user = (await supabase.auth.getUser()).data.user;
      const { error } = await supabase.from("folders").insert({
        name: newFolderName.trim(),
        parent_folder_id: currentFolderId,
        created_by: user?.id,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Folder created successfully",
      });

      setNewFolderName("");
      setShowNewFolderDialog(false);
      fetchData();
      onRefresh?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRename = async () => {
    if (!renameTarget || !newFolderName.trim()) return;

    try {
      if (renameTarget.type === "folder") {
        const { error } = await supabase
          .from("folders")
          .update({ name: newFolderName.trim() })
          .eq("id", renameTarget.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("documents")
          .update({ title: newFolderName.trim() })
          .eq("id", renameTarget.id);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Renamed successfully",
      });

      setNewFolderName("");
      setRenameTarget(null);
      setShowRenameDialog(false);
      fetchData();
      onRefresh?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleMove = async () => {
    if (!moveTarget) return;

    try {
      if (moveTarget.type === "folder") {
        const { error } = await supabase
          .from("folders")
          .update({ parent_folder_id: targetFolderId })
          .eq("id", moveTarget.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("documents")
          .update({ folder_id: targetFolderId })
          .eq("id", moveTarget.id);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Moved successfully",
      });

      setMoveTarget(null);
      setTargetFolderId(null);
      setShowMoveDialog(false);
      fetchData();
      onRefresh?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!confirm("Are you sure? This will delete the folder and all its contents."))
      return;

    try {
      const { error } = await supabase.from("folders").delete().eq("id", folderId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Folder deleted successfully",
      });

      fetchData();
      onRefresh?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteDocument = async (id: string, filePath: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      const { error: storageError } = await supabase.storage
        .from("documents")
        .remove([filePath]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from("documents")
        .delete()
        .eq("id", id);

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "Document deleted successfully",
      });

      fetchData();
      onRefresh?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDownload = async (filePath: string, title: string) => {
    try {
      const { data, error } = await supabase.storage
        .from("documents")
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = title;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "—";
    const mb = bytes / (1024 * 1024);
    return mb < 1 ? `${(bytes / 1024).toFixed(1)} KB` : `${mb.toFixed(1)} MB`;
  };

  const FolderPicker = ({ excludeId }: { excludeId?: string }) => {
    const [allFolders, setAllFolders] = useState<FolderItem[]>([]);

    useEffect(() => {
      const fetchAllFolders = async () => {
        const { data } = await supabase.from("folders").select("*").order("name");
        setAllFolders(data || []);
      };
      fetchAllFolders();
    }, []);

    return (
      <div className="space-y-2 max-h-64 overflow-y-auto border rounded-md p-2">
        <Button
          variant={targetFolderId === null ? "default" : "outline"}
          className="w-full justify-start"
          onClick={() => setTargetFolderId(null)}
        >
          <Home className="mr-2 h-4 w-4" />
          Root Folder
        </Button>
        {allFolders
          .filter((f) => f.id !== excludeId)
          .map((folder) => (
            <Button
              key={folder.id}
              variant={targetFolderId === folder.id ? "default" : "outline"}
              className="w-full justify-start"
              onClick={() => setTargetFolderId(folder.id)}
            >
              <Folder className="mr-2 h-4 w-4" />
              {folder.name}
            </Button>
          ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between">
        <Breadcrumb>
          <BreadcrumbList>
            {currentFolderId && (
              <BreadcrumbItem>
                <BreadcrumbLink
                  className="cursor-pointer"
                  onClick={() => setCurrentFolderId(null)}
                >
                  <Home className="h-4 w-4" />
                </BreadcrumbLink>
              </BreadcrumbItem>
            )}
            {breadcrumbs.map((crumb, index) => (
              <div key={crumb.id} className="flex items-center">
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {index === breadcrumbs.length - 1 ? (
                    <BreadcrumbPage>{crumb.name}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink
                      className="cursor-pointer"
                      onClick={() => setCurrentFolderId(crumb.id)}
                    >
                      {crumb.name}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </div>
            ))}
          </BreadcrumbList>
        </Breadcrumb>

        {canManage && (
          <Button onClick={() => setShowNewFolderDialog(true)}>
            <FolderPlus className="mr-2 h-4 w-4" />
            New Folder
          </Button>
        )}
      </div>

      {/* Files and Folders Table */}
      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {folders.map((folder) => (
              <TableRow
                key={folder.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => setCurrentFolderId(folder.id)}
              >
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Folder className="h-5 w-5 text-primary" />
                    {folder.name}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">Folder</Badge>
                </TableCell>
                <TableCell>—</TableCell>
                <TableCell>
                  {new Date(folder.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  {canManage && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem
                          onClick={() => {
                            setRenameTarget({
                              id: folder.id,
                              name: folder.name,
                              type: "folder",
                            });
                            setNewFolderName(folder.name);
                            setShowRenameDialog(true);
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setMoveTarget({ id: folder.id, type: "folder" });
                            setShowMoveDialog(true);
                          }}
                        >
                          <FolderInput className="mr-2 h-4 w-4" />
                          Move
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDeleteFolder(folder.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
              </TableRow>
            ))}

            {documents.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell className="font-medium">
                  <div 
                    className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors"
                    onClick={() => setViewingDocument({ id: doc.id, title: doc.title, filePath: doc.file_path, fileType: doc.file_type })}
                  >
                    <FileText className="h-5 w-5" />
                    {doc.title}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{doc.category}</Badge>
                </TableCell>
                <TableCell>{formatFileSize(doc.file_size)}</TableCell>
                <TableCell>
                  {new Date(doc.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(doc.file_path, doc.title)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    {canManage && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem
                            onClick={() => {
                              setRenameTarget({
                                id: doc.id,
                                name: doc.title,
                                type: "document",
                              });
                              setNewFolderName(doc.title);
                              setShowRenameDialog(true);
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setMoveTarget({ id: doc.id, type: "document" });
                              setShowMoveDialog(true);
                            }}
                          >
                            <FolderInput className="mr-2 h-4 w-4" />
                            Move
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() =>
                              handleDeleteDocument(doc.id, doc.file_path)
                            }
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}

            {folders.length === 0 && documents.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  This folder is empty
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}

      {/* New Folder Dialog */}
      <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              Enter a name for the new folder
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Folder Name</Label>
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Enter folder name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewFolderDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFolder}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename {renameTarget?.type}</DialogTitle>
            <DialogDescription>Enter a new name</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Enter new name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRenameDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRename}>Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move Dialog */}
      <Dialog open={showMoveDialog} onOpenChange={setShowMoveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move {moveTarget?.type}</DialogTitle>
            <DialogDescription>Select a destination folder</DialogDescription>
          </DialogHeader>
          <FolderPicker excludeId={moveTarget?.type === "folder" ? moveTarget.id : undefined} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMoveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleMove}>Move</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Viewer */}
      {viewingDocument && (
        <DocumentViewer
          documentId={viewingDocument.id}
          documentTitle={viewingDocument.title}
          filePath={viewingDocument.filePath}
          fileType={viewingDocument.fileType}
          onClose={() => setViewingDocument(null)}
        />
      )}
    </div>
  );
}