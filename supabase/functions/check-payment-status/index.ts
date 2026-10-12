import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    const { razorpay_order_id } = await req.json();

    if (!razorpay_order_id) {
      return new Response(
        JSON.stringify({ error: 'razorpay_order_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Checking payment status for order:', razorpay_order_id);

    // Fetch order details from Razorpay
    const authHeader = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);
    const razorpayResponse = await fetch(
      `https://api.razorpay.com/v1/orders/${razorpay_order_id}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${authHeader}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!razorpayResponse.ok) {
      const errorData = await razorpayResponse.json();
      console.error('Razorpay API error:', errorData);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch order from Razorpay', details: errorData }),
        { status: razorpayResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const orderData = await razorpayResponse.json();
    console.log('Razorpay order data:', JSON.stringify(orderData, null, 2));

    // Fetch payments for this order
    const paymentsResponse = await fetch(
      `https://api.razorpay.com/v1/orders/${razorpay_order_id}/payments`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${authHeader}`,
          'Content-Type': 'application/json',
        },
      }
    );

    let paymentData = null;
    if (paymentsResponse.ok) {
      const paymentsJson = await paymentsResponse.json();
      console.log('Payments for order:', JSON.stringify(paymentsJson, null, 2));
      
      // Get the most recent payment
      if (paymentsJson.items && paymentsJson.items.length > 0) {
        paymentData = paymentsJson.items[0];
      }
    }

    // Find local payment record
    const { data: localPayment } = await supabase
      .from('payments')
      .select('*, sessions(*)')
      .eq('razorpay_order_id', razorpay_order_id)
      .single();

    const result: any = {
      order: orderData,
      payment: paymentData,
      local_payment: localPayment,
      status: orderData.status,
      payment_status: paymentData?.status || 'no_payment_found',
      amount_paid: orderData.amount_paid,
      amount_due: orderData.amount_due,
    };

    // Auto-reconcile if payment is captured but local DB shows pending
    if (paymentData?.status === 'captured' && localPayment?.status !== 'captured') {
      console.log('Auto-reconciling captured payment:', paymentData.id);

      // Update payment
      await supabase
        .from('payments')
        .update({
          razorpay_payment_id: paymentData.id,
          status: 'captured',
          updated_at: new Date().toISOString(),
        })
        .eq('id', localPayment.id);

      // Update session
      await supabase
        .from('sessions')
        .update({
          status: 'confirmed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', localPayment.session_id);

      // Update slot
      if (localPayment.sessions.slot_id) {
        await supabase
          .from('mentor_availability')
          .update({
            status: 'booked',
            held_until: null,
          })
          .eq('id', localPayment.sessions.slot_id);
      }

      result.reconciled = true;
      console.log('✅ Payment auto-reconciled successfully');
    }

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error checking payment status:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
