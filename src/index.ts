/**
 * @umituz/web-ai-groq-provider
 * Groq AI text generation and chat provider for React web applications
 *
 * @author umituz
 * @license MIT
 *
 * IMPORTANT: Apps should NOT use this root barrel import.
 * Use subpath imports instead:
 * - @umituz/web-ai-groq-provider/groq - Groq API client
 * - @umituz/web-ai-groq-provider/chat - Chat functionality
 */

// Re-export domains for backward compatibility
export * from "./domains/groq/index";
export * from "./domains/chat/index";
