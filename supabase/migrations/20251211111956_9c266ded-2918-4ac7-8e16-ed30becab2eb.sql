-- Fix: Remove public access to sensitive promoter data

-- 1. Drop the overly permissive policy that exposes all promoter data
DROP POLICY IF EXISTS "Public can lookup promoter by short_ref" ON public.promoters;

-- 2. Create a secure view for public referral lookups (only non-sensitive fields)
CREATE VIEW public.public_promoter_lookup 
WITH (security_invoker = true)
AS
SELECT 
  id,
  short_ref,
  code,
  name
  -- Excludes: upi_id, total_earnings, total_sessions, total_clicks, total_signups, user_id
FROM public.promoters;

-- 3. Grant access to the view for referral tracking
GRANT SELECT ON public.public_promoter_lookup TO anon;
GRANT SELECT ON public.public_promoter_lookup TO authenticated;

COMMENT ON VIEW public.public_promoter_lookup IS 'Public-safe view for referral code lookups. Excludes sensitive data like UPI IDs, earnings, and performance metrics.';

-- 4. Create a security definer function for safe referral lookups by short_ref or code
CREATE OR REPLACE FUNCTION public.lookup_promoter_by_ref(ref_code text)
RETURNS TABLE (
  id uuid,
  short_ref text,
  code text,
  name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.short_ref, p.code, p.name
  FROM public.promoters p
  WHERE p.short_ref = ref_code OR p.code = ref_code
  LIMIT 1;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.lookup_promoter_by_ref(text) TO anon;
GRANT EXECUTE ON FUNCTION public.lookup_promoter_by_ref(text) TO authenticated;