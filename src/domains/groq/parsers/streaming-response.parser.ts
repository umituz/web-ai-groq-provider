/**
 * Streaming Response Parser
 * @description Parses Server-Sent Events (SSE) from Groq streaming responses.
 *              Delegates the line-level logic → parsers/sse-line-extractor.
 */

import { GroqError } from "../utils/groq-error";
import { GroqErrorType } from "../constants/error-types";
import {
  normalizeSseChunk,
  extractContentFromSsePayload,
} from "./sse-line-extractor";

export interface StreamingParserCallbacks {
  readonly onChunk: (content: string) => void;
}

export class StreamingResponseParser {
  private readonly decoder = new TextDecoder();

  constructor(private readonly callbacks: StreamingParserCallbacks) {}

  async parse(stream: ReadableStream<Uint8Array>): Promise<string> {
    const reader = stream.getReader();
    const contentChunks: string[] = [];

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = this.decoder.decode(value, { stream: true });
        const normalized = normalizeSseChunk(chunk);

        for (const item of normalized) {
          if (item.isDone) continue;
          const content = extractContentFromSsePayload(item.payload);
          if (content !== null) {
            contentChunks.push(content);
            this.callbacks.onChunk(content);
          }
        }
      }
    } catch (error) {
      if (error instanceof GroqError) throw error;
      throw new GroqError(
        GroqErrorType.NETWORK_ERROR,
        "Stream was interrupted",
        error instanceof Error ? error : undefined,
      );
    } finally {
      reader.releaseLock();
    }

    return contentChunks.join("");
  }
}
