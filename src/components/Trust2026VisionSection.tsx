import { Shield, Heart, Eye, Lock, Users, Sparkles, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Trust2026VisionSectionProps {
  className?: string;
  variant?: "full" | "compact";
}

const trustPrinciples = [
  {
    icon: Shield,
    title: "Verified mentors with real credentials",
    color: "text-primary",
  },
  {
    icon: Eye,
    title: "No fake reviews or inflated metrics",
    color: "text-emerald-500",
  },
  {
    icon: CheckCircle2,
    title: "Clear pricing with no hidden charges",
    color: "text-blue-500",
  },
  {
    icon: Lock,
    title: "Secure payments and data protection",
    color: "text-amber-500",
  },
  {
    icon: Heart,
    title: "Ethical growth — users come before numbers",
    color: "text-rose-500",
  },
];

const visionGoals = [
  "Become the most trusted mentorship platform for students",
  "Ensure every mentor is verified, accountable, and transparent",
  "Protect students' data, privacy, and payments with strict safeguards",
  "Build long-term relationships, not short-term engagement",
];

export const Trust2026VisionSection = ({ 
  className, 
  variant = "full" 
}: Trust2026VisionSectionProps) => {
  return (
    <section className={cn("py-12 px-4", className)}>
      <div className="max-w-4xl mx-auto">
        {/* Main Heading */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Our 2026 Vision</span>
          </div>
          
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-4 leading-tight">
            Trust Before Scale
          </h2>
          
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            At MentSol, growth is not our first goal — <span className="text-foreground font-medium">trust is</span>.
          </p>
        </div>

        {variant === "full" && (
          <>
            {/* Vision Statement */}
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 md:p-8 mb-8">
              <p className="text-muted-foreground text-sm md:text-base leading-relaxed mb-6">
                We believe that a mentorship platform should be built on honesty, safety, and real human impact — not exaggerated numbers.
              </p>
              
              <h3 className="text-lg font-semibold text-foreground mb-4">
                By 2026, our vision is to:
              </h3>
              
              <ul className="space-y-3">
                {visionGoals.map((goal, index) => (
                  <li 
                    key={index}
                    className="flex items-start gap-3 text-sm md:text-base text-muted-foreground"
                  >
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span>{goal}</span>
                  </li>
                ))}
              </ul>
              
              <div className="mt-6 pt-6 border-t border-border/50">
                <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                  <span className="text-foreground font-medium">Scale will follow trust</span> — not the other way around. Our long-term targets include reaching millions of learners and enabling millions of sessions, but only after trust is earned at every step.
                </p>
              </div>
            </div>

            {/* Trust Principles */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-foreground text-center mb-6">
                How We Build Trust
              </h3>
              
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {trustPrinciples.map((principle, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-xl",
                      "bg-background/80 backdrop-blur-sm border border-border/50",
                      "transition-all duration-200 hover:border-primary/30 hover:bg-background"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                      "bg-gradient-to-br from-primary/10 to-primary/5"
                    )}>
                      <principle.icon className={cn("h-5 w-5", principle.color)} />
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {principle.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Transparency Disclaimer */}
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-muted/50 border border-border/30">
                <Users className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs md:text-sm text-muted-foreground">
                  All numbers and milestones mentioned above represent long-term goals and vision, not current platform statistics.
                </p>
              </div>
            </div>
          </>
        )}

        {variant === "compact" && (
          <div className="text-center">
            <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto mb-6 leading-relaxed">
              We believe that a mentorship platform should be built on honesty, safety, and real human impact — not exaggerated numbers. Every mentor is verified, every session is intentional.
            </p>
            
            {/* Compact Trust Indicators */}
            <div className="flex flex-wrap justify-center gap-3">
              {trustPrinciples.slice(0, 3).map((principle, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full",
                    "bg-background/80 backdrop-blur-sm border border-border/50"
                  )}
                >
                  <principle.icon className={cn("h-4 w-4", principle.color)} />
                  <span className="text-xs font-medium text-foreground">
                    {principle.title.split(" ").slice(0, 2).join(" ")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
