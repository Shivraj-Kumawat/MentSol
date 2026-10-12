-- Add nickname column to mentors table
ALTER TABLE mentors 
ADD COLUMN nickname text;

-- Add a comment explaining the column
COMMENT ON COLUMN mentors.nickname IS 'Display name shown to students instead of full name for privacy';

-- Add check constraint for reasonable nickname length
ALTER TABLE mentors 
ADD CONSTRAINT mentors_nickname_length CHECK (char_length(nickname) <= 50);