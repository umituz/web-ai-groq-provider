/**
 * Groq Error
 * @description Custom error class for Groq API operations.
 */

import { GroqErrorType } from "../constants/error-types";

export interface GroqErrorMetadata {
  readonly status?: number;
  readonly url?: string;
  readonly [key: string]: unknown;
}

export class GroqError extends Error {
  public readonly type: GroqErrorType;
  public readonly cause?: Error;
  public readonly metadata: GroqErrorMetadata;

  constructor(
    type: GroqErrorType,
    message: string,
    cause?: Error,
    metadata: GroqErrorMetadata = {},
  ) {
    super(message);
    this.name = "GroqError";
    this.type = type;
    this.cause = cause;
    this.metadata = metadata;
  }

  override toString(): string {
    const statusPart =
      typeof this.metadata.status === "number" ? ` (HTTP ${this.metadata.status})` : "";
    return `${this.name} [${this.type}]: ${this.message}${statusPart}`;
  }

  toJSON(): {
    name: string;
    type: GroqErrorType;
    message: string;
    metadata: GroqErrorMetadata;
  } {
    return {
      name: this.name,
      type: this.type,
      message: this.message,
      metadata: this.metadata,
    };
  }
}
