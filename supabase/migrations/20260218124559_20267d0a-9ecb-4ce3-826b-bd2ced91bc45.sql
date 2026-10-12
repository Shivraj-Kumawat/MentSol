ALTER TABLE mentor_availability
  DROP CONSTRAINT valid_duration_minutes,
  ADD CONSTRAINT valid_duration_minutes CHECK (duration_minutes = ANY (ARRAY[5, 10, 15, 20, 25, 30]));