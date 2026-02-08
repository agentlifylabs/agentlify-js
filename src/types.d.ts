/**
 * TypeScript type definitions for Agentlify
 * OpenAI-compatible types for intelligent model routing
 */

export interface AgentlifyConfig {
  /** Agentlify API key (required) */
  apiKey: string;
  /** Base URL for Agentlify API */
  baseURL?: string;
  /** Router ID to use for requests */
  routerId?: string;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Default headers to include */
  defaultHeaders?: Record<string, string>;
  /** Maximum number of retries */
  maxRetries?: number;
}

export interface ChatMessage {
  /** The role of the message author */
  role: 'system' | 'user' | 'assistant' | 'function' | 'tool';
  /** The content of the message */
  content?: string;
  /** The name of the function to call */
  name?: string;
  /** Function call information */
  function_call?: {
    name: string;
    arguments: string;
  };
  /** Tool calls made by the assistant */
  tool_calls?: ToolCall[];
  /** Tool call ID for tool messages */
  tool_call_id?: string;
}

export interface ToolCall {
  /** Unique identifier for the tool call */
  id: string;
  /** Type of tool call */
  type: 'function';
  /** Function call details */
  function: {
    name: string;
    arguments: string;
  };
}

export interface FunctionDefinition {
  /** Function name */
  name: string;
  /** Function description */
  description?: string;
  /** Function parameters schema */
  parameters?: Record<string, any>;
}

export interface Tool {
  /** Tool type */
  type: 'function';
  /** Function definition */
  function: FunctionDefinition;
}

export interface ChatCompletionCreateParams {
  /** Array of message objects */
  messages: ChatMessage[];
  /** Model to use (optional with Agentlify routing) */
  model?: string;
  /** Maximum tokens to generate */
  max_tokens?: number;
  /** Sampling temperature (0-2) */
  temperature?: number;
  /** Nucleus sampling parameter (0-1) */
  top_p?: number;
  /** Frequency penalty (-2 to 2) */
  frequency_penalty?: number;
  /** Presence penalty (-2 to 2) */
  presence_penalty?: number;
  /** Stop sequences */
  stop?: string | string[];
  /** Enable streaming */
  stream?: boolean;
  /** Function definitions (deprecated, use tools) */
  functions?: FunctionDefinition[];
  /** Function call behavior */
  function_call?: 'none' | 'auto' | { name: string };
  /** Tool definitions */
  tools?: Tool[];
  /** Tool choice behavior */
  tool_choice?:
    | 'none'
    | 'auto'
    | { type: 'function'; function: { name: string } };
  /** Response format specification */
  response_format?: { type: 'text' | 'json_object' };
  /** User identifier */
  user?: string;
}

export interface ChatCompletionChoice {
  /** Choice index */
  index: number;
  /** Message content */
  message: ChatMessage;
  /** Finish reason */
  finish_reason:
    | 'stop'
    | 'length'
    | 'function_call'
    | 'tool_calls'
    | 'content_filter'
    | null;
}

export interface ChatCompletionUsage {
  /** Prompt tokens */
  prompt_tokens: number;
  /** Completion tokens */
  completion_tokens: number;
  /** Total tokens */
  total_tokens: number;
}

export interface ChatCompletionResponse {
  /** Unique identifier */
  id: string;
  /** Object type */
  object: 'chat.completion';
  /** Creation timestamp */
  created: number;
  /** Model used */
  model: string;
  /** Completion choices */
  choices: ChatCompletionChoice[];
  /** Token usage */
  usage: ChatCompletionUsage;
  /** Agentlify metadata */
  _meta?: {
    requestId: string;
    modelUsed: string;
    originalSelection: string;
    fallbackUsed: boolean;
    tokensUsed: number;
    cost: number;
    latency: number;
    routerMode: string;
    security: any;
    features: any;
  };
}

export interface ChatCompletionChunk {
  /** Unique identifier */
  id: string;
  /** Object type */
  object: 'chat.completion.chunk';
  /** Creation timestamp */
  created: number;
  /** Model used */
  model: string;
  /** Completion choices */
  choices: Array<{
    index: number;
    delta: Partial<ChatMessage>;
    finish_reason:
      | 'stop'
      | 'length'
      | 'function_call'
      | 'tool_calls'
      | 'content_filter'
      | null;
  }>;
}

export interface RouterConfig {
  /** Router ID */
  id: string;
  /** Router name */
  name: string;
  /** Router mode */
  mode: 'smartRouter' | 'retrieval_based';
  /** Router configuration */
  config: any;
  /** Whether router is active */
  isActive: boolean;
}

