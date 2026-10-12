-- Fix: Remove public access to sensitive profile data

-- 1. Drop the problematic policy that exposes email/phone publicly
DROP POLICY IF EXISTS "Public can view approved mentor profiles" ON public.profiles;

-- 2. Create a secure view that only exposes non-sensitive fields for public mentor listings
CREATE OR REPLACE VIEW public.public_mentor_profiles AS
SELECT 
  p.id,
  p.full_name,
  p.username,
  p.avatar_url,
  m.id as mentor_id,
  m.bio,
  m.specialization,
  m.rating,
  m.total_sessions,
  m.fixed_rate_per_15m,
  m.mentor_types,
  m.qualifications,
  m.exams,
  m.status as mentor_status
FROM public.profiles p
INNER JOIN public.mentors m ON m.user_id = p.id
WHERE m.status IN ('approved', 'active');

-- 3. Grant access to the view for all users (anon and authenticated)
GRANT SELECT ON public.public_mentor_profiles TO anon;
GRANT SELECT ON public.public_mentor_profiles TO authenticated;

-- 4. Add a comment explaining the security design
COMMENT ON VIEW public.public_mentor_profiles IS 'Public-safe view of mentor profiles. Excludes sensitive data like email and phone. Use this for public mentor listings instead of querying profiles directly.';