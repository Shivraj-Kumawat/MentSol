import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.83.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // ---------- CORS ----------
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

    // Get authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("Missing or invalid authorization header");
      throw new Error("Authorization required");
    }

    const token = authHeader.replace("Bearer ", "");
    console.log("Token extracted, verifying user...");

    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser(token);

    if (userError || !user?.id) {
      console.error("Auth error:", userError);
      throw new Error("Invalid authentication");
    }

    const userId = user.id;
    console.log("Authenticated user:", userId);

    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { mentor_id, slot_id, problem_description, selected_duration, selected_start_time, selected_date, referral_code } = await req.json();

    // ================= VALIDATIONS =================

    const { data: mentorData } = await supabaseClient
      .from("mentors")
      .select("id, status, fixed_rate_per_15m, fixed_rate_per_30m, fixed_rate_per_45m, nickname")
      .eq("id", mentor_id)
      .single();

    if (!mentorData || mentorData.status !== "approved") {
      throw new Error("Mentor not available");
    }

    // slot_id is now the availability range ID
    const { data: rangeData } = await supabaseClient
      .from("mentor_availability")
      .select("id, status, duration_minutes, mentor_id, date, start_time, end_time, google_meet_link")
      .eq("id", slot_id)
      .single();

    if (!rangeData || rangeData.status !== "available") {
      throw new Error("Slot not available");
    }

    // Determine the actual start time for the session
    const sessionStartTime = selected_start_time || rangeData.start_time;
    const sessionDate = selected_date || rangeData.date;

    // Validate that the selected start time falls within the range
    if (selected_start_time) {
      const [selH, selM] = selected_start_time.split(":").map(Number);
      const [rangeStartH, rangeStartM] = rangeData.start_time.split(":").map(Number);
      const [rangeEndH, rangeEndM] = rangeData.end_time.split(":").map(Number);
      const selTotal = selH * 60 + selM;
      const rangeStartTotal = rangeStartH * 60 + rangeStartM;
      const rangeEndTotal = rangeEndH * 60 + rangeEndM;

      if (selTotal < rangeStartTotal || selTotal > rangeEndTotal) {
        throw new Error("Selected time is outside the mentor's availability range");
      }
    }

    const resolvedDuration = Number(selected_duration);
    const durationMinutes = [30, 60].includes(resolvedDuration)
      ? resolvedDuration
      : (rangeData.duration_minutes || 30);
    let baseAmountRupees: number;
    
    // Try to load admin-configurable default prices
    const { data: priceSettings } = await supabaseClient
      .from("platform_settings")
      .select("setting_key, setting_value")
      .in("setting_key", ["session_price_30m", "session_price_60m"]);
    
    const prices: Record<string, number> = {};
    (priceSettings || []).forEach((s: any) => {
      const val = s.setting_value?.value;
      if (val) prices[s.setting_key] = val;
    });

    // Priority: mentor-specific admin-set price -> global default -> legacy fallback
    if (durationMinutes === 60 && mentorData.fixed_rate_per_45m && mentorData.fixed_rate_per_45m > 0) {
      baseAmountRupees = mentorData.fixed_rate_per_45m;
    } else if (durationMinutes === 30 && mentorData.fixed_rate_per_30m && mentorData.fixed_rate_per_30m > 0) {
      baseAmountRupees = mentorData.fixed_rate_per_30m;
    } else if (durationMinutes === 60 && prices.session_price_60m) {
      baseAmountRupees = prices.session_price_60m;
    } else if (durationMinutes === 30 && prices.session_price_30m) {
      baseAmountRupees = prices.session_price_30m;
    } else if (mentorData.fixed_rate_per_15m && mentorData.fixed_rate_per_15m > 0) {
      baseAmountRupees = Math.ceil((mentorData.fixed_rate_per_15m * durationMinutes) / 15);
    } else {
      baseAmountRupees = durationMinutes >= 60 ? (prices.session_price_60m || 249) : (prices.session_price_30m || 149);
    }

    // ================= REFERRAL DISCOUNT =================
    let discountAmount = 0;
    let validatedPromoterId: string | null = null;
    let validatedReferralCode: string | null = null;

    if (referral_code && typeof referral_code === 'string' && referral_code.trim().length > 0) {
      const cleanCode = referral_code.trim();
      console.log("Validating referral code:", cleanCode);

      // Look up promoter by short_ref or code (case-insensitive)
      const { data: promoter } = await supabaseClient
        .from("promoters")
        .select("id, short_ref, code")
        .or(`short_ref.ilike.${cleanCode},code.ilike.${cleanCode}`)
        .maybeSingle();

      if (promoter) {
        discountAmount = 50; // ₹50 flat discount
        validatedPromoterId = promoter.id;
        validatedReferralCode = cleanCode;
        console.log("Referral discount applied: ₹50, promoter:", promoter.id);
      } else {
        console.log("Invalid referral code, no discount applied:", cleanCode);
        // Don't throw error - just skip discount
      }
    }

    const finalAmountRupees = Math.max(baseAmountRupees - discountAmount, 1); // Minimum ₹1
    const amountInPaise = Math.max(finalAmountRupees * 100, 100);

    console.log("Price resolved:", { durationMinutes, baseAmountRupees, discountAmount, finalAmountRupees, amountInPaise });

    // ================= CREATE SESSION =================

    const scheduledAt = new Date(`${sessionDate}T${sessionStartTime}:00+05:30`);

    const { data: sessionData, error: sessionError } = await supabaseClient
      .from("sessions")
      .insert({
        student_id: userId,
        mentor_id,
        slot_id: slot_id,
        scheduled_at: scheduledAt.toISOString(),
        amount_paid: finalAmountRupees,
        status: "pending_payment",
        pre_session_brief: {
          problem_description: problem_description || "",
          submitted_at: new Date().toISOString(),
          referral_code: validatedReferralCode || undefined,
          original_price: baseAmountRupees,
          discount_amount: discountAmount,
        },
      })
      .select()
      .single();

    if (sessionError || !sessionData) {
      console.error("Session creation error:", sessionError);
      throw new Error("Failed to create session");
    }

    // ================= RAZORPAY =================

    const razorpayRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Basic " + btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`),
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: "INR",
        receipt: `sess_${sessionData.id.slice(0, 8)}`,
      }),
    });

    if (!razorpayRes.ok) {
      const errBody = await razorpayRes.text();
      console.error("Razorpay order creation failed:", errBody);
      throw new Error("Failed to create Razorpay order");
    }

    const razorpayOrder = await razorpayRes.json();

    console.log("Razorpay order created successfully:", razorpayOrder.id);

    return new Response(
      JSON.stringify({
        success: true,
        order_id: razorpayOrder.id,
        session_id: sessionData.id,
        amount: amountInPaise,
        currency: "INR",
        key_id: RAZORPAY_KEY_ID,
        original_price: baseAmountRupees,
        discount_amount: discountAmount,
        final_price: finalAmountRupees,
        referral_code: validatedReferralCode,
        promoter_id: validatedPromoterId,
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
    console.error("create-razorpay-order error:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
