# TEST_SCENARIOS.md

Manual test scenarios for `@umituz/web-ai-groq-provider`.

This document is the single source of truth for verifying the library
behaves correctly in a real React + browser environment. Automated
unit tests are intentionally out of scope for the current iteration —
all checks below are reproducible by hand in a `vite`/`next.js` dev
server using the public API.

Each scenario has:
- **Setup**: what you need before running
- **Steps**: the exact actions to take
- **Expected**: the verifiable outcome
- **Fails when**: symptoms of a regression

Use a real Groq API key. None of the scenarios require network mocking
except where noted.

---

## Prerequisites

```bash
cd /Users/umituz/Desktop/github/umituz/apps/web/web-npm-packages/web-ai-groq-provider
npm install
npm run typecheck   # must succeed before any test
npm run lint        # must succeed before any test
npm run build       # must produce dist/ successfully
```

Sandbox app for manual runs (minimal):

```tsx
// app.tsx
import { useState } from "react";
import { configureProvider, useGroq, useChat, getProvider } from "@umituz/web-ai-groq-provider";

configureProvider({ apiKey: import.meta.env.VITE_GROQ_API_KEY! });

export function App() {
  return <ChatDemo />;
}

function ChatDemo() {
  const container = getProvider();
  if (!container) return <p>Provider not configured</p>;
  const { messages, sendMessage, isLoading, error, cancel } = useChat(
    { conversationId: "demo-1", stream: false },
    { chatService: container.chat },
  );
  const [input, setInput] = useState("");
  return (
    <div>
      <input value={input} onChange={(e) => setInput(e.target.value)} />
      <button onClick={() => sendMessage(input).then(() => setInput(""))} disabled={isLoading}>
        Send
      </button>
      <button onClick={cancel} disabled={!isLoading}>Cancel</button>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {messages.map((m) => (
        <p key={m.id}><b>{m.sender}:</b> {m.content}</p>
      ))}
    </div>
  );
}
```

---

## Section 1 — Setup & Configuration

### 1.1 Invalid API key is rejected

**Setup:** No key in env, or an obviously bad key.
**Steps:**
1. `configureProvider({ apiKey: "short" })`
**Expected:** Throws a `GroqError` whose `type` is `INVALID_API_KEY` and whose `message` mentions the minimum length.
**Fails when:** The error type is `UNKNOWN_ERROR`, the message is empty, or no error is thrown.

### 1.2 Valid API key passes validation

**Setup:** A real key with length ≥ 10.
**Steps:**
1. `configureProvider({ apiKey: "gsk_REAL_KEY_HERE_1234567890" })`
**Expected:** Returns an `AppContainer` with `textGeneration`, `chat`, and `groqHttpClient` populated.
**Fails when:** `getProvider()` returns `null` after a successful call.

### 1.3 `getProvider()` returns null before configuration

**Setup:** Fresh page load, no `configureProvider` call.
**Steps:**
1. `getProvider()`
**Expected:** Returns `null`.
**Fails when:** Returns a container or throws.

### 1.4 `resetProvider()` clears state

**Setup:** Configure, then reset.
**Steps:**
1. `configureProvider({ apiKey: "gsk_REAL_KEY" })`
2. `getProvider()` → container
3. `resetProvider()`
4. `getProvider()` → null
**Expected:** In-flight requests are aborted; subsequent `getProvider()` returns `null`.
**Fails when:** Container remains, or pending requests continue executing.

### 1.5 Re-configuration resets transport

**Setup:** First config with a bad endpoint, then with the real one.
**Steps:**
1. `configureProvider({ apiKey: "gsk_...", baseUrl: "https://invalid.example" })` → may throw on first request
2. `configureProvider({ apiKey: "gsk_..." })` (no baseUrl)
**Expected:** Second call uses the default Groq base URL; requests succeed.
**Fails when:** The second config still uses the invalid base URL.

---

## Section 2 — useGroq: `generate`

### 2.1 Successful completion

**Setup:** Configured provider.
**Steps:**
1. `const { generate, isLoading, result, error } = useGroq({}, deps)`
2. `await generate("Say hi in one word")`
**Expected:** `result` contains a non-empty string; `isLoading` flips `true → false`; `error` is `null`.
**Fails when:** `result` is null, `isLoading` is stuck `true`, or `error` is set.

### 2.2 Per-call options override hook defaults

