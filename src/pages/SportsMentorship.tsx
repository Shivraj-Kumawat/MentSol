import { useNavigate } from "react-router-dom";
import { ArrowLeft, Trophy, Medal, Award, Target } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const sports = [
  {
    id: 'cricket',
    title: 'Cricket',
    emoji: '🏏',
    description: 'Ranji, Vijay Hazare, IPL & more',
    color: 'from-blue-600 to-indigo-700',
    popular: true,
    categories: 7
  },
  {
    id: 'football',
    title: 'Football',
    emoji: '⚽',
    description: 'ISL, I-League, Santosh Trophy',
    color: 'from-green-600 to-emerald-700',
    popular: true,
    categories: 6
  },
  {
    id: 'badminton',
    title: 'Badminton',
    emoji: '🏸',
    description: 'Nationals, PBL, International',
    color: 'from-red-600 to-orange-700',
    popular: true,
    categories: 6
  },
  {
    id: 'hockey',
    title: 'Hockey',
    emoji: '🏑',
    description: 'HIL, Nationals, Nehru Trophy',
    color: 'from-yellow-600 to-amber-700',
    categories: 6
  },
  {
    id: 'kabaddi',
    title: 'Kabaddi',
    emoji: '🤼',
    description: 'Pro Kabaddi, Nationals',
    color: 'from-orange-600 to-red-700',
    categories: 6
  },
  {
    id: 'tennis',
    title: 'Tennis',
    emoji: '🎾',
    description: 'Nationals, AITA, Davis Cup',
    color: 'from-purple-600 to-violet-700',
    categories: 6
  },
  {
    id: 'wrestling',
    title: 'Wrestling',
    emoji: '🤼‍♂️',
    description: 'Nationals, Khel India, PWL',
    color: 'from-pink-600 to-rose-700',
    categories: 6
  }
];

const SportsMentorship = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center gap-3 p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/home", { replace: true })}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Sports Mentorship</h1>
            <p className="text-sm text-muted-foreground">India's Top 7 Sports</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Info Card */}
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Medal className="h-5 w-5 text-primary" />
              Why Choose Our Sports Mentors?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-2">
              <Award className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Proven Coaches:</strong> Students competed at District, State & National levels
              </p>
            </div>
            <div className="flex items-start gap-2">
              <Trophy className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Tournament Players:</strong> Competed in prestigious leagues like Ranji, IPL, ISL, Pro Kabaddi
              </p>
            </div>
            <div className="flex items-start gap-2">
              <Target className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Personalized Training:</strong> One-on-one guidance tailored to your goals
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Sports Grid */}
        <div className="grid gap-4">
          {sports.map((sport) => (
            <Card
              key={sport.id}
              onClick={() => navigate(`/sports-mentorship/${sport.id}`)}
              className="cursor-pointer hover:shadow-lg transition-all group overflow-hidden"
            >
              <div className={`h-2 bg-gradient-to-r ${sport.color}`} />
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-4xl">{sport.emoji}</div>
                    <div>
                      <CardTitle className="flex items-center gap-2 mb-1">
                        {sport.title}
                        {sport.popular && (
                          <Badge variant="secondary" className="text-xs">
                            Popular
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>{sport.description}</CardDescription>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-muted-foreground">
                      {sport.categories}
                    </div>
                    <div className="text-xs text-muted-foreground">categories</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Button 
                  className={`w-full bg-gradient-to-r ${sport.color} text-white hover:opacity-90 transition-opacity`}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/sports-mentorship/${sport.id}`);
                  }}
                >
                  View {sport.title} Mentors
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom CTA */}
        <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
          <CardHeader>
            <CardTitle className="text-center text-lg">Can't Find Your Sport?</CardTitle>
            <CardDescription className="text-center">
              We're constantly adding new sports and mentors
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" onClick={() => navigate('/instant-mentor')}>
              Request a Sport Category
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SportsMentorship;
