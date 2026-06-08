/**
 * System Prompt Strategy
 * @description Resolves the system prompt to use for a chat session.
 *              Allows library consumers to plug in their own prompts
 *              without hardcoded language defaults.
 *
 * @example
 * ```typescript
 * const customStrategy: SystemPromptStrategy = {
 *   resolve: (config) =>
 *     config.language === "tr"
 *       ? "Sen yardimsever bir asistansin."
 *       : "You are a helpful assistant.",
 * };
 * chatService.setPromptStrategy(customStrategy);
 * ```
 */

import type { ChatConfig } from "../entities";

export interface SystemPromptStrategy {
  /**
   * Resolve the system prompt for the given config.
   * Returning `undefined` omits the system message entirely.
   */
  resolve(config: ChatConfig): string | undefined;
}

/**
 * Default strategy: use the user-supplied `systemPrompt` if present,
 * otherwise return undefined (no system message sent).
 */
export const DEFAULT_PROMPT_STRATEGY: SystemPromptStrategy = {
  resolve: (config) => {
    if (config.systemPrompt && config.systemPrompt.length > 0) {
      return config.systemPrompt;
    }
    return undefined;
  },
};
