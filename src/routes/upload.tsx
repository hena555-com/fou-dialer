import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Upload, ArrowLeft } from "lucide-react";
import { parseFile, type Site } from "@/lib/sites";
import {
  clearDirectory, uploadDirectoryBatch, clearCatalog, uploadCatalogBatch,
} from "@/lib/directory.functions";
import { isUnlocked } from "@/lib/gate.functions";
import {
  CATALOGS, parseCatalogFile, type CatalogId, type ContactRow,
} from "@/lib/catalogs";

export const Route = createFileRoute("/upload")({
  beforeLoad: async () => {
    const { unlocked } = await isUnlocked();
    if (!unlocked) throw redirect({ to: "/unlock", search: { error: false } });
  },
  head: () => ({
    meta: [
      { title: "Upload data | FOU Dialer" },
      { name: "description", content: "Replace a catalog by uploading a CSV or Excel file." },
      { property: "og:title", content: "Upload data | FOU Dialer" },
      { property: "og:description", content: "Replace a catalog by uploading a CSV or Excel file." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: UploadPage,
});

const BATCH_SIZE = 1000;
const CONCURRENCY = 5;

function UploadPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const [catalog, setCatalog] = useState<CatalogId>("wireless");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<string>("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function uploadBatches<T>(
    rows: T[],
    send: (batch: T[]) => Promise<unknown>,
    label: string,
  ) {
    const total = rows.length;
    const batches: T[][] = [];
    for (let i = 0; i < total; i += BATCH_SIZE) {
      batches.push(rows.slice(i, i + BATCH_SIZE));
    }
    let inserted = 0;
    let done = 0;
    const errors: string[] = [];
    let cursor = 0;

    async function worker() {
      while (cursor < batches.length) {
        const idx = cursor++;
        const batch = batches[idx];
        try {
          await send(batch);
          inserted += batch.length;
        } catch (e) {
          errors.push(`Batch ${idx + 1}: ${e instanceof Error ? e.message : "Upload failed"}`);
        }
        done++;
        setProgress(`Uploading… ${done}/${batches.length} batches (saved ${inserted}/${total})`);
      }
    }

    await Promise.all(
      Array.from({ length: Math.min(CONCURRENCY, batches.length) }, worker),
    );
    return { inserted, total, errors, label };
  }

  async function handleUpload(file: File) {
    setUploading(true);
    setMessage(null);
    setError(null);
    setProgress("Parsing file…");
    try {
      let result: { inserted: number; total: number; errors: string[]; label: string };

      if (catalog === "wireless") {
        const parsed = await parseFile(file);
        if (!parsed.length) throw new Error("No rows found. Check your file headers.");
        setProgress(`Parsed ${parsed.length} rows. Clearing old data…`);
        await clearDirectory();
        result = await uploadBatches<Site>(
          parsed,
          (batch) => uploadDirectoryBatch({ data: { sites: batch } }),
          "sites",
        );
      } else {
        const parsed = await parseCatalogFile(file, catalog);
        if (!parsed.length) throw new Error("No rows found. Check your file headers.");
        setProgress(`Parsed ${parsed.length} rows. Clearing old data…`);
        await clearCatalog({ data: { catalog } });
        result = await uploadBatches<ContactRow>(
          parsed,
          (batch) => uploadCatalogBatch({ data: { contacts: batch } }),
          "contacts",
        );
      }

      if (result.errors.length) {
        setError(`Completed with errors: ${result.errors.slice(0, 3).join("; ")}`);
        setMessage(`Uploaded ${result.inserted} of ${result.total} ${result.label}.`);
        setProgress("");
      } else {
        setMessage(`Uploaded ${result.inserted} ${result.label}. Redirecting…`);
        setProgress("");
        void navigate({ to: "/" });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
      setProgress("");
    } finally {
      setUploading(false);
    }
  }

  const catalogLabel = CATALOGS.find((c) => c.id === catalog)?.label ?? "";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-2xl px-4 py-4 flex items-center gap-3">
          <Link to="/" className="rounded-lg p-2 hover:bg-muted">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-base font-semibold">Upload Data</h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 space-y-4">
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-sm font-medium text-foreground mb-2">Choose a catalog</p>
          <div className="grid grid-cols-2 gap-2 mb-5">
            {CATALOGS.map((c) => (
              <button
                key={c.id}
                onClick={() => setCatalog(c.id)}
                disabled={uploading}
                className={`rounded-xl px-3 py-2.5 text-xs font-medium transition text-left ${
                  catalog === c.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "border border-border bg-background text-muted-foreground hover:bg-muted"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            Upload a CSV or Excel file. This replaces all existing data in{" "}
            <span className="font-medium text-foreground">{catalogLabel}</span> only — the other
            catalogs are not touched. Large files (10,000+ rows) are uploaded in batches of {BATCH_SIZE}.
          </p>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm active:scale-[0.99] disabled:opacity-60"
          >
            <Upload className="h-4 w-4" />
            {uploading ? "Uploading…" : "Choose CSV / Excel file"}
          </button>

          {progress && (
            <p className="mt-4 rounded-lg bg-muted px-3 py-2 text-xs text-foreground">{progress}</p>
          )}
          {message && (
            <p className="mt-3 rounded-lg bg-primary/10 px-3 py-2 text-xs text-primary">{message}</p>
          )}
          {error && (
            <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>
          )}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept=".csv,.xlsx,.xls,.xlsm,.txt"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleUpload(file);
            e.target.value = "";
          }}
        />
      </main>
    </div>
  );
}
