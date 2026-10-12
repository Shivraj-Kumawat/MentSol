import { cn } from "@/lib/utils";
import { useDevicePerformance } from "@/hooks/useDevicePerformance";
import { useMemo } from "react";

interface FloatingOrbsProps {
  variant?: "auth" | "hero" | "subtle" | "minimal";
  className?: string;
}

export const FloatingOrbs = ({ variant = "auth", className }: FloatingOrbsProps) => {
  const { isLowPerformance, isMobile, prefersReducedMotion } = useDevicePerformance();

  // IMPORTANT: All hooks must be called before any early returns to maintain stable hook order
  const orbConfigs = useMemo(() => {
    // Simplified orbs for low performance devices
    if (isLowPerformance) {
      return {
        auth: [
          { size: "w-[300px] h-[300px]", position: "top-[-100px] left-[-100px]", color: "from-primary/20 to-accent/10", delay: "0s" },
          { size: "w-[250px] h-[250px]", position: "bottom-[-50px] right-[-50px]", color: "from-purple-500/15 to-pink-500/10", delay: "0s" },
        ],
        hero: [
          { size: "w-[350px] h-[350px]", position: "top-[-150px] left-[-100px]", color: "from-primary/15 to-transparent", delay: "0s" },
          { size: "w-[300px] h-[300px]", position: "bottom-[-100px] right-[-100px]", color: "from-accent/15 to-transparent", delay: "0s" },
        ],
        subtle: [
          { size: "w-[200px] h-[200px]", position: "top-[-50px] right-[-50px]", color: "from-primary/10 to-transparent", delay: "0s" },
        ],
        minimal: [
          { size: "w-[150px] h-[150px]", position: "top-[-30px] right-[-30px]", color: "from-primary/8 to-transparent", delay: "0s" },
        ],
      };
    }

    // Standard configs for desktop/high-performance devices
    return {
      auth: [
        { size: "w-[500px] h-[500px]", position: "top-[-200px] left-[-200px]", color: "from-primary/30 to-accent/20", delay: "0s" },
        { size: "w-[400px] h-[400px]", position: "top-[200px] right-[-150px]", color: "from-purple-500/20 to-pink-500/15", delay: "2s" },
        { size: "w-[300px] h-[300px]", position: "bottom-[-100px] left-[20%]", color: "from-accent/25 to-primary/15", delay: "4s" },
        { size: "w-[350px] h-[350px]", position: "bottom-[100px] right-[10%]", color: "from-orange-500/15 to-amber-500/10", delay: "1s" },
      ],
      hero: [
        { size: "w-[600px] h-[600px]", position: "top-[-300px] left-[-200px]", color: "from-primary/25 to-transparent", delay: "0s" },
        { size: "w-[500px] h-[500px]", position: "top-[100px] right-[-250px]", color: "from-accent/20 to-purple-500/10", delay: "3s" },
        { size: "w-[400px] h-[400px]", position: "bottom-[-200px] left-[30%]", color: "from-orange-500/15 to-transparent", delay: "1.5s" },
      ],
      subtle: [
        { size: "w-[300px] h-[300px]", position: "top-[-100px] right-[-100px]", color: "from-primary/15 to-transparent", delay: "0s" },
        { size: "w-[250px] h-[250px]", position: "bottom-[-50px] left-[-50px]", color: "from-accent/10 to-transparent", delay: "2s" },
      ],
      minimal: [
        { size: "w-[200px] h-[200px]", position: "top-[-50px] right-[-50px]", color: "from-primary/10 to-transparent", delay: "0s" },
        { size: "w-[180px] h-[180px]", position: "bottom-[-40px] left-[-40px]", color: "from-accent/8 to-transparent", delay: "2s" },
      ],
    };
  }, [isLowPerformance]);

  // All derived values computed after hooks
  const orbs = orbConfigs[variant];
  const particleCount = isLowPerformance ? 0 : isMobile ? 3 : 8;
  const blurClass = isLowPerformance ? "blur-xl" : "blur-3xl";

  // Early return AFTER all hooks have been called
  if (prefersReducedMotion) return null;

  return (
    <div className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}>
      {orbs.map((orb, index) => (
        <div
          key={index}
          className={cn(
            "absolute rounded-full",
            blurClass,
            // Only animate on high-performance devices
            !isLowPerformance && "animate-float-slow",
            "bg-gradient-to-br",
            orb.size,
            orb.position,
            orb.color,
            // GPU acceleration
            "transform-gpu will-change-transform"
          )}
          style={{ 
            animationDelay: isLowPerformance ? "0s" : orb.delay,
            transform: 'translateZ(0)',
          }}
        />
      ))}
      
      {/* Floating particles - disabled on low performance */}
      {variant !== "subtle" && particleCount > 0 && (
        <>
          {[...Array(particleCount)].map((_, i) => (
            <div
              key={`particle-${i}`}
              className="absolute w-2 h-2 bg-primary/40 rounded-full animate-float-particle transform-gpu"
              style={{
                left: `${10 + i * 12}%`,
                top: `${15 + (i % 4) * 20}%`,
                animationDelay: `${i * 0.7}s`,
                animationDuration: `${4 + (i % 3)}s`,
                transform: 'translateZ(0)',
              }}
            />
          ))}
        </>
      )}
      
      {/* Grid pattern overlay - simplified on mobile */}
      {!isLowPerformance && (
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,169,157,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,169,157,0.03)_1px,transparent_1px)] bg-[size:50px_50px] opacity-50" />
      )}
    </div>
  );
};
