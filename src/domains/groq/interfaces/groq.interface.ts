/**
 * Groq Service Interfaces
 * @description Contracts for Groq AI services
 */

import type {
  GroqMessage,
  GroqChatResponse,
  GroqChatRequest,
  GroqGenerationConfig,
} from "../entities";

/**
 * Options for a single text or chat generation call.
 */
export interface TextGenerationOptions {
  /** Override the default model for this call. */
  readonly model?: string;
  /** Sampling/limits configuration. */
  readonly generationConfig?: GroqGenerationConfig;
}

/**
 * Callbacks for streaming responses.
 * - `onChunk` is called for each content fragment.
 * - `onComplete` is called once the full text is available.
 * - `onError` is called when the stream fails (the same error is also thrown).
 */
export interface StreamingCallbacks {
  readonly onChunk?: (chunk: string) => void;
  readonly onComplete?: (fullText: string) => void;
  readonly onError?: (error: Error) => void;
}

/**
 * Options for structured (JSON) generation.
 * Pass a JSON Schema in `schema` to constrain the model's output.
 */
export interface StructuredGenerationOptions {
  readonly model?: string;
  readonly generationConfig?: GroqGenerationConfig;
  readonly schema?: Record<string, unknown>;
}

/**
 * Contract for the high-level chat service.
 */
export interface IGroqChatService {
  /** Generate a completion from a single prompt string. */
  generateCompletion(
    prompt: string,
    options?: TextGenerationOptions,
  ): Promise<string>;

  /** Generate a completion from a message history. */
  generateChatCompletion(
    messages: ReadonlyArray<GroqMessage>,
    options?: TextGenerationOptions,
  ): Promise<string>;

  /** Generate and parse a JSON output matching the optional schema. */
  generateStructured<T>(
    prompt: string,
    options?: StructuredGenerationOptions,
  ): Promise<T>;

  /** Stream a completion from a single prompt. Returns the full text. */
  streamCompletion(
    prompt: string,
    callbacks: StreamingCallbacks,
    options?: TextGenerationOptions,
  ): Promise<string>;

  /** Stream a chat completion from a message history. Returns full text. */
  streamChatCompletion(
    messages: ReadonlyArray<GroqMessage>,
    callbacks: StreamingCallbacks,
    options?: TextGenerationOptions,
  ): Promise<string>;

  /** Clear the in-memory response cache. */
  clearCache(): void;
}

/**
 * Contract for the low-level HTTP client.
 * The strategy pipeline (retry / queue / dedupe) is wired around
 * `postChatCompletion`; the streaming endpoint intentionally bypasses it
 * because responses cannot be deduplicated.
 */
export interface IGroqHttpClient {
  postChatCompletion(request: GroqChatRequest): Promise<GroqChatResponse>;
  streamChatCompletion(request: GroqChatRequest): Promise<ReadableStream<Uint8Array>>;
  getApiKey(): string;
  setApiKey(apiKey: string): void;
  initialize(config: Readonly<{ apiKey: string; baseUrl?: string; timeoutMs?: number; textModel?: string }>): void;
  isInitialized(): boolean;
  cancelPendingRequests(): void;
  reset(): void;
}
