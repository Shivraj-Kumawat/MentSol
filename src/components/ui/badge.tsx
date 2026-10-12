import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-200",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-sm",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm",
        success: "border-transparent bg-success/10 text-success border-success/20 hover:bg-success/20",
        warning: "border-transparent bg-warning/10 text-warning border-warning/20 hover:bg-warning/20",
        info: "border-transparent bg-info/10 text-info border-info/20 hover:bg-info/20",
        outline: "text-foreground hover:bg-accent",
        premium: "border-transparent bg-gradient-to-r from-primary/10 to-accent/10 text-primary border-primary/20",
        verified: "border-transparent bg-success/10 text-success border-success/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
