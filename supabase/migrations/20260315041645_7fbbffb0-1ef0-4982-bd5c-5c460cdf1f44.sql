
CREATE TABLE public.referral_discounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promoter_id uuid REFERENCES public.promoters(id) ON DELETE SET NULL,
  student_id uuid NOT NULL,
  session_id uuid REFERENCES public.sessions(id) ON DELETE SET NULL,
  referral_code text NOT NULL,
  original_price integer NOT NULL,
  discount_amount integer NOT NULL DEFAULT 50,
  final_price integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.referral_discounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all referral_discounts"
  ON public.referral_discounts FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Students can view own referral_discounts"
  ON public.referral_discounts FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Service role can manage referral_discounts"
  ON public.referral_discounts FOR ALL
  USING (((SELECT auth.jwt()) ->> 'role') = 'service_role');
