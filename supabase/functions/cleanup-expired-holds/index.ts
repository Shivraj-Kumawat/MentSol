import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // SECURITY FIX: Verify cron secret for scheduled job access
    const cronSecret = req.headers.get('x-cron-secret');
    const expectedSecret = Deno.env.get('CRON_SECRET');
    
    // Also allow calls with service role key (for internal Supabase cron jobs)
    const authHeader = req.headers.get('Authorization');
    const isServiceRole = authHeader?.includes(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '');
    
    // If CRON_SECRET is configured, verify it. Otherwise, allow the request (for backward compatibility during setup)
    if (expectedSecret && cronSecret !== expectedSecret && !isServiceRole) {
      console.error('Unauthorized cron job attempt - invalid or missing cron secret');
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Running scheduled cleanup of expired holds and pending payments...');

    // 1. Release expired held slots
    const { data: expiredSlots, error: slotsError } = await supabase
      .from('mentor_availability')
      .update({ 
        status: 'available',
        held_until: null
      })
      .eq('status', 'held')
      .lt('held_until', new Date().toISOString())
      .select('id');

    if (slotsError) {
      console.error('Error releasing expired slots:', slotsError);
    } else {
      console.log(`Released ${expiredSlots?.length || 0} expired held slots`);
    }

    // 2. Find and clean up old pending_payment sessions (older than 15 minutes)
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    
    const { data: oldSessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('id, slot_id')
      .eq('status', 'pending_payment')
      .lt('created_at', fifteenMinutesAgo);

    if (sessionsError) {
      console.error('Error fetching old sessions:', sessionsError);
    } else if (oldSessions && oldSessions.length > 0) {
      console.log(`Found ${oldSessions.length} old pending_payment sessions to clean up`);

      // Release slots for these sessions
      const slotIds = oldSessions
        .map(s => s.slot_id)
        .filter(id => id !== null);

      if (slotIds.length > 0) {
        const { error: releaseError } = await supabase
          .from('mentor_availability')
          .update({ 
            status: 'available',
            held_until: null
          })
          .in('id', slotIds)
          .eq('status', 'held');

        if (releaseError) {
          console.error('Error releasing slots for old sessions:', releaseError);
        } else {
          console.log(`Released ${slotIds.length} slots from old sessions`);
        }
      }

      // Update payment records to failed
      const sessionIds = oldSessions.map(s => s.id);
      const { error: paymentError } = await supabase
        .from('payments')
        .update({ status: 'failed' })
        .in('session_id', sessionIds)
        .eq('status', 'created');

      if (paymentError) {
        console.error('Error updating payment records:', paymentError);
      }

      // Delete old pending sessions
      const { error: deleteError } = await supabase
        .from('sessions')
        .delete()
        .in('id', sessionIds);

      if (deleteError) {
        console.error('Error deleting old sessions:', deleteError);
      } else {
        console.log(`Deleted ${sessionIds.length} old pending_payment sessions`);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Cleanup completed',
        slots_released: expiredSlots?.length || 0,
        sessions_cleaned: oldSessions?.length || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Scheduled cleanup error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
