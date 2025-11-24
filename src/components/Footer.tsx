import { Link } from "react-router-dom";

export const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="mt-auto border-t border-border/20 bg-card/30 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-wrap items-center justify-center gap-2 text-center text-sm text-muted-foreground">
          <span>© {currentYear} Poipu Shores</span>
          <span>•</span>
          <span>1775 Pe'e Rd, Poipu, HI 96756</span>
          <span>•</span>
          <span>Built by <a href="https://www.cooksolutionsgroup.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-foreground hover:text-primary transition-colors">Cook Solutions Group</a></span>
          <span>•</span>
          <Link 
            to="/privacy-policy" 
            className="hover:text-foreground transition-colors"
          >
            Privacy Policy
          </Link>
          <span>•</span>
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
