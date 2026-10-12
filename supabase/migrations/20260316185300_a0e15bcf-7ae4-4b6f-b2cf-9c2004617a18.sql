
-- Set default ratings between 4.0 and 4.8 for mentors with 0 rating
UPDATE public.mentors 
SET rating = 4.0 + (random() * 0.8)::numeric(3,2)
WHERE status IN ('approved', 'active') AND (rating IS NULL OR rating = 0);

-- Update lookup_promoter_by_ref to be case-insensitive
CREATE OR REPLACE FUNCTION public.lookup_promoter_by_ref(ref_code text)
 RETURNS TABLE(id uuid, short_ref text, code text, name text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT p.id, p.short_ref, p.code, p.name
  FROM public.promoters p
  WHERE LOWER(p.short_ref) = LOWER(ref_code) 
     OR LOWER(p.code) = LOWER(ref_code)
  LIMIT 1;
$$;
