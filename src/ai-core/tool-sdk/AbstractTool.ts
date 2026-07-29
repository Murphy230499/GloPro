import { BaseTool } from '../core/BaseTool';
import { IToolSDK } from './ITool';
import { IToolMetadata, IToolResult, IToolValidationResult, IToolRollbackResult } from '../contracts/tool.types';
import { IAgentContext } from '../contracts/context.types';
import { ILogger } from '../infrastructure/Logger';
import { IAuditLog } from '../contracts/security.types';

export abstract class AbstractTool<TInput = Record<string, unknown>, TOutput = unknown>
  extends BaseTool<TInput, TOutput>
  implements IToolSDK<TInput, TOutput>
{
  abstract override readonly metadata: IToolMetadata;

  constructor(
    protected readonly logger?: ILogger,
    protected readonly auditLog?: IAuditLog
  ) {
    super();
  }

  // 1. Name & Description Shortcuts
  get name(): string {
    return this.metadata.name;
  }

  get description(): string {
    return this.metadata.description;
  }

  // 2. Permission Check
  hasPermission(context: IAgentContext): boolean {
    if (!this.metadata.requiredPermissions || this.metadata.requiredPermissions.length === 0) {
      return true;
    }
    const userPerms = new Set(context.permissions || []);
    return this.metadata.requiredPermissions.every(p => userPerms.has(p) || userPerms.has('*'));
  }

  // 3. Validation Hook
  validate(input: TInput): IToolValidationResult {
    if (!input || typeof input !== 'object') {
      return { valid: false, errors: ['Input must be a valid object.'] };
    }
    return { valid: true };
  }

  // 4. Confirmation Hook
  requiresConfirmation(input: TInput, context: IAgentContext): boolean {
    return this.metadata.requiresHumanConfirmation || this.metadata.riskLevel === 'HIGH' || this.metadata.riskLevel === 'CRITICAL';
  }

  // 5. Execution Hook (Abstract - implemented by subclasses)
  abstract override execute(input: TInput, context: IAgentContext): Promise<IToolResult<TOutput>>;

  // 6. Rollback / Compensation Hook (Default no-op or overrideable)
  async rollback(input: TInput, context: IAgentContext, previousResult: IToolResult<TOutput>): Promise<IToolRollbackResult> {
    this.log('warn', `Rollback triggered for tool [${this.name}]`, { input, previousResult });
    if (!this.metadata.supportsRollback) {
      return { success: false, error: `Tool [${this.name}] does not support rollback.` };
    }
    return { success: true };
  }

  // 7. Structured Logging Hook
  log(level: 'debug' | 'info' | 'warn' | 'error', message: string, meta?: Record<string, unknown>): void {
    if (this.logger) {
      this.logger[level](`[Tool:${this.name}] ${message}`, meta);
    }
  }

  // 8. Audit Logging Hook
  async audit(action: string, input: TInput, context: IAgentContext, result?: IToolResult<TOutput>): Promise<void> {
    if (this.auditLog) {
      await this.auditLog.record({
        eventType: `TOOL_${action.toUpperCase()}`,
        sessionId: context.sessionId,
        userId: context.userId,
        action: this.name,
        details: { input, success: result?.success ?? true, error: result?.error },
        timestamp: new Date()
      });
    }
  }
}