**Setup:** Hook with `temperature: 0.1` in `generationConfig`.
**Steps:**
1. `const { generate } = useGroq({ generationConfig: { temperature: 0.1, maxTokens: 50 } }, deps)`
2. `await generate("Tell me a joke", { temperature: 0.9, maxTokens: 200 })`
**Expected:** Request uses `temperature: 0.9`, `maxTokens: 200`.
**Fails when:** Either value reflects the hook default instead of the per-call override.

### 2.3 Empty prompt is rejected at the API layer

**Steps:**
1. `await generate("")`
**Expected:** The call resolves with either an error or an empty result; `error` is set to a user-friendly message; no uncaught throw.
**Fails when:** The hook throws an unhandled error to the console.

### 2.4 Repeated identical calls hit the cache

**Setup:** Same prompt, same model, same config.
**Steps:**
1. `await generate("cache me")` — record `Date.now()`
2. `await generate("cache me")` — record `Date.now()`
**Expected:** Second call returns noticeably faster (no network round-trip).
**Fails when:** Both calls take the same wall-clock time.

### 2.5 Different config skips the cache

**Setup:** Same prompt.
**Steps:**
1. `await generate("hi", { maxTokens: 50 })`
2. `await generate("hi", { maxTokens: 200 })`
**Expected:** Both calls hit the network.
**Fails when:** Second call is suspiciously fast (cache leak).

### 2.6 `cancel()` aborts an in-flight request

**Setup:** Use a long prompt that takes several seconds.
**Steps:**
1. Start `await generate("Write a 500-word essay")`
2. Within 200 ms, call `cancel()`
**Expected:** `isLoading` becomes `false`; `error` remains `null`; the promise resolves to `null`; no unhandled console error.
**Fails when:** `isLoading` stays `true`, the promise rejects, or the result is set.

### 2.7 `reset()` clears state without cancelling the cache

**Steps:**
1. `generate("hi")` → `result: "hi"`
2. `reset()`
3. `result` is `null`, `error` is `null`, `isLoading` is `false`
**Expected:** Subsequent `generate("hi")` still hits the cache.
**Fails when:** The second call goes to the network (cache was inadvertently cleared).

### 2.8 `clearError()` clears error only

**Steps:**
1. Force a 401 (bad key)
2. `generate("x")` → `error: "..."`
3. `clearError()`
4. `error` is `null`; `result` is unchanged
**Expected:** State is restored to a clean state without triggering a new request.
**Fails when:** A new request is dispatched on `clearError()`.

---

## Section 3 — useGroq: `generateJSON`

### 3.1 Returns parsed object

**Steps:**
1. `await generateJSON<{ ok: boolean }>('Reply as JSON: {"ok": true}')`
**Expected:** Returns `{ ok: true }` (not a string). `result` contains the JSON string representation.
**Fails when:** Returns a string, or the parse fails with `UNKNOWN_ERROR`.

### 3.2 Schema in options is forwarded to the model

**Steps:**
1. `await generateJSON("...", { schema: { type: "object", properties: { x: { type: "number" } }, required: ["x"] } })`
**Expected:** Output is `{ x: number }`. Inspect the model prompt via your own logging to confirm schema was included.
**Fails when:** Output does not match the schema, or schema is silently dropped.

### 3.3 Invalid JSON response throws

**Setup:** Force a bad response (e.g., model that emits prose).
**Steps:**
1. `await generateJSON("Tell me a story")`
**Expected:** Rejects with `GroqError(type: UNKNOWN_ERROR, message: "Failed to parse structured response as JSON")`.
**Fails when:** The hook silently returns `{}` or a non-error.

### 3.4 Lower temperature is used for structured output

**Setup:** Hook with `temperature: 0.9`.
**Steps:**
1. Inspect the outgoing `request.temperature` for `generateStructured`.
**Expected:** It is `0.1` (the structured-output constant), not `0.9`.
**Fails when:** The user-supplied `0.9` is forwarded unchanged, causing unstable output.

---

## Section 4 — useGroq: `stream`

### 4.1 Chunks arrive incrementally

**Setup:** Prompt that produces a long answer.
**Steps:**
1. `let out = ""; await stream("Explain HTTP in 5 sentences", (c) => out += c)`
**Expected:** `onChunk` is called multiple times with non-empty fragments; final `out` matches the complete response.
**Fails when:** `onChunk` is called exactly once with the full text (no streaming).

### 4.2 `onSuccess` receives the full text

