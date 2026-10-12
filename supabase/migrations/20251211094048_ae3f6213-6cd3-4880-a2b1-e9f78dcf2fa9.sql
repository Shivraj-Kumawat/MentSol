-- Promoters table (marketing partners)
CREATE TABLE IF NOT EXISTS public.promoters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  name text,
  code text UNIQUE NOT NULL,
  short_ref text UNIQUE NOT NULL,
  upi_id text,
  created_at timestamptz DEFAULT now(),
  total_clicks int DEFAULT 0,
  total_signups int DEFAULT 0,
  total_sessions int DEFAULT 0,
  total_earnings numeric DEFAULT 0
);

-- Referral clicks tracking
CREATE TABLE IF NOT EXISTS public.referral_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promoter_id uuid REFERENCES public.promoters(id) ON DELETE CASCADE,
  short_ref text NOT NULL,
  ip text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Referrals (linking referred users to promoters)
CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promoter_id uuid REFERENCES public.promoters(id) ON DELETE CASCADE,
  referred_user_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  sessions_count int DEFAULT 0,
  UNIQUE(referred_user_id)
);

-- Promoter payouts
CREATE TABLE IF NOT EXISTS public.promoter_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promoter_id uuid REFERENCES public.promoters(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  paid_at timestamptz,
  tx_id text
);

-- Enable RLS
ALTER TABLE public.promoters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promoter_payouts ENABLE ROW LEVEL SECURITY;

-- Promoters RLS policies
CREATE POLICY "Users can view own promoter profile" ON public.promoters
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own promoter profile" ON public.promoters
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own promoter profile" ON public.promoters
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all promoters" ON public.promoters
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can lookup promoter by short_ref" ON public.promoters
  FOR SELECT USING (true);

-- Referral clicks RLS (service role only for writes, promoters can read own)
CREATE POLICY "Promoters can view own clicks" ON public.referral_clicks
  FOR SELECT USING (promoter_id IN (SELECT id FROM public.promoters WHERE user_id = auth.uid()));

CREATE POLICY "Service role can insert clicks" ON public.referral_clicks
  FOR INSERT WITH CHECK ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

CREATE POLICY "Admins can view all clicks" ON public.referral_clicks
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Referrals RLS
CREATE POLICY "Promoters can view own referrals" ON public.referrals
  FOR SELECT USING (promoter_id IN (SELECT id FROM public.promoters WHERE user_id = auth.uid()));

CREATE POLICY "Service role can manage referrals" ON public.referrals
  FOR ALL USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

CREATE POLICY "Admins can manage all referrals" ON public.referrals
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Promoter payouts RLS
CREATE POLICY "Promoters can view own payouts" ON public.promoter_payouts
  FOR SELECT USING (promoter_id IN (SELECT id FROM public.promoters WHERE user_id = auth.uid()));

CREATE POLICY "Promoters can request payouts" ON public.promoter_payouts
  FOR INSERT WITH CHECK (promoter_id IN (SELECT id FROM public.promoters WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage all payouts" ON public.promoter_payouts
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger to increment promoter clicks on referral_clicks insert
CREATE OR REPLACE FUNCTION public.increment_promoter_clicks()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.promoters SET total_clicks = total_clicks + 1 WHERE id = NEW.promoter_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER tr_after_referral_click
  AFTER INSERT ON public.referral_clicks
  FOR EACH ROW EXECUTE FUNCTION public.increment_promoter_clicks();

-- Trigger to increment promoter signups on referrals insert
CREATE OR REPLACE FUNCTION public.increment_promoter_signups()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.promoters SET total_signups = total_signups + 1 WHERE id = NEW.promoter_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER tr_after_referral_signup
  AFTER INSERT ON public.referrals
  FOR EACH ROW EXECUTE FUNCTION public.increment_promoter_signups();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_promoters_short_ref ON public.promoters(short_ref);
CREATE INDEX IF NOT EXISTS idx_promoters_user_id ON public.promoters(user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_user_id ON public.referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_promoter_id ON public.referrals(promoter_id);
CREATE INDEX IF NOT EXISTS idx_referral_clicks_promoter_id ON public.referral_clicks(promoter_id);