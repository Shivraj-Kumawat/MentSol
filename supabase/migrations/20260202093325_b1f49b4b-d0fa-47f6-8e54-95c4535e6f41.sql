-- Drop the existing INSERT policy that requires status = 'completed'
DROP POLICY IF EXISTS "Students can create reviews for own sessions" ON public.reviews;

-- Create new INSERT policy with time-based eligibility (30 minutes after session start)
CREATE POLICY "Students can create reviews for own sessions"
ON public.reviews
FOR INSERT
WITH CHECK (
  (auth.uid() = student_id)
  AND EXISTS (
    SELECT 1
    FROM sessions s
    WHERE s.id = reviews.session_id
      AND s.student_id = auth.uid()
      AND s.status IN ('confirmed', 'completed')
      AND s.scheduled_at IS NOT NULL
      AND s.scheduled_at <= (now() - interval '30 minutes')
  )
);