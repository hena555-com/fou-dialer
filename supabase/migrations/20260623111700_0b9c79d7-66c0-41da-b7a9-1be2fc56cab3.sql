
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sites TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sites TO authenticated;

DROP POLICY IF EXISTS "Admins delete sites" ON public.sites;
DROP POLICY IF EXISTS "Admins insert sites" ON public.sites;
DROP POLICY IF EXISTS "Admins update sites" ON public.sites;
DROP POLICY IF EXISTS "Authenticated read sites" ON public.sites;
DROP POLICY IF EXISTS "Public read sites" ON public.sites;

CREATE POLICY "Public read sites" ON public.sites FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public insert sites" ON public.sites FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public update sites" ON public.sites FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public delete sites" ON public.sites FOR DELETE TO anon, authenticated USING (true);
