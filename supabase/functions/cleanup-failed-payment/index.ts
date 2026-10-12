import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID')!;
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // SECURITY FIX: Verify JWT and extract user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { session_id } = await req.json();

    if (!session_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'session_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔍 Smart cleanup for session:', session_id, 'by user:', user.id);

    // Check if session exists and belongs to the authenticated user
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('*, mentor_availability(*), payments(*)')
      .eq('id', session_id)
      .single();

    if (sessionError || !session) {
      console.log('Session not found or already processed:', session_id);
      return new Response(
        JSON.stringify({ success: true, message: 'Session already cleaned up or not found' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SECURITY FIX: Verify the session belongs to the authenticated user
    if (session.student_id !== user.id) {
      console.error('Unauthorized cleanup attempt:', { session_id, user_id: user.id, student_id: session.student_id });
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized - session does not belong to you' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Session found:', session.id, 'Status:', session.status);

    // Only cleanup if status is pending_payment
    if (session.status !== 'pending_payment') {
      console.log('Session is not pending payment, skipping cleanup');
      return new Response(
        JSON.stringify({ 
          message: 'Session is not pending payment', 
          status: session.status 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SMART CLEANUP: Check with Razorpay before deleting
    console.log('🔍 Verifying payment status with Razorpay before cleanup...');
    
    const payment = session.payments?.[0];
    if (payment?.razorpay_order_id) {
      try {
        // Check if payment was actually captured at Razorpay
        const authHeaderRazorpay = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);
        const razorpayResponse = await fetch(
          `https://api.razorpay.com/v1/orders/${payment.razorpay_order_id}/payments`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Basic ${authHeaderRazorpay}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (razorpayResponse.ok) {
          const paymentsData = await razorpayResponse.json();
          
          // Check if any payment is captured
          const capturedPayment = paymentsData.items?.find(
            (p: any) => p.status === 'captured'
          );

          if (capturedPayment) {
            console.log('⚠️ Payment was captured at Razorpay! Not cleaning up. Payment ID:', capturedPayment.id);
            
            // Reconcile the payment
            await supabase
              .from('payments')
              .update({
                razorpay_payment_id: capturedPayment.id,
                status: 'captured',
              })
              .eq('id', payment.id);

            await supabase
              .from('sessions')
              .update({ status: 'confirmed' })
              .eq('id', session_id);

            if (session.slot_id) {
              await supabase
                .from('mentor_availability')
                .update({ status: 'booked', held_until: null })
                .eq('id', session.slot_id);
            }

            return new Response(
              JSON.stringify({ 
                message: 'Payment was actually successful, reconciled!',
                payment_id: capturedPayment.id 
              }),
              { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }
      } catch (razorpayError) {
        console.error('Error checking Razorpay:', razorpayError);
        // Continue with cleanup if we can't verify
      }
    }

    // Payment not found or failed at Razorpay - safe to cleanup
    console.log('✅ No captured payment found at Razorpay, proceeding with cleanup');

    // Release the held slot
    if (session.slot_id) {
      const { error: slotError } = await supabase
        .from('mentor_availability')
        .update({ 
          status: 'available',
          held_until: null
        })
        .eq('id', session.slot_id)
        .eq('status', 'held');

      if (slotError) {
        console.error('Error releasing slot:', slotError);
      } else {
        console.log('Released slot:', session.slot_id);
      }
    }

    // Update payment record to failed
    const { error: paymentError } = await supabase
      .from('payments')
      .update({ status: 'failed' })
      .eq('session_id', session_id)
      .eq('status', 'created');

    if (paymentError) {
      console.error('Error updating payment:', paymentError);
    }

    // Delete the pending session
    const { error: deleteError } = await supabase
      .from('sessions')
      .delete()
      .eq('id', session_id)
      .eq('status', 'pending_payment');

    if (deleteError) {
      console.error('Error deleting session:', deleteError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to delete session' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Successfully cleaned up session:', session_id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Cleanup completed',
        session_id: session_id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Cleanup error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
