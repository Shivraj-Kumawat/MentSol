import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.83.0";
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!RAZORPAY_KEY_SECRET) {
      throw new Error("Payment gateway not configured");
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, session_id } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !session_id) {
      throw new Error("Missing required payment details");
    }

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      throw new Error("Payment verification failed - invalid signature");
    }

    console.log("Plan payment signature verified");

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Get session
    const { data: sessionData, error: sessionError } = await supabase
      .from("sessions")
      .select("*")
      .eq("id", session_id)
      .single();

    if (sessionError || !sessionData) {
      throw new Error("Session not found");
    }

    // Idempotency check
    if (sessionData.status === "confirmed" || sessionData.status === "awaiting_mentor_connect") {
      return new Response(
        JSON.stringify({ success: true, message: "Payment already verified" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Update payment record
    await supabase
      .from("payments")
      .update({
        razorpay_payment_id,
        razorpay_signature,
        status: "captured",
        updated_at: new Date().toISOString(),
      })
      .eq("razorpay_order_id", razorpay_order_id);

    // Calculate fees
    const amountPaid = sessionData.amount_paid || 0;
    const platformFee = Math.round(amountPaid * 0.1);
    const mentorEarning = amountPaid - platformFee;

    // For manual_connect plans: status = awaiting_mentor_connect (no calendar, no slot)
    // For auto_slot plans (shouldn't reach here, but safeguard): status = confirmed
    const isManual = sessionData.strategy_mode === "manual_connect";
    const newStatus = isManual ? "awaiting_mentor_connect" : "confirmed";

    await supabase
      .from("sessions")
      .update({
        status: newStatus,
        payment_id: razorpay_payment_id,
        platform_fee: platformFee,
        mentor_earning: mentorEarning,
        updated_at: new Date().toISOString(),
      })
      .eq("id", session_id);

    // Get mentor details for notifications
    const { data: mentorData } = await supabase
      .from("mentors")
      .select("nickname, user_id")
      .eq("id", sessionData.mentor_id)
      .single();

    // Notify student
    await supabase.from("notifications").insert({
      user_id: sessionData.student_id,
      type: "payment_success",
      title: "✅ Payment Successful!",
      message: `Your payment of ₹${amountPaid} was successful. ${isManual ? "Our team will connect you with your mentor shortly." : "Session confirmed!"}`,
      is_pinned: true,
      is_read: false,
      metadata: {
        session_id,
        payment_id: razorpay_payment_id,
        amount: amountPaid,
        action_url: "/bookings",
      },
    });

    // Notify mentor
    if (mentorData?.user_id) {
      await supabase.from("notifications").insert({
        user_id: mentorData.user_id,
        type: "new_booking",
        title: "🎉 New Program Enrollment!",
        message: `A student has enrolled in a strategy program with you. ${isManual ? "Admin will coordinate the connection." : ""}`,
        is_pinned: false,
        is_read: false,
        metadata: {
          session_id,
          student_id: sessionData.student_id,
          action_url: "/mentor/sessions",
        },
      });
    }

    // Notify admins for manual connect sessions
    if (isManual) {
      await supabase.rpc("notify_all_admins", {
        notification_type: "manual_session",
        notification_title: "🔗 Manual Connect Required",
        notification_message: `New ${sessionData.plan_type || "program"} session requires mentor connection. Amount: ₹${amountPaid}`,
        metadata_json: {
          session_id,
          mentor_id: sessionData.mentor_id,
          student_id: sessionData.student_id,
          plan_type: sessionData.plan_type,
          action_url: "/admin/sessions",
        },
      });
    }

    return new Response(
      JSON.stringify({ success: true, status: newStatus }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("verify-plan-payment error:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
