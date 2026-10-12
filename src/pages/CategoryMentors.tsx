import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, TrendingUp, Calendar, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MentorCard } from "@/components/MentorCard";

type Mentor = {
  id: string;
  bio: string | null;
  specialization: string | null;
  rating: number | null;
  total_sessions: number | null;
  fixed_rate_per_15m: number | null;
  mentor_types: string[] | null;
  exams: string[] | null;
  profiles: {
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
  } | null;
  availableSlots?: number;
};

const CategoryMentors = () => {
  const { categoryId, department, stage } = useParams<{ categoryId: string; department?: string; stage?: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    fetchMentors();
  }, [categoryId, department, stage]);

  const fetchMentors = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_all_public_mentor_profiles');
      if (error) throw error;

      let filtered = data || [];

      if (categoryId === 'jee') {
        filtered = filtered.filter((m: any) =>
          m.exams?.some((e: string) => e.toLowerCase().includes('jee')) ||
          m.mentor_types?.some((t: string) => t.toLowerCase().includes('jee'))
        );
      } else if (categoryId === 'neet') {
        filtered = filtered.filter((m: any) =>
          m.exams?.some((e: string) => e.toLowerCase().includes('neet')) ||
          m.mentor_types?.some((t: string) => t.toLowerCase().includes('neet'))
        );
      } else if (stage && department) {
        filtered = filtered.filter((m: any) =>
          m.mentor_types?.some((t: string) => t.includes('College Counselling'))
        );
      } else if (categoryId === 'exams') {
        filtered = filtered.filter((m: any) =>
          m.mentor_types?.some((t: string) => t.includes('Exam Preparation'))
        );
      }

      // Check availability for today/tomorrow
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

      const mentorIds = filtered.map((m: any) => m.mentor_id);
      let availabilityMap: Record<string, number> = {};

      if (mentorIds.length > 0) {
        const { data: slots } = await supabase
          .from('mentor_availability')
          .select('mentor_id')
          .in('mentor_id', mentorIds)
          .in('date', [today, tomorrow])
          .eq('status', 'available');

        if (slots) {
          slots.forEach((s: any) => {
            availabilityMap[s.mentor_id] = (availabilityMap[s.mentor_id] || 0) + 1;
          });
        }
      }

      const mappedMentors = filtered.map((m: any) => ({
        id: m.mentor_id,
        bio: m.bio,
        specialization: m.specialization,
        rating: m.rating,
        total_sessions: m.total_sessions,
        fixed_rate_per_15m: m.fixed_rate_per_15m,
        mentor_types: m.mentor_types,
        exams: m.exams,
        profiles: {
          full_name: m.full_name,
          email: null,
          avatar_url: m.avatar_url,
        },
        availableSlots: availabilityMap[m.mentor_id] || 0,
      }));

      setMentors(mappedMentors);
    } catch (error) {
      console.error('Error fetching mentors:', error);
      toast({
        title: "Error",
        description: "Failed to load mentors. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Build dynamic filter chips from mentor data
  const filterChips = useMemo(() => {
    const chips: { key: string; label: string }[] = [{ key: "all", label: "All Mentors" }];
    const availableCount = mentors.filter(m => (m.availableSlots || 0) > 0).length;
    if (availableCount > 0) {
      chips.push({ key: "available", label: `Available Now (${availableCount})` });
    }

    if (categoryId === "neet") {
      chips.push({ key: "aiims", label: "AIIMS Mentor" });
      chips.push({ key: "gmc", label: "GMC Mentor" });
    } else if (categoryId === "jee") {
      chips.push({ key: "iit", label: "IIT Mentor" });
      chips.push({ key: "nit", label: "NIT Mentor" });
    }
    chips.push({ key: "expert", label: "Expert" });
    return chips;
  }, [mentors, categoryId]);

  const filteredMentors = useMemo(() => {
    let result = mentors;
    if (activeFilter === "available") {
      result = result.filter(m => (m.availableSlots || 0) > 0);
      result.sort((a, b) => (b.availableSlots || 0) - (a.availableSlots || 0));
    } else if (activeFilter === "aiims") {
      result = result.filter(m =>
        m.mentor_types?.some(t => t.toLowerCase().includes('aiims')) ||
        m.exams?.some(e => e.toLowerCase().includes('aiims'))
      );
    } else if (activeFilter === "gmc") {
      result = result.filter(m =>
        m.mentor_types?.some(t => t.toLowerCase().includes('gmc'))
      );
    } else if (activeFilter === "iit") {
      result = result.filter(m =>
        m.mentor_types?.some(t => t.toLowerCase().includes('iit')) ||
        m.exams?.some(e => e.toLowerCase().includes('iit'))
      );
    } else if (activeFilter === "nit") {
      result = result.filter(m =>
        m.mentor_types?.some(t => t.toLowerCase().includes('nit')) ||
        m.exams?.some(e => e.toLowerCase().includes('nit'))
      );
    } else if (activeFilter === "expert") {
      result = result.filter(m =>
        m.specialization?.toLowerCase().includes('expert') ||
        m.mentor_types?.some(t => t.toLowerCase().includes('expert'))
      );
    }
    return result;
  }, [mentors, activeFilter]);

  const getTitle = () => {
    if (categoryId === "jee") return "JEE — One-to-One Mentors";
    if (categoryId === "neet") return "NEET — One-to-One Mentors";
    if (categoryId === "exams") return "Exam Mentors";
    if (categoryId === "counselling") return "College Counselling";
    return "Mentors";
  };

  const getSubtitle = () => {
    if (categoryId === "jee") return "Connect with IIT and NIT mentors for JEE preparation";
    if (categoryId === "neet") return "Connect with AIIMS and GMC mentors for NEET preparation";
    return "";
  };

  const getAnalysisRoute = () => {
    if (categoryId === "jee") return "/jee-analyzer";
    if (categoryId === "neet") return "/neet-analyzer";
    return null;
  };

  const analysisRoute = getAnalysisRoute();

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-primary text-primary-foreground">
        <div className="flex items-center gap-3 p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/home", { replace: true })}
            className="rounded-full text-primary-foreground hover:bg-primary-foreground/10"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
              {categoryId === "neet" ? "❤️" : "🎓"}
            </div>
            <div>
              <h1 className="text-xl font-bold">{getTitle()}</h1>
              <p className="text-sm text-primary-foreground/70">{getSubtitle()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4">
        {/* Strategy Plans & Analysis Buttons */}
        {(categoryId === "jee" || categoryId === "neet") && (
          <div className="pt-4 flex gap-2 flex-wrap">
            <Button
              variant="default"
              className="rounded-full"
              onClick={() => navigate(categoryId === "jee" ? "/jee-plans" : "/neet-plans")}
            >
              <Rocket className="h-4 w-4 mr-2" />
              Strategy Plans
            </Button>
            {analysisRoute && (
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() => navigate(analysisRoute)}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Marks vs Rank Analysis
              </Button>
            )}
          </div>
        )}

        {/* Filter Chips */}
        <div className="flex gap-2 pt-4 pb-2 overflow-x-auto scrollbar-hide">
          {filterChips.map(chip => (
            <Button
              key={chip.key}
              variant={activeFilter === chip.key ? "default" : "outline"}
              size="sm"
              className="rounded-full whitespace-nowrap shrink-0"
              onClick={() => setActiveFilter(chip.key)}
            >
              {chip.key === "available" && <Calendar className="h-3.5 w-3.5 mr-1.5" />}
              {chip.label}
            </Button>
          ))}
        </div>

        {/* Mentors Grid */}
        <div className="py-4">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading mentors...</p>
            </div>
          ) : filteredMentors.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold mb-2">No Mentors Found</h3>
              <p className="text-muted-foreground mb-6">
                No mentors match this filter. Try another one.
              </p>
              <Button onClick={() => setActiveFilter("all")} variant="outline">
                Show All Mentors
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMentors.map((mentor) => (
                <MentorCard
                  key={mentor.id}
                  mentor={mentor}
                  isOnline={false}
                  showAvailableNow={(mentor.availableSlots || 0) > 0}
                  availableSlots={mentor.availableSlots}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryMentors;
