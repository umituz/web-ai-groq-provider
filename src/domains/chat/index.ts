/**
 * Chat Domain
 * @description Chat functionality with AI integration
 * Subpath: @umituz/web-ai-groq-provider/chat
 */

// Entities
export type {
  ChatMessageSender,
  ChatMessageType,
  ChatMessage,
  ChatConversation,
  SendMessageInput,
  SendMessageResult,
  ChatConfig,
} from "./entities";

export type { IChatStorage } from "./entities";

// Interfaces
export type {
  IChatService,
  UseChatOptions,
  UseChatReturn,
  IMessageFormatter,
} from "./interfaces";

// Services
export { chatService, messageFormatter } from "./services";

// Hooks
export { useChat } from "./hooks";
