-- SECURITY FIX: Remove public access to project_notes
DROP POLICY IF EXISTS "Allow public read access to project_notes" ON public.project_notes;

-- Create admin-only policy for project_notes
CREATE POLICY "Only admins can access project_notes" 
ON public.project_notes 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- SECURITY FIX: Update database functions with proper search_path
CREATE OR REPLACE FUNCTION public.snapshot_pg_stat_statements()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.pg_stat_statements_report (recorded_at, query, calls, total_exec_time, total_plan_time, mean_exec_time, mean_plan_time, rows)
  SELECT now(), query, calls, total_exec_time, total_plan_time, mean_exec_time, mean_plan_time, rows
  FROM extensions.pg_stat_statements
  ORDER BY total_exec_time DESC
  LIMIT 50;
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_pg_stat_statements_report()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.pg_stat_statements_report WHERE recorded_at < now() - interval '7 days';
END;
$$;