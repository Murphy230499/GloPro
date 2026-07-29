import { AbstractTool, IToolMetadata, IToolResult, IToolValidationResult, IAgentContext } from '@/ai-core';
import { ISendEmailInput } from '../types';

export interface IEmailBroadcastResult {
  sentCount: number;
  subject: string;
}

export class SendEmailTool extends AbstractTool<ISendEmailInput, IEmailBroadcastResult> {
  readonly metadata: IToolMetadata = {
    name: 'marketing_send_email',
    description: 'Dispatches HTML newsletter and promotion emails to target customer email lists.',
    parametersSchema: {
      type: 'object',
      properties: {
        recipientEmails: { type: 'array', items: { type: 'string' } },
        subject: { type: 'string' },
        bodyContent: { type: 'string' }
      },
      required: ['recipientEmails', 'subject', 'bodyContent']
    },
    requiredPermissions: ['marketing:outreach'],
    riskLevel: 'LOW',
    requiresHumanConfirmation: false,
    supportsRollback: false
  };

  override validate(input: ISendEmailInput): IToolValidationResult {
    const errors: string[] = [];
    if (!input || !input.recipientEmails || input.recipientEmails.length === 0) errors.push('At least one email recipient is required.');
    if (!input.subject) errors.push('Email subject is required.');
    return { valid: errors.length === 0, errors };
  }

  async execute(input: ISendEmailInput, context: IAgentContext): Promise<IToolResult<IEmailBroadcastResult>> {
    const startTime = Date.now();
    this.log('info', `Sending email campaign [${input.subject}] to ${input.recipientEmails.length} recipients`);

    try {
      const res: IEmailBroadcastResult = {
        sentCount: input.recipientEmails.length,
        subject: input.subject
      };

      return {
        success: true,
        data: res,
        executionTimeMs: Date.now() - startTime
      };
    } catch (err: any) {
      this.log('error', 'SendEmailTool failed', { error: err.message });
      return {
        success: false,
        error: err.message || 'Failed to dispatch email campaign.',
        executionTimeMs: Date.now() - startTime
      };
    }
  }
}