**Steps:**
1. Pass `onSuccess: (t) => console.log(t)` via hook options.
2. `stream("Say hi", () => {})`
**Expected:** `onSuccess` is called once with the full text.
**Fails when:** `onSuccess` is called with each chunk, or never.

### 4.3 Stream error surfaces through `error`

**Setup:** Force a failure mid-stream (e.g., abort the request).
**Steps:**
1. `await stream("...", () => {})` then `cancel()`
**Expected:** The promise resolves to `null`; `error` is `null` (cancel is not an error).
**Fails when:** The promise rejects with an `AbortError`.

### 4.4 Streaming without config still works

**Steps:**
1. `useGroq({})` → `stream("hi", () => {})`
**Expected:** Default model and config are used.
**Fails when:** A `MISSING_CONFIG` error is thrown.

---

## Section 5 — useChat

### 5.1 Send a message and get a response

**Setup:** `useChat({ conversationId: "x" }, { chatService })`
**Steps:**
1. `await sendMessage("Hello")`
**Expected:** `messages` contains two entries: the user message, then the assistant reply. `isLoading` and `isTyping` return to `false`.
**Fails when:** Only the user message is appended; or `isLoading` is stuck.

### 5.2 Empty/whitespace text is rejected

**Steps:**
1. `await sendMessage("   ")` and `await sendMessage("")`
**Expected:** Both resolve to `null` without changing state.
**Fails when:** A request is sent, or `isLoading` becomes `true`.

### 5.3 Second `sendMessage` while loading is a no-op

**Steps:**
1. `sendMessage("first long prompt")`
2. Immediately `sendMessage("second")` (before the first resolves)
**Expected:** Only the first message is in `messages`; the second call resolves to `null`; the second text is never sent.
**Fails when:** Both messages are appended and two requests fly.

### 5.4 `regenerate` replaces only the last AI reply

**Setup:** Conversation with `[user, assistant, user, assistant]`.
**Steps:**
1. `regenerate()`
**Expected:** Final `messages` is `[user, assistant, user, NEW_assistant]`. The original last AI message is gone.
**Fails when:** Messages grow to 5 entries (AI message is appended instead of replaced).

### 5.5 `regenerate` on empty conversation is a no-op

**Steps:**
1. `regenerate()`
**Expected:** Resolves to `null`; no error; no state change.
**Fails when:** The hook throws or sets an error.

### 5.6 `regenerate` without any user message is a no-op

**Setup:** `messages: [assistant]`.
**Steps:**
1. `regenerate()`
**Expected:** Resolves to `null`; no request issued.
**Fails when:** The hook attempts a request and sets an error.

### 5.7 `cancel` aborts an in-flight send

**Steps:**
1. `sendMessage("very long prompt")` (returns a promise)
2. `cancel()` before it resolves
**Expected:** `isLoading` and `isTyping` go to `false`; the `sendMessage` promise resolves to `null`; `error` remains `null`.
**Fails when:** The promise rejects; `isLoading` is stuck.

### 5.8 `clearMessages` wipes the list

**Steps:**
1. `sendMessage("hi")`
2. `clearMessages()`
**Expected:** `messages` is `[]`; `error` is `null`.
**Fails when:** Messages remain or error is set.

### 5.9 `clearError` clears error only

**Steps:**
1. Force a 500 error.
2. `clearError()`
**Expected:** `error` is `null`; `messages` is unchanged.
**Fails when:** A new request is issued as a side-effect.

### 5.10 `reset` clears transient state, keeps messages

