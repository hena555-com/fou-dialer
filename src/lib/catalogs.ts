import Papa from "papaparse";
import * as XLSX from "xlsx";

export type CatalogId = "wireless" | "transport" | "metro" | "fn_access";

export const CATALOGS: { id: CatalogId; label: string }[] = [
  { id: "wireless", label: "Wireless FOU" },
  { id: "transport", label: "Transport Network" },
  { id: "metro", label: "Metro Network" },
  { id: "fn_access", label: "FN_access FOU" },
];

export type ContactCatalog = "transport" | "metro" | "fn_access";

export type ContactRow = {
  catalog: ContactCatalog;
  zone_region: string;
  title: string;
  name: string;
  phone: string;
  device_name: string;
  site_region: string;
  ip_address: string;
  fou_g: string;
  manager: string;
  manager_phone: string;
  sup_name: string;
  sup_phone: string;
};

const norm = (s: string) =>
  s.toLowerCase().replace(/[\s_\-/]+/g, "").replace(/[^a-z0-9]/g, "");

const cleanVal = (v: unknown): string => {
  if (v === null || v === undefined) return "";
  const s = String(v).trim();
  if (!s || s.toLowerCase() === "null" || s.toLowerCase() === "nan") return "";
  return s;
};

const emptyRow = (catalog: ContactCatalog): ContactRow => ({
  catalog,
  zone_region: "",
  title: "",
  name: "",
  phone: "",
  device_name: "",
  site_region: "",
  ip_address: "",
  fou_g: "",
  manager: "",
  manager_phone: "",
  sup_name: "",
  sup_phone: "",
});

// Transport / Metro: Zone / Region, Title, Name, Cell Phone.
// The region is only written on the first row of each group — fill it down.
const TM_MAP: Record<string, keyof ContactRow> = {
  zoneregion: "zone_region",
  zonalregion: "zone_region",
  zonalregionallocation: "zone_region",
  region: "zone_region",
  zone: "zone_region",
  title: "title",
  name: "name",
  cellphone: "phone",
  phone: "phone",
};

// FN_access FOU: Device_Name, Site_region, IP_Adress, FOU_G, Manager, Manager_phone, Sup_name, Sup_phone
const FN_MAP: Record<string, keyof ContactRow> = {
  devicename: "device_name",
  device: "device_name",
  siteregion: "site_region",
  region: "site_region",
  ipadress: "ip_address",
  ipaddress: "ip_address",
  ip: "ip_address",
  foug: "fou_g",
  fou: "fou_g",
  manager: "manager",
  managerphone: "manager_phone",
  supname: "sup_name",
  supervisor: "sup_name",
  supervisorname: "sup_name",
  supphone: "sup_phone",
  supervisorphone: "sup_phone",
};

function rowsToContacts(
  rows: Record<string, unknown>[],
  catalog: "transport" | "metro" | "fn_access",
): ContactRow[] {
  const map = catalog === "fn_access" ? FN_MAP : TM_MAP;
  const regionKey = catalog === "fn_access" ? "site_region" : "zone_region";
  let lastRegion = "";
  return rows
    .map((row) => {
      const normalized: Record<string, unknown> = {};
      for (const k of Object.keys(row)) normalized[norm(k)] = row[k];
      const contact = emptyRow(catalog);
      for (const [alias, key] of Object.entries(map)) {
        if (normalized[alias] !== undefined && key !== "catalog") {
          (contact as Record<string, string>)[key] = cleanVal(normalized[alias]);
        }
      }
      if (contact[regionKey]) {
        lastRegion = contact[regionKey];
      } else {
        contact[regionKey] = lastRegion;
      }
      return contact;
    })
    .filter((c) => c.name || c.phone || c.device_name || c.manager || c.sup_name);
}

async function readRows(file: File): Promise<Record<string, unknown>[]> {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "csv" || ext === "txt") {
    return new Promise((resolve, reject) => {
      Papa.parse<Record<string, unknown>>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (res) => resolve(res.data),
        error: reject,
      });
    });
  }
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
}

export async function parseCatalogFile(
  file: File,
  catalog: "transport" | "metro" | "fn_access",
): Promise<ContactRow[]> {
  const rows = await readRows(file);
  return rowsToContacts(rows, catalog);
}

export function formatPhone(p: string): string {
  const digits = p.replace(/[^\d+]/g, "");
  if (!digits) return "";
  if (/^9\d{8}$/.test(digits)) return `+251${digits}`;
  if (/^09\d{8}$/.test(digits)) return `+251${digits.slice(1)}`;
  return digits;
}
