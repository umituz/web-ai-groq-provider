/**
 * @umituz/web-ai-groq-provider
 * Groq AI text generation provider for React web applications
 *
 * @author umituz
 * @license MIT
 *
 * IMPORTANT: Apps should NOT use this root barrel import.
 * Use subpath imports instead:
 * - @umituz/web-ai-groq-provider/domain
 * - @umituz/web-ai-groq-provider/services
 * - @umituz/web-ai-groq-provider/hooks
 */

// Domain layer
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
} from "./domain/entities";

export type {
  GroqConfig,
  GroqGenerationConfig,
  TextGenerationOptions,
  StreamingCallbacks,
  StructuredGenerationOptions,
} from "./domain/interfaces";

export type { IGroqChatService, IGroqHttpClient } from "./domain/interfaces";

// Infrastructure layer
export {
  GROQ_MODELS,
  DEFAULT_MODELS,
  DEFAULT_GENERATION_CONFIG,
  API_ENDPOINTS,
  DEFAULT_BASE_URL,
  TIMEOUTS,
} from "./infrastructure/constants";

export {
  GroqErrorType,
  mapHttpStatusToErrorType,
  isRetryableError,
  isAuthError,
} from "./infrastructure/constants";

export { groqHttpClient } from "./infrastructure/services";
export { textGenerationService } from "./infrastructure/services";

export {
  createUserMessage,
  createAssistantMessage,
  createSystemMessage,
  createTextMessage,
  promptToMessages,
  extractTextFromMessages,
  formatMessagesForDisplay,
} from "./infrastructure/utils";

export {
  getUserFriendlyError,
  formatErrorForLogging,
} from "./infrastructure/utils";

export { GroqError } from "./infrastructure/utils";

// Presentation layer
export { useGroq } from "./presentation/hooks";
export type { UseGroqOptions, UseGroqReturn } from "./presentation/hooks";
