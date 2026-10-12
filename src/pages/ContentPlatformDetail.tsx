import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Youtube, Instagram, Scissors, Globe, Gamepad2, GraduationCap, Video, Laugh, Smartphone, UtensilsCrossed, Dumbbell, Briefcase, Music, Camera, Palette, Sparkles, MapPin, Hash, Building, FileText, Mic, Radio, Twitter, Linkedin } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type SubCategory = {
  id: string;
  title: string;
  description: string;
  icon: typeof Video;
  badge: string;
  popular?: boolean;
};

type PlatformData = {
  title: string;
  icon: typeof Youtube;
  color: string;
  subcategories: SubCategory[];
};

const platformCategories: Record<string, PlatformData> = {
  youtube: {
    title: 'YouTube Content Creation',
    icon: Youtube,
    color: 'from-red-500 to-rose-500',
    subcategories: [
      { id: 'youtube-gaming', title: 'Gaming Content', description: 'Gaming videos, Let\'s Plays, Reviews, Esports commentary', icon: Gamepad2, badge: 'Popular', popular: true },
      { id: 'youtube-educational', title: 'Educational Content', description: 'Tutorials, Courses, Tech reviews, How-to guides', icon: GraduationCap, badge: 'High Demand' },
      { id: 'youtube-vlogging', title: 'Vlogging', description: 'Daily vlogs, Travel vlogs, Lifestyle content', icon: Video, badge: 'Trending' },
      { id: 'youtube-comedy', title: 'Comedy & Entertainment', description: 'Sketches, Pranks, Reaction videos', icon: Laugh, badge: 'Popular', popular: true },
      { id: 'youtube-tech', title: 'Tech Reviews', description: 'Gadget reviews, Unboxing, Tech news', icon: Smartphone, badge: 'High Value' },
      { id: 'youtube-cooking', title: 'Cooking & Food', description: 'Recipe videos, Food reviews, Cooking shows', icon: UtensilsCrossed, badge: 'Growing' },
      { id: 'youtube-fitness', title: 'Fitness & Health', description: 'Workout videos, Nutrition, Yoga', icon: Dumbbell, badge: 'Popular' },
      { id: 'youtube-business', title: 'Business & Finance', description: 'Startup stories, Money management, Investing', icon: Briefcase, badge: 'Premium' },
      { id: 'youtube-music', title: 'Music & Dance', description: 'Cover songs, Original music, Dance choreography', icon: Music, badge: 'Creative' }
    ]
  },
  instagram: {
    title: 'Instagram Content Creation',
    icon: Instagram,
    color: 'from-purple-500 to-pink-500',
    subcategories: [
      { id: 'instagram-reels', title: 'Reels Creation', description: 'Short-form video content, Trending reels', icon: Video, badge: 'Trending', popular: true },
      { id: 'instagram-photography', title: 'Photography', description: 'Product photography, Portrait, Landscape', icon: Camera, badge: 'Premium' },
      { id: 'instagram-fashion', title: 'Fashion & Lifestyle', description: 'OOTD, Fashion tips, Style guides', icon: Palette, badge: 'Popular', popular: true },
      { id: 'instagram-food', title: 'Food Blogging', description: 'Food photography, Restaurant reviews', icon: UtensilsCrossed, badge: 'Growing' },
      { id: 'instagram-travel', title: 'Travel Influencing', description: 'Travel stories, Destination guides', icon: MapPin, badge: 'Adventure' },
      { id: 'instagram-memes', title: 'Meme Pages', description: 'Content curation, Viral content creation', icon: Hash, badge: 'Viral' },
      { id: 'instagram-business', title: 'Business Pages', description: 'Brand building, Marketing strategies', icon: Building, badge: 'Professional' }
    ]
  },
  editing: {
    title: 'Content Editing & Production',
    icon: Scissors,
    color: 'from-indigo-500 to-blue-500',
    subcategories: [
      { id: 'editing-video', title: 'Video Editing', description: 'Adobe Premiere Pro, Final Cut Pro, DaVinci Resolve', icon: Video, badge: 'Essential', popular: true },
      { id: 'editing-thumbnail', title: 'Thumbnail Design', description: 'Photoshop, Canva, Click-worthy thumbnails', icon: Camera, badge: 'High Impact', popular: true },
      { id: 'editing-audio', title: 'Audio Editing', description: 'Sound design, Voice-over, Background music', icon: Music, badge: 'Professional' },
      { id: 'editing-color', title: 'Color Grading', description: 'Professional color correction, Cinematic looks', icon: Palette, badge: 'Advanced' },
      { id: 'editing-motion', title: 'Motion Graphics', description: 'After Effects, Animations, Intros/Outros', icon: Sparkles, badge: 'Premium' },
      { id: 'editing-script', title: 'Script Writing', description: 'Content planning, Storytelling, Hooks', icon: FileText, badge: 'Foundation' }
    ]
  },
  'other-platforms': {
    title: 'Other Platforms',
    icon: Globe,
    color: 'from-green-500 to-teal-500',
    subcategories: [
      { id: 'tiktok-content', title: 'TikTok Content', description: 'Short videos, Trends, Viral challenges', icon: Music, badge: 'Trending', popular: true },
      { id: 'linkedin-content', title: 'LinkedIn Content', description: 'Professional content, Thought leadership, Articles', icon: Linkedin, badge: 'Professional' },
      { id: 'twitter-content', title: 'Twitter/X Content', description: 'Thread writing, Engagement strategies', icon: Twitter, badge: 'Growing' },
      { id: 'podcasting', title: 'Podcasting', description: 'Audio content, Interview skills, Equipment setup', icon: Mic, badge: 'Popular', popular: true },
      { id: 'streaming', title: 'Streaming (Twitch/YouTube Live)', description: 'Live streaming, Audience engagement', icon: Radio, badge: 'Interactive' },
      { id: 'blogging', title: 'Blog Writing', description: 'SEO, Content strategy, Monetization', icon: FileText, badge: 'Evergreen' }
    ]
  }
};

