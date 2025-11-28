import { useTheme } from "@/contexts/ThemeContext";
import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  logoUrl?: string | null;
}

export const PageHeader = ({ title, description, actions, logoUrl }: PageHeaderProps) => {
  const { isGlassTheme, glassIntensity } = useTheme();
  
  // Calculate opacity based on intensity (matching Card component)
  const opacity = isGlassTheme ? 5 + (glassIntensity * 0.95) : 100;
  const borderOpacity = isGlassTheme ? 15 + (glassIntensity * 0.85) : 100;
  
  return (
    <div 
      className={`rounded-lg border shadow-sm p-4 sm:p-6 mb-4 sm:mb-6 ${
        isGlassTheme 
          ? "backdrop-blur-sm" 
          : "bg-card border-border"
      }`}
      style={isGlassTheme ? {
        backgroundColor: `hsl(var(--card) / ${opacity}%)`,
        borderColor: `hsl(var(--border) / ${borderOpacity}%)`
      } : undefined}
    >
      <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0 flex items-center gap-3">
          {logoUrl && (
            <img 
              src={logoUrl} 
              alt={title}
              className="h-10 w-auto object-contain flex-shrink-0"
            />
          )}
          <div className="min-w-0 flex-1">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-card-foreground break-words">{title}</h2>
            {description && (
              <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
                {description}
              </p>
            )}
          </div>
        </div>
        {actions && <div className="flex-shrink-0 w-full sm:w-auto">{actions}</div>}
      </div>
    </div>
  );
};
