import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.83.0";
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";
import nodemailer from "npm:nodemailer@6.9.10";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!RAZORPAY_KEY_SECRET) {
      throw new Error('Payment gateway not configured');
    }

    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      session_id 
    } = await req.json();

    console.log('Verifying payment:', { razorpay_order_id, razorpay_payment_id, session_id });

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !session_id) {
      throw new Error('Missing required payment details');
    }

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      console.error('Signature mismatch:', { expected: expectedSignature, received: razorpay_signature });
      throw new Error('Payment verification failed - invalid signature');
    }

    console.log('Signature verified successfully');

    // Create Supabase client with service role
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Get session details with slot information
    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .select('*, slot_id, student_id, mentor_id, amount_paid, scheduled_at')
      .eq('id', session_id)
      .single();

    if (sessionError || !sessionData) {
      console.error('Session not found:', sessionError);
      throw new Error('Session not found');
    }

    // Check if session is already confirmed (idempotency)
    if (sessionData.status === 'confirmed') {
      console.log('Session already confirmed, returning success');
      return new Response(
        JSON.stringify({ success: true, message: 'Payment already verified' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update payment record
    const { error: paymentUpdateError } = await supabase
      .from('payments')
      .update({
        razorpay_payment_id: razorpay_payment_id,
        razorpay_signature: razorpay_signature,
        status: 'captured',
        updated_at: new Date().toISOString(),
      })
      .eq('razorpay_order_id', razorpay_order_id);

    if (paymentUpdateError) {
      console.error('Payment update error:', paymentUpdateError);
      // Continue anyway - the payment is verified
    }

    // Get slot details for Google Meet link and duration
    let slotData = null;
    if (sessionData.slot_id) {
      const { data: slot } = await supabase
        .from('mentor_availability')
        .select('google_meet_link, duration_minutes, timezone')
        .eq('id', sessionData.slot_id)
        .single();
      slotData = slot;
    }

    // Get mentor details
    const { data: mentorData } = await supabase
      .from('mentors')
      .select('nickname, user_id, timezone')
      .eq('id', sessionData.mentor_id)
      .single();

    // Get student profile for calendar event
    const { data: studentProfile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', sessionData.student_id)
      .single();

    // Get mentor profile for calendar event
    let mentorProfile = null;
    if (mentorData?.user_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', mentorData.user_id)
        .single();
      mentorProfile = profile;
    }

    // Calculate platform fee and mentor earnings (10% platform fee)
    const amountPaid = sessionData.amount_paid || 0;
    const platformFee = Math.round(amountPaid * 0.1);
    const mentorEarning = amountPaid - platformFee;

    // ========== GOOGLE CALENDAR EVENT CREATION ==========
    // Create calendar event ONLY after successful payment
    let calendarEventId: string | null = null;
    const meetLink = slotData?.google_meet_link;
    const mentorTimezone = slotData?.timezone || mentorData?.timezone || 'Asia/Kolkata';
    const durationMinutes = slotData?.duration_minutes || 15;

    if (meetLink && mentorProfile?.email && sessionData.scheduled_at) {
      try {
        console.log('Creating Google Calendar event for session:', session_id);
        
        const calendarResponse = await fetch(
          `${SUPABASE_URL}/functions/v1/create-calendar-event`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            },
            body: JSON.stringify({
              sessionId: session_id,
              mentorEmail: mentorProfile.email,
              mentorTimezone,
              studentName: studentProfile?.full_name || 'Student',
              studentEmail: studentProfile?.email || '',
              meetLink,
              scheduledAt: sessionData.scheduled_at,
              durationMinutes,
            }),
          }
        );

        const calendarResult = await calendarResponse.json();
        
        if (calendarResult.success && calendarResult.eventId) {
          calendarEventId = calendarResult.eventId;
          console.log('Google Calendar event created successfully:', calendarEventId);
        } else {
          console.error('Failed to create Google Calendar event:', calendarResult.error);
          // Don't block payment - calendar is a nice-to-have for now
        }
      } catch (calendarError) {
        console.error('Calendar event creation error:', calendarError);
        // Don't block payment confirmation
      }
    } else {
      console.log('Skipping calendar event - missing data:', { 
        meetLink: !!meetLink, 
        mentorEmail: !!mentorProfile?.email, 
        scheduledAt: !!sessionData.scheduled_at 
      });
    }
    // ========== END CALENDAR EVENT CREATION ==========

    // Update session status to confirmed
    const sessionUpdateData: Record<string, unknown> = {
      status: 'confirmed',
      payment_id: razorpay_payment_id,
      platform_fee: platformFee,
      mentor_earning: mentorEarning,
      updated_at: new Date().toISOString(),
    };

    // Add calendar event ID and meet link if available
    if (calendarEventId) {
      sessionUpdateData.google_calendar_event_id = calendarEventId;
    }
    if (meetLink) {
      sessionUpdateData.google_meet_link = meetLink;
    }

    const { error: sessionUpdateError } = await supabase
      .from('sessions')
      .update(sessionUpdateData)
      .eq('id', session_id);

    if (sessionUpdateError) {
      console.error('Session update error:', sessionUpdateError);
      throw new Error('Failed to confirm session');
    }

    // Update slot status to booked
    if (sessionData.slot_id) {
      const { error: slotUpdateError } = await supabase
        .from('mentor_availability')
        .update({ 
          status: 'booked',
          held_until: null,
        })
        .eq('id', sessionData.slot_id);

      if (slotUpdateError) {
        console.error('Slot update error:', slotUpdateError);
        // Continue - session is confirmed
      }
    }

    // Create success notification for student
    await supabase.from('notifications').insert({
      user_id: sessionData.student_id,
      type: 'payment_success',
      title: '✅ Payment Successful!',
      message: `Your payment of ₹${amountPaid} was successful. Session with ${mentorData?.nickname || 'mentor'} is now confirmed!`,
      is_pinned: true,
      is_read: false,
      metadata: {
        session_id: session_id,
        payment_id: razorpay_payment_id,
        amount: amountPaid,
        action_url: '/bookings'
      }
    });

    // Notify mentor about new booking
    if (mentorData?.user_id) {
      const { data: studentProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', sessionData.student_id)
        .single();

      await supabase.from('notifications').insert({
        user_id: mentorData.user_id,
        type: 'new_booking',
        title: '🎉 New Session Booked!',
        message: `${studentProfile?.full_name || 'A student'} has booked a session with you.`,
        is_pinned: false,
        is_read: false,
        metadata: {
          session_id: session_id,
          student_id: sessionData.student_id,
          action_url: '/mentor/sessions'
        }
      });
    }

    // ========== SEND MENTOR EMAIL NOTIFICATION ==========
    try {
      const smtpUser = Deno.env.get('ZOHO_SMTP_USER');
      const smtpPass = Deno.env.get('ZOHO_SMTP_PASS');

      if (!smtpUser || !smtpPass) {
        console.warn('ZOHO SMTP credentials not configured, skipping mentor email');
      } else if (!mentorProfile?.email) {
        console.warn('Mentor has no email, skipping mentor email notification');
      } else {
        const transporter = nodemailer.createTransport({
          host: 'smtp.zoho.in',
          port: 587,
          secure: false,
          auth: { user: smtpUser, pass: smtpPass },
        });

        const durationMinutes = slotData?.duration_minutes || 15;
        const scheduledDate = sessionData.scheduled_at
          ? new Date(sessionData.scheduled_at)
          : null;

        let formattedDate = 'TBD';
        let formattedTime = 'TBD';
        if (scheduledDate) {
          formattedDate = scheduledDate.toLocaleDateString('en-IN', {
            timeZone: 'Asia/Kolkata',
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });
          formattedTime = scheduledDate.toLocaleTimeString('en-IN', {
            timeZone: 'Asia/Kolkata',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          });
        }

        const mentorEmailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr><td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 24px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;">MentSol</h1>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">New Session Booked</p>
        </td></tr>
        <tr><td style="padding:32px 24px;">
          <p style="margin:0 0 8px;color:#374151;font-size:16px;">Hi ${mentorData?.nickname || 'Mentor'},</p>
          <p style="margin:0 0 24px;color:#6b7280;font-size:14px;line-height:1.6;">
            Great news! A student has booked a session with you. Payment has been received successfully.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border-radius:12px;border:1px solid #e5e7eb;margin:0 0 24px;">
            <tr><td style="padding:20px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="padding:8px 0;color:#6b7280;font-size:13px;width:40%;">Student Name</td>
                    <td style="padding:8px 0;color:#1f2937;font-size:14px;font-weight:600;">${studentProfile?.full_name || 'Student'}</td></tr>
                <tr><td style="padding:8px 0;color:#6b7280;font-size:13px;">Student Email</td>
                    <td style="padding:8px 0;color:#1f2937;font-size:14px;">${studentProfile?.email || 'N/A'}</td></tr>
                <tr><td style="padding:8px 0;color:#6b7280;font-size:13px;">Session Date</td>
                    <td style="padding:8px 0;color:#1f2937;font-size:14px;font-weight:600;">${formattedDate}</td></tr>
                <tr><td style="padding:8px 0;color:#6b7280;font-size:13px;">Session Time</td>
                    <td style="padding:8px 0;color:#1f2937;font-size:14px;font-weight:600;">${formattedTime} IST</td></tr>
                <tr><td style="padding:8px 0;color:#6b7280;font-size:13px;">Duration</td>
                    <td style="padding:8px 0;color:#1f2937;font-size:14px;">${durationMinutes} minutes</td></tr>
                <tr><td style="padding:8px 0;color:#6b7280;font-size:13px;">Amount Paid</td>
                    <td style="padding:8px 0;color:#059669;font-size:14px;font-weight:700;">₹${amountPaid}</td></tr>
                <tr><td style="padding:8px 0;color:#6b7280;font-size:13px;">Session ID</td>
                    <td style="padding:8px 0;color:#9ca3af;font-size:12px;font-family:monospace;">${session_id}</td></tr>
              </table>
            </td></tr>
          </table>
          <div style="background-color:#ecfdf5;border-radius:8px;padding:12px 16px;margin:0 0 24px;">
            <p style="margin:0;color:#065f46;font-size:13px;">
              ✅ <strong>Payment confirmed.</strong> Please be available at the scheduled time.
            </p>
          </div>
        </td></tr>
        <tr><td style="background-color:#f9fafb;padding:20px 24px;text-align:center;border-top:1px solid #e5e7eb;">
          <p style="margin:0;color:#9ca3af;font-size:12px;">© ${new Date().getFullYear()} MentSol. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

        await transporter.sendMail({
          from: `"MentSol" <${smtpUser}>`,
          to: mentorProfile.email,
          subject: 'New Session Booked - Payment Received | MentSol',
          html: mentorEmailHtml,
        });

        console.log('Mentor notification email sent to:', mentorProfile.email);
      }
    } catch (emailError) {
      console.error('Failed to send mentor notification email:', emailError);
      // Non-blocking: do not affect payment confirmation
    }
    // ========== END MENTOR EMAIL NOTIFICATION ==========

    // ========== USER REFERRAL REWARD TRACKING ==========
    // Check if this student was referred by another user
    try {
      const { data: userReferral } = await supabase
        .from('user_referrals')
        .select('id, referrer_id, session_booked')
        .eq('referred_user_id', sessionData.student_id)
        .single();

      if (userReferral && !userReferral.session_booked) {
        // Mark the referral as having booked a session
        await supabase
          .from('user_referrals')
          .update({ 
            session_booked: true,
            session_id: session_id,
            updated_at: new Date().toISOString()
          })
          .eq('id', userReferral.id);

        console.log('User referral marked as session_booked:', userReferral.id);

        // Notify the referrer about their earned discount
        await supabase.from('notifications').insert({
          user_id: userReferral.referrer_id,
          type: 'referral_reward',
          title: '🎉 Referral Reward Earned!',
          message: 'Your friend just booked their first session! You earned 10% off your next session.',
          is_pinned: false,
          is_read: false,
          metadata: {
            reward_type: 'discount',
            percent: 10,
          }
        });
      }
    } catch (userRefError) {
      console.log('User referral check (no referral or error):', userRefError);
    }
    // ========== END USER REFERRAL TRACKING ==========

    // ========== REFERRAL DISCOUNT TRACKING ==========
    // Record referral discount if one was applied during booking
    try {
      const sessionBrief = sessionData.pre_session_brief as any;
      if (sessionBrief?.referral_code && sessionBrief?.discount_amount > 0) {
        const refCode = sessionBrief.referral_code;
        
        // Look up promoter (case-insensitive)
        const { data: promoterData } = await supabase
          .from('promoters')
          .select('id')
          .or(`short_ref.ilike.${refCode},code.ilike.${refCode}`)
          .maybeSingle();

        if (promoterData) {
          await supabase
            .from('referral_discounts')
            .insert({
              promoter_id: promoterData.id,
              student_id: sessionData.student_id,
              session_id: session_id,
              referral_code: refCode,
              original_price: sessionBrief.original_price || amountPaid + sessionBrief.discount_amount,
              discount_amount: sessionBrief.discount_amount,
              final_price: amountPaid,
            });

          console.log('Referral discount recorded for promoter:', promoterData.id);
        }
      }
    } catch (refDiscountError) {
      console.log('Referral discount tracking (non-fatal):', refDiscountError);
    }
    // ========== END REFERRAL DISCOUNT TRACKING ==========

    // ========== MARKETING PARTNER COMMISSION ==========
    // Check if student was referred by a promoter
    try {
      const { data: referral } = await supabase
        .from('referrals')
        .select('id, promoter_id, sessions_count')
        .eq('referred_user_id', sessionData.student_id)
        .single();

      if (referral && referral.sessions_count < 5) {
        // Calculate 10% commission
        const commission = Math.round(amountPaid * 0.10);
        
        console.log('Processing referral commission:', { 
          referral_id: referral.id, 
          promoter_id: referral.promoter_id, 
          session_count: referral.sessions_count,
          commission 
        });

        // Update referral sessions count
        await supabase
          .from('referrals')
          .update({ sessions_count: referral.sessions_count + 1 })
          .eq('id', referral.id);

        // Update promoter totals
        const { data: promoterData } = await supabase
          .from('promoters')
          .select('total_sessions, total_earnings')
          .eq('id', referral.promoter_id)
          .single();

        if (promoterData) {
          await supabase
            .from('promoters')
            .update({
              total_sessions: (promoterData.total_sessions || 0) + 1,
              total_earnings: (promoterData.total_earnings || 0) + commission,
            })
            .eq('id', referral.promoter_id);
        }

        console.log('Referral commission credited:', commission);
      }
    } catch (refError) {
      // Non-fatal - log and continue
      console.log('Referral commission check (no referral or error):', refError);
    }
    // ========== END COMMISSION LOGIC ==========

    console.log('Payment verified and session confirmed:', session_id);

    return new Response(
      JSON.stringify({ 
        success: true,
        verified: true,
        message: 'Payment verified successfully',
        session_id: session_id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in verify-razorpay-payment:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Payment verification failed' 
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
