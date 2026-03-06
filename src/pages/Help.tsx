import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { usePageConfig } from "@/hooks/use-page-config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Home,
  Megaphone,
  MessageSquare,
  FileText,
  Camera,
  Users,
  Bird,
  User,
  HelpCircle,
  Phone,
  Mail,
  KeyRound,
  Settings,
  BookOpen,
} from "lucide-react";

const featureGuides = [
  {
    icon: Home,
    title: "Dashboard",
    description: "Your home base with live weather, beach conditions, webcams, and emergency contacts.",
    tips: [
      "Check the weather widget for current conditions before heading to the beach",
      "Use the live webcam feeds to see beach and pool conditions in real-time",
      "Emergency contacts are always available at the bottom of the dashboard",
    ],
  },
  {
    icon: Megaphone,
    title: "Announcements",
    description: "Important community updates from your HOA board.",
    tips: [
      "Pinned announcements appear at the top — these are the most important",
      "New announcements show a badge so you know what you haven't read yet",
      "Admins can create, edit, and pin announcements",
    ],
  },
  {
    icon: MessageSquare,
    title: "Community Chat",
    description: "Chat with your neighbors in group channels or private messages.",
    tips: [
      "Use channels for topic-based discussions (e.g., maintenance, social events)",
      "You can send private messages to individual neighbors",
      "Tap on a message to react with an emoji",
    ],
  },
  {
    icon: FileText,
    title: "Documents",
    description: "Access community documents, bylaws, meeting minutes, and forms.",
    tips: [
      "Documents are organized in folders — browse by category",
      "Use the search feature to find specific documents quickly",
      "You can view PDFs directly in the browser",
    ],
  },
  {
    icon: Camera,
    title: "Community Photos",
    description: "Share and enjoy photos of community life, sunsets, and events.",
    tips: [
      "Upload photos from your phone or computer",
      "Like and comment on photos shared by neighbors",
      "Photos are organized by category for easy browsing",
    ],
  },
  {
    icon: Users,
    title: "Members Directory",
    description: "Find and connect with your Poipu Shores neighbors.",
    tips: [
      "See contact info for residents who have opted to share it",
      "Find your neighbors by name or unit number",
      "Your own visibility settings can be changed in your profile",
    ],
  },
  {
    icon: Bird,
    title: "Ask the Chicken (AI Assistant)",
    description: "Your friendly community assistant that can answer questions about Poipu Shores.",
    tips: [
      "Ask about community rules, policies, or documents",
      "Get recommendations for local restaurants and activities",
      "The assistant can search through community documents for answers",
    ],
  },
  {
    icon: User,
    title: "Your Profile",
    description: "Manage your profile photo, contact information, and privacy settings.",
    tips: [
      "Add a profile photo so neighbors can recognize you",
      "Choose whether to show your contact info in the member directory",
      "Update your phone number to enable phone sign-in",
    ],
  },
];

const faqItems = [
  {
    question: "How do I sign in?",
    answer: "You can sign in with your email and password, or use a one-time code sent to your email or phone. Just enter your email or phone number on the login page and follow the prompts.",
  },
  {
    question: "I forgot my password — what do I do?",
    answer: "On the login page, enter your email, click 'Continue', then click 'Forgot password?'. A reset link will be sent to your email. Check your spam folder if you don't see it.",
  },
  {
    question: "Can I sign in with my phone number?",
    answer: "Yes! If your phone number is on file, just enter it on the login page. You'll receive a 6-digit code via text message to sign in — no password needed.",
  },
  {
    question: "How do I change my profile photo?",
    answer: "Go to your Profile page (click your name in the sidebar or bottom menu), then click on your avatar or the 'Change Photo' button to upload a new image.",
  },
  {
    question: "How do I hide my contact info from other members?",
    answer: "Go to your Profile page and toggle off 'Show in Members Directory'. Other residents won't be able to see your phone number or email.",
  },
  {
    question: "Who can see my messages in the chat?",
    answer: "Messages in channels are visible to all members of that channel. Private/direct messages are only visible to you and the person you're messaging.",
  },
  {
    question: "How do I contact the HOA board?",
    answer: "You can reach the board through the Announcements page (they post updates there), via the Community Chat, or check the Emergency Contacts on the Dashboard for important numbers.",
  },
  {
    question: "What is 'Ask the Chicken'?",
    answer: "It's a friendly AI assistant that can answer questions about Poipu Shores, help you find documents, and provide information about the community. Think of it as a helpful community guide!",
  },
];

const Help = () => {
  const { pageConfig, isLoading } = usePageConfig();

  return (
    <div className="space-y-6">
      <PageHeader
        title={pageConfig?.title || "Help & Getting Started"}
        subtitle={pageConfig?.subtitle || "Everything you need to know about using Poipu Shores Connect"}
        iconName="HelpCircle"
        iconUrl={pageConfig?.iconUrl}
        headerLogoUrl={pageConfig?.headerLogoUrl}
        isLoading={isLoading}
      />

      {/* Quick Start */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <BookOpen className="h-5 w-5 text-primary" />
            Quick Start Guide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-start gap-3 p-4 rounded-lg border bg-card">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold flex-shrink-0">1</div>
              <div>
                <h4 className="font-medium">Sign In</h4>
                <p className="text-sm text-muted-foreground">Use your email + password, or request a one-time code via email or text.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-lg border bg-card">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold flex-shrink-0">2</div>
              <div>
                <h4 className="font-medium">Set Up Your Profile</h4>
                <p className="text-sm text-muted-foreground">Add your photo and phone number so neighbors can connect with you.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-lg border bg-card">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold flex-shrink-0">3</div>
              <div>
                <h4 className="font-medium">Explore</h4>
                <p className="text-sm text-muted-foreground">Check announcements, join the chat, browse photos, and explore documents.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sign-In Help */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <KeyRound className="h-5 w-5 text-primary" />
            How to Sign In
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="p-4 rounded-lg border space-y-2">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <h4 className="font-medium">Email + Password</h4>
              </div>
              <p className="text-sm text-muted-foreground">Enter your email, click Continue, then type your password.</p>
            </div>
            <div className="p-4 rounded-lg border space-y-2">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                <h4 className="font-medium">Phone Number</h4>
              </div>
              <p className="text-sm text-muted-foreground">Enter your phone number. A code will be texted to you — no password needed!</p>
            </div>
            <div className="p-4 rounded-lg border space-y-2">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <h4 className="font-medium">Email Code</h4>
              </div>
              <p className="text-sm text-muted-foreground">Enter your email, then click "Send me a code instead" for a passwordless login.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Guides */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <HelpCircle className="h-5 w-5 text-primary" />
            Feature Guide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {featureGuides.map((guide) => {
              const Icon = guide.icon;
              return (
                <div key={guide.title} className="p-4 rounded-lg border space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">{guide.title}</h4>
                      <p className="text-xs text-muted-foreground">{guide.description}</p>
                    </div>
                  </div>
                  <ul className="space-y-1.5 pl-1">
                    {guide.tips.map((tip, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <MessageSquare className="h-5 w-5 text-primary" />
            Frequently Asked Questions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item, index) => (
              <AccordionItem key={index} value={`faq-${index}`}>
                <AccordionTrigger className="text-left">{item.question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
};

export default Help;
