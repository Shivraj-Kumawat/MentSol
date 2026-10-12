-- Add exam tracking fields to mentors table
ALTER TABLE public.mentors 
  ADD COLUMN IF NOT EXISTS exams text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS mentor_types text[] DEFAULT '{}';

-- Add comment for clarity
COMMENT ON COLUMN public.mentors.exams IS 'Array of exam IDs this mentor can help with (e.g., jee, neet, cat)';
COMMENT ON COLUMN public.mentors.mentor_types IS 'Array of mentor type qualifications (e.g., iitian, nitian, expert)';