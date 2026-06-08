/**
 * @umituz/web-ai-groq-provider
 * Groq AI text generation and chat provider for React web applications.
 *
 * @author umituz
 * @license MIT
 *
 * Subpath imports for tree-shaking:
 * - @umituz/web-ai-groq-provider/groq
 * - @umituz/web-ai-groq-provider/chat
 */

export * from "./domains/groq/index";
export * from "./domains/chat/index";

export { configureProvider, getProvider, resetProvider } from "./provider";
export type { AppContainer } from "./provider";
