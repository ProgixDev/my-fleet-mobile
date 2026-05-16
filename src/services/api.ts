const DEFAULT_API_BASE_URL = "http://localhost:4000";

export const BASE_URL = (
  process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_BASE_URL
).replace(/\/+$/, "");

export const AUTH_BASE_URL = (
  process.env.EXPO_PUBLIC_AUTH_BASE_URL ?? `${BASE_URL}/auth`
).replace(/\/+$/, "");

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: Record<string, unknown>;
  message?: string;
}

interface ApiErrorEnvelope {
  success?: false;
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
}

export class ApiClientError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: unknown;

  constructor(params: {
    message: string;
    code?: string;
    status: number;
    details?: unknown;
  }) {
    super(params.message);
    this.name = "ApiClientError";
    this.code = params.code ?? "API_ERROR";
    this.status = params.status;
    this.details = params.details;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

function buildUrl(path: string, baseUrl: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}

async function readBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";
  const raw = await response.text();
  if (!raw) return null;
  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(raw) as unknown;
    } catch {
      return raw;
    }
  }
  return raw;
}

const DEFAULT_TIMEOUT_MS = 15_000;

export async function apiRequest<T>(
  path: string,
  init: RequestInit & { baseUrl?: string; timeoutMs?: number } = {},
): Promise<T> {
  const {
    baseUrl = BASE_URL,
    headers,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    ...rest
  } = init;

  const controller = new AbortController();
  const externalSignal = rest.signal as AbortSignal | undefined;
  if (externalSignal) {
    if (externalSignal.aborted) controller.abort();
    else externalSignal.addEventListener("abort", () => controller.abort());
  }
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(buildUrl(path, baseUrl), {
      ...rest,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(headers ?? {}),
      },
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new ApiClientError({
        status: 0,
        code: "TIMEOUT",
        message: `Request timed out after ${timeoutMs}ms`,
      });
    }
    throw new ApiClientError({
      status: 0,
      code: "NETWORK_ERROR",
      message: err instanceof Error ? err.message : "Network error",
    });
  }
  clearTimeout(timeoutId);

  const body = await readBody(response);
  const errorMessage = `Request failed (${response.status})`;

  if (!isRecord(body)) {
    if (!response.ok) {
      throw new ApiClientError({
        status: response.status,
        code: "HTTP_ERROR",
        message:
          typeof body === "string" && body.length > 0 ? body : errorMessage,
      });
    }
    throw new ApiClientError({
      status: response.status,
      code: "INVALID_RESPONSE",
      message: "Response is not a valid JSON envelope",
      details: body,
    });
  }

  if (body.success === true && "data" in body) {
    return body.data as T;
  }

  const envelope = body as unknown as ApiErrorEnvelope;
  const fallbackMessage = response.ok ? "Request failed" : errorMessage;
  const message =
    envelope.error?.message && envelope.error.message.length > 0
      ? envelope.error.message
      : fallbackMessage;

  throw new ApiClientError({
    status: response.status,
    code:
      envelope.error?.code ?? (response.ok ? "INVALID_ENVELOPE" : "HTTP_ERROR"),
    message,
    details: envelope.error?.details ?? body,
  });
}
