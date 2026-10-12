-- Fix Security Definer View Issue
-- Drop the security definer view and recreate without it
DROP VIEW IF EXISTS public.pg_stat_statements_readonly CASCADE;

-- Fix RLS Disabled Issue
-- Enable RLS on pg_stat_statements_report table
ALTER TABLE public.pg_stat_statements_report ENABLE ROW LEVEL SECURITY;

-- Add admin-only access policy for the report table
CREATE POLICY "Only admins can access pg_stat_statements_report"
ON public.pg_stat_statements_report
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));