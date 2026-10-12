-- Add duration_minutes column to mentor_availability table
ALTER TABLE mentor_availability 
ADD COLUMN duration_minutes INTEGER NOT NULL DEFAULT 15;

-- Add comment for clarity
COMMENT ON COLUMN mentor_availability.duration_minutes IS 'Session duration in minutes (5, 10, 15, or 20)';

-- Add check constraint to ensure only valid durations
ALTER TABLE mentor_availability
ADD CONSTRAINT valid_duration_minutes CHECK (duration_minutes IN (5, 10, 15, 20));
