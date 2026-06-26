-- Repair is_admin() after is_platform_admin column rename.
-- Safe to re-run. Apply if you see: column "is_admin" does not exist

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
