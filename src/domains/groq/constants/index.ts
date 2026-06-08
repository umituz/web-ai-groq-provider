/**
 * Groq Constants Index
 */

export {
  GROQ_MODELS,
  DEFAULT_MODELS,
  DEFAULT_GENERATION_CONFIG,
  API_ENDPOINTS,
  DEFAULT_BASE_URL,
  TIMEOUTS,
} from "./groq.constants";

export {
  GroqErrorType,
  USER_FRIENDLY_ERROR_MESSAGES,
} from "./error-types";

export {
  HTTP_HEADERS,
  SSE_PREFIX,
  SSE_DONE_MARKER,
  JSON_CODE_BLOCK_PATTERN,
  JSON_OBJECT_PATTERN,
  CHAT_COMPLETIONS_PATH,
} from "./protocol.constants";

export {
  MESSAGE_ID_PREFIX,
  CHAT_MESSAGE_ID_SUFFIX_LENGTH,
  CACHE_KEY_TYPE_COMPLETION,
  CACHE_KEY_TYPE_CHAT,
  SYSTEM_PROMPT_CACHE_PREFIX,
  USER_ROLE,
  ASSISTANT_ROLE,
  SYSTEM_ROLE,
  QUEUE_PRIORITY_USER_REQUEST,
  DEFAULT_RETRY_MAX_ATTEMPTS,
  DEFAULT_RETRY_INITIAL_DELAY_MS,
  DEFAULT_RETRY_MAX_DELAY_MS,
  DEFAULT_RETRY_BACKOFF_MULTIPLIER,
  DEFAULT_RETRY_JITTER_FACTOR,
} from "./identifier.constants";

// Re-exports of classification helpers, kept for backward-compatible
// import paths. The canonical locations are validators/ and resolvers/.
export {
  classifyHttpStatus,
  DEFAULT_HTTP_STATUS_RULE,
} from "../validators/http-status-classifier";
export {
  isRetryableErrorType as isRetryableError,
  isAuthErrorType as isAuthError,
} from "../validators/error-classifier";
