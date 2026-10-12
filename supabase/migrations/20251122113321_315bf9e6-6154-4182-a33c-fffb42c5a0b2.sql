-- Schedule hourly session reminders cron job
SELECT cron.schedule(
  'session-reminders-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://rutxafzivumqnyxqtdsa.supabase.co/functions/v1/create-session-reminders',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1dHhhZnppdnVtcW55eHF0ZHNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzOTAzMDAsImV4cCI6MjA3ODk2NjMwMH0.YRHPP-OJnrmz4qeoXbGqTHlo0kk8_LjOPsVy1d7TQjk"}'::jsonb,
    body := '{}'::jsonb
  ) as request_id;
  $$
);