/**
 * Chat Domain Entities
 * @description Core chat message and conversation types.
 *              All fields are readonly: consumers must not mutate
 *              messages that are in-flight or persisted.
 */

export type ChatMessageSender = "user" | "assistant" | "system";

export type ChatMessageType = "text" | "image" | "audio" | "sticker";

/**
 * Chat message structure.
 * Use the `metadata` field for provider-specific or app-specific data
 * (e.g., model name, token usage, reactions, or any other extension).
 */
export interface ChatMessage {
  readonly id: string;
  readonly sender: ChatMessageSender;
  readonly content: string;
  readonly timestamp: string;
  readonly type?: ChatMessageType;
  readonly imageUrl?: string;
  readonly reaction?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

/**
 * Conversation metadata, derived from the message history of a conversation.
 */
export interface ChatConversation {
  readonly id: string;
  readonly companionId: string;
  readonly companionName: string;
  readonly lastMessage?: ChatMessage;
  readonly messageCount: number;
  readonly updatedAt: string;
}

/**
 * Input for a single chat turn.
 * The companionId is the addressable identifier for the chat partner
 * (e.g., a character, agent, or session).
 */
export interface SendMessageInput {
  readonly companionId: string;
  readonly text: string;
  readonly type?: ChatMessageType;
  readonly imageUrl?: string;
}

/**
 * Result of a single chat turn: the user message that was sent
 * and the assistant's reply (if generation succeeded).
 */
export interface SendMessageResult {
  readonly userMessage: ChatMessage;
  readonly aiResponse?: ChatMessage;
}

/**
 * Chat configuration.
 *
 * @example
 * ```typescript
 * const config: ChatConfig = {
 *   systemPrompt: "You are a helpful assistant.",
 *   temperature: 0.7,
 *   maxTokens: 800,
 * };
 * ```
 */
export interface ChatConfig {
  /** System prompt prepended to the conversation. */
  readonly systemPrompt?: string;
  /** Sampling temperature (0.0 - 2.0). */
  readonly temperature?: number;
  /** Maximum number of tokens to generate per response. */
  readonly maxTokens?: number;
}

/**
 * Storage contract for persisting chat messages.
 * The host application provides an implementation; the library never
 * persists on its own.
 */
export interface IChatStorage {
  saveMessage(conversationId: string, message: ChatMessage): Promise<void>;
  getMessages(conversationId: string): Promise<ChatMessage[]>;
  updateMessage(messageId: string, updates: Partial<ChatMessage>): Promise<void>;
  deleteMessage(messageId: string): Promise<void>;
}

/**
 * Token usage information returned by the model, normalized to the chat layer.
 */
export interface ChatTokenUsage {
  readonly promptTokens: number;
  readonly completionTokens: number;
  readonly totalTokens: number;
}
