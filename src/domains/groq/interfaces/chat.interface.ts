/**
 * Chat Service Interfaces
 * @description Contracts for chat functionality
 */

import type {
  ChatMessage,
  ChatConversation,
  SendMessageInput,
  SendMessageResult,
  ChatConfig,
  ChatStorage,
} from "../entities";
import type { GroqMessage } from "./groq.interface";

/**
 * Chat service interface
 */
export interface IChatService {
  /** Send message and get AI response */
  sendMessage(input: SendMessageInput): Promise<SendMessageResult>;
  /** Get conversation history */
  getConversation(conversationId: string): Promise<ChatConversation | null>;
  /** Get all conversations */
  getConversations(): Promise<ChatConversation[]>;
  /** Generate AI response */
  generateAIResponse(conversationId: string, userMessage: string): Promise<ChatMessage>;
}

/**
 * Chat hook options
 */
export interface UseChatOptions {
  /** Conversation identifier */
  readonly conversationId: string;
  /** Storage implementation */
  readonly storage?: ChatStorage;
  /** Chat configuration */
  readonly config?: ChatConfig;
  /** Auto-save messages */
  readonly autoSave?: boolean;
  /** Callback on message sent */
  readonly onMessageSent?: (message: ChatMessage) => void;
  /** Callback on AI response */
  readonly onAIResponse?: (message: ChatMessage) => void;
  /** Callback on error */
  readonly onError?: (error: string) => void;
}

/**
 * Chat hook return value
 */
export interface UseChatReturn {
  /** Messages in conversation */
  readonly messages: ChatMessage[];
  /** Loading state */
  readonly isLoading: boolean;
  /** Error message */
  readonly error: string | null;
  /** Is AI typing */
  readonly isTyping: boolean;
  /** Send message */
  sendMessage: (text: string, type?: ChatMessage["type"]) => Promise<void>;
  /** Regenerate last AI response */
  regenerate: () => Promise<void>;
  /** Clear messages */
  clearMessages: () => void;
  /** Update configuration */
  updateConfig: (config: Partial<ChatConfig>) => void;
}

/**
 * Message formatter for Groq
 */
export interface MessageFormatter {
  /** Format chat messages to Groq format */
  toGroqMessages(messages: ChatMessage[], systemPrompt?: string): GroqMessage[];
  /** Format Groq response to chat message */
  toChatMessage(content: string, sender: ChatMessage["sender"]): ChatMessage;
}
