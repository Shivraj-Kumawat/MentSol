-- Ensure REPLICA IDENTITY is set for sessions table for realtime updates
ALTER TABLE public.sessions REPLICA IDENTITY FULL;