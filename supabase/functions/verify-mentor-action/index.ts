import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.83.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    const action = url.searchParams.get("action"); // 'accept' or 'reject'

    if (!token || !action) {
      throw new Error("Missing token or action parameter");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find mentor by verification token
    const { data: mentor, error: mentorError } = await supabase
      .from("mentors")
      .select(`
        *,
        profiles:user_id (
          full_name,
          email
        )
      `)
      .eq("verification_token", token)
      .single();

    if (mentorError || !mentor) {
      return new Response(
        `<html><body style="font-family: Arial; text-align: center; padding: 50px;">
          <h1 style="color: #ef4444;">Invalid or Expired Link</h1>
          <p>This verification link is invalid or has already been used.</p>
        </body></html>`,
        { headers: { "Content-Type": "text/html", ...corsHeaders } }
      );
    }

    // Check if token is expired
    const expiresAt = new Date(mentor.verification_expires_at);
    if (expiresAt < new Date()) {
      return new Response(
        `<html><body style="font-family: Arial; text-align: center; padding: 50px;">
          <h1 style="color: #f59e0b;">Link Expired</h1>
          <p>This verification link has expired. Please contact the mentor to resubmit.</p>
        </body></html>`,
        { headers: { "Content-Type": "text/html", ...corsHeaders } }
      );
    }

    const profile = mentor.profiles as any;
    const newStatus = action === "accept" ? "active" : "rejected";

    // Update mentor status
    const { error: updateError } = await supabase
      .from("mentors")
      .update({
        status: newStatus,
        verification_token: null, // Clear token after use
        verification_expires_at: null,
      })
      .eq("id", mentor.id);

    if (updateError) {
      throw updateError;
    }

    // Send confirmation email to mentor
    const statusMessage = action === "accept" 
      ? "Your mentor application has been approved! You can now start accepting sessions."
      : "Unfortunately, your mentor application was not approved at this time. Please contact us for more information.";

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: ${action === 'accept' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'}; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">
            ${action === 'accept' ? '🎉 Application Approved!' : '📋 Application Update'}
          </h1>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <p style="font-size: 16px; color: #374151; line-height: 1.6;">
            Hi ${profile.full_name},
          </p>
          
          <p style="font-size: 16px; color: #374151; line-height: 1.6;">
            ${statusMessage}
          </p>

          ${action === 'accept' ? `
            <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #065f46;"><strong>Next Steps:</strong></p>
              <ul style="color: #065f46; margin: 10px 0;">
                <li>Set up your availability in the Mentor Dashboard</li>
                <li>Complete your profile with additional details</li>
                <li>Start accepting session bookings from students</li>
              </ul>
            </div>
          ` : ''}

          <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
            Best regards,<br>
            <strong>MentSol Team</strong>
          </p>
        </div>
      </div>
    `;

    if (profile.email) {
      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: "MentSol <onboarding@resend.dev>",
          to: [profile.email],
          subject: action === "accept" ? "Your MentSol Mentor Application - Approved!" : "MentSol Mentor Application Update",
          html: emailHtml,
        }),
      });

      if (!emailResponse.ok) {
        console.error("Failed to send confirmation email:", await emailResponse.text());
      }
    }

    console.log(`Mentor ${action}ed successfully:`, mentor.id);

    // Return success page
    return new Response(
      `<html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
            }
            .container {
              background: white;
              padding: 50px;
              border-radius: 15px;
              box-shadow: 0 10px 30px rgba(0,0,0,0.2);
              text-align: center;
              max-width: 500px;
            }
            h1 {
              color: ${action === 'accept' ? '#10b981' : '#ef4444'};
              margin-bottom: 20px;
            }
            p {
              color: #374151;
              font-size: 18px;
              line-height: 1.6;
            }
            .icon {
              font-size: 72px;
              margin-bottom: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">${action === 'accept' ? '✅' : '📋'}</div>
            <h1>${action === 'accept' ? 'Mentor Approved!' : 'Application Processed'}</h1>
            <p>
              The mentor application has been ${action}ed successfully.
              ${action === 'accept' ? 'The mentor has been notified and can now start accepting sessions.' : 'The applicant has been notified of the decision.'}
            </p>
          </div>
        </body>
      </html>`,
      { headers: { "Content-Type": "text/html", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in verify-mentor-action:", error);
    return new Response(
      `<html><body style="font-family: Arial; text-align: center; padding: 50px;">
        <h1 style="color: #ef4444;">Error</h1>
        <p>${error.message}</p>
      </body></html>`,
      {
        status: 500,
        headers: { "Content-Type": "text/html", ...corsHeaders },
      }
    );
  }
};

serve(handler);
