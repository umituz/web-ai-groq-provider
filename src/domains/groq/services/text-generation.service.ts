import type {
  TextGenerationOptions,
  StreamingCallbacks,
  StructuredGenerationOptions,
  IGroqChatService,
} from "../interfaces";
import type { GroqMessage } from "../entities";
import type { IGroqHttpClient } from "../interfaces";
import { GroqError } from "../utils/groq-error";
import { GroqErrorType } from "../constants/error-types";
import { DEFAULT_MODELS } from "../constants/groq.constants";
import {
  CACHE_KEY_TYPE_COMPLETION,
  CACHE_KEY_TYPE_CHAT,
} from "../constants/identifier.constants";
import { CacheManager } from "../utils/cache-manager";
import { GroqChatRequestBuilder, StructuredPromptBuilder } from "../builders";
import { JsonResponseParser, StreamingResponseParser } from "../parsers";
import { createUserMessage } from "../utils/message.util";

const STRUCTURED_OUTPUT_TEMPERATURE = 0.1;

export class TextGenerationService implements IGroqChatService {
  private readonly jsonParser = new JsonResponseParser();

  constructor(
    private readonly httpClient: IGroqHttpClient,
    private readonly cache: CacheManager = new CacheManager(),
    private readonly defaultModel: string = DEFAULT_MODELS.TEXT,
  ) {}

  generateCompletion(
    prompt: string,
    options: TextGenerationOptions = {},
  ): Promise<string> {
    const model = options.model ?? this.defaultModel;

    return this.executeWithCache(
      {
        type: CACHE_KEY_TYPE_COMPLETION,
        model,
        prompt,
        config: options.generationConfig,
      },
      async () => {
        const request = GroqChatRequestBuilder.for(model)
          .withMessages([createUserMessage(prompt)])
          .withConfig(options.generationConfig)
          .build();
        const response = await this.httpClient.postChatCompletion(request);
        return this.extractContent(response.choices[0]?.message?.content);
      },
    );
  }

  generateChatCompletion(
    messages: ReadonlyArray<GroqMessage>,
    options: TextGenerationOptions = {},
  ): Promise<string> {
    const model = options.model ?? this.defaultModel;

    return this.executeWithCache(
      {
        type: CACHE_KEY_TYPE_CHAT,
        model,
        messages: [...messages],
        config: options.generationConfig,
      },
      async () => {
        const request = GroqChatRequestBuilder.for(model)
          .withMessages(messages)
          .withConfig(options.generationConfig)
          .build();
        const response = await this.httpClient.postChatCompletion(request);
        return this.extractContent(response.choices[0]?.message?.content);
      },
    );
  }

  generateStructured<T>(
    prompt: string,
    options: StructuredGenerationOptions = {},
  ): Promise<T> {
    const model = options.model ?? this.defaultModel;
    const jsonPrompt = StructuredPromptBuilder.for(prompt)
      .withSchema(options.schema)
      .build();

    const request = GroqChatRequestBuilder.for(model)
      .withMessages([createUserMessage(jsonPrompt)])
      .withConfig({
        ...options.generationConfig,
        temperature: STRUCTURED_OUTPUT_TEMPERATURE,
      })
      .build();

    return this.httpClient.postChatCompletion(request).then((response) => {
      const content = this.extractContent(response.choices[0]?.message?.content);
      return this.jsonParser.parse<T>(content);
    });
  }

  streamCompletion(
    prompt: string,
    callbacks: StreamingCallbacks,
    options: TextGenerationOptions = {},
  ): Promise<string> {
    return this.streamChatCompletion([createUserMessage(prompt)], callbacks, options);
  }

  async streamChatCompletion(
    messages: ReadonlyArray<GroqMessage>,
    callbacks: StreamingCallbacks,
    options: TextGenerationOptions = {},
  ): Promise<string> {
    const model = options.model ?? this.defaultModel;
    const request = GroqChatRequestBuilder.for(model)
      .withMessages(messages)
      .withConfig(options.generationConfig)
      .withStream(true)
      .build();

    const parser = new StreamingResponseParser({
      onChunk: (chunk) => callbacks.onChunk?.(chunk),
    });

    try {
      const stream = await this.httpClient.streamChatCompletion(request, {
        signal: options.signal,
      });
      const fullText = await parser.parse(stream);
      callbacks.onComplete?.(fullText);
      return fullText;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      callbacks.onError?.(err);
      throw err;
    }
  }

  clearCache(): void {
    this.cache.clear();
  }

  private async executeWithCache(
    params: Record<string, unknown>,
    factory: () => Promise<string>,
  ): Promise<string> {
    const key = this.cache.generateKey(params);
    const cached = this.cache.get<string>(key);
    if (cached !== null) {
      return cached;
    }
    const result = await factory();
    this.cache.set(key, result);
    return result;
  }

  private extractContent(content: string | undefined): string {
    if (!content) {
      throw new GroqError(
        GroqErrorType.UNKNOWN_ERROR,
        "No content generated from Groq API",
      );
    }
    return content;
  }
}
