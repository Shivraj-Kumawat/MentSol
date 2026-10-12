import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface VerifiedBadgeProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export const VerifiedBadge = ({ 
  className, 
  size = "md",
  showText = true 
}: VerifiedBadgeProps) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6"
  };
  
  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base"
  };

  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-2 py-1 rounded-full",
      "bg-success/10 text-success border border-success/20",
      className
    )}>
      <CheckCircle2 className={cn(sizeClasses[size], "fill-current")} />
      {showText && (
        <span className={cn("font-medium", textSizeClasses[size])}>
          Verified
        </span>
      )}
    </div>
  );
};
