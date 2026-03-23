/**
 * useChat Hook
 * @description Main React hook for chat functionality
 */

import { useState, useCallback, useEffect } from "react";
import type {
  ChatMessage,
  ChatConfig,
} from "../entities";
import type { IChatStorage } from "../entities";
import type {
  UseChatOptions,
  UseChatReturn,
} from "../interfaces";
import { chatService } from "../services/chat.service";

const MESSAGE_ID_PREFIX = "msg-";
const MESSAGE_ID_USER_SUFFIX = "user";

/**
 * Hook for chat functionality with AI integration
 */
export function useChat(options: UseChatOptions): UseChatReturn {
  const {
    conversationId,
    storage,
    config,
    autoSave = true,
    onMessageSent,
    onAIResponse,
    onError,
  } = options;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize chat service config
  useEffect(() => {
    if (config) {
      chatService.initialize(config);
    }
  }, [config]);

  // Load messages from storage on mount
  useEffect(() => {
    if (!storage) return;

    const loadMessages = async () => {
      try {
        const loaded = await storage.getMessages(conversationId);
        setMessages(loaded);
      } catch (err) {
        // Silently fail - errors are handled through onError callback if needed
      }
    };

    void loadMessages();
  }, [conversationId, storage]);

  // Save message to storage
  const saveToStorage = useCallback(
    async (message: ChatMessage) => {
      if (!autoSave || !storage) return;

      try {
        await storage.saveMessage(conversationId, message);
      } catch (err) {
        // Silently fail - errors are handled through onError callback if needed
      }
    },
    [conversationId, storage, autoSave]
  );

  // Send message
  const sendMessage = useCallback(
    async (text: string, type?: ChatMessage["type"]): Promise<void> => {
      if (!text.trim() || isLoading) return;

      setIsLoading(true);
      setError(null);

      try {
        // Create user message first
        const userMessage: ChatMessage = {
          id: `${MESSAGE_ID_PREFIX}${Date.now()}-${MESSAGE_ID_USER_SUFFIX}`,
          sender: "user",
          content: text,
          timestamp: new Date().toISOString(),
          type: type || "text",
        };

        // Add user message immediately
        const messagesWithUser = [...messages, userMessage];
        setMessages(messagesWithUser);
        await saveToStorage(userMessage);
        onMessageSent?.(userMessage);

        // Generate AI response
        setIsTyping(true);
        const aiResponse = await chatService.generateAIResponse(
          conversationId,
          text,
          messages
        );

        // Update messages with AI response
        const newMessages = [...messagesWithUser, aiResponse];
        setMessages(newMessages);

        // Save AI response to storage
        await saveToStorage(aiResponse);
        onAIResponse?.(aiResponse);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to send message";
        setError(errorMessage);
        onError?.(errorMessage);
      } finally {
        setIsLoading(false);
        setIsTyping(false);
      }
    },
    [
      conversationId,
      messages,
      isLoading,
      saveToStorage,
      onMessageSent,
      onAIResponse,
      onError,
    ]
  );

  // Regenerate last AI response
  const regenerate = useCallback(async (): Promise<void> => {
    if (messages.length === 0 || isLoading) return;

    const lastUserMessage = [...messages]
      .reverse()
      .find((m) => m.sender === "user");

    if (!lastUserMessage) return;

    setIsLoading(true);
    setError(null);

    try {
      // Remove last AI message if exists
      const messagesWithoutAI = messages.filter(
        (m, i) => !(i === messages.length - 1 && m.sender === "assistant")
      );

      setMessages(messagesWithoutAI);

      // Generate new response
      setIsTyping(true);
      const aiResponse = await chatService.generateAIResponse(
        conversationId,
        lastUserMessage.content,
        messagesWithoutAI.slice(0, -1)
      );

      // Update messages
      const newMessages = [...messagesWithoutAI, aiResponse];
      setMessages(newMessages);

      // Save to storage
      await saveToStorage(aiResponse);

      onAIResponse?.(aiResponse);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to regenerate";
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  }, [
    conversationId,
    messages,
    isLoading,
    saveToStorage,
    onAIResponse,
    onError,
  ]);

  // Clear all messages
  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  // Update configuration
  const updateConfig = useCallback((newConfig: Partial<ChatConfig>) => {
    chatService.updateConfig(newConfig);
  }, []);

  return {
    messages,
    isLoading,
    error,
    isTyping,
    sendMessage,
    regenerate,
    clearMessages,
    updateConfig,
  };
}
