-- Add referred_by_partner_id column to profiles for partner referral tracking
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS referred_by_partner_id uuid REFERENCES public.promoters(id);

-- Create index for efficient partner referral lookups
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by_partner ON public.profiles(referred_by_partner_id) WHERE referred_by_partner_id IS NOT NULL;

-- Ensure mentor_category_prices has is_active column
ALTER TABLE public.mentor_category_prices 
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Add commission tracking columns to referrals table
ALTER TABLE public.referrals 
ADD COLUMN IF NOT EXISTS commission_earned numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_commission_session_id uuid REFERENCES public.sessions(id);

-- Create trigger function to calculate partner commission on session completion
CREATE OR REPLACE FUNCTION public.calculate_partner_commission()
RETURNS TRIGGER AS $$
DECLARE
  v_student_id uuid;
  v_referral RECORD;
  v_commission numeric;
  v_session_price numeric;
BEGIN
  -- Only trigger when session status changes to 'completed' and has a payment
  IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.amount_paid > 0 THEN
    v_student_id := NEW.student_id;
    v_session_price := NEW.amount_paid;
    
    -- Check if student was referred by a partner and has less than 5 commissioned sessions
    SELECT * INTO v_referral
    FROM public.referrals
    WHERE referred_user_id = v_student_id
      AND sessions_count < 5
    LIMIT 1;
    
    IF FOUND THEN
      -- Calculate 10% commission
      v_commission := v_session_price * 0.10;
      
      -- Update referral record
      UPDATE public.referrals
      SET sessions_count = sessions_count + 1,
          commission_earned = commission_earned + v_commission,
          last_commission_session_id = NEW.id
      WHERE id = v_referral.id;
      
      -- Update promoter total earnings
      UPDATE public.promoters
      SET total_earnings = total_earnings + v_commission,
          total_sessions = total_sessions + 1
      WHERE id = v_referral.promoter_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on sessions table
DROP TRIGGER IF EXISTS on_session_completed_partner_commission ON public.sessions;
CREATE TRIGGER on_session_completed_partner_commission
  AFTER UPDATE ON public.sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_partner_commission();