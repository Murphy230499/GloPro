import { IAgentMetadata } from '../contracts/agent.types';
import { IAgentContext } from '../contracts/context.types';
import { IToolRegistry } from '../registries/ToolRegistry';

export interface IPromptBuilder {
  buildSystemPrompt(agentMetadata: IAgentMetadata, context: IAgentContext): Promise<string>;
}

export class PromptBuilder implements IPromptBuilder {
  constructor(private readonly toolRegistry: IToolRegistry) {}

  async buildSystemPrompt(agentMetadata: IAgentMetadata, context: IAgentContext): Promise<string> {
    const availableTools = this.toolRegistry.listTools();
    const toolsJson = JSON.stringify(availableTools, null, 2);

    return `System Instruction: You are ${agentMetadata.name}.
Description: ${agentMetadata.description}
Version: ${agentMetadata.version}

Context:
Tenant ID: ${context.tenantId}
User ID: ${context.userId}
Roles: ${context.roles.join(', ')}

Available Tools:
${toolsJson}

Strictly observe permissions and invoke tools when required.`;
  }
}
