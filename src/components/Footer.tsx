import { Link } from "react-router-dom";

export const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="mt-auto border-t border-border/20 bg-card/30 backdrop-blur-sm">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 text-center text-xs sm:text-sm text-muted-foreground">
          <span>© {currentYear} Poipu Shores</span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">1775 Pe'e Rd, Poipu, HI 96756</span>
          <span className="hidden sm:inline">•</span>
          <span>Built by <a href="https://www.cooksolutionsgroup.com" target="_blank" rel="noopener noreferrer" className="font-semibold hover:text-primary transition-colors">Cook Solutions Group</a></span>
          <span className="hidden xs:inline">•</span>
          <Link 
            to="/privacy-policy" 
            className="hover:text-foreground transition-colors"
          >
            Privacy Policy
          </Link>
          <span className="hidden xs:inline">•</span>
          <Link 
            to="/terms-of-service" 
            className="hover:text-foreground transition-colors"
          >
            Terms of Service
          </Link>
        </div>
      </div>
    </footer>
  );
};
