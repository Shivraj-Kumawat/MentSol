import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Trophy, Users, Medal, Star } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type SportCategory = {
  id: string;
  title: string;
  description: string;
  icon: typeof Users;
  badge: string;
  popular?: boolean;
};

type SportData = {
  title: string;
  emoji: string;
  color: string;
  subcategories: SportCategory[];
};

const sportCategories: Record<string, SportData> = {
  cricket: {
    title: 'Cricket',
    emoji: '🏏',
    color: 'from-blue-600 to-indigo-700',
    subcategories: [
      { id: 'cricket-coach', title: 'Cricket Coach', description: 'Students played District/State/National', icon: Users, badge: 'Coach' },
      { id: 'ranji-trophy', title: 'Ranji Trophy Players', description: 'India\'s premier first-class championship', icon: Trophy, badge: 'Tournament' },
      { id: 'vijay-hazare-trophy', title: 'Vijay Hazare Trophy', description: 'Domestic one-day cricket', icon: Trophy, badge: 'Tournament' },
      { id: 'syed-mushtaq-ali', title: 'Syed Mushtaq Ali Trophy', description: 'Domestic T20 cricket', icon: Trophy, badge: 'Tournament' },
      { id: 'duleep-trophy', title: 'Duleep Trophy', description: 'Inter-zonal first-class cricket', icon: Trophy, badge: 'Tournament' },
      { id: 'ipl-players', title: 'IPL Players', description: 'Indian Premier League', icon: Medal, badge: 'Premium', popular: true },
      { id: 'deodhar-trophy', title: 'Deodhar Trophy', description: 'Domestic List A cricket', icon: Trophy, badge: 'Tournament' }
    ]
  },
  football: {
    title: 'Football',
    emoji: '⚽',
    color: 'from-green-600 to-emerald-700',
    subcategories: [
      { id: 'football-coach', title: 'Football Coach', description: 'Students played District/State/National', icon: Users, badge: 'Coach' },
      { id: 'isl-players', title: 'ISL Players', description: 'Indian Super League', icon: Medal, badge: 'Premium', popular: true },
      { id: 'i-league-players', title: 'I-League Players', description: 'Top-tier football league', icon: Trophy, badge: 'Tournament' },
      { id: 'santosh-trophy', title: 'Santosh Trophy', description: 'National championship for states', icon: Trophy, badge: 'Tournament' },
      { id: 'durand-cup', title: 'Durand Cup', description: 'Asia\'s oldest football tournament', icon: Trophy, badge: 'Tournament' },
      { id: 'federation-cup', title: 'Federation Cup', description: 'National knockout tournament', icon: Trophy, badge: 'Tournament' }
    ]
  },
  badminton: {
    title: 'Badminton',
    emoji: '🏸',
    color: 'from-red-600 to-orange-700',
    subcategories: [
      { id: 'badminton-coach', title: 'Badminton Coach', description: 'Students played District/State/National', icon: Users, badge: 'Coach' },
      { id: 'badminton-nationals', title: 'National Championships', description: 'India\'s premier badminton tournament', icon: Trophy, badge: 'Tournament' },
      { id: 'pbl-players', title: 'Premier Badminton League', description: 'India\'s professional badminton league', icon: Medal, badge: 'Premium', popular: true },
      { id: 'badminton-senior-nationals', title: 'Senior Nationals', description: 'Senior national championship', icon: Trophy, badge: 'Tournament' },
      { id: 'all-india-open', title: 'All India Open', description: 'All India ranking tournament', icon: Trophy, badge: 'Tournament' },
      { id: 'badminton-international', title: 'International Players', description: 'Represented India internationally', icon: Star, badge: 'Elite' }
    ]
  },
  hockey: {
    title: 'Hockey',
    emoji: '🏑',
    color: 'from-yellow-600 to-amber-700',
    subcategories: [
      { id: 'hockey-coach', title: 'Hockey Coach', description: 'Students played District/State/National', icon: Users, badge: 'Coach' },
      { id: 'hil-players', title: 'Hockey India League', description: 'Professional field hockey league', icon: Medal, badge: 'Premium', popular: true },
      { id: 'hockey-nationals', title: 'National Championships', description: 'National hockey championship', icon: Trophy, badge: 'Tournament' },
      { id: 'nehru-hockey', title: 'Nehru Hockey Tournament', description: 'International invitational tournament', icon: Trophy, badge: 'Tournament' },
      { id: 'beighton-cup', title: 'Beighton Cup', description: 'Oldest field hockey tournament in India', icon: Trophy, badge: 'Tournament' },
      { id: 'hockey-international', title: 'International Players', description: 'Represented India', icon: Star, badge: 'Elite' }
    ]
  },
  kabaddi: {
    title: 'Kabaddi',
    emoji: '🤼',
    color: 'from-orange-600 to-red-700',
    subcategories: [
      { id: 'kabaddi-coach', title: 'Kabaddi Coach', description: 'Students played District/State/National', icon: Users, badge: 'Coach' },
      { id: 'pkl-players', title: 'Pro Kabaddi League', description: 'India\'s professional kabaddi league', icon: Medal, badge: 'Premium', popular: true },
      { id: 'kabaddi-nationals', title: 'National Championships', description: 'National kabaddi championship', icon: Trophy, badge: 'Tournament' },
      { id: 'kabaddi-senior-nationals', title: 'Senior Nationals', description: 'Senior national championship', icon: Trophy, badge: 'Tournament' },
      { id: 'kabaddi-federation-cup', title: 'Federation Cup', description: 'National knockout tournament', icon: Trophy, badge: 'Tournament' },
      { id: 'kabaddi-international', title: 'International Players', description: 'Represented India', icon: Star, badge: 'Elite' }
    ]
  },
  tennis: {
    title: 'Tennis',
    emoji: '🎾',
    color: 'from-purple-600 to-violet-700',
    subcategories: [
      { id: 'tennis-coach', title: 'Tennis Coach', description: 'Students played District/State/National', icon: Users, badge: 'Coach' },
      { id: 'tennis-nationals', title: 'National Championships', description: 'National tennis championship', icon: Trophy, badge: 'Tournament' },
      { id: 'aita-tournaments', title: 'AITA Tournaments', description: 'All India Tennis Association tournaments', icon: Trophy, badge: 'Tournament' },
      { id: 'davis-cup', title: 'Davis Cup Players', description: 'International team competition', icon: Medal, badge: 'Premium', popular: true },
      { id: 'itf-circuit', title: 'ITF Circuit Players', description: 'ITF World Tennis Tour', icon: Trophy, badge: 'Tournament' },
      { id: 'tennis-state-championships', title: 'State Championships', description: 'State-level championship', icon: Trophy, badge: 'Tournament' }
    ]
  },
  wrestling: {
    title: 'Wrestling',
    emoji: '🤼‍♂️',
    color: 'from-pink-600 to-rose-700',
    subcategories: [
      { id: 'wrestling-coach', title: 'Wrestling Coach', description: 'Students played District/State/National', icon: Users, badge: 'Coach' },
      { id: 'wrestling-nationals', title: 'National Championships', description: 'National wrestling championship', icon: Trophy, badge: 'Tournament' },
      { id: 'wrestling-senior-nationals', title: 'Senior Nationals', description: 'Senior national championship', icon: Trophy, badge: 'Tournament' },
      { id: 'khel-india-wrestling', title: 'Khel India Games', description: 'National multi-sport event', icon: Trophy, badge: 'Tournament' },
      { id: 'pwl-players', title: 'Pro Wrestling League', description: 'Professional wrestling league', icon: Medal, badge: 'Premium', popular: true },
      { id: 'wrestling-international', title: 'International Players', description: 'Commonwealth, Asian Games, Olympics', icon: Star, badge: 'Elite' }
    ]
  }
};

