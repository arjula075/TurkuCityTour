-- Service-role clients (integration fixtures, admin dashboard) have no auth.uid().
-- Skip user_id / answered_correctly trigger checks when auth.uid() is null.

CREATE OR REPLACE FUNCTION public.enforce_user_progress_integrity()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN NEW;
    END IF;

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
