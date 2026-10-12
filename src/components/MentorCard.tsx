import { Star, User, Video, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { cn } from "@/lib/utils";

interface MentorCardProps {
  mentor: {
    id: string;
    bio?: string | null;
    specialization?: string | null;
    rating?: number | null;
    total_sessions?: number | null;
    fixed_rate_per_15m?: number | null;
    mentor_types?: string[] | null;
    exams?: string[] | null;
    profiles?: {
      full_name?: string | null;
      avatar_url?: string | null;
    } | null;
  };
  isOnline?: boolean;
  showAvailableNow?: boolean;
  availableSlots?: number;
  compact?: boolean;
  className?: string;
}

// Extract short tags from mentor_types and exams
const getMentorTags = (mentorTypes?: string[] | null, exams?: string[] | null): string[] => {
  const tags: string[] = [];
  const seen = new Set<string>();

  // Extract meaningful short labels from mentor_types paths
  if (mentorTypes) {
    for (const t of mentorTypes) {
      const parts = t.split(' > ');
      const last = parts[parts.length - 1]?.trim();
      if (last && !seen.has(last.toLowerCase())) {
        seen.add(last.toLowerCase());
        tags.push(last);
      }
    }
  }

  // Add exam tags
  if (exams) {
    for (const e of exams) {
      const label = e.trim().toLowerCase();
      if (label && !seen.has(label)) {
        seen.add(label);
        tags.push(e.trim());
      }
    }
  }

  return tags.slice(0, 4); // limit to 4 tags
};

export const MentorCard = ({
  mentor,
  isOnline = false,
  showAvailableNow = false,
  availableSlots = 0,
  compact = false,
  className,
}: MentorCardProps) => {
  const navigate = useNavigate();
  const fullName = mentor.profiles?.full_name || "Mentor";
  const rating = mentor.rating || 0;
  const tags = getMentorTags(mentor.mentor_types, mentor.exams);

  return (
    <Card
      className={cn(
        "p-4 hover:shadow-lg transition-shadow border border-border bg-card",
        className
      )}
    >
      {/* Top row: avatar + name + slot badge */}
      <div className="flex items-start gap-3 mb-3">
        <Avatar className="w-14 h-14 rounded-xl border border-border">
          <AvatarImage
            src={mentor.profiles?.avatar_url || undefined}
            alt={fullName}
            className="object-cover"
          />
          <AvatarFallback className="rounded-xl bg-muted text-muted-foreground font-semibold text-lg">
            {fullName[0]?.toUpperCase() || "M"}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="font-semibold text-foreground text-base truncate">
              {fullName}
            </h3>
            <VerifiedBadge size="sm" showText={false} />
            {showAvailableNow && availableSlots > 0 && (
              <Badge variant="outline" className="text-xs border-accent text-accent-foreground bg-accent/10 ml-auto shrink-0">
                <Calendar className="h-3 w-3 mr-1" />
                {availableSlots} slot{availableSlots !== 1 ? "s" : ""} available
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground truncate">
            {mentor.specialization || "Expert Mentor"}
          </p>
          <div className="flex items-center gap-1 mt-0.5">
            <Star className="h-3.5 w-3.5 fill-warning text-warning" />
            <span className="text-sm font-medium text-foreground">{rating.toFixed(1)}</span>
          </div>
        </div>
      </div>

      {/* Mentor type / exam badges */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="text-xs font-medium rounded-md"
            >
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Bio */}
      {mentor.bio && (
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
          {mentor.bio}
        </p>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1 rounded-lg"
          size="sm"
          onClick={() => navigate(`/mentor/${mentor.id}`)}
        >
          <User className="h-4 w-4 mr-1.5" />
          View Profile
        </Button>
        <Button
          className="flex-1 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
          size="sm"
          onClick={() => navigate(`/mentor/${mentor.id}/book`)}
        >
          Book Now
        </Button>
      </div>
    </Card>
  );
};
