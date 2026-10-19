<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Directory access uses server functions that verify the encrypted shared-passcode session before privileged database work; direct anonymous and authenticated Data API access is denied to prevent bypassing the page gate.
- Do not persist directory contacts in browser storage; retain rows in memory only to avoid stale sensitive data surviving the gate.
