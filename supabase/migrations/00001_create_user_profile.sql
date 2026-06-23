-- Harden create_user_profile: bind profile to auth.uid(), never trust client-supplied uid.
-- Apply in Supabase SQL Editor before deploying the updated Register.jsx.

CREATE OR REPLACE FUNCTION public.create_user_profile(
    first_name text,
    last_name text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid := auth.uid();
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    INSERT INTO public.users (id, first_name, last_name, is_admin)
    VALUES (v_user_id, first_name, last_name, false)
    ON CONFLICT (id) DO UPDATE
        SET first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name;
END;
$$;

REVOKE ALL ON FUNCTION public.create_user_profile(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_user_profile(text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_user_profile(text, text) TO authenticated;

-- Drop legacy signature if it exists (client previously passed uid).
DROP FUNCTION IF EXISTS public.create_user_profile(uuid, text, text);
