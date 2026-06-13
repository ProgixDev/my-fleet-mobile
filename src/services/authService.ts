import { supabase } from "@/lib/supabase";
import { apiRequest, AUTH_BASE_URL } from "@/services/api";

export class EmailNotConfirmedError extends Error {
  constructor(public email: string) {
    super("Email not confirmed");
    this.name = "EmailNotConfirmedError";
  }
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: "admin" | "employee" | "client" | "super-admin";
  agencyId: string | null;
  avatar?: string;
}

export interface ClientSignupResult {
  user: {
    id: string;
    name: string;
    email: string;
    role: "client";
  };
}

export async function signUpClient(payload: {
  name: string;
  email: string;
  phone?: string;
  password: string;
}): Promise<ClientSignupResult> {
  return apiRequest<ClientSignupResult>("/signup/client", {
    baseUrl: AUTH_BASE_URL,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<{ accessToken: string; refreshToken: string }> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session) {
    if (error?.message.includes("Email not confirmed")) {
      throw new EmailNotConfirmedError(email);
    }
    throw new Error(error?.message ?? "Invalid email or password");
  }

  return {
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
  };
}

// Passwordless email-OTP login. Used for accounts created on the
// customer's behalf by an agency (no password set), and as an
// alternative login path. shouldCreateUser:false — we never want this
// surface to silently provision a new account.
export async function requestEmailOtp(email: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false },
  });
  if (error) throw new Error(error.message);
}

export async function verifyEmailOtp(
  email: string,
  token: string,
): Promise<{ accessToken: string; refreshToken: string }> {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });
  if (error || !data.session) {
    throw new Error(error?.message ?? "Invalid or expired code");
  }
  return {
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
  };
}

// Passwordless phone-OTP login via Supabase native phone auth. Prelude is
// wired as Supabase's SMS provider on the backend; from the app's side this is
// a plain Supabase call. Unlike the email path we DO let Supabase create the
// account on first sign-in (default behaviour) — renters self-onboard by phone
// and get the `client` role automatically (no agency required). `phone` must
// be E.164 (e.g. +15144007891).
export async function requestPhoneOtp(phone: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({ phone });
  if (error) throw new Error(error.message);
}

export async function verifyPhoneOtp(
  phone: string,
  token: string,
): Promise<{ accessToken: string; refreshToken: string }> {
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: "sms",
  });
  if (error || !data.session) {
    throw new Error(error?.message ?? "Invalid or expired code");
  }
  return {
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
  };
}

export async function validateSession(accessToken: string): Promise<AuthUser> {
  return apiRequest<AuthUser>("/validate", {
    baseUrl: AUTH_BASE_URL,
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export async function logout(): Promise<void> {
  await supabase.auth.signOut();
}

export async function forgotPassword(email: string): Promise<void> {
  // Tell Supabase to redirect back to our reset-password screen after the
  // user clicks the recovery link. Supabase appends the access/refresh
  // tokens to the URL hash; our screen picks them up to update the password.
  const redirectTo =
    typeof window !== "undefined" && window.location?.origin
      ? `${window.location.origin}/reset-password`
      : "myfleet://reset-password";
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });
  if (error) throw new Error(error.message);
}

export async function resetPasswordWithOtp(
  email: string,
  token: string,
  password: string,
): Promise<void> {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "recovery",
  });

  if (error || !data.session) {
    throw new Error(error?.message ?? "Invalid or expired reset code");
  }

  const { error: updateError } = await supabase.auth.updateUser({ password });
  if (updateError) throw new Error(updateError.message);

  await supabase.auth.signOut();
}
