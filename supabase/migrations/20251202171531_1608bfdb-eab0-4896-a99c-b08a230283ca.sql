-- Drop the existing policy
DROP POLICY IF EXISTS "Mentors can manage own availability" ON public.mentor_availability;

-- Recreate with BOTH USING and WITH CHECK clauses for INSERT support
CREATE POLICY "Mentors can manage own availability" ON public.mentor_availability
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM mentors
    WHERE mentors.id = mentor_availability.mentor_id 
    AND mentors.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM mentors
    WHERE mentors.id = mentor_availability.mentor_id 
    AND mentors.user_id = auth.uid()
  )
);