import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface Plan {
  id: string;
  category: string;
  plan_key: string;
  name: string;
  duration_minutes: number;
  strategy_mode: string;
  is_active: boolean;
  sort_order: number;
}

interface PlanMentorPrice {
  id: string;
  plan_id: string;
  mentor_id: string;
  price: number;
  is_enabled: boolean;
  mentor_name?: string;
}

interface MentorOption {
  id: string;
  nickname: string;
  full_name: string;
}

export default function AdminPlanManagement() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [prices, setPrices] = useState<PlanMentorPrice[]>([]);
  const [mentors, setMentors] = useState<MentorOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);

  // Add mentor dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addPlanId, setAddPlanId] = useState("");
  const [addMentorId, setAddMentorId] = useState("");
  const [addPrice, setAddPrice] = useState(0);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: plansData }, { data: pricesData }, { data: mentorsData }] = await Promise.all([
      supabase.from("plans").select("*").order("category").order("sort_order"),
      supabase.from("plan_mentor_prices").select("*"),
      supabase.from("mentors").select("id, nickname, user_id").in("status", ["approved", "active"]),
    ]);

    // Get mentor names
    const userIds = (mentorsData || []).map(m => m.user_id);
    let profileMap: Record<string, string> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", userIds);
      (profiles || []).forEach(p => { profileMap[p.id] = p.full_name || ""; });
    }

    const mentorOptions = (mentorsData || []).map(m => ({
      id: m.id,
      nickname: m.nickname || "",
      full_name: profileMap[m.user_id] || m.nickname || "Unknown",
    }));

    // Enrich prices with mentor names
    const mentorNameMap = new Map(mentorOptions.map(m => [m.id, m.full_name]));
    const enrichedPrices = (pricesData || []).map(p => ({
      ...p,
      mentor_name: mentorNameMap.get(p.mentor_id) || "Unknown",
    }));

    setPlans(plansData || []);
    setPrices(enrichedPrices);
    setMentors(mentorOptions);
    setLoading(false);
  };

  const togglePlanActive = async (planId: string, currentActive: boolean) => {
    await supabase.from("plans").update({ is_active: !currentActive }).eq("id", planId);
    toast({ title: "Updated", description: `Plan ${!currentActive ? "enabled" : "disabled"}` });
    fetchAll();
  };

  const toggleMentorEnabled = async (priceId: string, currentEnabled: boolean) => {
    await supabase.from("plan_mentor_prices").update({ is_enabled: !currentEnabled }).eq("id", priceId);
    fetchAll();
  };

  const updatePrice = async (priceId: string, newPrice: number) => {
    await supabase.from("plan_mentor_prices").update({ price: newPrice }).eq("id", priceId);
    toast({ title: "Price Updated" });
    fetchAll();
  };

  const addMentorToPlan = async () => {
    if (!addPlanId || !addMentorId || addPrice <= 0) {
      toast({ title: "Error", description: "All fields required", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("plan_mentor_prices").insert({
      plan_id: addPlanId,
      mentor_id: addMentorId,
      price: addPrice,
      is_enabled: true,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Mentor Added" });
      setAddDialogOpen(false);
      setAddMentorId("");
      setAddPrice(0);
      fetchAll();
    }
  };

  const removeMentorFromPlan = async (priceId: string) => {
    await supabase.from("plan_mentor_prices").delete().eq("id", priceId);
    toast({ title: "Removed" });
    fetchAll();
  };

  const groupedPlans = {
    jee: plans.filter(p => p.category === "jee"),
    neet: plans.filter(p => p.category === "neet"),
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading plans...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-teal-glow/5 to-background p-6">
      <div className="max-w-5xl mx-auto">
        <Button variant="ghost" onClick={() => navigate("/admin")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Plan Management</h1>
          <p className="text-muted-foreground">Manage strategy plans, pricing, and mentor assignments</p>
        </div>

        {(["jee", "neet"] as const).map(category => (
          <div key={category} className="mb-8">
            <h2 className="text-xl font-bold mb-4 uppercase tracking-wider text-primary">
              {category === "jee" ? "JEE Plans" : "NEET Plans"}
            </h2>
            <div className="space-y-4">
              {groupedPlans[category].map(plan => {
                const planPrices = prices.filter(p => p.plan_id === plan.id);
                const isExpanded = expandedPlan === plan.id;

                return (
                  <Card key={plan.id} className="glass">
                    <CardHeader className="cursor-pointer" onClick={() => setExpandedPlan(isExpanded ? null : plan.id)}>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {plan.name}
                            <Badge variant={plan.is_active ? "default" : "secondary"}>
                              {plan.is_active ? "Active" : "Disabled"}
                            </Badge>
                            <Badge variant="outline">{plan.duration_minutes}m</Badge>
                            <Badge variant="outline">{plan.strategy_mode}</Badge>
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {planPrices.length} mentors assigned
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={plan.is_active}
                            onCheckedChange={() => togglePlanActive(plan.id, plan.is_active)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                    </CardHeader>
                    {isExpanded && (
                      <CardContent>
                        <div className="space-y-3">
                          {planPrices.map(pp => (
                            <div key={pp.id} className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
                              <div className="flex-1">
                                <p className="font-medium">{pp.mentor_name}</p>
                              </div>
                              <Input
                                type="number"
                                value={pp.price}
                                onChange={(e) => {
                                  const newPrice = parseInt(e.target.value) || 0;
                                  setPrices(prev => prev.map(p => p.id === pp.id ? { ...p, price: newPrice } : p));
                                }}
                                className="w-24"
                              />
                              <Button size="sm" variant="outline" onClick={() => updatePrice(pp.id, pp.price)}>
                                <Save className="h-3 w-3" />
                              </Button>
                              <Switch
                                checked={pp.is_enabled}
                                onCheckedChange={() => toggleMentorEnabled(pp.id, pp.is_enabled)}
                              />
                              <Button size="sm" variant="destructive" onClick={() => removeMentorFromPlan(pp.id)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => { setAddPlanId(plan.id); setAddDialogOpen(true); }}
                          >
                            <Plus className="h-4 w-4 mr-2" /> Add Mentor
                          </Button>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Add Mentor Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Mentor to Plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Mentor</Label>
              <Select value={addMentorId} onValueChange={setAddMentorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select mentor" />
                </SelectTrigger>
                <SelectContent>
                  {mentors.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Price (₹)</Label>
              <Input
                type="number"
                value={addPrice}
                onChange={(e) => setAddPrice(parseInt(e.target.value) || 0)}
                placeholder="Enter price in rupees"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={addMentorToPlan}>Add Mentor</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
