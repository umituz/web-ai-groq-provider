
import type { IMessageFormatter } from "../interfaces";
import type { ChatMessage } from "../entities";
import type { GroqMessage } from "../../groq/entities";
import type { ChatIdGenerator } from "./chat-id-generator";
import { chatIdGenerator as defaultIdGenerator } from "./chat-id-generator";
import { ASSISTANT_ROLE, USER_ROLE } from "../../groq/constants/identifier.constants";

export class MessageFormatter implements IMessageFormatter {
  constructor(private readonly idGenerator: ChatIdGenerator = defaultIdGenerator) {}

  toGroqMessages(messages: ReadonlyArray<ChatMessage>, systemPrompt?: string): GroqMessage[] {
    const groqMessages: GroqMessage[] = [];

    if (systemPrompt) {
      groqMessages.push({ role: "system", content: systemPrompt });
    }

    for (const message of messages) {
      if (message.sender === "system") continue;
      groqMessages.push({
        role: message.sender === "user" ? USER_ROLE : ASSISTANT_ROLE,
        content: message.content,
      });
    }

    return groqMessages;
  }

  toChatMessage(content: string, sender: ChatMessage["sender"]): ChatMessage {
    return {
      id: this.idGenerator.next(sender),
      sender,
      content: content.trim(),
      timestamp: new Date().toISOString(),
      type: "text",
    };
  }
}

export const messageFormatter = new MessageFormatter();
