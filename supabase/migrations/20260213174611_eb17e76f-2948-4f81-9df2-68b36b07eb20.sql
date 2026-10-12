
CREATE OR REPLACE FUNCTION public.handle_new_mentor_role()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  IF NEW.role = 'mentor' THEN
    INSERT INTO mentors (
      user_id,
      mentor_types,
      status
    )
    VALUES (
      NEW.user_id,
      ARRAY[]::text[],
      'pending_request'
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;
