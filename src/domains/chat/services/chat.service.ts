/**
 * Chat Service
 * @description Core chat logic with AI integration
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

const DEFAULT_CONFIG: ChatConfig = {
  temperature: 0.8,
  maxTokens: 500,
  includeTimestamp: true,
  language: "tr",
};

class ChatService implements IChatService {
  private config: ChatConfig = DEFAULT_CONFIG;

  initialize(config: ChatConfig): void {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  updateConfig(config: Partial<ChatConfig>): void {
    this.config = { ...this.config, ...config };
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
      // Build system prompt from config
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

      // Generate response
      const response = await textGenerationService.generateChatCompletion(
        groqMessages,
        {
          model: "llama-3.3-70b-versatile",
          generationConfig: {
            temperature: this.config.temperature,
            maxTokens: this.config.maxTokens,
          },
        }
      );

      // Format response as chat message
      const aiMessage: ChatMessage = {
        ...messageFormatter.toChatMessage(response, "assistant"),
        metadata: {
          companionId,
          model: "llama-3.3-70b-versatile",
        },
      };

      return aiMessage;
    } catch (error) {
      console.error("[ChatService] Error generating AI response:", error);

      // Fallback response
      return messageFormatter.toChatMessage(
        "Şimdi biraz meşgulüm, ama seni duyuyorum! 💫",
        "assistant"
      );
    }
  }

  private buildSystemPrompt(): string {
    const language = this.config.language || "tr";
    const basePrompt = this.config.systemPrompt || this.getDefaultPrompt(language);

    return basePrompt;
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
