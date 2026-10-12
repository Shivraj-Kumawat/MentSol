import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnimatedIconProps {
  icon: LucideIcon;
  size?: number;
  className?: string;
  animation?: "pulse" | "bounce" | "float" | "glow" | "wiggle" | "rotate" | "none";
  color?: string;
}

export const AnimatedIcon = ({ 
  icon: Icon, 
  size = 24, 
  className,
  animation = "none",
  color
}: AnimatedIconProps) => {
  const animationClasses = {
    pulse: "animate-icon-pulse",
    bounce: "animate-icon-bounce", 
    float: "animate-float",
    glow: "animate-icon-glow",
    wiggle: "animate-icon-wiggle",
    rotate: "group-hover:animate-icon-rotate",
    none: ""
  };

  return (
    <div className={cn(
      "relative inline-flex items-center justify-center",
      animation === "glow" && "after:absolute after:inset-0 after:rounded-full after:bg-current after:opacity-20 after:blur-md after:animate-pulse",
      className
    )}>
      <Icon 
        size={size} 
        className={cn(
          "relative z-10 transition-all duration-300",
          animationClasses[animation],
          color
        )} 
      />
    </div>
  );
};
