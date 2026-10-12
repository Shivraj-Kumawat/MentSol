-- Fix existing data: Mark slots used by active sessions as 'booked'
UPDATE mentor_availability ma
SET status = 'booked'
WHERE ma.id IN (
  SELECT slot_id 
  FROM sessions 
  WHERE slot_id IS NOT NULL 
    AND status IN ('confirmed', 'pending_payment')
)
AND ma.status = 'available';

-- Add comment for tracking
COMMENT ON TABLE mentor_availability IS 'Mentor availability slots. Status should be "booked" when used by a session, "available" when free, and "held" when temporarily reserved.';