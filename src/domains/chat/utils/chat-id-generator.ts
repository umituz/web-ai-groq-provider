/**
 * Chat ID Generator
 * @description Generates unique message IDs. Delegates randomness
 *              to calculations/random-base36-suffix so the random
 *              source is configurable (and the ID format is unit-testable).
 *
 *              Format: `msg-{timestamp}-{sender}-{counter}-{random}`
 */

import { generateRandomBase36Suffix } from "../../groq/calculations/random-base36-suffix";
import {
  MESSAGE_ID_PREFIX,
  CHAT_MESSAGE_ID_SUFFIX_LENGTH,
} from "../../groq/constants/identifier.constants";

const ID_PART_DELIMITER = "-";

export class ChatIdGenerator {
  private counter = 0;
  private readonly randomLength: number;

  constructor(randomLength: number = CHAT_MESSAGE_ID_SUFFIX_LENGTH) {
    this.randomLength = randomLength;
  }

  /**
   * Generate a new unique message ID.
   */
  next(sender: string): string {
    this.counter += 1;
    const random = generateRandomBase36Suffix(this.randomLength);
    return [
      MESSAGE_ID_PREFIX,
      Date.now(),
      sender,
      this.counter,
      random,
    ].join(ID_PART_DELIMITER);
  }
}

export const chatIdGenerator = new ChatIdGenerator();
