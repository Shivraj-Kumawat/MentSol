import { Star, ShieldCheck, ThumbsUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { safeFormatDistanceToNow } from "@/utils/safeDate";
import { cn } from "@/lib/utils";

interface ReviewCardProps {
  studentName: string;
  studentAvatar?: string | null;
  rating: number;
  reviewText?: string | null;
  createdAt: string;
  verified?: boolean;
  tags?: string[];
  className?: string;
}

export const ReviewCard = ({
  studentName,
  studentAvatar,
  rating,
  reviewText,
  createdAt,
  verified = true,
  tags = [],
  className,
}: ReviewCardProps) => {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card
      className={cn(
        "relative overflow-hidden",
        "border-2 transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
        rating >= 4
          ? "border-primary/20 bg-gradient-to-br from-background to-primary/5"
          : "border-border bg-card",
        className
      )}
    >
      <CardContent className="pt-6">
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          <Avatar className="h-12 w-12 border-2 border-primary/20">
            <AvatarImage src={studentAvatar || undefined} alt={studentName} />
            <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground">
              {getInitials(studentName)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-foreground truncate">
                {studentName}
              </h4>
              {verified && (
                <ShieldCheck className="h-4 w-4 text-success flex-shrink-0" />
              )}
            </div>

            {/* Star Rating */}
            <div className="flex items-center gap-2 mb-2">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "h-4 w-4",
                      i < rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground"
                    )}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                {safeFormatDistanceToNow(createdAt)}
              </span>
            </div>

            {/* Quick Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="text-xs px-2 py-0.5"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Review Text */}
        {reviewText && (
          <p className="text-sm text-foreground leading-relaxed mb-3 pl-16">
            "{reviewText}"
          </p>
        )}

        {/* Verified Purchase Badge */}
        {verified && (
          <div className="flex items-center gap-2 text-xs text-success pl-16">
            <ShieldCheck className="h-3 w-3" />
            <span>Verified Session</span>
          </div>
        )}

        {/* Helpful Section (Optional) */}
        {/* <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border pl-16">
          <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <ThumbsUp className="h-3 w-3" />
            <span>Helpful (0)</span>
          </button>
        </div> */}
      </CardContent>

      {/* Rating Badge */}
      {rating === 5 && (
        <div className="absolute top-2 right-2">
          <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 shadow-lg">
            ⭐ Top Review
          </Badge>
        </div>
      )}
    </Card>
  );
};
