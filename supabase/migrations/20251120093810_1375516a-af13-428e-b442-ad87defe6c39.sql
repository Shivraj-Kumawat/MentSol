-- Make email nullable in profiles table to support phone-only signups
ALTER TABLE public.profiles 
  ALTER COLUMN email DROP NOT NULL;

-- Add constraint to ensure at least one contact method exists
ALTER TABLE public.profiles
  ADD CONSTRAINT check_contact_method 
  CHECK (email IS NOT NULL OR phone IS NOT NULL);

-- Update the handle_new_user trigger to properly handle both email and phone signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Insert profile with either email or phone
  INSERT INTO public.profiles (id, email, phone, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.phone,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  
  -- Insert default role (student)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'student')
  );
  
  RETURN NEW;
END;
$$;