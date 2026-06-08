/**
 * JSON Response Parser
 * @description Parses JSON payloads extracted by parsers/json-content-extractor.
 */

import { GroqError } from "../utils/groq-error";
import { GroqErrorType } from "../constants/error-types";
import { extractJsonCandidate } from "./json-content-extractor";

export class JsonResponseParser {
  parse<T>(rawContent: string): T {
    const candidate = extractJsonCandidate(rawContent);
    try {
      return JSON.parse(candidate) as T;
    } catch (error) {
      throw new GroqError(
        GroqErrorType.UNKNOWN_ERROR,
        "Failed to parse structured response as JSON",
        error instanceof Error ? error : undefined,
      );
    }
  }
}
