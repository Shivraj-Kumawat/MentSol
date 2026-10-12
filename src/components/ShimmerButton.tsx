import { forwardRef } from 'react';
import { cn } from "@/lib/utils";
import { Button, ButtonProps } from "@/components/ui/button";

interface ShimmerButtonProps extends ButtonProps {
  shimmerColor?: string;
}

export const ShimmerButton = forwardRef<HTMLButtonElement, ShimmerButtonProps>(
  ({ className, children, shimmerColor = "hsla(0, 0%, 100%, 0.3)", ...props }, ref) => {
    return (
      <Button
        ref={ref}
        className={cn(
          "relative overflow-hidden group",
          className
        )}
        {...props}
      >
        {/* Shimmer effect */}
        <div 
          className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"
          style={{
            background: `linear-gradient(90deg, transparent, ${shimmerColor}, transparent)`,
          }}
        />
        
        {/* Content */}
        <span className="relative z-10 flex items-center gap-2">
          {children}
        </span>
      </Button>
    );
  }
);

ShimmerButton.displayName = "ShimmerButton";
