-- ============================================
-- Google Meet + Calendar Integration Migration
-- ============================================

-- 1. Add google_meet_link to mentor_availability
-- This is REQUIRED when mentor creates an availability slot
ALTER TABLE public.mentor_availability
ADD COLUMN IF NOT EXISTS google_meet_link text;

-- Add comment explaining the column
COMMENT ON COLUMN public.mentor_availability.google_meet_link IS 'Google Meet link that students will use to join the session. Required for booking.';

-- 2. Add calendar and meet tracking to sessions
-- These are populated AFTER successful payment
ALTER TABLE public.sessions
ADD COLUMN IF NOT EXISTS google_calendar_event_id text,
ADD COLUMN IF NOT EXISTS google_meet_link text;

-- Add comments explaining the columns
COMMENT ON COLUMN public.sessions.google_calendar_event_id IS 'Google Calendar event ID created after payment confirmation';
COMMENT ON COLUMN public.sessions.google_meet_link IS 'Google Meet link copied from slot after payment confirmation. Only visible to student after payment.';

-- 3. Add mentor timezone for proper calendar event creation
ALTER TABLE public.mentors
ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'Asia/Kolkata';

COMMENT ON COLUMN public.mentors.timezone IS 'Mentor timezone for Google Calendar event creation';

-- 4. Create index for faster calendar event lookups
CREATE INDEX IF NOT EXISTS idx_sessions_calendar_event 
ON public.sessions(google_calendar_event_id) 
WHERE google_calendar_event_id IS NOT NULL;

-- 5. Drop old video call columns (if they exist and no longer needed)
-- First check if they exist before dropping
DO $$
BEGIN
  -- Drop video_call_status if exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'sessions' 
    AND column_name = 'video_call_status'
  ) THEN
    ALTER TABLE public.sessions DROP COLUMN video_call_status;
  END IF;
  
  -- Drop call_initiator_id if exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'sessions' 
    AND column_name = 'call_initiator_id'
  ) THEN
    ALTER TABLE public.sessions DROP COLUMN call_initiator_id;
  END IF;
END $$;