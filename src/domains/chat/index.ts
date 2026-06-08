/**
 * Chat Domain
 * @description Chat functionality with AI integration.
 *              Subpath: @umituz/web-ai-groq-provider/chat
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
  IChatStorage,
  ChatTokenUsage,
} from "./entities";

// Interfaces
export type {
  IChatService,
  UseChatOptions,
  UseChatReturn,
  IMessageFormatter,
  SystemPromptStrategy,
} from "./interfaces";

// Services
export { ChatService, messageFormatter, extractTokenUsage } from "./services";

// Hooks
export { useChat } from "./hooks";
export type { UseChatDeps } from "./hooks";

// Utils
export { chatIdGenerator, ChatIdGenerator, DEFAULT_PROMPT_STRATEGY } from "./utils";
