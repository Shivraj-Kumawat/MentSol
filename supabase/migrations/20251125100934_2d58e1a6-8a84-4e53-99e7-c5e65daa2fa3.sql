-- Add columns to reviews table for admin management
ALTER TABLE reviews 
ADD COLUMN IF NOT EXISTS is_flagged boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS admin_response text;

-- Add index for flagged reviews
CREATE INDEX IF NOT EXISTS idx_reviews_flagged ON reviews(is_flagged) WHERE is_flagged = true;

-- Add comment
COMMENT ON COLUMN reviews.is_flagged IS 'Whether the review has been flagged for admin attention';
COMMENT ON COLUMN reviews.admin_response IS 'Admin response or comment on the review';