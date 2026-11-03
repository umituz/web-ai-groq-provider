/**
 * Groq Domain
 * @description Groq API client, text generation, and supporting infrastructure.
 *              Subpath: @umituz/web-ai-groq-provider/groq
 */

// Entities
export type {
  GroqConfig,
  GroqGenerationConfig,
  GroqReasoningEffort,
  GroqMessageRole,
  GroqMessage,
  GroqChatRequest,
  GroqChoice,
  GroqFinishReason,
  GroqUsage,
  GroqChatResponse,
  GroqChunkChoice,
  GroqChatChunk,
  GroqErrorResponse,
} from "./entities";

// Interfaces
export type {
  TextGenerationOptions,
  StreamingCallbacks,
  StructuredGenerationOptions,
  IGroqChatService,
  IGroqHttpClient,
} from "./interfaces";

// Services
export { TextGenerationService, GroqHttpClient, GroqHttpTransport, GroqConfigStore } from "./services";
export { SSE_BRIDGE_EVENTS, createSseResponse, requestStructuredJson } from "./services";
export type { GroqHttpClientDeps, SseResponseOptions, StructuredJsonRequest } from "./services";

// Hooks
export { useGroq, useCacheStats } from "./hooks";
export type { UseGroqOptions, UseGroqReturn, UseGroqDeps, UseCacheStatsOptions } from "./hooks";

// Constants
export {
  GROQ_MODELS,
  DEFAULT_MODELS,
  DEFAULT_GENERATION_CONFIG,
  API_ENDPOINTS,
  DEFAULT_BASE_URL,
  TIMEOUTS,
  GroqErrorType,
  USER_FRIENDLY_ERROR_MESSAGES,
} from "./constants";

// Builders
export { GroqChatRequestBuilder, StructuredPromptBuilder } from "./builders";

// Parsers
export { StreamingResponseParser, JsonResponseParser } from "./parsers";
export type { StreamingParserCallbacks } from "./parsers";

// Strategies
export {
  RetryExecutor,
  QueueExecutor,
  DedupeExecutor,
  CompositeExecutor,
} from "./strategies";
export type { IRequestExecutor, DedupeExecutorOptions } from "./strategies";

// Utils
export {
  createUserMessage,
  createAssistantMessage,
  createSystemMessage,
  createMessage,
  promptToMessages,
  extractTextFromMessages,
  formatMessagesForDisplay,
  resolveUserFriendlyMessage,
  formatErrorForLogging,
  GroqError,
  requestDeduplicator,
  RequestDeduplicator,
  requestQueue,
  RequestQueue,
  cacheManager,
  CacheManager,
  retryManager,
  RetryManager,
  withRetry,
  debounceManager,
  throttleManager,
  debounce,
  throttle,
  asRecord,
  asStringArray,
  asObjectArray,
  asTrimmedOptionalString,
  clampScore,
  oneOfCatalog,
} from "./utils";
export type { GroqErrorMetadata, CacheOptions, CacheStats, QueueOptions, RetryOptions, DebounceOptions, ThrottleOptions } from "./utils";
