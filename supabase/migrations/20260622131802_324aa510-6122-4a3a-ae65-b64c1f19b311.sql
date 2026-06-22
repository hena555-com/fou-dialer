GRANT SELECT ON public.sites TO anon;
CREATE POLICY "Public read sites" ON public.sites FOR SELECT TO anon USING (true);