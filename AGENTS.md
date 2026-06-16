# AGENTS.md — operating manual for my-fleet-mobile

## What this repository is

The customer-facing mobile app of **MyFleet**, a car-rental platform: customers pair with a rental agency by scanning its QR code, browse that agency's fleet, book vehicles, pay via Stripe Checkout, upload KYC documents, and message the agency. Stack: **Expo SDK 54** / **React Native 0.81.5** / React 19.1, **expo-router 6** (file-based routes in `app/`), **Zustand** (persisted client state) + **TanStack Query 5** (server state), **NativeWind 4** + raw `StyleSheet` (mixed), **Supabase Auth**, **i18next** (FR default, EN). Backend is the NestJS API in `../backend` (separate repo concern; this app talks to it over HTTP with a Supabase JWT + `x-agency-id` header). Workflow type: **Expo CNG / prebuild** — `/ios` and `/android` are gitignored and generated; never hand-edit them. This is a legacy in-production project now under an AI operating model: **evolution, not migration**. Expo SDK 54 is current-ish but pinned — when consulting Expo docs, use the SDK 54 versioned docs (`docs.expo.dev/versions/v54.0.0/`); APIs differ between SDKs.

## The loop

Every task follows: **Ground** (read the relevant doc from the map below and the neighboring code before writing anything) → **Plan** (for anything beyond a trivial fix, state a short plan first) → **Implement** (small steps, keep the build green) → **Verify** (run the check commands below; for UI changes boot the app on a simulator/device and *look at it* — never claim done without evidence) → **Encode** (if a mistake could repeat, write the fix into a doc, test, or rule in the same PR).

## Commands

From `package.json` (there is no test runner and no `typecheck` script — see debt map):

| Command | Purpose |
| --- | --- |
| `npx expo start` (`npm run start`) | Start the Metro dev server (use a dev build or simulator; Expo Go may lack patched deps behavior) |
| `npm run ios` / `npm run android` | Prebuild (CNG) + build + run on simulator/emulator |
| `npm run web` | Run the web target (used for the password-recovery redirect flow) |
| `npm run lint` | ESLint via `expo lint` (flat config, `eslint-config-expo`) |
| `npx tsc --noEmit` | Typecheck — **not in scripts**; this is the de-facto typecheck gate |

**"Green" = `npx tsc --noEmit` passes + `npm run lint` passes + the app boots.** There are no automated tests yet; UI verification is manual on simulator/device.

⚠️ Package manager is ambiguous: both `bun.lock` and `pnpm-lock.yaml` are committed, `pnpm-workspace.yaml` carries a `patchedDependencies` entry, and `.npmrc` sets `legacy-peer-deps`. Do **not** regenerate lockfiles. *Question for the owner: which package manager is canonical — pnpm (the patch mechanism suggests it) or bun?* `[inferred: pnpm, because the supabase-js patch only applies via pnpm patchedDependencies]`

## Docs map

| Task | Read first |
| --- | --- |
| Any feature or fix | `docs/architecture/overview.md`, `docs/conventions/code-style.md` |
| Anything touching booking, payment, KYC, pairing | `docs/product/critical-user-journeys.md` |
| Understanding what the product does / why | `docs/product/overview.md`, `docs/product/prd.md` |
| Before touching risky areas | `docs/quality/debt-map.md` |
| Architectural decisions | `docs/architecture/decisions/` |

## Architecture as it is

- `app/` — expo-router file routes; **screens are large single files** (300–1100 lines) containing UI + local state + inline `makeStyles(colors)` StyleSheet factories alongside NativeWind classes.
- `src/services/` — plain async functions over `fetch` (`src/services/api.ts` `apiRequest` envelope `{success, data}`), one file per backend domain; auth header from `src/services/authHeader.ts`.
- `src/hooks/` — TanStack Query wrappers around services (`useBookings`, `useAgencyFleet`, …).
- `src/stores/` — Zustand persisted stores: `useAuthStore` (Supabase session → validated user), `useAgencyStore` (the single paired agency; the whole app is scoped to it via the `x-agency-id` header).
- `src/lib/` — `supabase.ts` (client), `validation.ts` (zod form schemas), `queryClient.ts`.
- `src/i18n/` — i18next setup + `fr.json` / `en.json`.
- `template/` — **a Figma Make web export used as design reference only**; excluded from `tsconfig`; never import from it.
- Routing: `app/index.tsx` splash → unauthenticated → `/onboarding`; authenticated but unpaired → `/scan`; paired → `/home`.
- Money is in **cents** end-to-end (`src/utils/money.ts`).

## Rules for new code

- New code follows `docs/conventions/code-style.md` section (b); existing code is left alone unless the task is about it.
- Inventory existing code before adding anything — extend existing services/hooks patterns; reuse, never recreate.
- TypeScript: no new `any`, no new `@ts-ignore` (use `@ts-expect-error` with a reason).
- Validate at the edges: new code parses external input (network responses, deep links, QR payloads, AsyncStorage rehydration) with zod before trusting it.
- New interactive elements get a `testID` (kebab-case, feature-prefixed, e.g. `booking-confirm-button`) — the codebase currently has **zero**; new code starts the habit.
- New logic gets tests once a test runner exists (see debt map); until then, document manual verification in the PR. Never place test files under `app/` — expo-router would treat them as routes.
- New dependencies: `npx expo install <pkg>` for SDK-compat resolution; anything architectural gets an ADR in `docs/architecture/decisions/`.
- Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:` …) — already the repo's style.
- Never weaken a gate (lint rule, tsconfig strictness, future CI) to make work pass; propose gate changes explicitly and separately.
- Boy-scout rule is **opt-in**: only clean adjacent code when explicitly asked.

## Native code policy

This is a **CNG/prebuild** project: `/ios` and `/android` are generated and gitignored — never edit them by hand; change native behavior via `app.json` plugins/config and `npx expo prebuild`. One dependency patch exists: `patches/@supabase__supabase-js@2.106.1.patch` (disables OpenTelemetry dynamic import that breaks Metro bundling), applied via `pnpm-workspace.yaml` `patchedDependencies`. If you bump `@supabase/supabase-js`, the patch must be re-cut or verified obsolete — do not silently drop it.

## Legacy zones — handle with care

- **`app/booking/[id].tsx` (1144 lines) and `app/tracking/[id].tsx` (1016 lines)** — monolithic screens mixing pricing logic, animation worklets, and UI. Touch surgically; don't refactor in passing.
- **Tracking & call screens are simulated** — `tracking/[id].tsx` animates a hardcoded SVG route (no real GPS); `call/[id].tsx` has no real calling backend. Don't "fix" them into real features without a spec.
- **Payment flow** — Stripe Checkout opens in an external browser and returns via the `myfleet://` deep link (`app/payment-return.tsx`). `.env.example` mentions a Payment Sheet / `StripeProvider` that does **not** exist in the code (stale doc). No `@stripe/stripe-react-native` dependency.
- **`src/data/mockData.ts`** — effectively dead (only referenced in comments); kept for historical types. Don't extend it.
- **`usePushRegistration`** — a documented no-op stub; activating it requires `expo-notifications` + `expo-device` installs.
- **eas.json `preview` profile** embeds the Supabase anon key, a Stripe test key, and a raw-IP nip.io API URL; `app.json` carries an ATS exception for `217.65.144.155`. Infra in flux — coordinate before changing.

## When unsure

Stop after two failed attempts at the same fix; ask one concrete question instead of pushing a hack through. If a doc here conflicts with the code, the doc may be stale: flag it and propose the doc fix in the same PR.
