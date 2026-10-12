
-- =============================================
-- Phase 1a: Create plans table
-- =============================================
CREATE TABLE public.plans (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category text NOT NULL,
  plan_key text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  duration_minutes integer NOT NULL,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  strategy_mode text NOT NULL,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add constraints
ALTER TABLE public.plans ADD CONSTRAINT plans_category_check CHECK (category IN ('jee', 'neet', 'college_counselling'));
ALTER TABLE public.plans ADD CONSTRAINT plans_strategy_mode_check CHECK (strategy_mode IN ('auto_slot', 'manual_connect'));
ALTER TABLE public.plans ADD CONSTRAINT plans_duration_check CHECK (duration_minutes IN (30, 60));

-- RLS for plans
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all plans"
ON public.plans FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can view active plans"
ON public.plans FOR SELECT
USING (is_active = true);

-- Trigger for updated_at
CREATE TRIGGER update_plans_updated_at
BEFORE UPDATE ON public.plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- Phase 1b: Create plan_mentor_prices table
-- =============================================
CREATE TABLE public.plan_mentor_prices (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id uuid NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  mentor_id uuid NOT NULL REFERENCES public.mentors(id) ON DELETE CASCADE,
  price integer NOT NULL CHECK (price >= 0),
  is_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(plan_id, mentor_id)
);

-- RLS for plan_mentor_prices
ALTER TABLE public.plan_mentor_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all plan mentor prices"
ON public.plan_mentor_prices FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can view enabled plan mentor prices"
ON public.plan_mentor_prices FOR SELECT
USING (is_enabled = true);

-- Trigger for updated_at
CREATE TRIGGER update_plan_mentor_prices_updated_at
BEFORE UPDATE ON public.plan_mentor_prices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- Phase 1c: Extend sessions table
-- =============================================
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS plan_id uuid REFERENCES public.plans(id);
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS plan_type text;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS manual_assign_required boolean DEFAULT false;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS strategy_mode text;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS mentor_assigned_at timestamptz;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS mentor_connected boolean DEFAULT false;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS chat_access_enabled boolean DEFAULT false;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS program_started boolean DEFAULT false;

-- =============================================
-- Phase 1e: Seed initial plans (4 JEE + 4 NEET)
-- =============================================
INSERT INTO public.plans (category, plan_key, name, description, duration_minutes, features, strategy_mode, sort_order) VALUES
(
  'jee', 'rank_starter', 'Rank Starter Call', 'Entry level structured strategy session',
  30,
  '["1:1 30 min strategy call", "Personalized exam roadmap", "Study structure clarity", "Resource optimization guidance", "Mentor availability based booking"]'::jsonb,
  'auto_slot', 1
),
(
  'jee', 'rank_builder', 'Rank Builder Program', 'JEE Mains improvement program',
  60,
  '["60 min deep strategy session", "Daily doubt chat support", "Weekly structured progress tracking", "Study accountability structure", "Mains-oriented performance design"]'::jsonb,
  'manual_connect', 2
),
(
  'jee', 'rank_boost_elite', 'Rank Boost Elite', 'Mains + Advanced performance acceleration',
  60,
  '["60 min performance strategy session", "Daily priority chat access", "Weekly test score analysis", "Weak area breakdown", "Weekly study plan updates", "Mistake pattern correction system"]'::jsonb,
  'manual_connect', 3
),
(
  'jee', 'air_command', 'AIR Command Program', 'Highest tier JEE strategy program',
  60,
  '["60 min master strategy call", "3 video calls per week", "Daily follow-up chat", "Weekly performance analytics report", "Mains + Advanced structured roadmap", "Revision cycle engineering", "Personal accountability tracking", "Emergency doubt priority access"]'::jsonb,
  'manual_connect', 4
),
(
  'neet', 'medical_starter', 'Medical Starter Call', 'Entry level medical strategy session',
  30,
  '["1:1 30 min strategy call", "Personalized exam roadmap", "Study structure clarity", "Resource optimization guidance", "Mentor availability based booking"]'::jsonb,
  'auto_slot', 1
),
(
  'neet', 'score_stabilizer', 'Score Stabilizer Program', 'NEET score improvement program',
  60,
  '["60 min deep strategy session", "Daily chat access", "Weekly accuracy tracking", "MCQ error correction mapping"]'::jsonb,
  'manual_connect', 2
),
(
  'neet', 'aiims_accelerator', 'AIIMS Accelerator', 'AIIMS-focused performance acceleration',
  60,
  '["60 min performance session", "Daily priority chat", "Weekly test analysis", "Weak subject mapping", "Biology retention cycle optimization", "Accuracy improvement tracking"]'::jsonb,
  'manual_connect', 3
),
(
  'neet', 'topper_intensive', 'Topper Intensive Track', 'Highest tier NEET strategy program',
  60,
  '["60 min master planning", "3 weekly video calls", "Daily structured follow-up", "Weekly performance audit", "Retention analytics", "Government seat focused strategy"]'::jsonb,
  'manual_connect', 4
);
