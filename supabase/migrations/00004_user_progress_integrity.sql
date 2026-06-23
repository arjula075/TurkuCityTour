-- Tighten user_progress: clients may upsert hints only; answered_correctly via submit_answer.
-- Replaces submit_answer to set a session flag consumed by the trigger below.

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

    PERFORM set_config('app.allow_progress_answer_update', 'true', true);

    INSERT INTO public.user_progress (user_id, location_id, answered_correctly)
    VALUES (v_user_id, v_location_id, v_is_correct)
    ON CONFLICT (user_id, location_id)
    DO UPDATE SET answered_correctly = EXCLUDED.answered_correctly;

    RETURN jsonb_build_object('is_correct', v_is_correct);
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_user_progress_integrity()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.user_id IS DISTINCT FROM auth.uid() THEN
        RAISE EXCEPTION 'user_progress.user_id must match auth.uid()';
    END IF;

    IF NEW.hints_used IS NOT NULL AND (NEW.hints_used < 0 OR NEW.hints_used > 10) THEN
        RAISE EXCEPTION 'hints_used must be between 0 and 10';
    END IF;

    IF TG_OP = 'INSERT' THEN
        IF NEW.answered_correctly IS NOT NULL
           AND current_setting('app.allow_progress_answer_update', true) IS DISTINCT FROM 'true' THEN
            RAISE EXCEPTION 'answered_correctly can only be set via submit_answer';
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.answered_correctly IS DISTINCT FROM OLD.answered_correctly
           AND current_setting('app.allow_progress_answer_update', true) IS DISTINCT FROM 'true' THEN
            RAISE EXCEPTION 'answered_correctly can only be set via submit_answer';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_user_progress_integrity ON public.user_progress;
CREATE TRIGGER enforce_user_progress_integrity
    BEFORE INSERT OR UPDATE ON public.user_progress
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_user_progress_integrity();

ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS turkucitytour_user_progress_own ON public.user_progress;
CREATE POLICY turkucitytour_user_progress_own
    ON public.user_progress
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
