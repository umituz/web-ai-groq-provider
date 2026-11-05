
import { GroqErrorType } from "../constants/error-types";

export interface HttpStatusClassificationRule {
  readonly unauthorizedStatuses: ReadonlySet<number>;
  readonly rateLimitedStatus: number;
  readonly serverErrorThreshold: number;
  readonly clientErrorThreshold: number;
}

export const DEFAULT_HTTP_STATUS_RULE: HttpStatusClassificationRule = {
  unauthorizedStatuses: new Set([401, 403]),
  rateLimitedStatus: 429,
  serverErrorThreshold: 500,
  clientErrorThreshold: 400,
};

export function classifyHttpStatus(
  status: number,
  rule: HttpStatusClassificationRule = DEFAULT_HTTP_STATUS_RULE,
): GroqErrorType {
  if (rule.unauthorizedStatuses.has(status)) return GroqErrorType.INVALID_API_KEY;
  if (status === rule.rateLimitedStatus) return GroqErrorType.RATE_LIMIT_ERROR;
  if (status >= rule.serverErrorThreshold) return GroqErrorType.SERVER_ERROR;
  if (status >= rule.clientErrorThreshold) return GroqErrorType.CLIENT_ERROR;
  return GroqErrorType.UNKNOWN_ERROR;
}
