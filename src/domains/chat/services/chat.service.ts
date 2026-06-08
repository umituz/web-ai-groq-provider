/**
 * Chat Service
 * @description Core chat logic. Composes:
 *              - text generation (from groq domain)
 *              - message formatting
 *              - system prompt resolution (via injected strategy)
 *
 *              Does NOT hardcode any language or fallback content.
 *              Errors propagate to the caller; the consumer decides
 *              how to render a user-friendly message.
 */

import type {
  IChatService,
  SystemPromptStrategy,
} from "../interfaces";
import type {
  ChatMessage,
  ChatConfig,
  ChatConversation,
  SendMessageInput,
  SendMessageResult,
  IChatStorage,
  ChatTokenUsage,
} from "../entities";
import type { TextGenerationService } from "../../groq/services";
import { DEFAULT_MODELS } from "../../groq/constants/groq.constants";
import { messageFormatter } from "../utils/message-formatter";
import { DEFAULT_PROMPT_STRATEGY } from "../utils/prompt-strategy";
import { GroqError } from "../../groq/utils/groq-error";
import { GroqErrorType } from "../../groq/constants/error-types";

const DEFAULT_CONFIG: ChatConfig = {
  temperature: 0.8,
  maxTokens: 500,
};

export class ChatService implements IChatService {
  private config: ChatConfig = DEFAULT_CONFIG;
  private promptStrategy: SystemPromptStrategy = DEFAULT_PROMPT_STRATEGY;
  private storage: IChatStorage | null = null;

  constructor(
    private readonly textGeneration: TextGenerationService,
  ) {}

  initialize(config: ChatConfig): void {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  updateConfig(config: Partial<ChatConfig>): void {
    this.config = { ...this.config, ...config };
  }

  setPromptStrategy(strategy: SystemPromptStrategy): void {
    this.promptStrategy = strategy;
  }

  setStorage(storage: IChatStorage): void {
    this.storage = storage;
  }

  async getConversation(conversationId: string): Promise<ChatConversation | null> {
    const storage = this.requireStorage();
    const messages = await storage.getMessages(conversationId);
    if (messages.length === 0) return null;
    const last = messages[messages.length - 1];
    const first = messages[0];
    const companionId = String(first.metadata?.["companionId"] ?? "unknown");
    const companionName = String(first.metadata?.["companionName"] ?? "Unknown");
    return {
      id: conversationId,
      companionId,
      companionName,
      lastMessage: last,
      messageCount: messages.length,
      updatedAt: last.timestamp,
    };
  }

  async getConversations(): Promise<ChatConversation[]> {
    // Single-conversation view; multi-conversation aggregation is the
    // responsibility of the host application's storage implementation.
    // Returning an empty list avoids the false impression that we
    // have a fully featured conversation registry.
    return [];
  }

  async sendMessage(input: SendMessageInput): Promise<SendMessageResult> {
    const userMessage: ChatMessage = {
      ...messageFormatter.toChatMessage(input.text, "user"),
      type: input.type ?? "text",
      ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl } : {}),
    };

    const aiResponse = await this.generateAIResponse(
      input.companionId,
      input.text,
      [],
    );

    return { userMessage, aiResponse };
  }

  async generateAIResponse(
    companionId: string,
    userMessage: string,
    context: ReadonlyArray<ChatMessage> = [],
  ): Promise<ChatMessage> {
    const systemPrompt = this.promptStrategy.resolve(this.config);
    const groqMessages = messageFormatter.toGroqMessages(context, systemPrompt);
    groqMessages.push({ role: "user", content: userMessage });

    const response = await this.textGeneration.generateChatCompletion(
      groqMessages,
      {
        model: DEFAULT_MODELS.TEXT,
        generationConfig: {
          temperature: this.config.temperature,
          maxTokens: this.config.maxTokens,
        },
      },
    );

    return {
      ...messageFormatter.toChatMessage(response, "assistant"),
      metadata: {
        companionId,
        model: DEFAULT_MODELS.TEXT,
      },
    };
  }

  /**
   * Generate a streaming AI response. Emits content chunks via the
   * `onChunk` callback. Resolves once the stream completes.
   *
   * @param userMessage - The latest user message.
   * @param context - The message history to send as context.
   * @param onChunk - Called for each content chunk.
   */
  async generateStreamingResponse(
    userMessage: string,
    context: ReadonlyArray<ChatMessage>,
    onChunk: (chunk: string) => void,
  ): Promise<string> {
    const systemPrompt = this.promptStrategy.resolve(this.config);
    const groqMessages = messageFormatter.toGroqMessages(context, systemPrompt);
    groqMessages.push({ role: "user", content: userMessage });

    return this.textGeneration.streamChatCompletion(
      groqMessages,
      {
        onChunk,
      },
      {
        model: DEFAULT_MODELS.TEXT,
        generationConfig: {
          temperature: this.config.temperature,
          maxTokens: this.config.maxTokens,
        },
      },
    );
  }

  private requireStorage(): IChatStorage {
    if (!this.storage) {
      throw new GroqError(
        GroqErrorType.MISSING_CONFIG,
        "ChatService.getConversation requires setStorage() to be called first.",
      );
    }
    return this.storage;
  }
}

/**
 * Helper to extract a `ChatTokenUsage` from a ChatMessage's metadata,
 * if the model used reported it.
 *
 * @param message - The chat message to inspect.
 * @returns The token usage, or `null` when not present.
 */
export function extractTokenUsage(message: ChatMessage): ChatTokenUsage | null {
  const meta = message.metadata;
  if (!meta) return null;
  const usage = meta["usage"];
  if (!usage || typeof usage !== "object") return null;
  const u = usage as Record<string, unknown>;
  const promptTokens = typeof u["prompt_tokens"] === "number" ? u["prompt_tokens"] : null;
  const completionTokens =
    typeof u["completion_tokens"] === "number" ? u["completion_tokens"] : null;
  const totalTokens = typeof u["total_tokens"] === "number" ? u["total_tokens"] : null;
  if (promptTokens === null || completionTokens === null || totalTokens === null) {
    return null;
  }
  return { promptTokens, completionTokens, totalTokens };
}
