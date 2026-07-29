import { IToolMetadata } from '../contracts/tool.types';
import { BaseTool } from '../core/BaseTool';
import { ILogger } from '../infrastructure/Logger';

export interface IToolRegistry {
  register(tool: BaseTool): void;
  getTool(name: string): BaseTool | undefined;
  listTools(): IToolMetadata[];
  hasTool(name: string): boolean;
}

export class ToolRegistry implements IToolRegistry {
  private readonly tools = new Map<string, BaseTool>();

  constructor(private readonly logger: ILogger) {}

  register(tool: BaseTool): void {
    if (this.tools.has(tool.metadata.name)) {
      throw new Error(`Tool [${tool.metadata.name}] is already registered.`);
    }
    this.tools.set(tool.metadata.name, tool);
    this.logger.debug(`Registered tool: ${tool.metadata.name}`);
  }

  getTool(name: string): BaseTool | undefined {
    return this.tools.get(name);
  }

  listTools(): IToolMetadata[] {
    return Array.from(this.tools.values()).map(t => t.metadata);
  }

  hasTool(name: string): boolean {
    return this.tools.has(name);
  }
}
