import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Send, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface EmailLog {
  id: string;
  sent_at: string;
  to_email: string;
  subject: string;
  status: string;
}

const emailTemplates = {
  custom: "Custom Message",
  "community-update": "Community Update",
  "weather-advisory": "Weather Advisory",
  "photo-highlights": "Photo Highlights",
};

const defaultMessages = {
  custom: "This is a test email from Poipu Shores Community Management System.\n\nIf you're receiving this, it means our email configuration is working correctly!",
  "community-update": "Aloha!\n\nWe hope this message finds you well. This is a test of our community update email system.\n\nStay tuned for important updates about events, maintenance schedules, and community news.\n\nMahalo!",
  "weather-advisory": "ATTENTION: This is a test weather advisory message.\n\nIn a real scenario, this would contain important weather information affecting our community.\n\nPlease stay safe and check back for updates.",
  "photo-highlights": "Check out the latest photos from our community!\n\nThis is a test of our photo highlight emails. Soon you'll be receiving beautiful images captured by your fellow residents.\n\nShare your own photos through the community app!",
};

export function EmailSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [recipientEmail, setRecipientEmail] = useState("");
  const [customSubject, setCustomSubject] = useState("Poipu Shores Test Email");
  const [message, setMessage] = useState(defaultMessages.custom);
  const [template, setTemplate] = useState<keyof typeof emailTemplates>("custom");
  const [sending, setSending] = useState(false);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    if (user?.email) {
      setRecipientEmail(user.email);
    }
  }, [user]);

  useEffect(() => {
    fetchEmailLogs();
  }, []);

  useEffect(() => {
    // Update message when template changes
    if (template !== "custom") {
      setMessage(defaultMessages[template]);
    }
  }, [template]);

  const fetchEmailLogs = async () => {
    setLoadingLogs(true);
    try {
      const { data, error } = await supabase
        .from("email_logs")
        .select("id, sent_at, to_email, subject, status")
        .order("sent_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setEmailLogs(data || []);
    } catch (error: any) {
      console.error("Error fetching email logs:", error);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!recipientEmail || !message) {
      toast({
        title: "Missing fields",
        description: "Please fill in recipient email and message",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-test-email", {
        body: {
          to_email: recipientEmail,
          subject: template === "custom" ? customSubject : undefined,
          message,
          template: template !== "custom" ? template : undefined,
        },
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || "Failed to send email");
      }

      toast({
        title: "Email sent!",
        description: `Test email sent to ${recipientEmail}`,
      });

      // Refresh logs
      await fetchEmailLogs();

      // Reset form if not sending to self
      if (recipientEmail !== user?.email) {
        setRecipientEmail(user?.email || "");
      }
    } catch (error: any) {
      console.error("Error sending test email:", error);
      toast({
        title: "Failed to send email",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleQuickSend = async () => {
    if (!user?.email) return;
    
    setRecipientEmail(user.email);
    // Brief delay to let the state update
    setTimeout(() => {
      handleSendTestEmail();
    }, 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Testing Tools
          </CardTitle>
          <CardDescription>
            Send test emails to warm up your domain and verify email delivery. All emails are sent from noreply@poipu-shores.com
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Test Email Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Send Test Email</CardTitle>
          <CardDescription>
            Choose a template or create a custom message
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="recipient">Recipient Email</Label>
              <Input
                id="recipient"
                type="email"
                placeholder="email@example.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template">Email Template</Label>
              <Select value={template} onValueChange={(value) => setTemplate(value as keyof typeof emailTemplates)}>
                <SelectTrigger id="template">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(emailTemplates).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {template === "custom" && (
            <div className="space-y-2">
              <Label htmlFor="subject">Subject Line</Label>
              <Input
                id="subject"
                placeholder="Email subject"
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Email message content..."
              className="min-h-[150px]"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSendTestEmail} disabled={sending} className="flex-1">
              {sending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Test Email
                </>
              )}
            </Button>
            <Button onClick={handleQuickSend} variant="outline" disabled={sending}>
              Send to Myself
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Email Log */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Recent Email Log</CardTitle>
              <CardDescription>
                Track emails sent through the testing tool
              </CardDescription>
            </div>
            <Button onClick={fetchEmailLogs} variant="outline" size="sm" disabled={loadingLogs}>
              {loadingLogs ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {emailLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No emails sent yet. Send your first test email above!
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date/Time</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {emailLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium whitespace-nowrap">
                        {formatDate(log.sent_at)}
                      </TableCell>
                      <TableCell>{log.to_email}</TableCell>
                      <TableCell className="max-w-[300px] truncate">
                        {log.subject}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                          log.status === "sent" 
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" 
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        }`}>
                          {log.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
