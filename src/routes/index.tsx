import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import {
  Phone, Search, MapPin, User, HardHat, Radio, X, Upload,
} from "lucide-react";
import { formatPhone, type Site } from "@/lib/sites";
import { readDirectoryPage, readCatalogPage as fetchCatalogPage } from "@/lib/directory.functions";
import { isUnlocked } from "@/lib/gate.functions";
import { CATALOGS, type CatalogId, type ContactRow } from "@/lib/catalogs";

const PAGE_SIZE = 1000;

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const { unlocked } = await isUnlocked();
    if (!unlocked) throw redirect({ to: "/unlock", search: { error: false } });
  },
  head: () => ({
    meta: [
      { title: "FOU Dialer — Site & FOU contacts" },
      { name: "description", content: "Private directory of site managers and FOU supervisors with one-tap calling." },
      { property: "og:title", content: "FOU Dialer" },
      { property: "og:description", content: "Private directory of site managers and FOU supervisors." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  const [catalog, setCatalog] = useState<CatalogId>("wireless");
  const [sites, setSites] = useState<Site[]>([]);
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState<string>("all");
  const [fou, setFou] = useState<string>("all");
  const [selected, setSelected] = useState<Site | null>(null);
  const [selectedContact, setSelectedContact] = useState<ContactRow | null>(null);
  const navigate = useNavigate();

  async function loadSites() {
    const allSites: Site[] = [];
    for (let from = 0; ; from += PAGE_SIZE) {
      let data: Site[];
      try {
        data = await readDirectoryPage({ data: { from } });
      } catch (error) {
        console.error("Failed to load sites", error);
        return;
      }
      if (!data || data.length === 0) break;
      allSites.push(...(data as Site[]));
      if (data.length < PAGE_SIZE) break;
    }
    setSites(allSites);
    if (allSites.length === 0) {
      void navigate({ to: "/upload" });
    }
  }

  async function loadContacts(cat: CatalogId) {
    if (cat === "wireless") return;
    const all: ContactRow[] = [];
    for (let from = 0; ; from += PAGE_SIZE) {
      let data: ContactRow[];
      try {
        data = (await fetchCatalogPage({ data: { catalog: cat, from } })) as ContactRow[];
      } catch (error) {
        console.error("Failed to load catalog", error);
        return;
      }
      if (!data || data.length === 0) break;
      all.push(...data);
      if (data.length < PAGE_SIZE) break;
    }
    setContacts(all);
  }

  useEffect(() => {
    void loadSites();
  }, []);

  useEffect(() => {
    setQuery("");
    setRegion("all");
    setFou("all");
    setSelected(null);
    setSelectedContact(null);
    if (catalog !== "wireless") void loadContacts(catalog);
  }, [catalog]);

  const isWireless = catalog === "wireless";
  const contactRegionKey = catalog === "fn_access" ? "site_region" : "zone_region";

  const regions = useMemo(
    () => Array.from(new Set(sites.map((s) => s.site_region).filter(Boolean))).sort(),
    [sites],
  );
  const fous = useMemo(
    () => Array.from(new Set(
      sites.filter((s) => region === "all" || s.site_region === region).map((s) => s.fou_g).filter(Boolean),
    )).sort(),
    [sites, region],
  );

  const contactRegions = useMemo(
    () => Array.from(new Set(
      contacts.map((c) => c[contactRegionKey as keyof ContactRow] as string).filter(Boolean),
    )).sort(),
    [contacts, contactRegionKey],
  );

  // Pre-compute one lowercase haystack per site so typing doesn't redo it each keystroke
  const indexed = useMemo(
    () =>
      sites.map((s) => ({
        s,
        hay: `${s.ne_id} ${s.site_region} ${s.fou_g} ${s.manager1} ${s.sup_name}`.toLowerCase(),
      })),
    [sites],
  );

  const indexedContacts = useMemo(
    () =>
      contacts.map((c) => ({
        c,
        hay: `${c.zone_region} ${c.site_region} ${c.title} ${c.name} ${c.device_name} ${c.fou_g} ${c.manager} ${c.sup_name} ${c.ip_address}`.toLowerCase(),
      })),
    [contacts],
  );

  const deferredQuery = useDeferredValue(query);

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    const out: Site[] = [];
    for (const { s, hay } of indexed) {
      if (region !== "all" && s.site_region !== region) continue;
      if (fou !== "all" && s.fou_g !== fou) continue;
      if (q && !hay.includes(q)) continue;
      out.push(s);
    }
    return out;
  }, [indexed, deferredQuery, region, fou]);

  const filteredContacts = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    const out: ContactRow[] = [];
    for (const { c, hay } of indexedContacts) {
      if (region !== "all" && (c[contactRegionKey as keyof ContactRow] as string) !== region) continue;
      if (q && !hay.includes(q)) continue;
      out.push(c);
    }
    return out;
  }, [indexedContacts, deferredQuery, region, contactRegionKey]);

  const [visible, setVisible] = useState(100);
  useEffect(() => { setVisible(100); }, [deferredQuery, region, fou, catalog]);
  const shown = useMemo(() => filtered.slice(0, visible), [filtered, visible]);
  const shownContacts = useMemo(() => filteredContacts.slice(0, visible), [filteredContacts, visible]);

  const totalCount = isWireless ? sites.length : contacts.length;
  const filteredCount = isWireless ? filtered.length : filteredContacts.length;

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground shrink-0">
                <Radio className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base font-semibold leading-tight truncate">FOU Dialer</h1>
                <p className="text-xs text-muted-foreground truncate">
                  {totalCount ? `${totalCount} ${isWireless ? "sites" : "contacts"}` : "No data yet"}
                </p>
              </div>
            </div>
            <Link
              to="/upload"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted shrink-0"
            >
              <Upload className="h-3.5 w-3.5" /> Upload
            </Link>
          </div>

          <div className="mt-3 -mx-4 overflow-x-auto px-4 pb-1">
            <div className="flex gap-2 w-max">
              {CATALOGS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCatalog(c.id)}
                  className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                    catalog === c.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "border border-border bg-background text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-2 space-y-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={isWireless ? "Search site ID, region, FOU, or person…" : "Search name, title, or region…"}
                className="h-11 w-full rounded-xl border border-input bg-background pl-9 pr-9 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
              />
              {query && (
                <button onClick={() => setQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <select
                value={region}
                onChange={(e) => { setRegion(e.target.value); setFou("all"); }}
                className="h-10 flex-1 rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-ring"
              >
                <option value="all">All regions</option>
                {(isWireless ? regions : contactRegions).map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              {isWireless && (
                <select
                  value={fou}
                  onChange={(e) => setFou(e.target.value)}
                  className="h-10 flex-1 rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-ring"
                >
                  <option value="all">All FOUs</option>
                  {fous.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pt-4">
        <p className="px-1 pb-2 text-xs text-muted-foreground">
          {filteredCount} of {totalCount} {isWireless ? "sites" : "contacts"}
        </p>

        {isWireless ? (
          <ul className="space-y-2">
            {shown.map((s, i) => (
              <li key={`${s.ne_id}-${i}`}>
                <button
                  onClick={() => setSelected(s)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left shadow-sm transition active:scale-[0.99] hover:border-primary/40"
                >
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <span className="text-[11px] font-bold tracking-wide">{s.site_region || "—"}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="truncate text-sm font-semibold text-foreground">{s.ne_id || "—"}</span>
                      {s.power_type && (
                        <span className="rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-secondary-foreground">
                          {s.power_type}
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">{s.fou_g || "—"}</span>
                    </div>
                  </div>
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <EmptyState hasData={sites.length > 0} />
            )}
            {filtered.length > shown.length && (
              <ShowMore left={filtered.length - shown.length} onMore={() => setVisible((v) => v + 200)} />
            )}
          </ul>
        ) : (
          <ul className="space-y-2">
            {shownContacts.map((c, i) => (
              <li key={`${c.name || c.device_name}-${i}`}>
                <button
                  onClick={() => setSelectedContact(c)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left shadow-sm transition active:scale-[0.99] hover:border-primary/40"
                >
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <span className="text-[10px] font-bold tracking-wide">
                      {((c[contactRegionKey as keyof ContactRow] as string) || "—").slice(0, 8)}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="truncate text-sm font-semibold text-foreground block">
                      {catalog === "fn_access" ? (c.device_name || c.manager || "—") : (c.name || "—")}
                    </span>
                    <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <User className="h-3 w-3 shrink-0" />
                      <span className="truncate">
                        {catalog === "fn_access"
                          ? (c.manager || c.sup_name || c.fou_g || "—")
                          : (c.title || "—")}
                      </span>
                    </div>
                  </div>
                </button>
              </li>
            ))}
            {filteredContacts.length === 0 && (
              <EmptyState hasData={contacts.length > 0} />
            )}
            {filteredContacts.length > shownContacts.length && (
              <ShowMore left={filteredContacts.length - shownContacts.length} onMore={() => setVisible((v) => v + 200)} />
            )}
          </ul>
        )}
      </main>

      {selected && <SiteSheet site={selected} onClose={() => setSelected(null)} />}
      {selectedContact && (
        <ContactSheet catalog={catalog} contact={selectedContact} onClose={() => setSelectedContact(null)} />
      )}
    </div>
  );
}

function EmptyState({ hasData }: { hasData: boolean }) {
  return (
    <li className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
      <p>{hasData ? "No results match your filters." : "No data yet."}</p>
      {!hasData && (
        <Link
          to="/upload"
          className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          <Upload className="h-4 w-4" /> Upload data
        </Link>
      )}
    </li>
  );
}

function ShowMore({ left, onMore }: { left: number; onMore: () => void }) {
  return (
    <li>
      <button
        onClick={onMore}
        className="w-full rounded-2xl border border-border bg-card p-3 text-sm font-medium text-foreground hover:bg-muted"
      >
        Show more ({left} left)
      </button>
    </li>
  );
}

function ContactSheet({
  catalog, contact, onClose,
}: { catalog: CatalogId; contact: ContactRow; onClose: () => void }) {
  const isFn = catalog === "fn_access";
  const contacts = isFn
    ? [
        { role: "Manager", icon: User, name: contact.manager, phone: contact.manager_phone },
        { role: "FOU Supervisor", icon: HardHat, name: contact.sup_name, phone: contact.sup_phone },
      ].filter((c) => c.name || c.phone)
    : [
        { role: contact.title || "Contact", icon: User, name: contact.name, phone: contact.phone },
      ].filter((c) => c.name || c.phone);

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-foreground/40 backdrop-blur-sm">
      <button className="absolute inset-0" onClick={onClose} aria-label="Close" />
      <div className="relative z-10 w-full max-w-2xl rounded-t-3xl bg-card p-5 shadow-2xl animate-in slide-in-from-bottom">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-border" />
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-foreground">
              {isFn ? (contact.device_name || "—") : (contact.name || "—")}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {isFn && contact.site_region && <span>Region: {contact.site_region}</span>}
              {isFn && contact.fou_g && <span>FOU: {contact.fou_g}</span>}
              {!isFn && contact.zone_region && <span>Zone / Region: {contact.zone_region}</span>}
              {!isFn && contact.title && <span>{contact.title}</span>}
            </div>
            {isFn && contact.ip_address && (
              <p className="mt-2 text-xs font-medium text-muted-foreground">IP: {contact.ip_address}</p>
            )}
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-2">
          {contacts.length === 0 && (
            <p className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">No contacts available.</p>
          )}
          {contacts.map((c, i) => {
            const tel = formatPhone(c.phone);
            return (
              <div key={i} className="flex items-center gap-3 rounded-2xl border border-border bg-background p-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <c.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{c.role}</p>
                  <p className="truncate text-sm font-semibold text-foreground">{c.name || "Unnamed"}</p>
                  {tel && <p className="text-xs text-muted-foreground">{tel}</p>}
                </div>
                {tel ? (
                  <a href={`tel:${tel}`} className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-3 py-2.5 text-sm font-semibold text-accent-foreground shadow-sm active:scale-95">
                    <Phone className="h-4 w-4" /> Call
                  </a>
                ) : (
                  <span className="text-xs text-muted-foreground">No number</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SiteSheet({ site, onClose }: { site: Site; onClose: () => void }) {
  const contacts = [
    { role: "Manager", icon: User, name: site.manager1, phone: site.manager1_phone },
    { role: "Manager 2", icon: User, name: site.manager2, phone: site.manager2_phone },
    { role: "FOU Supervisor", icon: HardHat, name: site.sup_name, phone: site.sup_phone },
  ].filter((c) => c.name || c.phone);

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-foreground/40 backdrop-blur-sm">
      <button className="absolute inset-0" onClick={onClose} aria-label="Close" />
      <div className="relative z-10 w-full max-w-2xl rounded-t-3xl bg-card p-5 shadow-2xl animate-in slide-in-from-bottom">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-border" />
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-foreground">Site {site.ne_id || "—"}</h3>
              {site.power_type && (
                <span className="rounded-md bg-secondary px-1.5 py-0.5 text-[11px] font-medium text-secondary-foreground">
                  {site.power_type}
                </span>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {site.site_region && <span>Region: {site.site_region}</span>}
              {site.fou_g && <span>FOU: {site.fou_g}</span>}
            </div>
            {(site.lat || site.lng) && (
              <a
                href={`https://www.google.com/maps?q=${site.lat},${site.lng}`}
                target="_blank" rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                <MapPin className="h-3.5 w-3.5" /> {site.lat}, {site.lng}
              </a>
            )}
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-2">
          {contacts.length === 0 && (
            <p className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">No contacts available.</p>
          )}
          {contacts.map((c, i) => {
            const tel = formatPhone(c.phone);
            return (
              <div key={i} className="flex items-center gap-3 rounded-2xl border border-border bg-background p-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <c.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{c.role}</p>
                  <p className="truncate text-sm font-semibold text-foreground">{c.name || "Unnamed"}</p>
                  {tel && <p className="text-xs text-muted-foreground">{tel}</p>}
                </div>
                {tel ? (
                  <a href={`tel:${tel}`} className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-3 py-2.5 text-sm font-semibold text-accent-foreground shadow-sm active:scale-95">
                    <Phone className="h-4 w-4" /> Call
                  </a>
                ) : (
                  <span className="text-xs text-muted-foreground">No number</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
