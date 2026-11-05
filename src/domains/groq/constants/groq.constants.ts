
export const GROQ_MODELS = {
  LLAMA_3_1_8B_INSTANT: "llama-3.1-8b-instant",
  LLAMA_3_3_70B_VERSATILE: "llama-3.3-70b-versatile",
  LLAMA_3_1_70B_VERSATILE: "llama-3.1-70b-versatile",
  GPT_OSS_20B: "openai/gpt-oss-20b",
  GPT_OSS_120B: "openai/gpt-oss-120b",
  MIXTRAL_8X7B: "mixtral-8x7b-32768",
  GEMMA_2_9B: "gemma2-9b-it",
  LLAMA_4_SCOUT_17B: "meta-llama/llama-4-scout-17b-16e-instruct",
  KIMI_K2_INSTRUCT: "moonshotai/kimi-k2-instruct",
  QWEN3_32B: "qwen/qwen3-32b",
} as const;

export const DEFAULT_MODELS = {
  TEXT: GROQ_MODELS.LLAMA_3_1_8B_INSTANT,
  FAST: GROQ_MODELS.LLAMA_3_1_8B_INSTANT,
  EXPERIMENTAL: GROQ_MODELS.GPT_OSS_20B,
} as const;

export const DEFAULT_GENERATION_CONFIG = {
  temperature: 0.7,
  maxTokens: 1024,
  topP: 1.0,
} as const;

export const API_ENDPOINTS = {
  CHAT: "/chat/completions",
} as const;

export const DEFAULT_BASE_URL = "https://api.groq.com/openai/v1" as const;

export const TIMEOUTS = {
  DEFAULT: 30000,
  STREAMING: 60000,
} as const;
