-- Drop legacy RLS policies that still reference the removed users.is_admin column.
-- Adds player read policies and default games.owner_org_id for service-role fixtures.
-- Safe to re-run. Apply after 00018.

-- Default owner_org_id on every insert (service role + authenticated)
CREATE OR REPLACE FUNCTION public.games_set_default_owner_org()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.owner_org_id IS NULL THEN
        NEW.owner_org_id := '00000000-0000-0000-0000-000000000001'::uuid;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS games_set_default_owner_org ON public.games;
CREATE TRIGGER games_set_default_owner_org
    BEFORE INSERT ON public.games
    FOR EACH ROW
    EXECUTE FUNCTION public.games_set_default_owner_org();

-- Drop legacy policies whose expressions reference the is_admin column (not is_admin() function)
DO $$
DECLARE
    r record;
BEGIN
    FOR r IN
        SELECT p.schemaname, p.tablename, p.policyname
        FROM pg_policies p
        WHERE p.schemaname = 'public'
          AND p.policyname NOT LIKE 'turkucitytour_%'
          AND (
              coalesce(p.qual, '') ~ '(^|[^a-z_])is_admin($|[^a-z_(])'
              OR coalesce(p.with_check, '') ~ '(^|[^a-z_])is_admin($|[^a-z_(])'
          )
    LOOP
        EXECUTE format(
            'DROP POLICY IF EXISTS %I ON %I.%I',
            r.policyname,
            r.schemaname,
            r.tablename
        );
        RAISE NOTICE 'Dropped legacy is_admin policy % on %.%',
            r.policyname,
            r.schemaname,
            r.tablename;
    END LOOP;
END $$;

-- users: explicit platform-admin policies (avoid any stale expressions)
DROP POLICY IF EXISTS turkucitytour_users_read_own ON public.users;
CREATE POLICY turkucitytour_users_read_own
    ON public.users
    FOR SELECT
    TO authenticated
    USING (id = auth.uid() OR public.is_platform_admin());

DROP POLICY IF EXISTS turkucitytour_users_update_own ON public.users;
CREATE POLICY turkucitytour_users_update_own
    ON public.users
    FOR UPDATE
    TO authenticated
    USING (id = auth.uid() OR public.is_platform_admin())
    WITH CHECK (id = auth.uid() OR public.is_platform_admin());

-- Player read access (replaces dropped legacy permissive policies)
DROP POLICY IF EXISTS turkucitytour_games_select_player ON public.games;
CREATE POLICY turkucitytour_games_select_player
    ON public.games
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.game_players gp
            WHERE gp.game_id = games.id
              AND gp.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS turkucitytour_locations_select_player ON public.locations;
CREATE POLICY turkucitytour_locations_select_player
    ON public.locations
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.game_players gp
            WHERE gp.game_id = locations.game_id
              AND gp.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS turkucitytour_questions_select_player ON public.questions;
CREATE POLICY turkucitytour_questions_select_player
    ON public.questions
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.locations l
            JOIN public.game_players gp ON gp.game_id = l.game_id
            WHERE l.id = questions.location_id
              AND gp.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS turkucitytour_hints_select_player ON public.hints;
CREATE POLICY turkucitytour_hints_select_player
    ON public.hints
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.locations l
            JOIN public.game_players gp ON gp.game_id = l.game_id
            WHERE l.id = hints.location_id
              AND gp.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS turkucitytour_answers_data_select_player ON public.answers_data;
CREATE POLICY turkucitytour_answers_data_select_player
    ON public.answers_data
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.questions q
            JOIN public.locations l ON l.id = q.location_id
            JOIN public.game_players gp ON gp.game_id = l.game_id
            WHERE q.id = answers_data.question_id
              AND gp.user_id = auth.uid()
        )
    );

-- Ensure is_admin() alias is current
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(
        (SELECT u.is_platform_admin FROM public.users u WHERE u.id = auth.uid()),
        false
    );
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.is_platform_admin();
$$;

DROP FUNCTION IF EXISTS public.prevent_is_admin_escalation() CASCADE;
