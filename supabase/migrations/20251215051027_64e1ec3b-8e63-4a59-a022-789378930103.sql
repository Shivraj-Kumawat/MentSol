-- Add referral_code column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

-- Create function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_user_referral_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger to auto-generate referral code for new profiles
CREATE OR REPLACE FUNCTION set_profile_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := generate_user_referral_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_profile_created_set_referral_code
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_profile_referral_code();

-- Generate referral codes for existing profiles that don't have one
UPDATE public.profiles 
SET referral_code = generate_user_referral_code() 
WHERE referral_code IS NULL;

-- Create user_referrals table to track user-to-user referrals
CREATE TABLE public.user_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_booked BOOLEAN DEFAULT false,
  session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
  reward_claimed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(referred_user_id) -- Each user can only be referred once
);

-- Create index for faster lookups
CREATE INDEX idx_user_referrals_referrer ON public.user_referrals(referrer_id);
CREATE INDEX idx_user_referrals_referred ON public.user_referrals(referred_user_id);

-- Enable RLS
ALTER TABLE public.user_referrals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own referrals"
  ON public.user_referrals FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id);

CREATE POLICY "Users can insert referrals"
  ON public.user_referrals FOR INSERT
  WITH CHECK (auth.uid() = referred_user_id);

CREATE POLICY "Service role can manage all referrals"
  ON public.user_referrals FOR ALL
  USING ((auth.jwt() ->> 'role') = 'service_role');

CREATE POLICY "Admins can manage all referrals"
  ON public.user_referrals FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Add referred_by column to profiles to track who referred this user
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES public.profiles(id);

-- Create function to calculate user's referral discount
CREATE OR REPLACE FUNCTION calculate_referral_discount(user_id UUID)
RETURNS TABLE(
  total_referrals INTEGER,
  successful_referrals INTEGER,
  free_sessions_earned INTEGER,
  current_discount_percent INTEGER,
  free_sessions_used INTEGER,
  free_sessions_available INTEGER
) AS $$
DECLARE
  total_successful INTEGER;
  used_rewards INTEGER;
BEGIN
  -- Count successful referrals (where session was booked)
  SELECT COUNT(*) INTO total_successful
  FROM public.user_referrals
  WHERE referrer_id = user_id AND session_booked = true;
  
  -- Count used rewards (claimed free sessions)
  SELECT COUNT(*) INTO used_rewards
  FROM public.user_referrals
  WHERE referrer_id = user_id AND reward_claimed = true;
  
  RETURN QUERY SELECT
    (SELECT COUNT(*)::INTEGER FROM public.user_referrals WHERE referrer_id = user_id),
    total_successful,
    (total_successful / 10)::INTEGER,
    ((total_successful % 10) * 10)::INTEGER,
    used_rewards,
    ((total_successful / 10) - used_rewards)::INTEGER;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION calculate_referral_discount(UUID) TO authenticated;

-- Create trigger to update session_booked when referred user books a session
CREATE OR REPLACE FUNCTION update_referral_on_session_confirmed()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger when session status changes to 'confirmed'
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
    -- Update the referral record for this user's first session
    UPDATE public.user_referrals
    SET 
      session_booked = true,
      session_id = NEW.id,
      updated_at = now()
    WHERE referred_user_id = NEW.student_id
      AND session_booked = false
      AND session_id IS NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_session_confirmed_update_referral
  AFTER UPDATE ON public.sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_referral_on_session_confirmed();