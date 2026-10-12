import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Rocket, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

interface Plan {
  id: string;
  plan_key: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  features: any[];
  strategy_mode: string;
  sort_order: number;
}

const STRATEGY_FEATURES = [
  "Weekly one-to-one mentor session",
  "Study analysis and tracking",
  "Marks analysis",
  "Unlimited mentor chat",
  "Study materials",
];

export default function NeetPlans() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      const { data } = await supabase
        .from("plans")
        .select("*")
        .eq("category", "neet")
        .eq("is_active", true)
        .order("sort_order");
      setPlans((data || []).map(p => ({ ...p, features: Array.isArray(p.features) ? p.features.map(String) : [] })));
      setLoading(false);
    };
    fetchPlans();
  }, []);

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
          <Button variant="ghost" size="icon" onClick={() => navigate("/home")}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold">NEET Strategy Plan</h1>
            <p className="text-xs text-muted-foreground">MentSol Strategy Plan</p>
          </div>
        </div>
      </header>

      <div className="px-4 pt-6 space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="overflow-hidden border-primary/30 shadow-lg shadow-primary/5">
            <div className="h-2 bg-gradient-to-r from-primary to-primary/70" />
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
                    <Rocket className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">MentSol Strategy Plan</h3>
                    <p className="text-sm text-muted-foreground">60 Days • NEET Focus</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">₹999</p>
                  <Badge className="bg-primary/10 text-primary border-primary/20 mt-1">60 Days</Badge>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                Complete 60-day structured strategy program to boost your NEET score with personalized mentoring.
              </p>

              <div className="space-y-3 mb-6">
                {STRATEGY_FEATURES.map((feature, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-sm">
                    <CheckCircle className="h-4.5 w-4.5 text-primary shrink-0 mt-0.5" />
                    <span className="text-foreground">{feature}</span>
                  </div>
                ))}
              </div>

              {plans.length > 0 ? (
                <Button
                  className="w-full h-12 text-base font-semibold"
                  onClick={() => navigate(`/plan/${plans[0].id}/mentors`)}
                >
                  Get Started — ₹999 →
                </Button>
              ) : (
                <Button className="w-full h-12 text-base font-semibold" disabled>
                  Coming Soon
                </Button>
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
