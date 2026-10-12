-- Add new columns to otp_verifications for production-ready OTP
ALTER TABLE otp_verifications 
ADD COLUMN IF NOT EXISTS purpose text DEFAULT 'login',
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS resend_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_sent_at timestamptz,
ADD COLUMN IF NOT EXISTS blocked_until timestamptz,
ADD COLUMN IF NOT EXISTS max_attempts integer DEFAULT 5,
ADD COLUMN IF NOT EXISTS ip_address text;

-- Update existing rows to have default status
UPDATE otp_verifications 
SET status = CASE WHEN verified = true THEN 'verified' ELSE 'pending' END
WHERE status IS NULL;

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_otp_email_purpose_status 
ON otp_verifications(contact, purpose, status);

-- Create index for rate limiting by IP
CREATE INDEX IF NOT EXISTS idx_otp_ip_created 
ON otp_verifications(ip_address, created_at);