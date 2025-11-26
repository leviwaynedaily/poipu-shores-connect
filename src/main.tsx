import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Build version for cache busting
const BUILD_VERSION = "__BUILD_TIMESTAMP__";

// Clear all caches on startup
const clearAllCaches = async () => {
  try {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }
  } catch (error) {
    console.error('Error clearing caches:', error);
  }
};

// Check version and force refresh if outdated
const checkVersion = () => {
  try {
    const storedVersion = localStorage.getItem('app_version');
    
    if (storedVersion && storedVersion !== BUILD_VERSION) {
      console.log('New version detected, clearing caches and reloading...');
      clearAllCaches().then(() => {
        localStorage.setItem('app_version', BUILD_VERSION);
        window.location.reload();
      }).catch(error => {
        console.error('Error during version update:', error);
        localStorage.setItem('app_version', BUILD_VERSION);
        window.location.reload();
      });
      return false;
    }
    
    localStorage.setItem('app_version', BUILD_VERSION);
    return true;
  } catch (error) {
    console.error('Error checking version:', error);
    return true; // Continue loading even if version check fails
  }
};

// Unregister any existing service workers (one-time cleanup for PWA removal)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => registration.unregister());
  }).catch(error => console.error('Error unregistering service workers:', error));
}

// Clear caches and check version
clearAllCaches().catch(error => console.error('Error during initial cache clear:', error));
const shouldRender = checkVersion();

if (!shouldRender) {
  // Don't render if we're about to reload
  throw new Error('Reloading for new version');
}

createRoot(document.getElementById("root")!).render(<App />);
