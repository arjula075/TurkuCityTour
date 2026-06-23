-- Server-authoritative answer submission.
-- Apply in Supabase SQL Editor before deploying submit_answer client changes.

CREATE OR REPLACE FUNCTION public.submit_answer(
    p_question_id uuid,
    p_answer_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_location_id uuid;
    v_game_id uuid;
    v_is_correct boolean;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT q.location_id, a.is_correct
    INTO v_location_id, v_is_correct
    FROM public.questions q
    JOIN public.answers a ON a.question_id = q.id
    WHERE q.id = p_question_id
      AND a.id = p_answer_id;

    IF v_location_id IS NULL THEN
        RAISE EXCEPTION 'Invalid question or answer';
    END IF;

    SELECT l.game_id
    INTO v_game_id
    FROM public.locations l
    WHERE l.id = v_location_id;

    IF v_game_id IS NULL OR NOT EXISTS (
        SELECT 1
        FROM public.game_players gp
        WHERE gp.user_id = v_user_id
          AND gp.game_id = v_game_id
    ) THEN
        RAISE EXCEPTION 'Not assigned to this game';
    END IF;

    INSERT INTO public.user_progress (user_id, location_id, answered_correctly)
    VALUES (v_user_id, v_location_id, v_is_correct)
    ON CONFLICT (user_id, location_id)
    DO UPDATE SET answered_correctly = EXCLUDED.answered_correctly;

    RETURN jsonb_build_object('is_correct', v_is_correct);
END;
$$;

REVOKE ALL ON FUNCTION public.submit_answer(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.submit_answer(uuid, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.submit_answer(uuid, uuid) TO authenticated;
