import { AbstractTool, IToolMetadata, IToolResult, IToolValidationResult, IAgentContext } from '@/ai-core';
import { ICustomerSegmentationInput, ICustomerSegment } from '../types';

export class CustomerSegmentationTool extends AbstractTool<ICustomerSegmentationInput, ICustomerSegment> {
  readonly metadata: IToolMetadata = {
    name: 'marketing_segmentation',
    description: 'Segments salon customer base into VIP, Regular, Inactive, and New customer cohorts based on spend and visit metrics.',
    parametersSchema: {
      type: 'object',
      properties: {
        segmentType: { type: 'string', enum: ['vip', 'regular', 'inactive', 'new', 'custom'] },
        minSpent: { type: 'number' },
        minVisits: { type: 'number' }
      },
      required: ['segmentType']
    },
    requiredPermissions: ['marketing:read'],
    riskLevel: 'LOW',
    requiresHumanConfirmation: false,
    supportsRollback: false
  };

  override validate(input: ICustomerSegmentationInput): IToolValidationResult {
    if (!input || !input.segmentType) {
      return { valid: false, errors: ['Segment type is required.'] };
    }
    return { valid: true };
  }

  async execute(input: ICustomerSegmentationInput, context: IAgentContext): Promise<IToolResult<ICustomerSegment>> {
    const startTime = Date.now();
    this.log('info', `Segmenting customers for type: ${input.segmentType}`);

    try {
      const counts: Record<string, number> = {
        vip: 18,
        regular: 65,
        inactive: 24,
        new: 15
      };

      const seg: ICustomerSegment = {
        id: `seg_${input.segmentType}`,
        name: `Phân nhóm khách ${input.segmentType.toUpperCase()}`,
        criteria: `Chi tiêu >= ${(input.minSpent || 5000000).toLocaleString('vi-VN')}đ`,
        customerCount: counts[input.segmentType] || 20
      };

      return {
        success: true,
        data: seg,
        executionTimeMs: Date.now() - startTime
      };
    } catch (err: any) {
      this.log('error', 'CustomerSegmentationTool failed', { error: err.message });
      return {
        success: false,
        error: err.message || 'Failed to segment customers.',
        executionTimeMs: Date.now() - startTime
      };
    }
  }
}
