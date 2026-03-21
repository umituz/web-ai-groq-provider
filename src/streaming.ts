/**
 * Streaming Text Generation Service
 * Handles streaming text generation using Groq API
 */

import type {
  GroqChatRequest,
  GroqMessage,
  GroqGenerationConfig,
  GroqChatChunk,
} from "./types";
import { groqHttpClient } from "./client";
import { DEFAULT_MODELS } from "./types";
import { GroqError, GroqErrorType } from "./types";

const isDevelopment = process.env.NODE_ENV === "development";

export interface StreamingOptions {
  model?: string;
  generationConfig?: GroqGenerationConfig;
  callbacks?: StreamingCallbacks;
}

export interface StreamingCallbacks {
  onChunk?: (chunk: string) => void;
  onComplete?: (fullText: string) => void;
  onError?: (error: Error) => void;
}

/**
 * Stream text generation from a prompt
 * Returns an async generator of text chunks
 */
export async function* streaming(
  prompt: string,
  options: StreamingOptions = {}
): AsyncGenerator<string> {
  const startTime = Date.now();
  const model = options.model || DEFAULT_MODELS.TEXT;

  if (isDevelopment) {
    console.log("[Groq] streaming called:", {
      model,
      promptLength: prompt.length,
      promptPreview: prompt.substring(0, 100) + "...",
    });
  }

  const messages: GroqMessage[] = [
    {
      role: "user",
      content: prompt,
    },
  ];

  const request: GroqChatRequest = {
    model,
    messages,
    temperature: options.generationConfig?.temperature || 0.7,
    max_tokens: options.generationConfig?.maxTokens || 1024,
    top_p: options.generationConfig?.topP,
    n: options.generationConfig?.n,
    stop: options.generationConfig?.stop,
    frequency_penalty: options.generationConfig?.frequencyPenalty,
    presence_penalty: options.generationConfig?.presencePenalty,
  };

  if (isDevelopment) {
    console.log("[Groq] Starting streaming request");
  }

  try {
    let fullText = "";

    for await (const chunk of groqHttpClient.chatCompletionStream(request)) {
      const content = chunk.choices[0]?.delta?.content;

      if (content) {
        fullText += content;
        options.callbacks?.onChunk?.(content);
        yield content;
      }

      // Check if generation is complete
      if (chunk.choices[0]?.finish_reason) {
        if (isDevelopment) {
          console.log("[Groq] Streaming complete:", {
            finishReason: chunk.choices[0].finish_reason,
            totalLength: fullText.length,
          });
        }
        options.callbacks?.onComplete?.(fullText);
        break;
      }
    }

    const totalDuration = Date.now() - startTime;
    if (isDevelopment) {
      console.log("[Groq] streaming complete:", {
        totalDuration: `${totalDuration}ms`,
        totalLength: fullText.length,
      });
    }
  } catch (error) {
    if (isDevelopment) {
      console.error("[Groq] streaming error:", {
        error,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
    }

    options.callbacks?.onError?.(error as Error);
    throw error;
  }
}

/**
 * Stream chat generation from messages
 * Returns an async generator of text chunks
 */
export async function* streamingChat(
  messages: GroqMessage[],
  options: StreamingOptions = {}
): AsyncGenerator<string> {
  const startTime = Date.now();
  const model = options.model || DEFAULT_MODELS.TEXT;

  if (isDevelopment) {
    console.log("[Groq] streamingChat called:", {
      model,
      messageCount: messages.length,
    });
  }

  const request: GroqChatRequest = {
    model,
    messages,
    temperature: options.generationConfig?.temperature || 0.7,
    max_tokens: options.generationConfig?.maxTokens || 1024,
    top_p: options.generationConfig?.topP,
    n: options.generationConfig?.n,
    stop: options.generationConfig?.stop,
    frequency_penalty: options.generationConfig?.frequencyPenalty,
    presence_penalty: options.generationConfig?.presencePenalty,
  };

  if (isDevelopment) {
    console.log("[Groq] Starting streaming chat request");
  }

  try {
    let fullText = "";

    for await (const chunk of groqHttpClient.chatCompletionStream(request)) {
      const content = chunk.choices[0]?.delta?.content;

      if (content) {
        fullText += content;
        options.callbacks?.onChunk?.(content);
        yield content;
      }

      // Check if generation is complete
      if (chunk.choices[0]?.finish_reason) {
        if (isDevelopment) {
          console.log("[Groq] Streaming chat complete:", {
            finishReason: chunk.choices[0].finish_reason,
            totalLength: fullText.length,
          });
        }
        options.callbacks?.onComplete?.(fullText);
        break;
      }
    }

    const totalDuration = Date.now() - startTime;
    if (isDevelopment) {
      console.log("[Groq] streamingChat complete:", {
        totalDuration: `${totalDuration}ms`,
        totalLength: fullText.length,
      });
    }
  } catch (error) {
    if (isDevelopment) {
      console.error("[Groq] streamingChat error:", {
        error,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
    }

    options.callbacks?.onError?.(error as Error);
    throw error;
  }
}
