-- Phase 2: Comprehensive Database Schema for MentSol

-- Add new columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS login_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_login_at timestamptz,
ADD COLUMN IF NOT EXISTS requires_password_set boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending'));

-- Create mentors table
CREATE TABLE IF NOT EXISTS public.mentors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  bio text,
  specialization text,
  qualifications text[],
  documents_urls text[],
  fixed_rate_per_15m integer DEFAULT 0, -- rate in paise
  allow_rate_edit boolean DEFAULT false,
  status text DEFAULT 'pending_request' CHECK (status IN ('pending_request', 'active', 'suspended', 'rejected')),
  total_sessions integer DEFAULT 0,
  total_earnings integer DEFAULT 0,
  rating numeric(3,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.mentors ENABLE ROW LEVEL SECURITY;

-- Mentors can view and update their own profile
CREATE POLICY "Mentors can view own profile"
  ON public.mentors
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Mentors can update own profile"
  ON public.mentors
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins can manage all mentors
CREATE POLICY "Admins can manage all mentors"
  ON public.mentors
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Public can view active mentors
CREATE POLICY "Public can view active mentors"
  ON public.mentors
  FOR SELECT
  USING (status = 'active');

-- Create mentor_availability table
CREATE TABLE IF NOT EXISTS public.mentor_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id uuid REFERENCES public.mentors(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  timezone text DEFAULT 'Asia/Kolkata',
  status text DEFAULT 'available' CHECK (status IN ('available', 'held', 'booked')),
  held_until timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.mentor_availability ENABLE ROW LEVEL SECURITY;

-- Public can view available slots
CREATE POLICY "Public can view available slots"
  ON public.mentor_availability
  FOR SELECT
  USING (status = 'available' OR status = 'held');

-- Mentors can manage their own availability
CREATE POLICY "Mentors can manage own availability"
  ON public.mentor_availability
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.mentors 
      WHERE mentors.id = mentor_availability.mentor_id 
      AND mentors.user_id = auth.uid()
    )
  );

-- Admins can manage all availability
CREATE POLICY "Admins can manage all availability"
  ON public.mentor_availability
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Create sessions table
CREATE TABLE IF NOT EXISTS public.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  mentor_id uuid REFERENCES public.mentors(id) ON DELETE CASCADE NOT NULL,
  slot_id uuid REFERENCES public.mentor_availability(id),
  status text DEFAULT 'pending_payment' CHECK (status IN ('pending_payment', 'paid', 'confirmed', 'completed', 'cancelled', 'refunded')),
  pre_session_brief jsonb,
  amount_paid integer DEFAULT 0,
  platform_fee integer DEFAULT 0,
  mentor_earning integer DEFAULT 0,
  payment_id text,
  scheduled_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Students can view their own sessions
CREATE POLICY "Students can view own sessions"
  ON public.sessions
  FOR SELECT
  USING (auth.uid() = student_id);

-- Mentors can view their sessions
CREATE POLICY "Mentors can view their sessions"
  ON public.sessions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.mentors 
      WHERE mentors.id = sessions.mentor_id 
      AND mentors.user_id = auth.uid()
    )
  );

-- Admins can manage all sessions
CREATE POLICY "Admins can manage all sessions"
  ON public.sessions
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Students can insert their own sessions
CREATE POLICY "Students can create sessions"
  ON public.sessions
  FOR INSERT
  WITH CHECK (auth.uid() = student_id);

-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL,
  razorpay_order_id text,
  razorpay_payment_id text,
  razorpay_signature text,
  amount integer NOT NULL,
  currency text DEFAULT 'INR',
  status text DEFAULT 'created' CHECK (status IN ('created', 'captured', 'failed', 'refunded')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Users can view payments for their own sessions
CREATE POLICY "Users can view own payments"
  ON public.payments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions 
      WHERE sessions.id = payments.session_id 
      AND sessions.student_id = auth.uid()
    )
  );

-- Admins can manage all payments
CREATE POLICY "Admins can manage all payments"
  ON public.payments
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Create moderation_logs table
CREATE TABLE IF NOT EXISTS public.moderation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.sessions(id) ON DELETE CASCADE,
  detected_type text CHECK (detected_type IN ('phone_number', 'email', 'social_handle', 'other')),
  detected_content text,
  context text,
  action_taken text,
  reviewed_by_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.moderation_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can access moderation logs
CREATE POLICY "Only admins can access moderation logs"
  ON public.moderation_logs
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger to update updated_at columns
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_mentors_updated_at ON public.mentors;
CREATE TRIGGER update_mentors_updated_at
  BEFORE UPDATE ON public.mentors
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_mentor_availability_updated_at ON public.mentor_availability;
CREATE TRIGGER update_mentor_availability_updated_at
  BEFORE UPDATE ON public.mentor_availability
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_sessions_updated_at ON public.sessions;
CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON public.sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_payments_updated_at ON public.payments;
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Seed admin user
-- Note: This will only work if the auth.users table allows direct inserts
-- In production, create the admin user through Supabase Auth UI first, then update the profile

-- Create a function to track login count
CREATE OR REPLACE FUNCTION public.increment_login_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET login_count = COALESCE(login_count, 0) + 1,
      last_login_at = now()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

-- Note: This trigger would go on auth.users which we cannot modify directly
-- Instead, increment login_count in the application code when user signs in