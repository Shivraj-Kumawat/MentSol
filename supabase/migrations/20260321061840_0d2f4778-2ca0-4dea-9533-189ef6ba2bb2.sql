CREATE TABLE public.coaching_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coaching_name text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  coaching_type text NOT NULL DEFAULT 'both',
  student_count text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.coaching_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit coaching request"
  ON public.coaching_requests FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can manage coaching requests"
  ON public.coaching_requests FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));