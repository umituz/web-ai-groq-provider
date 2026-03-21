/**
 * Provider Factory
 * Factory for creating configured Groq provider instances
 */

import { groqHttpClient } from "./client";
import type { ProviderConfig } from "./config";

/**
 * Initialize Groq provider with configuration
 */
export function initializeProvider(config: ProviderConfig): void {
  groqHttpClient.initialize({
    apiKey: config.apiKey,
    baseUrl: config.baseUrl,
    timeoutMs: config.timeoutMs,
    textModel: config.defaultModel,
  });
}

/**
 * Provider factory - creates configured provider instances
 */
export const providerFactory = {
  /**
   * Create a new provider instance
   */
  create(config: ProviderConfig): void {
    initializeProvider(config);
  },

  /**
   * Create provider from environment variables
   */
  fromEnv(): void {
    const apiKey =
      (typeof process !== "undefined" && process.env?.GROQ_API_KEY) ||
      (typeof window !== "undefined" &&
        (window as unknown as Record<string, unknown>).__GROQ_API_KEY__
        ? String(
            (window as unknown as Record<string, unknown>).__GROQ_API_KEY__
          )
        : "");

    if (!apiKey) {
      throw new Error("GROQ_API_KEY environment variable is not set");
    }

    initializeProvider({
      apiKey,
      baseUrl:
        (typeof process !== "undefined" && process.env?.GROQ_BASE_URL) ||
        undefined,
      timeoutMs:
        typeof process !== "undefined" && process.env?.GROQ_TIMEOUT_MS
          ? parseInt(process.env.GROQ_TIMEOUT_MS)
          : undefined,
    });
  },

  /**
   * Reset provider (clear configuration)
   */
  reset(): void {
    groqHttpClient.reset();
  },

  /**
   * Check if provider is initialized
   */
  isInitialized(): boolean {
    return groqHttpClient.isInitialized();
  },
};

/**
 * Convenience function to initialize provider
 */
export function configureProvider(config: ProviderConfig): void {
  providerFactory.create(config);
}

/**
 * Convenience function to reset provider
 */
export function resetProvider(): void {
  providerFactory.reset();
}

// Re-export builders
export { ConfigBuilder, GenerationConfigBuilder } from "./config";
export type { ProviderConfig } from "./config";
