-- Backfill google_meet_link for existing confirmed sessions
-- Copy the link from mentor_availability slot to sessions where missing
UPDATE sessions s
SET google_meet_link = ma.google_meet_link
FROM mentor_availability ma
WHERE s.slot_id = ma.id
  AND s.status = 'confirmed'
  AND s.google_meet_link IS NULL
  AND ma.google_meet_link IS NOT NULL;