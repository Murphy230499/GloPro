import { IToolMetadata, IToolResult } from '../contracts/tool.types';
import { IAgentContext } from '../contracts/context.types';

export abstract class BaseTool<TInput = Record<string, unknown>, TOutput = unknown> {
  abstract readonly metadata: IToolMetadata;

  abstract execute(input: TInput, context: IAgentContext): Promise<IToolResult<TOutput>>;

  validateInput(input: TInput): boolean {
    if (!input || typeof input !== 'object') return false;
    return true;
  }
}
