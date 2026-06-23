-- client_logs: length cap, per-user rate limit, authenticated insert only.

ALTER TABLE public.client_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS turkucitytour_client_logs_insert ON public.client_logs;
CREATE POLICY turkucitytour_client_logs_insert
    ON public.client_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (
        user_id = auth.uid()
        AND char_length(coalesce(message, '')) <= 500
    );

DROP POLICY IF EXISTS turkucitytour_client_logs_select_admin ON public.client_logs;
CREATE POLICY turkucitytour_client_logs_select_admin
    ON public.client_logs
    FOR SELECT
    TO authenticated
    USING (public.is_admin());

CREATE OR REPLACE FUNCTION public.enforce_client_logs_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    recent_count integer;
BEGIN
    IF NEW.user_id IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT count(*)::integer
    INTO recent_count
    FROM public.client_logs cl
    WHERE cl.user_id = NEW.user_id
      AND cl.created_at > (now() - interval '1 minute');

    IF recent_count >= 30 THEN
        RAISE EXCEPTION 'client_logs rate limit exceeded';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_client_logs_rate_limit ON public.client_logs;
CREATE TRIGGER enforce_client_logs_rate_limit
    BEFORE INSERT ON public.client_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_client_logs_rate_limit();
