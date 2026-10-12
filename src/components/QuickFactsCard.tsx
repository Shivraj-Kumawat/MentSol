import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickFact {
  icon: LucideIcon;
  label: string;
  value: string | number;
  color: string;
}

interface QuickFactsCardProps {
  facts: QuickFact[];
  className?: string;
}

export const QuickFactsCard = ({ facts, className }: QuickFactsCardProps) => {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">Quick Facts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {facts.map((fact, index) => {
            const Icon = fact.icon;
            return (
              <div
                key={index}
                className={cn(
                  "p-4 rounded-xl border transition-all duration-300 hover:scale-105",
                  "bg-gradient-to-br",
                  fact.color
                )}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-background/50 backdrop-blur-sm">
                    <Icon className="h-4 w-4 text-foreground" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-foreground mb-1">
                  {fact.value}
                </div>
                <div className="text-xs text-muted-foreground">
                  {fact.label}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
