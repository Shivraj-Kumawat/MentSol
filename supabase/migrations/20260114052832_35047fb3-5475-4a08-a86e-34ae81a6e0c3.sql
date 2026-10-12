-- Add password_enabled column to profiles table
-- This tracks whether a user has set up their password after first magic link login

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS password_enabled boolean NOT NULL DEFAULT false;

-- Add an index for efficient querying
CREATE INDEX IF NOT EXISTS idx_profiles_password_enabled ON public.profiles(password_enabled);

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.password_enabled IS 'Indicates if user has set a password after first magic link login';

-- RLS policy already covers this column via existing policies (users can update their own profile)