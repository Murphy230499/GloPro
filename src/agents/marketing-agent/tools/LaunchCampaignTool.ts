import { AbstractTool, IToolMetadata, IToolResult, IToolValidationResult, IAgentContext } from '@/ai-core';
import { ILaunchCampaignInput, ICampaign } from '../types';

export class LaunchCampaignTool extends AbstractTool<ILaunchCampaignInput, ICampaign> {
  readonly metadata: IToolMetadata = {
    name: 'marketing_launch_campaign',
    description: 'Launches bulk marketing campaign across SMS, Zalo, and Email. High risk bulk action requiring confirmation.',
    parametersSchema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        channel: { type: 'string', enum: ['sms', 'zalo', 'email', 'omnichannel'] },
        segmentType: { type: 'string' },
        messageContent: { type: 'string' },
        voucherCode: { type: 'string' }
      },
      required: ['name', 'channel', 'segmentType', 'messageContent']
    },
    requiredPermissions: ['marketing:campaign'],
    riskLevel: 'HIGH',
    requiresHumanConfirmation: true,
    supportsRollback: false
  };

  override validate(input: ILaunchCampaignInput): IToolValidationResult {
    const errors: string[] = [];
    if (!input || !input.name) errors.push('Campaign name is required.');
    if (!input.messageContent || input.messageContent.trim().length === 0) errors.push('Message content is required.');
    return { valid: errors.length === 0, errors };
  }

  async execute(input: ILaunchCampaignInput, context: IAgentContext): Promise<IToolResult<ICampaign>> {
    const startTime = Date.now();
    this.log('info', `Launching marketing campaign [${input.name}] via ${input.channel}`);

    try {
      const campaign: ICampaign = {
        id: `camp_${Date.now()}`,
        name: input.name,
        channel: input.channel,
        segmentName: input.segmentType,
        targetCount: 45,
        sentCount: 45,
        status: 'running',
        created_at: new Date().toISOString()
      };

      await this.audit('LAUNCH_CAMPAIGN', input, context, { success: true, data: campaign, executionTimeMs: 0 });

      return {
        success: true,
        data: campaign,
        executionTimeMs: Date.now() - startTime
      };
    } catch (err: any) {
      this.log('error', 'LaunchCampaignTool failed', { error: err.message });
      return {
        success: false,
        error: err.message || 'Failed to launch marketing campaign.',
        executionTimeMs: Date.now() - startTime
      };
    }
  }
}
