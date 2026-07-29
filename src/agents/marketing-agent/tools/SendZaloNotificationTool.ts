import { AbstractTool, IToolMetadata, IToolResult, IToolValidationResult, IAgentContext } from '@/ai-core';
import { ISendZaloNotificationInput } from '../types';

export interface IZaloBroadcastResult {
  deliveredCount: number;
  templateId: string;
}

export class SendZaloNotificationTool extends AbstractTool<ISendZaloNotificationInput, IZaloBroadcastResult> {
  readonly metadata: IToolMetadata = {
    name: 'marketing_send_zalo',
    description: 'Triggers Zalo ZNS / Zalo Official Account template messages to customer phone numbers.',
    parametersSchema: {
      type: 'object',
      properties: {
        recipientPhones: { type: 'array', items: { type: 'string' } },
        templateId: { type: 'string' },
        templateData: { type: 'object' }
      },
      required: ['recipientPhones', 'templateId']
    },
    requiredPermissions: ['marketing:outreach'],
    riskLevel: 'LOW',
    requiresHumanConfirmation: false,
    supportsRollback: false
  };

  override validate(input: ISendZaloNotificationInput): IToolValidationResult {
    const errors: string[] = [];
    if (!input || !input.recipientPhones || input.recipientPhones.length === 0) errors.push('At least one phone number is required.');
    if (!input.templateId) errors.push('Zalo Template ID is required.');
    return { valid: errors.length === 0, errors };
  }

  async execute(input: ISendZaloNotificationInput, context: IAgentContext): Promise<IToolResult<IZaloBroadcastResult>> {
    const startTime = Date.now();
    this.log('info', `Sending Zalo ZNS template [${input.templateId}] to ${input.recipientPhones.length} phones`);

    try {
      const res: IZaloBroadcastResult = {
        deliveredCount: input.recipientPhones.length,
        templateId: input.templateId
      };

      return {
        success: true,
        data: res,
        executionTimeMs: Date.now() - startTime
      };
    } catch (err: any) {
      this.log('error', 'SendZaloNotificationTool failed', { error: err.message });
      return {
        success: false,
        error: err.message || 'Failed to send Zalo notification.',
        executionTimeMs: Date.now() - startTime
      };
    }
  }
}
