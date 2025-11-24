import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Palette, Webcam, Phone, Users } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { ThemeSettingsDialog } from "@/components/ThemeSettingsDialog";
import { UserManagement } from "@/components/settings/UserManagement";
import { WebcamManagement } from "@/components/settings/WebcamManagement";
import { EmergencyContactManagement } from "@/components/settings/EmergencyContactManagement";
import { GeneralSettings } from "@/components/settings/GeneralSettings";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function AdminSettings() {
  const [isThemeDialogOpen, setIsThemeDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage app settings, theme, and system configuration"
      />

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="users">
            <Users className="mr-2 h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="theme">
            <Palette className="mr-2 h-4 w-4" />
            Theme
          </TabsTrigger>
          <TabsTrigger value="webcams">
            <Webcam className="mr-2 h-4 w-4" />
            Webcams
          </TabsTrigger>
          <TabsTrigger value="emergency">
            <Phone className="mr-2 h-4 w-4" />
            Emergency
          </TabsTrigger>
          <TabsTrigger value="general">
            <Settings className="mr-2 h-4 w-4" />
            General
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <UserManagement />
        </TabsContent>

        <TabsContent value="theme" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Theme & Background</CardTitle>
              <CardDescription>
                Customize the visual appearance of your application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setIsThemeDialogOpen(true)}>
                <Palette className="mr-2 h-4 w-4" />
                Open Theme Settings
              </Button>
              <p className="text-sm text-muted-foreground mt-4">
                Configure glass effects, backgrounds, and visual preferences
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webcams" className="space-y-4">
          <WebcamManagement />
        </TabsContent>

        <TabsContent value="emergency" className="space-y-4">
          <EmergencyContactManagement />
        </TabsContent>

        <TabsContent value="general" className="space-y-4">
          <GeneralSettings />
        </TabsContent>
      </Tabs>

      <ThemeSettingsDialog 
        open={isThemeDialogOpen}
        onOpenChange={setIsThemeDialogOpen}
      />
    </div>
  );
}
