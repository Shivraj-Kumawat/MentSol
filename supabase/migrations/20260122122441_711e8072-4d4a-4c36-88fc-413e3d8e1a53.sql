-- =====================================================
-- COMPLETE MENTOR EARNINGS, REVIEWS & SESSION SYSTEM
-- =====================================================

-- 1. Function to update mentor earnings when session is completed
CREATE OR REPLACE FUNCTION public.update_mentor_earnings_on_complete()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger when status changes TO completed
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    UPDATE mentors
    SET 
      total_earnings = COALESCE(total_earnings, 0) + COALESCE(NEW.mentor_earning, 0),
      total_sessions = COALESCE(total_sessions, 0) + 1,
      updated_at = NOW()
    WHERE id = NEW.mentor_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing trigger if exists and create new one
DROP TRIGGER IF EXISTS trigger_update_mentor_earnings ON sessions;
CREATE TRIGGER trigger_update_mentor_earnings
AFTER UPDATE ON sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_mentor_earnings_on_complete();

-- 2. Function to update mentor rating when review is submitted
CREATE OR REPLACE FUNCTION public.update_mentor_rating_on_review()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE mentors
  SET 
    rating = (
      SELECT COALESCE(ROUND(AVG(rating)::numeric, 2), 0)
      FROM reviews
      WHERE mentor_id = NEW.mentor_id
    ),
    updated_at = NOW()
  WHERE id = NEW.mentor_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing trigger if exists and create new one
DROP TRIGGER IF EXISTS trigger_update_mentor_rating ON reviews;
CREATE TRIGGER trigger_update_mentor_rating
AFTER INSERT OR UPDATE ON reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_mentor_rating_on_review();

-- 3. BACKFILL: Mark past confirmed sessions as completed
UPDATE sessions
SET 
  status = 'completed', 
  completed_at = COALESCE(completed_at, scheduled_at + INTERVAL '15 minutes'),
  updated_at = NOW()
WHERE 
  status = 'confirmed' 
  AND scheduled_at IS NOT NULL
  AND scheduled_at < NOW() - INTERVAL '30 minutes';

-- 4. BACKFILL: Recalculate all mentor earnings from completed sessions
UPDATE mentors m
SET 
  total_earnings = COALESCE((
    SELECT SUM(mentor_earning)
    FROM sessions s
    WHERE s.mentor_id = m.id AND s.status = 'completed'
  ), 0),
  total_sessions = COALESCE((
    SELECT COUNT(*)
    FROM sessions s
    WHERE s.mentor_id = m.id AND s.status = 'completed'
  ), 0),
  updated_at = NOW();

-- 5. BACKFILL: Recalculate all mentor ratings from reviews
UPDATE mentors m
SET 
  rating = COALESCE((
    SELECT ROUND(AVG(r.rating)::numeric, 2)
    FROM reviews r
    WHERE r.mentor_id = m.id
  ), 0),
  updated_at = NOW();