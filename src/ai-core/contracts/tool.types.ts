import { IAgentContext } from './context.types';

export type ToolRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface IToolValidationResult {
  valid: boolean;
  errors?: string[];
}

export interface IToolMetadata {
  name: string;
  description: string;
  parametersSchema: Record<string, unknown>;
  requiredPermissions: string[];
  riskLevel: ToolRiskLevel;
  requiresHumanConfirmation: boolean;
  supportsRollback: boolean;
}

export interface IToolResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  executionTimeMs: number;
  rolledBack?: boolean;
}

export interface IToolRollbackResult {
  success: boolean;
  error?: string;
}
