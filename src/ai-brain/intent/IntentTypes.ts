/**
 * Intent & Entity Structure Types
 */

export type IntentType =
  | 'QUERY_REVENUE'           // "Doanh thu hôm nay bao nhiêu?"
  | 'QUERY_STAFF_REVENUE'     // "Cho tôi doanh thu của Nam"
  | 'SEARCH_CUSTOMER'         // "Tìm khách Nguyễn Văn An"
  | 'CREATE_CUSTOMER'         // "Tạo khách hàng Lê Thiện Nhân 03999321229"
  | 'UPDATE_CUSTOMER'         // "Đổi số điện thoại khách Lan"
  | 'CREATE_APPOINTMENT'      // "Đặt lịch cho chị Lan ngày mai lúc 15h"
  | 'CANCEL_APPOINTMENT'      // "Hủy lịch của Lan"
  | 'SEARCH_APPOINTMENT'      // "Xem lịch hẹn hôm nay"
  | 'SEARCH_SERVICE'          // "Bảng giá dịch vụ", "Cắt tóc bao nhiêu tiền"
  | 'SEARCH_PRODUCT'          // "Kiểm tra tồn kho dầu gội", "Tìm sản phẩm"
  | 'SEARCH_STAFF'            // "Danh sách nhân viên", "Thợ nào đang làm"
  | 'TIP_OPERATION'           // "Tip 200 nghìn cho Nam"
  | 'CREATE_INVOICE'          // "Tạo bill khách Nam 150k"
  | 'CHECKOUT_INVOICE'        // "Thanh toán hóa đơn"
  | 'ADD_PAYMENT'             // "Chị Lan thanh toán 500k tiền mặt"
  | 'READ_STOCK'              // "Kho còn bao nhiêu dầu gội?"
  | 'RECEIVE_STOCK'           // "Nhập thêm 20 chai dầu gội"
  | 'ADJUST_STOCK'            // "Điều chỉnh tồn kho"
  | 'QUERY_PAYROLL'           // "Tháng này Minh nhận bao nhiêu tiền?"
  | 'NAVIGATION'              // "Mở màn hình khách hàng", "Qua POS"
  | 'GENERAL_CONVERSATION'    // "Xin chào", "Cảm ơn bạn"
  | 'UNKNOWN';

export interface IEntitySlot {
  value: any;
  rawText: string;
  resolved: boolean;
  isRange?: boolean;
  rangeLabel?: string;
  matches?: any[];
  metadata?: Record<string, any>;
}

export interface IStructuredIntent {
  intent: IntentType;
  confidence: number;
  entities: Record<string, IEntitySlot>;
  missingRequired: string[];
  ambiguities: string[];
  needsClarification: boolean;
  clarificationQuestion?: string;
  businessReasoning?: string;
}

export interface IBrainDecision {
  type: 'PROCEED' | 'CLARIFY' | 'DISAMBIGUATE';
  structuredIntent: IStructuredIntent;
  message?: string;
  toolCallProposal?: {
    toolName: string;
    args: Record<string, any>;
  };
}
