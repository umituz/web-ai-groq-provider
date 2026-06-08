/**
 * Random Base36 Suffix
 * @description Pure function: generates a random alphanumeric suffix
 *              from the base-36 character set (0-9, a-z). No hardcoded
 *              values; the character set and length are explicit.
 *
 * @example
 * ```typescript
 * generateRandomBase36Suffix(9); // "k3m9x4n2p"
 * ```
 */

const BASE_36_RADIX = 36;
const DECIMAL_OFFSET = 2; // Skip the leading "0." in Math.random().toString(36)

export function generateRandomBase36Suffix(
  length: number,
  random: () => number = Math.random,
): string {
  if (length <= 0) return "";
  const raw = random().toString(BASE_36_RADIX).slice(DECIMAL_OFFSET);
  if (raw.length >= length) return raw.slice(0, length);

  // Fall back to concatenated calls for longer-than-natural suffixes.
  let result = raw;
  while (result.length < length) {
    result += random().toString(BASE_36_RADIX).slice(DECIMAL_OFFSET);
  }
  return result.slice(0, length);
}
