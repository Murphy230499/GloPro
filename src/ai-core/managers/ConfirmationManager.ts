import { IConfirmationManager, IConfirmationRequest } from '../contracts/security.types';
import { ToolRiskLevel } from '../contracts/tool.types';
import { IAgentContext } from '../contracts/context.types';
import { IEventBus } from '../contracts/events.types';
import { ILogger } from '../infrastructure/Logger';

export class ConfirmationManager implements IConfirmationManager {
  private readonly pending = new Map<string, IConfirmationRequest>();

  constructor(
    private readonly eventBus: IEventBus,
    private readonly logger: ILogger
  ) {}

  async requestConfirmation(
    toolName: string,
    input: Record<string, unknown>,
    riskLevel: ToolRiskLevel,
    context: IAgentContext
  ): Promise<IConfirmationRequest> {
    const requestId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `req_${Date.now()}_${Math.random()}`;
    const req: IConfirmationRequest = {
      requestId,
      toolName,
      input,
      riskLevel,
      sessionId: context.sessionId,
      status: 'PENDING'
    };
    this.pending.set(req.requestId, req);
    this.logger.warn(`Human confirmation requested [${req.requestId}] for tool: ${toolName}`);
    await this.eventBus.emit('confirmation:requested', req);
    return req;
  }

  async approve(requestId: string): Promise<boolean> {
    const req = this.pending.get(requestId);
    if (!req) return false;
    req.status = 'APPROVED';
    await this.eventBus.emit('confirmation:resolved', req);
    return true;
  }

  async reject(requestId: string): Promise<boolean> {
    const req = this.pending.get(requestId);
    if (!req) return false;
    req.status = 'REJECTED';
    await this.eventBus.emit('confirmation:resolved', req);
    return true;
  }

  getPending(requestId: string): IConfirmationRequest | undefined {
    return this.pending.get(requestId);
  }
}
