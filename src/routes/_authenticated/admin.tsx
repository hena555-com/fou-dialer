import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Upload, Trash2, FileSpreadsheet } from "lucide-react";
import { parseFile, SAMPLE_SITES, type Site } from "@/lib/sites";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — FOU Dialer" }] }),
  component: AdminPage,
});

function AdminPage() {
  const navigate = useNavigate();
  const { isAdmin, loading } = useAuth();
  const [count, setCount] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !isAdmin) navigate({ to: "/", replace: true });
  }, [loading, isAdmin, navigate]);

  async function refresh() {
    const { count } = await supabase
      .from("sites")
      .select("*", { count: "exact", head: true });
    setCount(count ?? 0);
  }

  useEffect(() => { void refresh(); }, []);

  async function replaceAll(sites: Site[]) {
    setBusy(true); setErr(null); setMsg(null);
    try {
      const del = await supabase.from("sites").delete().not("id", "is", null);
      if (del.error) throw del.error;
      if (sites.length) {
        const ins = await supabase.from("sites").insert(sites);
        if (ins.error) throw ins.error;
      }
      setMsg(`Replaced with ${sites.length} sites.`);
      await refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleFile(file: File) {
    setBusy(true); setErr(null); setMsg(null);
    try {
      const parsed = await parseFile(file);
      if (!parsed.length) throw new Error("No rows found. Check your file headers.");
      await replaceAll(parsed);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
      setBusy(false);
    }
  }

  async function clearAll() {
    if (!confirm("Delete ALL sites? This cannot be undone.")) return;
    setBusy(true); setErr(null); setMsg(null);
    try {
      const { error } = await supabase.from("sites").delete().not("id", "is", null);
      if (error) throw error;
      setMsg("All sites deleted.");
      await refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading || !isAdmin) {
    return <div className="min-h-screen grid place-items-center text-sm text-muted-foreground">Checking access…</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-2xl px-4 py-4 flex items-center gap-3">
          <Link to="/" className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-base font-semibold">Admin</h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 space-y-4">
        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Sites</h2>
              <p className="text-xs text-muted-foreground">
                {count === null ? "Loading…" : `${count} sites in database`}
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-2">
            <button
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground active:scale-[0.99] disabled:opacity-60"
            >
              <Upload className="h-4 w-4" />
              {busy ? "Working…" : "Upload CSV / Excel (replaces all)"}
            </button>
            <button
              onClick={() => replaceAll(SAMPLE_SITES)}
              disabled={busy}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium hover:bg-muted disabled:opacity-60"
            >
              Load sample data
            </button>
            <button
              onClick={clearAll}
              disabled={busy || count === 0}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/40 bg-background px-4 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-60"
            >
              <Trash2 className="h-4 w-4" /> Delete all sites
            </button>
          </div>

          {msg && <p className="mt-4 rounded-lg bg-primary/10 px-3 py-2 text-xs text-primary">{msg}</p>}
          {err && <p className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{err}</p>}

          <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
            Expected columns: NE_ID, Site_region, Power_type, FOU_G, Manager1,
            Manager1_phone, Manager2, Manager2_phone, Sup_name, Sup_phone.
          </p>
        </section>

        <input
          ref={fileRef}
          type="file"
          accept=".csv,.xlsx,.xls,.txt"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />
      </main>
    </div>
  );
}
