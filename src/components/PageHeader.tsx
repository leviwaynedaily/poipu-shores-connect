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
      className="rounded-lg p-6 mb-6 backdrop-blur-sm"
      style={{
        backgroundColor: `hsl(var(--card) / ${backdropOpacity}%)`,
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground">{title}</h2>
          {description && (
            <p className="text-lg text-muted-foreground mt-2">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex-shrink-0">{actions}</div>}
      </div>
    </div>
  );
};
