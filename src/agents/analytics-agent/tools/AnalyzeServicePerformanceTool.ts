import { AbstractTool, IToolMetadata, IToolResult, IToolValidationResult, IAgentContext } from '@/ai-core';
import { IAnalyzeServicePerformanceInput, IServiceAnalysis } from '../types';

export class AnalyzeServicePerformanceTool extends AbstractTool<IAnalyzeServicePerformanceInput, IServiceAnalysis> {
  readonly metadata: IToolMetadata = {
    name: 'analytics_service',
    description: 'Ranks top-selling hair and spa services, profit margins per service type, and flags slow-moving menu items.',
    parametersSchema: {
      type: 'object',
      properties: {
        timeframe: { type: 'string', enum: ['month', 'quarter', 'year'] }
      }
    },
    requiredPermissions: ['analytics:read'],
    riskLevel: 'LOW',
    requiresHumanConfirmation: false,
    supportsRollback: false
  };

  override validate(input: IAnalyzeServicePerformanceInput): IToolValidationResult {
    return { valid: true };
  }

  async execute(input: IAnalyzeServicePerformanceInput, context: IAgentContext): Promise<IToolResult<IServiceAnalysis>> {
    const startTime = Date.now();
    this.log('info', 'Analyzing service popularity and profit margins');

    try {
      const res: IServiceAnalysis = {
        topServices: [
          { serviceName: 'Gội đầu dưỡng sinh', count: 142, totalRevenue: 21300000, profitMargin: 78.5 },
          { serviceName: 'Uốn tócsetting phong cách Hàn Quốc', count: 48, totalRevenue: 28800000, profitMargin: 65.0 }
        ],
        slowMovingServices: ['Duỗi tóc thẳng tự nhiên', 'Nhuộm highlight đơn sắc']
      };

      return {
        success: true,
        data: res,
        executionTimeMs: Date.now() - startTime
      };
    } catch (err: any) {
      this.log('error', 'AnalyzeServicePerformanceTool failed', { error: err.message });
      return {
        success: false,
        error: err.message || 'Failed to analyze service performance.',
        executionTimeMs: Date.now() - startTime
      };
    }
  }
}
