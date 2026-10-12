-- Create OTP verification tracking table
CREATE TABLE public.otp_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact text NOT NULL,
  otp_hash text NOT NULL,
  type text NOT NULL CHECK (type IN ('email', 'phone')),
  expires_at timestamptz NOT NULL,
  attempts integer DEFAULT 0,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Add index for quick lookup
CREATE INDEX idx_otp_contact ON public.otp_verifications(contact, verified, expires_at);

-- Enable RLS
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;

-- Service role only policy (no public access)
CREATE POLICY "Service role only" ON public.otp_verifications
  FOR ALL USING (auth.jwt() ->> 'role'::text = 'service_role'::text);

-- Add comment
COMMENT ON TABLE public.otp_verifications IS 'Tracks OTP verification attempts for email and phone authentication';