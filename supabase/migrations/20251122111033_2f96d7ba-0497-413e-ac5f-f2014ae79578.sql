-- Allow public to view profiles of approved mentors
CREATE POLICY "Public can view approved mentor profiles"
ON profiles FOR SELECT
USING (
  id IN (
    SELECT user_id FROM mentors 
    WHERE status IN ('approved', 'active')
  )
);