import { defineMcp } from "@lovable.dev/mcp-js";
import searchSites from "./tools/search-sites";
import getSite from "./tools/get-site";
import listRegions from "./tools/list-regions";

export default defineMcp({
  name: "fou-dialer-mcp",
  title: "FOU Dialer",
  version: "0.1.0",
  instructions:
    "Public tools over the FOU Dialer site directory. Use `list_regions` to discover regions and FOU groups, `search_sites` to find sites by text/region/FOU group, and `get_site` to fetch one site by its NE ID. Every result includes manager and supervisor phone numbers.",
  tools: [searchSites, getSite, listRegions],
});
