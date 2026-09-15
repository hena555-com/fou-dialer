import { createFileRoute, redirect } from "@tanstack/react-router";
import { Lock, Radio } from "lucide-react";
import { isUnlocked } from "@/lib/gate.functions";

export const Route = createFileRoute("/unlock")({
  validateSearch: (search: Record<string, unknown>) => ({
    error: search.error === "1",
  }),
  beforeLoad: async () => {
    const { unlocked } = await isUnlocked();
    if (unlocked) throw redirect({ to: "/" });
  },
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
  const { error: hasError } = Route.useSearch();

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

        <form action="/api/public/unlock" method="post" className="mt-4 space-y-3">
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="Passcode"
            className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
          />
          {hasError && <p className="text-xs text-destructive">Incorrect passcode.</p>}
          <button
            type="submit"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground"
          >
            <Lock className="h-4 w-4" /> Enter
          </button>
        </form>
      </div>
    </div>
  );
}
