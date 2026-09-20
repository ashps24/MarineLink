# MarineLink

One shared workspace for Marine Travelift, the dealers who sell and service its
equipment, and the marinas and boatyards that run it.

**Live:** https://marinelink-eytwfqwr.onslate.com

## The problem

Marine Travelift builds boat hoists and trailers and sells them through regional
dealers, who in turn support end customers. When a machine goes down, the
manufacturer, the dealer, and the yard end up coordinating through separate
emails and phone calls. Nobody shares a record, so the same question gets asked
three times and nobody can say how long anything actually takes.

## What it does

A customer or dealer raises a service request against a specific machine. It
moves through New, Acknowledged, In Progress, Awaiting Parts, Resolved, and
Closed. Every move is recorded with who made it and why, and status changes,
handovers, and comments all land on one timeline that everyone involved can
read.

Three kinds of account see three different slices of the same data:

| Role | Sees |
| --- | --- |
| Internal staff | Every dealer, customer, machine, and request |
| Dealer | Their own customers, the equipment they support, their own requests |
| Customer | Their own equipment and their own request history |

The dashboard is the control tower over all of it: how much work is open and
whether that is rising, how long things take to resolve and whether that is
improving, how much work meets its response target, and which dealers close
work fastest.

## Running it

```bash
npm install
npm run dev
```

To exercise the app the way its host actually serves it, with exact-path file
matching and no directory indexes:

```bash
npm run build:slate
npm run serve:slate
```

## How it is put together

The frontend is a Next.js app exported as static files and served from Catalyst
Slate. There is no server rendering, so everything the screens need is fetched
in the browser.

The backend is a single Catalyst Advanced I/O function in [`functions/api`](functions/api)
that exposes generic REST CRUD over the Catalyst Data Store. Adding a resource
means adding an entry to [`resources.js`](functions/api/resources.js); the route
layer never changes. Six tables back the app: dealers, customers, equipment,
service requests, the event log behind every request's history, and the
app-user profiles that map an account to a role and an organization.

| Concern | Lives in |
| --- | --- |
| Data access | `src/lib/services/` |
| HTTP client | `src/lib/api/client.ts` |
| Role and organization scoping | `src/lib/permissions/visibility.ts` |
| Session and active profile | `src/lib/auth/`, `src/providers/auth-provider.tsx` |
| Service request workflow rules | `src/lib/constants/service-workflow.ts` |

Screens depend on the shapes in `src/types/`, never on how a record was
fetched.

**One caveat worth stating plainly.** Role scoping is applied in the data layer,
but that layer runs in the browser. The API returns all rows to any caller,
because the app is open with no required sign-in and the server therefore has
no identity to check against. Catalyst Authentication is wired up and working,
so closing that gap means requiring sign-in and filtering server-side by the
authenticated user rather than building something new.

## Deploying

```bash
catalyst deploy --only functions   # the API
npm run deploy:slate               # the frontend
```

The deploy script pins a release id, writes `version.json`, recreates the host
config inside the build output, and carries previous builds' static chunks
forward so long-cached documents keep working. The comments in
[`scripts/deploy-slate.sh`](scripts/deploy-slate.sh) explain why each step is
there.

## Note on the data

Every dealer, customer, marina, and contact in this repository is invented. The
equipment models are real Marine Travelift product lines, used to make the
catalogue realistic.
