import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  HelpCircle, 
  Mail, 
  Phone, 
  KeyRound, 
  MessageSquare,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { useState } from "react";

interface LoginHelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const helpSteps = [
  {
    icon: Mail,
    title: "Sign in with Email",
    steps: [
      "Enter your email address in the login field",
      "Click 'Continue' to proceed",
      "Enter your password and click 'Sign In'",
      "If you forgot your password, click 'Forgot password?' to get a reset link",
    ],
  },
  {
    icon: Phone,
    title: "Sign in with Phone",
    steps: [
      "Enter your phone number (e.g. (808) 555-1234)",
      "Click 'Continue' — a 6-digit code will be texted to you",
      "Enter the code from your text message",
      "You'll be signed in automatically!",
    ],
  },
  {
    icon: KeyRound,
    title: "Sign in with a Code (No Password)",
    steps: [
      "Enter your email and click 'Continue'",
      "On the password screen, click 'Send me a code instead'",
      "Choose to receive the code by email or text",
      "Enter the 6-digit code to sign in — no password needed!",
    ],
  },
  {
    icon: MessageSquare,
    title: "Need More Help?",
    steps: [
      "If you haven't received an invite, contact your HOA board",
      "Check your spam/junk folder for login codes or reset emails",
      "Make sure you're using the email or phone number your HOA has on file",
      "If you're still having trouble, reach out to your community administrator",
    ],
  },
];

export const LoginHelpDialog = ({ open, onOpenChange }: LoginHelpDialogProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  const step = helpSteps[currentStep];
  const Icon = step.icon;

  const handleClose = (val: boolean) => {
    if (!val) setCurrentStep(0);
    onOpenChange(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            How to Sign In
          </DialogTitle>
          <DialogDescription>
            Step {currentStep + 1} of {helpSteps.length}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-center gap-3 p-4 rounded-lg border bg-card">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-semibold text-lg">{step.title}</h3>
          </div>

          <ol className="space-y-3 pl-1">
            {step.steps.map((text, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <span className="text-sm text-foreground leading-relaxed">{text}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>

          <div className="flex gap-1.5">
            {helpSteps.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentStep(i)}
                className={`h-2 rounded-full transition-all ${
                  i === currentStep ? "w-6 bg-primary" : "w-2 bg-muted"
                }`}
              />
            ))}
          </div>

          {currentStep < helpSteps.length - 1 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentStep(currentStep + 1)}
            >
              Next
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button size="sm" onClick={() => handleClose(false)}>
              <CheckCircle2 className="w-4 h-4 mr-1" />
              Got it!
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
