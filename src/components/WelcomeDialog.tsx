import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

export const WelcomeDialog = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem("poipu-shores-welcome-seen");
    if (!hasSeenWelcome) {
      setOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem("poipu-shores-welcome-seen", "true");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Welcome to Poipu Shores Owner Platform! 🌺</DialogTitle>
          <DialogDescription className="text-base pt-4 space-y-4">
            <p>
              We're thrilled to have you here! This platform is your central hub for everything 
              related to your Poipu Shores property on beautiful Kauai, Hawaii.
            </p>
            
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Community Updates:</strong> Stay informed with announcements and important news
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Connect with Neighbors:</strong> Chat with fellow owners and board members
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Document Access:</strong> View and manage important property documents
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Photo Gallery:</strong> Share and enjoy photos from our beautiful community
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Live Beach Conditions:</strong> Check real-time weather and webcams
                </div>
              </div>
            </div>

            <p className="pt-2 text-muted-foreground">
              Explore the sidebar to discover all features. If you need help, don't hesitate 
              to reach out to the board or fellow community members!
            </p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={handleClose} className="w-full sm:w-auto">
            Get Started
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
