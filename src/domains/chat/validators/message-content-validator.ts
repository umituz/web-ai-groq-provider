/**
 * Message Content Validator
 * @description Pure function: validates a chat message's text content.
 *              Used by the chat hook to guard against sending empty
 *              or whitespace-only messages to the model.
 *
 * @example
 * ```typescript
 * isMeaningfulMessageContent("hi");      // true
 * isMeaningfulMessageContent("   ");     // false
 * isMeaningfulMessageContent("");        // false
 * isMeaningfulMessageContent("\n\t");    // false
 * ```
 */

export interface MessageContentValidationRule {
  /** Minimum length after trimming. */
  readonly minLength: number;
}

export const DEFAULT_MESSAGE_CONTENT_RULE: MessageContentValidationRule = {
  minLength: 1,
};

export function isMeaningfulMessageContent(
  text: string | undefined | null,
  rule: MessageContentValidationRule = DEFAULT_MESSAGE_CONTENT_RULE,
): boolean {
  if (!text) return false;
  return text.trim().length >= rule.minLength;
}

export function trimMessageContent(text: string): string {
  return text.trim();
}
