-- Add video call status to sessions table
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS video_call_status TEXT DEFAULT 'idle' 
  CHECK (video_call_status IN ('idle', 'calling', 'ringing', 'accepted', 'rejected', 'active', 'ended'));

ALTER TABLE sessions ADD COLUMN IF NOT EXISTS call_initiator_id TEXT;

-- Enable realtime for sessions table
ALTER TABLE sessions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE sessions;