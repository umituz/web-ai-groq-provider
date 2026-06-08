# @umituz/web-ai-groq-provider

Groq AI text generation and chat provider for React web applications.
Provides a clean, type-safe interface to Groq's ultra-fast LLM API with
dependency-injected services, strategy-based request execution, and
zero hardcoded language content.

## Features

- Ultra-fast inference (up to 1000 tokens/second)
- Multiple models (Llama 3.x, GPT-OSS, Mixtral, Gemma 2, Kimi K2, Qwen 3)
- Streaming responses via SSE
- Structured JSON output with schema-aware prompts
- Multi-turn chat sessions with pluggable prompt strategy
- Type-safe, fully tree-shakable subpath imports
- Dependency injection ready (no hidden singletons inside services)
- React Hooks with isolated, component-scoped abort signals

## Installation

```bash
npm install @umituz/web-ai-groq-provider
# or
yarn add @umituz/web-ai-groq-provider
# or
pnpm add @umituz/web-ai-groq-provider
```

## Getting Started

### 1. Get a Groq API Key

Sign up at [console.groq.com](https://console.groq.com) and obtain an API key.

### 2. Initialize the Provider (once at app startup)

```typescript
import { configureProvider } from "@umituz/web-ai-groq-provider";

configureProvider({
  apiKey: "your-groq-api-key",
  defaultModel: "llama-3.3-70b-versatile", // optional
});
```

### 3. Use the `useGroq` Hook

```typescript
import { useGroq } from "@umituz/web-ai-groq-provider";

function MyComponent() {
  const { generate, isLoading, error, result } = useGroq();

  const handleGenerate = async () => {
    try {
      const response = await generate("Write a short poem about coding");
      console.log(response);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <button onClick={handleGenerate} disabled={isLoading}>
        Generate
      </button>
      {isLoading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      {result && <p>{result}</p>}
    </div>
  );
}
```

## Usage Examples

### Dependency Injection (advanced)

The hooks accept a second argument for explicit DI. Use this when you
need full control over the container, e.g., for tests or per-tenant keys.

```typescript
import { useGroq, GroqHttpClient, TextGenerationService } from "@umituz/web-ai-groq-provider";

const httpClient = new GroqHttpClient();
httpClient.initialize({ apiKey: "your-groq-api-key" });
const textGeneration = new TextGenerationService(httpClient);

function MyComponent() {
  const { generate } = useGroq({}, { textGeneration });
  // ...
}
```

### Streaming Responses

```typescript
import { useGroq } from "@umituz/web-ai-groq-provider";

function StreamingComponent() {
  const { stream, result } = useGroq();

  const handleStream = async () => {
    await stream(
      "Tell me a story",
      (chunk) => {
        console.log("Received chunk:", chunk);
      },
    );
  };

  return (
    <div>
      <button onClick={handleStream}>Stream Story</button>
      {result && <p>{result}</p>}
    </div>
  );
}
```

### Structured JSON Output

Use the lower-level service when you need a structured payload.

```typescript
import { getProvider } from "@umituz/web-ai-groq-provider";

interface TodoItem {
  title: string;
  priority: "high" | "medium" | "low";
  completed: boolean;
}

const { textGeneration } = getProvider()!;
const todo = await textGeneration.generateStructured<TodoItem>(
  "Create a todo item for learning the Groq API",
  {
    schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        priority: { type: "string", enum: ["high", "medium", "low"] },
        completed: { type: "boolean" },
      },
    },
  },
);
```

### Chat Conversations

```typescript
import { getProvider, useChat } from "@umituz/web-ai-groq-provider";

function Chat() {
  const { messages, sendMessage, isLoading, error } = useChat({
    conversationId: "demo-1",
    config: { systemPrompt: "You are a helpful assistant." },
  });

  return (
    <div>
      {messages.map((m) => (
        <p key={m.id}>
          <strong>{m.sender}:</strong> {m.content}
        </p>
      ))}
      <button
        disabled={isLoading}
        onClick={() => sendMessage("What is React?")}
      >
        Ask
      </button>
      {error && <p>Error: {error}</p>}
    </div>
  );
}
```

#### Pluggable Prompt Strategy

`ChatService` does not hardcode any language or fallback content. Plug
in your own prompt resolver:

```typescript
import { getProvider } from "@umituz/web-ai-groq-provider";

const { chat } = getProvider()!;
chat.setPromptStrategy({
  resolve: (config) => config.systemPrompt ?? "Default prompt here.",
});
```

## Available Models

| Model                              | Speed    | Context | Notes                          |
| ---------------------------------- | -------- | ------- | ------------------------------ |
| `llama-3.1-8b-instant`             | 560 T/s  | 128K    | Fast responses, simple tasks   |
| `llama-3.3-70b-versatile`          | 280 T/s  | 128K    | General purpose, complex tasks |
| `llama-3.1-70b-versatile`          | 280 T/s  | 128K    | General purpose                |
| `openai/gpt-oss-20b`               | 1000 T/s | 128K    | Experimental, fastest          |
| `openai/gpt-oss-120b`              | 400 T/s  | 128K    | Large tasks                    |
| `mixtral-8x7b-32768`               | 250 T/s  | 32K     | MoE model                      |
| `gemma2-9b-it`                     | 450 T/s  | 128K    | Google                         |
| `meta-llama/llama-4-scout-17b-16e-instruct` | ~30K T/s | large | Llama 4 Scout                  |
| `moonshotai/kimi-k2-instruct`      | -        | -       | Moonshot AI                    |
| `qwen/qwen3-32b`                   | -        | -       | Alibaba Qwen 3                 |

## Configuration

### Provider Configuration

```typescript
import { configureProvider } from "@umituz/web-ai-groq-provider";

configureProvider({
  apiKey: "your-api-key",
  // All fields below are optional.
  baseUrl: "https://api.groq.com/openai/v1",
  timeoutMs: 60_000,
  textModel: "llama-3.3-70b-versatile",
});
```

### Generation Configuration

Pass a `GroqGenerationConfig` to the hook methods.

```typescript
const { generate } = useGroq();

await generate("Your prompt", {
  temperature: 0.7,
  maxTokens: 1024,
  topP: 0.9,
});
```

## Architecture

```
src/
  provider.ts                    # App-level composition root
  domains/
    groq/
      clients/                   # Transport + config + facade
      services/                  # High-level text generation orchestrator
      strategies/                # Retry / Queue / Dedupe / Composite
      builders/                  # Request + structured prompt builders
      parsers/                   # Streaming + JSON response parsers
      hooks/                     # useGroq
      utils/                     # Cache, retry, debounce, errors, etc.
      constants/                 # Models, error types, protocols, IDs
      entities/                  # Domain types
      interfaces/                # Contracts
    chat/
      services/                  # ChatService
      hooks/                     # useChat
      utils/                     # Formatter, ID generator, prompt strategy
      entities/                  # Domain types
      interfaces/                # Contracts
```

The package follows SOLID throughout. Request execution is composed via
the Strategy pattern (`CompositeExecutor` of `RetryExecutor`,
`QueueExecutor`, and `DedupeExecutor`), so adding a new behavior is a
matter of providing a new `IRequestExecutor` and inserting it into the
chain.

## License

MIT

## Links

- [Groq Documentation](https://console.groq.com/docs)
- [Groq Models](https://console.groq.com/docs/models)

## Author

umituz
