import { useState, useEffect } from "react";
import { Star, Smile, Frown, Meh, Heart, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnimatedStarRatingProps {
  rating: number;
  hoveredRating: number;
  onRatingChange: (rating: number) => void;
  onHoverChange: (rating: number) => void;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const ratingEmojis = {
  1: { icon: Frown, label: "Poor", color: "text-red-500" },
  2: { icon: Meh, label: "Fair", color: "text-orange-500" },
  3: { icon: Smile, label: "Good", color: "text-yellow-500" },
  4: { icon: Heart, label: "Very Good", color: "text-pink-500" },
  5: { icon: ThumbsUp, label: "Excellent", color: "text-green-500" },
};

export const AnimatedStarRating = ({
  rating,
  hoveredRating,
  onRatingChange,
  onHoverChange,
  size = "md",
  className,
}: AnimatedStarRatingProps) => {
  // Detect touch device to disable hover on mobile
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    const checkTouch = () => {
      setIsTouchDevice(
        window.matchMedia("(pointer: coarse)").matches ||
        "ontouchstart" in window
      );
    };
    checkTouch();
    // No need for listener - check once on mount
  }, []);

  // On touch devices, ignore hoveredRating to prevent jitter
  const activeRating = isTouchDevice ? rating : (hoveredRating || rating);
  const currentEmoji = activeRating > 0 ? ratingEmojis[activeRating as keyof typeof ratingEmojis] : null;
  const EmojiIcon = currentEmoji?.icon;

  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-12 w-12",
    lg: "h-16 w-16",
  };

  // Handle hover only on non-touch devices
  const handleMouseEnter = (star: number) => {
    if (!isTouchDevice) {
      onHoverChange(star);
    }
  };

  const handleMouseLeave = () => {
    if (!isTouchDevice) {
      onHoverChange(0);
    }
  };

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      {/* Emoji Display - no pulse animation */}
      {EmojiIcon && (
        <div className="animate-scale-in">
          <div className={cn(
            "p-4 rounded-full bg-gradient-to-br border-2",
            activeRating === 5 ? "from-green-500/20 to-emerald-500/20 border-green-500/30" :
            activeRating === 4 ? "from-pink-500/20 to-rose-500/20 border-pink-500/30" :
            activeRating === 3 ? "from-yellow-500/20 to-amber-500/20 border-yellow-500/30" :
            activeRating === 2 ? "from-orange-500/20 to-red-500/20 border-orange-500/30" :
            "from-red-500/20 to-rose-500/20 border-red-500/30"
          )}>
            <EmojiIcon className={cn(sizeClasses[size], currentEmoji.color)} />
          </div>
        </div>
      )}

      {/* Stars - fixed container size to prevent layout shift */}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const isActive = star <= activeRating;
          return (
            <button
              key={star}
              type="button"
              onClick={() => onRatingChange(star)}
              onMouseEnter={() => handleMouseEnter(star)}
              onMouseLeave={handleMouseLeave}
              className="w-12 h-12 inline-flex items-center justify-center"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <Star
                className={cn(
                  "h-10 w-10 transition-colors duration-150",
                  isActive
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-muted-foreground"
                )}
              />
            </button>
          );
        })}
      </div>

      {/* Rating Label */}
      {currentEmoji && (
        <div className="text-center">
          <p className={cn("text-lg font-bold", currentEmoji.color)}>
            {currentEmoji.label}
          </p>
          <p className="text-xs text-muted-foreground">
            {activeRating} out of 5 stars
          </p>
        </div>
      )}
    </div>
  );
};