const ContentPlatformDetail = () => {
  const { platform } = useParams<{ platform: string }>();
  const navigate = useNavigate();

  const platformData = platform ? platformCategories[platform] : null;

  if (!platformData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Platform Not Found</h2>
          <p className="text-muted-foreground mb-4">The platform you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/content-creation')}>
            Back to Content Creation
          </Button>
        </div>
      </div>
    );
  }

  const PlatformIcon = platformData.icon;

  const getBadgeVariant = (badge: string) => {
    if (badge === 'Popular' || badge === 'Trending') return 'default';
    if (badge === 'Premium' || badge === 'Professional') return 'secondary';
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
            onClick={() => navigate("/content-creation", { replace: true })}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3 flex-1">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${platformData.color} flex items-center justify-center`}>
              <PlatformIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">{platformData.title}</h1>
              <p className="text-sm text-muted-foreground">{platformData.subcategories.length} categories</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Info Message */}
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground text-center">
              Learn from <strong className="text-foreground">successful creators</strong> who have mastered their craft and built engaged audiences
            </p>
          </CardContent>
        </Card>

        {/* Categories Grid */}
        <div className="grid gap-3">
          {platformData.subcategories.map((category) => {
            const Icon = category.icon;
            return (
              <Card
                key={category.id}
                onClick={() => navigate(`/category/content-creation/${category.id}`)}
                className="cursor-pointer hover:shadow-lg transition-all group"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${platformData.color} flex items-center justify-center flex-shrink-0`}>
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
              <Sparkles className="h-4 w-4 text-accent" />
              All mentors are verified creators
            </CardTitle>
            <CardDescription className="text-xs">
              Every mentor has proven success in their niche with real audience growth and engagement
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
};

export default ContentPlatformDetail;
