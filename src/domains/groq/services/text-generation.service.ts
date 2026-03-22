/**
 * Text Generation Service
 * @description Handles text generation using Groq API
 */

import type { IGroqChatService } from "../interfaces";
import type {
  GroqMessage,
  GroqChatRequest,
  TextGenerationOptions,
  StreamingCallbacks,
  StructuredGenerationOptions,
} from "../interfaces";
import { groqHttpClient } from "./http-client.service";
import { GroqError } from "../utils/groq-error.util";
import { GroqErrorType } from "../constants/error.constants";
import { DEFAULT_MODELS, API_ENDPOINTS, DEFAULT_GENERATION_CONFIG } from "../constants/groq.constants";

class TextGenerationService implements IGroqChatService {
  async generateCompletion(
    prompt: string,
    options: TextGenerationOptions = {}
  ): Promise<string> {
    const model = options.model || DEFAULT_MODELS.TEXT;

    const messages: GroqMessage[] = [{ role: "user", content: prompt }];
    const request = this.buildRequest(model, messages, options.generationConfig);

    const response = await groqHttpClient.postChatCompletion(request);
    const content = response.choices[0]?.message?.content;

    if (!content) {
      throw new GroqError(
        GroqErrorType.UNKNOWN_ERROR,
        "No content generated from Groq API"
      );
    }

    return content;
  }

  async generateChatCompletion(
    messages: GroqMessage[],
    options: TextGenerationOptions = {}
  ): Promise<string> {
    const model = options.model || DEFAULT_MODELS.TEXT;

    const request = this.buildRequest(model, messages, options.generationConfig);
    const response = await groqHttpClient.postChatCompletion(request);
    const content = response.choices[0]?.message?.content;

    if (!content) {
      throw new GroqError(
        GroqErrorType.UNKNOWN_ERROR,
        "No content generated from Groq API"
      );
    }

    return content;
  }

  async generateStructured<T>(
    prompt: string,
    options: StructuredGenerationOptions<T> = {}
  ): Promise<T> {
    const model = options.model || DEFAULT_MODELS.TEXT;

    // Build JSON prompt
    const jsonPrompt = this.buildStructuredPrompt(prompt, options.schema);
    const messages: GroqMessage[] = [{ role: "user", content: jsonPrompt }];
    const request = this.buildRequest(model, messages, {
      ...options.generationConfig,
      temperature: 0.1, // Lower temperature for structured output
    });

    const response = await groqHttpClient.postChatCompletion(request);
    const content = response.choices[0]?.message?.content;

    if (!content) {
      throw new GroqError(
        GroqErrorType.UNKNOWN_ERROR,
        "No content generated from Groq API"
      );
    }

    // Parse JSON response
    try {
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) ||
                      content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : content;
      const parsed = JSON.parse(jsonStr) as T;

      return parsed;
    } catch (error) {
      throw new GroqError(
        GroqErrorType.UNKNOWN_ERROR,
        "Failed to parse structured response as JSON",
        error as Error
      );
    }
  }

  async *streamCompletion(
    prompt: string,
    callbacks: StreamingCallbacks,
    options: TextGenerationOptions = {}
  ): AsyncGenerator<void, void, unknown> {
    const model = options.model || DEFAULT_MODELS.TEXT;
    const messages: GroqMessage[] = [{ role: "user", content: prompt }];
    const request = this.buildRequest(model, messages, options.generationConfig);

    try {
      const response = await groqHttpClient.postChatCompletion({
        ...request,
        stream: true,
      });

      // Note: The actual streaming implementation would need to be handled
      // by the streamChatCompletion method returning a ReadableStream
      // This is a simplified version
      callbacks.onComplete?.(response.choices[0]?.message?.content || "");
    } catch (error) {
      callbacks.onError?.(error as Error);
      throw error;
    }
  }

  private buildRequest(
    model: string,
    messages: GroqMessage[],
    config?: TextGenerationOptions["generationConfig"]
  ): GroqChatRequest {
    return {
      model,
      messages,
      temperature: config?.temperature ?? DEFAULT_GENERATION_CONFIG.temperature,
      max_tokens: config?.maxTokens ?? DEFAULT_GENERATION_CONFIG.maxTokens,
      top_p: config?.topP ?? DEFAULT_GENERATION_CONFIG.topP,
      n: config?.n,
      stop: config?.stop,
      frequency_penalty: config?.frequencyPenalty,
      presence_penalty: config?.presencePenalty,
    };
  }

  private buildStructuredPrompt(
    prompt: string,
    schema?: Record<string, unknown>
  ): string {
    let structuredPrompt = `Please generate a JSON response for the following request.\n\n`;

    if (schema) {
      structuredPrompt += `Expected JSON schema:\n${JSON.stringify(schema, null, 2)}\n\n`;
    }

    structuredPrompt += `Request:\n${prompt}\n\n`;
    structuredPrompt += `Respond only with valid JSON, formatted as:\n\`\`\`json\n{...}\n\`\`\``;

    return structuredPrompt;
  }
}

export const textGenerationService = new TextGenerationService();
