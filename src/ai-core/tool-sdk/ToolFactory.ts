import { ToolBuilder } from './ToolBuilder';
import { AbstractTool } from './AbstractTool';
import { IToolRegistry } from '../registries/ToolRegistry';
import { IToolResult, IToolRollbackResult } from '../contracts/tool.types';
import { IAgentContext } from '../contracts/context.types';

export function createTool<TInput = Record<string, unknown>, TOutput = unknown>(): ToolBuilder<TInput, TOutput> {
  return ToolBuilder.create<TInput, TOutput>();
}

export function registerTools(registry: IToolRegistry, tools: AbstractTool[]): void {
  for (const tool of tools) {
    registry.register(tool);
  }
}

/**
 * Composite Rollback Helper: Executes a sequence of tool rollbacks in reverse order
 * for transactional workflow safety.
 */
export async function rollbackToolSequence(
  sequence: Array<{ tool: AbstractTool; input: any; context: IAgentContext; result: IToolResult }>,
): Promise<IToolRollbackResult[]> {
  const rollbackResults: IToolRollbackResult[] = [];

  // Execute rollbacks in reverse order
  for (let i = sequence.length - 1; i >= 0; i--) {
    const item = sequence[i];
    if (item.tool.metadata.supportsRollback) {
      const res = await item.tool.rollback(item.input, item.context, item.result);
      rollbackResults.push(res);
    }
  }

  return rollbackResults;
}
