-- Drop the existing RESTRICTIVE policies on mentor_availability
DROP POLICY IF EXISTS "Mentors can manage own availability" ON public.mentor_availability;
DROP POLICY IF EXISTS "Public can view available slots" ON public.mentor_availability;
DROP POLICY IF EXISTS "Admins can manage all availability" ON public.mentor_availability;

-- Recreate as PERMISSIVE policies (default)
CREATE POLICY "Admins can manage all availability" ON public.mentor_availability
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Mentors can manage own availability" ON public.mentor_availability
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM mentors
    WHERE mentors.id = mentor_availability.mentor_id 
    AND mentors.user_id = auth.uid()
  )
);

CREATE POLICY "Public can view available slots" ON public.mentor_availability
FOR SELECT USING (status = 'available' OR status = 'held');