-- List RLS policies that are NOT part of the turkucitytour_* migration set.
-- Run in Supabase SQL Editor after applying 00014.
-- Review each row before dropping anything manually.

SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname IN ('public', 'storage')
  AND policyname NOT LIKE 'turkucitytour_%'
ORDER BY schemaname, tablename, policyname;
