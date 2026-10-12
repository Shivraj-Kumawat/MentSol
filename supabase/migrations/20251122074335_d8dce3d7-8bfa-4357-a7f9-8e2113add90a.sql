-- Function to auto-assign admin role to specific emails
CREATE OR REPLACE FUNCTION public.auto_assign_admin_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_emails TEXT[] := ARRAY['thakarelaukik16@gmail.com'];
BEGIN
  -- Check if the new user's email is in the admin list
  IF NEW.email = ANY(admin_emails) THEN
    -- Wait for profile to be created by handle_new_user trigger
    -- Then update the role
    UPDATE public.user_roles 
    SET role = 'admin'::app_role 
    WHERE user_id = NEW.id;
    
    -- If no role exists yet, insert it (backup)
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created_admin ON auth.users;

-- Trigger on auth.users table (runs after handle_new_user)
CREATE TRIGGER on_auth_user_created_admin
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.auto_assign_admin_role();