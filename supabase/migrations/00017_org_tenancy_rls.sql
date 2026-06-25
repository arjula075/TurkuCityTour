-- Org tenancy helpers, subscription limits, and scoped catalog RLS.
-- Apply after 00016_multi_tenant_schema.sql.

-- ---------------------------------------------------------------------------
-- Membership & catalog helpers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_org_owner(p_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.organization_members om
        WHERE om.org_id = p_org_id
          AND om.user_id = auth.uid()
          AND om.role = 'owner'
    );
$$;

CREATE OR REPLACE FUNCTION public.user_org_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT om.org_id
    FROM public.organization_members om
    WHERE om.user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.org_game_count(p_org_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT count(*)::integer
    FROM public.games g
    WHERE g.owner_org_id = p_org_id;
$$;

CREATE OR REPLACE FUNCTION public.can_org_create_game(p_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        public.is_platform_admin()
        OR EXISTS (
            SELECT 1
            FROM public.subscriptions s
            WHERE s.org_id = p_org_id
              AND s.status IN ('trialing', 'active')
              AND public.org_game_count(p_org_id) < s.max_games
        );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_game_catalog(p_game_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        public.is_platform_admin()
        OR EXISTS (
            SELECT 1
            FROM public.games g
            WHERE g.id = p_game_id
              AND public.is_org_owner(g.owner_org_id)
        );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_location(p_location_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.can_manage_game_catalog(
        (
            SELECT l.game_id
            FROM public.locations l
            WHERE l.id = p_location_id
        )
    );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_question(p_question_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.can_manage_game_catalog(
        (
            SELECT l.game_id
            FROM public.questions q
            JOIN public.locations l ON l.id = q.location_id
            WHERE q.id = p_question_id
        )
    );
$$;

CREATE OR REPLACE FUNCTION public.game_org_id(p_game_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT g.owner_org_id
    FROM public.games g
    WHERE g.id = p_game_id;
$$;

CREATE OR REPLACE FUNCTION public.can_org_add_player_to_game(p_game_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        public.is_platform_admin()
        OR EXISTS (
            SELECT 1
            FROM public.games g
            JOIN public.subscriptions s ON s.org_id = g.owner_org_id
            WHERE g.id = p_game_id
              AND s.status IN ('trialing', 'active')
              AND (
                  SELECT count(*)::integer
                  FROM public.game_players gp
                  WHERE gp.game_id = p_game_id
              ) < s.max_players
        );
$$;

REVOKE ALL ON FUNCTION public.is_org_owner(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.user_org_ids() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.org_game_count(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.can_org_create_game(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.can_manage_game_catalog(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.can_manage_location(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.can_manage_question(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.game_org_id(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.can_org_add_player_to_game(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.is_org_owner(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_org_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.org_game_count(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_org_create_game(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_game_catalog(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_location(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_question(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.game_org_id(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_org_add_player_to_game(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- Subscription limit triggers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.enforce_game_creation_limit()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    v_org_id uuid := NEW.owner_org_id;
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN NEW;
    END IF;

    IF NEW.owner_org_id IS NULL THEN
        NEW.owner_org_id := '00000000-0000-0000-0000-000000000001'::uuid;
        v_org_id := NEW.owner_org_id;
    END IF;

    IF public.is_platform_admin() THEN
        RETURN NEW;
    END IF;

    IF NOT public.is_org_owner(v_org_id) THEN
        RAISE EXCEPTION 'Not authorized to create games for this organization';
    END IF;

    IF NOT public.can_org_create_game(v_org_id) THEN
        RAISE EXCEPTION 'Game limit reached for subscription tier';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_game_creation_limit ON public.games;
CREATE TRIGGER enforce_game_creation_limit
    BEFORE INSERT ON public.games
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_game_creation_limit();

CREATE OR REPLACE FUNCTION public.enforce_game_player_limit()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN NEW;
    END IF;

    IF public.is_platform_admin() THEN
        RETURN NEW;
    END IF;

    IF NOT public.can_org_add_player_to_game(NEW.game_id) THEN
        RAISE EXCEPTION 'Player limit reached for subscription tier';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_game_player_limit ON public.game_players;
CREATE TRIGGER enforce_game_player_limit
    BEFORE INSERT ON public.game_players
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_game_player_limit();

-- game_players: org owners and platform admin may assign; players read own rows
ALTER TABLE public.game_players ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS turkucitytour_game_players_select ON public.game_players;
CREATE POLICY turkucitytour_game_players_select
    ON public.game_players
    FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid()
        OR public.is_platform_admin()
        OR public.is_org_owner(public.game_org_id(game_id))
    );

DROP POLICY IF EXISTS turkucitytour_game_players_insert ON public.game_players;
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

DROP POLICY IF EXISTS turkucitytour_game_players_delete ON public.game_players;
CREATE POLICY turkucitytour_game_players_delete
    ON public.game_players
    FOR DELETE
    TO authenticated
    USING (
        public.is_platform_admin()
        OR public.is_org_owner(public.game_org_id(game_id))
    );

-- ---------------------------------------------------------------------------
-- Tenancy table RLS
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS turkucitytour_organizations_select ON public.organizations;
CREATE POLICY turkucitytour_organizations_select
    ON public.organizations
    FOR SELECT
    TO authenticated
    USING (
        public.is_platform_admin()
        OR id IN (SELECT public.user_org_ids())
    );

DROP POLICY IF EXISTS turkucitytour_organizations_insert ON public.organizations;
CREATE POLICY turkucitytour_organizations_insert
    ON public.organizations
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_platform_admin());

DROP POLICY IF EXISTS turkucitytour_organizations_update ON public.organizations;
CREATE POLICY turkucitytour_organizations_update
    ON public.organizations
    FOR UPDATE
    TO authenticated
    USING (public.is_platform_admin() OR public.is_org_owner(id))
    WITH CHECK (public.is_platform_admin() OR public.is_org_owner(id));

DROP POLICY IF EXISTS turkucitytour_subscriptions_select ON public.subscriptions;
CREATE POLICY turkucitytour_subscriptions_select
    ON public.subscriptions
    FOR SELECT
    TO authenticated
    USING (
        public.is_platform_admin()
        OR public.is_org_owner(org_id)
    );

DROP POLICY IF EXISTS turkucitytour_subscriptions_write ON public.subscriptions;
CREATE POLICY turkucitytour_subscriptions_write
    ON public.subscriptions
    FOR ALL
    TO authenticated
    USING (public.is_platform_admin())
    WITH CHECK (public.is_platform_admin());

DROP POLICY IF EXISTS turkucitytour_organization_members_select ON public.organization_members;
CREATE POLICY turkucitytour_organization_members_select
    ON public.organization_members
    FOR SELECT
    TO authenticated
    USING (
        public.is_platform_admin()
        OR user_id = auth.uid()
        OR public.is_org_owner(org_id)
    );

DROP POLICY IF EXISTS turkucitytour_organization_members_write ON public.organization_members;
CREATE POLICY turkucitytour_organization_members_write
    ON public.organization_members
    FOR ALL
    TO authenticated
    USING (public.is_platform_admin())
    WITH CHECK (public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- Catalog RLS: platform admin OR org owner of the game's organization
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS turkucitytour_games_select_org ON public.games;
CREATE POLICY turkucitytour_games_select_org
    ON public.games
    FOR SELECT
    TO authenticated
    USING (
        public.is_platform_admin()
        OR public.is_org_owner(owner_org_id)
    );

DO $$
DECLARE
    tbl text;
BEGIN
    FOREACH tbl IN ARRAY ARRAY['games', 'locations', 'questions', 'answers_data', 'hints', 'images'] LOOP
        IF to_regclass(format('public.%I', tbl)) IS NULL THEN
            RAISE NOTICE 'Skipping catalog RLS for missing table %', tbl;
            CONTINUE;
        END IF;

        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);

        EXECUTE format(
            'DROP POLICY IF EXISTS turkucitytour_%s_insert_admin ON public.%I',
            tbl, tbl
        );
        EXECUTE format(
            'DROP POLICY IF EXISTS turkucitytour_%s_update_admin ON public.%I',
            tbl, tbl
        );
        EXECUTE format(
            'DROP POLICY IF EXISTS turkucitytour_%s_delete_admin ON public.%I',
            tbl, tbl
        );

        IF tbl = 'games' THEN
            EXECUTE format(
                'CREATE POLICY turkucitytour_%s_insert_admin ON public.%I AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (
                    public.is_platform_admin()
                    OR (public.is_org_owner(owner_org_id) AND public.can_org_create_game(owner_org_id))
                )',
                tbl, tbl
            );
            EXECUTE format(
                'CREATE POLICY turkucitytour_%s_update_admin ON public.%I AS RESTRICTIVE FOR UPDATE TO authenticated
                    USING (public.is_platform_admin() OR public.is_org_owner(owner_org_id))
                    WITH CHECK (public.is_platform_admin() OR public.is_org_owner(owner_org_id))',
                tbl, tbl
            );
            EXECUTE format(
                'CREATE POLICY turkucitytour_%s_delete_admin ON public.%I AS RESTRICTIVE FOR DELETE TO authenticated
                    USING (public.is_platform_admin() OR public.is_org_owner(owner_org_id))',
                tbl, tbl
            );
        ELSIF tbl = 'locations' THEN
            EXECUTE format(
                'CREATE POLICY turkucitytour_%s_insert_admin ON public.%I AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (
                    public.can_manage_game_catalog(game_id)
                )',
                tbl, tbl
            );
            EXECUTE format(
                'CREATE POLICY turkucitytour_%s_update_admin ON public.%I AS RESTRICTIVE FOR UPDATE TO authenticated
                    USING (public.can_manage_location(id))
                    WITH CHECK (public.can_manage_location(id))',
                tbl, tbl
            );
            EXECUTE format(
                'CREATE POLICY turkucitytour_%s_delete_admin ON public.%I AS RESTRICTIVE FOR DELETE TO authenticated
                    USING (public.can_manage_location(id))',
                tbl, tbl
            );
        ELSIF tbl = 'questions' THEN
            EXECUTE format(
                'CREATE POLICY turkucitytour_%s_insert_admin ON public.%I AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (
                    public.can_manage_location(location_id)
                )',
                tbl, tbl
            );
            EXECUTE format(
                'CREATE POLICY turkucitytour_%s_update_admin ON public.%I AS RESTRICTIVE FOR UPDATE TO authenticated
                    USING (public.can_manage_question(id))
                    WITH CHECK (public.can_manage_question(id))',
                tbl, tbl
            );
            EXECUTE format(
                'CREATE POLICY turkucitytour_%s_delete_admin ON public.%I AS RESTRICTIVE FOR DELETE TO authenticated
                    USING (public.can_manage_question(id))',
                tbl, tbl
            );
        ELSIF tbl = 'answers_data' THEN
            EXECUTE format(
                'CREATE POLICY turkucitytour_%s_insert_admin ON public.%I AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (
                    public.can_manage_question(question_id)
                )',
                tbl, tbl
            );
            EXECUTE format(
                'CREATE POLICY turkucitytour_%s_update_admin ON public.%I AS RESTRICTIVE FOR UPDATE TO authenticated
                    USING (public.can_manage_question(question_id))
                    WITH CHECK (public.can_manage_question(question_id))',
                tbl, tbl
            );
            EXECUTE format(
                'CREATE POLICY turkucitytour_%s_delete_admin ON public.%I AS RESTRICTIVE FOR DELETE TO authenticated
                    USING (public.can_manage_question(question_id))',
                tbl, tbl
            );
        ELSIF tbl = 'hints' THEN
            EXECUTE format(
                'CREATE POLICY turkucitytour_%s_insert_admin ON public.%I AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (
                    public.can_manage_location(location_id)
                )',
                tbl, tbl
            );
            EXECUTE format(
                'CREATE POLICY turkucitytour_%s_update_admin ON public.%I AS RESTRICTIVE FOR UPDATE TO authenticated
                    USING (public.can_manage_location(location_id))
                    WITH CHECK (public.can_manage_location(location_id))',
                tbl, tbl
            );
            EXECUTE format(
                'CREATE POLICY turkucitytour_%s_delete_admin ON public.%I AS RESTRICTIVE FOR DELETE TO authenticated
                    USING (public.can_manage_location(location_id))',
                tbl, tbl
            );
        ELSIF tbl = 'images' THEN
            EXECUTE format(
                'CREATE POLICY turkucitytour_%s_insert_admin ON public.%I AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (
                    public.is_platform_admin()
                )',
                tbl, tbl
            );
            EXECUTE format(
                'CREATE POLICY turkucitytour_%s_update_admin ON public.%I AS RESTRICTIVE FOR UPDATE TO authenticated
                    USING (public.is_platform_admin())
                    WITH CHECK (public.is_platform_admin())',
                tbl, tbl
            );
            EXECUTE format(
                'CREATE POLICY turkucitytour_%s_delete_admin ON public.%I AS RESTRICTIVE FOR DELETE TO authenticated
                    USING (public.is_platform_admin())',
                tbl, tbl
            );
        END IF;
    END LOOP;
END $$;

-- answers view triggers: allow org owners to manage their catalog
CREATE OR REPLACE FUNCTION public.answers_view_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF auth.uid() IS NOT NULL AND NOT public.can_manage_question(NEW.question_id) THEN
        RAISE EXCEPTION 'Not authorized to insert answers';
    END IF;

    INSERT INTO public.answers_data (question_id, answer_text, is_correct)
    VALUES (NEW.question_id, NEW.answer_text, NEW.is_correct)
    RETURNING id, question_id, answer_text, is_correct
    INTO NEW.id, NEW.question_id, NEW.answer_text, NEW.is_correct;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.answers_view_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF auth.uid() IS NOT NULL AND NOT public.can_manage_question(OLD.question_id) THEN
        RAISE EXCEPTION 'Not authorized to update answers';
    END IF;

    UPDATE public.answers_data
    SET
        question_id = NEW.question_id,
        answer_text = NEW.answer_text,
        is_correct = NEW.is_correct
    WHERE id = OLD.id;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.answers_view_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF auth.uid() IS NOT NULL AND NOT public.can_manage_question(OLD.question_id) THEN
        RAISE EXCEPTION 'Not authorized to delete answers';
    END IF;

    DELETE FROM public.answers_data WHERE id = OLD.id;
    RETURN OLD;
END;
$$;

-- Mask is_correct for org owners too (only platform admin sees correct flags in view)
CREATE OR REPLACE VIEW public.answers AS
SELECT
    d.id,
    d.question_id,
    d.answer_text,
    CASE
        WHEN public.is_platform_admin() OR public.can_manage_question(d.question_id)
            THEN d.is_correct
        ELSE NULL::boolean
    END AS is_correct
FROM public.answers_data d;
