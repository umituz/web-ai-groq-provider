/**
 * Chat Service Interfaces
 * @description Contracts for chat functionality.
 */

import type {
  ChatMessage,
  ChatConversation,
  SendMessageInput,
  SendMessageResult,
  ChatConfig,
  IChatStorage,
} from "../entities";
import type { GroqMessage } from "../../groq/entities";
import type { SystemPromptStrategy } from "../utils/prompt-strategy";

/**
 * Chat service contract. The high-level service used by `useChat`
 * and any other consumer (e.g., CLI, server, scripts).
 */
export interface IChatService {
  /** Send a single turn and get the user message + AI response back. */
  sendMessage(input: SendMessageInput): Promise<SendMessageResult>;
  /** Get a single conversation summary by id. */
  getConversation(conversationId: string): Promise<ChatConversation | null>;
  /** List conversations. The default implementation returns an empty list. */
  getConversations(): Promise<ChatConversation[]>;
  /** Generate the AI response for a single turn given context. */
  generateAIResponse(
    companionId: string,
    userMessage: string,
    context?: ReadonlyArray<ChatMessage>,
  ): Promise<ChatMessage>;
  /** Generate a streaming AI response, emitting chunks via the callback. */
  generateStreamingResponse(
    userMessage: string,
    context: ReadonlyArray<ChatMessage>,
    onChunk: (chunk: string) => void,
  ): Promise<string>;
}

/**
 * Options for the `useChat` hook.
 *
 * @example
 * ```typescript
 * const opts: UseChatOptions = {
 *   conversationId: "session-1",
 *   stream: true,
 *   storage: myStorageImpl,
 *   config: { systemPrompt: "You are a helpful assistant.", temperature: 0.7 },
 * };
 * ```
 */
export interface UseChatOptions {
  /** Conversation identifier; also used as the storage key. */
  readonly conversationId: string;
  /** Optional storage implementation. When omitted, the hook is in-memory only. */
  readonly storage?: IChatStorage;
  /** Chat configuration (system prompt, temperature, max tokens). */
  readonly config?: ChatConfig;
  /** When true (default), messages are persisted to storage automatically. */
  readonly autoSave?: boolean;
  /** When true, AI responses are streamed. Default: false. */
  readonly stream?: boolean;
  readonly onMessageSent?: (message: ChatMessage) => void;
  readonly onAIResponse?: (message: ChatMessage) => void;
  readonly onError?: (error: string) => void;
}

/**
 * Return value of the `useChat` hook.
 */
export interface UseChatReturn {
  /** Messages in the current conversation. */
  readonly messages: ReadonlyArray<ChatMessage>;
  /** True while a request is in flight (any turn). */
  readonly isLoading: boolean;
  /** True while the assistant is producing a response (including streaming). */
  readonly isTyping: boolean;
  /** Last error message; null when there is no error. */
  readonly error: string | null;
  /** Send a message; resolves with the AI response (or null on cancel/error). */
  sendMessage: (
    text: string,
    type?: ChatMessage["type"],
  ) => Promise<ChatMessage | null>;
  /** Regenerate the most recent assistant response. */
  regenerate: () => Promise<ChatMessage | null>;
  /** Cancel any in-flight request issued by this hook instance. */
  cancel: () => void;
  /** Clear all messages and the error state. */
  clearMessages: () => void;
  /** Clear the error state only. */
  clearError: () => void;
  /** Reset transient state (loading/typing/error). Keeps messages. */
  reset: () => void;
  /** Update the chat configuration. */
  updateConfig: (config: Partial<ChatConfig>) => void;
}

export interface IMessageFormatter {
  toGroqMessages(
    messages: ReadonlyArray<ChatMessage>,
    systemPrompt?: string,
  ): GroqMessage[];
  toChatMessage(content: string, sender: ChatMessage["sender"]): ChatMessage;
}

export type { SystemPromptStrategy };
