
-- Add session pricing settings  
INSERT INTO platform_settings (setting_key, setting_value, setting_type, description)
VALUES 
  ('session_price_30m', '{"value": 149}', 'commission', 'Default price for 30-minute sessions (in ₹)'),
  ('session_price_60m', '{"value": 249}', 'commission', 'Default price for 60-minute sessions (in ₹)')
ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value;

-- Add long-term plans
INSERT INTO plans (plan_key, name, category, duration_minutes, strategy_mode, sort_order, features, description, is_active)
VALUES 
  ('jee_advanced_2026', 'JEE Advanced 2026 Plan', 'jee', 60, 'manual_connect', 10, 
   '["Weekly live one-to-one meeting with mentors", "Full marks analysis", "Study analysis and tracking", "Unlimited mentor chats", "Study materials access"]'::jsonb,
   'Complete JEE Advanced 2026 preparation program', true),
  ('neet_2026', 'NEET 2026 Plan', 'neet', 60, 'manual_connect', 10,
   '["Weekly live one-to-one meeting with mentors", "Full marks analysis", "Study analysis and tracking", "Unlimited mentor chats", "Study materials access"]'::jsonb,
   'Complete NEET 2026 preparation program', true)
ON CONFLICT (plan_key) DO UPDATE SET 
  name = EXCLUDED.name,
  features = EXCLUDED.features,
  description = EXCLUDED.description;
