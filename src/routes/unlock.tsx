import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Lock, Radio } from "lucide-react";
import { unlockSite } from "@/lib/gate.functions";

export const Route = createFileRoute("/unlock")({
  head: () => ({
    meta: [
      { title: "Enter passcode | FOU Dialer" },
      { name: "description", content: "This site directory is private. Enter the shared passcode to continue." },
      { property: "og:title", content: "Enter passcode | FOU Dialer" },
      { property: "og:description", content: "This site directory is private." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Unlock,
});

function Unlock() {
  const router = useRouter();
  const unlock = useServerFn(unlockSite);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (busy || !password) return;
    setBusy(true);
    setError(false);
    try {
      const { ok } = await unlock({ data: { password } });
      if (ok) await router.navigate({ to: "/" });
      else setError(true);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Radio className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-semibold leading-tight">FOU Dialer</h1>
            <p className="text-xs text-muted-foreground">Private directory</p>
          </div>
        </div>

        <p className="mt-4 text-sm text-muted-foreground">
          Enter the shared passcode to view site contacts.
        </p>

        <form onSubmit={onSubmit} className="mt-4 space-y-3">
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Passcode"
            className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
          />
          {error && <p className="text-xs text-destructive">Incorrect passcode.</p>}
          <button
            type="submit"
            disabled={busy}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            <Lock className="h-4 w-4" /> {busy ? "Checking…" : "Enter"}
          </button>
        </form>
      </div>
    </div>
  );
}
