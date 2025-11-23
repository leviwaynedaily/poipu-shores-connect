import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocumentUpload } from "@/components/DocumentUpload";
import { DocumentChat } from "@/components/DocumentChat";
import { FileText, Folder, Download, Trash2, MessageSquare } from "lucide-react";

interface Document {
  id: string;
  title: string;
  category: string;
  folder: string | null;
  file_path: string;
  file_size: number | null;
  file_type: string | null;
  created_at: string;
  uploaded_by: string;
  uploader_name?: string;
}

export default function Documents() {
  const { isAdmin, isBoard } = useAuth();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const canUpload = isAdmin || isBoard;

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const { data: docsData, error } = await supabase
        .from("documents")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name");

      const profilesMap = new Map(
        profilesData?.map(p => [p.id, p.full_name]) || []
      );

      const enrichedDocs = docsData?.map(doc => ({
        ...doc,
        uploader_name: profilesMap.get(doc.uploaded_by) || "Unknown",
      })) || [];

      setDocuments(enrichedDocs);
      
      const uniqueFolders = Array.from(
        new Set(enrichedDocs.filter(d => d.folder).map(d => d.folder) || [])
      ) as string[];
      setFolders(uniqueFolders);
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

  const handleDelete = async (id: string, filePath: string) => {
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

      fetchDocuments();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const filteredDocuments = selectedFolder
    ? documents.filter(d => d.folder === selectedFolder)
    : documents;

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "—";
    const mb = bytes / (1024 * 1024);
    return mb < 1 ? `${(bytes / 1024).toFixed(1)} KB` : `${mb.toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Document Library</h2>
          <p className="text-muted-foreground">
            Access community documents and ask questions with AI
          </p>
        </div>
        {canUpload && (
          <DocumentUpload onUploadComplete={fetchDocuments} folders={folders} />
        )}
      </div>

      <Tabs defaultValue="browse" className="w-full">
        <TabsList>
          <TabsTrigger value="browse">
            <FileText className="mr-2 h-4 w-4" />
            Browse Documents
          </TabsTrigger>
          <TabsTrigger value="chat">
            <MessageSquare className="mr-2 h-4 w-4" />
            AI Assistant
          </TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-4">
          {folders.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={selectedFolder === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedFolder(null)}
              >
                All Documents
              </Button>
              {folders.map((folder) => (
                <Button
                  key={folder}
                  variant={selectedFolder === folder ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedFolder(folder)}
                >
                  <Folder className="mr-2 h-4 w-4" />
                  {folder}
                </Button>
              ))}
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>
                {selectedFolder ? `Documents in ${selectedFolder}` : "All Documents"}
              </CardTitle>
              <CardDescription>
                {filteredDocuments.length} document{filteredDocuments.length !== 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading documents...</div>
              ) : filteredDocuments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No documents found
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Folder</TableHead>
                      <TableHead>Uploaded By</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDocuments.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">{doc.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{doc.category}</Badge>
                        </TableCell>
                        <TableCell>
                          {doc.folder ? (
                            <div className="flex items-center gap-1">
                              <Folder className="h-4 w-4" />
                              {doc.folder}
                            </div>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>{doc.uploader_name}</TableCell>
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
                            {canUpload && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete(doc.id, doc.file_path)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chat">
          <DocumentChat documentIds={filteredDocuments.map(d => d.id)} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
