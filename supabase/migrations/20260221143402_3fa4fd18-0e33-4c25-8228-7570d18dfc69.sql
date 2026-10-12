
-- Step 1: Add the column
ALTER TABLE public.mentors
  ADD COLUMN IF NOT EXISTS piece_of_proof_url text;

-- Step 2: Drop the old function signature
DROP FUNCTION IF EXISTS public.get_public_mentor_by_id(uuid);

-- Step 3: Recreate with piece_of_proof_url
CREATE FUNCTION public.get_public_mentor_by_id(mentor_uuid uuid)
 RETURNS TABLE(mentor_id uuid, user_id uuid, nickname text, bio text, specialization text, rating numeric, total_sessions integer, fixed_rate_per_15m integer, fixed_rate_per_30m integer, mentor_types text[], qualifications text[], exams text[], mentor_status text, full_name text, username text, avatar_url text, piece_of_proof_url text)
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
    p.avatar_url,
    m.piece_of_proof_url
  FROM public.mentors m
  INNER JOIN public.profiles p ON m.user_id = p.id
  WHERE m.id = mentor_uuid
    AND m.status IN ('approved', 'active');
$function$;
