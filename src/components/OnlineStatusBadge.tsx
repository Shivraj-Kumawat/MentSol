import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface OnlineStatusBadgeProps {
  isOnline: boolean;
  variant?: 'absolute' | 'inline';
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const OnlineStatusBadge = ({ 
  isOnline, 
  variant = 'absolute',
  size = 'md',
  showText = false
}: OnlineStatusBadgeProps) => {
  if (!isOnline) return null;

  const sizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4'
  };

  if (variant === 'absolute') {
    return (
      <div className={cn(
        "absolute bottom-0 right-0 rounded-full border-2 border-background bg-green-500",
        sizeClasses[size]
      )}>
        <div className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75" />
      </div>
    );
  }

  return (
    <Badge 
      variant="secondary" 
      className="bg-green-500/10 text-green-600 border-green-500/20 gap-1.5 text-xs"
    >
      <span className={cn("rounded-full bg-green-500", sizeClasses[size])} />
      {showText && "Online"}
    </Badge>
  );
};
