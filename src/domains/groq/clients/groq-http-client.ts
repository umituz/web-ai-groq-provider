import type { GroqChatRequest, GroqChatResponse, GroqConfig } from "../entities";
import type { IGroqHttpClient, StreamRequestOptions } from "../interfaces";
import type { IRequestExecutor } from "../strategies/request-executor.strategy";
import { GroqConfigStore } from "./groq-config-store";
import { GroqHttpTransport } from "./groq-http-transport";
import { RequestDeduplicator } from "../utils/request-deduplicator.util";
import { RequestQueue } from "../utils/request-queue.util";
import { RetryManager } from "../utils/retry";
import { CompositeExecutor, DedupeExecutor, QueueExecutor, RetryExecutor } from "../strategies";
import { QUEUE_PRIORITY_USER_REQUEST } from "../constants/identifier.constants";

export interface GroqHttpClientDeps {
  readonly configStore?: GroqConfigStore;
  readonly transport?: GroqHttpTransport;
  readonly retryManager?: RetryManager;
  readonly queue?: RequestQueue;
  readonly deduplicator?: RequestDeduplicator;
}

export class GroqHttpClient implements IGroqHttpClient {
  private readonly configStore: GroqConfigStore;
  private readonly transport: GroqHttpTransport;
  private readonly executor: IRequestExecutor<[GroqChatRequest], GroqChatResponse>;

  constructor(deps: GroqHttpClientDeps = {}) {
    this.configStore = deps.configStore ?? new GroqConfigStore();
    this.transport =
      deps.transport ?? new GroqHttpTransport(this.configStore);

    const retryManager = deps.retryManager ?? new RetryManager();
    const queue = deps.queue ?? new RequestQueue();
    const deduplicator = deps.deduplicator ?? new RequestDeduplicator();

    this.executor = new CompositeExecutor<[GroqChatRequest], GroqChatResponse>([
      new DedupeExecutor<[GroqChatRequest], GroqChatResponse>(deduplicator, {
        generateKey: (request) =>
          deduplicatorKey(
            request as unknown as GroqChatRequest,
            this.configStore.get().apiKey,
          ),
      }),
      new RetryExecutor<[GroqChatRequest], GroqChatResponse>(retryManager),
      new QueueExecutor<[GroqChatRequest], GroqChatResponse>(
        queue,
        QUEUE_PRIORITY_USER_REQUEST,
      ),
    ]);
  }

  initialize(config: GroqConfig): void {
    this.configStore.initialize(config);
  }

  cancelPendingRequests(): void {
    this.transport.cancelPendingRequests();
  }

  isInitialized(): boolean {
    return this.configStore.isInitialized();
  }

  getApiKey(): string {
    return this.configStore.get().apiKey;
  }

  setApiKey(apiKey: string): void {
    this.configStore.setApiKey(apiKey);
  }

  postChatCompletion(request: GroqChatRequest): Promise<GroqChatResponse> {
    return this.executor.execute(
      (req) => this.transport.postChatCompletion(req),
      request,
    );
  }

  streamChatCompletion(
    request: GroqChatRequest,
    options?: StreamRequestOptions,
  ): Promise<ReadableStream<Uint8Array>> {
    return this.transport.streamChatCompletion(request, options);
  }

  reset(): void {
    this.transport.cancelPendingRequests();
    this.configStore.reset();
  }
}

function deduplicatorKey(request: GroqChatRequest, apiKey: string): string {
  const { model, messages, stream: _stream, ...rest } = request;
  const stable = JSON.stringify({
    apiKey,
    model,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
    ...rest,
  });
  return stable;
}
