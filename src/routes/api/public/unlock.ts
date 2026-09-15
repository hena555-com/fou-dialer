import { createFileRoute } from "@tanstack/react-router";
import { useSession } from "@tanstack/react-start/server";
import { createHash, timingSafeEqual } from "node:crypto";

type GateSession = { unlocked?: boolean };

function passwordMatches(input: string, expected: string): boolean {
  const inputDigest = createHash("sha256").update(input, "utf8").digest();
  const expectedDigest = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(inputDigest, expectedDigest);
}

export const Route = createFileRoute("/api/public/unlock")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const form = await request.formData();
        const password = form.get("password");
        const expected = process.env["SITE_PASSWORD"];
        const sessionSecret = process.env["SESSION_SECRET"];

        if (typeof password !== "string" || !expected || !sessionSecret || !passwordMatches(password, expected)) {
          return new Response(null, {
            status: 303,
            headers: { Location: "/unlock?error=1" },
          });
        }

        const session = await useSession<GateSession>({
          password: sessionSecret,
          name: "fou-gate",
          maxAge: 60 * 60 * 24 * 30,
          cookie: { httpOnly: true, secure: true, sameSite: "lax", path: "/" },
        });
        await session.update({ unlocked: true });

        return new Response(null, {
          status: 303,
          headers: { Location: "/" },
        });
      },
    },
  },
});