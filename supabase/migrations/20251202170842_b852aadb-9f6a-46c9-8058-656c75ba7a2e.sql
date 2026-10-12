-- Drop the existing RESTRICTIVE SELECT policies on mentors table
DROP POLICY IF EXISTS "Mentors can view own profile" ON public.mentors;
DROP POLICY IF EXISTS "Public can view approved mentors" ON public.mentors;

-- Recreate them as PERMISSIVE policies (default behavior)
CREATE POLICY "Mentors can view own profile" ON public.mentors
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Public can view approved mentors" ON public.mentors
FOR SELECT USING (status = ANY (ARRAY['approved'::text, 'active'::text]));