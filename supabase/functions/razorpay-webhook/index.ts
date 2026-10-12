import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-razorpay-signature',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const webhookSecret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET');

    if (!webhookSecret) {
      console.error('RAZORPAY_WEBHOOK_SECRET not configured');
      return new Response(
        JSON.stringify({ error: 'Webhook secret not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get webhook signature from header
    const signature = req.headers.get('x-razorpay-signature');
    const body = await req.text();

    // Verify webhook signature
    const expectedSignature = createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.error('Invalid webhook signature');
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const webhookData = JSON.parse(body);
    const event = webhookData.event;
    const payload = webhookData.payload;

    console.log('Razorpay webhook received:', event);
    console.log('Payload:', JSON.stringify(payload, null, 2));

    // Handle payment.captured event
    if (event === 'payment.captured') {
      const razorpayOrderId = payload.payment.entity.order_id;
      const razorpayPaymentId = payload.payment.entity.id;
      const amount = payload.payment.entity.amount;
      const status = payload.payment.entity.status;

      console.log(`Payment captured: ${razorpayPaymentId} for order: ${razorpayOrderId}`);

      // Find payment record
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .select('*, sessions(*)')
        .eq('razorpay_order_id', razorpayOrderId)
        .single();

      if (paymentError || !payment) {
        console.error('Payment not found:', paymentError);
        return new Response(
          JSON.stringify({ error: 'Payment not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get Google Meet link from the slot
      let meetLink: string | null = null;
      if (payment.sessions?.slot_id) {
        const { data: slotData } = await supabase
          .from('mentor_availability')
          .select('google_meet_link')
          .eq('id', payment.sessions.slot_id)
          .single();
        
        meetLink = slotData?.google_meet_link || null;
        console.log('Slot meet link fetched:', { slot_id: payment.sessions.slot_id, meetLink: !!meetLink });
      }

      // Update payment status
      const { error: updatePaymentError } = await supabase
        .from('payments')
        .update({
          razorpay_payment_id: razorpayPaymentId,
          status: 'captured',
          updated_at: new Date().toISOString(),
        })
        .eq('id', payment.id);

      if (updatePaymentError) {
        console.error('Error updating payment:', updatePaymentError);
      }

      // Update session status to confirmed WITH Google Meet link
      const sessionUpdateData: Record<string, unknown> = {
        status: 'confirmed',
        updated_at: new Date().toISOString(),
      };
      
      // CRITICAL: Copy meet link from slot to session
      if (meetLink) {
        sessionUpdateData.google_meet_link = meetLink;
        console.log('Setting google_meet_link on session:', meetLink);
      }

      const { error: updateSessionError } = await supabase
        .from('sessions')
        .update(sessionUpdateData)
        .eq('id', payment.session_id);

      if (updateSessionError) {
        console.error('Error updating session:', updateSessionError);
      }

      // Update slot status to booked
      if (payment.sessions.slot_id) {
        const { error: updateSlotError } = await supabase
          .from('mentor_availability')
          .update({
            status: 'booked',
            held_until: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', payment.sessions.slot_id);

        if (updateSlotError) {
          console.error('Error updating slot:', updateSlotError);
        }
      }

      console.log(`✅ Payment confirmed via webhook: ${razorpayPaymentId}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Payment processed successfully',
          payment_id: razorpayPaymentId 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle payment.failed event
    if (event === 'payment.failed') {
      const razorpayOrderId = payload.payment.entity.order_id;
      const razorpayPaymentId = payload.payment.entity.id;

      console.log(`Payment failed: ${razorpayPaymentId} for order: ${razorpayOrderId}`);

      // Find payment record
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .select('*, sessions(*)')
        .eq('razorpay_order_id', razorpayOrderId)
        .single();

      if (paymentError || !payment) {
        console.error('Payment not found:', paymentError);
        return new Response(
          JSON.stringify({ error: 'Payment not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update payment status
      const { error: updatePaymentError } = await supabase
        .from('payments')
        .update({
          razorpay_payment_id: razorpayPaymentId,
          status: 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', payment.id);

      if (updatePaymentError) {
        console.error('Error updating payment:', updatePaymentError);
      }

      // Release slot and delete session
      if (payment.sessions.slot_id) {
        await supabase
          .from('mentor_availability')
          .update({
            status: 'available',
            held_until: null,
          })
          .eq('id', payment.sessions.slot_id);
      }

      await supabase
        .from('sessions')
        .delete()
        .eq('id', payment.session_id);

      console.log(`❌ Payment failed and cleaned up: ${razorpayPaymentId}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Payment failure processed',
          payment_id: razorpayPaymentId 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle order.paid event (backup for payment.captured)
    if (event === 'order.paid') {
      const razorpayOrderId = payload.order.entity.id;
      console.log(`Order paid: ${razorpayOrderId}`);

      // Find payment record with session data
      const { data: payment } = await supabase
        .from('payments')
        .select('*, sessions(slot_id, status)')
        .eq('razorpay_order_id', razorpayOrderId)
        .single();

      if (payment && payment.status !== 'captured') {
        // Get Google Meet link from the slot
        let meetLink: string | null = null;
        if (payment.sessions?.slot_id) {
          const { data: slotData } = await supabase
            .from('mentor_availability')
            .select('google_meet_link')
            .eq('id', payment.sessions.slot_id)
            .single();
          
          meetLink = slotData?.google_meet_link || null;
          console.log('Order.paid - Slot meet link fetched:', { slot_id: payment.sessions.slot_id, meetLink: !!meetLink });
        }

        // Update to captured if not already done
        await supabase
          .from('payments')
          .update({ status: 'captured' })
          .eq('id', payment.id);

        // Update session with meet link
        const sessionUpdate: Record<string, unknown> = { status: 'confirmed' };
        if (meetLink) {
          sessionUpdate.google_meet_link = meetLink;
        }

        await supabase
          .from('sessions')
          .update(sessionUpdate)
          .eq('id', payment.session_id);
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Order paid processed' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Unknown event
    console.log('Unhandled webhook event:', event);
    return new Response(
      JSON.stringify({ success: true, message: 'Event received but not processed' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