export interface Model {
  /** Model ID */
  id: string;
  /** Model name */
  name: string;
  /** Provider */
  provider: string;
  /** Whether model is available */
  available: boolean;
  /** Model capabilities */
  capabilities: {
    chat: boolean;
    functions: boolean;
    vision: boolean;
    streaming: boolean;
  };
}

// Error types
export class AgentlifyError extends Error {
  type: string;
  code?: string;
  param?: string;
}

export class APIError extends AgentlifyError {
  status: number;
  response?: any;
}

export class AuthenticationError extends APIError {}
export class RateLimitError extends APIError {}
export class InvalidRequestError extends APIError {}
export class PermissionDeniedError extends APIError {}
export class NotFoundError extends APIError {}
export class ConflictError extends APIError {}
export class UnprocessableEntityError extends APIError {}
export class InternalServerError extends APIError {}

// Chat completions stream
export class ChatCompletionStream {
  [Symbol.asyncIterator](): AsyncIterableIterator<ChatCompletionChunk>;
  toArray(): Promise<ChatCompletionChunk[]>;
  getText(): Promise<string>;
}

// Chat completions API
export class ChatCompletions {
  create(
    params: ChatCompletionCreateParams & { stream?: false },
  ): Promise<ChatCompletionResponse>;
  create(
    params: ChatCompletionCreateParams & { stream: true },
  ): Promise<ChatCompletionStream>;
  create(
    params: ChatCompletionCreateParams,
  ): Promise<ChatCompletionResponse | ChatCompletionStream>;
}

// Agent tool callback function type
export type ToolCallback = (args: Record<string, any>) => Promise<any> | any;

// Agent tool with optional callback
export interface AgentTool extends Tool {
  /**
   * Callback function to execute the tool locally.
   * When provided, the SDK will automatically execute this callback
   * when the agent requests this tool, then resume execution with the result.
   */
  callback?: ToolCallback;
  /** Webhook URL for server-side tool execution (agent config only) */
  webhookUrl?: string;
  /** Timeout for webhook calls in milliseconds */
  timeout?: number;
  /** Custom headers for webhook calls */
  headers?: Record<string, string>;
}

// Agent execution parameters
export interface AgentRunParams {
  /** Agent ID to execute */
  agentId: string;
  /** Array of message objects */
  messages: ChatMessage[];
  /**
   * Tool definitions with optional callbacks.
   * When callbacks are provided, the SDK handles tool execution locally
   * and automatically resumes the agent with results.
   */
  tools?: AgentTool[];
  /** Additional options */
  options?: Record<string, any>;
  /** Maximum tool call iterations (default: 10) */
  maxToolIterations?: number;
}

// Agent execution response metadata
export interface AgentMetadata {
  /** Agent ID */
  agent_id: string;
  /** Agent name */
  agent_name: string;
  /** Execution ID */
  execution_id: string;
  /** Number of steps executed */
  steps_executed: number;
  /** Number of skills invoked */
  skills_invoked: number;
  /** Total latency in milliseconds */
  total_latency: number;
  /** Whether tool execution is required */
  requires_tool_execution?: boolean;
}

// Agent execution response
export interface AgentResponse {
  /** Unique identifier */
  id: string;
  /** Object type */
  object: 'chat.completion';
  /** Creation timestamp */
  created: number;
  /** Model used (agent name) */
  model: string;
  /** Completion choices */
  choices: ChatCompletionChoice[];
  /** Token usage */
  usage: ChatCompletionUsage;
  /** Total cost */
  cost?: number;
  /** Cost breakdown by step */
  costBreakdown?: {
    steps: Array<{
      stepName: string;
      modelId: string;
      tokens: number;
      cost: number;
    }>;
    total: number;
    totalTokens: number;
  };
  /** Agent metadata */
  agent_metadata: AgentMetadata;
}

// Agents API
export class Agents {
  /**
   * Execute an agent with automatic tool callback handling.
   * When tools have callbacks, the SDK:
   * 1. Sends tools to the agent
   * 2. Executes callbacks locally when agent requests tools
   * 3. Automatically resumes agent with tool results
   * 4. Continues until agent completes
   */
  run(params: AgentRunParams): Promise<AgentResponse>;

  /**
   * Execute an agent without automatic tool handling.
   * Use this when you want to handle tool calls manually.
   * Returns immediately even if tool execution is required.
   */
  execute(params: AgentRunParams): Promise<AgentResponse>;
}

// Main client class
export class Agentlify {
  constructor(config: AgentlifyConfig);

  /** Chat completions API */
  chat: ChatCompletions;

  /** Agents API - execute agents with local tool callbacks */
  agents: Agents;

  /** Make authenticated request */
  request(endpoint: string, options?: any): Promise<any>;

  /** Get router configuration */
  getRouterConfig(): Promise<RouterConfig>;

  /** Get available models */
  getModels(): Promise<Model[]>;
}

export default Agentlify;
