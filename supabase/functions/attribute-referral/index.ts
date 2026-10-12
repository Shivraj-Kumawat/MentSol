import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.83.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing environment variables');
      return new Response(
        JSON.stringify({ success: false, error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { student_user_id, short_ref } = body;

    console.log('Attribution request:', { student_user_id, short_ref });

    if (!student_user_id || !short_ref) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required parameters: student_user_id and short_ref' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // === Step 1: Check if this is a PROMOTER referral code ===
    const { data: promoter, error: promoterError } = await supabase
      .from('promoters')
      .select('id, total_signups')
      .or(`short_ref.eq.${short_ref},code.eq.${short_ref}`)
      .maybeSingle();

    if (promoterError) {
      console.error('Error finding promoter:', promoterError);
      return new Response(
        JSON.stringify({ success: false, error: 'Database error finding promoter' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (promoter) {
      // --- PROMOTER REFERRAL FLOW (existing, unchanged) ---
      console.log('Found promoter:', promoter.id);

      const { data: existingReferral } = await supabase
        .from('referrals')
        .select('id')
        .eq('referred_user_id', student_user_id)
        .maybeSingle();

      if (existingReferral) {
        console.log('User already has a referral record:', existingReferral.id);
        return new Response(
          JSON.stringify({ success: true, message: 'User already attributed', promoter_id: promoter.id }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ referred_by_partner_id: promoter.id })
        .eq('id', student_user_id);

      if (profileError) {
        console.error('Error updating profile:', profileError);
      }

      const { error: referralError } = await supabase
        .from('referrals')
        .insert({
          promoter_id: promoter.id,
          referred_user_id: student_user_id,
          sessions_count: 0,
          commission_earned: 0,
        });

      if (referralError) {
        console.error('Error creating referral record:', referralError);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to create referral record' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error: updateError } = await supabase
        .from('promoters')
        .update({ total_signups: (promoter.total_signups || 0) + 1 })
        .eq('id', promoter.id);

      if (updateError) {
        console.error('Error updating promoter signups:', updateError);
      }

      console.log('Promoter referral attributed successfully:', {
        promoter_id: promoter.id,
        student_id: student_user_id,
      });

      return new Response(
        JSON.stringify({ success: true, type: 'promoter_referral', promoter_id: promoter.id, message: 'Referral attributed successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // === Step 2: Check if this is a STUDENT referral code ===
    console.log('No promoter found, checking student referral codes for:', short_ref);

    const { data: referrer, error: referrerError } = await supabase
      .from('profiles')
      .select('id')
      .eq('referral_code', short_ref)
      .maybeSingle();

    if (referrerError) {
      console.error('Error finding referrer:', referrerError);
      return new Response(
        JSON.stringify({ success: false, error: 'Database error finding referrer' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (referrer) {
      console.log('Found student referrer:', referrer.id);

      // Prevent self-referral
      if (referrer.id === student_user_id) {
        console.log('Self-referral attempted, ignoring');
        return new Response(
          JSON.stringify({ success: false, error: 'Cannot refer yourself' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check for duplicate
      const { data: existingUserReferral } = await supabase
        .from('user_referrals')
        .select('id')
        .eq('referred_user_id', student_user_id)
        .maybeSingle();

      if (existingUserReferral) {
        console.log('User already has a student referral record:', existingUserReferral.id);
        return new Response(
          JSON.stringify({ success: true, type: 'student_referral', message: 'User already attributed' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create user_referrals record
      const { error: insertError } = await supabase
        .from('user_referrals')
        .insert({
          referrer_id: referrer.id,
          referred_user_id: student_user_id,
          session_booked: false,
          reward_claimed: false,
        });

      if (insertError) {
        console.error('Error creating user referral record:', insertError);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to create student referral record' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update referred student's profile
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({ referred_by: referrer.id })
        .eq('id', student_user_id);

      if (profileUpdateError) {
        console.error('Error updating referred profile:', profileUpdateError);
      }

      console.log('Student referral attributed successfully:', {
        referrer_id: referrer.id,
        referred_user_id: student_user_id,
      });

      return new Response(
        JSON.stringify({ success: true, type: 'student_referral', referrer_id: referrer.id, message: 'Student referral attributed successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // === Step 3: No match found ===
    console.log('Referral code not found in promoters or profiles:', short_ref);
    return new Response(
      JSON.stringify({ success: false, error: 'Referral code not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Attribution error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
