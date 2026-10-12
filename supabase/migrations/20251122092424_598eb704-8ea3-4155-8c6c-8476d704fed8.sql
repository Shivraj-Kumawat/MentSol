-- Drop the old check constraint that doesn't include 'approved'
ALTER TABLE public.mentors DROP CONSTRAINT IF EXISTS mentors_status_check;

-- Add new check constraint that includes 'approved' status
ALTER TABLE public.mentors 
ADD CONSTRAINT mentors_status_check 
CHECK (status IN ('pending_request', 'approved', 'active', 'suspended', 'rejected'));

-- Update all existing mentors to 'approved' status
UPDATE public.mentors 
SET status = 'approved' 
WHERE status IN ('pending_request', 'active');

-- Add comment explaining status values
COMMENT ON COLUMN public.mentors.status IS 'Mentor status: approved (active and visible to students), pending_request (awaiting admin review), rejected (application denied), suspended (temporarily disabled), active (legacy - same as approved)';
