import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Phone, Search, MapPin, User, HardHat, Radio, X, LogOut, Shield,
} from "lucide-react";
import { formatPhone, type Site } from "@/lib/sites";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

const CACHE_KEY = "sites_cache_v1";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({ meta: [{ title: "FOU Dialer" }] }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  const { isAdmin, user } = useAuth();
  const [sites, setSites] = useState<Site[]>(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem(CACHE_KEY) || "[]"); } catch { return []; }
  });
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState<string>("all");
  const [fou, setFou] = useState<string>("all");
  const [selected, setSelected] = useState<Site | null>(null);

  useEffect(() => {
    supabase
      .from("sites")
      .select("ne_id,site_region,power_type,lat,lng,fou_g,manager1,manager1_phone,manager2,manager2_phone,sup_name,sup_phone")
      .order("site_region")
      .then(({ data }) => {
        if (data) {
          setSites(data as Site[]);
          try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch {/* ignore */}
        }
      });
  }, []);

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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sites.filter((s) => {
      if (region !== "all" && s.site_region !== region) return false;
      if (fou !== "all" && s.fou_g !== fou) return false;
      if (!q) return true;
      return (
        s.ne_id.toLowerCase().includes(q) ||
        s.site_region.toLowerCase().includes(q) ||
        s.fou_g.toLowerCase().includes(q) ||
        s.manager1.toLowerCase().includes(q) ||
        s.sup_name.toLowerCase().includes(q)
      );
    });
  }, [sites, query, region, fou]);

  async function signOut() {
    await supabase.auth.signOut();
    try { localStorage.removeItem(CACHE_KEY); } catch {/* ignore */}
    navigate({ to: "/auth", replace: true });
  }

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
                  {sites.length ? `${sites.length} sites` : "Loading…"}
                  {user?.email ? ` · ${user.email}` : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {isAdmin && (
                <Link
                  to="/admin"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium hover:bg-muted"
                >
                  <Shield className="h-3.5 w-3.5" /> Admin
                </Link>
              )}
              <button
                onClick={signOut}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
              >
                <LogOut className="h-3.5 w-3.5" /> Sign out
              </button>
            </div>
          </div>

          <div className="mt-3 space-y-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search site ID, region, FOU, or person…"
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
                {regions.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <select
                value={fou}
                onChange={(e) => setFou(e.target.value)}
                className="h-10 flex-1 rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-ring"
              >
                <option value="all">All FOUs</option>
                {fous.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pt-4">
        <p className="px-1 pb-2 text-xs text-muted-foreground">
          {filtered.length} of {sites.length} sites
        </p>
        <ul className="space-y-2">
          {filtered.map((s, i) => (
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
            <li className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
              {sites.length === 0
                ? "No sites yet. Ask an admin to upload data."
                : "No sites match your filters."}
            </li>
          )}
        </ul>
      </main>

      {selected && <SiteSheet site={selected} onClose={() => setSelected(null)} />}
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
