# Product overview — what this app is today

Written for a new teammate, from the code as of 2026-06-12.

**MyFleet (customer app)** is the renter-facing half of a car-rental platform. A customer signs up, scans their rental agency's QR code once, and from then on the app *is* that agency: its fleet, its prices, its chat, its reviews. The agency runs a separate app; this one hard-rejects agency accounts at login.

## The main flow, screen by screen

1. **Splash → Onboarding → Auth** (`app/index.tsx`, `onboarding.tsx`, `auth.tsx`). Animated logo splash decides where you land: onboarding carousel for new users, QR scan if you're logged in but unpaired, home if paired. Auth supports email+password, email OTP codes, signup (name/email/phone/password, zod-validated), and password reset (the reset link round-trips through the web build, `reset-password.tsx`).
2. **Pair with your agency** (`scan.tsx`). Full-screen camera with torch toggle scans `myfleet://pair/<id>` QR codes. Pairing requires a completed profile — if not, you're routed to `profile-complete.tsx` first. The paired agency is persisted; every API call afterwards carries its `x-agency-id`.
3. **Home** (`home.tsx`). The paired agency's storefront: hero image from the fleet, agency identity/contact, tabs for **Vehicles** and **Reviews** (live average rating), share button, and the hand-rolled bottom nav.
4. **Find a car** (`search.tsx`, `vehicle/[id].tsx`). Search and filter the agency fleet from `/fleet/catalog`; vehicle detail shows photos/video, specs, and pricing (all money in cents, formatted at render).
5. **Book it** (`booking/[id].tsx` — the biggest screen in the app). Pick dates and pickup/return times & locations, toggle options (including home delivery with a distance-based fee computed in `src/utils/delivery.ts`), choose an insurance tier (basic / all-inclusive), add notes, see the priced summary, and create the booking (`POST /client/bookings`).
6. **Pay** (`payment.tsx` → `payment-return.tsx`). The backend creates a Stripe Checkout session; the app opens it in the external browser; Stripe redirects back into the app via the `myfleet://` deep link, and the booking/deposit status refreshes. Saved cards are listed in `payment-methods.tsx`. Confirmation lives in `confirmation/[id].tsx`.
7. **Prove who you are** (`kyc.tsx`, `documents.tsx`). Photograph/upload ID front/back and driver's license front/back; multipart upload to `/client/kyc`, stored by the backend in Supabase storage.
8. **Live with your booking** (`bookings.tsx`, `booking-summary/[id].tsx`, `tracking/[id].tsx`). Bookings list and detail with status, deposit state (held/captured/released/forfeited), included km, overage costs, and rental/damages invoices; the tracking screen renders an animated (decorative — not GPS) route map and can export a rental summary PDF via expo-print/expo-sharing.
9. **Talk to the agency** (`messagerie/[id].tsx`, `call/[id].tsx`). Per-booking chat thread against `/client/bookings/:id/messages`. The call screen is simulated UI — there is no real telephony.
10. **Everything else**: in-app notifications with unread badge (`notifications.tsx`), agency reviews you can write (`useReviews`), loyalty status and tiers (`/client/loyalty/*`), profile editing (`profile.tsx`), settings with FR/EN locale (FR default) and theme (`settings.tsx`), plus static help/contact/feedback/terms/privacy/about pages.

## Services & integrations that power it

- **Supabase Auth** — sessions, OTP, password recovery (patched supabase-js 2.106.1).
- **MyFleet NestJS backend** (`../backend`, `EXPO_PUBLIC_API_URL`) — everything else: catalog, bookings, payments, KYC, messages, notifications, loyalty, reviews, profile. Responses use a `{success, data}` envelope; the client authenticates with the Supabase JWT.
- **Stripe Checkout** (web redirect) — booking payments and deposit holds.
- **expo-camera** (QR pairing), **expo-print/expo-sharing** (PDF summaries), **expo-video/expo-image** (vehicle media), **Reanimated 4** (animations).
- **Not yet live**: OS push notifications (client hook is a stub; backend fanout exists), real GPS tracking, real calls.

## Where it's headed

The dormant pieces — `agencies.tsx` multi-agency browsing, the push stub, the simulated tracking/call screens, the backend `tracking`/`analytics` modules — sketch a roadmap, but none of it is confirmed. See the open questions in [prd.md](prd.md).
