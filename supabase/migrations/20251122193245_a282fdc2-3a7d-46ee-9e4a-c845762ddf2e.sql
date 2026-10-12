-- Drop the existing constraint
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add updated constraint with all notification types used in the system
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
CHECK (type IN (
  'offer',
  'session_reminder',
  'system',
  'session_booked',
  'mentor_request',
  'payment_failed',
  'session_cancelled'
));