-- Function to notify student when session is booked/confirmed
CREATE OR REPLACE FUNCTION notify_session_status_change()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  mentor_name TEXT;
  session_time TEXT;
BEGIN
  -- Only trigger on INSERT or status changes
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    
    -- Get mentor name
    SELECT p.full_name INTO mentor_name
    FROM mentors m
    JOIN profiles p ON m.user_id = p.id
    WHERE m.id = NEW.mentor_id;
    
    -- Format session time if available
    IF NEW.scheduled_at IS NOT NULL THEN
      session_time := to_char(NEW.scheduled_at, 'Mon DD at HH24:MI');
    ELSE
      session_time := 'pending scheduling';
    END IF;
    
    -- Notify on session creation (confirmed)
    IF TG_OP = 'INSERT' AND NEW.status = 'confirmed' THEN
      INSERT INTO notifications (user_id, type, title, message, metadata, is_pinned)
      VALUES (
        NEW.student_id,
        'session_booked',
        '✅ Session Confirmed!',
        'Your session with ' || COALESCE(mentor_name, 'your mentor') || ' is confirmed for ' || session_time,
        jsonb_build_object(
          'session_id', NEW.id,
          'mentor_id', NEW.mentor_id,
          'scheduled_at', NEW.scheduled_at,
          'action_url', '/bookings'
        ),
        true
      );
    END IF;
    
    -- Notify on status change from pending to confirmed
    IF TG_OP = 'UPDATE' AND OLD.status = 'pending_payment' AND NEW.status = 'confirmed' THEN
      INSERT INTO notifications (user_id, type, title, message, metadata, is_pinned)
      VALUES (
        NEW.student_id,
        'session_booked',
        '✅ Payment Successful!',
        'Your session with ' || COALESCE(mentor_name, 'your mentor') || ' is now confirmed for ' || session_time,
        jsonb_build_object(
          'session_id', NEW.id,
          'mentor_id', NEW.mentor_id,
          'scheduled_at', NEW.scheduled_at,
          'action_url', '/bookings'
        ),
        true
      );
    END IF;
    
    -- Notify when session is rescheduled
    IF TG_OP = 'UPDATE' AND OLD.scheduled_at IS DISTINCT FROM NEW.scheduled_at AND NEW.status = 'confirmed' THEN
      INSERT INTO notifications (user_id, type, title, message, metadata)
      VALUES (
        NEW.student_id,
        'session_reminder',
        '📅 Session Rescheduled',
        'Your session with ' || COALESCE(mentor_name, 'your mentor') || ' has been moved to ' || session_time,
        jsonb_build_object(
          'session_id', NEW.id,
          'mentor_id', NEW.mentor_id,
          'scheduled_at', NEW.scheduled_at,
          'action_url', '/bookings'
        )
      );
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for session status changes
DROP TRIGGER IF EXISTS session_status_notification ON sessions;
CREATE TRIGGER session_status_notification
  AFTER INSERT OR UPDATE ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION notify_session_status_change();

-- Add comment
COMMENT ON FUNCTION notify_session_status_change() IS 'Automatically creates notifications when sessions are booked, confirmed, or rescheduled';