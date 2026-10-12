import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.83.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RAZORPAY_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID");
    const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET || !SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Server configuration missing");
    }

    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      throw new Error("Authorization required");
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser(token);

    if (userError || !user?.id) {
      throw new Error("Invalid authentication");
    }

    const userId = user.id;
    console.log("Authenticated user:", userId);

    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { plan_id, mentor_id, problem_description } = await req.json();

    if (!plan_id || !mentor_id) {
      throw new Error("plan_id and mentor_id are required");
    }

    // Validate plan exists and is active
    const { data: planData, error: planError } = await supabaseClient
      .from("plans")
      .select("*")
      .eq("id", plan_id)
      .eq("is_active", true)
      .single();

    if (planError || !planData) {
      throw new Error("Plan not found or inactive");
    }

    // Validate mentor is approved
    const { data: mentorData } = await supabaseClient
      .from("mentors")
      .select("id, status, nickname")
      .eq("id", mentor_id)
      .single();

    if (!mentorData || mentorData.status !== "approved") {
      throw new Error("Mentor not available");
    }

    // Get price from plan_mentor_prices
    const { data: priceData } = await supabaseClient
      .from("plan_mentor_prices")
      .select("price")
      .eq("plan_id", plan_id)
      .eq("mentor_id", mentor_id)
      .eq("is_enabled", true)
      .single();

    if (!priceData || priceData.price <= 0) {
      throw new Error("No pricing configured for this mentor and plan");
    }

    const baseAmountRupees = priceData.price;
    const amountInPaise = Math.max(baseAmountRupees * 100, 100);

    // Determine plan_type from plan_key
    let planType = "starter";
    if (planData.plan_key.includes("builder")) planType = "builder";
    else if (planData.plan_key.includes("elite") || planData.plan_key.includes("accelerator")) planType = "elite";
    else if (planData.plan_key.includes("command") || planData.plan_key.includes("intensive")) planType = "command";

    // Create session with plan metadata
    const { data: sessionData, error: sessionError } = await supabaseClient
      .from("sessions")
      .insert({
        student_id: userId,
        mentor_id,
        slot_id: null,
        scheduled_at: null,
        amount_paid: baseAmountRupees,
        status: "pending_payment",
        category: planData.category,
        plan_id: plan_id,
        plan_type: planType,
        manual_assign_required: planData.strategy_mode === "manual_connect",
        strategy_mode: planData.strategy_mode,
        mentor_connected: false,
        chat_access_enabled: false,
        program_started: false,
        pre_session_brief: {
          problem_description: problem_description || "",
          submitted_at: new Date().toISOString(),
          plan_name: planData.name,
        },
      })
      .select()
      .single();

    if (sessionError || !sessionData) {
      console.error("Session creation error:", sessionError);
      throw new Error("Failed to create session");
    }

    // Create Razorpay order
    const razorpayRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Basic " + btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`),
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: "INR",
        receipt: `plan_${sessionData.id.slice(0, 8)}`,
      }),
    });

    if (!razorpayRes.ok) {
      throw new Error("Failed to create Razorpay order");
    }

    const razorpayOrder = await razorpayRes.json();
    console.log("Plan order created:", razorpayOrder.id);

    // Create payment record
    await supabaseClient.from("payments").insert({
      session_id: sessionData.id,
      amount: amountInPaise,
      razorpay_order_id: razorpayOrder.id,
      status: "created",
    });

    return new Response(
      JSON.stringify({
        success: true,
        order_id: razorpayOrder.id,
        session_id: sessionData.id,
        amount: amountInPaise,
        currency: "INR",
        key_id: RAZORPAY_KEY_ID,
        plan: {
          name: planData.name,
          category: planData.category,
          strategy_mode: planData.strategy_mode,
        },
        notes: {
          mentor_name: mentorData.nickname || "Mentor",
        },
        prefill: {
          name: user.user_metadata?.full_name || "",
          email: user.email || "",
          contact: user.phone || "",
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("create-plan-order error:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
