import type { GroqChatRequest, GroqReasoningEffort } from "../entities";
import type { IGroqHttpClient } from "../interfaces";
import { extractJsonCandidate } from "../parsers";
import { createUserMessage, GroqError, GroqErrorType } from "../utils";

export interface StructuredJsonRequest {
  readonly model: string;
  readonly instructions: string;
  readonly maxTokens: number;
  readonly temperature: number;
  readonly reasoningEffort?: GroqReasoningEffort;
}

export async function requestStructuredJson(
  client: IGroqHttpClient,
  request: StructuredJsonRequest,
): Promise<unknown> {
  const chatRequest: GroqChatRequest = {
    model: request.model,
    messages: [createUserMessage(request.instructions)],
    temperature: request.temperature,
    max_tokens: request.maxTokens,
    response_format: { type: "json_object" },
    reasoning_effort: request.reasoningEffort,
  };
  const response = await client.postChatCompletion(chatRequest);
  const content = response.choices[0]?.message?.content ?? "";
  const candidate = extractJsonCandidate(content);
  try {
    return JSON.parse(candidate) as unknown;
  } catch (err) {
    throw new GroqError(
      GroqErrorType.UNKNOWN_ERROR,
      "model response contained no parsable json object",
      err instanceof Error ? err : undefined,
    );
  }
}
