import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileSection {
  label: string;
  completed: boolean;
}

interface ProfileProgressProps {
  sections: ProfileSection[];
  className?: string;
}

export const ProfileProgress = ({ sections, className }: ProfileProgressProps) => {
  const completedCount = sections.filter(s => s.completed).length;
  const totalCount = sections.length;
  const percentage = Math.round((completedCount / totalCount) * 100);

  return (
    <Card className={cn("border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5", className)}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">Profile Completion</h3>
          <span className="text-2xl font-bold text-primary">{percentage}%</span>
        </div>
        
        <Progress value={percentage} className="h-2 mb-4" />
        
        <div className="space-y-2">
          {sections.map((section, index) => (
            <div
              key={index}
              className="flex items-center gap-2 text-sm"
            >
              {section.completed ? (
                <CheckCircle2 className="h-4 w-4 text-success" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground" />
              )}
              <span className={cn(
                section.completed ? "text-foreground" : "text-muted-foreground"
              )}>
                {section.label}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
