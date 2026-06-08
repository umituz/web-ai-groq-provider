/**
 * Groq Config Store
 * @description Single source of truth for the active GroqConfig.
 *              Delegates key validation → validators/api-key-validator.
 */

import type { GroqConfig } from "../entities";
import { GroqError } from "../utils/groq-error";
import { GroqErrorType } from "../constants/error-types";
import { DEFAULT_BASE_URL, TIMEOUTS } from "../constants/groq.constants";
import { validateApiKey } from "../validators/api-key-validator";

export class GroqConfigStore {
  private config: GroqConfig | null = null;

  /**
   * Validate and persist the given config. Cancels any prior state
   * by overwriting (callers that need atomicity should use `reset()` first).
   *
   * @throws GroqError with type `INVALID_API_KEY` if validation fails.
   */
  initialize(config: GroqConfig): GroqConfig {
    const validation = validateApiKey(config.apiKey);
    if (!validation.valid) {
      throw new GroqError(GroqErrorType.INVALID_API_KEY, validation.reason ?? "Invalid API key");
    }

    const normalized: GroqConfig = {
      apiKey: config.apiKey.trim(),
      baseUrl: config.baseUrl ?? DEFAULT_BASE_URL,
      timeoutMs: config.timeoutMs ?? TIMEOUTS.DEFAULT,
      ...(config.textModel !== undefined ? { textModel: config.textModel } : {}),
    };

    this.config = normalized;
    return normalized;
  }

  /**
   * Returns the active config or throws if not initialized.
   *
   * @throws GroqError with type `MISSING_CONFIG` when not initialized.
   */
  get(): GroqConfig {
    if (!this.config) {
      throw new GroqError(
        GroqErrorType.MISSING_CONFIG,
        "Client not initialized. Call configureProvider first.",
      );
    }
    return this.config;
  }

  getOrNull(): GroqConfig | null {
    return this.config;
  }

  isInitialized(): boolean {
    return this.config !== null;
  }

  /**
   * Replace the API key.
   *
   * @throws GroqError with type `MISSING_CONFIG` if not initialized,
   *         or `INVALID_API_KEY` if the new key fails validation.
   */
  setApiKey(apiKey: string): void {
    const current = this.get();
    const validation = validateApiKey(apiKey);
    if (!validation.valid) {
      throw new GroqError(GroqErrorType.INVALID_API_KEY, validation.reason ?? "Invalid API key");
    }
    this.config = { ...current, apiKey: apiKey.trim() };
  }

  reset(): void {
    this.config = null;
  }
}
