import { createClient } from "@supabase/supabase-js";
import { defineTool } from "@lovable.dev/mcp-js";

function anon() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "list_regions",
  title: "List regions and FOU groups",
  description: "Return the distinct site regions and, for each, the FOU groups present in that region. Useful before calling search_sites with filters.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async () => {
    const sb = anon();
    const { data, error } = await sb.from("sites").select("site_region,fou_g").limit(20000);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const map = new Map<string, Set<string>>();
    for (const row of data ?? []) {
      const r = row.site_region || "";
      const f = row.fou_g || "";
      if (!r) continue;
      if (!map.has(r)) map.set(r, new Set());
      if (f) map.get(r)!.add(f);
    }
    const regions = [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([region, fous]) => ({ region, fou_groups: [...fous].sort() }));

    return {
      content: [{ type: "text", text: JSON.stringify(regions) }],
      structuredContent: { regions },
    };
  },
});
