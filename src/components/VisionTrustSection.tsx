import { Heart, Shield, Users, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface VisionTrustSectionProps {
  className?: string;
  variant?: "full" | "compact";
}

export const VisionTrustSection = ({ className, variant = "full" }: VisionTrustSectionProps) => {
  return (
    <div className={cn("text-center", className)}>
      {/* Main Heading */}
      <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4 leading-tight">
        Built for Students.{" "}
        <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Powered by Mentors.
        </span>{" "}
        Driven by Trust.
      </h2>

      {/* Subtext */}
      {variant === "full" && (
        <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto mb-6 leading-relaxed">
          MentSol is an early-stage mentorship platform focused on meaningful, 1-to-1 guidance for students. 
          We believe trust is built through real impact — not fake numbers. 
          Every mentor is verified, every session is intentional, and every feature is designed to genuinely help learners grow.
        </p>
      )}

      {/* Trust Indicators */}
      <div className="flex flex-wrap justify-center gap-3 mb-6">
        {[
          { icon: Shield, label: "Verified Mentors", color: "text-primary" },
          { icon: Heart, label: "Intentional Sessions", color: "text-rose-500" },
          { icon: Users, label: "1-to-1 Guidance", color: "text-emerald-500" },
        ].map((item, index) => (
          <div
            key={item.label}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full",
              "bg-background/80 backdrop-blur-sm border border-border/50",
              "animate-fade-in-up opacity-0"
            )}
            style={{ animationDelay: `${index * 100}ms`, animationFillMode: "both" }}
          >
            <item.icon className={cn("h-4 w-4", item.color)} />
            <span className="text-xs font-medium text-foreground">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Journey Note */}
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/5 border border-primary/20">
        <Sparkles className="h-4 w-4 text-primary animate-twinkle" />
        <p className="text-xs text-muted-foreground">
          Our journey has just begun — and you're invited to be part of it.
        </p>
      </div>
    </div>
  );
};
