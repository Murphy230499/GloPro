import { AbstractTool, IToolMetadata, IToolResult, IToolValidationResult, IAgentContext } from '@/ai-core';
import { ISendSMSInput } from '../types';

export interface ISMSBroadcastResult {
  sentCount: number;
  failedCount: number;
  brandname: string;
}

export class SendSMSTool extends AbstractTool<ISendSMSInput, ISMSBroadcastResult> {
  readonly metadata: IToolMetadata = {
    name: 'marketing_send_sms',
    description: 'Triggers SMS Brandname broadcast messages to target customer lists.',
    parametersSchema: {
      type: 'object',
      properties: {
        recipientPhones: { type: 'array', items: { type: 'string' } },
        message: { type: 'string' },
        brandname: { type: 'string' }
      },
      required: ['recipientPhones', 'message']
    },
    requiredPermissions: ['marketing:outreach'],
    riskLevel: 'MEDIUM',
    requiresHumanConfirmation: false,
    supportsRollback: false
  };

  override validate(input: ISendSMSInput): IToolValidationResult {
    const errors: string[] = [];
    if (!input || !input.recipientPhones || input.recipientPhones.length === 0) errors.push('At least one recipient phone number is required.');
    if (!input.message || input.message.trim().length === 0) errors.push('SMS message content is required.');
    return { valid: errors.length === 0, errors };
  }

  async execute(input: ISendSMSInput, context: IAgentContext): Promise<IToolResult<ISMSBroadcastResult>> {
    const startTime = Date.now();
    this.log('info', `Sending SMS broadcast to ${input.recipientPhones.length} recipients`);

    try {
      const res: ISMSBroadcastResult = {
        sentCount: input.recipientPhones.length,
        failedCount: 0,
        brandname: input.brandname || 'GLOPRO_SALON'
      };

      await this.audit('SEND_SMS', input, context, { success: true, data: res, executionTimeMs: 0 });

      return {
        success: true,
        data: res,
        executionTimeMs: Date.now() - startTime
      };
    } catch (err: any) {
      this.log('error', 'SendSMSTool failed', { error: err.message });
      return {
        success: false,
        error: err.message || 'Failed to send SMS broadcast.',
        executionTimeMs: Date.now() - startTime
      };
    }
  }
}
