import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocumentUpload } from "@/components/DocumentUpload";
import { DocumentChat } from "@/components/DocumentChat";
import { DocumentBrowser } from "@/components/documents/DocumentBrowser";
import { FileText } from "lucide-react";
import chickenIcon from "@/assets/chicken-assistant.jpeg";

export default function Documents() {
  const { isAdmin, isBoard } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const canManage = isAdmin || isBoard;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Document Library</h2>
          <p className="text-muted-foreground">
            Navigate folders, manage documents, and ask questions with AI
          </p>
        </div>
        {canManage && (
          <DocumentUpload
            onUploadComplete={() => setRefreshTrigger((k) => k + 1)}
            folders={[]}
          />
        )}
      </div>

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
