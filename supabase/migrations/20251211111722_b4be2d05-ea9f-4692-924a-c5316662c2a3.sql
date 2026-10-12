-- Fix security definer view warning by using security_invoker instead
DROP VIEW IF EXISTS public.public_mentor_profiles;

CREATE VIEW public.public_mentor_profiles 
WITH (security_invoker = true)
AS
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

-- Grant access to the view
GRANT SELECT ON public.public_mentor_profiles TO anon;
GRANT SELECT ON public.public_mentor_profiles TO authenticated;

COMMENT ON VIEW public.public_mentor_profiles IS 'Public-safe view of mentor profiles. Excludes sensitive data like email and phone.';