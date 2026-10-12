import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Video, Star, Award, CheckCircle, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface TimelineEvent {
  id: string;
  type: "session" | "review" | "achievement" | "joined";
  title: string;
  description: string;
  timestamp: Date;
  icon: React.ElementType;
  color: string;
}

interface ActivityTimelineProps {
  events: TimelineEvent[];
  className?: string;
}

export const ActivityTimeline = ({ events, className }: ActivityTimelineProps) => {
  if (events.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No activity yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Your journey starts here!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-4">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />
          
          {events.map((event, index) => {
            const Icon = event.icon;
            return (
              <div
                key={event.id}
                className={cn(
                  "relative flex gap-4 animate-fade-in-up opacity-0",
                  `stagger-${index + 1}`
                )}
              >
                {/* Icon */}
                <div className="relative z-10">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center",
                      "bg-gradient-to-br shadow-lg",
                      event.color
                    )}
                  >
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 pb-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="font-semibold text-foreground">
                      {event.title}
                    </h4>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(event.timestamp, { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {event.description}
                  </p>
                  <Badge
                    variant="outline"
                    className="mt-2 text-xs"
                  >
                    {event.type}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

// Helper function to create timeline events
export const createTimelineEvent = (
  id: string,
  type: TimelineEvent["type"],
  title: string,
  description: string,
  timestamp: Date
): TimelineEvent => {
  const eventConfig = {
    session: {
      icon: Video,
      color: "from-primary to-accent",
    },
    review: {
      icon: Star,
      color: "from-yellow-500 to-orange-500",
    },
    achievement: {
      icon: Award,
      color: "from-purple-500 to-pink-500",
    },
    joined: {
      icon: CheckCircle,
      color: "from-green-500 to-emerald-500",
    },
  };

  const config = eventConfig[type];

  return {
    id,
    type,
    title,
    description,
    timestamp,
    icon: config.icon,
    color: config.color,
  };
};
