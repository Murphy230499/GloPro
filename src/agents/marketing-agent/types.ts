export interface ICustomerSegment {
  id: string;
  name: string;
  criteria: string;
  customerCount: number;
}

export interface IVoucher {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderValue?: number;
  expiryDate: string;
  usageLimit?: number;
}

export interface ICampaign {
  id: string;
  name: string;
  channel: 'sms' | 'zalo' | 'email' | 'omnichannel';
  segmentName: string;
  targetCount: number;
  sentCount: number;
  status: 'draft' | 'scheduled' | 'running' | 'completed';
  created_at: string;
}

// Tool Inputs
export interface ICustomerSegmentationInput {
  segmentType: 'vip' | 'regular' | 'inactive' | 'new' | 'custom';
  minSpent?: number;
  minVisits?: number;
}

export interface ISendSMSInput {
  recipientPhones: string[];
  message: string;
  brandname?: string;
}

export interface ISendEmailInput {
  recipientEmails: string[];
  subject: string;
  bodyContent: string;
}

export interface ISendZaloNotificationInput {
  recipientPhones: string[];
  templateId: string;
  templateData: Record<string, string>;
}

export interface IIssueVoucherInput {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  expiryDate: string;
  recipientSegment?: string;
}

export interface ILaunchCampaignInput {
  name: string;
  channel: 'sms' | 'zalo' | 'email' | 'omnichannel';
  segmentType: string;
  messageContent: string;
  voucherCode?: string;
}

export interface IManageBirthdayCampaignInput {
  month?: number; // 1-12
  giftVoucherValue?: number;
}

export interface IWinBackInactiveCustomersInput {
  inactiveDaysThreshold?: number; // default 60 days
  offerDiscountPercentage?: number;
}
