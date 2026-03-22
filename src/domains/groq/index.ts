/**
 * Groq Domain
 * @description Groq API client and text generation
 * Subpath: @umituz/web-ai-groq-provider/groq
 */

// Entities
export type {
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

export type {
  GroqConfig,
  GroqGenerationConfig,
} from "./entities";

// Interfaces
export type {
  TextGenerationOptions,
  StreamingCallbacks,
  StructuredGenerationOptions,
} from "./interfaces";

export type { IGroqChatService, IGroqHttpClient } from "./interfaces";

// Services
export { textGenerationService, groqHttpClient } from "./services";

// Hooks
export { useGroq } from "./hooks";
export type { UseGroqOptions, UseGroqReturn } from "./hooks";

// Constants
export {
  GROQ_MODELS,
  DEFAULT_MODELS,
  DEFAULT_GENERATION_CONFIG,
  API_ENDPOINTS,
  DEFAULT_BASE_URL,
  TIMEOUTS,
} from "./constants";

export {
  GroqErrorType,
  mapHttpStatusToErrorType,
  isRetryableError,
  isAuthError,
} from "./constants";

// Utils
export {
  createUserMessage,
  createAssistantMessage,
  createSystemMessage,
  createTextMessage,
  promptToMessages,
  extractTextFromMessages,
  formatMessagesForDisplay,
} from "./utils";

export { getUserFriendlyError, formatErrorForLogging } from "./utils";

export { GroqError } from "./utils";
