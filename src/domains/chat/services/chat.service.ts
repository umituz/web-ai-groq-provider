/**
 * Chat Service
 * @description Core chat logic with AI integration and performance optimizations
 */

import type {
  IChatService,
  IMessageFormatter,
} from "../interfaces";
import type {
  ChatMessage,
  ChatConversation,
  SendMessageInput,
  SendMessageResult,
  ChatConfig,
} from "../entities";
import { textGenerationService } from "../../groq/services";
import { messageFormatter } from "../utils/message-formatter";
import { DEFAULT_MODELS } from "../../groq/constants";
import { cacheManager } from "../../groq/utils/cache-manager.util";

const DEFAULT_CONFIG: ChatConfig = {
  temperature: 0.8,
  maxTokens: 500,
  includeTimestamp: true,
  language: "tr",
};

class ChatService implements IChatService {
  private config: ChatConfig = DEFAULT_CONFIG;
  private systemPromptCache = new Map<string, string>();
  private readonly PROMPT_CACHE_KEY_PREFIX = "system-prompt";
  private readonly RESPONSE_CACHE_TTL = 300000; // 5 minutes

  initialize(config: ChatConfig): void {
    this.config = { ...DEFAULT_CONFIG, ...config };
    // Clear system prompt cache when config changes
    this.clearSystemPromptCache();
  }

  updateConfig(config: Partial<ChatConfig>): void {
    this.config = { ...this.config, ...config };
    // Clear system prompt cache when config changes
    this.clearSystemPromptCache();
  }

  async sendMessage(input: SendMessageInput): Promise<SendMessageResult> {
    // Create user message with all properties
    const userMessage: ChatMessage = {
      ...messageFormatter.toChatMessage(input.text, "user"),
      type: input.type || "text",
      ...(input.imageUrl && { imageUrl: input.imageUrl }),
    };

    // Generate AI response
    const aiResponse = await this.generateAIResponse(
      input.companionId,
      input.text,
      []
    );

    return {
      userMessage,
      aiResponse,
    };
  }

  async getConversation(conversationId: string): Promise<ChatConversation | null> {
    // This would fetch from storage
    // For now, return null - storage is handled by application
    return null;
  }

  async getConversations(): Promise<ChatConversation[]> {
    // This would fetch from storage
    return [];
  }

  async generateAIResponse(
    companionId: string,
    userMessage: string,
    context: ChatMessage[] = []
  ): Promise<ChatMessage> {
    try {
      // Build system prompt from config (with caching)
      const systemPrompt = this.buildSystemPrompt();

      // Format messages for Groq
      const groqMessages = messageFormatter.toGroqMessages(
        context,
        systemPrompt
      );

      // Add current user message
      groqMessages.push({
        role: "user",
        content: userMessage,
      });

      // Check cache for response
      const cacheKey = cacheManager.generateKey({
        companionId,
        userMessage,
        context: context.map(m => ({ sender: m.sender, content: m.content })),
        config: {
          temperature: this.config.temperature,
          maxTokens: this.config.maxTokens,
        },
      });

      const cachedResponse = cacheManager.get<string>(cacheKey);
      const response = cachedResponse ||
        await textGenerationService.generateChatCompletion(
          groqMessages,
          {
            model: DEFAULT_MODELS.TEXT,
            generationConfig: {
              temperature: this.config.temperature,
              maxTokens: this.config.maxTokens,
            },
          }
        );

      // Cache the response if it wasn't cached
      if (!cachedResponse) {
        cacheManager.set(cacheKey, response);
      }

      // Format response as chat message
      const aiMessage: ChatMessage = {
        ...messageFormatter.toChatMessage(response, "assistant"),
        metadata: {
          companionId,
          model: DEFAULT_MODELS.TEXT,
          cached: !!cachedResponse,
        },
      };

      return aiMessage;
    } catch (error) {
      // Fallback response on error
      return messageFormatter.toChatMessage(
        "Şimdi biraz meşgulüm, ama seni duyuyorum! 💫",
        "assistant"
      );
    }
  }

  private buildSystemPrompt(): string {
    const language = this.config.language || "tr";
    const customPrompt = this.config.systemPrompt;

    // Generate cache key
    const cacheKey = `${this.PROMPT_CACHE_KEY_PREFIX}-${language}-${customPrompt?.length || 0}`;

    // Check cache
    if (this.systemPromptCache.has(cacheKey)) {
      return this.systemPromptCache.get(cacheKey)!;
    }

    // Build prompt
    const basePrompt = customPrompt || this.getDefaultPrompt(language);

    // Cache it
    this.systemPromptCache.set(cacheKey, basePrompt);

    return basePrompt;
  }

  private clearSystemPromptCache(): void {
    this.systemPromptCache.clear();
  }

  /**
   * Clear all cached data (system prompts and response cache)
   */
  clearCache(): void {
    this.clearSystemPromptCache();
    // Note: Response cache is managed by textGenerationService
    // Export cache clearing function from there if needed
  }

  private getDefaultPrompt(language: string): string {
    if (language === "tr") {
      return `Sen samimi, eğlenceli ve ilgi çekici bir AI companionsın. Türkçe konuşuyorsun.
Kullanıcıyla doğal, rahat ve arkadaşça bir sohbet tarzı benimseyerek iletişim kur.
Yavaş yazma stilini kullan ama abartma. Emoji kullanabilirsin ama çok da abartma.
Kısa ve öz cevaplar ver.`;
    }

    return `You are a friendly, engaging AI companion. Be natural, casual, and warm.
Keep responses concise and conversational. Use emojis sparingly.`;
  }
}

export const chatService = new ChatService();
export { messageFormatter };
