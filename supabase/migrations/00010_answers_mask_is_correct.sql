-- Mask is_correct for non-admin reads via a view; admins retain full access.
-- Safe to re-run: skips rename if answers_data already exists.

DO $$
BEGIN
    IF to_regclass('public.answers_data') IS NULL
       AND to_regclass('public.answers') IS NOT NULL
       AND EXISTS (
           SELECT 1
           FROM pg_class c
           JOIN pg_namespace n ON n.oid = c.relnamespace
           WHERE n.nspname = 'public'
             AND c.relname = 'answers'
             AND c.relkind = 'r'
       ) THEN
        ALTER TABLE public.answers RENAME TO answers_data;
    END IF;
END $$;

CREATE OR REPLACE VIEW public.answers AS
SELECT
    d.id,
    d.question_id,
    d.answer_text,
    CASE WHEN public.is_admin() THEN d.is_correct ELSE NULL::boolean END AS is_correct
FROM public.answers_data d;

CREATE OR REPLACE FUNCTION public.answers_view_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Only admins may insert answers';
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
    IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Only admins may update answers';
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
    IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Only admins may delete answers';
    END IF;

    DELETE FROM public.answers_data WHERE id = OLD.id;
    RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS answers_view_insert ON public.answers;
CREATE TRIGGER answers_view_insert
    INSTEAD OF INSERT ON public.answers
    FOR EACH ROW
    EXECUTE FUNCTION public.answers_view_insert();

DROP TRIGGER IF EXISTS answers_view_update ON public.answers;
CREATE TRIGGER answers_view_update
    INSTEAD OF UPDATE ON public.answers
    FOR EACH ROW
    EXECUTE FUNCTION public.answers_view_update();

DROP TRIGGER IF EXISTS answers_view_delete ON public.answers;
CREATE TRIGGER answers_view_delete
    INSTEAD OF DELETE ON public.answers
    FOR EACH ROW
    EXECUTE FUNCTION public.answers_view_delete();

GRANT SELECT ON public.answers TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.answers TO authenticated;