const SportDetail = () => {
  const { sport } = useParams<{ sport: string }>();
  const navigate = useNavigate();

  const sportData = sport ? sportCategories[sport] : null;

  if (!sportData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Sport Not Found</h2>
          <p className="text-muted-foreground mb-4">The sport you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/sports-mentorship')}>
            Back to Sports
          </Button>
        </div>
      </div>
    );
  }

  const getBadgeVariant = (badge: string) => {
    if (badge === 'Coach') return 'default';
    if (badge === 'Premium' || badge === 'Elite') return 'secondary';
    return 'outline';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center gap-3 p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/sports-mentorship", { replace: true })}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3 flex-1">
            <div className="text-3xl">{sportData.emoji}</div>
            <div>
              <h1 className="text-xl font-bold text-foreground">{sportData.title} Mentorship</h1>
              <p className="text-sm text-muted-foreground">{sportData.subcategories.length} categories</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Info Message */}
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground text-center">
              Choose from <strong className="text-foreground">coaches</strong> whose students reached top levels or <strong className="text-foreground">players</strong> who competed in prestigious tournaments
            </p>
          </CardContent>
        </Card>

        {/* Categories Grid */}
        <div className="grid gap-3">
          {sportData.subcategories.map((category) => {
            const Icon = category.icon;
            return (
              <Card
                key={category.id}
                onClick={() => navigate(`/category/sports-mentorship/${category.id}`)}
                className="cursor-pointer hover:shadow-lg transition-all group"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${sportData.color} flex items-center justify-center flex-shrink-0`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base mb-1 flex items-center gap-2 flex-wrap">
                          {category.title}
                          <Badge variant={getBadgeVariant(category.badge)} className="text-xs">
                            {category.badge}
                          </Badge>
                          {category.popular && (
                            <Badge variant="secondary" className="text-xs bg-yellow-500/10 text-yellow-700 dark:text-yellow-400">
                              Popular
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="text-sm">
                          {category.description}
                        </CardDescription>
                      </div>
                    </div>
                    <ArrowLeft className="h-5 w-5 text-muted-foreground rotate-180 flex-shrink-0 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        {/* Bottom Info */}
        <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Star className="h-4 w-4 text-accent" />
              All mentors are verified
            </CardTitle>
            <CardDescription className="text-xs">
              We verify credentials, achievements, and background of every mentor before approval
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
};

export default SportDetail;
