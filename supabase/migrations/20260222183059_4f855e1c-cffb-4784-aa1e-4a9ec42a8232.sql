
-- Part 1: Add fixed_rate_per_45m column
ALTER TABLE public.mentors ADD COLUMN IF NOT EXISTS fixed_rate_per_45m integer DEFAULT 0;

-- Part 2: Fix proof upload - Admin storage policies for avatars bucket
CREATE POLICY "Admins can upload to avatars bucket"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Admins can update avatars bucket"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Admins can delete from avatars bucket"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- Part 3: Update get_public_mentor_by_id to include fixed_rate_per_45m
DROP FUNCTION IF EXISTS public.get_public_mentor_by_id(uuid);

CREATE OR REPLACE FUNCTION public.get_public_mentor_by_id(mentor_uuid uuid)
 RETURNS TABLE(mentor_id uuid, user_id uuid, nickname text, bio text, specialization text, rating numeric, total_sessions integer, fixed_rate_per_15m integer, fixed_rate_per_30m integer, fixed_rate_per_45m integer, mentor_types text[], qualifications text[], exams text[], mentor_status text, full_name text, username text, avatar_url text, piece_of_proof_url text)
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
    m.fixed_rate_per_45m,
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

-- Part 4: Update get_all_public_mentor_profiles to include fixed_rate_per_45m
DROP FUNCTION IF EXISTS public.get_all_public_mentor_profiles();

CREATE OR REPLACE FUNCTION public.get_all_public_mentor_profiles()
 RETURNS TABLE(id uuid, full_name text, username text, avatar_url text, mentor_id uuid, bio text, specialization text, rating numeric, total_sessions integer, fixed_rate_per_15m integer, fixed_rate_per_30m integer, fixed_rate_per_45m integer, mentor_types text[], qualifications text[], exams text[], mentor_status text)
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
    m.fixed_rate_per_45m,
    m.mentor_types,
    m.qualifications,
    m.exams,
    m.status as mentor_status
  FROM public.profiles p
  INNER JOIN public.mentors m ON m.user_id = p.id
  WHERE m.status IN ('approved', 'active');
$function$;
