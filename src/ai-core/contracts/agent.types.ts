import { IAgentContext } from './context.types';

export interface IAgentMetadata {
  id: string;
  name: string;
  description: string;
  version: string;
  capabilities: string[];
}

export interface IExecutedToolCall {
  toolName: string;
  args: Record<string, unknown>;
  result: unknown;
}

export interface IAgentResponse {
  sessionId: string;
  content: string;
  toolCallsExecuted: IExecutedToolCall[];
  metadata: Record<string, unknown>;
}

export interface IAgent {
  readonly metadata: IAgentMetadata;
  execute(query: string, context: IAgentContext): Promise<IAgentResponse>;
}
