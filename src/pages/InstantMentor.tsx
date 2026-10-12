import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
// Online mentors presence removed - using Google Meet flow
import { MentorCard } from "@/components/MentorCard";

interface AvailableMentor {
  id: string;
  user_id: string;
  bio: string;
  specialization: string;
  rating: number;
  fixed_rate_per_15m: number;
  total_sessions: number;
  profile?: {
    full_name: string;
    avatar_url: string | null;
  };
}

const InstantMentor = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [mentors, setMentors] = useState<AvailableMentor[]>([]);
  // Online status removed - sessions use Google Meet

  useEffect(() => {
    loadAvailableMentors();
  }, []);

  const loadAvailableMentors = async () => {
    try {
      setLoading(true);
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Get mentor IDs with available slots today or tomorrow
      const { data: availableSlots, error: slotsError } = await supabase
        .from('mentor_availability')
        .select('mentor_id')
        .eq('status', 'available')
        .gte('date', today)
        .lte('date', tomorrow);

      if (slotsError) throw slotsError;

      if (!availableSlots || availableSlots.length === 0) {
        setMentors([]);
        setLoading(false);
        return;
      }

      const mentorIds = [...new Set(availableSlots.map(slot => slot.mentor_id))];

      // Use RPC function to get public mentor data (bypasses RLS safely)
      const { data: allMentors, error: mentorsError } = await supabase.rpc('get_all_public_mentor_profiles');

      if (mentorsError) throw mentorsError;

      // Filter to only mentors with available slots
      const availableMentors = (allMentors || [])
        .filter((m: any) => mentorIds.includes(m.mentor_id))
        .map((m: any) => ({
          id: m.mentor_id,
          user_id: m.id,
          bio: m.bio,
          specialization: m.specialization,
          rating: m.rating,
          fixed_rate_per_15m: m.fixed_rate_per_15m,
          total_sessions: m.total_sessions,
          profile: {
            full_name: m.full_name,
            avatar_url: m.avatar_url,
          }
        }));

      setMentors(availableMentors);
    } catch (error) {
      console.error('Error loading mentors:', error);
      toast({
        title: "Error",
        description: "Failed to load available mentors",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-teal-glow/5 to-background pb-6">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center gap-3 p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/home")}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Instant Mentors</h1>
            <p className="text-sm text-muted-foreground">Available right now</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-4 animate-pulse">
                <div className="h-20 bg-muted rounded"></div>
              </Card>
            ))}
          </div>
        ) : mentors.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="text-6xl mb-4">⏰</div>
            <h3 className="text-lg font-semibold mb-2">No mentors available right now</h3>
            <p className="text-muted-foreground mb-4">
              Try browsing by category or check back later
            </p>
            <Button onClick={() => navigate("/home")}>
              Browse Categories
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {mentors.map((mentor) => (
              <MentorCard
                key={mentor.id}
                mentor={{
                  ...mentor,
                  profiles: mentor.profile ? {
                    full_name: mentor.profile.full_name,
                    avatar_url: mentor.profile.avatar_url,
                  } : null,
                }}
                isOnline={false}
                showAvailableNow={true}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InstantMentor;
