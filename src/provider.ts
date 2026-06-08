/**
 * Provider Container
 * @description App-level composition root.
 *              Wires together config, transport, and services so consumers
 *              can either:
 *                - use the configured container via `getProvider()`, or
 *                - build their own container and pass it to the hooks.
 *
 * @example
 * ```typescript
 * import { configureProvider, getProvider, useGroq, useChat } from "@umituz/web-ai-groq-provider";
 *
 * // At app startup:
 * configureProvider({ apiKey: process.env.GROQ_API_KEY! });
 *
 * // In components:
 * const container = getProvider();
 * if (!container) throw new Error("Provider not configured");
 * const { generate } = useGroq({}, { textGeneration: container.textGeneration });
 * const { sendMessage } = useChat({ conversationId: "x" }, { chatService: container.chat });
 * ```
 */

import type { GroqConfig } from "./domains/groq/entities";
import { GroqConfigStore } from "./domains/groq/clients/groq-config-store";
import { GroqHttpClient } from "./domains/groq/clients/groq-http-client";
import { GroqHttpTransport } from "./domains/groq/clients/groq-http-transport";
import { TextGenerationService } from "./domains/groq/services/text-generation.service";
import { ChatService } from "./domains/chat/services/chat.service";

export interface AppContainer {
  readonly groqHttpClient: GroqHttpClient;
  readonly textGeneration: TextGenerationService;
  readonly chat: ChatService;
}

let container: AppContainer | null = null;

/**
 * Initialize the singleton container with the given Groq configuration.
 * Subsequent calls reset and re-initialize.
 *
 * @throws GroqError with type `INVALID_API_KEY` if the API key is invalid.
 */
export function configureProvider(config: GroqConfig): AppContainer {
  const configStore = new GroqConfigStore();
  const transport = new GroqHttpTransport(configStore);
  const httpClient = new GroqHttpClient({ configStore, transport });
  httpClient.initialize(config);

  const textGeneration = new TextGenerationService(httpClient);
  const chat = new ChatService(textGeneration);

  container = { groqHttpClient: httpClient, textGeneration, chat };
  return container;
}

/**
 * Returns the active container, or null if not configured.
 */
export function getProvider(): AppContainer | null {
  return container;
}

/**
 * Resets the singleton container. Used in tests and during teardown.
 * Cancels any pending requests before clearing state.
 */
export function resetProvider(): void {
  container?.groqHttpClient.reset();
  container = null;
}
