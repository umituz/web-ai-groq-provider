/**
 * Chat Domain Entities
 * @description Core chat message and conversation types
 */

/**
 * Message sender type
 */
export type ChatMessageSender = "user" | "assistant" | "system";

/**
 * Message content types
 */
export type ChatMessageType = "text" | "image" | "audio" | "sticker";

/**
 * Chat message structure
 */
export interface ChatMessage {
  /** Unique message identifier */
  readonly id: string;
  /** Sender of the message */
  readonly sender: ChatMessageSender;
  /** Message content */
  readonly content: string;
  /** Timestamp in ISO format */
  readonly timestamp: string;
  /** Message type */
  readonly type?: ChatMessageType;
  /** Image URL for image messages */
  readonly imageUrl?: string;
  /** Reaction emoji */
  readonly reaction?: string;
  /** Metadata */
  readonly metadata?: Record<string, unknown>;
}

/**
 * Conversation/session metadata
 */
export interface ChatConversation {
  /** Unique conversation identifier */
  readonly id: string;
  /** Companion/character identifier */
  readonly companionId: string;
  /** Companion name */
  readonly companionName: string;
  /** Last message */
  readonly lastMessage?: ChatMessage;
  /** Message count */
  readonly messageCount: number;
  /** Updated timestamp */
  readonly updatedAt: string;
  /** Is pinned */
  readonly pinned?: boolean;
  /** Is archived */
  readonly archived?: boolean;
}

/**
 * Send message input
 */
export interface SendMessageInput {
  /** Companion identifier */
  readonly companionId: string;
  /** Message text */
  readonly text: string;
  /** Message type */
  readonly type?: ChatMessageType;
  /** Image URL */
  readonly imageUrl?: string;
}

/**
 * Send message result
 */
export interface SendMessageResult {
  /** User message */
  readonly userMessage: ChatMessage;
  /** AI response (if generated) */
  readonly aiResponse?: ChatMessage;
}

/**
 * Chat configuration
 */
export interface ChatConfig {
  /** System prompt for AI personality */
  readonly systemPrompt?: string;
  /** Temperature for randomness */
  readonly temperature?: number;
  /** Maximum tokens */
  readonly maxTokens?: number;
  /** Include timestamp in messages */
  readonly includeTimestamp?: boolean;
  /** Language code (e.g., 'tr', 'en') */
  readonly language?: string;
}

/**
 * Storage interface for persisting messages
 * Implementations should be provided by the application
 */
export interface ChatStorage {
  /** Save message to storage */
  saveMessage(conversationId: string, message: ChatMessage): Promise<void>;
  /** Get messages for conversation */
  getMessages(conversationId: string): Promise<ChatMessage[]>;
  /** Update message */
  updateMessage(messageId: string, updates: Partial<ChatMessage>): Promise<void>;
  /** Delete message */
  deleteMessage(messageId: string): Promise<void>;
}
