import { GroqError } from "../utils/groq-error";
import { GroqErrorType } from "../constants/error-types";
import {
  isSseDataLine,
  extractSseDataPayload,
  isSseDoneMarker,
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
    let buffer = "";

    const consumeLine = (rawLine: string): void => {
      const line = rawLine.endsWith("\r") ? rawLine.slice(0, -1) : rawLine;
      const trimmed = line.trim();
      if (trimmed.length === 0 || !isSseDataLine(trimmed)) return;
      const payload = extractSseDataPayload(trimmed);
      if (isSseDoneMarker(payload)) return;
      const content = extractContentFromSsePayload(payload);
      if (content !== null) {
        contentChunks.push(content);
        this.callbacks.onChunk(content);
      }
    };

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += this.decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) consumeLine(line);
      }

      buffer += this.decoder.decode();
      if (buffer.length > 0) consumeLine(buffer);
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
