-- Multi-tenant schema: organizations, subscriptions, members, games.owner_org_id.
-- Renames users.is_admin → is_platform_admin (platform operator role).
-- Apply after 00015. Run manually in Supabase SQL Editor.

-- organizations
CREATE TABLE IF NOT EXISTS public.organizations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    stripe_customer_id text,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- subscriptions (one row per org; Stripe sync in Phase 2)
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
    stripe_subscription_id text UNIQUE,
    status text NOT NULL DEFAULT 'trialing'
        CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'incomplete')),
    tier text NOT NULL DEFAULT 'trial',
    trial_ends_at timestamptz,
    max_games integer NOT NULL DEFAULT 3 CHECK (max_games > 0),
    max_players integer NOT NULL DEFAULT 1 CHECK (max_players > 0),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (org_id)
);

CREATE INDEX IF NOT EXISTS subscriptions_org_id_idx ON public.subscriptions (org_id);
CREATE INDEX IF NOT EXISTS subscriptions_status_idx ON public.subscriptions (status);

-- organization_members
CREATE TABLE IF NOT EXISTS public.organization_members (
    org_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
    role text NOT NULL CHECK (role IN ('owner', 'member')),
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (org_id, user_id)
);

CREATE INDEX IF NOT EXISTS organization_members_user_id_idx
    ON public.organization_members (user_id);

-- Fixed UUID for legacy / platform-owned games (backfill target).
INSERT INTO public.organizations (id, name, created_at)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'TurkuCityTour Platform',
    now()
)
ON CONFLICT (id) DO NOTHING;

-- Platform org subscription for legacy games and service-role fixtures
INSERT INTO public.subscriptions (org_id, status, tier, max_games, max_players)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'active',
    'platform',
    9999,
    9999
)
ON CONFLICT (org_id) DO NOTHING;

-- games.owner_org_id
ALTER TABLE public.games
    ADD COLUMN IF NOT EXISTS owner_org_id uuid REFERENCES public.organizations (id);

UPDATE public.games
SET owner_org_id = '00000000-0000-0000-0000-000000000001'::uuid
WHERE owner_org_id IS NULL;

ALTER TABLE public.games
    ALTER COLUMN owner_org_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS games_owner_org_id_idx ON public.games (owner_org_id);

-- Rename platform admin flag
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'users'
          AND column_name = 'is_admin'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'users'
          AND column_name = 'is_platform_admin'
    ) THEN
        ALTER TABLE public.users RENAME COLUMN is_admin TO is_platform_admin;
    END IF;
END $$;

-- Platform admin helpers (is_admin kept as alias for existing policies/views)
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

-- Escalation guard (replaces prevent_is_admin_escalation)
CREATE OR REPLACE FUNCTION public.prevent_platform_admin_escalation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.is_platform_admin IS DISTINCT FROM OLD.is_platform_admin
       AND NOT public.is_platform_admin() THEN
        RAISE EXCEPTION 'Only platform admins may change is_platform_admin';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_is_admin_escalation ON public.users;
DROP TRIGGER IF EXISTS prevent_platform_admin_escalation ON public.users;
CREATE TRIGGER prevent_platform_admin_escalation
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_platform_admin_escalation();

-- Registration RPC
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

    INSERT INTO public.users (id, first_name, last_name, is_platform_admin)
    VALUES (v_user_id, first_name, last_name, false)
    ON CONFLICT (id) DO UPDATE
        SET first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name;
END;
$$;

REVOKE ALL ON FUNCTION public.create_user_profile(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_user_profile(text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_user_profile(text, text) TO authenticated;

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
