-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('offer', 'session_reminder', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins can manage all notifications
CREATE POLICY "Admins can manage all notifications"
  ON public.notifications
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster queries
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);

-- Create trigger for updated_at
CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Function to create session reminder notifications
CREATE OR REPLACE FUNCTION public.create_session_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  session_record RECORD;
  mentor_name TEXT;
BEGIN
  -- Find sessions that are scheduled and need reminders
  FOR session_record IN
    SELECT s.id, s.student_id, s.mentor_id, s.scheduled_at, s.status
    FROM sessions s
    WHERE s.status = 'confirmed'
      AND s.scheduled_at IS NOT NULL
      AND s.scheduled_at > now()
      AND s.scheduled_at <= now() + INTERVAL '25 hours' -- Check for sessions in next 25 hours
  LOOP
    -- Get mentor name
    SELECT p.full_name INTO mentor_name
    FROM mentors m
    JOIN profiles p ON m.user_id = p.id
    WHERE m.id = session_record.mentor_id;

    -- Create 1 day reminder if session is between 23-25 hours away
    IF session_record.scheduled_at > now() + INTERVAL '23 hours' 
       AND session_record.scheduled_at <= now() + INTERVAL '25 hours' THEN
      
      -- Check if reminder already exists
      IF NOT EXISTS (
        SELECT 1 FROM notifications 
        WHERE user_id = session_record.student_id 
          AND type = 'session_reminder'
          AND metadata->>'session_id' = session_record.id::text
          AND metadata->>'reminder_type' = '1_day'
      ) THEN
        INSERT INTO notifications (user_id, type, title, message, metadata)
        VALUES (
          session_record.student_id,
          'session_reminder',
          '1 Day Reminder: Upcoming Session',
          'Your session with ' || COALESCE(mentor_name, 'your mentor') || ' is scheduled for tomorrow at ' || 
            to_char(session_record.scheduled_at, 'HH24:MI'),
          jsonb_build_object(
            'session_id', session_record.id,
            'mentor_name', mentor_name,
            'scheduled_at', session_record.scheduled_at,
            'reminder_type', '1_day'
          )
        );
      END IF;
    END IF;

    -- Create 1 hour reminder if session is between 55 mins - 65 mins away
    IF session_record.scheduled_at > now() + INTERVAL '55 minutes'
       AND session_record.scheduled_at <= now() + INTERVAL '65 minutes' THEN
      
      -- Check if reminder already exists
      IF NOT EXISTS (
        SELECT 1 FROM notifications 
        WHERE user_id = session_record.student_id 
          AND type = 'session_reminder'
          AND metadata->>'session_id' = session_record.id::text
          AND metadata->>'reminder_type' = '1_hour'
      ) THEN
        INSERT INTO notifications (user_id, type, title, message, metadata)
        VALUES (
          session_record.student_id,
          'session_reminder',
          '1 Hour Reminder: Session Starting Soon',
          'Your session with ' || COALESCE(mentor_name, 'your mentor') || ' starts in 1 hour at ' || 
            to_char(session_record.scheduled_at, 'HH24:MI'),
          jsonb_build_object(
            'session_id', session_record.id,
            'mentor_name', mentor_name,
            'scheduled_at', session_record.scheduled_at,
            'reminder_type', '1_hour'
          )
        );
      END IF;
    END IF;
  END LOOP;
END;
$$;

-- Insert some sample offer notifications for testing
INSERT INTO public.notifications (user_id, type, title, message, metadata)
SELECT 
  p.id,
  'offer',
  '🎉 New Year Special Offer!',
  'Get 20% off on all mentor sessions this week. Book now and save!',
  jsonb_build_object('offer_code', 'NEWYEAR20', 'discount', 20, 'valid_until', now() + INTERVAL '7 days')
FROM profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM notifications n 
  WHERE n.user_id = p.id 
    AND n.type = 'offer' 
    AND n.title = '🎉 New Year Special Offer!'
)
LIMIT 10;

INSERT INTO public.notifications (user_id, type, title, message, metadata)
SELECT 
  p.id,
  'offer',
  '💡 First Session Free!',
  'Book your first mentorship session and get it absolutely free. Limited time offer!',
  jsonb_build_object('offer_code', 'FIRST_FREE', 'discount', 100, 'valid_until', now() + INTERVAL '30 days')
FROM profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM notifications n 
  WHERE n.user_id = p.id 
    AND n.type = 'offer' 
    AND n.title = '💡 First Session Free!'
)
LIMIT 10;