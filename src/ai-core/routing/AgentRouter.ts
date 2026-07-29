import { IAgentContext } from '../contracts/context.types';
import { BaseAgent } from '../core/BaseAgent';
import { IAgentRegistry } from '../registries/AgentRegistry';
import { ILogger } from '../infrastructure/Logger';

export interface IAgentRouter {
  route(query: string, context: IAgentContext): Promise<BaseAgent>;
}

export class AgentRouter implements IAgentRouter {
  constructor(
    private readonly agentRegistry: IAgentRegistry,
    private readonly logger: ILogger
  ) {}

  async route(query: string, context: IAgentContext): Promise<BaseAgent> {
    const agents = this.agentRegistry.listAgents();
    if (agents.length === 0) {
      throw new Error('No registered agents found in AgentRegistry.');
    }

    const selectedMetadata = agents[0];
    const agent = this.agentRegistry.getAgent(selectedMetadata.id);
    if (!agent) {
      throw new Error(`Agent [${selectedMetadata.id}] resolved but unavailable.`);
    }

    this.logger.info(`Routed query to Agent: ${agent.metadata.name}`);
    return agent;
  }
}
