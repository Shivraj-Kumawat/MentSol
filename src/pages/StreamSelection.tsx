import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Microscope, Calculator, BookOpen, Target, ChevronRight, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MentorCard } from "@/components/MentorCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Mentor {
  id: string;
  user_id: string;
  bio: string;
  specialization: string;
  rating: number;
  fixed_rate_per_15m: number;
  mentor_types: string[];
  profiles: {
    full_name: string;
    avatar_url: string;
  };
}

const StreamSelection = () => {
  const navigate = useNavigate();
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStream, setSelectedStream] = useState<string>("all");

  useEffect(() => {
    fetchMentors();
  }, []);

  const fetchMentors = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('mentors')
        .select(`
          id,
          user_id,
          bio,
          specialization,
          rating,
          fixed_rate_per_15m,
          mentor_types,
          profiles!mentors_user_id_fkey (
            full_name,
            avatar_url
          )
        `)
        .eq('status', 'approved')
        .contains('mentor_types', ['Stream Selection']);

      if (error) throw error;

      setMentors(data as unknown as Mentor[]);
    } catch (error) {
      console.error('Error fetching mentors:', error);
      toast.error('Failed to load mentors');
    } finally {
      setLoading(false);
    }
  };

  const streamCategories = [
    {
      id: "science",
      title: "Science Stream",
      icon: Microscope,
      color: "from-blue-500 to-cyan-500",
      description: "Perfect for aspiring engineers, doctors, and scientists",
      options: [
        { name: "PCM", desc: "Engineering, Tech, Research" },
        { name: "PCB", desc: "Medical, Life Sciences" },
        { name: "PCMB", desc: "Keep all options open" },
      ],
    },
    {
      id: "commerce",
      title: "Commerce Stream",
      icon: Calculator,
      color: "from-green-500 to-emerald-500",
      description: "Ideal for business, finance, and management careers",
      options: [
        { name: "With Maths", desc: "CA, Economics, Finance" },
        { name: "Without Maths", desc: "Business, Management" },
      ],
    },
    {
      id: "arts",
      title: "Arts/Humanities",
      icon: BookOpen,
      color: "from-purple-500 to-pink-500",
      description: "Best for creative, social sciences, and law careers",
      options: [
        { name: "Psychology", desc: "Counseling, Social Work" },
        { name: "Economics", desc: "Civil Services, Research" },
        { name: "Fine Arts", desc: "Creative Fields" },
        { name: "Political Science", desc: "Law, Administration" },
      ],
    },
    {
      id: "counseling",
      title: "Career Counseling",
      icon: Target,
      color: "from-orange-500 to-red-500",
      description: "Get personalized guidance based on your strengths",
      options: [
        { name: "Aptitude Tests", desc: "Discover your talents" },
        { name: "Career Planning", desc: "Long-term roadmap" },
        { name: "Subject Selection", desc: "Choose wisely" },
      ],
    },
  ];

  const filteredMentors = selectedStream === "all" 
    ? mentors 
    : mentors.filter(mentor => 
        mentor.mentor_types?.some(type => 
          type.toLowerCase().includes(selectedStream.toLowerCase())
        )
      );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/10 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/home", { replace: true })}
              className="rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Stream Selection Guidance
              </h1>
              <p className="text-sm text-muted-foreground">
                Choose Your Academic Path
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-8">
        <Card className="border-primary/30 bg-gradient-to-br from-primary/10 via-accent/5 to-background">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold text-foreground">
                Confused about which stream to choose? 🤔
              </h2>
              <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
                One of the most important decisions in your academic journey. Get expert guidance from mentors who've been there and made the right choices!
              </p>
              <div className="flex flex-wrap gap-3 justify-center pt-4">
                <Badge variant="secondary" className="text-sm px-4 py-2">
                  Science, Commerce or Arts?
                </Badge>
                <Badge variant="secondary" className="text-sm px-4 py-2">
                  Subject Combinations
                </Badge>
                <Badge variant="secondary" className="text-sm px-4 py-2">
                  Future Career Paths
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stream Categories */}
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-semibold mb-6">Explore Stream Options</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {streamCategories.map((stream) => (
            <Card
              key={stream.id}
              className="group hover:shadow-premium transition-all duration-300 cursor-pointer border-primary/20 hover:border-primary/50"
              onClick={() => {
                setSelectedStream(stream.id);
                document.getElementById('mentors-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${stream.color} flex items-center justify-center shadow-glow group-hover:scale-110 transition-transform`}>
                    <stream.icon className="h-7 w-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="flex items-center justify-between">
                      {stream.title}
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {stream.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stream.options.map((option) => (
                    <div key={option.name} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <span className="font-medium text-sm">{option.name}</span>
                      <span className="text-xs text-muted-foreground">{option.desc}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Why Choose Right Stream Section */}
      <div className="container mx-auto px-4 py-8">
        <Card className="border-accent/30 bg-gradient-to-br from-accent/10 to-background">
          <CardContent className="pt-6">
            <h3 className="text-xl font-semibold mb-4">
              Why is Choosing the Right Stream Important? 🎯
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                  <p className="text-muted-foreground">
                    <strong>Career Foundation:</strong> Your stream determines which careers you can pursue in the future
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                  <p className="text-muted-foreground">
                    <strong>College Options:</strong> Different streams open doors to different colleges and courses
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                  <p className="text-muted-foreground">
                    <strong>Interest Match:</strong> Choose subjects you enjoy studying for better performance
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                  <p className="text-muted-foreground">
                    <strong>Future Success:</strong> Right stream = Better chances of achieving your dream career
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mentors Section */}
      <div id="mentors-section" className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold">Expert Stream Selection Mentors</h2>
            <p className="text-muted-foreground">Connect with mentors who can guide your decision</p>
          </div>
          {mentors.length > 0 && (
            <Badge variant="secondary" className="gap-2">
              <Users className="h-4 w-4" />
              {mentors.length} Mentors Available
            </Badge>
          )}
        </div>

        {/* Stream Filter */}
        {mentors.length > 0 && (
          <Tabs value={selectedStream} onValueChange={setSelectedStream} className="mb-6">
            <TabsList className="w-full justify-start overflow-x-auto flex-wrap h-auto">
              <TabsTrigger value="all">All Mentors</TabsTrigger>
              <TabsTrigger value="science">Science Stream</TabsTrigger>
              <TabsTrigger value="commerce">Commerce Stream</TabsTrigger>
              <TabsTrigger value="arts">Arts/Humanities</TabsTrigger>
              <TabsTrigger value="counseling">Career Counseling</TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        {/* Mentors Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading mentors...</p>
          </div>
        ) : filteredMentors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMentors.map((mentor) => (
              <MentorCard key={mentor.id} mentor={mentor} />
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="pt-6 text-center py-12">
              <p className="text-muted-foreground mb-4">
                {selectedStream === "all" 
                  ? "No mentors available yet for stream selection guidance"
                  : `No mentors available for ${selectedStream} guidance yet`
                }
              </p>
              <Button onClick={() => setSelectedStream("all")} variant="outline">
                View All Mentors
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-8">
        <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-accent/10">
          <CardContent className="pt-6 text-center">
            <h3 className="text-2xl font-bold mb-3">
              Still Confused? Talk to an Expert! 💬
            </h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Book a one-on-one session with our mentors to discuss your interests, strengths, and career goals. Get personalized recommendations!
            </p>
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              Browse Mentors
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StreamSelection;