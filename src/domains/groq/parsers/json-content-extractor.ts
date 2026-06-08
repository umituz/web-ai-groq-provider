/**
 * JSON Content Extractor
 * @description Pure functions for extracting a JSON payload from
 *              model output that may wrap it in a markdown code fence.
 *
 * @example
 * ```typescript
 * extractJsonCandidate('```json\n{"a":1}\n```'); // '{"a":1}'
 * extractJsonCandidate('prefix {"a":1} suffix');   // '{"a":1}'
 * extractJsonCandidate('no json here');           // 'no json here'
 * ```
 */

import { JSON_CODE_BLOCK_PATTERN, JSON_OBJECT_PATTERN } from "../constants/protocol.constants";

export function extractJsonFromCodeFence(content: string): string | null {
  const match = content.match(JSON_CODE_BLOCK_PATTERN);
  if (match && match[1]) return match[1];
  return null;
}

export function extractJsonObject(content: string): string | null {
  const match = content.match(JSON_OBJECT_PATTERN);
  if (match && match[0]) return match[0];
  return null;
}

export function extractJsonCandidate(content: string): string {
  return (
    extractJsonFromCodeFence(content) ??
    extractJsonObject(content) ??
    content
  );
}
