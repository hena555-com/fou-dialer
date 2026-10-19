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