import { describe, expect, it } from "vitest";
import { TextGenerationService } from "../src/domains/groq/services/text-generation.service";
import type { IGroqHttpClient } from "../src/domains/groq/interfaces";
import type { GroqChatRequest } from "../src/domains/groq/entities";

function recordingClient(): { client: IGroqHttpClient; requests: GroqChatRequest[] } {
  const requests: GroqChatRequest[] = [];
  const client = {
    postChatCompletion: async (request: GroqChatRequest) => {
      requests.push(request);
      return {
        id: "chatcmpl-test",
        object: "chat.completion",
        created: 0,
        model: request.model,
        choices: [
          { index: 0, message: { role: "assistant", content: "ok" }, finish_reason: "stop", logprobs: null },
        ],
        usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
      };
    },
  } as unknown as IGroqHttpClient;
  return { client, requests };
}

describe("TextGenerationService model resolution", () => {
  it("uses the injected default model when no model is passed", async () => {
    const { client, requests } = recordingClient();
    const service = new TextGenerationService(client, undefined, "openai/gpt-oss-120b");

    await service.generateChatCompletion([{ role: "user", content: "hi" }]);

    expect(requests[0].model).toBe("openai/gpt-oss-120b");
  });

  it("falls back to the package default without an injected model", async () => {
    const { client, requests } = recordingClient();
    const service = new TextGenerationService(client);

    await service.generateChatCompletion([{ role: "user", content: "hi" }]);

    expect(requests[0].model).toBe("llama-3.1-8b-instant");
  });

  it("prefers an explicit per-call model over the injected default", async () => {
    const { client, requests } = recordingClient();
    const service = new TextGenerationService(client, undefined, "openai/gpt-oss-120b");

    await service.generateChatCompletion([{ role: "user", content: "hi" }], { model: "openai/gpt-oss-20b" });

    expect(requests[0].model).toBe("openai/gpt-oss-20b");
  });
});
