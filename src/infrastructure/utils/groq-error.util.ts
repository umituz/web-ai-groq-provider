/**
 * Groq Error Class
 * @description Custom error for Groq API operations
 */

import { GroqErrorType } from "../constants/error.constants";

export class GroqError extends Error {
  constructor(
    public readonly type: GroqErrorType,
    message: string,
    public readonly cause?: Error,
    public readonly metadata?: { readonly status?: number; readonly url?: string }
  ) {
    super(message);
    this.name = "GroqError";
  }
}
