-- Remove legacy permissive INSERT/UPDATE/DELETE policies on catalog tables.
-- RESTRICTIVE turkucitytour_* admin policies from 00005 remain authoritative.
-- Safe to re-run: only drops policies not prefixed turkucitytour_.

DO $$
DECLARE
    r record;
    catalog_tables text[] := ARRAY[
        'games',
        'locations',
        'hints',
        'questions',
        'answers_data',
        'images',
        'game_players'
    ];
BEGIN
    FOR r IN
        SELECT p.schemaname, p.tablename, p.policyname
        FROM pg_policies p
        WHERE p.schemaname = 'public'
          AND p.tablename = ANY (catalog_tables)
          AND p.policyname NOT LIKE 'turkucitytour_%'
          AND p.cmd IN ('INSERT', 'UPDATE', 'DELETE', 'ALL')
    LOOP
        EXECUTE format(
            'DROP POLICY IF EXISTS %I ON %I.%I',
            r.policyname,
            r.schemaname,
            r.tablename
        );
        RAISE NOTICE 'Dropped legacy write policy % on %.%',
            r.policyname,
            r.schemaname,
            r.tablename;
    END LOOP;
END $$;
