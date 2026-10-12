import { useEffect, useState } from "react";
import { CheckCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaymentSuccessAnimationProps {
  show: boolean;
  onComplete?: () => void;
  amount?: number;
  mentorName?: string;
}

export const PaymentSuccessAnimation = ({ 
  show, 
  onComplete, 
  amount, 
  mentorName 
}: PaymentSuccessAnimationProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (show) {
      setMounted(true);
      const timer = setTimeout(() => {
        onComplete?.();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show && !mounted) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm",
        "transition-opacity duration-300",
        show ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
    >
      <div className="relative">
        {/* Sparkle effects */}
        <Sparkles className="absolute -top-8 -left-8 h-6 w-6 text-yellow-400 animate-float" />
        <Sparkles className="absolute -top-4 -right-8 h-5 w-5 text-emerald-400 animate-float" style={{ animationDelay: "0.5s" }} />
        <Sparkles className="absolute -bottom-8 -left-4 h-4 w-4 text-primary animate-float" style={{ animationDelay: "1s" }} />
        <Sparkles className="absolute -bottom-4 -right-4 h-6 w-6 text-green-400 animate-float" style={{ animationDelay: "0.3s" }} />

        {/* Main content */}
        <div className={cn(
          "flex flex-col items-center gap-6 p-8 rounded-2xl",
          "bg-gradient-to-br from-background to-success/5",
          "border-2 border-success/20 shadow-2xl",
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

          {/* Success message */}
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-foreground animate-fade-in-up">
              Payment Successful!
            </h2>
            {amount && (
              <p className="text-xl font-semibold text-success animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
                ₹{amount}
              </p>
            )}
            {mentorName && (
              <p className="text-muted-foreground animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
                Session with {mentorName} confirmed
              </p>
            )}
            <p className="text-sm text-muted-foreground animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
              Redirecting to your bookings...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
