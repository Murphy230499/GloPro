import { IToolMetadata, IToolResult, IToolValidationResult, IToolRollbackResult } from '../contracts/tool.types';
import { IAgentContext } from '../contracts/context.types';

export interface IToolSDK<TInput = Record<string, unknown>, TOutput = unknown> {
  readonly metadata: IToolMetadata;
  
  // 1. Name & Description (via metadata)
  readonly name: string;
  readonly description: string;

  // 2. Permission Check
  hasPermission(context: IAgentContext): boolean;

  // 3. Input Validation
  validate(input: TInput): IToolValidationResult;

  // 4. Human Confirmation
  requiresConfirmation(input: TInput, context: IAgentContext): boolean;

  // 5. Execution Hook
  execute(input: TInput, context: IAgentContext): Promise<IToolResult<TOutput>>;

  // 6. Rollback / Compensation Hook
  rollback(input: TInput, context: IAgentContext, previousResult: IToolResult<TOutput>): Promise<IToolRollbackResult>;

  // 7. Structured Logging Hook
  log(level: 'debug' | 'info' | 'warn' | 'error', message: string, meta?: Record<string, unknown>): void;

  // 8. Audit Logging Hook
  audit(action: string, input: TInput, context: IAgentContext, result?: IToolResult<TOutput>): Promise<void>;
}
