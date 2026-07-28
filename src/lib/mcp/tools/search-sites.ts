import { createClient } from "@supabase/supabase-js";
import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

function anon() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "search_sites",
  title: "Search sites",
  description:
    "Search sites in the FOU Dialer directory by free-text query (matches site ID, region, FOU group, manager or supervisor names). Optionally filter by region and/or FOU group. Returns up to `limit` matching sites with their contact numbers.",
  inputSchema: {
    query: z.string().trim().optional().describe("Free-text search across ne_id, site_region, fou_g, manager1, sup_name."),
    region: z.string().trim().optional().describe("Exact site_region filter."),
    fou_g: z.string().trim().optional().describe("Exact FOU group filter."),
    limit: z.number().int().min(1).max(200).optional().describe("Max rows to return (default 50)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, region, fou_g, limit }) => {
    const sb = anon();
    let q = sb
      .from("sites")
      .select("ne_id,site_region,power_type,lat,lng,fou_g,manager1,manager1_phone,manager2,manager2_phone,sup_name,sup_phone")
      .limit(limit ?? 50);

    if (region) q = q.eq("site_region", region);
    if (fou_g) q = q.eq("fou_g", fou_g);
    if (query) {
      const like = `%${query.replace(/[%_]/g, "")}%`;
      q = q.or(
        [
          `ne_id.ilike.${like}`,
          `site_region.ilike.${like}`,
          `fou_g.ilike.${like}`,
          `manager1.ilike.${like}`,
          `manager2.ilike.${like}`,
          `sup_name.ilike.${like}`,
        ].join(","),
      );
    }

    const { data, error } = await q;
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { sites: data ?? [] },
    };
  },
});
