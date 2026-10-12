-- Function 1: Get promoter referrals with student details (for promoters)
CREATE OR REPLACE FUNCTION public.get_promoter_referrals(p_promoter_id uuid)
RETURNS TABLE (
  referral_id uuid,
  referred_user_id uuid,
  student_name text,
  student_email text,
  student_phone text,
  student_category text,
  sessions_count integer,
  commission_earned numeric,
  total_booked_sessions bigint,
  total_completed_sessions bigint,
  total_session_amount numeric,
  referral_date timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    r.id as referral_id,
    r.referred_user_id,
    p.full_name as student_name,
    p.email as student_email,
    p.phone as student_phone,
    p.academic_category as student_category,
    r.sessions_count,
    r.commission_earned,
    (SELECT COUNT(*) FROM sessions s WHERE s.student_id = r.referred_user_id AND s.status = 'confirmed') as total_booked_sessions,
    (SELECT COUNT(*) FROM sessions s WHERE s.student_id = r.referred_user_id AND s.status = 'completed') as total_completed_sessions,
    (SELECT COALESCE(SUM(amount_paid), 0) FROM sessions s WHERE s.student_id = r.referred_user_id AND s.status IN ('confirmed', 'completed')) as total_session_amount,
    r.created_at as referral_date
  FROM referrals r
  LEFT JOIN profiles p ON r.referred_user_id = p.id
  WHERE r.promoter_id = p_promoter_id
  ORDER BY r.created_at DESC
$$;

-- Function 2: Get all referrals for admin with complete details
CREATE OR REPLACE FUNCTION public.get_all_referrals_admin()
RETURNS TABLE (
  referral_id uuid,
  promoter_id uuid,
  promoter_name text,
  promoter_code text,
  referred_user_id uuid,
  student_name text,
  student_email text,
  student_phone text,
  student_category text,
  sessions_count integer,
  commission_earned numeric,
  booked_sessions bigint,
  completed_sessions bigint,
  total_session_amount numeric,
  referral_date timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    r.id as referral_id,
    r.promoter_id,
    pr.name as promoter_name,
    pr.code as promoter_code,
    r.referred_user_id,
    p.full_name as student_name,
    p.email as student_email,
    p.phone as student_phone,
    p.academic_category as student_category,
    r.sessions_count,
    r.commission_earned,
    (SELECT COUNT(*) FROM sessions s WHERE s.student_id = r.referred_user_id AND s.status = 'confirmed') as booked_sessions,
    (SELECT COUNT(*) FROM sessions s WHERE s.student_id = r.referred_user_id AND s.status = 'completed') as completed_sessions,
    (SELECT COALESCE(SUM(amount_paid), 0) FROM sessions s WHERE s.student_id = r.referred_user_id) as total_session_amount,
    r.created_at as referral_date
  FROM referrals r
  LEFT JOIN profiles p ON r.referred_user_id = p.id
  LEFT JOIN promoters pr ON r.promoter_id = pr.id
  ORDER BY r.created_at DESC
$$;

-- Function 3: Get promoter earnings summary with time breakdowns
CREATE OR REPLACE FUNCTION public.get_promoter_earnings_summary(p_promoter_id uuid)
RETURNS TABLE (
  total_earnings numeric,
  today_earnings numeric,
  week_earnings numeric,
  month_earnings numeric,
  pending_sessions bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    pr.total_earnings,
    COALESCE((
      SELECT SUM(
        CASE 
          WHEN s.completed_at >= CURRENT_DATE AND r.sessions_count <= 5 
          THEN s.amount_paid * 0.10 
          ELSE 0 
        END
      )
      FROM referrals r
      JOIN sessions s ON s.student_id = r.referred_user_id AND s.status = 'completed'
      WHERE r.promoter_id = p_promoter_id
    ), 0) as today_earnings,
    COALESCE((
      SELECT SUM(
        CASE 
          WHEN s.completed_at >= date_trunc('week', CURRENT_DATE) AND r.sessions_count <= 5 
          THEN s.amount_paid * 0.10 
          ELSE 0 
        END
      )
      FROM referrals r  
      JOIN sessions s ON s.student_id = r.referred_user_id AND s.status = 'completed'
      WHERE r.promoter_id = p_promoter_id
    ), 0) as week_earnings,
    COALESCE((
      SELECT SUM(
        CASE 
          WHEN s.completed_at >= date_trunc('month', CURRENT_DATE) AND r.sessions_count <= 5 
          THEN s.amount_paid * 0.10 
          ELSE 0 
        END
      )
      FROM referrals r
      JOIN sessions s ON s.student_id = r.referred_user_id AND s.status = 'completed'
      WHERE r.promoter_id = p_promoter_id
    ), 0) as month_earnings,
    COALESCE((
      SELECT COUNT(*)
      FROM referrals r
      JOIN sessions s ON s.student_id = r.referred_user_id
      WHERE r.promoter_id = p_promoter_id
        AND s.status = 'confirmed'
        AND r.sessions_count < 5
    ), 0) as pending_sessions
  FROM promoters pr
  WHERE pr.id = p_promoter_id
$$;