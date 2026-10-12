-- Create function to get public mentor profiles (with safe profile info - no emails/phones)
CREATE OR REPLACE FUNCTION public.get_all_public_mentor_profiles()
RETURNS TABLE(
  id uuid,
  full_name text,
  username text,
  avatar_url text,
  mentor_id uuid,
  bio text,
  specialization text,
  rating numeric,
  total_sessions integer,
  fixed_rate_per_15m integer,
  mentor_types text[],
  qualifications text[],
  exams text[],
  mentor_status text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;

-- Create function to get a single mentor by ID
CREATE OR REPLACE FUNCTION public.get_public_mentor_by_id(mentor_uuid uuid)
RETURNS TABLE(
  mentor_id uuid,
  user_id uuid,
  nickname text,
  bio text,
  specialization text,
  rating numeric,
  total_sessions integer,
  fixed_rate_per_15m integer,
  mentor_types text[],
  qualifications text[],
  exams text[],
  mentor_status text,
  full_name text,
  username text,
  avatar_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    m.id as mentor_id,
    m.user_id,
    m.nickname,
    m.bio,
    m.specialization,
    m.rating,
    m.total_sessions,
    m.fixed_rate_per_15m,
    m.mentor_types,
    m.qualifications,
    m.exams,
    m.status as mentor_status,
    p.full_name,
    p.username,
    p.avatar_url
  FROM public.mentors m
  INNER JOIN public.profiles p ON m.user_id = p.id
  WHERE m.id = mentor_uuid
    AND m.status IN ('approved', 'active');
$$;

-- Create function to get mentors without profile joins (simpler)
CREATE OR REPLACE FUNCTION public.get_public_mentors()
RETURNS TABLE(
  mentor_id uuid,
  nickname text,
  bio text,
  specialization text,
  rating numeric,
  total_sessions integer,
  fixed_rate_per_15m integer,
  mentor_types text[],
  qualifications text[],
  exams text[],
  mentor_status text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    m.id as mentor_id,
    m.nickname,
    m.bio,
    m.specialization,
    m.rating,
    m.total_sessions,
    m.fixed_rate_per_15m,
    m.mentor_types,
    m.qualifications,
    m.exams,
    m.status as mentor_status
  FROM public.mentors m
  WHERE m.status IN ('approved', 'active');
$$;

-- Grant execute permission to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.get_all_public_mentor_profiles() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_mentor_by_id(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_mentors() TO anon, authenticated;