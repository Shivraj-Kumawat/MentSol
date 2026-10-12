-- Add academic_category and board columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS academic_category text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS board text;

-- Create mentor_category_prices table for category-specific pricing
CREATE TABLE public.mentor_category_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id uuid NOT NULL REFERENCES public.mentors(id) ON DELETE CASCADE,
  category text NOT NULL,
  price_per_15m integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(mentor_id, category)
);

-- Enable RLS on mentor_category_prices
ALTER TABLE public.mentor_category_prices ENABLE ROW LEVEL SECURITY;

-- RLS policies for mentor_category_prices
CREATE POLICY "Anyone can view mentor category prices"
ON public.mentor_category_prices FOR SELECT
USING (true);

CREATE POLICY "Admins can manage all category prices"
ON public.mentor_category_prices FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create mentor_price_requests table for price change requests
CREATE TABLE public.mentor_price_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id uuid NOT NULL REFERENCES public.mentors(id) ON DELETE CASCADE,
  category text NOT NULL,
  current_price integer NOT NULL DEFAULT 0,
  requested_price integer NOT NULL,
  message text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes text,
  reviewed_by uuid REFERENCES public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on mentor_price_requests
ALTER TABLE public.mentor_price_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for mentor_price_requests
CREATE POLICY "Mentors can view own price requests"
ON public.mentor_price_requests FOR SELECT
USING (mentor_id IN (
  SELECT id FROM public.mentors WHERE user_id = auth.uid()
));

CREATE POLICY "Mentors can insert own price requests"
ON public.mentor_price_requests FOR INSERT
WITH CHECK (mentor_id IN (
  SELECT id FROM public.mentors WHERE user_id = auth.uid()
));

CREATE POLICY "Admins can manage all price requests"
ON public.mentor_price_requests FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at on mentor_price_requests
CREATE TRIGGER update_mentor_price_requests_updated_at
BEFORE UPDATE ON public.mentor_price_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updated_at on mentor_category_prices
CREATE TRIGGER update_mentor_category_prices_updated_at
BEFORE UPDATE ON public.mentor_category_prices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();