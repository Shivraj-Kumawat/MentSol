import { LucideIcon } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { EntranceAnimation } from "./motion/EntranceAnimation";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className
}: EmptyStateProps) => {
  return (
    <EntranceAnimation direction="up" distance={8}>
      <div className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}>
        <div className="relative mb-6">
          <div className="absolute inset-0 animate-pulse-slow bg-primary/10 rounded-full blur-2xl" />
          <div className="relative p-6 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 animate-float-gentle">
            <Icon className="h-16 w-16 text-primary" strokeWidth={1.5} />
          </div>
        </div>
        
        <h3 className="text-2xl font-bold text-foreground mb-2">
          {title}
        </h3>
        
        <p className="text-muted-foreground max-w-md mb-6">
          {description}
        </p>
        
        {actionLabel && onAction && (
          <Button
            onClick={onAction}
            size="lg"
            className="animate-button-press"
          >
            {actionLabel}
          </Button>
        )}
      </div>
    </EntranceAnimation>
  );
};
