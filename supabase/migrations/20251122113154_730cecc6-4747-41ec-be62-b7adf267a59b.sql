-- Add is_pinned column to notifications table
ALTER TABLE notifications
ADD COLUMN is_pinned boolean DEFAULT false;

-- Create function to unpin notifications when session is completed/cancelled
CREATE OR REPLACE FUNCTION unpin_completed_session_notifications()
RETURNS TRIGGER AS $$
BEGIN
  -- When session is completed or cancelled, unpin related notifications
  IF NEW.status IN ('completed', 'cancelled') AND 
     (OLD.status IS NULL OR OLD.status NOT IN ('completed', 'cancelled')) THEN
    
    UPDATE notifications
    SET is_pinned = false
    WHERE metadata->>'session_id' = NEW.id::text
      AND is_pinned = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-unpin completed sessions
CREATE TRIGGER trigger_unpin_completed_sessions
AFTER UPDATE ON sessions
FOR EACH ROW
EXECUTE FUNCTION unpin_completed_session_notifications();