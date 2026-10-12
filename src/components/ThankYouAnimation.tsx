import { useEffect, useState } from "react";
import { CheckCircle, Sparkles, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThankYouAnimationProps {
  show: boolean;
  onComplete?: () => void;
}

export const ThankYouAnimation = ({ show, onComplete }: ThankYouAnimationProps) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onComplete?.();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  // CRITICAL FIX: Return null when not showing to prevent overlay from blocking clicks
  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-sm"
      style={{ 
        pointerEvents: 'auto',
        touchAction: 'none'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="relative">
        {/* Sparkle effects */}
        <Sparkles className="absolute -top-8 -left-8 h-6 w-6 text-yellow-400 animate-float" />
        <Sparkles className="absolute -top-4 -right-8 h-5 w-5 text-pink-400 animate-float" style={{ animationDelay: "0.5s" }} />
        <Sparkles className="absolute -bottom-8 -left-4 h-4 w-4 text-primary animate-float" style={{ animationDelay: "1s" }} />
        <Sparkles className="absolute -bottom-4 -right-4 h-6 w-6 text-purple-400 animate-float" style={{ animationDelay: "0.3s" }} />

        {/* Main content */}
        <div className={cn(
          "flex flex-col items-center gap-6 p-8 rounded-2xl",
          "bg-gradient-to-br from-background to-primary/5",
          "border-2 border-primary/20 shadow-2xl",
          show ? "animate-scale-in" : ""
        )}>
          {/* Success Icon */}
          <div className="relative">
            <div className="absolute inset-0 bg-success/20 rounded-full blur-2xl animate-pulse-slow" />
            <div className={cn(
              "relative w-20 h-20 rounded-full",
              "bg-gradient-to-br from-success to-green-600",
              "flex items-center justify-center",
              "shadow-xl animate-glow-pulse"
            )}>
              <CheckCircle className="h-12 w-12 text-white" />
            </div>
          </div>

          {/* Thank you message */}
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-foreground animate-fade-in-up">
              Thank You!
            </h2>
            <p className="text-muted-foreground animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
              Your feedback helps us improve
            </p>
          </div>

          {/* Hearts animation */}
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <Heart
                key={i}
                className={cn(
                  "h-6 w-6 fill-pink-500 text-pink-500 animate-float"
                )}
                style={{
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: "2s"
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
