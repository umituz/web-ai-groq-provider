/**
 * Groq Domain Entities
 * @description Core type definitions for Groq AI provider
 */

/**
 * Configuration for Groq client initialization
 */
export interface GroqConfig {
  /** API key for authentication */
  readonly apiKey: string;
  /** Base URL for API requests (default: https://api.groq.com/openai/v1) */
  readonly baseUrl?: string;
  /** Default timeout in milliseconds */
  readonly timeoutMs?: number;
  /** Default model to use for text generation */
  readonly textModel?: string;
}

/**
 * Generation configuration for AI requests
 */
export interface GroqGenerationConfig {
  /** Controls randomness (0.0 - 2.0, default: 0.7) */
  readonly temperature?: number;
  /** Maximum number of tokens to generate */
  readonly maxTokens?: number;
  /** Nucleus sampling threshold (0.0 - 1.0) */
  readonly topP?: number;
  /** Number of completions to generate */
  readonly n?: number;
  /** Stop sequences */
  readonly stop?: string[];
  /** Frequency penalty (-2.0 to 2.0) */
  readonly frequencyPenalty?: number;
  /** Presence penalty (-2.0 to 2.0) */
  readonly presencePenalty?: number;
}

/**
 * Message role in chat conversation
 */
export type GroqMessageRole = "system" | "user" | "assistant";

/**
 * Chat message structure
 */
export interface GroqMessage {
  /** Role of the message sender */
  readonly role: GroqMessageRole;
  /** Content of the message */
  readonly content: string;
}

/**
 * Chat completion request
 */
export interface GroqChatRequest {
  /** Model to use for generation */
  readonly model: string;
  /** Array of messages in the conversation */
  readonly messages: GroqMessage[];
  /** Generation configuration */
  readonly temperature?: number;
  readonly max_tokens?: number;
  readonly top_p?: number;
  readonly n?: number;
  readonly stop?: string[];
  readonly frequency_penalty?: number;
  readonly presence_penalty?: number;
  /** Enable streaming response */
  readonly stream?: boolean;
}

/**
 * Individual completion choice
 */
export interface GroqChoice {
  /** Index of the choice */
  readonly index: number;
  /** Generated message */
  readonly message: {
    readonly role: "assistant";
    readonly content: string;
  };
  /** Reason for finish (stop, length, etc.) */
  readonly finish_reason: GroqFinishReason;
  /** Logprobs (optional) */
  readonly logprobs: null | object;
}

/**
 * Finish reason types
 */
export type GroqFinishReason = "stop" | "length" | "content_filter";

/**
 * Token usage information
 */
export interface GroqUsage {
  /** Number of tokens in the prompt */
  readonly prompt_tokens: number;
  /** Number of tokens in the completion */
  readonly completion_tokens: number;
  /** Total number of tokens used */
  readonly total_tokens: number;
  /** Prompt time (Groq specific) */
  readonly prompt_time?: number;
  /** Completion time (Groq specific) */
  readonly completion_time?: number;
  /** Total time (Groq specific) */
  readonly total_time?: number;
}

/**
 * Chat completion response
 */
export interface GroqChatResponse {
  /** Unique identifier for the response */
  readonly id: string;
  /** Object type (chat.completion) */
  readonly object: string;
  /** Timestamp of creation */
  readonly created: number;
  /** Model used for generation */
  readonly model: string;
  /** Array of completion choices */
  readonly choices: GroqChoice[];
  /** Token usage information */
  readonly usage: GroqUsage;
  /** System fingerprint (Groq specific) */
  readonly system_fingerprint?: string;
  /** X Groq (Groq specific) */
  readonly x_groq?: {
    readonly id?: string;
  };
}

/**
 * Individual chunk choice for streaming
 */
export interface GroqChunkChoice {
  /** Index of the choice */
  readonly index: number;
  /** Delta message (partial content) */
  readonly delta: {
    readonly role?: "assistant";
    readonly content?: string;
  };
  /** Reason for finish (null if not finished) */
  readonly finish_reason: GroqFinishReason | null;
  /** Logprobs (optional) */
  readonly logprobs: null | object;
}

/**
 * Streaming chunk response
 */
export interface GroqChatChunk {
  /** Unique identifier for the response */
  readonly id: string;
  /** Object type (chat.completion.chunk) */
  readonly object: string;
  /** Timestamp of creation */
  readonly created: number;
  /** Model used for generation */
  readonly model: string;
  /** Array of completion choices */
  readonly choices: GroqChunkChoice[];
  /** System fingerprint (Groq specific) */
  readonly system_fingerprint?: string;
  /** X Groq (Groq specific) */
  readonly x_groq?: {
    readonly id?: string;
  };
}

/**
 * API error response
 */
export interface GroqErrorResponse {
  /** Error type */
  readonly error: {
    /** Error message */
    readonly message: string;
    /** Error type */
    readonly type: string;
    /** Error code */
    readonly code?: string;
  };
}

/**
 * Input types for mutations
 */
export type GroqMessageCreateInput = Omit<GroqMessage, 'content'> & { content: string };
