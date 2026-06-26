-- Nuclear rebuild: drop every RLS policy on core tables and recreate with is_platform_admin only.
-- Fixes stale dashboard policies referencing users.is_admin and restrictive-only writes.
-- Safe to re-run. Apply after 00019.

-- ---------------------------------------------------------------------------
-- Admin helpers (ensure current)
-- ---------------------------------------------------------------------------

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

REVOKE ALL ON FUNCTION public.is_platform_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_platform_admin() TO authenticated;

DROP FUNCTION IF EXISTS public.prevent_is_admin_escalation() CASCADE;

-- ---------------------------------------------------------------------------
-- Drop ALL policies on core tables
-- ---------------------------------------------------------------------------

DO $$
DECLARE
    r record;
    tbl text;
    tables text[] := ARRAY[
        'users',
        'games',
        'locations',
        'hints',
        'questions',
        'answers_data',
        'user_progress',
        'game_players',
        'organizations',
        'subscriptions',
        'organization_members',
        'images'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables LOOP
        IF to_regclass(format('public.%I', tbl)) IS NULL THEN
            RAISE NOTICE 'Skipping missing table %', tbl;
            CONTINUE;
        END IF;

        FOR r IN
            SELECT p.policyname
            FROM pg_policies p
            WHERE p.schemaname = 'public'
              AND p.tablename = tbl
        LOOP
            EXECUTE format(
                'DROP POLICY IF EXISTS %I ON public.%I',
                r.policyname,
                tbl
            );
            RAISE NOTICE 'Dropped policy % on public.%', r.policyname, tbl;
        END LOOP;

        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
    END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------

CREATE POLICY turkucitytour_users_select
    ON public.users
    FOR SELECT
    TO authenticated
    USING (id = auth.uid() OR public.is_platform_admin());

CREATE POLICY turkucitytour_users_update
    ON public.users
    FOR UPDATE
    TO authenticated
    USING (id = auth.uid() OR public.is_platform_admin())
    WITH CHECK (id = auth.uid() OR public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- user_progress
-- ---------------------------------------------------------------------------

CREATE POLICY turkucitytour_user_progress_own
    ON public.user_progress
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- games
-- ---------------------------------------------------------------------------

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

CREATE POLICY turkucitytour_games_select_org
    ON public.games
    FOR SELECT
    TO authenticated
    USING (
        public.is_platform_admin()
        OR public.is_org_owner(owner_org_id)
    );

CREATE POLICY turkucitytour_games_insert
    ON public.games
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_platform_admin()
        OR (
            public.is_org_owner(owner_org_id)
            AND public.can_org_create_game(owner_org_id)
        )
    );

CREATE POLICY turkucitytour_games_update
    ON public.games
    FOR UPDATE
    TO authenticated
    USING (public.is_platform_admin() OR public.is_org_owner(owner_org_id))
    WITH CHECK (public.is_platform_admin() OR public.is_org_owner(owner_org_id));

CREATE POLICY turkucitytour_games_delete
    ON public.games
    FOR DELETE
    TO authenticated
    USING (public.is_platform_admin() OR public.is_org_owner(owner_org_id));

-- ---------------------------------------------------------------------------
-- locations
-- ---------------------------------------------------------------------------

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

CREATE POLICY turkucitytour_locations_write
    ON public.locations
    FOR ALL
    TO authenticated
    USING (public.can_manage_location(id))
    WITH CHECK (public.can_manage_game_catalog(game_id));

-- ---------------------------------------------------------------------------
-- questions
-- ---------------------------------------------------------------------------

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

CREATE POLICY turkucitytour_questions_write
    ON public.questions
    FOR ALL
    TO authenticated
    USING (public.can_manage_question(id))
    WITH CHECK (public.can_manage_location(location_id));

-- ---------------------------------------------------------------------------
-- hints
-- ---------------------------------------------------------------------------

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

CREATE POLICY turkucitytour_hints_write
    ON public.hints
    FOR ALL
    TO authenticated
    USING (public.can_manage_location(location_id))
    WITH CHECK (public.can_manage_location(location_id));

-- ---------------------------------------------------------------------------
-- answers_data
-- ---------------------------------------------------------------------------

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

CREATE POLICY turkucitytour_answers_data_write
    ON public.answers_data
    FOR ALL
    TO authenticated
    USING (public.can_manage_question(question_id))
    WITH CHECK (public.can_manage_question(question_id));

-- ---------------------------------------------------------------------------
-- images (platform admin only)
-- ---------------------------------------------------------------------------

CREATE POLICY turkucitytour_images_admin
    ON public.images
    FOR ALL
    TO authenticated
    USING (public.is_platform_admin())
    WITH CHECK (public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- game_players
-- ---------------------------------------------------------------------------

CREATE POLICY turkucitytour_game_players_select
    ON public.game_players
    FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid()
        OR public.is_platform_admin()
        OR public.is_org_owner(public.game_org_id(game_id))
    );

CREATE POLICY turkucitytour_game_players_insert
    ON public.game_players
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_platform_admin()
        OR (
            public.is_org_owner(public.game_org_id(game_id))
            AND public.can_org_add_player_to_game(game_id)
        )
    );

CREATE POLICY turkucitytour_game_players_delete
    ON public.game_players
    FOR DELETE
    TO authenticated
    USING (
        public.is_platform_admin()
        OR public.is_org_owner(public.game_org_id(game_id))
    );

-- ---------------------------------------------------------------------------
-- tenancy tables
-- ---------------------------------------------------------------------------

CREATE POLICY turkucitytour_organizations_select
    ON public.organizations
    FOR SELECT
    TO authenticated
    USING (
        public.is_platform_admin()
        OR id IN (SELECT public.user_org_ids())
    );

CREATE POLICY turkucitytour_organizations_insert
    ON public.organizations
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_platform_admin());

CREATE POLICY turkucitytour_organizations_update
    ON public.organizations
    FOR UPDATE
    TO authenticated
    USING (public.is_platform_admin() OR public.is_org_owner(id))
    WITH CHECK (public.is_platform_admin() OR public.is_org_owner(id));

CREATE POLICY turkucitytour_subscriptions_select
    ON public.subscriptions
    FOR SELECT
    TO authenticated
    USING (public.is_platform_admin() OR public.is_org_owner(org_id));

CREATE POLICY turkucitytour_subscriptions_write
    ON public.subscriptions
    FOR ALL
    TO authenticated
    USING (public.is_platform_admin())
    WITH CHECK (public.is_platform_admin());

CREATE POLICY turkucitytour_organization_members_select
    ON public.organization_members
    FOR SELECT
    TO authenticated
    USING (
        public.is_platform_admin()
        OR user_id = auth.uid()
        OR public.is_org_owner(org_id)
    );

CREATE POLICY turkucitytour_organization_members_write
    ON public.organization_members
    FOR ALL
    TO authenticated
    USING (public.is_platform_admin())
    WITH CHECK (public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- games default owner_org_id
-- ---------------------------------------------------------------------------

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

NOTIFY pgrst, 'reload schema';
