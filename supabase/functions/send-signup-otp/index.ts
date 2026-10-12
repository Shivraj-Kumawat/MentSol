import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { hashSync } from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";
import nodemailer from "npm:nodemailer@6.9.10";

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
    const { email } = await req.json();

    // Validate email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email address" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if email already exists in auth
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const emailExists = existingUsers?.users?.some(
      (u) => u.email?.toLowerCase() === normalizedEmail
    );
    if (emailExists) {
      return new Response(
        JSON.stringify({ error: "An account with this email already exists. Please login instead." }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Rate limit: max 3 OTPs per email in last 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data: recentOtps, error: countError } = await supabaseAdmin
      .from("otp_verifications")
      .select("id")
      .eq("contact", normalizedEmail)
      .eq("type", "email")
      .eq("purpose", "signup")
      .gte("created_at", tenMinutesAgo);

    if (countError) {
      console.error("Rate limit check error:", countError);
    }

    if (recentOtps && recentOtps.length >= 3) {
      return new Response(
        JSON.stringify({ error: "Too many OTP requests. Please wait 10 minutes before trying again." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate 6-digit OTP
    const otpArray = new Uint32Array(1);
    crypto.getRandomValues(otpArray);
    const otp = String(otpArray[0] % 1000000).padStart(6, "0");

    // Hash OTP with bcrypt
    const otpHash = hashSync(otp);

    // Store OTP in database
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    const { error: insertError } = await supabaseAdmin
      .from("otp_verifications")
      .insert({
        contact: normalizedEmail,
        type: "email",
        otp_hash: otpHash,
        purpose: "signup",
        expires_at: expiresAt,
        attempts: 0,
        verified: false,
        resend_count: (recentOtps?.length || 0),
      });

    if (insertError) {
      console.error("OTP insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to generate OTP. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send OTP via Zoho SMTP
    const smtpUser = Deno.env.get("ZOHO_SMTP_USER");
    const smtpPass = Deno.env.get("ZOHO_SMTP_PASS");

    if (!smtpUser || !smtpPass) {
      console.error("SMTP credentials not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured. Please contact support." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const transporter = nodemailer.createTransport({
      host: "smtp.zoho.in",
      port: 587,
      secure: false,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const htmlEmail = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 24px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:-0.5px;">MentSol</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Email Verification</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 24px;">
              <p style="margin:0 0 8px;color:#374151;font-size:16px;">Hi there,</p>
              <p style="margin:0 0 24px;color:#6b7280;font-size:14px;line-height:1.6;">
                Use the verification code below to complete your MentSol signup. This code expires in <strong>5 minutes</strong>.
              </p>
              
              <!-- OTP Box -->
              <div style="background-color:#f8fafc;border:2px dashed #6366f1;border-radius:12px;padding:24px;text-align:center;margin:0 0 24px;">
                <p style="margin:0 0 8px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:2px;">Your Verification Code</p>
                <p style="margin:0;color:#1f2937;font-size:36px;font-weight:700;letter-spacing:8px;">${otp}</p>
              </div>
              
              <!-- Warning -->
              <div style="background-color:#fef3c7;border-radius:8px;padding:12px 16px;margin:0 0 24px;">
                <p style="margin:0;color:#92400e;font-size:13px;">
                  ⚠️ <strong>Do not share this code with anyone.</strong> MentSol will never ask for your OTP.
                </p>
              </div>
              
              <p style="margin:0;color:#9ca3af;font-size:13px;line-height:1.5;">
                If you didn't request this code, please ignore this email.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f9fafb;padding:20px 24px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">
                © ${new Date().getFullYear()} MentSol. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    await transporter.sendMail({
      from: `"MentSol" <${smtpUser}>`,
      to: normalizedEmail,
      subject: "Your MentSol Verification Code",
      html: htmlEmail,
    });

    return new Response(
      JSON.stringify({ success: true, message: "OTP sent to your email" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("send-signup-otp error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to send OTP. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
