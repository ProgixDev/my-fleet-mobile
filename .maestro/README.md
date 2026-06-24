# Maestro E2E flows — client (renter) app

UI smoke/E2E flows for the renter app, run with [Maestro](https://maestro.mobile.dev).

## Prerequisites

- Maestro CLI (`curl -Ls "https://get.maestro.mobile.dev" | bash`)
- An iOS Simulator **booted**
- The app **installed** on it. It's a **debug build**, so Metro must be running:

  ```bash
  npm run ios            # first time: builds, installs, starts Metro
  # or, if already installed:
  npx expo start         # then launch the app on the sim
  ```

## Run

```bash
npm run test:e2e         # runs the passing smoke suite (tag: smoke)
maestro test .maestro/smoke.yaml
```

## Flows

| File | Tag | Status |
| --- | --- | --- |
| `smoke.yaml` | `smoke` | ✅ Authenticated home renders + bottom tabs navigate |

## Known limitation — pairing is camera-only

A renter onboards by **scanning an agency QR code** with the camera, which
Maestro cannot drive. So the smoke assumes a session already exists on the
simulator and launches **without** `clearState` to preserve it. On a fresh
device the app starts at onboarding → `/auth` (phone login) instead.

To make the renter journey (browse → book → pay) fully automatable, add a
**dev/test entry** that pairs to a fixture agency without the camera (e.g. a
deep link `myfleet://pair?agency=<id>` gated to dev builds), then flows can
log in deterministically. The phone-OTP step also needs a test bypass or a
fixed OTP in non-prod.

## Selector notes (shared with the agency app)

This app runs the React Native New Architecture (Fabric): `testID` does **not**
surface as an iOS accessibilityIdentifier, so target visible **text**
(bilingual FR/EN regexes). Modal screens render in a separate iOS window
Maestro can't read — drive those by coordinates or avoid them in flows.
