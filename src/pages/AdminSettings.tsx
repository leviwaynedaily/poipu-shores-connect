import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Palette, Webcam, Phone, Users } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { ThemeSettingsDialog } from "@/components/ThemeSettingsDialog";
import { UserManagement } from "@/components/settings/UserManagement";
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
          <Card>
            <CardHeader>
              <CardTitle>Live Webcams</CardTitle>
              <CardDescription>
                Manage live camera feeds displayed on the dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Coming soon: Add, edit, and remove webcam streams
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="emergency" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Emergency Contacts</CardTitle>
              <CardDescription>
                Manage emergency contact information for the community
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Coming soon: Add, edit, and remove emergency contacts
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Configure general application settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Coming soon: General configuration options
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ThemeSettingsDialog 
        open={isThemeDialogOpen}
        onOpenChange={setIsThemeDialogOpen}
      />
    </div>
  );
}
