import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Youtube, Instagram, Scissors } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const ContentCreation = () => {
  const navigate = useNavigate();

  const platforms = [
    {
      id: 'youtube',
      title: 'YouTube Content Creation',
      description: 'Long-form video content, monetization strategies, channel growth',
      icon: Youtube,
      color: 'from-red-500 to-rose-500',
      popular: true,
      categoryCount: 9
    },
    {
      id: 'instagram',
      title: 'Instagram Content Creation',
      description: 'Reels, stories, posts, influencer marketing strategies',
      icon: Instagram,
      color: 'from-purple-500 to-pink-500',
      popular: true,
      categoryCount: 7
    },
    {
      id: 'editing',
      title: 'Content Editing & Production',
      description: 'Video editing, thumbnail design, audio production, motion graphics',
      icon: Scissors,
      color: 'from-indigo-500 to-blue-500',
      categoryCount: 6
    }
  ];

  const PlatformCard = ({ platform }: { platform: typeof platforms[0] }) => {
    const Icon = platform.icon;
    
    return (
      <Card
        onClick={() => navigate(`/content-creation/${platform.id}`)}
        className="cursor-pointer hover:shadow-lg transition-all"
      >
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${platform.color} flex items-center justify-center shrink-0`}>
              <Icon className="w-7 h-7 text-white" />
            </div>
            {platform.popular && (
              <Badge className="bg-primary text-primary-foreground">Popular</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <h3 className="font-semibold text-lg mb-2">{platform.title}</h3>
          <p className="text-sm text-muted-foreground mb-3">{platform.description}</p>
          <p className="text-xs text-muted-foreground">{platform.categoryCount} subcategories</p>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/home", { replace: true })}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Content Creation</h1>
              <p className="text-sm text-muted-foreground">Expert guidance for content creators</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-4xl space-y-6">
        {/* Platforms Grid */}
        <div className="grid gap-4">
          {platforms.map(platform => (
            <PlatformCard key={platform.id} platform={platform} />
          ))}
        </div>

        {/* Info Card */}
        <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
          <CardContent className="py-6">
            <h3 className="font-semibold mb-2">Why Content Creation Mentorship?</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span>Learn from successful creators who have built engaged audiences</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span>Master content strategy, editing, and monetization techniques</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span>Get platform-specific tips for algorithm optimization and growth</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span>Build your personal brand and turn your passion into a career</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ContentCreation;