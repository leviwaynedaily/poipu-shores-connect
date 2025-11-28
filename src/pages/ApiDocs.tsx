import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Code2, Database, Lock, Image, MessageSquare, FileText, Users, Download, Smartphone } from "lucide-react";
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
        routes: {
          public: [
            { path: "/", description: "Landing page with app overview and login prompt" },
            { path: "/auth", description: "Login and authentication page" },
            { path: "/accept-invite", description: "Complete user invitation and set password" },
            { path: "/privacy-policy", description: "Privacy policy and data handling information" },
            { path: "/terms-of-service", description: "Terms of service and usage guidelines" },
            { path: "/api-docs", description: "API documentation for mobile app development" }
          ],
          protected: [
            { path: "/dashboard", description: "Main dashboard with weather, live cameras, and emergency contacts", features: ["Weather widget", "Beach conditions", "Live webcams", "Emergency contacts"] },
            { path: "/assistant", description: "AI-powered community assistant", features: ["Natural language Q&A", "Property management assistance"] },
            { path: "/chat", description: "Community chat with channels and direct messaging", features: ["Public/private channels", "Message reactions", "Image sharing", "Real-time updates"] },
            { path: "/documents", description: "HOA documents browser with AI-powered document chat", features: ["Folder organization", "Document viewer", "AI document Q&A", "Unit-specific documents"] },
            { path: "/photos", description: "Community photo gallery", features: ["Photo upload", "EXIF data", "Likes/comments", "Category filtering", "Approval workflow"] },
            { path: "/announcements", description: "Community announcements and updates", features: ["Pinned announcements", "Read tracking", "Rich text content"] },
            { path: "/members", description: "Community member directory", features: ["Member profiles", "Unit ownership", "Contact details"] },
            { path: "/profile", description: "User profile management", features: ["Edit profile", "Avatar upload", "Contact visibility"] },
            { path: "/settings", description: "User settings and preferences", features: ["Theme customization", "Background images", "Glass effects", "Login history"] }
          ],
          admin: [
            { path: "/users", description: "User management dashboard", features: ["Invite users", "Update profiles", "Manage roles", "Deactivate/reactivate", "Login history"] },
            { path: "/admin-settings", description: "Administrative settings", features: ["Emergency contacts", "Webcam configuration", "App settings"] }
          ]
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
          },
          communityAssistantMobile: {
            method: "POST",
            path: "/functions/v1/community-assistant-mobile",
            authRequired: false,
            description: "Non-streaming AI assistant for mobile apps",
            requestBody: {
              messages: [
                { role: "user", content: "What are the lanai rules?" }
              ]
            },
            responseFormat: {
              success: true,
              response: "Aloha! Based on the community documents...",
              model: "google/gemini-2.5-flash"
            },
            chatHistory: {
              load: "GET /rest/v1/community_assistant_messages?user_id=eq.<userId>&order=created_at.asc",
              save: "POST /rest/v1/community_assistant_messages with body: { user_id, role, content }",
              clear: "DELETE /rest/v1/community_assistant_messages?user_id=eq.<userId>"
            }
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
        },
        assets: {
          logos: [
            { name: "Header Logo", path: "/header-logo.png", usage: "Main header and navigation" },
            { name: "Poipu Logo Icon", path: "/src/assets/poipu-logo-icon.png", usage: "App icon, small logo displays" },
            { name: "Poipu Text Logo", path: "/src/assets/poipu-text.png", usage: "Text-based logo variant" },
            { name: "Primary Logo", path: "/src/assets/logo.png", usage: "General branding" }
          ],
          favicon: { path: "/favicon.png", usage: "Browser tab icon" },
          backgrounds: [
            { name: "Poipu Beach Sunset", path: "/src/assets/poipu-beach-sunset.jpg", usage: "Hero image, default background" },
            { name: "Oceanfront Condo", path: "/src/assets/condo-oceanfront.jpeg", usage: "Property showcase" }
          ],
          features: [
            { name: "Chicken Assistant", path: "/src/assets/chicken-assistant.jpeg", usage: "AI assistant avatar (Ask the Chicken)" }
          ],
          mobileTabIcons: [
            { name: "Home Tab", url: `${baseUrl}/storage/v1/object/public/avatars/mobile-icon-home.png`, size: "24-32px", format: "PNG" },
            { name: "Chat Tab", url: `${baseUrl}/storage/v1/object/public/avatars/mobile-icon-chat.png`, size: "24-32px", format: "PNG" },
            { name: "Photos Tab", url: `${baseUrl}/storage/v1/object/public/avatars/mobile-icon-photos.png`, size: "24-32px", format: "PNG" },
            { name: "Documents Tab", url: `${baseUrl}/storage/v1/object/public/avatars/mobile-icon-documents.png`, size: "24-32px", format: "PNG" },
            { name: "Profile Tab", url: `${baseUrl}/storage/v1/object/public/avatars/mobile-icon-profile.png`, size: "24-32px", format: "PNG" },
            { name: "Assistant Tab", url: `${baseUrl}/storage/v1/object/public/avatars/mobile-icon-assistant.png`, size: "24-32px", format: "PNG" }
          ],
          mobileHeaderLogos: [
            { name: "Home Header", url: `${baseUrl}/storage/v1/object/public/avatars/mobile-header-home.png`, size: "120-200px wide", format: "PNG" },
            { name: "Chat Header", url: `${baseUrl}/storage/v1/object/public/avatars/mobile-header-chat.png`, size: "120-200px wide", format: "PNG" },
            { name: "Photos Header", url: `${baseUrl}/storage/v1/object/public/avatars/mobile-header-photos.png`, size: "120-200px wide", format: "PNG" },
            { name: "Documents Header", url: `${baseUrl}/storage/v1/object/public/avatars/mobile-header-documents.png`, size: "120-200px wide", format: "PNG" },
            { name: "Profile Header", url: `${baseUrl}/storage/v1/object/public/avatars/mobile-header-profile.png`, size: "120-200px wide", format: "PNG" },
            { name: "Assistant Header", url: `${baseUrl}/storage/v1/object/public/avatars/mobile-header-assistant.png`, size: "120-200px wide", format: "PNG" }
          ],
          mobileConfig: {
            endpoint: "/rest/v1/app_settings?setting_key=eq.mobile_pages_config",
            description: "Complete mobile configuration including page order, visibility, tab names, titles, subtitles, icons, and header logos",
            fields: {
              id: "Page identifier (home, chat, photos, documents, profile, assistant)",
              tabName: "Short label for tab bar",
              title: "Page header title",
              subtitle: "Page header subtitle/description",
              iconUrl: "Tab bar icon URL (24-32px PNG)",
              headerLogoUrl: "Page header logo URL (120-200px wide PNG)",
              fallbackIcon: "Icon name to use if URLs are null",
              order: "Sort order (1-6, ascending)",
              isVisible: "Show/hide page in app"
            }
          }
        },
        theme: {
          typography: {
            primaryFont: { name: "Outfit", type: "sans-serif", weights: [400, 500, 600, 700], url: "https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap" },
            secondaryFont: { name: "Merriweather", type: "serif", weights: [400, 700], url: "https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&display=swap" },
            monospaceFont: { name: "System Monospace", type: "monospace" }
          },
          colors: {
            format: "HSL",
            tokens: [
              "--background", "--foreground", "--primary", "--secondary", 
              "--muted", "--accent", "--destructive", "--border", 
              "--card", "--card-foreground", "--input", "--ring"
            ],
            darkModeSupport: true
          },
          glassEffect: {
            enabled: true,
            settings: {
              glassIntensity: { min: 0.1, max: 1.0, default: 0.6 },
              sidebarOpacity: { min: 0.1, max: 1.0, default: 0.95 },
              authPageOpacity: { min: 0.1, max: 1.0, default: 0.9 }
            },
            css: "backdrop-filter: blur(10px); background: rgba(255,255,255,0.1);"
          },
          components: [
            "Button", "Card", "Dialog", "Dropdown Menu", "Input", "Select",
            "Textarea", "Tabs", "Toast", "Accordion", "Alert", "Avatar",
            "Badge", "Calendar", "Checkbox", "Switch", "Table", "Tooltip",
            "Sheet", "Sidebar", "Carousel"
          ],
          animations: ["accordion-down", "accordion-up"]
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
        <TabsList className="grid w-full grid-cols-5 lg:grid-cols-10">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="auth">Auth</TabsTrigger>
          <TabsTrigger value="routes">Routes</TabsTrigger>
          <TabsTrigger value="theme">Theme</TabsTrigger>
          <TabsTrigger value="functions">Functions</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="storage">Storage</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
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

          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                "Ask the Chicken" Mobile Integration
              </CardTitle>
              <CardDescription>
                Non-streaming AI assistant endpoint optimized for mobile apps
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <h3 className="font-semibold mb-2 text-blue-700 dark:text-blue-300">📱 Mobile-First Design</h3>
                <p className="text-sm text-muted-foreground">
                  This endpoint returns clean JSON responses (no streaming) for simplified mobile integration, 
                  while maintaining the same powerful AI capabilities as the web version.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Endpoint URL</h3>
                <code className="block p-3 bg-muted rounded-md text-sm break-all">
                  POST {baseUrl}/functions/v1/community-assistant-mobile
                </code>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Request Headers</h3>
                <pre className="block p-3 bg-muted rounded-md text-sm overflow-x-auto">
{`Authorization: Bearer <user_access_token>
apikey: ${anonKey}
Content-Type: application/json`}
                </pre>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Request Body</h3>
                <pre className="block p-3 bg-muted rounded-md text-sm overflow-x-auto">
{`{
  "messages": [
    { "role": "user", "content": "What are the lanai rules?" }
  ]
}`}
                </pre>
                <p className="text-sm text-muted-foreground mt-2">
                  💡 <strong>Include full conversation history</strong> in the messages array for proper context.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Response Format</h3>
                <pre className="block p-3 bg-muted rounded-md text-sm overflow-x-auto">
{`{
  "success": true,
  "response": "Aloha! Based on the community documents...",
  "model": "google/gemini-2.5-flash"
}`}
                </pre>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Chat History Management</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Use standard Supabase REST API to manage chat history in <code>community_assistant_messages</code> table:
                </p>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2 flex items-center gap-2">
                      📥 Load History
                    </p>
                    <code className="block p-3 bg-muted rounded-md text-xs break-all">
                      GET {baseUrl}/rest/v1/community_assistant_messages?user_id=eq.&lt;userId&gt;&order=created_at.asc
                    </code>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium mb-2 flex items-center gap-2">
                      💾 Save Message
                    </p>
                    <code className="block p-3 bg-muted rounded-md text-xs break-all">
                      POST {baseUrl}/rest/v1/community_assistant_messages<br/>
                      Body: {`{ "user_id": "<userId>", "role": "user", "content": "..." }`}
                    </code>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium mb-2 flex items-center gap-2">
                      🗑️ Clear History
                    </p>
                    <code className="block p-3 bg-muted rounded-md text-xs break-all">
                      DELETE {baseUrl}/rest/v1/community_assistant_messages?user_id=eq.&lt;userId&gt;
                    </code>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 space-y-2">
                <h3 className="font-semibold text-yellow-700 dark:text-yellow-300">⚠️ Implementation Checklist</h3>
                <ul className="text-sm text-muted-foreground space-y-1 list-inside">
                  <li>✅ Send complete conversation history for context</li>
                  <li>✅ Save both user and assistant messages</li>
                  <li>✅ Use user's access token (from auth.signIn)</li>
                  <li>✅ Handle 429 (rate limit) and 402 (no credits) errors</li>
                  <li>✅ Display loading state during API call</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Swift Example</h3>
                <pre className="block p-3 bg-muted rounded-md text-sm overflow-x-auto">
{`// Send message to AI
let response = try await supabase.functions.invoke(
    "community-assistant-mobile",
    options: FunctionInvokeOptions(
        body: ["messages": messages]
    )
)

let data = try JSONDecoder().decode(
    AIResponse.self, 
    from: response.data
)
print(data.response)

// Save to history
try await supabase
    .from("community_assistant_messages")
    .insert([
        "user_id": userId,
        "role": "assistant",
        "content": data.response
    ])
    .execute()`}
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

        {/* Routes Tab */}
        <TabsContent value="routes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code2 className="h-5 w-5" />
                Application Routes
              </CardTitle>
              <CardDescription>All pages and their functionality</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3 text-lg">Public Routes</h3>
                <div className="space-y-4">
                  <div className="border-l-2 border-primary pl-4">
                    <h4 className="font-medium">/</h4>
                    <p className="text-sm text-muted-foreground">Landing page with app overview and login prompt</p>
                  </div>
                  <div className="border-l-2 border-primary pl-4">
                    <h4 className="font-medium">/auth</h4>
                    <p className="text-sm text-muted-foreground">Login and authentication page</p>
                  </div>
                  <div className="border-l-2 border-primary pl-4">
                    <h4 className="font-medium">/accept-invite</h4>
                    <p className="text-sm text-muted-foreground">Complete user invitation and set password</p>
                  </div>
                  <div className="border-l-2 border-primary pl-4">
                    <h4 className="font-medium">/privacy-policy</h4>
                    <p className="text-sm text-muted-foreground">Privacy policy and data handling information</p>
                  </div>
                  <div className="border-l-2 border-primary pl-4">
                    <h4 className="font-medium">/terms-of-service</h4>
                    <p className="text-sm text-muted-foreground">Terms of service and usage guidelines</p>
                  </div>
                  <div className="border-l-2 border-primary pl-4">
                    <h4 className="font-medium">/api-docs</h4>
                    <p className="text-sm text-muted-foreground">API documentation for mobile app development</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3 text-lg">Protected Routes (Requires Authentication)</h3>
                <div className="space-y-4">
                  <div className="border-l-2 border-blue-500 pl-4">
                    <h4 className="font-medium">/dashboard</h4>
                    <p className="text-sm text-muted-foreground">Main dashboard with weather, live cameras, and emergency contacts</p>
                    <p className="text-xs text-muted-foreground mt-1">Features: Weather widget, beach conditions, live webcams, emergency contact directory</p>
                  </div>
                  <div className="border-l-2 border-blue-500 pl-4">
                    <h4 className="font-medium">/assistant</h4>
                    <p className="text-sm text-muted-foreground">AI-powered community assistant ("Ask the Chicken")</p>
                    <p className="text-xs text-muted-foreground mt-1">Features: Natural language Q&A about community, property management assistance</p>
                  </div>
                  <div className="border-l-2 border-blue-500 pl-4">
                    <h4 className="font-medium">/chat</h4>
                    <p className="text-sm text-muted-foreground">Community chat with channels and direct messaging</p>
                    <p className="text-xs text-muted-foreground mt-1">Features: Public/private channels, message reactions, image sharing, real-time updates</p>
                  </div>
                  <div className="border-l-2 border-blue-500 pl-4">
                    <h4 className="font-medium">/documents</h4>
                    <p className="text-sm text-muted-foreground">HOA documents browser with AI-powered document chat</p>
                    <p className="text-xs text-muted-foreground mt-1">Features: Folder organization, document viewer, AI document Q&A, unit-specific documents</p>
                  </div>
                  <div className="border-l-2 border-blue-500 pl-4">
                    <h4 className="font-medium">/photos</h4>
                    <p className="text-sm text-muted-foreground">Community photo gallery with upload and sharing</p>
                    <p className="text-xs text-muted-foreground mt-1">Features: Photo upload, EXIF data extraction, likes/comments, category filtering, approval workflow</p>
                  </div>
                  <div className="border-l-2 border-blue-500 pl-4">
                    <h4 className="font-medium">/announcements</h4>
                    <p className="text-sm text-muted-foreground">Community announcements and updates</p>
                    <p className="text-xs text-muted-foreground mt-1">Features: Pinned announcements, read tracking, rich text content</p>
                  </div>
                  <div className="border-l-2 border-blue-500 pl-4">
                    <h4 className="font-medium">/members</h4>
                    <p className="text-sm text-muted-foreground">Community member directory</p>
                    <p className="text-xs text-muted-foreground mt-1">Features: Member profiles, unit ownership info, contact details (privacy-controlled)</p>
                  </div>
                  <div className="border-l-2 border-blue-500 pl-4">
                    <h4 className="font-medium">/profile</h4>
                    <p className="text-sm text-muted-foreground">User profile management</p>
                    <p className="text-xs text-muted-foreground mt-1">Features: Edit profile info, avatar upload, phone number, contact visibility settings</p>
                  </div>
                  <div className="border-l-2 border-blue-500 pl-4">
                    <h4 className="font-medium">/settings</h4>
                    <p className="text-sm text-muted-foreground">User settings and preferences</p>
                    <p className="text-xs text-muted-foreground mt-1">Features: Theme customization, background images, glass effects, login activity history</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3 text-lg">Admin Routes (Requires Admin Role)</h3>
                <div className="space-y-4">
                  <div className="border-l-2 border-orange-500 pl-4">
                    <h4 className="font-medium">/users</h4>
                    <p className="text-sm text-muted-foreground">User management dashboard</p>
                    <p className="text-xs text-muted-foreground mt-1">Features: Invite users, update profiles, manage roles, deactivate/reactivate accounts, view login history</p>
                  </div>
                  <div className="border-l-2 border-orange-500 pl-4">
                    <h4 className="font-medium">/admin-settings</h4>
                    <p className="text-sm text-muted-foreground">Administrative settings and configuration</p>
                    <p className="text-xs text-muted-foreground mt-1">Features: Emergency contact management, webcam configuration, general app settings</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">Route Protection</h3>
                <p className="text-sm text-muted-foreground mb-2">All protected routes use the ProtectedRoute component which:</p>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                  <li>Checks for valid authentication session</li>
                  <li>Redirects to /auth if not authenticated</li>
                  <li>Admin routes verify user has 'admin' role in user_roles table</li>
                  <li>Redirects to /dashboard if user lacks required permissions</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Theme Tab */}
        <TabsContent value="theme" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code2 className="h-5 w-5" />
                Design System & Theme
              </CardTitle>
              <CardDescription>Typography, colors, and UI components</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Typography Section */}
              <div>
                <h3 className="font-semibold mb-3 text-lg">Typography</h3>
                <div className="space-y-4">
                  <div className="border-l-2 border-primary pl-4">
                    <h4 className="font-medium">Primary Font (Sans-Serif)</h4>
                    <p className="text-sm text-muted-foreground">Outfit - Modern, clean, and highly readable</p>
                    <pre className="bg-muted p-3 rounded-lg overflow-x-auto text-xs mt-2">
                      <code>{`<!-- Google Fonts CDN -->
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet">

/* CSS Usage */
font-family: 'Outfit', ui-sans-serif, system-ui, sans-serif;

/* Tailwind Usage */
className="font-sans"`}</code>
                    </pre>
                  </div>

                  <div className="border-l-2 border-blue-500 pl-4">
                    <h4 className="font-medium">Secondary Font (Serif)</h4>
                    <p className="text-sm text-muted-foreground">Merriweather - Elegant for headings and emphasis</p>
                    <pre className="bg-muted p-3 rounded-lg overflow-x-auto text-xs mt-2">
                      <code>{`<!-- Google Fonts CDN -->
<link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&display=swap" rel="stylesheet">

/* CSS Usage */
font-family: 'Merriweather', ui-serif, Georgia, serif;

/* Tailwind Usage */
className="font-serif"`}</code>
                    </pre>
                  </div>

                  <div className="border-l-2 border-green-500 pl-4">
                    <h4 className="font-medium">Monospace Font</h4>
                    <p className="text-sm text-muted-foreground">System monospace for code blocks</p>
                    <pre className="bg-muted p-3 rounded-lg overflow-x-auto text-xs mt-2">
                      <code>{`/* Tailwind Usage */
className="font-mono"`}</code>
                    </pre>
                  </div>
                </div>
              </div>

              {/* Color System Section */}
              <div>
                <h3 className="font-semibold mb-3 text-lg">Color System (HSL-Based)</h3>
                <p className="text-sm text-muted-foreground mb-4">All colors use HSL format and are defined as CSS variables for light/dark mode support</p>
                <div className="space-y-3">
                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Semantic Color Tokens</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div><code className="bg-background px-2 py-1 rounded">--background</code> - Main background</div>
                      <div><code className="bg-background px-2 py-1 rounded">--foreground</code> - Main text color</div>
                      <div><code className="bg-background px-2 py-1 rounded">--primary</code> - Primary brand color</div>
                      <div><code className="bg-background px-2 py-1 rounded">--secondary</code> - Secondary actions</div>
                      <div><code className="bg-background px-2 py-1 rounded">--muted</code> - Subtle backgrounds</div>
                      <div><code className="bg-background px-2 py-1 rounded">--accent</code> - Accent highlights</div>
                      <div><code className="bg-background px-2 py-1 rounded">--destructive</code> - Delete/error actions</div>
                      <div><code className="bg-background px-2 py-1 rounded">--border</code> - Border colors</div>
                      <div><code className="bg-background px-2 py-1 rounded">--card</code> - Card backgrounds</div>
                    </div>
                  </div>

                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Using Colors in Swift</h4>
                    <pre className="bg-background p-3 rounded-lg overflow-x-auto text-xs">
                      <code>{`// Convert HSL to RGB first
// Example: --primary: 266 4% 20.8%
// HSL(266°, 4%, 20.8%) → RGB(51, 50, 54)

let primaryColor = Color(red: 51/255, green: 50/255, blue: 54/255)

// Or use hex values
let primaryColor = Color(hex: "333236")

// Define your theme colors
struct AppColors {
    static let background = Color.white
    static let primary = Color(hex: "333236")
    static let secondary = Color(hex: "F7F7F8")
    // ... add all semantic colors
}`}</code>
                    </pre>
                  </div>
                </div>
              </div>

              {/* Glass Effect Section */}
              <div>
                <h3 className="font-semibold mb-3 text-lg">Glass Morphism Effect</h3>
                <p className="text-sm text-muted-foreground mb-4">The app uses customizable glass effects for sidebars and UI overlays</p>
                <div className="space-y-3">
                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Glass Effect Settings</h4>
                    <ul className="space-y-2 text-sm">
                      <li><strong>Glass Theme Enabled:</strong> Toggle glass effects on/off (stored in profiles table)</li>
                      <li><strong>Glass Intensity:</strong> Controls blur strength (0.1 - 1.0, default 0.6)</li>
                      <li><strong>Sidebar Opacity:</strong> Background transparency (0.1 - 1.0, default 0.95)</li>
                      <li><strong>Auth Page Opacity:</strong> Login page background opacity (0.1 - 1.0, default 0.9)</li>
                    </ul>
                  </div>

                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-medium mb-2">CSS Implementation</h4>
                    <pre className="bg-background p-3 rounded-lg overflow-x-auto text-xs">
                      <code>{`/* Glass effect CSS */
.glass-effect {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

/* Dark mode glass */
.dark .glass-effect {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
}`}</code>
                    </pre>
                  </div>

                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Swift Implementation</h4>
                    <pre className="bg-background p-3 rounded-lg overflow-x-auto text-xs">
                      <code>{`// Glass effect modifier
struct GlassEffect: ViewModifier {
    var intensity: Double = 0.6
    var opacity: Double = 0.95
    
    func body(content: Content) -> some View {
        content
            .background(.ultraThinMaterial)
            .opacity(opacity)
            .cornerRadius(16)
            .shadow(radius: 10)
    }
}

// Usage
Text("Hello")
    .modifier(GlassEffect(intensity: 0.6, opacity: 0.95))`}</code>
                    </pre>
                  </div>
                </div>
              </div>

              {/* Card Components Section */}
              <div>
                <h3 className="font-semibold mb-3 text-lg">Card Components</h3>
                <p className="text-sm text-muted-foreground mb-4">Cards use the shadcn/ui component system with semantic color tokens</p>
                <div className="space-y-3">
                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Card Structure</h4>
                    <pre className="bg-background p-3 rounded-lg overflow-x-auto text-xs">
                      <code>{`<Card className="overflow-hidden">
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Supporting text</CardDescription>
  </CardHeader>
  <CardContent>
    Main content goes here
  </CardContent>
  <CardFooter>
    Actions or metadata
  </CardFooter>
</Card>`}</code>
                    </pre>
                  </div>

                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Card Colors</h4>
                    <pre className="bg-background p-3 rounded-lg overflow-x-auto text-xs">
                      <code>{`/* Card uses semantic tokens */
background-color: hsl(var(--card));
color: hsl(var(--card-foreground));
border-color: hsl(var(--border));

/* Automatically adapts to light/dark mode */`}</code>
                    </pre>
                  </div>
                </div>
              </div>

              {/* UI Components Section */}
              <div>
                <h3 className="font-semibold mb-3 text-lg">Available UI Components</h3>
                <p className="text-sm text-muted-foreground mb-4">Shadcn/ui components with full TypeScript support</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                  <div className="bg-muted p-2 rounded">Button</div>
                  <div className="bg-muted p-2 rounded">Card</div>
                  <div className="bg-muted p-2 rounded">Dialog</div>
                  <div className="bg-muted p-2 rounded">Dropdown Menu</div>
                  <div className="bg-muted p-2 rounded">Input</div>
                  <div className="bg-muted p-2 rounded">Label</div>
                  <div className="bg-muted p-2 rounded">Select</div>
                  <div className="bg-muted p-2 rounded">Textarea</div>
                  <div className="bg-muted p-2 rounded">Tabs</div>
                  <div className="bg-muted p-2 rounded">Toast</div>
                  <div className="bg-muted p-2 rounded">Accordion</div>
                  <div className="bg-muted p-2 rounded">Alert</div>
                  <div className="bg-muted p-2 rounded">Avatar</div>
                  <div className="bg-muted p-2 rounded">Badge</div>
                  <div className="bg-muted p-2 rounded">Calendar</div>
                  <div className="bg-muted p-2 rounded">Checkbox</div>
                  <div className="bg-muted p-2 rounded">Switch</div>
                  <div className="bg-muted p-2 rounded">Table</div>
                  <div className="bg-muted p-2 rounded">Tooltip</div>
                  <div className="bg-muted p-2 rounded">Sheet</div>
                  <div className="bg-muted p-2 rounded">Sidebar</div>
                  <div className="bg-muted p-2 rounded">Carousel</div>
                </div>
              </div>

              {/* Animations Section */}
              <div>
                <h3 className="font-semibold mb-3 text-lg">Animations</h3>
                <p className="text-sm text-muted-foreground mb-4">Built-in Tailwind animations</p>
                <div className="bg-muted p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <code className="bg-background px-2 py-1 rounded">animate-accordion-down</code>
                      <p className="text-xs text-muted-foreground mt-1">Smooth accordion expand</p>
                    </div>
                    <div>
                      <code className="bg-background px-2 py-1 rounded">animate-accordion-up</code>
                      <p className="text-xs text-muted-foreground mt-1">Smooth accordion collapse</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Screen Types Section */}
              <div>
                <h3 className="font-semibold mb-3 text-lg">Screen Types (Routes)</h3>
                <p className="text-sm text-muted-foreground mb-4">Each route corresponds to a React component/page in the app</p>
                <div className="space-y-3">
                  <div className="border-l-2 border-primary pl-4">
                    <h4 className="font-medium">Public Screens</h4>
                    <p className="text-sm text-muted-foreground">No authentication required - accessible to all visitors</p>
                    <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                      <li>/ - Landing/index page</li>
                      <li>/auth - Login page</li>
                      <li>/accept-invite - Invitation completion</li>
                    </ul>
                  </div>

                  <div className="border-l-2 border-blue-500 pl-4">
                    <h4 className="font-medium">Protected Screens</h4>
                    <p className="text-sm text-muted-foreground">Requires authentication - wrapped in ProtectedRoute component</p>
                    <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                      <li>/dashboard - Main app screen</li>
                      <li>/assistant - AI chat interface</li>
                      <li>/chat - Community messaging</li>
                      <li>/documents - Document browser</li>
                      <li>/photos - Photo gallery</li>
                    </ul>
                  </div>

                  <div className="border-l-2 border-red-500 pl-4">
                    <h4 className="font-medium">Admin Screens</h4>
                    <p className="text-sm text-muted-foreground">Requires admin role - role checked via user_roles table</p>
                    <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                      <li>/users - User management</li>
                      <li>/admin-settings - System configuration</li>
                    </ul>
                  </div>
                </div>
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

        {/* Assets Tab */}
        <TabsContent value="assets" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                Branding Assets
              </CardTitle>
              <CardDescription>Logos, icons, and images for mobile app branding</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3">Logos</h3>
                <div className="space-y-3">
                  <div className="border-l-2 border-primary pl-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Header Logo</h4>
                        <p className="text-sm text-muted-foreground">Main header and navigation</p>
                        <code className="text-xs bg-muted px-2 py-1 rounded mt-1 inline-block">/header-logo.png</code>
                      </div>
                    </div>
                  </div>
                  <div className="border-l-2 border-primary pl-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Poipu Logo Icon</h4>
                        <p className="text-sm text-muted-foreground">App icon, small logo displays</p>
                        <code className="text-xs bg-muted px-2 py-1 rounded mt-1 inline-block">/src/assets/poipu-logo-icon.png</code>
                      </div>
                    </div>
                  </div>
                  <div className="border-l-2 border-primary pl-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Poipu Text Logo</h4>
                        <p className="text-sm text-muted-foreground">Text-based logo variant</p>
                        <code className="text-xs bg-muted px-2 py-1 rounded mt-1 inline-block">/src/assets/poipu-text.png</code>
                      </div>
                    </div>
                  </div>
                  <div className="border-l-2 border-primary pl-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Primary Logo</h4>
                        <p className="text-sm text-muted-foreground">General branding</p>
                        <code className="text-xs bg-muted px-2 py-1 rounded mt-1 inline-block">/src/assets/logo.png</code>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Favicon</h3>
                <div className="border-l-2 border-primary pl-4">
                  <h4 className="font-medium">Favicon</h4>
                  <p className="text-sm text-muted-foreground">Browser tab icon</p>
                  <code className="text-xs bg-muted px-2 py-1 rounded mt-1 inline-block">/favicon.png</code>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Background Images</h3>
                <div className="space-y-3">
                  <div className="border-l-2 border-blue-500 pl-4">
                    <h4 className="font-medium">Poipu Beach Sunset</h4>
                    <p className="text-sm text-muted-foreground">Hero image, default background</p>
                    <code className="text-xs bg-muted px-2 py-1 rounded mt-1 inline-block">/src/assets/poipu-beach-sunset.jpg</code>
                  </div>
                  <div className="border-l-2 border-blue-500 pl-4">
                    <h4 className="font-medium">Oceanfront Condo</h4>
                    <p className="text-sm text-muted-foreground">Property showcase</p>
                    <code className="text-xs bg-muted px-2 py-1 rounded mt-1 inline-block">/src/assets/condo-oceanfront.jpeg</code>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Feature Images</h3>
                <div className="border-l-2 border-green-500 pl-4">
                  <h4 className="font-medium">Chicken Assistant Avatar</h4>
                  <p className="text-sm text-muted-foreground">AI assistant avatar ("Ask the Chicken")</p>
                  <code className="text-xs bg-muted px-2 py-1 rounded mt-1 inline-block">/src/assets/chicken-assistant.jpeg</code>
                </div>
              </div>

              <Card className="border-2 border-purple-500/20 bg-purple-500/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5 text-purple-500" />
                    Mobile App Configuration
                  </CardTitle>
                  <CardDescription>
                    Complete mobile page configuration endpoint with tab icons, header logos, and page ordering
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-2">Configuration Endpoint</h3>
                    <code className="block p-3 bg-muted rounded-md text-sm break-all mb-3">
                      GET {baseUrl}/rest/v1/app_settings?select=setting_value&setting_key=eq.mobile_pages_config
                    </code>
                    
                    <div className="space-y-2 mb-4">
                      <h4 className="font-medium text-sm">Required Headers:</h4>
                      <pre className="block p-3 bg-muted rounded-md text-xs overflow-x-auto">
{`apikey: ${anonKey}
Content-Type: application/json`}
                      </pre>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Response Format</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      The endpoint returns an array with a single object containing the configuration:
                    </p>
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
                      <code>{`[
  {
    "setting_value": {
      "pages": [
        {
          "id": "home",
          "tabName": "Home",
          "title": "Dashboard",
          "subtitle": "Welcome to Poipu Shores",
          "iconUrl": "${baseUrl}/storage/v1/object/public/avatars/mobile-icon-home.png",
          "headerLogoUrl": "${baseUrl}/storage/v1/object/public/avatars/mobile-header-home.png",
          "fallbackIcon": "Home",
          "order": 1,
          "isVisible": true
        },
        {
          "id": "chat",
          "tabName": "Chat",
          "title": "Community Chat",
          "subtitle": "Connect with neighbors",
          "iconUrl": "${baseUrl}/storage/v1/object/public/avatars/mobile-icon-chat.png",
          "headerLogoUrl": "${baseUrl}/storage/v1/object/public/avatars/mobile-header-chat.png",
          "fallbackIcon": "MessageSquare",
          "order": 2,
          "isVisible": true
        },
        {
          "id": "photos",
          "tabName": "Photos",
          "title": "Photo Gallery",
          "subtitle": "Community photos",
          "iconUrl": "${baseUrl}/storage/v1/object/public/avatars/mobile-icon-photos.png",
          "headerLogoUrl": "${baseUrl}/storage/v1/object/public/avatars/mobile-header-photos.png",
          "fallbackIcon": "Camera",
          "order": 3,
          "isVisible": true
        },
        {
          "id": "documents",
          "tabName": "Docs",
          "title": "Documents",
          "subtitle": "Important files",
          "iconUrl": "${baseUrl}/storage/v1/object/public/avatars/mobile-icon-documents.png",
          "headerLogoUrl": "${baseUrl}/storage/v1/object/public/avatars/mobile-header-documents.png",
          "fallbackIcon": "FileText",
          "order": 4,
          "isVisible": true
        },
        {
          "id": "profile",
          "tabName": "Profile",
          "title": "My Profile",
          "subtitle": "Account settings",
          "iconUrl": "${baseUrl}/storage/v1/object/public/avatars/mobile-icon-profile.png",
          "headerLogoUrl": "${baseUrl}/storage/v1/object/public/avatars/mobile-header-profile.png",
          "fallbackIcon": "User",
          "order": 5,
          "isVisible": true
        },
        {
          "id": "assistant",
          "tabName": "Ask",
          "title": "Ask the Chicken",
          "subtitle": "AI Assistant",
          "iconUrl": "${baseUrl}/storage/v1/object/public/avatars/mobile-icon-assistant.png",
          "headerLogoUrl": "${baseUrl}/storage/v1/object/public/avatars/mobile-header-assistant.png",
          "fallbackIcon": "Bird",
          "order": 6,
          "isVisible": true
        }
      ]
    }
  }
]`}</code>
                    </pre>
                  </div>

                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 space-y-3">
                    <h4 className="font-semibold text-blue-700 dark:text-blue-300">📱 Implementation Guide</h4>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li><strong>1. Filter visible pages:</strong> Show only pages where <code>isVisible === true</code></li>
                      <li><strong>2. Sort by order:</strong> Sort pages by the <code>order</code> field (ascending)</li>
                      <li><strong>3. Tab bar icons:</strong> Use <code>iconUrl</code> for bottom tab navigation (24-32px recommended)</li>
                      <li><strong>4. Page header logos:</strong> Use <code>headerLogoUrl</code> for page title bars (120-200px wide)</li>
                      <li><strong>5. Fallback icons:</strong> Use <code>fallbackIcon</code> if <code>iconUrl</code> or <code>headerLogoUrl</code> is null</li>
                      <li><strong>6. Tab names:</strong> Use <code>tabName</code> for tab labels</li>
                      <li><strong>7. Page titles:</strong> Use <code>title</code> in the page header</li>
                      <li><strong>8. Subtitles:</strong> Use <code>subtitle</code> for secondary header text</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Swift Implementation Example</h3>
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
                      <code>{`struct MobilePage: Codable {
    let id: String
    let tabName: String
    let title: String
    let subtitle: String
    let iconUrl: String?
    let headerLogoUrl: String?
    let fallbackIcon: String
    let order: Int
    let isVisible: Bool
}

struct MobileConfig: Codable {
    let pages: [MobilePage]
}

struct AppSettingResponse: Codable {
    let setting_value: MobileConfig
}

func fetchMobileConfig() async throws -> [MobilePage] {
    let response: [AppSettingResponse] = try await supabase
        .from("app_settings")
        .select()
        .eq("setting_key", value: "mobile_pages_config")
        .execute()
        .value
    
    guard let config = response.first?.setting_value else {
        throw NSError(domain: "Config", code: 404)
    }
    
    // Filter visible pages and sort by order
    return config.pages
        .filter { $0.isVisible }
        .sorted { $0.order < $1.order }
}`}</code>
                    </pre>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2 mt-4">Fixed Asset URLs</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Icon and logo URLs use fixed filenames and can be hardcoded:
                    </p>
                    
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-sm font-medium mb-2">Tab Bar Icons (24-32px):</h4>
                        <div className="space-y-1 text-xs font-mono bg-muted/50 p-3 rounded">
                          <div>{baseUrl}/storage/v1/object/public/avatars/mobile-icon-home.png</div>
                          <div>{baseUrl}/storage/v1/object/public/avatars/mobile-icon-chat.png</div>
                          <div>{baseUrl}/storage/v1/object/public/avatars/mobile-icon-photos.png</div>
                          <div>{baseUrl}/storage/v1/object/public/avatars/mobile-icon-documents.png</div>
                          <div>{baseUrl}/storage/v1/object/public/avatars/mobile-icon-profile.png</div>
                          <div>{baseUrl}/storage/v1/object/public/avatars/mobile-icon-assistant.png</div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-2">Page Header Logos (120-200px wide):</h4>
                        <div className="space-y-1 text-xs font-mono bg-muted/50 p-3 rounded">
                          <div>{baseUrl}/storage/v1/object/public/avatars/mobile-header-home.png</div>
                          <div>{baseUrl}/storage/v1/object/public/avatars/mobile-header-chat.png</div>
                          <div>{baseUrl}/storage/v1/object/public/avatars/mobile-header-photos.png</div>
                          <div>{baseUrl}/storage/v1/object/public/avatars/mobile-header-documents.png</div>
                          <div>{baseUrl}/storage/v1/object/public/avatars/mobile-header-profile.png</div>
                          <div>{baseUrl}/storage/v1/object/public/avatars/mobile-header-assistant.png</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                    <h4 className="font-semibold mb-2 text-green-700 dark:text-green-300">✨ Auto-Update Feature</h4>
                    <p className="text-sm text-muted-foreground">
                      When admins upload new icons through Admin Settings → Mobile tab, the files are overwritten at these same URLs. 
                      Your app automatically displays updated icons without requiring an app update or code changes.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div>
                <h3 className="font-semibold mb-2 mt-6">Accessing Assets in Swift</h3>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{`// For public assets (favicon, header-logo)
let logoURL = URL(string: "${baseUrl}/header-logo.png")

// For bundled assets, download from your web app:
// 1. Navigate to the asset in your browser
// 2. Download the file
// 3. Add to your Xcode project's Assets.xcassets

// Example: Add poipu-logo-icon.png to Assets
let logo = UIImage(named: "poipu-logo-icon")`}</code>
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