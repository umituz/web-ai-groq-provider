/**
 * Groq HTTP Client Service
 * @description Handles all HTTP communication with Groq API with performance optimizations
 */

import type { IGroqHttpClient } from "../interfaces";
import type { GroqConfig, GroqChatRequest, GroqChatResponse, GroqChatChunk } from "../entities";
import { GroqError } from "../utils/groq-error.util";
import { GroqErrorType, mapHttpStatusToErrorType, isRetryableError } from "../constants/error.constants";
import { DEFAULT_BASE_URL, TIMEOUTS } from "../constants/groq.constants";
import { requestDeduplicator } from "../utils/request-deduplicator.util";
import { requestQueue } from "../utils/request-queue.util";
import { retryManager } from "../utils/retry.util";

class GroqHttpClientService implements IGroqHttpClient {
  private config: GroqConfig | null = null;
  private initialized = false;
  private pendingAbortControllers = new Set<AbortController>();

  initialize(config: GroqConfig): void {
    const apiKey = config.apiKey?.trim();

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
  }

  /**
   * Cancel all pending requests
   */
  cancelPendingRequests(): void {
    for (const controller of this.pendingAbortControllers) {
      controller.abort();
    }
    this.pendingAbortControllers.clear();
    requestQueue.cancelAll();
    requestDeduplicator.cancelAll();
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
    // Generate deduplication key
    const dedupeKey = requestDeduplicator.generateKey({
      endpoint: "/chat/completions",
      ...request,
    });

    // Execute with deduplication, retry, and queue management
    return requestDeduplicator.execute(dedupeKey, () =>
      retryManager.execute(() =>
        requestQueue.add(
          () => this.request<GroqChatResponse>("/chat/completions", { ...request, stream: false }),
          10 // High priority for user-initiated requests
        )
      )
    );
  }

  async streamChatCompletion(request: GroqChatRequest): Promise<ReadableStream> {
    if (!this.config || !this.initialized) {
      throw new GroqError(
        GroqErrorType.MISSING_CONFIG,
        "Client not initialized. Call initialize() first."
      );
    }

    const url = `${this.config.baseUrl}/chat/completions`;
    const timeout = this.config.timeoutMs || TIMEOUTS.STREAMING;

    let controller: AbortController | null = null;
    let timeoutId: NodeJS.Timeout | null = null;

    try {
      controller = new AbortController();
      timeoutId = setTimeout(() => controller?.abort(), timeout);

      this.pendingAbortControllers.add(controller);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({ ...request, stream: true }),
        signal: controller.signal,
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
    } catch (error) {
      throw this.handleRequestError(error);
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (controller) {
        this.pendingAbortControllers.delete(controller);
      }
    }
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

    let controller: AbortController | null = null;
    let timeoutId: NodeJS.Timeout | null = null;

    try {
      controller = new AbortController();
      timeoutId = setTimeout(() => controller?.abort(), timeout);

      if (signal) {
        signal.addEventListener("abort", () => controller?.abort());
      }

      this.pendingAbortControllers.add(controller);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      return (await response.json()) as T;
    } catch (error) {
      throw this.handleRequestError(error);
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (controller) {
        this.pendingAbortControllers.delete(controller);
      }
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
    this.cancelPendingRequests();
    this.config = null;
    this.initialized = false;
  }
}

export const groqHttpClient = new GroqHttpClientService();
