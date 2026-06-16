# Critical user journeys (CUJs)

The journeys that must never break. **Every row is `[inferred — confirm]` until the product owner confirms it** (this list was derived from the navigation graph and screen centrality, not from a product source).

**Rule going forward:** a change touching a CUJ requires running that journey on a simulator/device before claiming done. New user-visible features extend an existing CUJ row or register a new one here.

| ID | Journey | Steps in the user's words | Where it lives in code | Test coverage |
| --- | --- | --- | --- | --- |
| CUJ-1 | Sign up & log in `[inferred — confirm]` | "I create an account (or log in with my password or an emailed code) and land in the app." | `app/index.tsx` → `app/onboarding.tsx` → `app/auth.tsx`; `src/stores/useAuthStore.ts`, `src/services/authService.ts`, `src/lib/validation.ts` | none — untested |
| CUJ-2 | Pair with my agency `[inferred — confirm]` | "I scan my agency's QR code and the app becomes my agency's app." | `app/scan.tsx` (QR parse incl. `myfleet://pair/<id>`), `src/hooks/usePairing.ts`, `src/stores/useAgencyStore.ts`; profile gate → `app/profile-complete.tsx` | none — untested |
| CUJ-3 | Find a car `[inferred — confirm]` | "I browse or search the fleet and open a car to see photos, specs, and price." | `app/home.tsx`, `app/search.tsx`, `app/vehicle/[id].tsx`; `src/hooks/useAgencyFleet.ts` → `GET /fleet/catalog` | none — untested |
| CUJ-4 | Book a car `[inferred — confirm]` | "I pick dates, options (maybe home delivery), insurance, and confirm — the price shown is right." | `app/booking/[id].tsx` (pricing logic inline), `src/services/bookingService.ts` `createBooking`, `src/utils/delivery.ts`, `src/utils/money.ts` | none — untested |
| CUJ-5 | Pay for my booking `[inferred — confirm]` | "I tap pay, finish in the browser (Stripe), and come back to a confirmed booking with my deposit held." | `app/payment.tsx` → `createCheckoutSession` → external browser → `app/payment-return.tsx` (deep link) → `app/confirmation/[id].tsx` | none — untested |
| CUJ-6 | Upload my documents (KYC) `[inferred — confirm]` | "I photograph my ID and license once so the agency can verify me." | `app/kyc.tsx`, `app/documents.tsx`, `src/services/kycService.ts` → `POST /client/kyc` | none — untested |
| CUJ-7 | Follow my bookings `[inferred — confirm]` | "I see my bookings, their status and deposit, and after the rental I get the summary (km, overage, invoices) as a PDF." | `app/bookings.tsx`, `app/booking-summary/[id].tsx`, `app/tracking/[id].tsx` (PDF via expo-print); `src/hooks/useBookings.ts` | none — untested |
| CUJ-8 | Message my agency `[inferred — confirm]` | "I chat with the agency about my booking and see their replies." | `app/messagerie/[id].tsx`, `src/hooks/useMessages.ts`, `src/services/messageService.ts` | none — untested |
| CUJ-9 | Stay informed & give feedback `[inferred — confirm]` | "I see my notifications and unread badge; I can rate and review the agency." | `app/notifications.tsx`, `src/services/notificationService.ts`, `src/services/reviewService.ts`, `src/hooks/useReviews.ts` | none — untested |
| CUJ-10 | Manage my account `[inferred — confirm]` | "I edit my profile, switch language (FR/EN), reset my password, and log out." | `app/profile.tsx`, `app/settings.tsx`, `app/reset-password.tsx`, `src/services/profileService.ts`, `src/i18n/` | none — untested |

## Notes

- CUJ-4 and CUJ-5 are the revenue path; together with CUJ-2 they are the highest-stakes journeys. All money values are cents (`src/utils/money.ts`).
- The tracking screen inside CUJ-7 is decorative (no GPS) — verifying CUJ-7 means booking data + PDF export, not map accuracy.
- There is **no automated coverage of any kind** (see `docs/quality/debt-map.md`); every verification is manual until a test harness lands.
