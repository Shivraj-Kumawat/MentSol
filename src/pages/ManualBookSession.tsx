import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Shield, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { PaymentSuccessAnimation } from "@/components/PaymentSuccessAnimation";

interface PlanDetails {
  id: string;
  name: string;
  category: string;
  features: any[];
  duration_minutes: number;
  strategy_mode: string;
}

interface MentorDetails {
  mentor_id: string;
  nickname: string;
  avatar_url: string | null;
  specialization: string | null;
}

export default function ManualBookSession() {
  const { planId, mentorId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [plan, setPlan] = useState<PlanDetails | null>(null);
  const [mentor, setMentor] = useState<MentorDetails | null>(null);
  const [price, setPrice] = useState(0);
  const [problemDescription, setProblemDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<{ amount?: number; mentorName?: string }>({});
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  // Load Razorpay script
  useEffect(() => {
    if ((window as any).Razorpay) {
      setIsScriptLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setIsScriptLoaded(true);
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    if (planId && mentorId) fetchData();
  }, [planId, mentorId]);

  const fetchData = async () => {
    try {
      const [{ data: planData }, { data: mentorData }, { data: priceData }] = await Promise.all([
        supabase.from("plans").select("*").eq("id", planId).single(),
        supabase.rpc("get_public_mentor_by_id", { mentor_uuid: mentorId }),
        supabase.from("plan_mentor_prices").select("price").eq("plan_id", planId).eq("mentor_id", mentorId).eq("is_enabled", true).single(),
      ]);

      if (planData) {
        setPlan({ ...planData, features: Array.isArray(planData.features) ? planData.features.map(String) : [] });
      }
      if (mentorData?.[0]) {
        const m = mentorData[0];
        setMentor({
          mentor_id: m.mentor_id,
          nickname: m.full_name || m.nickname || "Mentor",
          avatar_url: m.avatar_url,
          specialization: m.specialization,
        });
      }
      if (priceData) {
        setPrice(priceData.price);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!problemDescription.trim()) {
      toast({ title: "Required", description: "Please describe your goals or challenges", variant: "destructive" });
      return;
    }

    if (!user) {
      toast({ title: "Login Required", description: "Please log in to continue", variant: "destructive" });
      navigate("/auth", { state: { from: window.location.pathname } });
      return;
    }

    if (!isScriptLoaded) {
      toast({ title: "Please Wait", description: "Payment gateway loading...", variant: "destructive" });
      return;
    }

    setPaymentLoading(true);

    try {
      const { data: orderData, error } = await supabase.functions.invoke("create-plan-order", {
        body: { plan_id: planId, mentor_id: mentorId, problem_description: problemDescription },
      });

      if (error || !orderData?.success) {
        throw new Error(orderData?.error || "Failed to create order");
      }

      const razorpay = new (window as any).Razorpay({
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: orderData.plan?.name || "Strategy Program",
        description: `${orderData.plan?.name} with ${orderData.notes?.mentor_name}`,
        order_id: orderData.order_id,
        prefill: orderData.prefill,
        theme: { color: "#8B5CF6" },
        handler: async (response: any) => {
          try {
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke("verify-plan-payment", {
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                session_id: orderData.session_id,
              },
            });

            if (verifyError || !verifyData?.success) {
              toast({ title: "Verification Failed", description: "Contact support with your payment details", variant: "destructive" });
            } else {
              setPaymentDetails({ amount: orderData.amount / 100, mentorName: orderData.notes?.mentor_name });
              setShowSuccess(true);
            }
          } catch {
            toast({ title: "Error", description: "Payment verification failed", variant: "destructive" });
          } finally {
            setPaymentLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setPaymentLoading(false);
            toast({ title: "Payment Cancelled", description: "You can try again anytime", variant: "destructive" });
          },
        },
      });

      razorpay.on("payment.failed", () => {
        setPaymentLoading(false);
        toast({ title: "Payment Failed", description: "Please try again", variant: "destructive" });
      });

      razorpay.open();
    } catch (error: any) {
      setPaymentLoading(false);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  if (loading || !plan || !mentor) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <>
      <PaymentSuccessAnimation
        show={showSuccess}
        onComplete={() => { setShowSuccess(false); navigate("/bookings"); }}
        amount={paymentDetails.amount}
        mentorName={paymentDetails.mentorName}
      />

      <div className="min-h-screen bg-background pb-32">
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border">
          <div className="flex items-center gap-3 p-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold">{plan.name}</h1>
              <p className="text-xs text-muted-foreground">Enroll in program</p>
            </div>
          </div>
        </header>

        <div className="p-4 space-y-4">
          {/* Mentor Card */}
          <Card className="p-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14 ring-2 ring-primary/20">
                <AvatarImage src={mentor.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                  {mentor.nickname[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-semibold">{mentor.nickname}</h3>
                {mentor.specialization && <p className="text-xs text-muted-foreground">{mentor.specialization}</p>}
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-primary">₹{price}</p>
                <p className="text-xs text-muted-foreground">{plan.duration_minutes} min</p>
              </div>
            </div>
          </Card>

          {/* Plan Features */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3">What's Included</h3>
            <div className="space-y-2">
              {plan.features.map((f, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{f}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Problem Description */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Describe your goals & challenges *</Label>
            <Textarea
              placeholder="What are your current challenges? What rank are you targeting? Any specific areas you need help with..."
              value={problemDescription}
              onChange={(e) => setProblemDescription(e.target.value)}
              className="min-h-[120px] resize-none"
            />
            <p className="text-xs text-muted-foreground">This helps your mentor prepare a personalized strategy</p>
          </div>

          <Card className="p-3 bg-muted/30">
            <p className="text-xs text-muted-foreground">
              ℹ️ After payment, our team will connect you with your selected mentor within 24 hours. 
              You'll receive a notification once your mentor is assigned and ready.
            </p>
          </Card>
        </div>

        {/* Fixed Footer */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border p-4 pb-safe">
          <div className="max-w-lg mx-auto space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Program total</span>
              <span className="text-lg font-bold">₹{price}</span>
            </div>
            <Button
              onClick={handlePayment}
              disabled={!problemDescription.trim() || paymentLoading}
              className="w-full h-14 text-base font-semibold bg-gradient-to-r from-primary to-primary/90 shadow-lg shadow-primary/25"
              size="lg"
            >
              {paymentLoading ? (
                <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />Processing...</>
              ) : (
                <><span className="mr-2">💳</span>Pay ₹{price} & Start Program</>
              )}
            </Button>
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5" />
                <span>Secure payment</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
