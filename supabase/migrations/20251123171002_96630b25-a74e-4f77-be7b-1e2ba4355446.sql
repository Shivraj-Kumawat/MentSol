-- Add reschedule policy fields to mentors table
ALTER TABLE mentors 
ADD COLUMN IF NOT EXISTS reschedule_policy jsonb DEFAULT jsonb_build_object(
  'free_reschedule_hours', 24,
  'last_minute_fee_percentage', 20,
  'allow_reschedule', true
);

-- Add reschedule tracking to sessions table
ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS reschedule_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS reschedule_fee integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_rescheduled_at timestamp with time zone;

-- Add comments for documentation
COMMENT ON COLUMN mentors.reschedule_policy IS 'Reschedule policy: free_reschedule_hours (hours before session for free reschedule), last_minute_fee_percentage (% of session cost), allow_reschedule (boolean)';
COMMENT ON COLUMN sessions.reschedule_count IS 'Number of times this session has been rescheduled';
COMMENT ON COLUMN sessions.reschedule_fee IS 'Total reschedule fees charged for this session in paise';
COMMENT ON COLUMN sessions.last_rescheduled_at IS 'Timestamp of most recent reschedule';