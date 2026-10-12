-- Fix admin role for existing user thakarelaukik16@gmail.com
DELETE FROM public.user_roles 
WHERE user_id = 'da063f4d-29a9-4311-9f73-ea16be0fb4e4' AND role = 'student';

INSERT INTO public.user_roles (user_id, role)
VALUES ('da063f4d-29a9-4311-9f73-ea16be0fb4e4', 'admin'::app_role)
ON CONFLICT (user_id, role) DO NOTHING;