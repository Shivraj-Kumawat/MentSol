-- Drop the old RLS policy that only shows 'active' mentors
DROP POLICY IF EXISTS "Public can view active mentors" ON public.mentors;

-- Create new policy that shows both 'approved' and 'active' mentors
CREATE POLICY "Public can view approved mentors" 
ON public.mentors 
FOR SELECT 
USING (status IN ('approved', 'active'));