/**
 * Groq Service Interfaces
 * @description Contracts for Groq AI services
 */

import type {
  GroqMessage,
  GroqChatResponse,
  GroqChatChunk,
  GroqChatRequest,
  GroqConfig,
  GroqGenerationConfig,
} from "../entities";

/**
 * Text generation options
 */
export interface TextGenerationOptions {
  /** Model to use */
  readonly model?: string;
  /** Generation configuration */
  readonly generationConfig?: GroqGenerationConfig;
}

/**
 * Streaming callbacks
 */
export interface StreamingCallbacks {
  /** Called for each chunk */
  readonly onChunk?: (chunk: string) => void;
  /** Called on completion */
  readonly onComplete?: (fullText: string) => void;
  /** Called on error */
  readonly onError?: (error: Error) => void;
}

/**
 * Structured text generation options
 */
export interface StructuredGenerationOptions<T = unknown> {
  /** Model to use */
  readonly model?: string;
  /** Generation configuration */
  readonly generationConfig?: GroqGenerationConfig;
  /** JSON schema for validation */
  readonly schema?: Record<string, unknown>;
}

/**
 * Chat completion service interface
 */
export interface IGroqChatService {
  /** Generate completion from prompt */
  generateCompletion(prompt: string, options?: TextGenerationOptions): Promise<string>;
  /** Generate completion from messages */
  generateChatCompletion(messages: GroqMessage[], options?: TextGenerationOptions): Promise<string>;
  /** Generate structured JSON output */
  generateStructured<T>(prompt: string, options?: StructuredGenerationOptions<T>): Promise<T>;
  /** Stream completion */
  streamCompletion(
    prompt: string,
    callbacks: StreamingCallbacks,
    options?: TextGenerationOptions
  ): AsyncGenerator<void, void, unknown>;
}

/**
 * HTTP client interface
 */
export interface IGroqHttpClient {
  /** Send chat completion request */
  postChatCompletion(request: GroqChatRequest): Promise<GroqChatResponse>;
  /** Send streaming request */
  streamChatCompletion(request: GroqChatRequest): Promise<ReadableStream>;
  /** Get API key */
  getApiKey(): string;
  /** Set API key */
  setApiKey(apiKey: string): void;
}
