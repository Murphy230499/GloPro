import { ToolRiskLevel } from './tool.types';
import { IAgentContext } from './context.types';

export interface IPermissionManager {
  isAuthorized(context: IAgentContext, requiredPermissions: string[]): boolean;
}

export interface IConfirmationRequest {
  requestId: string;
  toolName: string;
  input: Record<string, unknown>;
  riskLevel: ToolRiskLevel;
  sessionId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface IConfirmationManager {
  requestConfirmation(toolName: string, input: Record<string, unknown>, riskLevel: ToolRiskLevel, context: IAgentContext): Promise<IConfirmationRequest>;
  approve(requestId: string): Promise<boolean>;
  reject(requestId: string): Promise<boolean>;
  getPending(requestId: string): IConfirmationRequest | undefined;
}

export interface IAuditEntry {
  id?: string;
  eventType: string;
  sessionId: string;
  userId: string;
  action: string;
  details: Record<string, unknown>;
  timestamp: Date;
}

export interface IAuditLog {
  record(entry: IAuditEntry): Promise<void>;
  query(filter: Partial<IAuditEntry>): Promise<IAuditEntry[]>;
}
