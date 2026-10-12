-- Fix handle_partner_signup to remove redundant user_roles insert
-- The handle_new_user trigger already handles role insertion correctly
-- This trigger only needs to create the promoters record

CREATE OR REPLACE FUNCTION public.handle_partner_signup()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
  user_role text;
begin
  -- Read role from signup metadata
  user_role := new.raw_user_meta_data ->> 'role';

  -- Only for partner
  if user_role = 'partner' then
    -- Note: user_roles insert is handled by handle_new_user trigger
    -- We only need to insert into promoters here
    
    -- Insert into promoters (DB defaults handle code, short_ref, counters)
    insert into public.promoters (user_id, name)
    values (
      new.id,
      coalesce(new.raw_user_meta_data ->> 'full_name', 'Partner')
    );
  end if;

  return new;
end;
$function$;