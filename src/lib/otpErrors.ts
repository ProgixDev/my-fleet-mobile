import type { TFunction } from "i18next";

// Maps a Supabase OTP/verify error into a clear, localized message by
// inspecting its message text. Supabase does not expose a stable machine
// code for these on the client, so we read the human message (the same
// approach the existing email/phone auth helpers already take when they
// detect "Email not confirmed"). We distinguish:
//   - rate-limited: too many requests, user must wait
//   - expired: the code is no longer valid and a new one is needed
//   - invalid: wrong code entered
//   - generic: anything else (network, server, unknown)
//
// `t` is the i18next translate function; `domain` selects the i18n namespace
// ("emailAuth" or "phoneAuth"), both of which expose the same error sub-keys.
export type OtpErrorDomain = "emailAuth" | "phoneAuth";

export function classifyOtpError(
  error: unknown,
  t: TFunction,
  domain: OtpErrorDomain = "emailAuth",
): string {
  const raw = error instanceof Error ? error.message : String(error ?? "");
  const msg = raw.toLowerCase();

  if (
    msg.includes("rate limit") ||
    msg.includes("too many") ||
    msg.includes("for security purposes") ||
    msg.includes("429")
  ) {
    return t(`${domain}.errors.rateLimited`);
  }

  if (msg.includes("expired")) {
    return t(`${domain}.errors.expiredCode`);
  }

  if (
    msg.includes("invalid") ||
    msg.includes("incorrect") ||
    msg.includes("token has expired or is invalid")
  ) {
    return t(`${domain}.errors.invalidCode`);
  }

  return t(`${domain}.errors.verifyFailed`);
}
