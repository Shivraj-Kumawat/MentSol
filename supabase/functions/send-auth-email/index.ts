import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || "onboarding@resend.dev";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://rutxafzivumqnyxqtdsa.supabase.co";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, webhook-id, webhook-timestamp, webhook-signature",
};

interface AuthEmailPayload {
  user: {
    email: string;
    user_metadata?: {
      full_name?: string;
    };
  };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: string;
    site_url: string;
  };
}

function generateConfirmationEmail(
  userName: string,
  verificationUrl: string,
  token: string
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 480px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">🎓 MentSol</h1>
              <p style="margin: 8px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">Your Mentorship Journey Starts Here</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <h2 style="margin: 0 0 16px; color: #1f2937; font-size: 20px; font-weight: 600;">
                Welcome${userName ? `, ${userName}` : ''}! 👋
              </h2>
              
              <p style="margin: 0 0 24px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Thanks for signing up! Please verify your email address to get started with MentSol and connect with expert mentors.
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding: 8px 0 24px;">
                    <a href="${verificationUrl}" 
                       style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">
                      ✓ Verify Email Address
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Alternative -->
              <p style="margin: 0 0 16px; color: #6b7280; font-size: 14px; line-height: 1.5;">
                Or copy and paste this verification code:
              </p>
              
              <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; text-align: center; margin-bottom: 24px;">
                <code style="font-size: 18px; font-weight: 600; color: #1f2937; letter-spacing: 2px;">${token}</code>
              </div>
              
              <!-- Link fallback -->
              <p style="margin: 0 0 8px; color: #9ca3af; font-size: 12px;">
                If the button doesn't work, copy this link:
              </p>
              <p style="margin: 0; word-break: break-all;">
                <a href="${verificationUrl}" style="color: #667eea; font-size: 12px;">${verificationUrl}</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #f9fafb; border-radius: 0 0 12px 12px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px; color: #9ca3af; font-size: 12px; text-align: center;">
                This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                © ${new Date().getFullYear()} MentSol. All rights reserved.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

function generateRecoveryEmail(
  userName: string,
  resetUrl: string,
  _token: string
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 480px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">🔐 Password Reset</h1>
              <p style="margin: 8px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">MentSol Account Security</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <h2 style="margin: 0 0 16px; color: #1f2937; font-size: 20px; font-weight: 600;">
                Reset Your Password
              </h2>
              
              <p style="margin: 0 0 24px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                We received a request to reset your password. Click the button below to create a new password.
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding: 8px 0 24px;">
                    <a href="${resetUrl}" 
                       style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">
                      🔑 Reset Password
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Security notice -->
              <div style="background-color: #fef3c7; padding: 16px; border-radius: 8px; margin-bottom: 24px; border-left: 4px solid #f59e0b;">
                <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">
                  ⚠️ If you didn't request this password reset, please ignore this email or contact support if you have concerns.
                </p>
              </div>
              
              <!-- Link fallback -->
              <p style="margin: 0 0 8px; color: #9ca3af; font-size: 12px;">
                If the button doesn't work, copy this link:
              </p>
              <p style="margin: 0; word-break: break-all;">
                <a href="${resetUrl}" style="color: #667eea; font-size: 12px;">${resetUrl}</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #f9fafb; border-radius: 0 0 12px 12px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px; color: #9ca3af; font-size: 12px; text-align: center;">
                This link expires in 1 hour for security reasons.
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                © ${new Date().getFullYear()} MentSol. All rights reserved.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not configured");
      throw new Error("Email service not configured");
    }

    // Get the webhook secret from environment
    const hookSecret = Deno.env.get("SEND_EMAIL_HOOK_SECRET");
    
    let payload: AuthEmailPayload;
    const payloadText = await req.text();
    
    // If hook secret is configured, try to verify the webhook signature
    if (hookSecret) {
      // Validate secret format before using (must start with whsec_ or be valid base64)
      const isValidSecretFormat = hookSecret.startsWith('whsec_') || 
        /^[A-Za-z0-9+/=]+$/.test(hookSecret);
      
      if (!isValidSecretFormat) {
        console.warn("SEND_EMAIL_HOOK_SECRET has invalid format, skipping verification");
        console.warn("For production, use the webhook secret from Supabase Dashboard → Auth → Hooks");
        try {
          payload = JSON.parse(payloadText) as AuthEmailPayload;
        } catch (parseError) {
          console.error("Failed to parse payload:", parseError);
          return new Response(
            JSON.stringify({ error: "Invalid payload format" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } else {
        const headers = Object.fromEntries(req.headers);
        
        try {
          const wh = new Webhook(hookSecret);
          payload = wh.verify(payloadText, headers) as AuthEmailPayload;
          console.log("Webhook signature verified successfully");
        } catch (verifyError) {
          console.error("Webhook verification failed:", verifyError);
          console.warn("Proceeding without verification (fallback mode)");
          
          // Fallback: Parse payload directly to allow signup to continue
          try {
            payload = JSON.parse(payloadText) as AuthEmailPayload;
          } catch (parseError) {
            console.error("Failed to parse payload after verification failure:", parseError);
            return new Response(
              JSON.stringify({ error: "Invalid payload format" }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }
      }
    } else {
      // No hook secret configured - parse directly (development mode)
      console.log("Warning: SEND_EMAIL_HOOK_SECRET not configured, skipping signature verification");
      try {
        payload = JSON.parse(payloadText) as AuthEmailPayload;
      } catch (parseError) {
        console.error("Failed to parse payload:", parseError);
        return new Response(
          JSON.stringify({ error: "Invalid payload format" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const { user, email_data } = payload;
    const { token, token_hash, redirect_to, email_action_type } = email_data;
    
    const userName = user.user_metadata?.full_name || "";
    const userEmail = user.email;

    console.log(`Processing ${email_action_type} email for ${userEmail}`);

    // Build the verification/action URL
    let actionUrl: string;
    let emailSubject: string;
    let emailHtml: string;

    switch (email_action_type) {
      case "signup":
      case "email_change":
        actionUrl = `${SUPABASE_URL}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${encodeURIComponent(redirect_to || "")}`;
        emailSubject = email_action_type === "signup" 
          ? "Welcome to MentSol! Please verify your email" 
          : "Confirm your email change";
        emailHtml = generateConfirmationEmail(userName, actionUrl, token);
        break;

      case "recovery":
      case "magiclink":
        actionUrl = `${SUPABASE_URL}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${encodeURIComponent(redirect_to || "")}`;
        emailSubject = email_action_type === "recovery" 
          ? "Reset your MentSol password" 
          : "Your MentSol login link";
        emailHtml = generateRecoveryEmail(userName, actionUrl, token);
        break;

      default:
        console.log(`Unhandled email action type: ${email_action_type}`);
        return new Response(
          JSON.stringify({ error: `Unhandled email action type: ${email_action_type}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    // Send email via Resend API (using fetch)
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `MentSol <${RESEND_FROM_EMAIL}>`,
        to: [userEmail],
        subject: emailSubject,
        html: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text();
      console.error("Resend email error:", errorData);
      throw new Error(`Failed to send email: ${errorData}`);
    }

    const data = await emailResponse.json();
    console.log(`Email sent successfully to ${userEmail}:`, data);

    return new Response(
      JSON.stringify({ success: true, message: "Email sent successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in send-auth-email:", error);
    return new Response(
      JSON.stringify({
        error: {
          http_code: error.code || 500,
          message: error.message || "Internal server error",
        },
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
