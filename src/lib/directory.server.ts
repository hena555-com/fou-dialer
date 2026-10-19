import { useSession, getRequest } from "@tanstack/react-start/server";
import { requireDirectoryAccess, requireSameOrigin } from "./directory-access";

export async function authorizeDirectory(write = false) {
  const secret = process.env["SESSION_SECRET"];
  if (!secret) throw new Error("Directory access is unavailable.");
  const session = await useSession<{ unlocked?: boolean }>({
    password: secret,
    name: "fou-gate",
    maxAge: 60 * 60 * 24 * 30,
    cookie: { httpOnly: true, secure: true, sameSite: "lax", path: "/" },
  });
  requireDirectoryAccess(session.data.unlocked === true);
  if (write) {
    const request = getRequest();
    requireSameOrigin(request.headers.get("origin"), request.url);
  }
}