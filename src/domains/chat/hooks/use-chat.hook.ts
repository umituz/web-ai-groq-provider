/**
 * useChat Hook
 * @description Main React hook for chat functionality with performance optimizations
 */

import { useState, useCallback, useEffect, useRef } from "react";
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
 * Hook for chat functionality with AI integration and performance optimizations
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

  // Refs for deduplication and callback tracking
  const pendingMessageRef = useRef<string | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Initialize chat service config
  useEffect(() => {
    if (config) {
      chatService.initialize(config);
    }
  }, [config]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      pendingMessageRef.current = null;
    };
  }, []);

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

  // Save message to storage (stable reference)
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

  // Batch save messages to storage
  const saveMessagesToStorage = useCallback(
    async (messagesToSave: ChatMessage[]) => {
      if (!autoSave || !storage || messagesToSave.length === 0) return;

      try {
        // Try batch save if supported
        if ('saveMessages' in storage) {
          await (storage as any).saveMessages(conversationId, messagesToSave);
        } else {
          // Fallback to individual saves in parallel
          await Promise.all(
            messagesToSave.map(msg => storage.saveMessage(conversationId, msg))
          );
        }
      } catch (err) {
        // Silently fail
      }
    },
    [conversationId, storage, autoSave]
  );

  // Send message with deduplication and functional updates
  const sendMessage = useCallback(
    async (text: string, type?: ChatMessage["type"]): Promise<void> => {
      if (!text.trim() || isLoading) return;

      // Prevent duplicate messages
      if (pendingMessageRef.current === text) {
        return;
      }

      pendingMessageRef.current = text;
      setIsLoading(true);
      setError(null);

      // Get latest callbacks from ref
      const currentOptions = optionsRef.current;

      try {
        // Create user message
        const userMessage: ChatMessage = {
          id: `${MESSAGE_ID_PREFIX}${Date.now()}-${MESSAGE_ID_USER_SUFFIX}`,
          sender: "user",
          content: text,
          timestamp: new Date().toISOString(),
          type: type || "text",
        };

        // Use functional update to avoid stale closure
        setMessages(prev => {
          const updated = [...prev, userMessage];
          saveToStorage(userMessage);
          currentOptions.onMessageSent?.(userMessage);
          return updated;
        });

        // Generate AI response
        setIsTyping(true);

        // Get current messages for context
        const contextForAI = messages; // Use closure messages, not functional update

        const aiResponse = await chatService.generateAIResponse(
          conversationId,
          text,
          contextForAI
        );

        // Use functional update for AI response
        setMessages(prev => {
          const updated = [...prev, aiResponse];
          saveToStorage(aiResponse);
          currentOptions.onAIResponse?.(aiResponse);
          return updated;
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to send message";
        setError(errorMessage);
        currentOptions.onError?.(errorMessage);
      } finally {
        setIsLoading(false);
        setIsTyping(false);
        pendingMessageRef.current = null;
      }
    },
    [conversationId, isLoading, saveToStorage, messages]
  );

  // Regenerate last AI response with functional updates
  const regenerate = useCallback(async (): Promise<void> => {
    // Use functional update to get latest messages
    setMessages(currentMessages => {
      if (currentMessages.length === 0 || isLoading) {
        return currentMessages;
      }

      const lastUserMessage = [...currentMessages]
        .reverse()
        .find((m) => m.sender === "user");

      if (!lastUserMessage) return currentMessages;

      // Async operation - need to handle differently
      setIsLoading(true);
      setError(null);

      const currentOptions = optionsRef.current;

      // Remove last AI message if exists
      const messagesWithoutAI = currentMessages.filter(
        (m, i) => !(i === currentMessages.length - 1 && m.sender === "assistant")
      );

      // Trigger async update
      (async () => {
        try {
          // Generate new response
          setIsTyping(true);
          const aiResponse = await chatService.generateAIResponse(
            conversationId,
            lastUserMessage.content,
            messagesWithoutAI.slice(0, -1)
          );

          // Update messages with new response
          setMessages(prev => {
            const lastIsAI = prev.length > 0 && prev[prev.length - 1].sender === "assistant";
            const base = lastIsAI ? prev.slice(0, -1) : prev;
            return [...base, aiResponse];
          });

          // Save to storage
          await saveToStorage(aiResponse);
          currentOptions.onAIResponse?.(aiResponse);
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Failed to regenerate";
          setError(errorMessage);
          currentOptions.onError?.(errorMessage);
        } finally {
          setIsLoading(false);
          setIsTyping(false);
        }
      })();

      return messagesWithoutAI;
    });
  }, [conversationId, isLoading, saveToStorage]);

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
