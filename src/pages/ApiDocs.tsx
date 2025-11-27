import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Code2, Database, Lock, Image, MessageSquare, FileText, Users, Download } from "lucide-react";
import { toast } from "sonner";

const ApiDocs = () => {
  const baseUrl = "https://api.poipu-shores.com";
  const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2cXFuZnNnb3ZseG9jamp1Z3d3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4NTQ2MzgsImV4cCI6MjA3OTQzMDYzOH0.iUzJqQoHRUJ0nmPU1t44OL9I-ZYtCDofNxAN14phjBQ";

  const downloadAsJson = () => {
    const apiDocs = {
      apiName: "Poipu Shores API",
      version: "1.0.0",
      baseUrl,
      authentication: {
        anonKey,
        type: "Bearer token"
      },
      endpoints: {
        auth: {
          signIn: {
            method: "POST",
            path: "/auth/v1/token?grant_type=password",
            description: "Sign in with email and password"
          },
          signOut: {
            method: "POST",
            path: "/auth/v1/logout",
            description: "Sign out current user"
          },
          getUser: {
            method: "GET",
            path: "/auth/v1/user",
            description: "Get current authenticated user"
          }
        },
        functions: {
          communityAssistant: {
            method: "POST",
            path: "/functions/v1/community-assistant",
            authRequired: false,
            description: "AI-powered community assistant"
          },
          documentChat: {
            method: "POST",
            path: "/functions/v1/document-chat",
            authRequired: false,
            description: "AI-powered document Q&A"
          },
          getWeather: {
            method: "GET",
            path: "/functions/v1/get-weather",
            authRequired: false,
            description: "Current weather and 3-day forecast"
          },
          trackLogin: {
            method: "POST",
            path: "/functions/v1/track-login",
            authRequired: false,
            description: "Track user login activity"
          },
          verifyInvite: {
            method: "POST",
            path: "/functions/v1/verify-invite",
            authRequired: false,
            description: "Verify invitation token"
          },
          completeInvite: {
            method: "POST",
            path: "/functions/v1/complete-invite",
            authRequired: false,
            description: "Complete invitation and set password"
          },
          inviteUser: {
            method: "POST",
            path: "/functions/v1/invite-user",
            authRequired: true,
            adminOnly: true,
            description: "Invite new user"
          },
          resendInvite: {
            method: "POST",
            path: "/functions/v1/resend-invite",
            authRequired: true,
            adminOnly: true,
            description: "Resend user invitation"
          },
          updateUser: {
            method: "POST",
            path: "/functions/v1/update-user",
            authRequired: true,
            adminOnly: true,
            description: "Update user information"
          },
          deleteUser: {
            method: "POST",
            path: "/functions/v1/delete-user",
            authRequired: true,
            adminOnly: true,
            description: "Delete user account"
          },
          deleteInvite: {
            method: "POST",
            path: "/functions/v1/delete-invite",
            authRequired: true,
            adminOnly: true,
            description: "Delete pending invitation"
          },
          deactivateUser: {
            method: "POST",
            path: "/functions/v1/deactivate-user",
            authRequired: true,
            adminOnly: true,
            description: "Deactivate user account"
          },
          reactivateUser: {
            method: "POST",
            path: "/functions/v1/reactivate-user",
            authRequired: true,
            adminOnly: true,
            description: "Reactivate user account"
          },
          resetPassword: {
            method: "POST",
            path: "/functions/v1/reset-password",
            authRequired: true,
            adminOnly: true,
            description: "Reset user password"
          },
          generateBackground: {
            method: "POST",
            path: "/functions/v1/generate-background",
            authRequired: true,
            description: "Generate AI background image"
          },
          generatePhotoTitle: {
            method: "POST",
            path: "/functions/v1/generate-photo-title",
            authRequired: true,
            description: "Generate AI photo title"
          },
          extractDocumentContent: {
            method: "POST",
            path: "/functions/v1/extract-document-content",
            authRequired: true,
            description: "Extract text from document"
          },
          batchExtractDocuments: {
            method: "POST",
            path: "/functions/v1/batch-extract-documents",
            authRequired: true,
            description: "Batch extract text from multiple documents"
          }
        },
        database: {
          profiles: {
            table: "profiles",
            fields: ["id", "full_name", "avatar_url", "phone", "show_contact_info"]
          },
          announcements: {
            table: "announcements",
            fields: ["id", "title", "content", "author_id", "is_pinned", "created_at"]
          },
          communityPhotos: {
            table: "community_photos",
            fields: ["id", "title", "caption", "file_path", "uploaded_by", "likes_count", "category"]
          },
          documents: {
            table: "documents",
            fields: ["id", "title", "file_path", "category", "unit_number", "folder_id"]
          },
          emergencyContacts: {
            table: "emergency_contacts",
            fields: ["id", "name", "phone", "email", "category", "is_active", "display_order"]
          },
          chatMessages: {
            table: "chat_messages",
            fields: ["id", "content", "author_id", "channel_id", "created_at"]
          }
        },
        storage: {
          buckets: {
            avatars: {
              name: "avatars",
              public: true,
              description: "User profile pictures"
            },
            communityPhotos: {
              name: "community-photos",
              public: true,
              description: "Community photo uploads"
            },
            documents: {
              name: "documents",
              public: true,
              description: "HOA documents and files"
            },
            chatImages: {
              name: "chat-images",
              public: true,
              description: "Chat message attachments"
            }
          }
        }
      },
      swiftSetup: {
        package: "https://github.com/supabase/supabase-swift",
        minimumVersion: "2.0.0"
      }
    };

    const blob = new Blob([JSON.stringify(apiDocs, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "poipu-shores-api-docs.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("API documentation downloaded as JSON");
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Poipu Shores API Documentation</h1>
          <p className="text-muted-foreground">Complete API reference for iOS and mobile app development</p>
        </div>
        <Button onClick={downloadAsJson} variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Download JSON
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="auth">Auth</TabsTrigger>
          <TabsTrigger value="functions">Functions</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="storage">Storage</TabsTrigger>
          <TabsTrigger value="swift">Swift</TabsTrigger>
          <TabsTrigger value="examples">Examples</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code2 className="h-5 w-5" />
                Quick Start
              </CardTitle>
              <CardDescription>Essential connection details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Base Configuration</h3>
                <div className="bg-muted p-4 rounded-lg space-y-2 font-mono text-sm">
                  <div><span className="text-muted-foreground">API Base URL:</span> {baseUrl}</div>
                  <div><span className="text-muted-foreground">Anon Key:</span> {anonKey}</div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Swift Package Manager</h3>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                  <code>{`.package(url: "https://github.com/supabase/supabase-swift", from: "2.0.0")`}</code>
                </pre>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Initialize Client</h3>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                  <code>{`import Supabase

let supabase = SupabaseClient(
    supabaseURL: URL(string: "${baseUrl}")!,
    supabaseKey: "${anonKey}"
)`}</code>
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Auth Tab */}
        <TabsContent value="auth" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Authentication
              </CardTitle>
              <CardDescription>User authentication endpoints</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Sign In</h3>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{`let session = try await supabase.auth.signIn(
    email: "user@example.com",
    password: "password"
)

// Access token for authenticated requests
let accessToken = session.accessToken`}</code>
                </pre>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Sign Out</h3>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{`try await supabase.auth.signOut()`}</code>
                </pre>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Get Current User</h3>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{`let user = try await supabase.auth.user()`}</code>
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Functions Tab */}
        <TabsContent value="functions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Edge Functions
              </CardTitle>
              <CardDescription>Available serverless functions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Community Assistant (Ask the Chicken)</h3>
                <p className="text-sm text-muted-foreground mb-3">AI-powered community assistant</p>
                <div className="space-y-2">
                  <div className="text-sm"><span className="font-medium">Endpoint:</span> /functions/v1/community-assistant</div>
                  <div className="text-sm"><span className="font-medium">Auth Required:</span> No (public)</div>
                  <div className="text-sm"><span className="font-medium">Method:</span> POST</div>
                </div>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm mt-3">
                  <code>{`let response = try await supabase.functions.invoke(
    "community-assistant",
    options: FunctionInvokeOptions(
        body: ["message": "What's the weather today?"]
    )
)`}</code>
                </pre>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Document Chat</h3>
                <p className="text-sm text-muted-foreground mb-3">AI-powered document Q&A</p>
                <div className="space-y-2">
                  <div className="text-sm"><span className="font-medium">Endpoint:</span> /functions/v1/document-chat</div>
                  <div className="text-sm"><span className="font-medium">Auth Required:</span> No (public)</div>
                  <div className="text-sm"><span className="font-medium">Method:</span> POST</div>
                </div>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm mt-3">
                  <code>{`let response = try await supabase.functions.invoke(
    "document-chat",
    options: FunctionInvokeOptions(
        body: ["message": "What does the HOA policy say about pets?"]
    )
)`}</code>
                </pre>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Get Weather</h3>
                <p className="text-sm text-muted-foreground mb-3">Current weather and 3-day forecast</p>
                <div className="space-y-2">
                  <div className="text-sm"><span className="font-medium">Endpoint:</span> /functions/v1/get-weather</div>
                  <div className="text-sm"><span className="font-medium">Auth Required:</span> Yes</div>
                  <div className="text-sm"><span className="font-medium">Method:</span> GET</div>
                </div>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm mt-3">
                  <code>{`let response = try await supabase.functions.invoke("get-weather")`}</code>
                </pre>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Track Login</h3>
                <p className="text-sm text-muted-foreground mb-3">Track user login activity and device information</p>
                <div className="space-y-2">
                  <div className="text-sm"><span className="font-medium">Endpoint:</span> /functions/v1/track-login</div>
                  <div className="text-sm"><span className="font-medium">Auth Required:</span> No (public)</div>
                  <div className="text-sm"><span className="font-medium">Method:</span> POST</div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Invitation Functions</h3>
                <p className="text-sm text-muted-foreground mb-3">Public invitation endpoints</p>
                <div className="space-y-2">
                  <ul className="text-sm list-disc list-inside ml-4 space-y-1">
                    <li><span className="font-medium">verify-invite</span> - Verify invitation token validity</li>
                    <li><span className="font-medium">complete-invite</span> - Complete invitation and set password</li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">AI Content Generation</h3>
                <p className="text-sm text-muted-foreground mb-3">Generate content using AI (Authenticated)</p>
                <div className="space-y-2">
                  <ul className="text-sm list-disc list-inside ml-4 space-y-1">
                    <li><span className="font-medium">generate-background</span> - Generate AI background images</li>
                    <li><span className="font-medium">generate-photo-title</span> - Generate AI photo titles</li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Document Processing</h3>
                <p className="text-sm text-muted-foreground mb-3">Extract and process document content (Authenticated)</p>
                <div className="space-y-2">
                  <ul className="text-sm list-disc list-inside ml-4 space-y-1">
                    <li><span className="font-medium">extract-document-content</span> - Extract text from single document</li>
                    <li><span className="font-medium">batch-extract-documents</span> - Batch extract from multiple documents</li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">User Management Functions</h3>
                <p className="text-sm text-muted-foreground mb-3">Invite, update, and manage users (Admin only)</p>
                <div className="space-y-2">
                  <div className="text-sm"><span className="font-medium">Available functions:</span></div>
                  <ul className="text-sm list-disc list-inside ml-4 space-y-1">
                    <li><span className="font-medium">invite-user</span> - Send new user invitation</li>
                    <li><span className="font-medium">resend-invite</span> - Resend user invitation email</li>
                    <li><span className="font-medium">update-user</span> - Update user profile and unit</li>
                    <li><span className="font-medium">delete-user</span> - Permanently delete user</li>
                    <li><span className="font-medium">delete-invite</span> - Delete pending invitation</li>
                    <li><span className="font-medium">deactivate-user</span> - Temporarily deactivate user</li>
                    <li><span className="font-medium">reactivate-user</span> - Reactivate deactivated user</li>
                    <li><span className="font-medium">reset-password</span> - Reset user password</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Database Tab */}
        <TabsContent value="database" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Schema
              </CardTitle>
              <CardDescription>Core tables and their structure</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Profiles</h3>
                <p className="text-sm text-muted-foreground mb-3">User profile information</p>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{`let profiles = try await supabase
    .from("profiles")
    .select()
    .execute()`}</code>
                </pre>
                <div className="mt-3 text-sm space-y-1">
                  <div><span className="font-medium">Key fields:</span> id, full_name, avatar_url, phone, show_contact_info</div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Announcements</h3>
                <p className="text-sm text-muted-foreground mb-3">Community announcements</p>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{`let announcements = try await supabase
    .from("announcements")
    .select()
    .order("created_at", ascending: false)
    .execute()`}</code>
                </pre>
                <div className="mt-3 text-sm space-y-1">
                  <div><span className="font-medium">Key fields:</span> id, title, content, author_id, is_pinned, created_at</div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Community Photos</h3>
                <p className="text-sm text-muted-foreground mb-3">Shared community photos</p>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{`let photos = try await supabase
    .from("community_photos")
    .select()
    .eq("is_approved", value: true)
    .order("created_at", ascending: false)
    .execute()`}</code>
                </pre>
                <div className="mt-3 text-sm space-y-1">
                  <div><span className="font-medium">Key fields:</span> id, title, caption, file_path, uploaded_by, likes_count, category</div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Documents</h3>
                <p className="text-sm text-muted-foreground mb-3">HOA documents and files</p>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{`let documents = try await supabase
    .from("documents")
    .select()
    .execute()`}</code>
                </pre>
                <div className="mt-3 text-sm space-y-1">
                  <div><span className="font-medium">Key fields:</span> id, title, file_path, category, unit_number, folder_id</div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Emergency Contacts</h3>
                <p className="text-sm text-muted-foreground mb-3">Emergency contact information</p>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{`let contacts = try await supabase
    .from("emergency_contacts")
    .select()
    .eq("is_active", value: true)
    .order("display_order")
    .execute()`}</code>
                </pre>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Chat Messages</h3>
                <p className="text-sm text-muted-foreground mb-3">Community chat messages</p>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{`let messages = try await supabase
    .from("chat_messages")
    .select()
    .eq("channel_id", value: channelId)
    .order("created_at", ascending: false)
    .execute()`}</code>
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Storage Tab */}
        <TabsContent value="storage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                Storage Buckets
              </CardTitle>
              <CardDescription>File storage and retrieval</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Available Buckets</h3>
                <ul className="space-y-2 text-sm">
                  <li><span className="font-medium">avatars:</span> User profile pictures (public)</li>
                  <li><span className="font-medium">community-photos:</span> Community photo uploads (public)</li>
                  <li><span className="font-medium">documents:</span> HOA documents and files (public)</li>
                  <li><span className="font-medium">chat-images:</span> Chat message attachments (public)</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Upload File</h3>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{`let file = try await supabase.storage
    .from("avatars")
    .upload(
        path: "user-\(userId).jpg",
        file: imageData,
        options: FileOptions(contentType: "image/jpeg")
    )`}</code>
                </pre>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Get Public URL</h3>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{`let url = supabase.storage
    .from("avatars")
    .getPublicURL(path: "user-\(userId).jpg")

// Returns: ${baseUrl}/storage/v1/object/public/avatars/user-123.jpg`}</code>
                </pre>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Download File</h3>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{`let data = try await supabase.storage
    .from("documents")
    .download(path: "hoa-rules.pdf")`}</code>
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Swift Setup Tab */}
        <TabsContent value="swift" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code2 className="h-5 w-5" />
                Swift/iOS Setup
              </CardTitle>
              <CardDescription>Complete iOS integration guide</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">1. Add Supabase Package</h3>
                <p className="text-sm text-muted-foreground mb-3">In Xcode: File → Add Package Dependencies</p>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                  <code>https://github.com/supabase/supabase-swift</code>
                </pre>
              </div>

              <div>
                <h3 className="font-semibold mb-2">2. Create Supabase Client</h3>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{`import Supabase

class SupabaseManager {
    static let shared = SupabaseManager()
    
    let client: SupabaseClient
    
    private init() {
        client = SupabaseClient(
            supabaseURL: URL(string: "${baseUrl}")!,
            supabaseKey: "${anonKey}"
        )
    }
}`}</code>
                </pre>
              </div>

              <div>
                <h3 className="font-semibold mb-2">3. Authentication Flow</h3>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{`// Sign In
func signIn(email: String, password: String) async throws {
    try await SupabaseManager.shared.client.auth.signIn(
        email: email,
        password: password
    )
}

// Check Auth State
func checkAuth() async -> Bool {
    do {
        _ = try await SupabaseManager.shared.client.auth.user()
        return true
    } catch {
        return false
    }
}

// Sign Out
func signOut() async throws {
    try await SupabaseManager.shared.client.auth.signOut()
}`}</code>
                </pre>
              </div>

              <div>
                <h3 className="font-semibold mb-2">4. Fetch Data Example</h3>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{`struct Announcement: Codable {
    let id: UUID
    let title: String
    let content: String
    let createdAt: Date
}

func fetchAnnouncements() async throws -> [Announcement] {
    let response: [Announcement] = try await SupabaseManager
        .shared
        .client
        .from("announcements")
        .select()
        .order("created_at", ascending: false)
        .execute()
        .value
    
    return response
}`}</code>
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Examples Tab */}
        <TabsContent value="examples" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Complete Examples
              </CardTitle>
              <CardDescription>Real-world usage examples</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Community Feed View</h3>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{`import SwiftUI
import Supabase

struct CommunityFeedView: View {
    @State private var announcements: [Announcement] = []
    @State private var photos: [CommunityPhoto] = []
    
    var body: some View {
        List {
            Section("Announcements") {
                ForEach(announcements) { announcement in
                    AnnouncementRow(announcement: announcement)
                }
            }
            
            Section("Community Photos") {
                ForEach(photos) { photo in
                    PhotoRow(photo: photo)
                }
            }
        }
        .task {
            await loadData()
        }
    }
    
    func loadData() async {
        do {
            // Fetch announcements
            announcements = try await SupabaseManager.shared.client
                .from("announcements")
                .select()
                .order("created_at", ascending: false)
                .limit(10)
                .execute()
                .value
            
            // Fetch photos
            photos = try await SupabaseManager.shared.client
                .from("community_photos")
                .select()
                .eq("is_approved", value: true)
                .order("created_at", ascending: false)
                .limit(20)
                .execute()
                .value
        } catch {
            print("Error loading data: \\(error)")
        }
    }
}`}</code>
                </pre>
              </div>

              <div>
                <h3 className="font-semibold mb-2">AI Assistant Chat</h3>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{`struct AssistantView: View {
    @State private var messages: [ChatMessage] = []
    @State private var inputText = ""
    
    func sendMessage() async {
        let userMessage = ChatMessage(role: "user", content: inputText)
        messages.append(userMessage)
        inputText = ""
        
        do {
            let response = try await SupabaseManager.shared.client
                .functions
                .invoke(
                    "community-assistant",
                    options: FunctionInvokeOptions(
                        body: ["message": userMessage.content]
                    )
                )
            
            let data = try JSONDecoder().decode(
                AssistantResponse.self,
                from: response.data
            )
            
            messages.append(
                ChatMessage(role: "assistant", content: data.response)
            )
        } catch {
            print("Error: \\(error)")
        }
    }
}`}</code>
                </pre>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Photo Upload</h3>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{`func uploadPhoto(image: UIImage, title: String) async throws {
    // Convert image to data
    guard let imageData = image.jpegData(compressionQuality: 0.8) else {
        throw PhotoError.invalidImage
    }
    
    // Generate unique filename
    let fileName = "\\(UUID().uuidString).jpg"
    
    // Upload to storage
    try await SupabaseManager.shared.client.storage
        .from("community-photos")
        .upload(
            path: fileName,
            file: imageData,
            options: FileOptions(contentType: "image/jpeg")
        )
    
    // Get public URL
    let url = SupabaseManager.shared.client.storage
        .from("community-photos")
        .getPublicURL(path: fileName)
    
    // Create database record
    struct PhotoInsert: Encodable {
        let title: String
        let filePath: String
        let uploadedBy: UUID
        let category: String
    }
    
    let userId = try await SupabaseManager.shared.client.auth.user().id
    
    try await SupabaseManager.shared.client
        .from("community_photos")
        .insert(
            PhotoInsert(
                title: title,
                filePath: url.absoluteString,
                uploadedBy: userId,
                category: "general"
            )
        )
        .execute()
}`}</code>
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ApiDocs;