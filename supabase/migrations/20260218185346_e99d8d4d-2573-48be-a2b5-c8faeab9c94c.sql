
-- Earnings table
CREATE TABLE public.earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id uuid NOT NULL REFERENCES public.mentors(id),
  session_id uuid NOT NULL REFERENCES public.sessions(id) UNIQUE,
  amount integer NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  paid_at timestamptz
);
ALTER TABLE public.earnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mentors can view own earnings" ON public.earnings
  FOR SELECT USING (
    mentor_id IN (SELECT id FROM mentors WHERE user_id = auth.uid())
  );
CREATE POLICY "Admins can manage all earnings" ON public.earnings
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Payout requests table
CREATE TABLE public.payout_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id uuid NOT NULL REFERENCES public.mentors(id),
  amount integer NOT NULL,
  status text NOT NULL DEFAULT 'requested',
  requested_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  processed_by uuid,
  admin_notes text
);
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mentors can view own payout requests" ON public.payout_requests
  FOR SELECT USING (
    mentor_id IN (SELECT id FROM mentors WHERE user_id = auth.uid())
  );
CREATE POLICY "Mentors can insert own payout requests" ON public.payout_requests
  FOR INSERT WITH CHECK (
    mentor_id IN (SELECT id FROM mentors WHERE user_id = auth.uid())
  );
CREATE POLICY "Admins can manage all payout requests" ON public.payout_requests
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Add wallet columns to mentors
ALTER TABLE public.mentors
  ADD COLUMN IF NOT EXISTS wallet_balance integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS paid_balance integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS upi_id text,
  ADD COLUMN IF NOT EXISTS bank_account text;

-- Trigger: auto-create earning + update wallet on session completion
CREATE OR REPLACE FUNCTION public.create_earning_on_session_complete()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    INSERT INTO public.earnings (mentor_id, session_id, amount)
    VALUES (NEW.mentor_id, NEW.id, COALESCE(NEW.mentor_earning, 0))
    ON CONFLICT (session_id) DO NOTHING;

    UPDATE public.mentors
    SET wallet_balance = COALESCE(wallet_balance, 0) + COALESCE(NEW.mentor_earning, 0)
    WHERE id = NEW.mentor_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_session_complete_create_earning
  AFTER UPDATE ON public.sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.create_earning_on_session_complete();
