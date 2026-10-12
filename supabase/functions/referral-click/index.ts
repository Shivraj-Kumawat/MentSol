import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.83.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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

    const url = new URL(req.url);
    const shortRef = url.searchParams.get('ref');
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    console.log('Referral click request:', { shortRef, ip: ip.substring(0, 15) + '...' });

    if (!shortRef) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing ref parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Find promoter by short_ref or code
    const { data: promoter, error: promoterError } = await supabase
      .from('promoters')
      .select('id, short_ref, code')
      .or(`short_ref.eq.${shortRef},code.eq.${shortRef}`)
      .maybeSingle();

    if (promoterError) {
      console.error('Error finding promoter:', promoterError);
      return new Response(
        JSON.stringify({ success: false, error: 'Database error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!promoter) {
      console.log('Promoter not found for ref:', shortRef);
      return new Response(
        JSON.stringify({ success: false, error: 'Promoter not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Found promoter:', promoter.id);

    // Log the click
    const { error: clickError } = await supabase
      .from('referral_clicks')
      .insert({
        promoter_id: promoter.id,
        short_ref: shortRef,
        ip: ip.split(',')[0].trim().substring(0, 45),
        user_agent: userAgent.substring(0, 500),
      });

    if (clickError) {
      console.error('Failed to log click:', clickError);
      // Continue anyway - don't fail the request
    }

    // Note: total_clicks is incremented automatically by the DB trigger
    // 'increment_promoter_clicks' on INSERT into referral_clicks

    console.log('Click logged successfully for promoter:', promoter.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        promoter_id: promoter.id,
        message: 'Click logged successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Referral click error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
