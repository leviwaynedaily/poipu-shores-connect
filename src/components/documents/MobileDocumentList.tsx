import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileText,
  Folder,
  Download,
  Trash2,
  MoreVertical,
  Edit,
  FolderInput,
  Eye,
} from "lucide-react";
import { format } from "date-fns";

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

interface MobileDocumentListProps {
  folders: FolderItem[];
  documents: DocumentItem[];
  canManage: boolean;
  selectedDocuments: Set<string>;
  onFolderClick: (folderId: string) => void;
  onDocumentView: (doc: DocumentItem) => void;
  onDocumentDownload: (filePath: string, title: string) => void;
  onToggleDocument: (docId: string) => void;
  onRenameFolder: (id: string, name: string) => void;
  onRenameDocument: (id: string, name: string) => void;
  onMoveFolder: (id: string) => void;
  onMoveDocument: (id: string) => void;
  onDeleteFolder: (id: string, name: string) => void;
  onDeleteDocument: (id: string, filePath: string) => void;
}

export function MobileDocumentList({
  folders,
  documents,
  canManage,
  selectedDocuments,
  onFolderClick,
  onDocumentView,
  onDocumentDownload,
  onToggleDocument,
  onRenameFolder,
  onRenameDocument,
  onMoveFolder,
  onMoveDocument,
  onDeleteFolder,
  onDeleteDocument,
}: MobileDocumentListProps) {
  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "Unknown";
    const kb = bytes / 1024;
    const mb = kb / 1024;
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${kb.toFixed(0)} KB`;
  };

  const getFileIcon = (fileType: string | null) => {
    if (!fileType) return <FileText className="h-5 w-5" />;
    
    if (fileType.includes("pdf")) {
      return <FileText className="h-5 w-5 text-red-500" />;
    } else if (fileType.includes("image")) {
      return <FileText className="h-5 w-5 text-blue-500" />;
    } else if (fileType.includes("word") || fileType.includes("document")) {
      return <FileText className="h-5 w-5 text-blue-600" />;
    } else if (fileType.includes("sheet") || fileType.includes("excel")) {
      return <FileText className="h-5 w-5 text-green-600" />;
    }
    return <FileText className="h-5 w-5" />;
  };

  return (
    <div className="space-y-2">
      {/* Folders */}
      {folders.map((folder) => (
        <div
          key={folder.id}
          className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg"
        >
          <Folder className="h-5 w-5 text-primary shrink-0" />
          <div
            className="flex-1 min-w-0 cursor-pointer"
            onClick={() => onFolderClick(folder.id)}
          >
            <div className="font-medium truncate">{folder.name}</div>
            <div className="text-xs text-muted-foreground">
              {format(new Date(folder.created_at), "MMM d, yyyy")}
            </div>
          </div>
          {canManage && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 hover:bg-accent rounded-md shrink-0">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onRenameFolder(folder.id, folder.name)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onMoveFolder(folder.id)}>
                  <FolderInput className="mr-2 h-4 w-4" />
                  Move
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDeleteFolder(folder.id, folder.name)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      ))}

      {/* Documents */}
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg"
        >
          {canManage && (
            <Checkbox
              checked={selectedDocuments.has(doc.id)}
              onCheckedChange={() => onToggleDocument(doc.id)}
              className="shrink-0"
            />
          )}
          {getFileIcon(doc.file_type)}
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{doc.title}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <span>{formatFileSize(doc.file_size)}</span>
              <span>•</span>
              <span>{format(new Date(doc.created_at), "MMM d, yyyy")}</span>
            </div>
            <Badge variant="secondary" className="mt-1 text-xs">
              {doc.category}
            </Badge>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onDocumentView(doc)}
              className="p-2 hover:bg-accent rounded-md"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDocumentDownload(doc.file_path, doc.title)}
              className="p-2 hover:bg-accent rounded-md"
            >
              <Download className="h-4 w-4" />
            </button>
            {canManage && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-2 hover:bg-accent rounded-md">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onRenameDocument(doc.id, doc.title)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onMoveDocument(doc.id)}>
                    <FolderInput className="mr-2 h-4 w-4" />
                    Move
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDeleteDocument(doc.id, doc.file_path)}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      ))}

      {/* Empty state */}
      {folders.length === 0 && documents.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No folders or documents here</p>
        </div>
      )}
    </div>
  );
}
