import type { GroqChatRequest, GroqChatResponse } from "../entities";
import { GroqError, GroqErrorMetadata } from "../utils/groq-error";
import { GroqErrorType } from "../constants/error-types";
import { TIMEOUTS } from "../constants/groq.constants";
import { classifyHttpStatus } from "../validators/http-status-classifier";
import {
  extractErrorMessageFromResponse,
} from "../extractors/response-error-message-extractor";
import { HTTP_HEADERS, CHAT_COMPLETIONS_PATH } from "../constants/protocol.constants";
import type { GroqConfigStore } from "./groq-config-store";
import type { StreamRequestOptions } from "../interfaces";

export class GroqHttpTransport {
  private readonly pendingAbortControllers = new Set<AbortController>();

  constructor(private readonly configStore: GroqConfigStore) {}

  cancelPendingRequests(): void {
    for (const controller of this.pendingAbortControllers) {
      controller.abort();
    }
    this.pendingAbortControllers.clear();
  }

  async postChatCompletion(request: GroqChatRequest): Promise<GroqChatResponse> {
    return this.request<GroqChatResponse>(CHAT_COMPLETIONS_PATH, {
      ...request,
      stream: false,
    });
  }

  async streamChatCompletion(
    request: GroqChatRequest,
    options: StreamRequestOptions = {},
  ): Promise<ReadableStream<Uint8Array>> {
    const config = this.configStore.get();
    const url = `${config.baseUrl}${CHAT_COMPLETIONS_PATH}`;
    const timeout = config.timeoutMs ?? TIMEOUTS.STREAMING;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    const onExternalAbort = (): void => controller.abort();
    options.signal?.addEventListener("abort", onExternalAbort);
    this.pendingAbortControllers.add(controller);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: this.buildHeaders(config.apiKey),
        body: JSON.stringify({ ...request, stream: true }),
        signal: controller.signal,
      });

      if (!response.ok) await this.throwFromErrorResponse(response);

      if (!response.body) {
        throw new GroqError(GroqErrorType.NETWORK_ERROR, "Response body is null");
      }

      return response.body;
    } catch (error) {
      options.signal?.removeEventListener("abort", onExternalAbort);
      throw this.normalizeError(error);
    } finally {
      clearTimeout(timeoutId);
      this.pendingAbortControllers.delete(controller);
    }
  }

  private async request<T>(endpoint: string, body: unknown): Promise<T> {
    const config = this.configStore.get();
    const url = `${config.baseUrl}${endpoint}`;
    const timeout = config.timeoutMs ?? TIMEOUTS.DEFAULT;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    this.pendingAbortControllers.add(controller);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: this.buildHeaders(config.apiKey),
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) await this.throwFromErrorResponse(response);

      return (await response.json()) as T;
    } catch (error) {
      throw this.normalizeError(error);
    } finally {
      clearTimeout(timeoutId);
      this.pendingAbortControllers.delete(controller);
    }
  }

  private buildHeaders(apiKey: string): HeadersInit {
    return {
      [HTTP_HEADERS.CONTENT_TYPE]: HTTP_HEADERS.APPLICATION_JSON,
      [HTTP_HEADERS.AUTHORIZATION]: `${HTTP_HEADERS.BEARER_PREFIX}${apiKey}`,
    };
  }

  private async throwFromErrorResponse(response: Response): Promise<never> {
    const errorMessage = await extractErrorMessageFromResponse(response);
    const metadata: GroqErrorMetadata = {
      status: response.status,
      url: response.url,
    };
    throw new GroqError(
      classifyHttpStatus(response.status),
      errorMessage,
      undefined,
      metadata,
    );
  }

  private normalizeError(error: unknown): GroqError {
    if (error instanceof GroqError) return error;

    if (error instanceof Error) {
      if (error.name === "AbortError") {
        return new GroqError(
          GroqErrorType.ABORT_ERROR,
          "Request was aborted by the client",
          error,
        );
      }
      if (error.name === "TypeError" && error.message.toLowerCase().includes("network")) {
        return new GroqError(
          GroqErrorType.NETWORK_ERROR,
          "Network error: Unable to connect to Groq API",
          error,
        );
      }
    }

    return new GroqError(
      GroqErrorType.UNKNOWN_ERROR,
      error instanceof Error ? error.message : "Unknown error occurred",
      error instanceof Error ? error : undefined,
    );
  }
}
