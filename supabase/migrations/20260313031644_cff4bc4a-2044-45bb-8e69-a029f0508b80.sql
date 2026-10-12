ALTER TABLE mentor_availability
  DROP CONSTRAINT valid_duration_minutes,
  ADD CONSTRAINT valid_duration_minutes CHECK (duration_minutes > 0);