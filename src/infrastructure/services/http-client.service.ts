/**
 * Groq HTTP Client Service
 * @description Handles all HTTP communication with Groq API
 */

import type { IGroqHttpClient } from "../../domain/interfaces";
import type { GroqConfig, GroqChatRequest, GroqChatResponse, GroqChatChunk } from "../../domain/entities";
import { GroqError } from "../utils/groq-error.util";
import { GroqErrorType, mapHttpStatusToErrorType } from "../constants/error.constants";
import { DEFAULT_BASE_URL, TIMEOUTS } from "../constants/groq.constants";

const isDevelopment = typeof process !== "undefined" && process.env?.NODE_ENV === "development";

class GroqHttpClientService implements IGroqHttpClient {
  private config: GroqConfig | null = null;
  private initialized = false;

  initialize(config: GroqConfig): void {
    const apiKey = config.apiKey?.trim();

    if (isDevelopment) {
      console.log("[GroqClient] Initializing:", {
        hasApiKey: !!apiKey,
        keyLength: apiKey?.length,
        keyPrefix: apiKey ? `${apiKey.substring(0, 10)}...` : "",
        baseUrl: config.baseUrl || DEFAULT_BASE_URL,
        timeoutMs: config.timeoutMs || TIMEOUTS.DEFAULT,
        textModel: config.textModel,
      });
    }

    if (!apiKey || apiKey.length < 10) {
      throw new GroqError(
        GroqErrorType.INVALID_API_KEY,
        "API key is required and must be at least 10 characters"
      );
    }

    this.config = {
      apiKey,
      baseUrl: config.baseUrl || DEFAULT_BASE_URL,
      timeoutMs: config.timeoutMs || TIMEOUTS.DEFAULT,
      textModel: config.textModel,
    };
    this.initialized = true;

    if (isDevelopment) {
      console.log("[GroqClient] Initialization complete:", {
        initialized: this.initialized,
        baseUrl: this.config.baseUrl,
      });
    }
  }

  isInitialized(): boolean {
    return this.initialized && this.config !== null;
  }

  getApiKey(): string {
    if (!this.config) {
      throw new GroqError(
        GroqErrorType.MISSING_CONFIG,
        "Client not initialized"
      );
    }
    return this.config.apiKey;
  }

  setApiKey(apiKey: string): void {
    if (!this.config) {
      throw new GroqError(
        GroqErrorType.MISSING_CONFIG,
        "Client not initialized. Call initialize() first."
      );
    }
    this.config = { ...this.config, apiKey: apiKey.trim() };
  }

  async postChatCompletion(request: GroqChatRequest): Promise<GroqChatResponse> {
    return this.request<GroqChatResponse>("/chat/completions", {
      ...request,
      stream: false,
    });
  }

  async streamChatCompletion(request: GroqChatRequest): Promise<ReadableStream> {
    if (!this.config || !this.initialized) {
      throw new GroqError(
        GroqErrorType.MISSING_CONFIG,
        "Client not initialized. Call initialize() first."
      );
    }

    const url = `${this.config.baseUrl}/chat/completions`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({ ...request, stream: true }),
    });

    if (!response.ok) {
      throw new GroqError(
        mapHttpStatusToErrorType(response.status),
        `HTTP ${response.status}: ${response.statusText}`,
        undefined,
        { status: response.status, url: response.url }
      );
    }

    if (!response.body) {
      throw new GroqError(
        GroqErrorType.NETWORK_ERROR,
        "Response body is null"
      );
    }

    return response.body;
  }

  private async request<T>(
    endpoint: string,
    body: unknown,
    signal?: AbortSignal
  ): Promise<T> {
    if (!this.config || !this.initialized) {
      throw new GroqError(
        GroqErrorType.MISSING_CONFIG,
        "Client not initialized. Call initialize() first."
      );
    }

    const url = `${this.config.baseUrl}${endpoint}`;
    const timeout = this.config.timeoutMs || TIMEOUTS.DEFAULT;

    if (isDevelopment) {
      console.log("[GroqClient] API Request:", {
        url,
        endpoint,
        method: "POST",
        timeout: `${timeout}ms`,
        hasBody: !!body,
      });
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      if (signal) {
        signal.addEventListener("abort", () => controller.abort());
      }

      const fetchStartTime = Date.now();
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      const fetchDuration = Date.now() - fetchStartTime;
      clearTimeout(timeoutId);

      if (isDevelopment) {
        console.log("[GroqClient] API Response:", {
          status: response.status,
          ok: response.ok,
          fetchDuration: `${fetchDuration}ms`,
        });
      }

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      return (await response.json()) as T;
    } catch (error) {
      throw this.handleRequestError(error);
    }
  }

  private async handleErrorResponse(response: Response): Promise<never> {
    let errorMessage = `HTTP ${response.status}`;
    const errorType = mapHttpStatusToErrorType(response.status);

    try {
      const errorData = (await response.json()) as {
        error?: { message?: string };
      };
      if (errorData.error?.message) {
        errorMessage = errorData.error.message;
      }
    } catch {
      // If parsing fails, use default message
    }

    throw new GroqError(errorType, errorMessage, undefined, {
      status: response.status,
      url: response.url,
    });
  }

  private handleRequestError(error: unknown): GroqError {
    if (error instanceof GroqError) {
      return error;
    }

    if (error instanceof Error) {
      if (error.name === "AbortError") {
        return new GroqError(
          GroqErrorType.ABORT_ERROR,
          "Request was aborted by the client",
          error
        );
      }

      if (error.name === "TypeError" && error.message.includes("network")) {
        return new GroqError(
          GroqErrorType.NETWORK_ERROR,
          "Network error: Unable to connect to Groq API",
          error
        );
      }
    }

    return new GroqError(
      GroqErrorType.UNKNOWN_ERROR,
      error instanceof Error ? error.message : "Unknown error occurred",
      error as Error
    );
  }

  reset(): void {
    this.config = null;
    this.initialized = false;
  }
}

export const groqHttpClient = new GroqHttpClientService();
