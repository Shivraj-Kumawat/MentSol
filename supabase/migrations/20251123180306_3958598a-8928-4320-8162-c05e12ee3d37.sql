-- Add RLS policy to allow session participants to access session for video calls
-- This policy allows both students and mentors to read session data needed for video calls

CREATE POLICY "Session participants can access for video call"
ON sessions
FOR SELECT
TO authenticated
USING (
  -- Allow if user is the student
  auth.uid() = student_id
  OR
  -- Allow if user is the mentor (check via mentors table)
  EXISTS (
    SELECT 1 FROM mentors
    WHERE mentors.id = sessions.mentor_id
    AND mentors.user_id = auth.uid()
  )
);

-- Also add a policy for updating session status during video calls
CREATE POLICY "Session participants can update call status"
ON sessions
FOR UPDATE
TO authenticated
USING (
  auth.uid() = student_id
  OR
  EXISTS (
    SELECT 1 FROM mentors
    WHERE mentors.id = sessions.mentor_id
    AND mentors.user_id = auth.uid()
  )
)
WITH CHECK (
  auth.uid() = student_id
  OR
  EXISTS (
    SELECT 1 FROM mentors
    WHERE mentors.id = sessions.mentor_id
    AND mentors.user_id = auth.uid()
  )
);