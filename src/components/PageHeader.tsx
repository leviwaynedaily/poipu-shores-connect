import { useTheme } from "@/contexts/ThemeContext";
import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export const PageHeader = ({ title, description, actions }: PageHeaderProps) => {
  const { isGlassTheme, glassIntensity } = useTheme();
  
  // Calculate opacity for backdrop
  const backdropOpacity = isGlassTheme ? 10 + (glassIntensity * 0.7) : 95;
  
  return (
    <div 
      className="rounded-lg p-4 sm:p-6 mb-4 sm:mb-6 backdrop-blur-sm"
      style={{
        backgroundColor: `hsl(var(--card) / ${backdropOpacity}%)`,
        textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)',
      }}
    >
      <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground break-words">{title}</h2>
          {description && (
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground mt-1 sm:mt-2">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex-shrink-0 w-full sm:w-auto">{actions}</div>}
      </div>
    </div>
  );
};
