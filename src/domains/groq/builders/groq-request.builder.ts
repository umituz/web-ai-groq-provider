/**
 * Groq Request Builder
 * @description Builder for constructing GroqChatRequest instances
 *              from a domain intent (model + messages + generation config).
 *              Implements the Builder pattern; each method is fluent.
 */

import type { GroqChatRequest, GroqMessage, GroqGenerationConfig } from "../entities";
import { DEFAULT_GENERATION_CONFIG } from "../constants/groq.constants";

interface MutableRequest {
  model: string;
  messages: GroqMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  n?: number;
  stop?: string[];
  frequency_penalty?: number;
  presence_penalty?: number;
  stream?: boolean;
}

export class GroqChatRequestBuilder {
  private readonly model: string;
  private messages: GroqMessage[] = [];
  private generationConfig: GroqGenerationConfig = {};
  private streamEnabled = false;

  constructor(model: string) {
    this.model = model;
  }

  static for(model: string): GroqChatRequestBuilder {
    return new GroqChatRequestBuilder(model);
  }

  withMessages(messages: ReadonlyArray<GroqMessage>): this {
    this.messages = [...messages];
    return this;
  }

  withConfig(config: GroqGenerationConfig | undefined): this {
    this.generationConfig = config ? { ...config } : {};
    return this;
  }

  withStream(stream: boolean): this {
    this.streamEnabled = stream;
    return this;
  }

  build(): GroqChatRequest {
    const cfg = this.generationConfig;
    const request: MutableRequest = {
      model: this.model,
      messages: this.messages,
      temperature: cfg.temperature ?? DEFAULT_GENERATION_CONFIG.temperature,
      max_tokens: cfg.maxTokens ?? DEFAULT_GENERATION_CONFIG.maxTokens,
      top_p: cfg.topP ?? DEFAULT_GENERATION_CONFIG.topP,
    };

    if (cfg.n !== undefined) request.n = cfg.n;
    if (cfg.stop !== undefined) request.stop = cfg.stop;
    if (cfg.frequencyPenalty !== undefined) request.frequency_penalty = cfg.frequencyPenalty;
    if (cfg.presencePenalty !== undefined) request.presence_penalty = cfg.presencePenalty;
    if (this.streamEnabled) request.stream = true;

    return request as GroqChatRequest;
  }
}
