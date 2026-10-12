import { Shield, Lock, CheckCircle2, Award } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrustBadgeProps {
  type: "secure" | "verified" | "ssl" | "award";
  className?: string;
  animated?: boolean;
}

export const TrustBadge = ({ type, className, animated = true }: TrustBadgeProps) => {
  const badges = {
    secure: {
      icon: Shield,
      text: "Secure Platform",
      color: "text-emerald-500",
      glow: "shadow-emerald-500/20"
    },
    verified: {
      icon: CheckCircle2,
      text: "Verified Mentors",
      color: "text-primary",
      glow: "shadow-primary/20"
    },
    ssl: {
      icon: Lock,
      text: "SSL Encrypted",
      color: "text-blue-500",
      glow: "shadow-blue-500/20"
    },
    award: {
      icon: Award,
      text: "Quality Focus",
      color: "text-amber-500",
      glow: "shadow-amber-500/20"
    }
  };

  const badge = badges[type];
  const Icon = badge.icon;

  return (
    <div className={cn(
      "group inline-flex items-center gap-2 px-3 py-1.5 rounded-full",
      "bg-background/80 backdrop-blur-md border border-border/50",
      "shadow-lg transition-all duration-300",
      "hover:scale-105 hover:shadow-xl",
      badge.glow,
      className
    )}>
      <div className="relative">
        <Icon className={cn(
          "h-4 w-4 transition-all duration-300",
          badge.color,
          animated && "animate-icon-pulse group-hover:scale-110"
        )} />
        {animated && (
          <div className={cn(
            "absolute inset-0 rounded-full blur-sm opacity-50",
            badge.color,
            "animate-ping"
          )} style={{ animationDuration: '2s' }} />
        )}
      </div>
      <span className="text-xs font-semibold text-foreground/90">
        {badge.text}
      </span>
    </div>
  );
};
