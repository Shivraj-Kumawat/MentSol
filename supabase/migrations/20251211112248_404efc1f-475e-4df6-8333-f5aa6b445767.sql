-- Fix: Remove public access to sensitive mentor data

-- 1. Drop the overly permissive policy that exposes verification tokens, document URLs, etc.
DROP POLICY IF EXISTS "Public can view approved mentors" ON public.mentors;

-- 2. Create a security definer function that returns only safe mentor data
CREATE OR REPLACE FUNCTION public.get_public_mentors()
RETURNS TABLE (
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
SET search_path = public
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

-- 3. Grant execute permission to all users
GRANT EXECUTE ON FUNCTION public.get_public_mentors() TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_mentors() TO authenticated;

-- 4. Create function to get a single public mentor by ID (for mentor profile pages)
CREATE OR REPLACE FUNCTION public.get_public_mentor_by_id(mentor_uuid uuid)
RETURNS TABLE (
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
SET search_path = public
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

GRANT EXECUTE ON FUNCTION public.get_public_mentor_by_id(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_mentor_by_id(uuid) TO authenticated;

-- 5. Update the public_mentor_profiles view to use security definer
DROP VIEW IF EXISTS public.public_mentor_profiles;

CREATE OR REPLACE FUNCTION public.get_all_public_mentor_profiles()
RETURNS TABLE (
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
SET search_path = public
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

GRANT EXECUTE ON FUNCTION public.get_all_public_mentor_profiles() TO anon;
GRANT EXECUTE ON FUNCTION public.get_all_public_mentor_profiles() TO authenticated;

-- Add comments explaining the security design
COMMENT ON FUNCTION public.get_public_mentors() IS 'Returns public-safe mentor data. Excludes verification_token, documents_urls, user_id, and earnings.';
COMMENT ON FUNCTION public.get_public_mentor_by_id(uuid) IS 'Returns public-safe mentor profile by ID. Includes profile data but excludes sensitive fields.';
COMMENT ON FUNCTION public.get_all_public_mentor_profiles() IS 'Returns all public mentor profiles with safe profile data. Excludes email, phone, verification tokens, documents.';