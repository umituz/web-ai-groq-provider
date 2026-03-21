/**
 * Domain Interfaces Index
 * Subpath: @umituz/web-ai-groq-provider/domain
 */

export type {
  TextGenerationOptions,
  StreamingCallbacks,
  StructuredGenerationOptions,
} from "./groq.interface";

export type { IGroqChatService, IGroqHttpClient } from "./groq.interface";

// Re-export from entities for convenience
export type {
  GroqConfig,
  GroqGenerationConfig,
  GroqMessage,
  GroqChatRequest,
  GroqChatResponse,
  GroqChatChunk,
} from "../entities";
