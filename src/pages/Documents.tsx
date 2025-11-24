import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocumentUpload } from "@/components/DocumentUpload";
import { DocumentChat } from "@/components/DocumentChat";
import { DocumentBrowser } from "@/components/documents/DocumentBrowser";
import { FileText, RefreshCw } from "lucide-react";
import chickenIcon from "@/assets/chicken-assistant.jpeg";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function Documents() {
  const { isAdmin, isBoard } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const { toast } = useToast();

  const canManage = isAdmin || isBoard;

  const handleBatchExtract = async () => {
    setIsExtracting(true);
    try {
      const { data, error } = await supabase.functions.invoke("batch-extract-documents");
      
      if (error) throw error;

      toast({
        title: "Content Extraction Complete",
        description: data.message || "All documents processed successfully",
      });
      
      setRefreshTrigger((k) => k + 1);
    } catch (error: any) {
      console.error("Error extracting documents:", error);
      toast({
        title: "Extraction Error",
        description: error.message || "Failed to extract document content",
        variant: "destructive",
      });
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Poipu Documents"
        description="Navigate folders, manage documents, and ask questions with AI"
        actions={
          canManage && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleBatchExtract}
                disabled={isExtracting}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isExtracting ? 'animate-spin' : ''}`} />
                {isExtracting ? "Extracting..." : "Extract Existing"}
              </Button>
              <DocumentUpload
                onUploadComplete={() => setRefreshTrigger((k) => k + 1)}
                folders={[]}
                currentFolderId={currentFolderId}
              />
            </div>
          )
        }
      />

      <Tabs defaultValue="browse" className="w-full">
        <TabsList>
          <TabsTrigger value="browse">
            <FileText className="mr-2 h-4 w-4" />
            Browse Documents
          </TabsTrigger>
          <TabsTrigger value="chat">
            <img src={chickenIcon} alt="Chicken" className="mr-2 h-4 w-4 rounded-full object-cover" />
            Ask the Chicken
          </TabsTrigger>
        </TabsList>

        <TabsContent value="browse">
          <Card>
            <CardContent className="pt-6">
              <DocumentBrowser
                canManage={canManage}
                refreshTrigger={refreshTrigger}
                onFolderChange={setCurrentFolderId}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chat">
          <DocumentChat documentIds={[]} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
