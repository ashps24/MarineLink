# MarineLink

A role-based marine equipment relationship and service platform connecting
Marine Travelift, its dealers, and their customers in one workspace.

**Phase 1 is frontend only.** Every screen reads from a mock service layer with
deterministic fixtures — there is no backend, database, authentication, or Zoho
integration. The demo role selector swaps which mock user the UI renders for; it
is not a login, and the interface says so wherever it appears.

## Running it

```bash
npm install
npm run dev
```

To exercise the app exactly as Catalyst Slate serves it — exact-match file
serving, no directory indexes, root document for every unmatched path:

```bash
npm run build:slate
npm run serve:slate
```

## Deploying

```bash
npm run deploy:slate
```

The script pins a release id, writes `version.json`, recreates the Slate config
inside the build output, and carries previous builds' static chunks forward so
long-cached documents keep working. See the comments in
[`scripts/deploy-slate.sh`](scripts/deploy-slate.sh) for why each step exists.

## Where the integration seams are

| Concern | Lives in | Replaced by |
| --- | --- | --- |
| Data access | `src/lib/mock-api/` | Zoho-backed service clients |
| Visibility rules | `src/lib/permissions/visibility.ts` | Server-side authorization |
| Current user | `src/hooks/use-current-user.ts` | A real session |
| Management insights | `getDashboardInsights` in `src/lib/mock-api/dashboard.ts` | Model-generated, advisory insights |

The UI depends on the shapes in `src/types/`, never on how a record was
fetched, so swapping the mock layer should not require rewriting screens.
