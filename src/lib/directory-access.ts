export function requireDirectoryAccess(unlocked: boolean) {
  if (!unlocked) throw new Error("Unlock the directory first.");
}

export function requireSameOrigin(origin: string | null, url: string) {
  if (!origin || origin !== new URL(url).origin) throw new Error("Invalid request origin.");
}