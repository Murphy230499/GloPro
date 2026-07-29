import { AbstractTool, IToolMetadata, IToolResult, IToolValidationResult, IAgentContext } from '@/ai-core';
import { IIssueVoucherInput, IVoucher } from '../types';

export class IssueVoucherTool extends AbstractTool<IIssueVoucherInput, IVoucher> {
  readonly metadata: IToolMetadata = {
    name: 'marketing_issue_voucher',
    description: 'Generates and issues promotional discount vouchers to targeted customer segments. Money-related action requiring confirmation.',
    parametersSchema: {
      type: 'object',
      properties: {
        code: { type: 'string' },
        discountType: { type: 'string', enum: ['percentage', 'fixed'] },
        discountValue: { type: 'number' },
        expiryDate: { type: 'string', description: 'YYYY-MM-DD' },
        recipientSegment: { type: 'string' }
      },
      required: ['code', 'discountType', 'discountValue', 'expiryDate']
    },
    requiredPermissions: ['marketing:voucher'],
    riskLevel: 'HIGH',
    requiresHumanConfirmation: true,
    supportsRollback: true
  };

  override validate(input: IIssueVoucherInput): IToolValidationResult {
    const errors: string[] = [];
    if (!input || !input.code) errors.push('Voucher code is required.');
    if (typeof input.discountValue !== 'number' || input.discountValue <= 0) errors.push('Discount value must be greater than 0.');
    return { valid: errors.length === 0, errors };
  }

  async execute(input: IIssueVoucherInput, context: IAgentContext): Promise<IToolResult<IVoucher>> {
    const startTime = Date.now();
    const code = input.code.toUpperCase().trim();
    this.log('info', `Issuing voucher [${code}] with discount ${input.discountValue}`);

    try {
      const voucher: IVoucher = {
        id: `vouc_${Date.now()}`,
        code,
        discountType: input.discountType,
        discountValue: input.discountValue,
        expiryDate: input.expiryDate
      };

      await this.audit('ISSUE_VOUCHER', input, context, { success: true, data: voucher, executionTimeMs: 0 });

      return {
        success: true,
        data: voucher,
        executionTimeMs: Date.now() - startTime
      };
    } catch (err: any) {
      this.log('error', 'IssueVoucherTool failed', { error: err.message });
      return {
        success: false,
        error: err.message || 'Failed to issue voucher.',
        executionTimeMs: Date.now() - startTime
      };
    }
  }
}
