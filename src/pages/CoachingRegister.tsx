import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const CoachingRegister = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    coaching_name: "",
    phone: "",
    email: "",
    coaching_type: "both",
    student_count: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.coaching_name.trim() || !form.phone.trim() || !form.email.trim()) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast({ title: "Please enter a valid email", variant: "destructive" });
      return;
    }

    if (form.phone.replace(/\D/g, "").length < 10) {
      toast({ title: "Please enter a valid phone number", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("coaching_requests" as any).insert({
        coaching_name: form.coaching_name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim().toLowerCase(),
        coaching_type: form.coaching_type,
        student_count: form.student_count || null,
      } as any);

      if (error) throw error;
      navigate("/coaching/success", { replace: true });
    } catch (err: any) {
      console.error("Coaching registration error:", err);
      toast({ title: "Submission failed", description: "Please try again later.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-lg border-b border-border/50 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/coaching")} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <span className="font-semibold text-foreground">Register Your Coaching</span>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8">
        <Card className="p-6 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <Building2 className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Coaching Registration</h2>
            <p className="text-sm text-muted-foreground">Fill in your details and our team will connect with you</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Coaching Name *</Label>
              <Input
                id="name"
                placeholder="e.g. ABC Academy"
                value={form.coaching_name}
                onChange={(e) => setForm({ ...form, coaching_name: e.target.value })}
                maxLength={100}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Contact Number *</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="e.g. 9876543210"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                maxLength={15}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="e.g. info@coaching.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                maxLength={255}
                required
              />
            </div>

            <div className="space-y-3">
              <Label>Coaching Type *</Label>
              <RadioGroup
                value={form.coaching_type}
                onValueChange={(v) => setForm({ ...form, coaching_type: v })}
                className="flex gap-4"
              >
                {[
                  { value: "jee", label: "JEE" },
                  { value: "neet", label: "NEET" },
                  { value: "both", label: "Both" },
                ].map((opt) => (
                  <div key={opt.value} className="flex items-center gap-2">
                    <RadioGroupItem value={opt.value} id={`type-${opt.value}`} />
                    <Label htmlFor={`type-${opt.value}`} className="cursor-pointer">{opt.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Number of Students</Label>
              <Select
                value={form.student_count}
                onValueChange={(v) => setForm({ ...form, student_count: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-50">1 – 50</SelectItem>
                  <SelectItem value="50-200">50 – 200</SelectItem>
                  <SelectItem value="200-500">200 – 500</SelectItem>
                  <SelectItem value="500+">500+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Submitting..." : "Submit Application"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default CoachingRegister;
