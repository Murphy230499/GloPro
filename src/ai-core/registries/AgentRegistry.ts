import { IAgentMetadata } from '../contracts/agent.types';
import { BaseAgent } from '../core/BaseAgent';
import { ILogger } from '../infrastructure/Logger';

export interface IAgentRegistry {
  register(agent: BaseAgent): void;
  getAgent(id: string): BaseAgent | undefined;
  listAgents(): IAgentMetadata[];
}

export class AgentRegistry implements IAgentRegistry {
  private readonly agents = new Map<string, BaseAgent>();

  constructor(private readonly logger: ILogger) {}

  register(agent: BaseAgent): void {
    this.agents.set(agent.metadata.id, agent);
    this.logger.debug(`Registered agent: ${agent.metadata.name}`);
  }

  getAgent(id: string): BaseAgent | undefined {
    return this.agents.get(id);
  }

  listAgents(): IAgentMetadata[] {
    return Array.from(this.agents.values()).map(a => a.metadata);
  }
}
