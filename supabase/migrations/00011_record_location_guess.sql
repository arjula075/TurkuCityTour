-- Server-authoritative map-click guess: validates distance and writes hints_used.

CREATE OR REPLACE FUNCTION public.record_location_guess(
    p_location_id uuid,
    p_latitude double precision,
    p_longitude double precision,
    p_hints_used integer,
    p_tolerance_meters double precision DEFAULT 100
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_game_id uuid;
    v_target_lat double precision;
    v_target_lon double precision;
    v_distance double precision;
    v_accepted boolean;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    IF p_hints_used IS NULL OR p_hints_used < 1 OR p_hints_used > 5 THEN
        RAISE EXCEPTION 'hints_used must be between 1 and 5 for a map guess';
    END IF;

    SELECT l.game_id, l.latitude, l.longitude
    INTO v_game_id, v_target_lat, v_target_lon
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

    v_distance := public.haversine_meters(
        p_latitude,
        p_longitude,
        v_target_lat,
        v_target_lon
    );
    v_accepted := v_distance <= p_tolerance_meters;

    IF v_accepted THEN
        INSERT INTO public.user_progress (user_id, location_id, hints_used, completed_at)
        VALUES (v_user_id, p_location_id, p_hints_used, now())
        ON CONFLICT (user_id, location_id)
        DO UPDATE SET
            hints_used = EXCLUDED.hints_used,
            completed_at = EXCLUDED.completed_at;
    END IF;

    RETURN jsonb_build_object(
        'accepted', v_accepted,
        'distance_m', round(v_distance::numeric, 1),
        'hints_used', CASE WHEN v_accepted THEN p_hints_used ELSE NULL END
    );
END;
$$;

REVOKE ALL ON FUNCTION public.record_location_guess(uuid, double precision, double precision, integer, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_location_guess(uuid, double precision, double precision, integer, double precision) FROM anon;
GRANT EXECUTE ON FUNCTION public.record_location_guess(uuid, double precision, double precision, integer, double precision) TO authenticated;
