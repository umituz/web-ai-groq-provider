/**
 * Configuration Builders
 * Builder pattern for Groq configuration
 */

import type { GroqGenerationConfig } from "./types";

/**
 * Provider configuration options
 */
export interface ProviderConfig {
  apiKey: string;
  baseUrl?: string;
  timeoutMs?: number;
  defaultModel?: string;
}

/**
 * Config Builder for Provider Configuration
 */
export class ConfigBuilder {
  private config: Partial<ProviderConfig> = {};

  /**
   * Create a new config builder
   */
  static create(): ConfigBuilder {
    return new ConfigBuilder();
  }

  /**
   * Set API key
   */
  withApiKey(apiKey: string): ConfigBuilder {
    this.config.apiKey = apiKey;
    return this;
  }

  /**
   * Set base URL
   */
  withBaseUrl(baseUrl: string): ConfigBuilder {
    this.config.baseUrl = baseUrl;
    return this;
  }

  /**
   * Set timeout
   */
  withTimeout(timeoutMs: number): ConfigBuilder {
    this.config.timeoutMs = timeoutMs;
    return this;
  }

  /**
   * Set default model
   */
  withDefaultModel(model: string): ConfigBuilder {
    this.config.defaultModel = model;
    return this;
  }

  /**
   * Build the configuration
   */
  build(): ProviderConfig {
    if (!this.config.apiKey) {
      throw new Error("API key is required");
    }
    return this.config as ProviderConfig;
  }
}

/**
 * Generation Config Builder
 */
export class GenerationConfigBuilder {
  private config: Partial<GroqGenerationConfig> = {};

  /**
   * Create a new generation config builder
   */
  static create(): GenerationConfigBuilder {
    return new GenerationConfigBuilder();
  }

  /**
   * Set temperature (0.0 - 2.0)
   */
  withTemperature(temperature: number): GenerationConfigBuilder {
    this.config.temperature = Math.max(0, Math.min(2, temperature));
    return this;
  }

  /**
   * Set max tokens
   */
  withMaxTokens(maxTokens: number): GenerationConfigBuilder {
    this.config.maxTokens = Math.max(1, maxTokens);
    return this;
  }

  /**
   * Set top P (0.0 - 1.0)
   */
  withTopP(topP: number): GenerationConfigBuilder {
    this.config.topP = Math.max(0, Math.min(1, topP));
    return this;
  }

  /**
   * Set number of completions
   */
  withN(n: number): GenerationConfigBuilder {
    this.config.n = Math.max(1, n);
    return this;
  }

  /**
   * Set stop sequences
   */
  withStop(stop: string[]): GenerationConfigBuilder {
    this.config.stop = stop;
    return this;
  }

  /**
   * Set frequency penalty (-2.0 to 2.0)
   */
  withFrequencyPenalty(penalty: number): GenerationConfigBuilder {
    this.config.frequencyPenalty = Math.max(-2, Math.min(2, penalty));
    return this;
  }

  /**
   * Set presence penalty (-2.0 to 2.0)
   */
  withPresencePenalty(penalty: number): GenerationConfigBuilder {
    this.config.presencePenalty = Math.max(-2, Math.min(2, penalty));
    return this;
  }

  /**
   * Build the configuration
   */
  build(): GroqGenerationConfig {
    return this.config as GroqGenerationConfig;
  }
}
