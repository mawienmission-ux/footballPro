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

## Project rules
- Public data (clubs, matches, news) is read with the browser client; writes are protected by RLS via `has_role(auth.uid(),'admin')` — why: admin page is client-side, the database is the only real guard.
- League standings are always computed in `src/lib/standings.ts` (starting stats + finished matches), never stored — why: one source of truth, covered by tests.
- The first account that signs up is made admin by a database trigger — why: bootstraps the site owner without a manual step.
