import { cn } from "@/lib/utils";
import { useDevicePerformance } from "@/hooks/useDevicePerformance";

interface GlowingOrbProps {
  className?: string;
  color?: "teal" | "purple" | "orange" | "blue";
  size?: "sm" | "md" | "lg" | "xl";
  animate?: boolean;
}

export const GlowingOrb = ({ 
  className,
  color = "teal",
  size = "md",
  animate = true
}: GlowingOrbProps) => {
  const { isLowPerformance, prefersReducedMotion } = useDevicePerformance();

  // IMPORTANT: All computed values defined before early return to maintain stable component structure
  const colorStyles = {
    teal: "bg-gradient-to-br from-primary/40 to-accent/20",
    purple: "bg-gradient-to-br from-purple-500/40 to-pink-500/20",
    orange: "bg-gradient-to-br from-orange-500/40 to-amber-500/20",
    blue: "bg-gradient-to-br from-blue-500/40 to-cyan-500/20",
  };

  // Reduced sizes for low-performance devices
  const sizeStyles = isLowPerformance ? {
    sm: "w-24 h-24",
    md: "w-48 h-48",
    lg: "w-72 h-72",
    xl: "w-[350px] h-[350px]",
  } : {
    sm: "w-32 h-32",
    md: "w-64 h-64",
    lg: "w-96 h-96",
    xl: "w-[500px] h-[500px]",
  };

  // Use lighter blur on low-performance devices
  const blurClass = isLowPerformance ? "blur-xl" : "blur-3xl";

  // Disable animation on low-performance devices
  const shouldAnimate = animate && !isLowPerformance;

  // Early return AFTER all variables are computed (no hooks after this point)
  if (prefersReducedMotion) return null;

  return (
    <div
      className={cn(
        "absolute rounded-full opacity-60 pointer-events-none transform-gpu",
        blurClass,
        colorStyles[color],
        sizeStyles[size],
        shouldAnimate && "animate-pulse-slow",
        className
      )}
      style={{
        willChange: shouldAnimate ? 'opacity' : 'auto',
        transform: 'translateZ(0)',
      }}
    />
  );
};
