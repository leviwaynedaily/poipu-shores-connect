import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Home,
  Megaphone,
  MessageSquare,
  FileText,
  Camera,
  Users,
  Bird,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  PartyPopper,
} from "lucide-react";

const tourSteps = [
  {
    icon: PartyPopper,
    title: "Welcome to the Poipu Shores Owner's Portal!",
    description: "Let's take a quick tour of the portal so you know where everything is. This will only take a minute!",
    tip: "You can revisit this guide anytime from the Help page.",
  },
  {
    icon: Home,
    title: "Dashboard",
    description: "This is your home base. You'll find live weather, beach conditions, webcam feeds, and emergency contacts here.",
    tip: "Check the dashboard before heading to the beach for current conditions!",
  },
  {
    icon: Megaphone,
    title: "Announcements",
    description: "Important updates from your HOA board appear here. Pinned items are the most critical — don't miss them!",
    tip: "New announcements will show a badge so you know when something's new.",
  },
  {
    icon: MessageSquare,
    title: "Community Chat",
    description: "Chat with your neighbors! Join group channels or send private messages. It's like a neighborhood group text.",
    tip: "Tap on any message to react with an emoji 👍",
  },
  {
    icon: FileText,
    title: "Documents",
    description: "Find all community documents here — bylaws, meeting minutes, forms, and more. Everything is organized in folders.",
    tip: "Use the search bar to quickly find what you need.",
  },
  {
    icon: Camera,
    title: "Community Photos",
    description: "Share photos of sunsets, events, and community life. Like and comment on your neighbors' photos!",
    tip: "Upload photos right from your phone camera.",
  },
  {
    icon: Users,
    title: "Members Directory",
    description: "Find your neighbors by name or unit number. See contact info for those who've chosen to share it.",
    tip: "You control whether your own info is visible in your Profile settings.",
  },
  {
    icon: Bird,
    title: "Ask the Chicken",
    description: "Your AI community assistant! Ask it questions about Poipu Shores, community rules, or local recommendations.",
    tip: "Try asking: 'How can I replace my windows?' or 'Do I need Board approval to remodel my unit?'",
  },
  {
    icon: HelpCircle,
    title: "Need Help Anytime?",
    description: "Visit the Help page from the sidebar for detailed guides, tips, and frequently asked questions.",
    tip: "You're all set! Click 'Finish' to start exploring. 🎉",
  },
];

export const WelcomeTour = ({ externalOpen, onExternalClose }: { externalOpen?: boolean; onExternalClose?: () => void } = {}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [checked, setChecked] = useState(false);

  // Allow external trigger
  useEffect(() => {
    if (externalOpen) {
      setCurrentStep(0);
      setShow(true);
    }
  }, [externalOpen]);

  useEffect(() => {
    if (!user || checked) return;

    const checkTourStatus = async () => {
      // Check if user has seen the welcome tour
      const tourKey = `welcome_tour_seen_${user.id}`;
      const seen = localStorage.getItem(tourKey);
      
      if (!seen) {
        // Small delay so dashboard loads first
        setTimeout(() => setShow(true), 1500);
      }
      setChecked(true);
    };

    checkTourStatus();
  }, [user, checked]);

  const handleFinish = () => {
    if (user) {
      localStorage.setItem(`welcome_tour_seen_${user.id}`, "true");
    }
    setShow(false);
    setCurrentStep(0);
  };

  const handleDismiss = () => {
    if (user) {
      localStorage.setItem(`welcome_tour_seen_${user.id}`, "true");
    }
    setShow(false);
    setCurrentStep(0);
  };

  const step = tourSteps[currentStep];
  const Icon = step.icon;
  const isLast = currentStep === tourSteps.length - 1;

  return (
    <Dialog open={show} onOpenChange={(open) => { if (!open) handleDismiss(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg">Getting Started</DialogTitle>
            <span className="text-xs text-muted-foreground">
              {currentStep + 1} / {tourSteps.length}
            </span>
          </div>
          <DialogDescription className="sr-only">Welcome tour for new users</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Icon className="w-8 h-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">{step.title}</h3>
              <p className="text-muted-foreground">{step.description}</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/5 border border-primary/10">
              <span className="text-sm text-primary font-medium">💡 Tip:</span>
              <span className="text-sm text-muted-foreground">{step.tip}</span>
            </div>
          </div>

          {/* Progress dots */}
          <div className="flex justify-center gap-1.5">
            {tourSteps.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentStep(i)}
                className={`h-2 rounded-full transition-all ${
                  i === currentStep ? "w-6 bg-primary" : "w-2 bg-muted"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-muted-foreground"
          >
            Skip tour
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>

            {isLast ? (
              <Button size="sm" onClick={handleFinish}>
                <CheckCircle2 className="w-4 h-4 mr-1" />
                Finish
              </Button>
            ) : (
              <Button size="sm" onClick={() => setCurrentStep(currentStep + 1)}>
                Next
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
