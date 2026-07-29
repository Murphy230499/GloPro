import { AbstractTool } from './AbstractTool';
import { IToolMetadata, IToolResult, IToolValidationResult, IToolRollbackResult, ToolRiskLevel } from '../contracts/tool.types';
import { IAgentContext } from '../contracts/context.types';
import { ILogger } from '../infrastructure/Logger';
import { IAuditLog } from '../contracts/security.types';

export class ToolBuilder<TInput = Record<string, unknown>, TOutput = unknown> {
  private toolName: string = '';
  private toolDescription: string = '';
  private parametersSchema: Record<string, unknown> = {};
  private requiredPermissions: string[] = [];
  private riskLevel: ToolRiskLevel = 'LOW';
  private requiresHumanConfirmation: boolean = false;
  private supportsRollback: boolean = false;

  private validateFn?: (input: TInput) => IToolValidationResult;
  private confirmationFn?: (input: TInput, context: IAgentContext) => boolean;
  private executeFn?: (input: TInput, context: IAgentContext) => Promise<IToolResult<TOutput>>;
  private rollbackFn?: (input: TInput, context: IAgentContext, previousResult: IToolResult<TOutput>) => Promise<IToolRollbackResult>;

  private logger?: ILogger;
  private auditLog?: IAuditLog;

  static create<TIn = Record<string, unknown>, TOut = unknown>(): ToolBuilder<TIn, TOut> {
    return new ToolBuilder<TIn, TOut>();
  }

  setName(name: string): this {
    this.toolName = name;
    return this;
  }

  setDescription(description: string): this {
    this.toolDescription = description;
    return this;
  }

  setParametersSchema(schema: Record<string, unknown>): this {
    this.parametersSchema = schema;
    return this;
  }

  setRequiredPermissions(permissions: string[]): this {
    this.requiredPermissions = permissions;
    return this;
  }

  setRiskLevel(riskLevel: ToolRiskLevel): this {
    this.riskLevel = riskLevel;
    return this;
  }

  setRequiresConfirmation(requiresConfirmation: boolean): this {
    this.requiresHumanConfirmation = requiresConfirmation;
    return this;
  }

  setValidation(fn: (input: TInput) => IToolValidationResult): this {
    this.validateFn = fn;
    return this;
  }

  setConfirmation(fn: (input: TInput, context: IAgentContext) => boolean): this {
    this.confirmationFn = fn;
    return this;
  }

  setExecute(fn: (input: TInput, context: IAgentContext) => Promise<IToolResult<TOutput>>): this {
    this.executeFn = fn;
    return this;
  }

  setRollback(fn: (input: TInput, context: IAgentContext, previousResult: IToolResult<TOutput>) => Promise<IToolRollbackResult>): this {
    this.rollbackFn = fn;
    this.supportsRollback = true;
    return this;
  }

  setLogger(logger: ILogger): this {
    this.logger = logger;
    return this;
  }

  setAuditLog(auditLog: IAuditLog): this {
    this.auditLog = auditLog;
    return this;
  }

  build(): AbstractTool<TInput, TOutput> {
    if (!this.toolName) throw new Error('ToolBuilder: Tool name is required.');
    if (!this.executeFn) throw new Error('ToolBuilder: Tool execute function is required.');

    const metadata: IToolMetadata = {
      name: this.toolName,
      description: this.toolDescription,
      parametersSchema: this.parametersSchema,
      requiredPermissions: this.requiredPermissions,
      riskLevel: this.riskLevel,
      requiresHumanConfirmation: this.requiresHumanConfirmation,
      supportsRollback: this.supportsRollback
    };

    const validate = this.validateFn;
    const confirmation = this.confirmationFn;
    const execute = this.executeFn;
    const rollback = this.rollbackFn;
    const logger = this.logger;
    const auditLog = this.auditLog;

    return new (class extends AbstractTool<TInput, TOutput> {
      readonly metadata = metadata;

      constructor() {
        super(logger, auditLog);
      }

      override validate(input: TInput): IToolValidationResult {
        if (validate) return validate(input);
        return super.validate(input);
      }

      override requiresConfirmation(input: TInput, context: IAgentContext): boolean {
        if (confirmation) return confirmation(input, context);
        return super.requiresConfirmation(input, context);
      }

      override async execute(input: TInput, context: IAgentContext): Promise<IToolResult<TOutput>> {
        const startTime = Date.now();
        this.log('info', `Executing tool [${metadata.name}]`, { input });
        await this.audit('EXECUTE_START', input, context);

        try {
          const result = await execute(input, context);
          this.log('info', `Executed tool [${metadata.name}] successfully`, { success: result.success });
          await this.audit('EXECUTE_FINISH', input, context, result);
          return result;
        } catch (err: any) {
          this.log('error', `Tool execution failed [${metadata.name}]`, { error: err.message });
          const errorResult: IToolResult<TOutput> = {
            success: false,
            error: err.message,
            executionTimeMs: Date.now() - startTime
          };
          await this.audit('EXECUTE_FAILED', input, context, errorResult);
          return errorResult;
        }
      }

      override async rollback(input: TInput, context: IAgentContext, previousResult: IToolResult<TOutput>): Promise<IToolRollbackResult> {
        if (rollback) {
          this.log('warn', `Rollback executing for tool [${metadata.name}]`, { input });
          await this.audit('ROLLBACK_START', input, context);
          const rbRes = await rollback(input, context, previousResult);
          await this.audit('ROLLBACK_FINISH', input, context);
          return rbRes;
        }
        return super.rollback(input, context, previousResult);
      }
    })();
  }
}
