import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Search, Users, GraduationCap, TrendingUp, Heart, Trophy, Palette, Gamepad2, Video, Code, Users as UsersIcon, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
// Online mentors presence removed - using Google Meet flow
import { MentorCard } from '@/components/MentorCard';

const categories = [
  { id: "exams", title: "Exams", icon: GraduationCap, description: "JEE, NEET, CAT & more", route: "/exams" },
  { id: "counselling", title: "College Counselling", icon: TrendingUp, description: "IIT, NIT, AIIMS guidance" },
  { id: "financial", title: "Financial Planning", icon: TrendingUp, description: "Career & money guidance" },
  { id: "wellness", title: "Motivation & Wellbeing", icon: Heart, description: "Mental health support" },
  { id: "sports", title: "Sports Mentorship", icon: Trophy, description: "Athlete guidance" },
  { id: "arts", title: "Arts & Creativity", icon: Palette, description: "Creative fields" },
  { id: "gaming", title: "Gaming & Esports", icon: Gamepad2, description: "Pro gaming guidance" },
  { id: "content", title: "Content Creation", icon: Video, description: "YouTube, Instagram & more" },
  { id: "tech", title: "Technical & Career", icon: Code, description: "Tech career guidance" },
  { id: "family", title: "Family & Relationships", icon: UsersIcon, description: "Personal counseling" },
  { id: "others", title: "Others", icon: MoreHorizontal, description: "More categories" },
];

interface Mentor {
  id: string;
  user_id: string;
  bio: string | null;
  specialization: string | null;
  rating: number | null;
  total_sessions: number | null;
  profiles: {
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
  } | null;
}

const SearchResults = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [filteredCategories, setFilteredCategories] = useState(categories);
  const [isLoading, setIsLoading] = useState(false);
  // Online status removed - sessions use Google Meet

  useEffect(() => {
    const fetchMentors = async () => {
      if (!searchQuery.trim()) {
        setMentors([]);
        setFilteredCategories(categories);
        return;
      }

      setIsLoading(true);

      // Use RPC function to get public mentor data (bypasses RLS safely)
      const { data: mentorData } = await supabase.rpc('get_all_public_mentor_profiles');

      // Filter by search query
      const searchLower = searchQuery.toLowerCase();
      const filtered = (mentorData || [])
        .filter((m: any) => 
          m.specialization?.toLowerCase().includes(searchLower) ||
          m.bio?.toLowerCase().includes(searchLower) ||
          m.full_name?.toLowerCase().includes(searchLower)
        )
        .slice(0, 20)
        .map((m: any) => ({
          id: m.mentor_id,
          user_id: m.id,
          bio: m.bio,
          specialization: m.specialization,
          rating: m.rating,
          total_sessions: m.total_sessions,
          profiles: {
            full_name: m.full_name,
            email: null,
            avatar_url: m.avatar_url,
          }
        }));

      setMentors(filtered);

      // Filter categories
      const filteredCats = categories.filter(cat => 
        cat.title.toLowerCase().includes(searchLower) ||
        cat.description.toLowerCase().includes(searchLower)
      );
      setFilteredCategories(filteredCats);

      setIsLoading(false);
    };

    const timeoutId = setTimeout(fetchMentors, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setSearchParams({ q: value });
  };


  const CategoryCard = ({ category }: { category: typeof categories[0] }) => {
    const Icon = category.icon;
    
    return (
      <Card
        onClick={() => navigate(category.route || `/category/${category.id}`)}
        className="cursor-pointer hover:shadow-lg transition-shadow"
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
              <Icon className="w-6 h-6 text-primary-foreground" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg mb-1">{category.title}</h3>
              <p className="text-sm text-muted-foreground">{category.description}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/home", { replace: true })}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search mentors, categories..."
                className="pl-10 rounded-full"
                autoFocus
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {!searchQuery.trim() ? (
          <div className="text-center py-12">
            <Search className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Start Searching</h3>
            <p className="text-muted-foreground">
              Search for mentors by name, specialization, or browse categories
            </p>
          </div>
        ) : isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">Searching...</p>
          </div>
        ) : (mentors?.length ?? 0) === 0 && (filteredCategories?.length ?? 0) === 0 ? (
          <div className="text-center py-12">
            <Search className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No Results Found</h3>
            <p className="text-muted-foreground mb-4">
              We couldn't find any mentors or categories matching "{searchQuery}"
            </p>
            <Button onClick={() => handleSearch('')}>Clear Search</Button>
          </div>
        ) : (
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="all">
                All ({(mentors?.length ?? 0) + (filteredCategories?.length ?? 0)})
              </TabsTrigger>
              <TabsTrigger value="mentors">
                Mentors ({mentors?.length ?? 0})
              </TabsTrigger>
              <TabsTrigger value="categories">
                Categories ({filteredCategories?.length ?? 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {(filteredCategories?.length ?? 0) > 0 && (
                <div>
                  <h2 className="text-lg font-semibold mb-3">Categories</h2>
                  <div className="space-y-3">
                    {(filteredCategories ?? []).map(category => (
                      <CategoryCard key={category.id} category={category} />
                    ))}
                  </div>
                </div>
              )}

              {(mentors?.length ?? 0) > 0 && (
                <div className={(filteredCategories?.length ?? 0) > 0 ? 'mt-6' : ''}>
                  <h2 className="text-lg font-semibold mb-3">Mentors</h2>
                  <div className="space-y-3">
                    {(mentors ?? []).map(mentor => (
                      <MentorCard 
                        key={mentor.id} 
                        mentor={mentor}
                        isOnline={false}
                        compact={true}
                      />
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="mentors" className="space-y-3">
              {(mentors?.length ?? 0) === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">No mentors found</p>
                </div>
              ) : (
                (mentors ?? []).map(mentor => (
                  <MentorCard 
                    key={mentor.id} 
                    mentor={mentor}
                    isOnline={false}
                    compact={true}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="categories" className="space-y-3">
              {(filteredCategories?.length ?? 0) === 0 ? (
                <div className="text-center py-12">
                  <GraduationCap className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">No categories found</p>
                </div>
              ) : (
                (filteredCategories ?? []).map(category => (
                  <CategoryCard key={category.id} category={category} />
                ))
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default SearchResults;
