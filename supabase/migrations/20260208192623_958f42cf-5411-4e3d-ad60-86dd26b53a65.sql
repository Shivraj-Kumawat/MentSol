-- Create RPC function to get session details for partner referrals
CREATE OR REPLACE FUNCTION public.get_promoter_referral_sessions(p_promoter_id uuid)
RETURNS TABLE(
  referral_id uuid,
  student_name text,
  student_id uuid,
  session_id uuid,
  mentor_name text,
  amount_paid integer,
  status text,
  scheduled_at timestamptz,
  commission_amount numeric
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    r.id as referral_id,
    p.full_name as student_name,
    r.referred_user_id as student_id,
    s.id as session_id,
    COALESCE(m.nickname, pm.full_name) as mentor_name,
    s.amount_paid,
    s.status,
    s.scheduled_at,
    CASE 
      WHEN s.status = 'completed' AND r.sessions_count <= 5 
      THEN (s.amount_paid * 0.10)::numeric 
      ELSE 0 
    END as commission_amount
  FROM referrals r
  JOIN profiles p ON r.referred_user_id = p.id
  JOIN sessions s ON s.student_id = r.referred_user_id
  JOIN mentors m ON s.mentor_id = m.id
  LEFT JOIN profiles pm ON m.user_id = pm.id
  WHERE r.promoter_id = p_promoter_id
    AND s.status IN ('confirmed', 'completed')
  ORDER BY s.scheduled_at DESC;
$$;