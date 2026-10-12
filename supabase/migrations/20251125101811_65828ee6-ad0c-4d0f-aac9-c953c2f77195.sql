-- Create platform_settings table for system-wide configuration
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  setting_type TEXT NOT NULL CHECK (setting_type IN ('commission', 'policy', 'feature', 'email', 'general')),
  description TEXT,
  updated_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes
CREATE INDEX idx_platform_settings_key ON platform_settings(setting_key);
CREATE INDEX idx_platform_settings_type ON platform_settings(setting_type);

-- Enable RLS
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Only admins can manage settings
CREATE POLICY "Admins can manage all settings"
  ON platform_settings FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create settings history table for audit trail
CREATE TABLE IF NOT EXISTS public.settings_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  changed_by UUID NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes
CREATE INDEX idx_settings_history_key ON settings_history(setting_key);
CREATE INDEX idx_settings_history_changed_by ON settings_history(changed_by);
CREATE INDEX idx_settings_history_date ON settings_history(changed_at);

-- Enable RLS
ALTER TABLE settings_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view settings history"
  ON settings_history FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default platform settings
INSERT INTO platform_settings (setting_key, setting_value, setting_type, description) VALUES
  ('platform_commission_percentage', '{"value": 20}', 'commission', 'Platform commission percentage on mentor earnings'),
  ('minimum_session_rate', '{"value": 100}', 'commission', 'Minimum session rate in rupees per 15 minutes'),
  ('maximum_reschedules_allowed', '{"value": 2}', 'policy', 'Maximum number of reschedules allowed per session'),
  ('cancellation_window_hours', '{"value": 24}', 'policy', 'Hours before session when cancellation is allowed'),
  ('late_cancellation_penalty_percentage', '{"value": 20}', 'policy', 'Penalty percentage for late cancellations'),
  ('auto_refund_enabled', '{"value": false}', 'policy', 'Automatically process refunds for cancelled sessions'),
  ('instant_mentor_enabled', '{"value": true}', 'feature', 'Enable instant mentor matching feature'),
  ('maintenance_mode', '{"value": false}', 'feature', 'Put platform in maintenance mode'),
  ('new_mentor_approval_required', '{"value": true}', 'feature', 'Require admin approval for new mentor accounts'),
  ('session_reminder_1day', '{"value": true}', 'feature', 'Send 1-day reminder before sessions'),
  ('session_reminder_1hour', '{"value": true}', 'feature', 'Send 1-hour reminder before sessions'),
  ('welcome_email_enabled', '{"value": true}', 'email', 'Send welcome email to new users'),
  ('booking_confirmation_email', '{"value": true}', 'email', 'Send email confirmation for bookings'),
  ('platform_name', '{"value": "Mentor Platform"}', 'general', 'Platform display name'),
  ('support_email', '{"value": "support@platform.com"}', 'general', 'Platform support email address'),
  ('max_session_duration_minutes', '{"value": 120}', 'policy', 'Maximum session duration in minutes')
ON CONFLICT (setting_key) DO NOTHING;

-- Comments
COMMENT ON TABLE platform_settings IS 'System-wide platform configuration settings';
COMMENT ON TABLE settings_history IS 'Audit trail for platform settings changes';
COMMENT ON COLUMN platform_settings.setting_key IS 'Unique identifier for the setting';
COMMENT ON COLUMN platform_settings.setting_value IS 'JSON value of the setting';
COMMENT ON COLUMN platform_settings.setting_type IS 'Type: commission, policy, feature, email, general';