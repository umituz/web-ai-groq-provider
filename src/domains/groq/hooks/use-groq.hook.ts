/**
 * useGroq Hook
 * @description Main React hook for Groq text generation
 */

import { useState, useCallback, useMemo } from "react";
import type { GroqGenerationConfig } from "../interfaces";
import type { TextGenerationOptions, StreamingCallbacks } from "../interfaces";
import { textGenerationService } from "../services";
import { GroqError } from "../utils/groq-error.util";
import { getUserFriendlyError } from "../utils/error.util";
import { DEFAULT_MODELS } from "../constants";

const isDevelopment = typeof process !== "undefined" && process.env?.NODE_ENV === "development";

export interface UseGroqOptions {
  /** Initial model to use */
  readonly model?: string;
  /** Default generation config */
  readonly generationConfig?: GroqGenerationConfig;
  /** Callback when generation starts */
  readonly onStart?: () => void;
  /** Callback when generation completes */
  readonly onSuccess?: (result: string) => void;
  /** Callback when generation fails */
  readonly onError?: (error: string) => void;
}

export interface UseGroqReturn {
  /** Loading state */
  readonly isLoading: boolean;
  /** Error message */
  readonly error: string | null;
  /** Generated result */
  readonly result: string | null;
  /** Generate text from a prompt */
  generate: (prompt: string, options?: GroqGenerationConfig) => Promise<string>;
  /** Generate structured JSON output */
  generateJSON: <T = Record<string, unknown>>(
    prompt: string,
    options?: GroqGenerationConfig & { schema?: Record<string, unknown> }
  ) => Promise<T>;
  /** Stream text generation */
  stream: (
    prompt: string,
    onChunk: (chunk: string) => void,
    options?: GroqGenerationConfig
  ) => Promise<void>;
  /** Reset state */
  reset: () => void;
  /** Clear error */
  clearError: () => void;
}

/**
 * Hook for Groq text generation
 */
export function useGroq(options: UseGroqOptions = {}): UseGroqReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  // Memoize options to prevent unnecessary callback recreations
  const stableOptions = useMemo(
    () => options,
    [
      options.model,
      options.generationConfig?.temperature,
      options.generationConfig?.maxTokens,
      options.generationConfig?.topP,
      options.onStart,
      options.onSuccess,
      options.onError,
    ]
  );

  const generate = useCallback(
    async (prompt: string, config?: GroqGenerationConfig): Promise<string> => {
      setIsLoading(true);
      setError(null);
      setResult(null);

      if (isDevelopment) {
        console.log("[useGroq] generate called:", {
          promptLength: prompt.length,
        });
      }

      stableOptions.onStart?.();

      try {
        const response = await textGenerationService.generateCompletion(prompt, {
          model: stableOptions.model,
          generationConfig: {
            ...stableOptions.generationConfig,
            ...config,
          },
        });

        setResult(response);
        stableOptions.onSuccess?.(response);

        if (isDevelopment) {
          console.log("[useGroq] generate success:", {
            responseLength: response.length,
          });
        }

        return response;
      } catch (err) {
        const errorMessage = getUserFriendlyError(
          err instanceof Error ? err : new Error("Unknown error")
        );
        setError(errorMessage);
        stableOptions.onError?.(errorMessage);

        if (isDevelopment) {
          console.error("[useGroq] generate error:", { error: err });
        }

        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [stableOptions]
  );

  const generateJSON = useCallback(
    async <T = Record<string, unknown>,>(
      prompt: string,
      config?: GroqGenerationConfig & { schema?: Record<string, unknown> }
    ): Promise<T> => {
      setIsLoading(true);
      setError(null);
      setResult(null);

      if (isDevelopment) {
        console.log("[useGroq] generateJSON called:", {
          promptLength: prompt.length,
        });
      }

      stableOptions.onStart?.();

      try {
        const response = await textGenerationService.generateStructured<T>(prompt, {
          model: stableOptions.model,
          generationConfig: {
            ...stableOptions.generationConfig,
            ...config,
          },
          schema: config?.schema,
        });

        const jsonString = JSON.stringify(response, null, 2);
        setResult(jsonString);
        stableOptions.onSuccess?.(jsonString);

        if (isDevelopment) {
          console.log("[useGroq] generateJSON success:", {
            hasResponse: !!response,
          });
        }

        return response;
      } catch (err) {
        const errorMessage = getUserFriendlyError(
          err instanceof Error ? err : new Error("Unknown error")
        );
        setError(errorMessage);
        stableOptions.onError?.(errorMessage);

        if (isDevelopment) {
          console.error("[useGroq] generateJSON error:", { error: err });
        }

        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [stableOptions]
  );

  const stream = useCallback(
    async (
      prompt: string,
      onChunk: (chunk: string) => void,
      config?: GroqGenerationConfig
    ): Promise<void> => {
      setIsLoading(true);
      setError(null);
      setResult(null);

      let fullContent = "";

      if (isDevelopment) {
        console.log("[useGroq] stream called:", {
          promptLength: prompt.length,
        });
      }

      stableOptions.onStart?.();

      try {
        const callbacks: StreamingCallbacks = {
          onChunk: (c) => {
            fullContent += c;
            onChunk(c);
          },
          onComplete: (text) => {
            setResult(text);
            stableOptions.onSuccess?.(text);
          },
        };

        for await (const _ of textGenerationService.streamCompletion(
          prompt,
          callbacks,
          {
            model: stableOptions.model,
            generationConfig: {
              ...stableOptions.generationConfig,
              ...config,
            },
          }
        )) {
          // Consume the async generator
          void _;
        }

        if (isDevelopment) {
          console.log("[useGroq] stream success:", {
            contentLength: fullContent.length,
          });
        }
      } catch (err) {
        const errorMessage = getUserFriendlyError(
          err instanceof Error ? err : new Error("Unknown error")
        );
        setError(errorMessage);
        stableOptions.onError?.(errorMessage);

        if (isDevelopment) {
          console.error("[useGroq] stream error:", { error: err });
        }

        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [stableOptions]
  );

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setResult(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    result,
    generate,
    generateJSON,
    stream,
    reset,
    clearError,
  };
}
