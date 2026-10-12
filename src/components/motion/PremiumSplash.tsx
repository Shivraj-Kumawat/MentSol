import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";
import { useDevicePerformance } from "@/hooks/useDevicePerformance";

interface PremiumSplashProps {
  children: React.ReactNode;
  duration?: number;
}

/**
 * PremiumSplash - Enhanced splash screen with orbital animation
 * Features:
 * - Elegant logo scale animation (0.9 → 1.0)
 * - Thin animated orbital lines
 * - Refined gradient background
 * - Premium tagline with fade-in
 * - Auto-dismiss (no user interaction)
 */
export const PremiumSplash = ({ children, duration = 1800 }: PremiumSplashProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [shouldRender, setShouldRender] = useState(true);
  const { prefersReducedMotion } = useDevicePerformance();
  
  const tagline = "Learn from the ones who've lived it";

  useEffect(() => {
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
    }, duration);

    const removeTimer = setTimeout(() => {
      setShouldRender(false);
    }, duration + 500);

    return () => {
      clearTimeout(hideTimer);
      clearTimeout(removeTimer);
    };
  }, [duration]);

  // If reduced motion, skip splash entirely
  if (prefersReducedMotion && !shouldRender) {
    return <>{children}</>;
  }

  return (
    <>
      {shouldRender && (
        <div
          className={cn(
            "fixed inset-0 z-[100] flex flex-col items-center justify-center",
            "bg-gradient-to-br from-background via-background to-primary/5",
            "transition-all duration-500 ease-out",
            isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
          style={{ 
            pointerEvents: isVisible ? 'auto' : 'none',
          }}
        >
          {/* Animated background orbs */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/8 rounded-full blur-3xl animate-pulse-slow" />
            <div className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-accent/8 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
          </div>
          
          <div className="relative z-10 flex flex-col items-center gap-6">
            {/* Logo with orbital lines */}
            <div className="relative w-32 h-32 flex items-center justify-center">
              {/* Orbital lines */}
              {!prefersReducedMotion && (
                <>
                  {/* Outer orbital */}
                  <div className="absolute inset-0 animate-orbital">
                    <div 
                      className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-gradient-to-br from-primary/60 to-primary/20"
                      style={{ 
                        boxShadow: '0 0 10px hsl(176 100% 40% / 0.4)' 
                      }}
                    />
                  </div>
                  
                  {/* Middle orbital */}
                  <div 
                    className="absolute animate-orbital-reverse"
                    style={{
                      inset: '12px',
                    }}
                  >
                    <div 
                      className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-gradient-to-br from-accent/60 to-accent/20"
                      style={{ 
                        boxShadow: '0 0 8px hsl(176 100% 40% / 0.3)' 
                      }}
                    />
                  </div>
                  
                  {/* Inner orbital */}
                  <div 
                    className="absolute animate-orbital-slow"
                    style={{
                      inset: '24px',
                    }}
                  >
                    <div 
                      className="absolute top-0 right-1/4 w-1.5 h-1.5 rounded-full bg-primary/40"
                    />
                  </div>
                  
                  {/* Orbital ring lines (very subtle) */}
                  <div 
                    className="absolute inset-0 rounded-full border border-primary/10 animate-orbital"
                    style={{ animationDuration: '25s' }}
                  />
                  <div 
                    className="absolute rounded-full border border-accent/8 animate-orbital-reverse"
                    style={{ inset: '10px', animationDuration: '18s' }}
                  />
                </>
              )}
              
              {/* Logo container */}
              <div 
                className={cn(
                  "w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/70",
                  "flex items-center justify-center relative z-10",
                  "transform-gpu",
                  !prefersReducedMotion && "animate-logo-glow"
                )}
                style={{
                  animation: !prefersReducedMotion ? 'logo-scale-in 0.8s ease-out forwards, logo-glow-pulse 2s ease-in-out infinite 0.8s' : undefined,
                }}
              >
                <span className="text-3xl font-bold text-primary-foreground">M</span>
                {!prefersReducedMotion && (
                  <Sparkles className="absolute -top-1.5 -right-1.5 w-5 h-5 text-primary drop-shadow-glow animate-pulse" />
                )}
              </div>
            </div>
            
            {/* Brand name */}
            <h1 
              className={cn(
                "text-3xl font-bold bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent",
                !prefersReducedMotion && "calm-entrance"
              )}
              style={{ animationDelay: '0.2s' }}
            >
              MentSol
            </h1>
            
            {/* Loading indicator */}
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "w-1.5 h-1.5 bg-primary rounded-full",
                    !prefersReducedMotion && "animate-bounce"
                  )}
                  style={{ animationDelay: `${i * 0.12}s` }}
                />
              ))}
            </div>
            
            {/* Tagline */}
            <p 
              className={cn(
                "text-base font-medium text-muted-foreground text-center px-8",
                !prefersReducedMotion && "calm-entrance"
              )}
              style={{ animationDelay: '0.4s' }}
            >
              {tagline}
            </p>
          </div>
        </div>
      )}
      {children}
    </>
  );
};

// CSS keyframes moved to src/index.css - no module-level DOM manipulation

export default PremiumSplash;
