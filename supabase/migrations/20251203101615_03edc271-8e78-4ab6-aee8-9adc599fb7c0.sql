
-- Clean up expired held slots
UPDATE mentor_availability 
SET status = 'available', held_until = NULL 
WHERE status = 'held' AND (held_until IS NULL OR held_until < NOW());

-- Mark payments for orphaned pending_payment sessions as failed
UPDATE payments 
SET status = 'failed', updated_at = NOW()
WHERE session_id IN (
  SELECT id FROM sessions 
  WHERE status = 'pending_payment' 
  AND created_at < NOW() - INTERVAL '15 minutes'
) AND status IN ('created', 'pending');

-- Delete orphaned pending_payment sessions older than 15 minutes
DELETE FROM sessions 
WHERE status = 'pending_payment' 
AND created_at < NOW() - INTERVAL '15 minutes';
