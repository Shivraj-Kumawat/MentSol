-- Add 'partner' to the app_role enum so the handle_partner_signup trigger can insert the role
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'partner';