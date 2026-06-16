# Debt map — known landmines

**Append-only.** Future sessions add dated findings here instead of fixing-by-the-way. Fixes happen through specs/plans, not drive-bys.

## 2026-06-12 — initial audit

### P1 — highest risk

- **Zero automated tests and no CI in this repo, on an app that moves money.** No Jest/Detox/Maestro, no typecheck script, nothing runs on push. The booking price/deposit math in `app/booking/[id].tsx`, the cents convention (`src/utils/money.ts`), and the Stripe Checkout → `payment-return` deep-link round-trip are all regression-prone and completely unguarded. Any change to these must be manually verified on device until a test harness exists. *This is the single biggest risk in the repo.*
- **Package-manager ambiguity + load-bearing dependency patch.** Both `bun.lock` and `pnpm-lock.yaml` are committed; `.npmrc` sets `legacy-peer-deps` (npm-flavored); the critical `@supabase/supabase-js@2.106.1` OTel patch (`patches/`) is wired through `pnpm-workspace.yaml` `patchedDependencies` and only applies under pnpm. Installing with the "wrong" manager silently drops the patch → supabase-js may fail to bundle/run under Metro. Also `package.json` pins `^2.105.1` while the patch targets exactly `2.106.1`. **Question for the owner: which package manager is canonical?** `[inferred: pnpm]`
- **Secrets/infra baked into `eas.json` preview profile**: Supabase anon key, Stripe test publishable key, and a raw-IP nip.io API URL (`https://217.65.144.155.nip.io`) are committed; `app.json` carries an ATS exception for that IP. Anon/publishable keys are designed to be public, but the raw-IP backend and committed env coupling are fragile — server move = client rebuild, and prod env hygiene is unverified (production profile has no env block). `[inferred: prod env lives in EAS secrets — unconfirmed]`

### P2 — fragile zones

- **Monolithic screens**: `app/booking/[id].tsx` (1144 lines, includes pricing/options/insurance/delivery-fee logic), `app/tracking/[id].tsx` (1016), `app/home.tsx` (725), `app/scan.tsx` (763), `app/search.tsx` (685), `app/booking-summary/[id].tsx` (682). High collision surface; touch surgically.
- **Unparsed API responses**: services assert types (`as T`); `listAgencyVehicles` returns `unknown[]` shaped ad hoc per screen. A backend contract drift surfaces as runtime UI weirdness, not a typed error.
- **`adaptServerBooking` fabricates data** (`src/services/bookingService.ts`): hardcodes `startTime: "09:00"`, `endTime: "18:00"`, `pickupMethod: "agency"`, `withChauffeur: false`, empty `agencyName` to satisfy a legacy UI shape. Screens may display wrong times.
- **Simulated features that look real**: `tracking/[id].tsx` animates a hardcoded SVG route (no GPS, backend `tracking` module unused by this client); `call/[id].tsx` has no calling backend. Don't market or "fix" them casually.
- **KYC upload** (`src/services/kycService.ts`) bypasses `apiRequest` (raw fetch, no timeout, ad hoc error handling) and its own comment doubts the `/client/kyc` endpoint's deployment status. `[inferred: endpoint now exists — unconfirmed]`
- **Stale `.env.example`**: documents `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` / merchant id for a `<StripeProvider>` Payment Sheet that does not exist in the code (payment is web Checkout via `Linking`). Misleads new devs.

### P3 — hygiene

- **Push notifications stubbed**: `src/hooks/usePushRegistration.ts` is a documented no-op; backend fanout exists. Activation requires `expo-notifications` + `expo-device`.
- **Dead code**: `src/data/mockData.ts` (no imports remain); `app/agencies.tsx` + `app/agency/[id].tsx` browse-all-agencies flow predates the QR single-agency pairing model — verify reachability before extending. `[inferred]`
- **`template/` Figma web export committed** (~70 files, React-DOM/shadcn) — design reference only, excluded from tsconfig; confusing for newcomers and for codebase searches.
- **Dual styling/theming systems** (NativeWind palette vs `ThemeContext` palette) drift independently.
- **Zero `testID`s** anywhere — E2E tooling has no hooks to grab.
- **No `typecheck`/`test` scripts in `package.json`**; "green" is tribal knowledge (now codified in `AGENTS.md`).
- **tsconfig `paths` and metro `resolver.alias` are maintained in parallel** — adding an alias in one but not the other fails confusingly.

### Questions for the owner (carried from audit)

1. Which package manager is canonical (pnpm vs bun), and can the losing lockfile be removed?
2. Is the `/client/kyc` backend endpoint deployed in production, and is the agencies-browse flow (`app/agencies.tsx`) still a supported path or dead UI?
3. Is real GPS tracking / in-app calling planned (backend has `tracking` module), or are the simulated screens intentional placeholders to keep?

## Planned changes (flagged 2026-06-12 — not yet started)

### Payment wall → RevenueCat
The **paywall / subscription** flow is planned to move to **RevenueCat** (`react-native-purchases` + `react-native-purchases-ui`, app-store IAP). Reference dossier (different app, "Libou" — pattern only): `/Users/achrafarabi/Dev/libou/docs/research/revenuecat-integration.md`. Note it targets Expo SDK 56 / RN 0.85; **this app is SDK 54 / RN 0.81**, so verify SDK-version compatibility via `npx expo install`, and a dev-client rebuild is mandatory (native code — see Native code policy in AGENTS.md).

- **Critical constraint:** RevenueCat does app-store subscriptions only — it **cannot** replace the existing rental **booking payment** (web Stripe Checkout via `Linking` → `myfleet://` deep link, `app/payment-return.tsx`). That booking-payment path stays on a PSP.
- **Open question (scope):** is there a consumer subscription/premium tier in this customer app to gate, or is the "payment wall" really the agency-side SaaS subscription — in which case this app may be unaffected? Confirm before any work here.
- The already-flagged stale Stripe `.env.example` entries become moot if/when RevenueCat lands.

### Update 2026-06-12 — payment architecture decided (owner-approved); supersedes the RevenueCat note above
- This customer app has **no subscription/paywall** — subscriptions/credits are the agency↔platform concern, sold on the agency web admin. **RevenueCat is not used here.**
- Client→agency rental payment moves to **Stripe Connect**: the client pays the agency (a connected account) and the platform takes an application fee. The existing web Stripe Checkout → `myfleet://payment-return` UX pattern stays; only the account model changes underneath.
