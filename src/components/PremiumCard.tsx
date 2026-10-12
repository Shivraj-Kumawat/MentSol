import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface PremiumCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "glass" | "elevated" | "gradient" | "glow";
  hoverEffect?: boolean;
}

export const PremiumCard = forwardRef<HTMLDivElement, PremiumCardProps>(
  ({ className, variant = "glass", hoverEffect = true, children, ...props }, ref) => {
    const variants = {
      glass: "bg-card/80 backdrop-blur-xl border border-border/50 shadow-lg",
      elevated: "bg-card shadow-xl shadow-primary/5 border border-border/30",
      gradient: "bg-gradient-to-br from-card via-card to-primary/5 border border-primary/20 shadow-lg",
      glow: "bg-card border border-primary/30 shadow-glow",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-2xl p-6 transition-all duration-300",
          variants[variant],
          hoverEffect && "hover:shadow-xl hover:-translate-y-1 hover:border-primary/40",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

PremiumCard.displayName = "PremiumCard";
