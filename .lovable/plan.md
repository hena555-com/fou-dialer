# Reset the shared passcode and publish

## Outcome
The real shared passcode will unlock both the main site list and upload page on the live app.

## Plan
1. Open a secure secret-entry prompt for the new shared passcode, so it is not placed in source code or exposed to visitors.
2. Replace the saved `SITE_PASSWORD` value while preserving the separate encrypted-session secret.
3. Test the complete flow in a fresh browser session: locked visitor → enter the new passcode → main list opens → upload page opens → refresh stays unlocked.
4. Check the latest build and runtime diagnostics, resolving any gate or redirect error found during testing.
5. Publish the verified version to `https://fou-dialer.lovable.app` and confirm the live unlock flow.

## Technical details
- Keep password comparison server-side and timing-safe.
- Keep the unlocked state in the existing encrypted, HTTP-only session cookie.
- Do not expose the passcode through browser code, URLs, logs, or app metadata.
