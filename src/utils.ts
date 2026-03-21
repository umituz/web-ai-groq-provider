/**
 * Utility functions for error handling and content mapping
 */

import { GroqError, GroqErrorType } from "./types";
import type { GroqMessage } from "./types";

/**
 * Get user-friendly error message
 */
export function getUserFriendlyError(error: unknown): string {
  if (error instanceof GroqError) {
    switch (error.type) {
      case GroqErrorType.INVALID_API_KEY:
        return "Invalid API key. Please check your Groq API key.";
      case GroqErrorType.MISSING_CONFIG:
        return "Groq provider not initialized. Please call configureProvider() first.";
      case GroqErrorType.NETWORK_ERROR:
        return "Network error. Please check your internet connection.";
      case GroqErrorType.ABORT_ERROR:
        return "Request was cancelled.";
      case GroqErrorType.RATE_LIMIT_ERROR:
        return "Rate limit exceeded. Please try again later.";
      case GroqErrorType.SERVER_ERROR:
        return "Groq API server error. Please try again later.";
      default:
        return error.message || "An unknown error occurred.";
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unknown error occurred.";
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof GroqError) {
    return (
      error.type === GroqErrorType.NETWORK_ERROR ||
      error.type === GroqErrorType.SERVER_ERROR ||
      error.type === GroqErrorType.RATE_LIMIT_ERROR
    );
  }
  return false;
}

/**
 * Check if error is auth-related
 */
export function isAuthError(error: unknown): boolean {
  if (error instanceof GroqError) {
    return error.type === GroqErrorType.INVALID_API_KEY;
  }
  return false;
}

/**
 * Format error for logging
 */
export function formatErrorForLogging(error: unknown): string {
  if (error instanceof GroqError) {
    return JSON.stringify({
      type: error.type,
      message: error.message,
      metadata: error.metadata,
    });
  }

  if (error instanceof Error) {
    return JSON.stringify({
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
  }

  return String(error);
}

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
 * Create a text message (defaults to user role)
 */
export function createTextMessage(
  content: string,
  role: GroqMessage["role"] = "user"
): GroqMessage {
  return { role, content };
}

/**
 * Convert a prompt to messages array
 */
export function promptToMessages(prompt: string): GroqMessage[] {
  return [createUserMessage(prompt)];
}

/**
 * Extract text content from messages
 */
export function extractTextFromMessages(messages: GroqMessage[]): string {
  return messages.map((m) => `[${m.role}]: ${m.content}`).join("\n");
}

/**
 * Format messages for display
 */
export function formatMessagesForDisplay(messages: GroqMessage[]): string {
  return messages
    .map(
      (m) =>
        `${m.role.charAt(0).toUpperCase() + m.role.slice(1)}: ${m.content}`
    )
    .join("\n\n");
}
