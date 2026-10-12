import { Award, Star, Trophy, Target, Zap, Heart, Users, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Achievement {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  earned: boolean;
  color: string;
  rarity: "common" | "rare" | "epic" | "legendary";
}

interface AchievementBadgesProps {
  totalSessions?: number;
  rating?: number;
  className?: string;
}

export const AchievementBadges = ({ 
  totalSessions = 0, 
  rating = 0,
  className 
}: AchievementBadgesProps) => {
  const achievements: Achievement[] = [
    {
      id: "first_session",
      icon: Zap,
      title: "First Step",
      description: "Completed your first session",
      earned: totalSessions >= 1,
      color: "from-yellow-500 to-orange-500",
      rarity: "common"
    },
    {
      id: "five_sessions",
      icon: Target,
      title: "Getting Started",
      description: "Completed 5 sessions",
      earned: totalSessions >= 5,
      color: "from-blue-500 to-cyan-500",
      rarity: "common"
    },
    {
      id: "ten_sessions",
      icon: Star,
      title: "Rising Star",
      description: "Completed 10 sessions",
      earned: totalSessions >= 10,
      color: "from-purple-500 to-pink-500",
      rarity: "rare"
    },
    {
      id: "high_rating",
      icon: Award,
      title: "Excellence",
      description: "Achieved 4.5+ rating",
      earned: rating >= 4.5,
      color: "from-green-500 to-emerald-500",
      rarity: "epic"
    },
    {
      id: "fifty_sessions",
      icon: Trophy,
      title: "Expert Mentor",
      description: "Completed 50 sessions",
      earned: totalSessions >= 50,
      color: "from-amber-500 to-yellow-500",
      rarity: "legendary"
    },
    {
      id: "hundred_sessions",
      icon: Users,
      title: "Legend",
      description: "Completed 100 sessions",
      earned: totalSessions >= 100,
      color: "from-red-500 to-pink-500",
      rarity: "legendary"
    }
  ];

  const earnedCount = achievements.filter(a => a.earned).length;

  const getRarityStyle = (rarity: string) => {
    switch (rarity) {
      case "common": return "border-gray-400";
      case "rare": return "border-blue-500";
      case "epic": return "border-purple-500";
      case "legendary": return "border-amber-500";
      default: return "border-border";
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Achievements
          </span>
          <Badge variant="secondary">{earnedCount}/{achievements.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {achievements.map((achievement) => {
            const Icon = achievement.icon;
            return (
              <div
                key={achievement.id}
                className={cn(
                  "relative flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-300",
                  achievement.earned
                    ? `${getRarityStyle(achievement.rarity)} bg-gradient-to-br ${achievement.color}/10 hover:scale-105`
                    : "border-border/50 bg-muted/30 opacity-50 grayscale"
                )}
              >
                <div
                  className={cn(
                    "p-3 rounded-full mb-2 transition-all duration-300",
                    achievement.earned
                      ? `bg-gradient-to-br ${achievement.color} shadow-lg`
                      : "bg-muted"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-6 w-6",
                      achievement.earned ? "text-white" : "text-muted-foreground"
                    )}
                  />
                </div>
                <h4 className="text-xs font-semibold text-center mb-1 text-foreground">
                  {achievement.title}
                </h4>
                <p className="text-[10px] text-center text-muted-foreground line-clamp-2">
                  {achievement.description}
                </p>
                {achievement.earned && (
                  <div className="absolute -top-1 -right-1">
                    <div className="relative">
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400 animate-pulse" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
