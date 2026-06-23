-- Server-side geofence check for the walk-to-location phase (default ±50 m).

CREATE OR REPLACE FUNCTION public.haversine_meters(
    lat1 double precision,
    lon1 double precision,
    lat2 double precision,
    lon2 double precision
)
RETURNS double precision
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT 6371000.0 * 2 * asin(
        sqrt(
            power(sin(radians(lat2 - lat1) / 2), 2)
            + cos(radians(lat1)) * cos(radians(lat2))
            * power(sin(radians(lon2 - lon1) / 2), 2)
        )
    );
$$;

CREATE OR REPLACE FUNCTION public.validate_location_arrival(
    p_location_id uuid,
    p_latitude double precision,
    p_longitude double precision,
    p_tolerance_meters double precision DEFAULT 50
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
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
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

    RETURN jsonb_build_object(
        'arrived', v_distance <= p_tolerance_meters,
        'distance_m', round(v_distance::numeric, 1)
    );
END;
$$;

REVOKE ALL ON FUNCTION public.validate_location_arrival(uuid, double precision, double precision, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.validate_location_arrival(uuid, double precision, double precision, double precision) FROM anon;
GRANT EXECUTE ON FUNCTION public.validate_location_arrival(uuid, double precision, double precision, double precision) TO authenticated;
