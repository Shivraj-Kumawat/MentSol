import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { compareSync } from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { email, otp, password, fullName, role, phone } = await req.json();

    // Validate required fields
    if (!email || !otp || !password || !fullName) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!role || !["student", "mentor", "partner"].includes(role)) {
      return new Response(
        JSON.stringify({ error: "Invalid role" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (password.length < 8) {
      return new Response(
        JSON.stringify({ error: "Password must be at least 8 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const trimmedOtp = otp.trim();

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find latest unexpired, unverified OTP for this email
    const { data: otpRecords, error: fetchError } = await supabaseAdmin
      .from("otp_verifications")
      .select("*")
      .eq("contact", normalizedEmail)
      .eq("type", "email")
      .eq("purpose", "signup")
      .eq("verified", false)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1);

    if (fetchError) {
      console.error("OTP fetch error:", fetchError);
      return new Response(
        JSON.stringify({ error: "Failed to verify OTP. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!otpRecords || otpRecords.length === 0) {
      return new Response(
        JSON.stringify({ error: "OTP expired or not found. Please request a new one." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const otpRecord = otpRecords[0];

    // Check attempt limit (max 5)
    if ((otpRecord.attempts || 0) >= 5) {
      return new Response(
        JSON.stringify({ error: "Too many incorrect attempts. Please request a new OTP." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Increment attempts
    await supabaseAdmin
      .from("otp_verifications")
      .update({ attempts: (otpRecord.attempts || 0) + 1 })
      .eq("id", otpRecord.id);

    // Compare OTP with hash
    const isValid = compareSync(trimmedOtp, otpRecord.otp_hash);

    if (!isValid) {
      const remainingAttempts = 4 - (otpRecord.attempts || 0);
      return new Response(
        JSON.stringify({
          error: `Invalid OTP. ${remainingAttempts > 0 ? `${remainingAttempts} attempt(s) remaining.` : "Please request a new OTP."}`,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // OTP is correct - mark as verified
    await supabaseAdmin
      .from("otp_verifications")
      .update({ verified: true })
      .eq("id", otpRecord.id);

    // Create user via admin API with email_confirm: true
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: role,
      },
    });

    if (createError) {
      console.error("User creation error:", createError);
      // If user already exists, provide helpful message
      if (createError.message?.includes("already been registered") || createError.message?.includes("already exists")) {
        return new Response(
          JSON.stringify({ error: "An account with this email already exists. Please login instead." }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: "Failed to create account. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!userData?.user) {
      return new Response(
        JSON.stringify({ error: "Failed to create user account." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Clean up all OTP records for this email
    await supabaseAdmin
      .from("otp_verifications")
      .delete()
      .eq("contact", normalizedEmail)
      .eq("purpose", "signup");

    return new Response(
      JSON.stringify({ success: true, userId: userData.user.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("verify-signup-otp error:", error);
    return new Response(
      JSON.stringify({ error: "Verification failed. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
