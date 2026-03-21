# @umituz/react-ai-groq-provider

Groq AI text generation provider for React web applications. This package provides a clean, type-safe interface to Groq's ultra-fast LLM API.

## Features

- 🚀 **Ultra-fast inference** - Groq delivers up to 1000 tokens/second
- 💰 **Affordable pricing** - Starting from $0.05 per 1M tokens
- 🎯 **Multiple models** - Llama 3.1 8B, Llama 3.3 70B, GPT-OSS, and more
- 🔄 **Streaming support** - Real-time streaming responses
- 📦 **Structured output** - Generate JSON with schema validation
- 💬 **Chat sessions** - Multi-turn conversation management
- 🔒 **Type-safe** - Full TypeScript support
- 🪝 **React Hooks** - Easy integration with React

## Installation

```bash
npm install @umituz/react-ai-groq-provider
# or
yarn add @umituz/react-ai-groq-provider
# or
pnpm add @umituz/react-ai-groq-provider
```

## Getting Started

### 1. Get a Groq API Key

Sign up at [console.groq.com](https://console.groq.com) and get your API key.

### 2. Initialize the Provider

```typescript
import { configureProvider } from "@umituz/react-ai-groq-provider";

// Initialize with your API key
configureProvider({
  apiKey: "your-groq-api-key",
  defaultModel: "llama-3.3-70b-versatile", // Optional
});
```

### 3. Use the useGroq Hook

```typescript
import { useGroq } from "@umituz/react-ai-groq-provider";

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

### Basic Text Generation

```typescript
import { textGeneration } from "@umituz/react-ai-groq-provider";

const result = await textGeneration("Explain quantum computing in simple terms");
```

### Chat Conversation

```typescript
import { chatGeneration } from "@umituz/react-ai-groq-provider";

const messages = [
  { role: "user", content: "What is React?" },
  { role: "assistant", content: "React is..." },
  { role: "user", content: "How does it differ from Vue?" },
];

const response = await chatGeneration(messages);
```

### Structured JSON Output

```typescript
import { structuredText } from "@umituz/react-ai-groq-provider";

interface TodoItem {
  title: string;
  priority: "high" | "medium" | "low";
  completed: boolean;
}

const todos = await structuredText<TodoItem>(
  "Create a todo item for learning Groq API",
  {
    schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        priority: { type: "string", enum: ["high", "medium", "low"] },
        completed: { type: "boolean" },
      },
    },
  }
);
```

### Streaming Responses

```typescript
import { useGroq } from "@umituz/react-ai-groq-provider";

function StreamingComponent() {
  const { stream } = useGroq();

  const handleStream = async () => {
    let fullText = "";
    await stream(
      "Tell me a story",
      (chunk) => {
        fullText += chunk;
        console.log("Received chunk:", chunk);
        // Update UI with chunk
      }
    );
  };

  return <button onClick={handleStream}>Stream Story</button>;
}
```

## Available Models

| Model | Speed | Context | Best For |
|-------|-------|---------|----------|
| `llama-3.1-8b-instant` | 560 T/s | 128K | Fast responses, simple tasks |
| `llama-3.3-70b-versatile` | 280 T/s | 128K | General purpose, complex tasks |
| `llama-3.1-70b-versatile` | 280 T/s | 128K | General purpose |
| `openai/gpt-oss-20b` | 1000 T/s | 128K | Experimental, fastest |
| `openai/gpt-oss-120b` | 400 T/s | 128K | Large tasks |
| `mixtral-8x7b-32768` | 250 T/s | 32K | MoE model |
| `gemma2-9b-it` | 450 T/s | 128K | Google's model |

## Configuration

### Provider Configuration

```typescript
import { configureProvider } from "@umituz/react-ai-groq-provider";

configureProvider({
  apiKey: "your-api-key",
  baseUrl: "https://api.groq.com/openai/v1", // Optional, default
  timeoutMs: 60000, // Optional, default 60s
  defaultModel: "llama-3.3-70b-versatile", // Optional
});
```

### Generation Configuration

```typescript
import { GenerationConfigBuilder } from "@umituz/react-ai-groq-provider";

const config = GenerationConfigBuilder.create()
  .withTemperature(0.7)
  .withMaxTokens(1024)
  .withTopP(0.9)
  .build();

await textGeneration("Your prompt", { generationConfig: config });
```

## License

MIT

## Links

- [Groq Documentation](https://console.groq.com/docs)
- [Groq Models](https://console.groq.com/docs/models)

## Author

umituz
