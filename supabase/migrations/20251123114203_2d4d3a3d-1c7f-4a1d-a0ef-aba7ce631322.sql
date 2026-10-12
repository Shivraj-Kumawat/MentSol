-- Add call history and duration tracking to sessions table
ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS call_started_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS call_ended_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS call_duration integer DEFAULT 0;

COMMENT ON COLUMN sessions.call_started_at IS 'Timestamp when the video call actually started (became active)';
COMMENT ON COLUMN sessions.call_ended_at IS 'Timestamp when the video call ended';
COMMENT ON COLUMN sessions.call_duration IS 'Duration of the video call in seconds';