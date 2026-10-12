import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Star, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";

interface PlanMentor {
  mentor_id: string;
  price: number;
  nickname: string | null;
  full_name: string | null;
  avatar_url: string | null;
  specialization: string | null;
  rating: number | null;
  total_sessions: number | null;
}

interface PlanInfo {
  id: string;
  name: string;
  category: string;
  strategy_mode: string;
  duration_minutes: number;
}

export default function PlanMentorSelect() {
  const { planId } = useParams();
  const navigate = useNavigate();
  const [mentors, setMentors] = useState<PlanMentor[]>([]);
  const [plan, setPlan] = useState<PlanInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (planId) fetchData();
  }, [planId]);

  const fetchData = async () => {
    try {
      // Fetch plan info
      const { data: planData } = await supabase
        .from("plans")
        .select("id, name, category, strategy_mode, duration_minutes")
        .eq("id", planId)
        .single();

      if (!planData) {
        navigate("/home");
        return;
      }
      setPlan(planData);

      // Fetch mentors with pricing for this plan
      const { data: priceData } = await supabase
        .from("plan_mentor_prices")
        .select("mentor_id, price")
        .eq("plan_id", planId)
        .eq("is_enabled", true);

      if (!priceData || priceData.length === 0) {
        setMentors([]);
        setLoading(false);
        return;
      }

      // Get mentor details via public function
      const { data: allMentors } = await supabase.rpc("get_all_public_mentor_profiles");

      const mentorMap = new Map((allMentors || []).map((m: any) => [m.mentor_id, m]));

      const enriched: PlanMentor[] = priceData
        .map(p => {
          const m = mentorMap.get(p.mentor_id) as any;
          if (!m) return null;
          return {
            mentor_id: p.mentor_id,
            price: p.price,
            nickname: m.full_name || m.nickname || "Mentor",
            full_name: m.full_name,
            avatar_url: m.avatar_url,
            specialization: m.specialization,
            rating: m.rating,
            total_sessions: m.total_sessions,
          };
        })
        .filter(Boolean) as PlanMentor[];

      setMentors(enriched);
    } catch (error) {
      console.error("Error fetching plan mentors:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMentor = (mentor: PlanMentor) => {
    if (!plan) return;

    if (plan.strategy_mode === "auto_slot") {
      // Starter plan: go to existing BookSession flow
      navigate(`/mentor/${mentor.mentor_id}/book`);
    } else {
      // Manual connect: go to manual booking page
      navigate(`/plan/${planId}/mentor/${mentor.mentor_id}/book`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold">Select Your Mentor</h1>
            <p className="text-xs text-muted-foreground">{plan?.name}</p>
          </div>
        </div>
      </header>

      <div className="px-4 pt-6 space-y-3">
        {mentors.length === 0 ? (
          <Card className="p-8 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="font-semibold">No mentors available</p>
            <p className="text-sm text-muted-foreground mt-1">
              Mentors will be added to this plan soon.
            </p>
          </Card>
        ) : (
          mentors.map((mentor) => (
            <Card
              key={mentor.mentor_id}
              className="p-4 cursor-pointer hover:border-primary/30 transition-all"
              onClick={() => handleSelectMentor(mentor)}
            >
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14 ring-2 ring-primary/10">
                  <AvatarImage src={mentor.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {(mentor.nickname || "M")[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{mentor.nickname}</h3>
                  {mentor.specialization && (
                    <p className="text-xs text-muted-foreground truncate">{mentor.specialization}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {mentor.rating || "New"}
                    </span>
                    <span>{mentor.total_sessions || 0} sessions</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary">₹{mentor.price}</p>
                  <p className="text-xs text-muted-foreground">{plan?.duration_minutes} min</p>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
