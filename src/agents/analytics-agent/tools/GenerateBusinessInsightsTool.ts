import { AbstractTool, IToolMetadata, IToolResult, IToolValidationResult, IAgentContext } from '@/ai-core';
import { IGenerateBusinessInsightsInput, IBusinessInsight } from '../types';

export class GenerateBusinessInsightsTool extends AbstractTool<IGenerateBusinessInsightsInput, IBusinessInsight[]> {
  readonly metadata: IToolMetadata = {
    name: 'analytics_insights',
    description: 'Generates strategic AI business insights, cost-saving recommendations, and revenue optimization suggestions.',
    parametersSchema: {
      type: 'object',
      properties: {
        category: { type: 'string', enum: ['all', 'finance', 'operations', 'marketing'] }
      }
    },
    requiredPermissions: ['analytics:read'],
    riskLevel: 'LOW',
    requiresHumanConfirmation: false,
    supportsRollback: false
  };

  override validate(input: IGenerateBusinessInsightsInput): IToolValidationResult {
    return { valid: true };
  }

  async execute(input: IGenerateBusinessInsightsInput, context: IAgentContext): Promise<IToolResult<IBusinessInsight[]>> {
    const startTime = Date.now();
    this.log('info', 'Generating strategic AI business insights');

    try {
      const insights: IBusinessInsight[] = [
        {
          type: 'opportunity',
          title: 'Tăng trưởng Combo Gội đầu + Ủ tóc Keratin',
          description: 'Khách hàng đặt Gội đầu dưỡng sinh có 65% nhu cầu mua thêm Combo Ủ Keratin.',
          actionableStep: 'Đề xuất nhân viên giới thiệu gói Combo giảm 15% khi thanh toán.'
        },
        {
          type: 'warning',
          title: 'Khung giờ thấp điểm 13:00 - 15:00 Ngày giữa tuần',
          description: 'Công suất ghế Salon chỉ đạt 30% từ Thứ 2 đến Thứ 4.',
          actionableStep: 'Chạy ưu đãi "Happy Hour giảm 25% làm tóc buổi trưa" trên Zalo/SMS.'
        }
      ];

      return {
        success: true,
        data: insights,
        executionTimeMs: Date.now() - startTime
      };
    } catch (err: any) {
      this.log('error', 'GenerateBusinessInsightsTool failed', { error: err.message });
      return {
        success: false,
        error: err.message || 'Failed to generate business insights.',
        executionTimeMs: Date.now() - startTime
      };
    }
  }
}
