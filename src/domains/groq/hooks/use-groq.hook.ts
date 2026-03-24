/**
 * useGroq Hook
 * @description Main React hook for Groq text generation with performance optimizations
 */

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import type { GroqGenerationConfig } from "../interfaces";
import type { TextGenerationOptions, StreamingCallbacks } from "../interfaces";
import { textGenerationService } from "../services";
import { GroqError } from "../utils/groq-error.util";
import { getUserFriendlyError } from "../utils/error.util";
import { DEFAULT_MODELS } from "../constants";
import { groqHttpClient } from "../services/http-client.service";

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
 * Hook for Groq text generation with performance optimizations
 */
export function useGroq(options: UseGroqOptions = {}): UseGroqReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  // Use ref for callbacks to avoid stale closures and unstable references
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Memoize only the stable configuration values (not callbacks)
  const stableConfig = useMemo(
    () => ({
      model: options.model,
      generationConfig: options.generationConfig,
    }),
    [options.model, options.generationConfig?.temperature, options.generationConfig?.maxTokens, options.generationConfig?.topP]
  );

  // Cleanup pending requests on unmount
  useEffect(() => {
    return () => {
      groqHttpClient.cancelPendingRequests();
    };
  }, []);

  const generate = useCallback(
    async (prompt: string, config?: GroqGenerationConfig): Promise<string> => {
      setIsLoading(true);
      setError(null);
      setResult(null);

      // Use ref to get latest callbacks without adding to dependencies
      const currentOptions = optionsRef.current;
      currentOptions.onStart?.();

      try {
        const response = await textGenerationService.generateCompletion(prompt, {
          model: stableConfig.model,
          generationConfig: {
            ...stableConfig.generationConfig,
            ...config,
          },
        });

        setResult(response);
        currentOptions.onSuccess?.(response);

        return response;
      } catch (err) {
        const errorMessage = getUserFriendlyError(
          err instanceof Error ? err : new Error("Unknown error")
        );
        setError(errorMessage);
        currentOptions.onError?.(errorMessage);

        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [stableConfig]
  );

  const generateJSON = useCallback(
    async <T = Record<string, unknown>,>(
      prompt: string,
      config?: GroqGenerationConfig & { schema?: Record<string, unknown> }
    ): Promise<T> => {
      setIsLoading(true);
      setError(null);
      setResult(null);

      const currentOptions = optionsRef.current;
      currentOptions.onStart?.();

      try {
        const response = await textGenerationService.generateStructured<T>(prompt, {
          model: stableConfig.model,
          generationConfig: {
            ...stableConfig.generationConfig,
            ...config,
          },
          schema: config?.schema,
        });

        const jsonString = JSON.stringify(response, null, 2);
        setResult(jsonString);
        currentOptions.onSuccess?.(jsonString);

        return response;
      } catch (err) {
        const errorMessage = getUserFriendlyError(
          err instanceof Error ? err : new Error("Unknown error")
        );
        setError(errorMessage);
        currentOptions.onError?.(errorMessage);

        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [stableConfig]
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

      const contentChunks: string[] = [];
      const currentOptions = optionsRef.current;
      currentOptions.onStart?.();

      try {
        const callbacks: StreamingCallbacks = {
          onChunk: (c) => {
            contentChunks.push(c); // Use array accumulation
            onChunk(c);
          },
          onComplete: (text) => {
            setResult(text);
            currentOptions.onSuccess?.(text);
          },
        };

        for await (const _ of textGenerationService.streamCompletion(
          prompt,
          callbacks,
          {
            model: stableConfig.model,
            generationConfig: {
              ...stableConfig.generationConfig,
              ...config,
            },
          }
        )) {
          // Consume the async generator
          void _;
        }
      } catch (err) {
        const errorMessage = getUserFriendlyError(
          err instanceof Error ? err : new Error("Unknown error")
        );
        setError(errorMessage);
        currentOptions.onError?.(errorMessage);

        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [stableConfig]
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
