/**
 * Groq Constants
 * @description Available models and default configurations
 */

/**
 * Available Groq models
 */
export const GROQ_MODELS = {
  /** Llama 3.1 8B - Fast and efficient (560 T/s) */
  LLAMA_3_1_8B_INSTANT: "llama-3.1-8b-instant",
  /** Llama 3.3 70B - Versatile and powerful (280 T/s) */
  LLAMA_3_3_70B_VERSATILE: "llama-3.3-70b-versatile",
  /** Llama 3.1 70B - Versatile (280 T/s) */
  LLAMA_3_1_70B_VERSATILE: "llama-3.1-70b-versatile",
  /** GPT-OSS 20B - Experimental (1000 T/s) */
  GPT_OSS_20B: "openai/gpt-oss-20b",
  /** GPT-OSS 120B - Large experimental model */
  GPT_OSS_120B: "openai/gpt-oss-120b",
  /** Mixtral 8x7b - MoE model */
  MIXTRAL_8X7B: "mixtral-8x7b-32768",
  /** Gemma 2 9B - Google's model */
  GEMMA_2_9B: "gemma2-9b-it",
  /** Llama 4 Scout 17B - New model (30K T/s) */
  LLAMA_4_SCOUT_17B: "meta-llama/llama-4-scout-17b-16e-instruct",
  /** Kimi K2 - Moonshot AI model */
  KIMI_K2_INSTRUCT: "moonshotai/kimi-k2-instruct",
  /** Qwen 3 32B - Alibaba's model */
  QWEN3_32B: "qwen/qwen3-32b",
} as const;

/**
 * Default models for different use cases
 */
export const DEFAULT_MODELS = {
  TEXT: GROQ_MODELS.LLAMA_3_1_8B_INSTANT,
  FAST: GROQ_MODELS.LLAMA_3_1_8B_INSTANT,
  EXPERIMENTAL: GROQ_MODELS.GPT_OSS_20B,
} as const;

/**
 * Default generation configuration
 */
export const DEFAULT_GENERATION_CONFIG = {
  temperature: 0.7,
  maxTokens: 1024,
  topP: 1.0,
} as const;

/**
 * API endpoints
 */
export const API_ENDPOINTS = {
  CHAT: "/chat/completions",
} as const;

/**
 * Default base URL
 */
export const DEFAULT_BASE_URL = "https://api.groq.com/openai/v1" as const;

/**
 * Default timeouts
 */
export const TIMEOUTS = {
  DEFAULT: 30000, // 30 seconds
  STREAMING: 60000, // 60 seconds
} as const;
