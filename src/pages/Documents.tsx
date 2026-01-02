import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocumentUpload } from "@/components/DocumentUpload";
import { DocumentBrowser } from "@/components/documents/DocumentBrowser";
import { FileText, RefreshCw, MessageCircle, Sparkles } from "lucide-react";
import defaultChickenIcon from "@/assets/chicken-assistant.jpeg";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { usePageConfig } from "@/hooks/use-page-config";

export default function Documents() {
  const { isAdmin, isOwner } = useAuth();
  const { pageConfig } = usePageConfig();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isEmbedding, setIsEmbedding] = useState(false);
  const [chickenIcon, setChickenIcon] = useState<string>(defaultChickenIcon);
  const { toast } = useToast();

  const canManage = isAdmin || isOwner;

  useEffect(() => {
    const fetchChickenLogo = async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("setting_value")
        .eq("setting_key", "chicken_assistant_logo")
        .single();

      if (data?.setting_value) {
        setChickenIcon(data.setting_value as string);
      }
    };

    fetchChickenLogo();
  }, []);

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

  const handleBatchEmbed = async () => {
    setIsEmbedding(true);
    try {
      const { data, error } = await supabase.functions.invoke("batch-generate-embeddings");
      
      if (error) throw error;

      toast({
        title: "Embedding Generation Complete",
        description: `${data.successful} documents vectorized for AI search`,
      });
    } catch (error: any) {
      console.error("Error generating embeddings:", error);
      toast({
        title: "Embedding Error",
        description: error.message || "Failed to generate embeddings",
        variant: "destructive",
      });
    } finally {
      setIsEmbedding(false);
    }
  };

  return (
    <div className="space-y-6 overflow-hidden">
      <PageHeader
        title="Poipu Documents"
        description="Navigate folders, manage documents, and ask questions with AI"
        logoUrl={pageConfig?.headerLogoUrl}
        actions={
          canManage && (
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={handleBatchExtract}
                disabled={isExtracting || isEmbedding}
                size="sm"
                className="w-full sm:w-auto"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isExtracting ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{isExtracting ? "Extracting..." : "Extract Text"}</span>
                <span className="sm:hidden">{isExtracting ? "..." : "Extract"}</span>
              </Button>
              <Button
                variant="outline"
                onClick={handleBatchEmbed}
                disabled={isExtracting || isEmbedding}
                size="sm"
                className="w-full sm:w-auto"
              >
                <Sparkles className={`mr-2 h-4 w-4 ${isEmbedding ? 'animate-pulse' : ''}`} />
                <span className="hidden sm:inline">{isEmbedding ? "Vectorizing..." : "Vectorize for AI"}</span>
                <span className="sm:hidden">{isEmbedding ? "..." : "Vectorize"}</span>
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
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="browse" className="flex-1 sm:flex-initial text-xs sm:text-sm">
            <FileText className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Browse Documents</span>
            <span className="sm:hidden">Browse</span>
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex-1 sm:flex-initial text-xs sm:text-sm">
            <img src={chickenIcon} alt="Chicken" className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 rounded-full object-cover" />
            <span className="hidden sm:inline">Ask the Chicken</span>
            <span className="sm:hidden">Ask Chicken</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="browse">
          <Card className="overflow-hidden">
            <CardContent className="pt-6 px-2 sm:px-6">
              <DocumentBrowser
                canManage={canManage}
                refreshTrigger={refreshTrigger}
                onFolderChange={setCurrentFolderId}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chat">
          <Link to="/assistant">
            <Card className="cursor-pointer hover:border-primary transition-colors">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center gap-4 py-8">
                  <img
                    src={chickenIcon}
                    alt="Community Assistant"
                    className="h-20 w-20 rounded-full object-cover ring-2 ring-primary/20"
                  />
                  <div className="text-center">
                    <h3 className="text-2xl font-semibold mb-2">Ask the Chicken</h3>
                    <p className="text-muted-foreground mb-4">
                      Get instant answers about all your community documents
                    </p>
                    <Button size="lg">
                      <MessageCircle className="mr-2 h-5 w-5" />
                      Start Full Screen Chat
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </TabsContent>
      </Tabs>
    </div>
  );
}
