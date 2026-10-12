import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.83.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MentorVerificationRequest {
  mentorId: string;
  userId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mentorId, userId }: MentorVerificationRequest = await req.json();
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch mentor details with profile info
    const { data: mentor, error: mentorError } = await supabase
      .from("mentors")
      .select(`
        *,
        profiles:user_id (
          full_name,
          email,
          phone
        )
      `)
      .eq("id", mentorId)
      .single();

    if (mentorError || !mentor) {
      throw new Error("Mentor not found");
    }

    // Generate verification token
    const verificationToken = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Token valid for 7 days

    // Update mentor with verification token
    await supabase
      .from("mentors")
      .update({
        verification_token: verificationToken,
        verification_expires_at: expiresAt.toISOString(),
      })
      .eq("id", mentorId);

    const profile = mentor.profiles as any;
    const baseUrl = supabaseUrl.replace('.supabase.co', '.lovable.app') || 'https://your-app.lovable.app';
    const acceptUrl = `${baseUrl}/api/verify-mentor?token=${verificationToken}&action=accept`;
    const rejectUrl = `${baseUrl}/api/verify-mentor?token=${verificationToken}&action=reject`;

    // Format document URLs for email
    const documentLinks = mentor.documents_urls?.map((url: string, idx: number) => 
      `<li><a href="${url}" style="color: #2563eb;">Document ${idx + 1}</a></li>`
    ).join('') || '<li>No documents uploaded</li>';

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🎓 New Mentor Application</h1>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #1f2937; margin-top: 0;">Applicant Details</h2>
          
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 8px 0;"><strong>Name:</strong> ${profile.full_name || 'N/A'}</p>
            <p style="margin: 8px 0;"><strong>Email:</strong> ${profile.email || 'N/A'}</p>
            <p style="margin: 8px 0;"><strong>Phone:</strong> ${profile.phone || 'N/A'}</p>
          </div>

          <h3 style="color: #1f2937; margin-top: 30px;">Professional Information</h3>
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 8px 0;"><strong>Specialization:</strong> ${mentor.specialization || 'N/A'}</p>
            <p style="margin: 8px 0;"><strong>Bio:</strong> ${mentor.bio || 'N/A'}</p>
            <p style="margin: 8px 0;"><strong>Rate per 30 min:</strong> ₹${mentor.fixed_rate_per_30m || 0} | <strong>Rate per 45 min:</strong> ₹${mentor.fixed_rate_per_45m || 0}</p>
            <p style="margin: 8px 0;"><strong>Mentor Types:</strong> ${mentor.mentor_types?.join(', ') || 'N/A'}</p>
            <p style="margin: 8px 0;"><strong>Exams:</strong> ${mentor.exams?.join(', ') || 'N/A'}</p>
            <p style="margin: 8px 0;"><strong>Qualifications:</strong></p>
            <ul style="margin: 5px 0; padding-left: 20px;">
              ${mentor.qualifications?.map((q: string) => `<li>${q}</li>`).join('') || '<li>None provided</li>'}
            </ul>
          </div>

          <h3 style="color: #1f2937; margin-top: 30px;">Verification Documents</h3>
          <ul style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            ${documentLinks}
          </ul>

          <div style="text-align: center; margin-top: 40px; padding-top: 30px; border-top: 2px solid #e5e7eb;">
            <p style="color: #6b7280; margin-bottom: 20px;">Review the application and take action:</p>
            
            <a href="${acceptUrl}" 
               style="display: inline-block; background: #10b981; color: white; padding: 14px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 0 10px; font-size: 16px;">
              ✓ Accept Mentor
            </a>
            
            <a href="${rejectUrl}" 
               style="display: inline-block; background: #ef4444; color: white; padding: 14px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 0 10px; font-size: 16px;">
              ✗ Reject Application
            </a>
          </div>

          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 30px;">
            This verification link expires in 7 days.
          </p>
        </div>
      </div>
    `;

    // Send to both founder emails using Resend API
    const founderEmails = ["mentsol123@gmail.com", "seemakumawat3264@gmail.com"];
    
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: "MentSol Verification <onboarding@resend.dev>",
        to: founderEmails,
        subject: `New Mentor Application - ${profile.full_name}`,
        html: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      const error = await emailResponse.text();
      console.error("Email sending error:", error);
      throw new Error(`Failed to send email: ${error}`);
    }

    console.log("Verification email sent successfully to founders");

    return new Response(
      JSON.stringify({ success: true, message: "Verification email sent to founders" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-mentor-verification-email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
