import * as React from "react";

import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => {
  const { isGlassTheme, glassIntensity } = useTheme();
  
  // Calculate opacity based on intensity (0-10 scale to 0-10% opacity)
  const opacity = isGlassTheme ? glassIntensity : 100;
  const borderOpacity = isGlassTheme ? Math.max(10, glassIntensity * 1.5) : 100;
  
  return (
    <div 
      ref={ref} 
      className={cn(
        "rounded-lg border text-card-foreground shadow-sm",
        isGlassTheme 
          ? `backdrop-blur-sm` 
          : "bg-card border-border",
        className
      )}
      style={isGlassTheme ? {
        backgroundColor: `hsl(var(--card) / ${opacity}%)`,
        borderColor: `hsl(var(--border) / ${borderOpacity}%)`
      } : undefined}
      {...props} 
    />
  );
});
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  ),
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => {
    const { isGlassTheme } = useTheme();
    
    return (
      <h3 
        ref={ref} 
        className={cn(
          "text-2xl leading-none tracking-tight",
          isGlassTheme ? "font-bold" : "font-semibold",
          className
        )} 
        {...props} 
      />
    );
  },
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  ),
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />,
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
  ),
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
