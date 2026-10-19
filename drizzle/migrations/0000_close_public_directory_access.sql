DROP POLICY IF EXISTS "Public delete sites" ON public.sites;
DROP POLICY IF EXISTS "Public insert sites" ON public.sites;
DROP POLICY IF EXISTS "Public read sites" ON public.sites;
DROP POLICY IF EXISTS "Public update sites" ON public.sites;
REVOKE ALL ON public.sites FROM anon, authenticated;
GRANT ALL ON public.sites TO service_role;
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;