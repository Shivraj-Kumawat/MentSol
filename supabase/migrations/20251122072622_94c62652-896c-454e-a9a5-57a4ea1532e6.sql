-- Create function to notify all admins
CREATE OR REPLACE FUNCTION public.notify_all_admins(
  notification_type text,
  notification_title text,
  notification_message text,
  metadata_json jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Loop through all admin users
  FOR admin_user_id IN
    SELECT user_id FROM user_roles WHERE role = 'admin'
  LOOP
    INSERT INTO notifications (user_id, type, title, message, metadata)
    VALUES (admin_user_id, notification_type, notification_title, notification_message, metadata_json);
  END LOOP;
END;
$$;

-- Trigger 1: New Mentor Request
CREATE OR REPLACE FUNCTION public.trigger_notify_new_mentor()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  mentor_name text;
  mentor_categories text;
BEGIN
  -- Only notify for new pending requests
  IF NEW.status = 'pending_request' AND (TG_OP = 'INSERT' OR OLD.status IS NULL OR OLD.status != 'pending_request') THEN
    -- Get mentor name
    SELECT full_name INTO mentor_name
    FROM profiles
    WHERE id = NEW.user_id;
    
    -- Get first 2 categories
    IF NEW.mentor_types IS NOT NULL AND array_length(NEW.mentor_types, 1) > 0 THEN
      mentor_categories := array_to_string(NEW.mentor_types[1:2], ', ');
    ELSE
      mentor_categories := 'General';
    END IF;
    
    PERFORM notify_all_admins(
      'mentor_request',
      '🎓 New Mentor Application',
      COALESCE(mentor_name, 'Unknown User') || ' has applied to become a mentor (' || mentor_categories || ')',
      jsonb_build_object(
        'mentor_id', NEW.id,
        'user_id', NEW.user_id,
        'mentor_name', mentor_name,
        'categories', NEW.mentor_types,
        'action_url', '/admin/mentors'
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_mentor_request_notify_admins
AFTER INSERT OR UPDATE ON mentors
FOR EACH ROW
EXECUTE FUNCTION trigger_notify_new_mentor();

-- Trigger 2: Payment Failed
CREATE OR REPLACE FUNCTION public.trigger_notify_payment_failed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  student_name text;
BEGIN
  -- Only notify when payment status changes to 'failed'
  IF NEW.status = 'failed' AND (TG_OP = 'INSERT' OR OLD.status IS NULL OR OLD.status != 'failed') THEN
    -- Get student details
    SELECT p.full_name INTO student_name
    FROM sessions s
    JOIN profiles p ON s.student_id = p.id
    WHERE s.id = NEW.session_id;
    
    PERFORM notify_all_admins(
      'payment_failed',
      '💳 Payment Failed',
      'Payment of ₹' || (NEW.amount / 100)::text || ' failed for ' || COALESCE(student_name, 'Unknown User'),
      jsonb_build_object(
        'payment_id', NEW.id,
        'session_id', NEW.session_id,
        'amount', NEW.amount,
        'razorpay_payment_id', NEW.razorpay_payment_id,
        'action_url', '/admin/payments'
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_payment_failed_notify_admins
AFTER INSERT OR UPDATE ON payments
FOR EACH ROW
EXECUTE FUNCTION trigger_notify_payment_failed();

-- Trigger 3: Session Cancelled
CREATE OR REPLACE FUNCTION public.trigger_notify_session_cancelled()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  student_name text;
  mentor_name text;
BEGIN
  -- Only notify when session status changes to 'cancelled'
  IF NEW.status = 'cancelled' AND (TG_OP = 'INSERT' OR OLD.status IS NULL OR OLD.status != 'cancelled') THEN
    -- Get student and mentor names
    SELECT ps.full_name, pm.full_name INTO student_name, mentor_name
    FROM sessions s
    JOIN profiles ps ON s.student_id = ps.id
    JOIN mentors m ON s.mentor_id = m.id
    JOIN profiles pm ON m.user_id = pm.id
    WHERE s.id = NEW.id;
    
    PERFORM notify_all_admins(
      'session_cancelled',
      '❌ Session Cancelled',
      COALESCE(student_name, 'User') || ' cancelled session with ' || COALESCE(mentor_name, 'mentor'),
      jsonb_build_object(
        'session_id', NEW.id,
        'student_id', NEW.student_id,
        'mentor_id', NEW.mentor_id,
        'scheduled_at', NEW.scheduled_at,
        'action_url', '/admin/sessions'
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_session_cancelled_notify_admins
AFTER INSERT OR UPDATE ON sessions
FOR EACH ROW
EXECUTE FUNCTION trigger_notify_session_cancelled();