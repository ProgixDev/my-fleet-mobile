# Architecture overview — as it actually is

Last grounded against the code: 2026-06-12.

## Workflow type

Expo SDK 54 **CNG/prebuild** app (`newArchEnabled: true`). `/ios` and `/android` are in `.gitignore` ("generated native folders") — native configuration lives entirely in `app.json` (plugins: `expo-router`, `expo-font`, `expo-video`, `expo-camera` with a QR-scan permission string). Entry point: `"main": "expo-router/entry"`.

## Navigation model

**expo-router 6, file-based, single root `<Stack>`** (`app/_layout.tsx`, `headerShown: false`, fade animation). There are no nested layout files, no route groups, and no native tab navigator — the "tabs" are a hand-rolled `src/components/BottomNav.tsx` rendered per-screen.

Routing gate (`app/index.tsx` splash):

```
not authenticated            → /onboarding → /auth
authenticated, no paired agency → /scan      (QR pairing)
authenticated + paired agency   → /home
```

Routes (all under `app/`): `index` (splash), `onboarding`, `auth`, `reset-password`, `scan`, `home`, `search`, `agencies`, `agency/[id]`, `vehicle/[id]`, `booking/[id]`, `booking-summary/[id]`, `confirmation/[id]`, `payment`, `payment-return`, `payment-methods`, `bookings`, `tracking/[id]`, `messagerie/[id]`, `call/[id]`, `kyc`, `documents`, `profile`, `profile-complete`, `settings`, `notifications`, `feedback`, `help`, `contact`, `about`, `terms`, `privacy`.

Deep links: scheme `myfleet`. Observed handlers: `myfleet://pair/<idOrSlug>` (also `https://<host>/pair/<id>`, parsed in `app/scan.tsx`) and the Stripe Checkout return into `app/payment-return.tsx`.

## State & data flow

Three layers, consistently applied:

1. **Services** (`src/services/*.ts`) — plain async functions over `fetch` via `apiRequest` in `src/services/api.ts`. The backend (NestJS, `../backend`) wraps every response in `{ success, data, meta?, message? }`; `apiRequest` unwraps it, enforces a 15 s timeout, and throws typed `ApiClientError`s. Auth = `Authorization: Bearer <supabase access token>` (`src/services/authHeader.ts`); agency scoping = `x-agency-id` header (`src/services/bookingService.ts`).
2. **Hooks** (`src/hooks/*.ts`) — TanStack Query 5 wrappers (`useAgencyFleet`, `useBookings`, `useMessages`, `useNotifications`, `useLoyalty`, `usePairing`, `useReviews`, `usePaymentMethods`…). Query client defaults: `staleTime` 30 s, `retry` 1, no refetch-on-focus (`src/lib/queryClient.ts`).
3. **Stores** (`src/stores/`) — Zustand with `persist` to AsyncStorage: `useAuthStore` (`my-fleet-client-auth`; Supabase session validated against backend `/validate`, rejects non-`client` roles with `WrongAppError`) and `useAgencyStore` (`my-fleet-client-agency`; the single paired agency — the whole app is single-agency-scoped).

Auth itself is **Supabase Auth** (`src/lib/supabase.ts`: AsyncStorage persistence, `detectSessionInUrl` only on web for the password-recovery redirect). Login paths: email+password, email OTP, signup via backend `/signup/client`.

## Cross-cutting

- **i18n**: i18next + `expo-localization`, FR default / EN fallback choice, locale persisted to AsyncStorage key `my-fleet-mobile.locale` (`src/i18n/`). Much copy is French-first with `defaultValue` inline.
- **Styling**: NativeWind 4 className-based styling *and* per-screen `makeStyles(colors, isDark)` StyleSheet factories, fed by a custom `ThemeContext` (`src/context/ThemeContext.tsx`) — both coexist, often in the same file. Tailwind theme tokens in `tailwind.config.js` (dark purple palette, Poppins fonts).
- **Validation**: zod 4 for auth forms (`src/lib/validation.ts`); most API responses are *not* zod-parsed (typed by assertion).
- **Money**: integer **cents** everywhere; convert at display time with `src/utils/money.ts` (`centsToUnits`).
- **Animations**: Reanimated 4 + `react-native-worklets` plugin (babel).

## Native modules & services

| Integration | Where | Notes |
| --- | --- | --- |
| Supabase Auth | `src/lib/supabase.ts` | Patched dependency — see below |
| expo-camera | `app/scan.tsx` | QR pairing; CAMERA + RECORD_AUDIO Android permissions |
| Stripe Checkout (web) | `app/payment.tsx` → `Linking.openURL`, return via `app/payment-return.tsx` | **No** `@stripe/stripe-react-native`; `.env.example`'s Payment Sheet notes are aspirational/stale |
| expo-print / expo-sharing | `app/tracking/[id].tsx` | Rental summary PDF generation/sharing |
| KYC upload | `src/services/kycService.ts` | Multipart `FormData` to `/client/kyc` (raw `fetch`, bypasses `apiRequest`) |
| Push notifications | `src/hooks/usePushRegistration.ts` | **No-op stub**; backend `/me/push-token` exists, client side not activated |

**Dependency patch**: `patches/@supabase__supabase-js@2.106.1.patch` neuters supabase-js's dynamic `@opentelemetry/api` import (Metro can't resolve it). Applied through `pnpm-workspace.yaml` `patchedDependencies`. Note `package.json` declares `^2.105.1` while the patch targets `2.106.1` — the resolved version must stay 2.106.1 for the patch to apply.

## Build & release path

EAS (`eas.json`, project `cfa4e46d-…`, owner `iheb1`): `development` (dev client, internal), `preview` (internal APK; **env baked in**: nip.io HTTPS API URL over a raw IP, Supabase URL + anon key, Stripe test publishable key), `production` (remote `autoIncrement`, no env block — env presumably from EAS secrets). iOS bundle `com.progix.myfleet-client` build 4; Android package `com.progix.myfleet.client` versionCode 4. `app.json` carries an iOS ATS exception for `217.65.144.155`.

## Known deviations from our target architecture

Recorded factually; these are legacy patterns, not instructions:

- Screens are monoliths: data fetching, business logic (e.g. price/deposit math in `app/booking/[id].tsx`), animation worklets, and styles live in one 300–1100-line file; no screen/feature decomposition.
- Dual styling systems (NativeWind classes + StyleSheet factories + a custom ThemeContext that duplicates the Tailwind palette).
- API responses are cast, not parsed — `listAgencyVehicles` returns `unknown[]` and screens shape it ad hoc; zod is used only on auth forms.
- `adaptServerBooking` in `bookingService.ts` fabricates fields the server doesn't send (times "09:00"/"18:00", `pickupMethod: "agency"`) to satisfy a legacy UI shape.
- No tests, no CI in this repo, no `testID`s, no typecheck script.
- `template/` is a committed Figma Make **web** export (shadcn-style components) kept as design reference; excluded from `tsconfig`, not part of the app.
- Hand-rolled `BottomNav` instead of a router tab layout.
- Tracking map and in-app call are simulated UI, not live services.
