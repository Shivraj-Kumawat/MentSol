import { cn } from "@/lib/utils";

interface SparkleEffectProps {
  className?: string;
  count?: number;
}

export const SparkleEffect = ({ className, count = 3 }: SparkleEffectProps) => {
  return (
    <div className={cn("absolute inset-0 pointer-events-none overflow-hidden", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-primary rounded-full animate-sparkle"
          style={{
            top: `${20 + Math.random() * 60}%`,
            left: `${20 + Math.random() * 60}%`,
            animationDelay: `${i * 0.5}s`,
            animationDuration: `${1.5 + Math.random()}s`
          }}
        />
      ))}
    </div>
  );
};
