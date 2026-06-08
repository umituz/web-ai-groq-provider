/**
 * Protocol Constants
 * @description Network and protocol-level constants
 */

export const HTTP_HEADERS = {
  CONTENT_TYPE: "Content-Type",
  AUTHORIZATION: "Authorization",
  APPLICATION_JSON: "application/json",
  BEARER_PREFIX: "Bearer ",
} as const;

export const SSE_PREFIX = "data: " as const;
export const SSE_DONE_MARKER = "[DONE]" as const;

export const JSON_CODE_BLOCK_PATTERN = /```json\n([\s\S]*?)\n```/;
export const JSON_OBJECT_PATTERN = /\{[\s\S]*\}/;

export const CHAT_COMPLETIONS_PATH = "/chat/completions" as const;
