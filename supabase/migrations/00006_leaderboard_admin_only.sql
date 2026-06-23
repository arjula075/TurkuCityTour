-- Leaderboard views are VIEWs, not tables — RLS policies cannot be attached directly.
-- Pattern: rename the original view to *__admin_backing, expose a wrapper filtered by is_admin().
-- Requires 00003_is_admin_helper.sql first.

CREATE OR REPLACE FUNCTION public._wrap_leaderboard_view_for_admin(view_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    backing_name text := view_name || '__admin_backing';
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
          AND c.relname = view_name
          AND c.relkind = 'v'
    ) THEN
        RAISE NOTICE 'Skipping % — not a view in public schema', view_name;
        RETURN;
    END IF;

    -- Already wrapped: public view exists and reads from backing.
    IF EXISTS (
        SELECT 1
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
          AND c.relname = backing_name
          AND c.relkind = 'v'
    ) THEN
        EXECUTE format(
            'CREATE OR REPLACE VIEW public.%I AS SELECT * FROM public.%I WHERE public.is_admin()',
            view_name,
            backing_name
        );
    ELSE
        EXECUTE format('ALTER VIEW public.%I RENAME TO %I', view_name, backing_name);
        EXECUTE format(
            'CREATE VIEW public.%I AS SELECT * FROM public.%I WHERE public.is_admin()',
            view_name,
            backing_name
        );
    END IF;

    -- Wrapper uses owner privileges to read backing; clients may only query the wrapper.
    EXECUTE format(
        'REVOKE ALL ON public.%I FROM PUBLIC, anon, authenticated',
        backing_name
    );
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', view_name);
    EXECUTE format('GRANT SELECT ON public.%I TO authenticated', view_name);
END;
$$;

SELECT public._wrap_leaderboard_view_for_admin('hint_results');
SELECT public._wrap_leaderboard_view_for_admin('correct_answer_results');
SELECT public._wrap_leaderboard_view_for_admin('calculate_user_points');

DROP FUNCTION public._wrap_leaderboard_view_for_admin(text);
