/**
 * Response Error Message Extractor
 * @description Extracts the user-facing error message from a Groq
 *              error response body. Returns a sensible fallback
 *              when the body is missing or not JSON.
 *
 * @example
 * ```typescript
 * const msg = await extractErrorMessageFromResponse(response);
 * // "Rate limit exceeded" or "HTTP 429: Too Many Requests"
 * ```
 */

import { GroqErrorType } from "../constants/error-types";

export interface GroqErrorBody {
  readonly error?: { readonly message?: string };
}

export function extractErrorMessageFromJsonBody(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const candidate = body as GroqErrorBody;
  const message = candidate.error?.message;
  if (typeof message === "string" && message.length > 0) return message;
  return null;
}

export function buildHttpStatusFallback(status: number, statusText: string): string {
  const trimmedStatusText = statusText.trim();
  if (trimmedStatusText.length > 0) {
    return `HTTP ${status}: ${trimmedStatusText}`;
  }
  return `HTTP ${status}`;
}

export async function extractErrorMessageFromResponse(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as unknown;
    const fromBody = extractErrorMessageFromJsonBody(body);
    if (fromBody) return fromBody;
  } catch {
    // Body wasn't JSON; fall through.
  }
  return buildHttpStatusFallback(response.status, response.statusText);
}

/**
 * Lightweight helper for logging: returns a stable string for any
 * error type without throwing.
 */
export function describeGroqErrorType(type: GroqErrorType): string {
  return `GroqError[${type}]`;
}
