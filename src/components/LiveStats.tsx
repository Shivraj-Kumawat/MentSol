import { Shield, Heart, Users, Sparkles, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "./ui/badge";

export const LiveStats = () => {
  return (
    <div className="mt-8 mb-12">
      {/* Vision Header */}
      <div className="text-center mb-6 animate-fade-in">
        <Badge variant="secondary" className="mb-3 text-sm px-4 py-1">
          <Sparkles className="h-3 w-3 mr-1" />
          Our Promise
        </Badge>
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
          Built for Students.{" "}
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Powered by Mentors.
          </span>{" "}
          Driven by Trust.
        </h2>
        <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto">
          MentSol is an early-stage mentorship platform focused on meaningful, 1-to-1 guidance. 
          We believe trust is built through real impact — not fake numbers.
        </p>
      </div>

      {/* Sessions Done Counter */}
      <div className="flex justify-center mb-6">
        <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
          <CheckCircle className="h-6 w-6 text-primary" />
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">250+ Sessions</p>
            <p className="text-xs text-muted-foreground">Done & Counting</p>
          </div>
        </div>
      </div>

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
      <p className="text-center text-sm text-muted-foreground animate-fade-in">
        Our journey has just begun — and you're invited to be part of it.
      </p>
    </div>
  );
};
