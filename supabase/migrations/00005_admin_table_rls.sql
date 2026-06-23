-- Restrict catalog mutations to admins using RESTRICTIVE policies (AND with existing permissive policies).
-- Review Dashboard → Database → Policies and remove any legacy permissive write policies that conflict.

CREATE OR REPLACE FUNCTION public.prevent_is_admin_escalation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.is_admin IS DISTINCT FROM OLD.is_admin AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Only admins may change is_admin';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_is_admin_escalation ON public.users;
CREATE TRIGGER prevent_is_admin_escalation
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_is_admin_escalation();

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS turkucitytour_users_read_own ON public.users;
CREATE POLICY turkucitytour_users_read_own
    ON public.users
    FOR SELECT
    TO authenticated
    USING (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS turkucitytour_users_update_own ON public.users;
CREATE POLICY turkucitytour_users_update_own
    ON public.users
    FOR UPDATE
    TO authenticated
    USING (id = auth.uid() OR public.is_admin())
    WITH CHECK (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS turkucitytour_users_admin_read ON public.users;
DROP POLICY IF EXISTS turkucitytour_users_admin_write ON public.users;

-- Catalog tables: non-admins must not mutate even if a legacy permissive policy exists.
DO $$
DECLARE
    tbl text;
BEGIN
    FOREACH tbl IN ARRAY ARRAY['games', 'locations', 'questions', 'answers', 'images'] LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);

        EXECUTE format(
            'DROP POLICY IF EXISTS turkucitytour_%s_insert_admin ON public.%I',
            tbl, tbl
        );
        EXECUTE format(
            'CREATE POLICY turkucitytour_%s_insert_admin ON public.%I AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (public.is_admin())',
            tbl, tbl
        );

        EXECUTE format(
            'DROP POLICY IF EXISTS turkucitytour_%s_update_admin ON public.%I',
            tbl, tbl
        );
        EXECUTE format(
            'CREATE POLICY turkucitytour_%s_update_admin ON public.%I AS RESTRICTIVE FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())',
            tbl, tbl
        );

        EXECUTE format(
            'DROP POLICY IF EXISTS turkucitytour_%s_delete_admin ON public.%I',
            tbl, tbl
        );
        EXECUTE format(
            'CREATE POLICY turkucitytour_%s_delete_admin ON public.%I AS RESTRICTIVE FOR DELETE TO authenticated USING (public.is_admin())',
            tbl, tbl
        );
    END LOOP;
END $$;
