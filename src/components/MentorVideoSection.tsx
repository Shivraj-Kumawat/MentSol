import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Video as VideoIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MentorVideoSectionProps {
  videoUrl?: string | null;
  thumbnailUrl?: string | null;
  mentorName: string;
  className?: string;
}

export const MentorVideoSection = ({
  videoUrl,
  thumbnailUrl,
  mentorName,
  className
}: MentorVideoSectionProps) => {
  if (!videoUrl) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <div className="relative aspect-video bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
              <VideoIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">No Introduction Video</p>
              <p className="text-xs text-muted-foreground mt-1">
                {mentorName} hasn't added a video yet
              </p>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden group cursor-pointer", className)}>
      <div className="relative aspect-video">
        {/* Thumbnail or gradient background */}
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={`${mentorName}'s introduction`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20" />
        )}

        {/* Play button overlay */}
        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors flex items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-primary/90 group-hover:bg-primary group-hover:scale-110 transition-all duration-300 flex items-center justify-center shadow-xl">
            <Play className="h-10 w-10 text-white ml-1" fill="white" />
          </div>
        </div>

        {/* Badge */}
        <div className="absolute top-4 left-4">
          <Badge className="bg-black/60 text-white backdrop-blur-sm">
            <VideoIcon className="h-3 w-3 mr-1" />
            Introduction Video
          </Badge>
        </div>

        {/* Duration badge (optional) */}
        <div className="absolute bottom-4 right-4">
          <Badge className="bg-black/80 text-white backdrop-blur-sm">
            2:30
          </Badge>
        </div>
      </div>
    </Card>
  );
};
