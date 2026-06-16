# PRD — MyFleet customer app (reverse-engineered)

Reconstructed from the codebase on 2026-06-12. Every claim is **observed** (with source) or marked `[inferred]`. Business intent not recoverable from code is listed under Open Questions, not assumed.

## Problem & opportunity

Independent car-rental agencies handle bookings over phone/WhatsApp and paper. MyFleet gives an agency a white-glove digital channel: the customer scans the agency's QR code once, and from then on browses that agency's fleet, books, pays, uploads ID/license documents, and messages the agency from their phone. `[inferred — from the pairing-first navigation model (app/index.tsx routes unpaired users to /scan), the x-agency-id scoping of every API call (src/services/bookingService.ts), and the camera permission copy "scan agency QR codes" (app.json)]`

## Goals & non-goals

- **Goals** `[inferred]`: digitize the booking + payment + KYC flow for a single paired agency; reduce agency back-office friction; keep customers engaged via bookings history, notifications, loyalty tiers, and reviews.
- **Non-goals** `[inferred]`: cross-agency marketplace search at booking time (the app locks to one paired agency; the `agencies.tsx` browse screen appears legacy); driver-side or agency-side features (auth store rejects non-`client` roles with WrongAppError — observed, src/stores/useAuthStore.ts); real-time GPS tracking and in-app calling (both screens are simulated — observed).
- **Open Question (owner):** confirm goals/non-goals — nothing here is from a product source.

## Users & jobs

- **Primary user — rental customer ("client" role)**, French-speaking first (FR is the default locale — observed, src/i18n/index.ts). Jobs: find a car at my agency, book it for dates I choose with options/insurance, pay securely, prove my identity once, know my booking status, reach the agency.
- **Indirect — the rental agency**: receives bookings, messages, reviews; pairs customers via its QR code. Served by a separate agency app (observed: WrongAppError copy "Please use the MyFleet agency app").

## Current scope — shipped capabilities, ranked by centrality

1. **Auth** — email+password login, email OTP login, signup, password reset (observed: app/auth.tsx, app/reset-password.tsx, src/services/authService.ts; Supabase Auth + backend /validate, /signup/client).
2. **Agency pairing via QR** — camera scan of `myfleet://pair/<id>` or raw id; requires a completed profile (ProfileIncompleteError → app/profile-complete.tsx); paired agency persisted and scopes all API calls (observed: app/scan.tsx, src/hooks/usePairing.ts, src/stores/useAgencyStore.ts).
3. **Fleet browsing** — agency home with fleet + reviews tabs, search/filters, vehicle detail with media (observed: app/home.tsx, app/search.tsx, app/vehicle/[id].tsx; GET /fleet/catalog).
4. **Booking** — dates, pickup/return times & locations, options incl. delivery with geo-fee calculation, insurance tier (basic / all_inclusive), notes; statuses pending→confirmed→active→completed/cancelled; deposit lifecycle (held/captured/released/forfeited…); km allowance & overage costs (observed: app/booking/[id].tsx, src/services/bookingService.ts, src/utils/delivery.ts).
5. **Payment** — Stripe Checkout session created by backend, opened in external browser, return via deep link; deposit-aware; amounts in cents (observed: app/payment.tsx, app/payment-return.tsx, createCheckoutSession; saved payment methods listing — app/payment-methods.tsx, GET /client/payment-methods).
6. **KYC** — upload ID front/back + driver's license front/back as images (observed: app/kyc.tsx, app/documents.tsx, src/services/kycService.ts → POST /client/kyc).
7. **Bookings management** — list, detail, post-rental summary with mileage/overage/damage invoices, rental summary PDF export (observed: app/bookings.tsx, app/booking-summary/[id].tsx, app/tracking/[id].tsx with expo-print/expo-sharing).
8. **Messaging** — per-booking thread with the agency (observed: app/messagerie/[id].tsx, src/services/messageService.ts).
9. **Notifications** — in-app list, unread count, mark-all-read (observed: src/services/notificationService.ts; push delivery stubbed — usePushRegistration is a no-op).
10. **Reviews & loyalty** — leave/read agency reviews and ratings; loyalty status & tiers (observed: src/services/reviewService.ts, src/services/loyaltyService.ts → /client/loyalty/status, /client/loyalty/tiers).
11. **Profile & settings** — profile edit/completion, locale FR/EN, theme, static help/contact/terms/privacy/about/feedback screens (observed: app/profile.tsx, app/settings.tsx et al.).
12. **Decorative/simulated**: live tracking map (hardcoded SVG route) and in-app call screen (observed: app/tracking/[id].tsx, app/call/[id].tsx). `[inferred: placeholders for future features]`

## Constraints

- Expo SDK 54 / RN 0.81 / New Architecture; CNG prebuild — native changes only via config plugins (observed).
- Backend contract: NestJS envelope `{success, data}`, Bearer JWT + `x-agency-id` on every scoped call (observed).
- Money in integer cents end-to-end (observed: src/utils/money.ts, commit 1118dca).
- supabase-js pinned to a patched 2.106.1 (observed: patches/).
- Payments must round-trip through an external browser (no native Payment Sheet today) (observed).
- French-first market `[inferred — FR default locale, French copy defaults, Maghreb/France-style pricing context unverified]`.

## Success metrics

**Open Question (owner)** — no analytics SDK is present in the client (observed: no tracking/analytics dependency), so the code reveals no measured KPIs. Candidate metrics `[inferred]`: pairing conversion (scan → paired), booking conversion (vehicle view → paid booking), payment completion rate after Checkout redirect, KYC completion rate, repeat-booking rate per agency.

## Open questions

1. Business goals & non-goals: is single-agency lock-in the strategy, or is multi-agency marketplace browsing (the dormant `agencies.tsx` flow) the roadmap?
2. Success metrics: what are the KPIs, and where are they measured (backend `analytics` module exists — is the client meant to emit events)?
3. Target market/locales: FR-first is observed; which countries/currencies are in scope (money utils assume a single currency context)?
4. Are simulated tracking/call screens to be activated (backend has `tracking` module) or removed?
5. Who owns Stripe production config, and is Apple Pay / native Payment Sheet planned (the stale `.env.example` hints at it)?

## Decision log

- **2026-06-12** — PRD reverse-engineered from codebase; pending product-owner review. All goals/metrics entries are `[inferred]` or open questions until the owner confirms.
- **2026-06-12** — Planned: payment wall / subscription to move to RevenueCat (app-store IAP); the booking-payment Stripe Checkout path is unaffected. Scope (consumer tier here vs agency-side subscription) to confirm — see debt-map "Planned changes".
- **2026-06-12** — **Decided (owner-approved, supersedes above):** no subscription/paywall in this client app; client→agency rentals move to **Stripe Connect** (platform application fee); **RevenueCat dropped**.
