-- Server-authoritative give-up: records hints_used = 0 for the current location.

CREATE OR REPLACE FUNCTION public.record_give_up(p_location_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_game_id uuid;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT l.game_id
    INTO v_game_id
    FROM public.locations l
    WHERE l.id = p_location_id;

    IF v_game_id IS NULL THEN
        RAISE EXCEPTION 'Unknown location';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.game_players gp
        WHERE gp.user_id = v_user_id
          AND gp.game_id = v_game_id
    ) THEN
        RAISE EXCEPTION 'Not assigned to this game';
    END IF;

    INSERT INTO public.user_progress (user_id, location_id, hints_used, completed_at)
    VALUES (v_user_id, p_location_id, 0, now())
    ON CONFLICT (user_id, location_id)
    DO UPDATE SET
        hints_used = EXCLUDED.hints_used,
        completed_at = EXCLUDED.completed_at;

    RETURN jsonb_build_object('hints_used', 0);
END;
$$;

REVOKE ALL ON FUNCTION public.record_give_up(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_give_up(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.record_give_up(uuid) TO authenticated;
