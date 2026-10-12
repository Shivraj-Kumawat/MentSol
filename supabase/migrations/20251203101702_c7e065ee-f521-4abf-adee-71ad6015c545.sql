
-- Enable RLS on project_notes table
ALTER TABLE public.project_notes ENABLE ROW LEVEL SECURITY;

-- Allow public read access for project notes (internal use)
CREATE POLICY "Allow public read access to project_notes"
ON public.project_notes FOR SELECT
USING (true);

-- Update orphaned payments to failed (sessions already deleted)
UPDATE payments SET status = 'failed', updated_at = NOW()
WHERE status IN ('created', 'pending') 
AND NOT EXISTS (SELECT 1 FROM sessions WHERE sessions.id = payments.session_id);
