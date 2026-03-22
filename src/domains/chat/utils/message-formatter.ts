/**
 * Message Formatter Utility
 * @description Convert between chat messages and Groq format
 */

import type { IMessageFormatter } from "../interfaces";
import type { ChatMessage } from "../entities";
import type { GroqMessage } from "../../groq/interfaces";

class MessageFormatter implements IMessageFormatter {
  toGroqMessages(messages: ChatMessage[], systemPrompt?: string): GroqMessage[] {
    const groqMessages: GroqMessage[] = [];

    // Add system prompt first
    if (systemPrompt) {
      groqMessages.push({
        role: "system",
        content: systemPrompt,
      });
    }

    // Convert chat messages to Groq format
    for (const message of messages) {
      // Skip system messages from context
      if (message.sender === "system") continue;

      groqMessages.push({
        role: message.sender === "user" ? "user" : "assistant",
        content: message.content,
      });
    }

    return groqMessages;
  }

  toChatMessage(content: string, sender: ChatMessage["sender"]): ChatMessage {
    return {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sender,
      content: content.trim(),
      timestamp: new Date().toISOString(),
      type: "text",
    };
  }
}

export const messageFormatter = new MessageFormatter();
