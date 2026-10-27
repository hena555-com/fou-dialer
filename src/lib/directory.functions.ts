import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const siteSchema = z.object({
  ne_id: z.string(), site_region: z.string(), power_type: z.string(),
  lat: z.string(), lng: z.string(), fou_g: z.string(),
  manager1: z.string(), manager1_phone: z.string(),
  manager2: z.string(), manager2_phone: z.string(),
  sup_name: z.string(), sup_phone: z.string(),
});

export const readDirectoryPage = createServerFn({ method: "GET" })
  .validator(z.object({ from: z.number().int().min(0) }))
  .handler(async ({ data }) => {
    const { authorizeDirectory } = await import("./directory.server");
    await authorizeDirectory();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin.from("sites")
      .select("ne_id,site_region,power_type,lat,lng,fou_g,manager1,manager1_phone,manager2,manager2_phone,sup_name,sup_phone")
      .order("site_region").order("id").range(data.from, data.from + 999);
    if (error) throw new Error("Could not load the directory.");
    return rows ?? [];
  });

export const clearDirectory = createServerFn({ method: "POST" }).handler(async () => {
  const { authorizeDirectory } = await import("./directory.server");
  await authorizeDirectory(true);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin.from("sites").delete().not("id", "is", null);
  if (error) throw new Error("Could not replace the directory.");
  return { ok: true };
});

export const uploadDirectoryBatch = createServerFn({ method: "POST" })
  .validator(z.object({ sites: z.array(siteSchema).min(1).max(1000) }))
  .handler(async ({ data }) => {
    const { authorizeDirectory } = await import("./directory.server");
    await authorizeDirectory(true);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("sites").insert(data.sites);
    if (error) throw new Error("Could not save this upload batch.");
    return { ok: true };
  });

const catalogEnum = z.enum(["transport", "metro", "fn_access"]);

const contactSchema = z.object({
  catalog: catalogEnum,
  zone_region: z.string(), title: z.string(), name: z.string(), phone: z.string(),
  device_name: z.string(), site_region: z.string(), ip_address: z.string(), fou_g: z.string(),
  manager: z.string(), manager_phone: z.string(), sup_name: z.string(), sup_phone: z.string(),
});

export const readCatalogPage = createServerFn({ method: "GET" })
  .validator(z.object({ catalog: catalogEnum, from: z.number().int().min(0) }))
  .handler(async ({ data }) => {
    const { authorizeDirectory } = await import("./directory.server");
    await authorizeDirectory();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin.from("catalog_contacts")
      .select("catalog,zone_region,title,name,phone,device_name,site_region,ip_address,fou_g,manager,manager_phone,sup_name,sup_phone")
      .eq("catalog", data.catalog)
      .order("zone_region").order("id").range(data.from, data.from + 999);
    if (error) throw new Error("Could not load this catalog.");
    return rows ?? [];
  });

export const clearCatalog = createServerFn({ method: "POST" })
  .validator(z.object({ catalog: catalogEnum }))
  .handler(async ({ data }) => {
    const { authorizeDirectory } = await import("./directory.server");
    await authorizeDirectory(true);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("catalog_contacts").delete().eq("catalog", data.catalog);
    if (error) throw new Error("Could not replace this catalog.");
    return { ok: true };
  });

export const uploadCatalogBatch = createServerFn({ method: "POST" })
  .validator(z.object({ contacts: z.array(contactSchema).min(1).max(1000) }))
  .handler(async ({ data }) => {
    const { authorizeDirectory } = await import("./directory.server");
    await authorizeDirectory(true);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("catalog_contacts").insert(data.contacts);
    if (error) throw new Error("Could not save this upload batch.");
    return { ok: true };
  });