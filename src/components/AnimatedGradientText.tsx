import { cn } from "@/lib/utils";

interface AnimatedGradientTextProps {
  children: React.ReactNode;
  className?: string;
  gradient?: "teal" | "purple" | "rainbow" | "gold";
}

export const AnimatedGradientText = ({ 
  children, 
  className,
  gradient = "teal"
}: AnimatedGradientTextProps) => {
  const gradientStyles = {
    teal: "from-primary via-accent to-primary",
    purple: "from-purple-500 via-pink-500 to-purple-500",
    rainbow: "from-primary via-purple-500 to-orange-500",
    gold: "from-amber-400 via-yellow-300 to-amber-400",
  };

  return (
    <span 
      className={cn(
        "inline-block bg-gradient-to-r bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]",
        gradientStyles[gradient],
        className
      )}
    >
      {children}
    </span>
  );
};
