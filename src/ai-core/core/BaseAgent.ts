import { IAgent, IAgentMetadata, IAgentResponse } from '../contracts/agent.types';
import { IAgentContext } from '../contracts/context.types';
import { IPromptBuilder } from '../prompt/PromptBuilder';
import { IToolExecutor } from './ToolExecutor';
import { IConversationMemory } from '../contracts/memory.types';
import { IEventBus } from '../contracts/events.types';
import { ILogger } from '../infrastructure/Logger';
import { IToolRegistry } from '../registries/ToolRegistry';
import { BaseTool } from './BaseTool';

export abstract class BaseAgent implements IAgent {
  abstract readonly metadata: IAgentMetadata;

  constructor(
    protected readonly promptBuilder: IPromptBuilder,
    protected readonly toolExecutor: IToolExecutor,
    protected readonly memory: IConversationMemory,
    protected readonly eventBus: IEventBus,
    protected readonly logger: ILogger
  ) {}

  /**
   * Helper lifecycle method for registering tool instances into the ToolRegistry
   * cleanly without repeating array loop boilerplate across derived agents.
   */
  protected registerToolsInRegistry(tools: BaseTool[], registry: IToolRegistry): void {
    for (const tool of tools) {
      if (!registry.hasTool(tool.metadata.name)) {
        registry.register(tool);
      }
    }
  }

  async execute(query: string, context: IAgentContext): Promise<IAgentResponse> {
    this.logger.info(`Agent [${this.metadata.name}] executing query`, { query, sessionId: context.sessionId });
    await this.eventBus.emit('agent:started', { agentId: this.metadata.id, sessionId: context.sessionId });

    await this.memory.addMessage(context.sessionId, { role: 'user', content: query });
    const prompt = await this.promptBuilder.buildSystemPrompt(this.metadata, context);

    const response = await this.runAgentLoop(prompt, query, context);

    await this.memory.addMessage(context.sessionId, { role: 'assistant', content: response.content });
    await this.eventBus.emit('agent:completed', { agentId: this.metadata.id, sessionId: context.sessionId });

    return response;
  }

  protected abstract runAgentLoop(prompt: string, query: string, context: IAgentContext): Promise<IAgentResponse>;
}
