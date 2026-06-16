# Code style & conventions

Two sections. **(a)** describes the code as it exists — match it only when editing inside an existing legacy module. **(b)** is mandatory for all new files. Where they conflict, follow (b) in new files.

## (a) Detected conventions (the code today)

- **Files & naming**: route files in `app/` are kebab-case or `[param]` per expo-router; `src` modules are camelCase (`bookingService.ts`, `useBookings.ts`); components PascalCase (`BottomNav.tsx`). Path aliases `@/*`, `@components/*`, `@hooks/*`, `@utils/*`… (tsconfig + metro alias, kept in sync manually).
- **Screens**: one large default-exported function component per route file containing fetching (via hooks), local `useState`, derived `useMemo`, JSX, and a `makeStyles(colors, isDark)` StyleSheet factory at the bottom. 300–1100 lines is normal here.
- **Styling**: mixed — NativeWind `className` for layout-ish things, `StyleSheet` factories driven by `useTheme()` (`src/context/ThemeContext.tsx`) for themed details, plus `expo-linear-gradient` and inline hex constants. The Tailwind palette (`tailwind.config.js`) and the ThemeContext palette overlap.
- **Server state**: TanStack Query hooks in `src/hooks/` over service functions in `src/services/`; query keys are inline arrays; defaults from `src/lib/queryClient.ts`.
- **Client state**: Zustand stores with `persist`+AsyncStorage in `src/stores/`; actions defined inside `create()`.
- **API layer**: `apiRequest<T>` (`src/services/api.ts`) unwraps the `{success,data}` envelope and throws `ApiClientError`; responses are typed by assertion (`as T`), not parsed. One exception: KYC upload uses raw `fetch` + `FormData`.
- **i18n**: `useTranslation()` with `t("key", { defaultValue: "…" })` — French default values inline, keys in `src/i18n/fr.json`/`en.json`.
- **Forms/validation**: zod schemas in `src/lib/validation.ts` for auth only; `flattenZodErrors` for field errors.
- **Money**: integer cents in all data; `centsToUnits`/formatting via `src/utils/money.ts` and `src/utils/format.ts` at render time.
- **Commits**: Conventional Commits (`feat(client): …`, `fix(config): …`) — already the house style.
- **Enforced vs conventional**: `tsc` strict mode and `expo lint` are the only gates, and both are run manually (no CI in this repo, no tests, no Prettier config — formatting is editor-dependent).

## (b) Target conventions for new code

- **Strict TypeScript**: no new `any`, no `@ts-ignore` (use `@ts-expect-error` with a reason). Prefer parsing to asserting.
- **Validate at trust boundaries**: new network responses, deep-link/QR payloads, and AsyncStorage rehydration get a zod schema (extend `src/lib/validation.ts` or co-locate `schema.ts` with the service). Don't add new `as T` casts on external data.
- **Thin screens**: new screens keep JSX + navigation only; data fetching goes in a `src/hooks/` query hook, domain logic in `src/services/` or a pure `src/utils/` function. Don't add new 500-line route files.
- **One styling system per new file**: prefer NativeWind classes with tokens from `tailwind.config.js`; reach for `StyleSheet` only for things Tailwind can't express (animated styles, SVG). Don't introduce a third approach.
- **No new module-level singletons**: shared mutable state goes in a Zustand store or React context, not a module variable.
- **Reuse over recreation**: check `src/components/ui/` (`Button`, `EmptyState`), `src/utils/`, and existing hooks before writing new ones; extract shared primitives instead of one-off styling.
- **`testID` on every new interactive element**: kebab-case, feature-prefixed (`scan-torch-toggle`, `booking-confirm-button`).
- **Tests**: no runner exists yet (debt-map item). When one lands, new logic gets unit tests and bug fixes get a regression test first. Never put test files under `app/` — the router would register them as routes.
- **i18n**: every new user-facing string gets a key in *both* `fr.json` and `en.json`; no hardcoded copy.
- **Money stays in cents** until the render call site.
- **Dependencies**: add via `npx expo install` (SDK-54 compatibility); architectural additions need an ADR. Mind the supabase-js patch (see `AGENTS.md` native code policy).
- **Animations**: respect reduced-motion where the API allows, keep work on the UI thread (Reanimated worklets), never block JS with timers for visual effects in new code.
- **Commits**: Conventional Commits, small and scoped.
