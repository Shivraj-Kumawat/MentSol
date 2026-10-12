-- Create notification preferences table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  receive_offers BOOLEAN NOT NULL DEFAULT true,
  receive_session_reminders BOOLEAN NOT NULL DEFAULT true,
  receive_system_updates BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own preferences"
  ON public.notification_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON public.notification_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON public.notification_preferences
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins can manage all preferences
CREATE POLICY "Admins can manage all preferences"
  ON public.notification_preferences
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create index
CREATE INDEX idx_notification_preferences_user_id ON public.notification_preferences(user_id);

-- Function to get or create user preferences
CREATE OR REPLACE FUNCTION public.get_or_create_notification_preferences(p_user_id UUID)
RETURNS public.notification_preferences
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_preferences notification_preferences;
BEGIN
  -- Try to get existing preferences
  SELECT * INTO v_preferences
  FROM notification_preferences
  WHERE user_id = p_user_id;
  
  -- If not found, create default preferences
  IF NOT FOUND THEN
    INSERT INTO notification_preferences (user_id)
    VALUES (p_user_id)
    RETURNING * INTO v_preferences;
  END IF;
  
  RETURN v_preferences;
END;
$$;

-- Update create_session_reminders function to respect preferences
CREATE OR REPLACE FUNCTION public.create_session_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  session_record RECORD;
  mentor_name TEXT;
  user_prefs RECORD;
BEGIN
  -- Find sessions that are scheduled and need reminders
  FOR session_record IN
    SELECT s.id, s.student_id, s.mentor_id, s.scheduled_at, s.status
    FROM sessions s
    WHERE s.status = 'confirmed'
      AND s.scheduled_at IS NOT NULL
      AND s.scheduled_at > now()
      AND s.scheduled_at <= now() + INTERVAL '25 hours'
  LOOP
    -- Check user preferences
    SELECT receive_session_reminders INTO user_prefs
    FROM notification_preferences
    WHERE user_id = session_record.student_id;
    
    -- Skip if user has disabled session reminders
    IF FOUND AND user_prefs.receive_session_reminders = false THEN
      CONTINUE;
    END IF;
    
    -- Get mentor name
    SELECT p.full_name INTO mentor_name
    FROM mentors m
    JOIN profiles p ON m.user_id = p.id
    WHERE m.id = session_record.mentor_id;

    -- Create 1 day reminder if session is between 23-25 hours away
    IF session_record.scheduled_at > now() + INTERVAL '23 hours' 
       AND session_record.scheduled_at <= now() + INTERVAL '25 hours' THEN
      
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