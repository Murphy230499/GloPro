import { IToolResult } from '../contracts/tool.types';
import { IAgentContext } from '../contracts/context.types';
import { IToolRegistry } from '../registries/ToolRegistry';
import { IPermissionManager, IConfirmationManager, IAuditLog } from '../contracts/security.types';
import { ILogger } from '../infrastructure/Logger';
import { IEventBus } from '../contracts/events.types';

export interface IToolExecutor {
  execute(toolName: string, input: Record<string, unknown>, context: IAgentContext): Promise<IToolResult>;
}

export class ToolExecutor implements IToolExecutor {
  constructor(
    private readonly toolRegistry: IToolRegistry,
    private readonly permissionManager: IPermissionManager,
    private readonly confirmationManager: IConfirmationManager,
    private readonly auditLog: IAuditLog,
    private readonly logger: ILogger,
    private readonly eventBus: IEventBus
  ) {}

  async execute(toolName: string, input: Record<string, unknown>, context: IAgentContext): Promise<IToolResult> {
    const startTime = Date.now();
    const tool = this.toolRegistry.getTool(toolName);
    if (!tool) {
      throw new Error(`Tool [${toolName}] not found in ToolRegistry.`);
    }

    // 1. Permissions Check
    if (!this.permissionManager.isAuthorized(context, tool.metadata.requiredPermissions)) {
      throw new Error(`Permission denied for tool execution: ${toolName}`);
    }

    // 2. Human Confirmation Check
    if (tool.metadata.requiresHumanConfirmation) {
      const confirmReq = await this.confirmationManager.requestConfirmation(toolName, input, tool.metadata.riskLevel, context);
      if (confirmReq.status !== 'APPROVED') {
        return { success: false, error: 'Awaiting human confirmation approval.', executionTimeMs: Date.now() - startTime };
      }
    }

    // 3. Execution
    try {
      const result = await tool.execute(input, context);
      const execTime = Date.now() - startTime;

      await this.auditLog.record({
        eventType: 'TOOL_EXECUTION',
        sessionId: context.sessionId,
        userId: context.userId,
        action: toolName,
        details: { input, success: result.success },
        timestamp: new Date()
      });

      await this.eventBus.emit('tool:executed', { toolName, success: result.success, executionTimeMs: execTime });

      return { ...result, executionTimeMs: execTime };
    } catch (err: any) {
      this.logger.error(`Tool execution failed [${toolName}]`, err);
      return { success: false, error: err.message, executionTimeMs: Date.now() - startTime };
    }
  }
}
