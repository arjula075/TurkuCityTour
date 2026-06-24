-- Storage objects: users read/write their own folder ({user_id}/...); admins full access.
-- Paths match UserManager.jsx uploads. Applies to all buckets.

DROP POLICY IF EXISTS turkucitytour_storage_select ON storage.objects;
CREATE POLICY turkucitytour_storage_select
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
        public.is_admin()
        OR (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS turkucitytour_storage_insert ON storage.objects;
CREATE POLICY turkucitytour_storage_insert
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_admin()
        OR (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS turkucitytour_storage_update ON storage.objects;
CREATE POLICY turkucitytour_storage_update
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
        public.is_admin()
        OR (storage.foldername(name))[1] = auth.uid()::text
    )
    WITH CHECK (
        public.is_admin()
        OR (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS turkucitytour_storage_delete ON storage.objects;
CREATE POLICY turkucitytour_storage_delete
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        public.is_admin()
        OR (storage.foldername(name))[1] = auth.uid()::text
    );