**Steps:**
1. `sendMessage("hi")` — succeeds
2. `reset()`
**Expected:** `messages` still contains the conversation; `isLoading`, `isTyping`, `error` are reset.
**Fails when:** Messages are wiped (that's `clearMessages`).

### 5.11 `updateConfig` propagates to the service

**Steps:**
1. `updateConfig({ temperature: 0.2 })`
2. `sendMessage("hi")` → inspect the outgoing request.
**Expected:** `request.temperature` is `0.2` (or `0.1` for structured if applicable).
**Fails when:** Temperature remains at the previous value.

### 5.12 Storage: messages are loaded on mount

**Setup:** `IChatStorage` that returns `[{ id: "1", sender: "user", content: "hi", timestamp: "..." }]` for `getMessages("x")`.
**Steps:**
1. Mount `useChat({ conversationId: "x", storage: myStorage }, ...)`
**Expected:** Initial `messages` contains the storage-loaded message; no request to Groq is made.
**Fails when:** `messages` is empty or an error is set.

### 5.13 Storage: new messages are persisted

**Setup:** `IChatStorage` with a `saveMessage` spy.
**Steps:**
1. `sendMessage("hi")`
**Expected:** `saveMessage` is called twice (user + assistant) with the correct `conversationId`.
**Fails when:** Only one call, or wrong id, or `saveMessage` not called at all.

### 5.14 Storage: errors are surfaced

**Setup:** `IChatStorage.saveMessage` that throws.
**Steps:**
1. `sendMessage("hi")`
**Expected:** `onError` is called with a user-friendly message; `error` state is set; the in-memory message list is still updated.
**Fails when:** The error is silently swallowed, or the message is not added to `messages`.

### 5.15 Storage: `autoSave: false` skips persistence

**Setup:** `useChat({ autoSave: false, storage: myStorage }, ...)`
**Steps:**
1. `sendMessage("hi")`
**Expected:** `saveMessage` is not called.
**Fails when:** `saveMessage` is called despite `autoSave: false`.

### 5.16 Streaming: `stream: true` produces incremental AI messages

**Setup:** `useChat({ stream: true }, ...)`
**Steps:**
1. `sendMessage("Tell me a story")`
**Expected:** A new assistant message appears immediately with empty content; content grows as chunks arrive; `isTyping` stays `true` until completion.
**Fails when:** The assistant message appears all at once at the end.

### 5.17 Streaming: cancel mid-stream keeps the partial message

**Steps:**
1. With `stream: true`, start `sendMessage("very long")`
2. `cancel()` after the first chunk
**Expected:** The partial assistant message remains in `messages` (with whatever was streamed so far); `isTyping` is `false`; no error.
**Fails when:** The partial message is removed, or an error is set.

---

## Section 6 — Errors & Error Types

### 6.1 401 → `INVALID_API_KEY`

**Setup:** A real but revoked API key.
**Steps:**
1. `useGroq(...).generate("hi")`
**Expected:** `error` mentions the API key; the underlying `GroqError.type` is `INVALID_API_KEY`.
**Fails when:** `error` is generic, or type is `UNKNOWN_ERROR`.

### 6.2 403 → `INVALID_API_KEY`

**Setup:** Key with insufficient permissions.
**Steps:** Same as 6.1.
**Expected:** Same as 6.1.

### 6.3 404 → `CLIENT_ERROR` (NOT `INVALID_API_KEY`)

**Setup:** Hit a path that doesn't exist (rare; requires custom `baseUrl`).
**Steps:** Configure a bad endpoint and trigger a request.
**Expected:** `GroqError.type === "CLIENT_ERROR"`.
**Fails when:** Type is `INVALID_API_KEY` (regression of the original 4xx mapping bug).

### 6.4 429 → `RATE_LIMIT_ERROR`

**Setup:** Send 30+ rapid requests with a small free-tier key.
**Steps:** Loop `generate("hi")` until the API rejects.
**Expected:** `error` mentions rate limit; `GroqError.type === "RATE_LIMIT_ERROR"`.
**Fails when:** Type is anything else.

### 6.5 5xx → `SERVER_ERROR`

**Setup:** Force a server error (rare; can simulate by mocking `fetch`).
**Expected:** `GroqError.type === "SERVER_ERROR"`.
**Fails when:** Type is `UNKNOWN_ERROR`.

### 6.6 Network down → `NETWORK_ERROR`

**Setup:** Disable network (DevTools "Offline").
**Steps:** `generate("hi")`
**Expected:** `GroqError.type === "NETWORK_ERROR"`. `error` says network/connection.
**Fails when:** Type is `UNKNOWN_ERROR`.

### 6.7 Manual abort → `ABORT_ERROR` swallowed, returns null

**Steps:** `cancel()` during a request.
**Expected:** No error state; promise resolves to `null`.
**Fails when:** `error` is set to "Request was aborted".

### 6.8 `GroqError.toJSON()` is round-trip safe

**Steps:** In a console:
```js
const err = new GroqError("INVALID_API_KEY", "x", undefined, { status: 401 });
JSON.stringify(err);
```
**Expected:** `{"name":"GroqError","type":"INVALID_API_KEY","message":"x","metadata":{"status":401}}`.
**Fails when:** Output is `{}` (default Error serialization).

### 6.9 `formatErrorForLogging` handles non-Error values

**Steps:** `formatErrorForLogging("oops")`, `formatErrorForLogging(42)`, `formatErrorForLogging({ a: 1 })`.
**Expected:** Each returns `{ message, type, ... }` without throwing.
**Fails when:** Any call throws.

---

## Section 7 — Strategies

### 7.1 Retry: a transient 5xx is retried up to 3 times

**Setup:** Mock the fetch to return 500 twice, then 200.
**Expected:** The request eventually succeeds; total of 3 calls.
**Fails when:** The first 500 is propagated to the caller without retry.

### 7.2 Retry: a 400 is NOT retried

**Setup:** Mock the fetch to return 400.
**Expected:** Exactly one call; error propagates immediately.
**Fails when:** More than one call is made.

### 7.3 Dedupe: concurrent identical requests share one network call

**Setup:** Mock fetch with a counter.
**Steps:** `Promise.all([generate("x"), generate("x"), generate("x")])`
**Expected:** Only 1 actual fetch.
**Fails when:** 3 fetches are made.

### 7.4 Dedupe: requests with different prompts do NOT dedupe

**Steps:** `Promise.all([generate("a"), generate("b")])`
**Expected:** 2 fetches.
**Fails when:** Only 1 fetch.

### 7.5 Queue: more than 3 concurrent requests are queued

**Setup:** Mock fetch with delay; 5 concurrent calls.
**Expected:** At most 3 are in flight at any time; total throughput respects queue ordering.
**Fails when:** All 5 fire at once (queue bypassed).

### 7.6 Composite: ordering is Dedupe → Retry → Queue

**Setup:** A request that fails twice then succeeds.
**Expected:** The retries happen within the queue slot (i.e., the queue is not released during retries).
**Fails when:** The queue slot is released on each retry (other requests jump in mid-retry).

---

## Section 8 — Storage (chat)

### 8.1 `getConversation` requires `setStorage`

**Setup:** No `setStorage` call.
**Steps:** `chatService.getConversation("x")`
**Expected:** Throws `GroqError(type: MISSING_CONFIG, ...)`.
**Fails when:** Returns `null` silently.

### 8.2 `getConversation` returns a derived summary

**Setup:** Storage returns 3 messages: `[{ sender: "user", metadata: { companionId: "abc", companionName: "Ada" }, ... }, ...]`.
**Expected:** Returns a `ChatConversation` with `messageCount: 3`, `lastMessage` = the 3rd message, `companionId: "abc"`, `companionName: "Ada"`.
**Fails when:** Fields are missing or wrong.

### 8.3 `getConversations` returns `[]` by default

**Setup:** Default `ChatService` (no override).
**Steps:** `chatService.getConversations()`
**Expected:** Returns `[]` (multi-conversation aggregation is the host app's responsibility).
**Fails when:** Throws or returns fabricated data.

### 8.4 `extractTokenUsage` reads metadata correctly

**Setup:** A message whose `metadata.usage` is `{ prompt_tokens: 5, completion_tokens: 3, total_tokens: 8 }`.
**Expected:** `extractTokenUsage(msg)` returns `{ promptTokens: 5, completionTokens: 3, totalTokens: 8 }`.
**Fails when:** Returns `null` despite the presence of the field.

### 8.5 `extractTokenUsage` returns null for missing usage

**Setup:** A message with no `metadata` or `metadata.usage`.
**Expected:** Returns `null`.
**Fails when:** Throws or returns a partial object.

---

## Section 9 — Tree-shaking and bundle

### 9.1 Subpath import for groq only

**Steps:** In a consumer app, import only from `@umituz/web-ai-groq-provider/groq`.
**Expected:** The chat domain is not in the bundle (verify with a bundle analyzer).
**Fails when:** Chat code is bundled.

### 9.2 Subpath import for chat only

**Steps:** Import only from `@umituz/web-ai-groq-provider/chat`.
**Expected:** Groq internals (transport, strategies, builders) are not bundled unless transitively required.
**Fails when:** Everything is bundled.

### 9.3 Build emits both CJS and ESM with types

**Steps:** `npm run build`
**Expected:** `dist/index.js`, `dist/index.cjs`, `dist/index.d.ts`, and matching files for `domains/groq` and `domains/chat`.
**Fails when:** Any of these is missing or has the wrong format.

---

## Section 10 — Edge cases & robustness

### 10.1 Rapid mount/unmount does not crash

**Setup:** Render a `useGroq` component, then immediately unmount and remount 10 times.
**Expected:** No console errors; no "setState on unmounted component" warnings.
**Fails when:** A warning or error is logged.

### 10.2 Two independent `useGroq` components do not cancel each other

**Steps:** Mount two `useGroq` components; cancel the first.
**Expected:** The second's in-flight request continues.
**Fails when:** The second's request is also aborted (regression of the cross-component cancellation bug).

### 10.3 Long prompt beyond model context

**Setup:** A 50k-token prompt.
**Expected:** The model returns a 4xx with `CLIENT_ERROR` or the model emits a truncated response. The hook surfaces the result, not a crash.
**Fails when:** The hook throws a `TypeError` or hangs.

### 10.4 `configureProvider` with whitespace-only key

**Steps:** `configureProvider({ apiKey: "          " })`
**Expected:** Throws `INVALID_API_KEY` (key fails length check after trim).
**Fails when:** Provider is configured with the whitespace key.

### 10.5 `setApiKey` propagates

**Setup:** Configure, then call `groqHttpClient.setApiKey("gsk_NEW_...")`.
**Steps:** `groqHttpClient.getApiKey()`
**Expected:** Returns the new key.
**Fails when:** The old key is still returned, or `MISSING_CONFIG` is thrown.

### 10.6 `cancel()` from a different component does not affect this one

**Setup:** Two `useGroq` components share a text-generation service via DI.
**Steps:** `cancel()` on component A; verify component B's request continues.
**Expected:** Only A's request is aborted.
**Fails when:** Both are cancelled.

---

## Section 11 — Accessibility & i18n

(These verify the public surface is i18n-friendly, not that the library
itself ships localized strings — it intentionally does not.)

### 11.1 No hardcoded user-visible strings in the library

**Steps:** `grep -r '"' src/ | grep -v 'src/.*\.\(ts\|tsx\):.*\*' | grep -v "type\|@type\|interface\|const\|export"`
**Expected:** No user-facing English strings (e.g., "Please wait", "Network error") are hardcoded; the only strings present are technical identifiers, log messages, or default prompts that the consumer is expected to override.
**Fails when:** A new "Coming soon" or "TODO" string is added without a localization path.

### 11.2 Errors expose a `type` field for i18n mapping

**Setup:** Trigger any error.
**Steps:** Inspect the caught error.
**Expected:** `error.type` is one of the `GroqErrorType` enum values; the consumer maps it to a localized message.
**Fails when:** The error has no `type` field, or only a `message`.

---

## Section 12 — Type safety (compile-time)

### 12.1 Hooks without deps throw a clear error at runtime

**Steps:** `useGroq()` (no deps), `useChat({ ... })` (no deps).
**Expected:** Both throw an explicit error mentioning the missing dependency.
**Fails when:** They silently use an unconfigured global.

### 12.2 Public types are exported

**Steps:** `import type { GroqConfig, ChatMessage, UseChatReturn } from "@umituz/web-ai-groq-provider"`.
**Expected:** All compile, all surfaces are documented in `index.d.ts`.
**Fails when:** A type is missing from the bundle.

### 12.3 `exactOptionalPropertyTypes` semantics

The project intentionally does not enable `exactOptionalPropertyTypes`
because several consumer APIs would become awkward. If a consumer does
enable it, the library should still compile and work. Verify by
spinning up a sandbox app with that flag set.

---

## Quick smoke test (90 seconds)

For a quick sanity check after any change:

```bash
cd /Users/umituz/Desktop/github/umituz/apps/web/web-npm-packages/web-ai-groq-provider
npm run typecheck && npm run lint && npm run build
```

Then in the sandbox app:

1. Configure the provider.
2. Click "Send" with the text "Say hi".
3. Expect: an assistant reply within 5 seconds, no error.
4. Click "Cancel" mid-stream of a long prompt.
5. Expect: `isTyping` resets, no error.
6. Refresh the page (storage: in-memory, so messages are lost — that's expected).

If all six steps pass, the library is healthy for that iteration.

---

## Reporting failures

When a scenario fails, capture:
- Scenario id (e.g., 5.7)
- Browser and version
- Console output (full, not edited)
- Network tab (especially for HTTP error scenarios)
- React StrictMode on/off
- Output of `npm run typecheck && npm run lint`
- The exact commit SHA of the library

These are the minimum signals needed to reproduce and fix.
