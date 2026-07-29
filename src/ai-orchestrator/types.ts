import { IAgentResponse, IAgentContext } from '@/ai-core';

export interface IExecutionStep {
  stepIndex: number;
  agentId: string;
  agentName: string;
  toolName: string;
  query: string;
  args: Record<string, unknown>;
  requiresConfirmation: boolean;
  status: 'pending' | 'executing' | 'completed' | 'failed' | 'awaiting_confirmation' | 'rolled_back';
  outputData?: unknown;
  error?: string;
}

export interface IExecutionPlan {
  planId: string;
  originalPrompt: string;
  steps: IExecutionStep[];
  status: 'planning' | 'in_progress' | 'completed' | 'failed' | 'awaiting_confirmation';
}

export interface IOrchestratorResult {
  sessionId: string;
  originalPrompt: string;
  plan: IExecutionPlan;
  finalResponseText: string;
  executedStepsCount: number;
  hasPendingConfirmation: boolean;
  error?: string;
}
