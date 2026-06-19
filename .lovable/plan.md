# Add login + admin role to FOU Dialer

## What you'll get
- A sign-up / sign-in page. Anyone can create an account.
- The dialer is hidden behind login — only signed-in users see it.
- An **admin** role you can grant. Admins get an "Admin" page to **add / edit / delete sites and FOUs**.
- Regular users just see the dialer (same as today).
- The first account you create, I'll promote to admin for you (via a one-time SQL grant) so you can manage everyone else from the UI.

## How it works

### Backend (Lovable Cloud)
Enable Lovable Cloud, then create:
- `profiles` table — basic user info (id, email, display name), auto-created on signup via trigger.
- `app_role` enum (`admin`, `user`) + `user_roles` table — roles stored separately for security (never on profile).
- `has_role(user_id, role)` security-definer function — used by RLS policies.
- `sites` table — `{ id, name, region, sort_order }`.
- `fous` table — `{ id, site_id, name, phone, sort_order }`.
- RLS:
  - `profiles` / `user_roles`: user reads own row; admin reads all.
  - `sites` / `fous`: any signed-in user can SELECT; only admins can INSERT/UPDATE/DELETE.
- Seed `sites` + `fous` from the current `src/lib/sites.ts` so nothing is lost.

### Frontend
- `/auth` — public sign-in / sign-up page (email + password).
- `_authenticated/` layout — gates everything else; redirects to `/auth` when signed out.
- `/` (dialer) — moved under `_authenticated/`; now reads sites/FOUs from the database instead of the static file. Region filter behaves exactly as today.
- `/admin` — admin-only (gated by `has_role`). Tables for Sites and FOUs with add/edit/delete dialogs.
- Sign-out button in the header.
- PWA / offline: still works — the app shell and the last successful sites/FOUs fetch are cached, so the dialer remains usable offline once you've signed in at least once online.

## Technical details
- Auth: Supabase email/password via the existing Lovable Cloud integration. No Google sign-in unless you ask.
- Roles via separate `user_roles` table + `has_role()` security-definer function (avoids RLS recursion and privilege-escalation).
- Server functions (`createServerFn` + `requireSupabaseAuth`) for admin mutations; reads go through the browser client so realtime/offline caching works.
- One-time admin grant: after you sign up, I'll run `INSERT INTO user_roles (user_id, role) VALUES ('<your-uid>', 'admin')` for you.

## Out of scope (say the word if you want any of these)
- Password reset email flow
- Google / Apple sign-in
- Usage / call logs
- Per-region admins (all admins can edit everything)
