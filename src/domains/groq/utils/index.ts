/**
 * Infrastructure Utils Index
 */

export {
  createUserMessage,
  createAssistantMessage,
  createSystemMessage,
  createMessage,
  promptToMessages,
  extractTextFromMessages,
  formatMessagesForDisplay,
} from "./message.util";

export { resolveUserFriendlyMessage, formatErrorForLogging } from "./error-resolver";
export { GroqError } from "./groq-error";
export type { GroqErrorMetadata } from "./groq-error";
export {
  GroqErrorType,
  USER_FRIENDLY_ERROR_MESSAGES,
} from "../constants/error-types";

export { requestDeduplicator, RequestDeduplicator } from "./request-deduplicator.util";
export { requestQueue, RequestQueue } from "./request-queue.util";
export type { QueueOptions } from "./request-queue.util";

export { cacheManager, CacheManager } from "./cache-manager";
export type { CacheOptions, CacheStats } from "./cache-manager";

export { retryManager, RetryManager, withRetry } from "./retry";
export type { RetryOptions } from "./retry";

export {
  debounceManager,
  throttleManager,
  debounce,
  throttle,
} from "./debounce";
export type { DebounceOptions, ThrottleOptions } from "./debounce";
