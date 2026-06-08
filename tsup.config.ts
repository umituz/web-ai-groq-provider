import { defineConfig } from "tsup";

/**
 * Build configuration for the @umituz/web-ai-groq-provider package.
 * Produces CJS, ESM, and type declarations for the main entry plus
 * the per-domain subpath entries (for tree-shakable imports).
 */
export default defineConfig({
  entry: {
    index: "src/index.ts",
    "domains/groq/index": "src/domains/groq/index.ts",
    "domains/chat/index": "src/domains/chat/index.ts",
  },
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  external: ["react"],
  target: "es2022",
  splitting: false,
  treeshake: true,
  sourcemap: true,
});
