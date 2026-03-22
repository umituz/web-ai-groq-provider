/**
 * Message Utilities
 * @description Helper functions for creating and working with messages
 */

import type { GroqMessage, GroqMessageRole } from "../../domain/entities";

/**
 * Create a user message
 */
export function createUserMessage(content: string): GroqMessage {
  return { role: "user", content };
}

/**
 * Create an assistant message
 */
export function createAssistantMessage(content: string): GroqMessage {
  return { role: "assistant", content };
}

/**
 * Create a system message
 */
export function createSystemMessage(content: string): GroqMessage {
  return { role: "system", content };
}

/**
 * Create a text message with specified role
 */
export function createTextMessage(role: GroqMessageRole, content: string): GroqMessage {
  return { role, content };
}

/**
 * Convert a simple prompt to message array
 */
export function promptToMessages(prompt: string): GroqMessage[] {
  return [{ role: "user", content: prompt }];
}

/**
 * Extract text content from messages
 */
export function extractTextFromMessages(messages: GroqMessage[]): string {
  return messages.map(m => m.content).join("\n\n");
}

/**
 * Format messages for display
 */
export function formatMessagesForDisplay(messages: GroqMessage[]): string {
  return messages
    .map(m => `[${m.role.toUpperCase()}]: ${m.content}`)
    .join("\n\n---\n\n");
}
