/**
 * Structured Text Generation Service
 * Handles JSON/structured output generation using Groq API
 */

import type {
  GroqMessage,
  GroqGenerationConfig,
} from "./types";
import { textGeneration } from "./text-generation";
import { GroqError, GroqErrorType } from "./types";

const isDevelopment = process.env.NODE_ENV === "development";

export interface StructuredTextOptions<T = unknown> {
  model?: string;
  generationConfig?: GroqGenerationConfig;
  schema?: Record<string, unknown>;
}

/**
 * Generate structured JSON output from a prompt
 */
export async function structuredText<T = Record<string, unknown>>(
  prompt: string,
  options: StructuredTextOptions<T> = {}
): Promise<T> {
  const startTime = Date.now();

  if (isDevelopment) {
    console.log("[Groq] structuredText called:", {
      model: options.model,
      promptLength: prompt.length,
      hasSchema: !!options.schema,
    });
  }

  // Build a prompt that encourages JSON output
  let enhancedPrompt = prompt;

  if (options.schema) {
    enhancedPrompt = `
${prompt}

Please respond with a JSON object that follows this schema:
${JSON.stringify(options.schema, null, 2)}

Your response must be valid JSON only, with no additional text or formatting.
`;
  } else {
    enhancedPrompt = `
${prompt}

Please respond with a valid JSON object. Your response must be valid JSON only, with no additional text or formatting.
`;
  }

  try {
    // Generate text with lower temperature for more consistent structured output
    const response = await textGeneration(enhancedPrompt, {
      model: options.model,
      generationConfig: {
        temperature: 0.3, // Lower temperature for more deterministic output
        maxTokens: 2048,
        ...options.generationConfig,
      },
    });

    if (isDevelopment) {
      console.log("[Groq] structuredText response received:", {
        responseLength: response.length,
        responsePreview: response.substring(0, 200) + "...",
      });
    }

    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = response.trim();

    // Remove markdown code blocks if present
    if (jsonStr.startsWith("```json")) {
      jsonStr = jsonStr.slice(7);
    } else if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.slice(3);
    }

    if (jsonStr.endsWith("```")) {
      jsonStr = jsonStr.slice(0, -3);
    }

    jsonStr = jsonStr.trim();

    // Parse JSON
    const parsed = JSON.parse(jsonStr) as T;

    const totalDuration = Date.now() - startTime;
    if (isDevelopment) {
      console.log("[Groq] structuredText complete:", {
        totalDuration: `${totalDuration}ms`,
        parsed: !!parsed,
      });
    }

    return parsed;
  } catch (error) {
    if (isDevelopment) {
      console.error("[Groq] structuredText error:", {
        error,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
    }

    throw new GroqError(
      GroqErrorType.UNKNOWN_ERROR,
      `Failed to generate structured output: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      error as Error
    );
  }
}

/**
 * Generate structured JSON output from chat messages
 */
export async function structuredChat<T = Record<string, unknown>>(
  messages: GroqMessage[],
  options: StructuredTextOptions<T> = {}
): Promise<T> {
  const startTime = Date.now();

  if (isDevelopment) {
    console.log("[Groq] structuredChat called:", {
      model: options.model,
      messageCount: messages.length,
      hasSchema: !!options.schema,
    });
  }

  // Add a system message requesting JSON output
  const systemMessage: GroqMessage = {
    role: "system",
    content: options.schema
      ? `You must respond with valid JSON that follows this schema:\n${JSON.stringify(options.schema, null, 2)}\n\nYour response must be valid JSON only, with no additional text or formatting.`
      : "You must respond with valid JSON only. Your response must be valid JSON only, with no additional text or formatting.",
  };

  const enhancedMessages = [systemMessage, ...messages];

  try {
    const { chatGeneration } = await import("./text-generation");

    // Generate with lower temperature for more deterministic output
    const response = await chatGeneration(enhancedMessages, {
      model: options.model,
      generationConfig: {
        temperature: 0.3,
        maxTokens: 2048,
        ...options.generationConfig,
      },
    });

    if (isDevelopment) {
      console.log("[Groq] structuredChat response received:", {
        responseLength: response.length,
      });
    }

    // Extract JSON from response
    let jsonStr = response.trim();

    // Remove markdown code blocks if present
    if (jsonStr.startsWith("```json")) {
      jsonStr = jsonStr.slice(7);
    } else if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.slice(3);
    }

    if (jsonStr.endsWith("```")) {
      jsonStr = jsonStr.slice(0, -3);
    }

    jsonStr = jsonStr.trim();

    // Parse JSON
    const parsed = JSON.parse(jsonStr) as T;

    const totalDuration = Date.now() - startTime;
    if (isDevelopment) {
      console.log("[Groq] structuredChat complete:", {
        totalDuration: `${totalDuration}ms`,
      });
    }

    return parsed;
  } catch (error) {
    if (isDevelopment) {
      console.error("[Groq] structuredChat error:", {
        error,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
    }

    throw new GroqError(
      GroqErrorType.UNKNOWN_ERROR,
      `Failed to generate structured output: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      error as Error
    );
  }
}
