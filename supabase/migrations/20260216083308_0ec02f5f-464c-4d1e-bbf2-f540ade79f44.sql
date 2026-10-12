
-- Add 30-minute pricing column to mentors
ALTER TABLE public.mentors ADD COLUMN IF NOT EXISTS fixed_rate_per_30m integer DEFAULT 0;

-- Drop and recreate functions with new return type
DROP FUNCTION IF EXISTS public.get_public_mentor_by_id(uuid);
DROP FUNCTION IF EXISTS public.get_all_public_mentor_profiles();

-- Recreate get_public_mentor_by_id with fixed_rate_per_30m
CREATE OR REPLACE FUNCTION public.get_public_mentor_by_id(mentor_uuid uuid)
 RETURNS TABLE(mentor_id uuid, user_id uuid, nickname text, bio text, specialization text, rating numeric, total_sessions integer, fixed_rate_per_15m integer, fixed_rate_per_30m integer, mentor_types text[], qualifications text[], exams text[], mentor_status text, full_name text, username text, avatar_url text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    m.id as mentor_id,
    m.user_id,
    m.nickname,
    m.bio,
    m.specialization,
    m.rating,
    m.total_sessions,
    m.fixed_rate_per_15m,
    m.fixed_rate_per_30m,
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
$function$;

-- Recreate get_all_public_mentor_profiles with fixed_rate_per_30m
CREATE OR REPLACE FUNCTION public.get_all_public_mentor_profiles()
 RETURNS TABLE(id uuid, full_name text, username text, avatar_url text, mentor_id uuid, bio text, specialization text, rating numeric, total_sessions integer, fixed_rate_per_15m integer, fixed_rate_per_30m integer, mentor_types text[], qualifications text[], exams text[], mentor_status text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    m.fixed_rate_per_30m,
    m.mentor_types,
    m.qualifications,
    m.exams,
    m.status as mentor_status
  FROM public.profiles p
  INNER JOIN public.mentors m ON m.user_id = p.id
  WHERE m.status IN ('approved', 'active');
$function$;
