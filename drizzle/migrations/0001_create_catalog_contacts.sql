CREATE TABLE public.catalog_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog text NOT NULL,
  zone_region text NOT NULL DEFAULT '',
  title text NOT NULL DEFAULT '',
  name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  device_name text NOT NULL DEFAULT '',
  site_region text NOT NULL DEFAULT '',
  ip_address text NOT NULL DEFAULT '',
  fou_g text NOT NULL DEFAULT '',
  manager text NOT NULL DEFAULT '',
  manager_phone text NOT NULL DEFAULT '',
  sup_name text NOT NULL DEFAULT '',
  sup_phone text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX catalog_contacts_catalog_idx ON public.catalog_contacts (catalog);

GRANT ALL ON public.catalog_contacts TO service_role;

ALTER TABLE public.catalog_contacts ENABLE ROW LEVEL SECURITY;