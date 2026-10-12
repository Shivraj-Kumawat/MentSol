import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // SECURITY FIX: Extract userId from JWT token instead of trusting client
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the JWT and extract user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;
    const requestBody = await req.json();
    const { action, sessionId, newSlotId } = requestBody;

    console.log('Reschedule request:', { action, sessionId, newSlotId, userId });

    // Add action to get reschedule policy info
    if (action === 'get_policy') {
      const { sessionId: policySessionId } = requestBody;
      
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .select('mentor_id, scheduled_at, amount_paid')
        .eq('id', policySessionId)
        .single();

      if (sessionError || !session) {
        throw new Error('Session not found');
      }

      const { data: mentor, error: mentorError } = await supabase
        .from('mentors')
        .select('reschedule_policy')
        .eq('id', session.mentor_id)
        .single();

      if (mentorError) throw mentorError;

      const policy = mentor?.reschedule_policy || {
        free_reschedule_hours: 24,
        last_minute_fee_percentage: 20,
        allow_reschedule: true
      };

      // Calculate if current reschedule would incur a fee
      const scheduledTime = new Date(session.scheduled_at);
      const now = new Date();
      const hoursUntilSession = (scheduledTime.getTime() - now.getTime()) / (1000 * 60 * 60);
      const isLastMinute = hoursUntilSession < policy.free_reschedule_hours;
      const estimatedFee = isLastMinute 
        ? Math.round((session.amount_paid * (policy.last_minute_fee_percentage || 20)) / 100)
        : 0;

      return new Response(
        JSON.stringify({ 
          policy,
          hoursUntilSession,
          isLastMinute,
          estimatedFee
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'list_sessions') {
      // Fetch user's sessions using JWT-extracted userId
      const { data: sessions, error } = await supabase
        .from('sessions')
        .select(`
          id,
          scheduled_at,
          status,
          amount_paid,
          mentor_id,
          mentors!inner(
            id,
            user_id,
            profiles!inner(full_name)
          )
        `)
        .eq('student_id', userId)
        .in('status', ['confirmed', 'pending_payment'])
        .order('scheduled_at', { ascending: true });

      if (error) throw error;

      return new Response(
        JSON.stringify({ sessions }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'get_available_slots') {
      const { mentorId, fromDate } = requestBody;
      
      const { data: slots, error } = await supabase
        .from('mentor_availability')
        .select('id, date, start_time, end_time, status')
        .eq('mentor_id', mentorId)
        .eq('status', 'available')
        .gte('date', fromDate)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true })
        .limit(20);

      if (error) throw error;

      return new Response(
        JSON.stringify({ slots }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'reschedule') {
      console.log('Starting reschedule process:', { sessionId, newSlotId, userId });

      // Verify session belongs to user using JWT-extracted userId
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .select('*, slot_id, mentor_id, scheduled_at, amount_paid, reschedule_count')
        .eq('id', sessionId)
        .eq('student_id', userId)
        .single();

      if (sessionError || !session) {
        console.error('Session verification failed:', sessionError);
        throw new Error('Session not found or unauthorized');
      }

      // Get mentor's reschedule policy
      const { data: mentor, error: mentorError } = await supabase
        .from('mentors')
        .select('reschedule_policy')
        .eq('id', session.mentor_id)
        .single();

      if (mentorError || !mentor) {
        console.error('Mentor fetch failed:', mentorError);
        throw new Error('Mentor not found');
      }

      const policy = mentor.reschedule_policy || {
        free_reschedule_hours: 24,
        last_minute_fee_percentage: 20,
        allow_reschedule: true
      };

      console.log('Reschedule policy:', policy);

      // Check if reschedule is allowed
      if (!policy.allow_reschedule) {
        throw new Error('Mentor does not allow rescheduling');
      }

      // Calculate hours until session
      const scheduledTime = new Date(session.scheduled_at);
      const now = new Date();
      const hoursUntilSession = (scheduledTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      // Calculate reschedule fee
      let reschedule_fee = 0;
      let isLastMinute = false;

      if (hoursUntilSession < policy.free_reschedule_hours) {
        isLastMinute = true;
        const feePercentage = policy.last_minute_fee_percentage || 20;
        reschedule_fee = Math.round((session.amount_paid * feePercentage) / 100);
      }

      console.log('Reschedule timing:', { hoursUntilSession, isLastMinute, reschedule_fee });

      // Verify new slot is available
      const { data: newSlot, error: slotError } = await supabase
        .from('mentor_availability')
        .select('*')
        .eq('id', newSlotId)
        .eq('status', 'available')
        .single();

      if (slotError || !newSlot) {
        console.error('New slot not available:', slotError);
        throw new Error('Slot not available');
      }

      // CRITICAL: Check if slot is already used by another session
      const { data: existingSession, error: checkError } = await supabase
        .from('sessions')
        .select('id')
        .eq('slot_id', newSlotId)
        .in('status', ['confirmed', 'pending_payment'])
        .neq('id', sessionId)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking slot usage:', checkError);
      }

      if (existingSession) {
        console.error('Slot already booked by session:', existingSession.id);
        throw new Error('This slot is already booked by another session');
      }

      console.log('New slot verified as available:', newSlotId);

      // Release old slot if exists
      if (session.slot_id) {
        const { error: releaseError } = await supabase
          .from('mentor_availability')
          .update({ status: 'available', held_until: null })
          .eq('id', session.slot_id);
        
        if (releaseError) {
          console.error('Failed to release old slot:', releaseError);
        } else {
          console.log('Released old slot:', session.slot_id);
        }
      }

      // Book new slot - mark as 'booked'
      const { error: bookError } = await supabase
        .from('mentor_availability')
        .update({ status: 'booked' })
        .eq('id', newSlotId);

      if (bookError) {
        console.error('Failed to book new slot:', bookError);
        throw new Error('Failed to book new slot');
      }

      console.log('Booked new slot:', newSlotId);

      // Update session with reschedule tracking
      // IMPORTANT: Slot times are stored in IST (Asia/Kolkata = UTC+5:30)
      const scheduledAt = new Date(`${newSlot.date}T${newSlot.start_time}+05:30`).toISOString();
      const { error: updateError } = await supabase
        .from('sessions')
        .update({
          slot_id: newSlotId,
          scheduled_at: scheduledAt,
          status: 'confirmed',
          reschedule_count: (session.reschedule_count || 0) + 1,
          reschedule_fee: (session.reschedule_fee || 0) + reschedule_fee,
          last_rescheduled_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (updateError) {
        console.error('Failed to update session:', updateError);
        throw updateError;
      }

      console.log('Session updated successfully:', sessionId);

      // Create notification for student
      const notificationMessage = isLastMinute 
        ? `Your session has been rescheduled to ${newSlot.date} at ${newSlot.start_time}. A reschedule fee of ₹${(reschedule_fee / 100).toFixed(2)} has been applied.`
        : `Your session has been rescheduled to ${newSlot.date} at ${newSlot.start_time} (Free reschedule)`;

      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'session_rescheduled',
        title: isLastMinute ? '⚠️ Session Rescheduled (Fee Applied)' : '✅ Session Rescheduled',
        message: notificationMessage,
        metadata: { 
          session_id: sessionId, 
          new_slot_id: newSlotId,
          reschedule_fee: reschedule_fee,
          is_last_minute: isLastMinute
        }
      });

      // Get mentor's user_id for notification
      const { data: mentorData } = await supabase
        .from('mentors')
        .select('user_id')
        .eq('id', session.mentor_id)
        .single();

      if (mentorData) {
        await supabase.from('notifications').insert({
          user_id: mentorData.user_id,
          type: 'session_rescheduled',
          title: '📅 Session Rescheduled',
          message: `A student has rescheduled their session to ${newSlot.date} at ${newSlot.start_time}`,
          metadata: { session_id: sessionId, new_slot_id: newSlotId }
        });
      }

      console.log('Session rescheduled successfully:', sessionId, {
        reschedule_fee,
        isLastMinute,
        hoursUntilSession: hoursUntilSession.toFixed(2)
      });

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: isLastMinute 
            ? `Session rescheduled. A fee of ₹${(reschedule_fee / 100).toFixed(2)} has been applied.`
            : 'Session rescheduled successfully (Free)',
          scheduledAt,
          reschedule_fee,
          isLastMinute
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in manage-session-reschedule:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
