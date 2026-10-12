-- Update the create_session_reminders function to add 5-minute notifications for both mentor and student
CREATE OR REPLACE FUNCTION public.create_session_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  session_record RECORD;
  mentor_name TEXT;
  student_name TEXT;
  mentor_user_id UUID;
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
    -- Check user preferences for student
    SELECT receive_session_reminders INTO user_prefs
    FROM notification_preferences
    WHERE user_id = session_record.student_id;
    
    -- Get mentor name and user_id
    SELECT p.full_name, m.user_id INTO mentor_name, mentor_user_id
    FROM mentors m
    JOIN profiles p ON m.user_id = p.id
    WHERE m.id = session_record.mentor_id;
    
    -- Get student name
    SELECT p.full_name INTO student_name
    FROM profiles p
    WHERE p.id = session_record.student_id;

    -- Create 1 day reminder for student (if preferences allow)
    IF session_record.scheduled_at > now() + INTERVAL '23 hours' 
       AND session_record.scheduled_at <= now() + INTERVAL '25 hours' THEN
      
      IF (NOT FOUND OR user_prefs.receive_session_reminders = true) THEN
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
    END IF;

    -- Create 1 hour reminder for student (if preferences allow)
    IF session_record.scheduled_at > now() + INTERVAL '55 minutes'
       AND session_record.scheduled_at <= now() + INTERVAL '65 minutes' THEN
      
      IF (NOT FOUND OR user_prefs.receive_session_reminders = true) THEN
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
    END IF;

    -- Create 5 minute reminder for BOTH student and mentor (when call window opens)
    IF session_record.scheduled_at > now() + INTERVAL '4 minutes'
       AND session_record.scheduled_at <= now() + INTERVAL '6 minutes' THEN
      
      -- Notify student (if preferences allow)
      IF (NOT FOUND OR user_prefs.receive_session_reminders = true) THEN
        IF NOT EXISTS (
          SELECT 1 FROM notifications 
          WHERE user_id = session_record.student_id 
            AND type = 'session_ready'
            AND metadata->>'session_id' = session_record.id::text
            AND metadata->>'reminder_type' = '5_minutes'
        ) THEN
          INSERT INTO notifications (user_id, type, title, message, metadata, is_pinned)
          VALUES (
            session_record.student_id,
            'session_ready',
            '🎥 Session Ready to Join!',
            'Your session with ' || COALESCE(mentor_name, 'your mentor') || ' starts in 5 minutes. You can join now!',
            jsonb_build_object(
              'session_id', session_record.id,
              'mentor_name', mentor_name,
              'scheduled_at', session_record.scheduled_at,
              'reminder_type', '5_minutes',
              'action_url', '/bookings'
            ),
            true
          );
        END IF;
      END IF;
      
      -- Notify mentor (always, regardless of preferences)
      IF mentor_user_id IS NOT NULL THEN
        IF NOT EXISTS (
          SELECT 1 FROM notifications 
          WHERE user_id = mentor_user_id
            AND type = 'session_ready'
            AND metadata->>'session_id' = session_record.id::text
            AND metadata->>'reminder_type' = '5_minutes'
        ) THEN
          INSERT INTO notifications (user_id, type, title, message, metadata, is_pinned)
          VALUES (
            mentor_user_id,
            'session_ready',
            '🎥 Session Ready to Join!',
            'Your session with ' || COALESCE(student_name, 'student') || ' starts in 5 minutes. You can join now!',
            jsonb_build_object(
              'session_id', session_record.id,
              'student_name', student_name,
              'scheduled_at', session_record.scheduled_at,
              'reminder_type', '5_minutes',
              'action_url', '/mentor/sessions'
            ),
            true
          );
        END IF;
      END IF;
    END IF;

  END LOOP;
END;
$function$;