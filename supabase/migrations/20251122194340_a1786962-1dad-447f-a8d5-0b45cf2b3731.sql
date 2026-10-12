-- Add RLS policies to allow students and mentors to update video call status in their sessions

-- Students can update video_call_status and call_initiator_id in their own sessions
CREATE POLICY "Students can update video call status in own sessions"
ON sessions
FOR UPDATE
TO authenticated
USING (auth.uid() = student_id)
WITH CHECK (auth.uid() = student_id);

-- Mentors can update video_call_status and call_initiator_id in their sessions
CREATE POLICY "Mentors can update video call status in their sessions"
ON sessions
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM mentors
    WHERE mentors.id = sessions.mentor_id
    AND mentors.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM mentors
    WHERE mentors.id = sessions.mentor_id
    AND mentors.user_id = auth.uid()
  )
);