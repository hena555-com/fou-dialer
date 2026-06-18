import Papa from "papaparse";
import * as XLSX from "xlsx";

export type Site = {
  ne_id: string;
  site_region: string;
  power_type: string;
  lat: string;
  lng: string;
  fou_g: string;
  manager1: string;
  manager1_phone: string;
  manager2: string;
  manager2_phone: string;
  sup_name: string;
  sup_phone: string;
};

const STORAGE_KEY = "site_directory_v1";

const norm = (s: string) =>
  s.toLowerCase().replace(/[\s_-]+/g, "").replace(/[^a-z0-9]/g, "");

const FIELD_MAP: Record<keyof Site, string[]> = {
  ne_id: ["neid", "siteid", "id"],
  site_region: ["siteregion", "region"],
  power_type: ["powertype", "power"],
  lat: ["lata", "lat", "latitude"],
  lng: ["longa", "lng", "long", "longitude"],
  fou_g: ["foug", "fou"],
  manager1: ["manager1", "managername", "manager"],
  manager1_phone: ["manager1phone", "managerphone"],
  manager2: ["manager2"],
  manager2_phone: ["manager2phone"],
  sup_name: ["supname", "supervisor", "supervisorname", "fousupervisor"],
  sup_phone: ["supphone", "supervisorphone", "fousupervisorphone"],
};

const cleanVal = (v: unknown): string => {
  if (v === null || v === undefined) return "";
  const s = String(v).trim();
  if (!s || s.toLowerCase() === "null" || s.toLowerCase() === "nan") return "";
  return s;
};

function rowsToSites(rows: Record<string, unknown>[]): Site[] {
  return rows
    .map((row) => {
      const normalized: Record<string, unknown> = {};
      for (const k of Object.keys(row)) normalized[norm(k)] = row[k];
      const site = {} as Site;
      (Object.keys(FIELD_MAP) as (keyof Site)[]).forEach((key) => {
        for (const alias of FIELD_MAP[key]) {
          if (normalized[alias] !== undefined) {
            site[key] = cleanVal(normalized[alias]);
            return;
          }
        }
        site[key] = "";
      });
      return site;
    })
    .filter((s) => s.ne_id || s.site_region || s.manager1 || s.sup_name);
}

export async function parseFile(file: File): Promise<Site[]> {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "csv" || ext === "txt") {
    return new Promise((resolve, reject) => {
      Papa.parse<Record<string, unknown>>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (res) => resolve(rowsToSites(res.data)),
        error: reject,
      });
    });
  }
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  });
  return rowsToSites(rows);
}

export function loadSites(): Site[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Site[]) : [];
  } catch {
    return [];
  }
}

export function saveSites(sites: Site[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sites));
}

export function clearSites() {
  localStorage.removeItem(STORAGE_KEY);
}

export function formatPhone(p: string): string {
  const digits = p.replace(/[^\d+]/g, "");
  if (!digits) return "";
  if (/^9\d{8}$/.test(digits)) return `+251${digits}`;
  if (/^09\d{8}$/.test(digits)) return `+251${digits.slice(1)}`;
  return digits;
}

export const SAMPLE_SITES: Site[] = [
  {
    ne_id: "111001",
    site_region: "WAAZ",
    power_type: "AC+DG",
    lat: "9.03251",
    lng: "38.72548",
    fou_g: "FOU2_Addis Ketema",
    manager1: "Kassu Bekele Yami",
    manager1_phone: "911525458",
    manager2: "",
    manager2_phone: "",
    sup_name: "Abebe feyisa",
    sup_phone: "930015313",
  },
  {
    ne_id: "111002",
    site_region: "SAAZ",
    power_type: "AC+DG",
    lat: "8.895278",
    lng: "38.77861",
    fou_g: "FOU2_Kality",
    manager1: "Yared Gizaw Allo",
    manager1_phone: "911248055",
    manager2: "",
    manager2_phone: "",
    sup_name: "Tariku Wondwosen",
    sup_phone: "935404287",
  },
  {
    ne_id: "111003",
    site_region: "SAAZ",
    power_type: "AC+DG",
    lat: "8.90464",
    lng: "38.76678",
    fou_g: "FOU2_Kality",
    manager1: "Yared Gizaw Allo",
    manager1_phone: "911248055",
    manager2: "",
    manager2_phone: "",
    sup_name: "Tariku Wondwosen",
    sup_phone: "935404287",
  },
];
