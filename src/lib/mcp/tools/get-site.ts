import { createClient } from "@supabase/supabase-js";
import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

function anon() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "get_site",
  title: "Get site by NE ID",
  description: "Fetch a single site by its ne_id, including region, FOU group, coordinates and all contact numbers.",
  inputSchema: {
    ne_id: z.string().trim().min(1).describe("The site's NE ID."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ ne_id }) => {
    const sb = anon();
    const { data, error } = await sb
      .from("sites")
      .select("ne_id,site_region,power_type,lat,lng,fou_g,manager1,manager1_phone,manager2,manager2_phone,sup_name,sup_phone")
      .eq("ne_id", ne_id)
      .maybeSingle();

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data) return { content: [{ type: "text", text: `No site with ne_id=${ne_id}` }], isError: true };

    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { site: data },
    };
  },
});
