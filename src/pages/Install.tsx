import { useState, useEffect } from "react";
import { Smartphone, Download, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function Install() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Check if iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(ios);

    // Listen for the beforeinstallprompt event
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsInstalled(true);
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8 text-center">
        <Smartphone className="h-16 w-16 mx-auto mb-4 text-primary" />
        <h1 className="text-3xl font-bold mb-2">Install Poipu Shores</h1>
        <p className="text-muted-foreground">
          Install our app for quick access and offline capabilities
        </p>
      </div>

      {isInstalled ? (
        <Alert className="mb-6">
          <Check className="h-4 w-4" />
          <AlertDescription>
            App is already installed! You can find it on your home screen.
          </AlertDescription>
        </Alert>
      ) : (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Install Instructions</CardTitle>
            <CardDescription>Follow these steps to install the app</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isIOS ? (
              <div className="space-y-3">
                <p className="font-medium">For iPhone/iPad:</p>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Tap the Share button (square with arrow pointing up) in Safari</li>
                  <li>Scroll down and tap "Add to Home Screen"</li>
                  <li>Tap "Add" in the top right corner</li>
                  <li>Find the app icon on your home screen</li>
                </ol>
              </div>
            ) : deferredPrompt ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Click the button below to install the app on your device.
                </p>
                <Button onClick={handleInstall} className="w-full" size="lg">
                  <Download className="mr-2 h-4 w-4" />
                  Install App
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="font-medium">For Android/Chrome:</p>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Tap the menu button (three dots) in your browser</li>
                  <li>Look for "Install app" or "Add to Home screen"</li>
                  <li>Tap "Install" when prompted</li>
                  <li>Find the app icon on your home screen</li>
                </ol>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Benefits</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start">
              <Check className="h-4 w-4 mr-2 mt-0.5 text-primary flex-shrink-0" />
              <span>Quick access from your home screen</span>
            </li>
            <li className="flex items-start">
              <Check className="h-4 w-4 mr-2 mt-0.5 text-primary flex-shrink-0" />
              <span>Works offline for viewing cached content</span>
            </li>
            <li className="flex items-start">
              <Check className="h-4 w-4 mr-2 mt-0.5 text-primary flex-shrink-0" />
              <span>Fast loading and smooth performance</span>
            </li>
            <li className="flex items-start">
              <Check className="h-4 w-4 mr-2 mt-0.5 text-primary flex-shrink-0" />
              <span>Full-screen experience without browser UI</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
