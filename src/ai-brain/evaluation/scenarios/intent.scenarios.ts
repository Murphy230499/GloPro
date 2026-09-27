/**
 * Intent Scenarios (Phase 5 Benchmark)
 * 20 real-world Vietnamese intent understanding scenarios
 */

import { EvaluationScenario } from '../EvaluationCase';

export const INTENT_SCENARIOS: EvaluationScenario[] = [
  {
    id: 'INT_001',
    category: 'INTENT_UNDERSTANDING',
    input: 'Doanh thu hôm nay bao nhiêu?',
    description: 'General salon revenue query',
    expected: { intent: 'QUERY_REVENUE' }
  },
  {
    id: 'INT_002',
    category: 'INTENT_UNDERSTANDING',
    input: 'Cho tôi biết tiền bán được hôm nay',
    description: 'Synonym for revenue query',
    expected: { intent: 'QUERY_REVENUE' }
  },
  {
    id: 'INT_003',
    category: 'INTENT_UNDERSTANDING',
    input: 'Cho tôi doanh thu của Nam',
    description: 'Staff-specific revenue query',
    expected: { intent: 'QUERY_STAFF_REVENUE', staff: 'Nam' }
  },
  {
    id: 'INT_004',
    category: 'INTENT_UNDERSTANDING',
    input: 'Doanh số của thợ Minh tháng này thế nào?',
    description: 'Staff revenue query with title',
    expected: { intent: 'QUERY_STAFF_REVENUE', staff: 'Minh' }
  },
  {
    id: 'INT_005',
    category: 'INTENT_UNDERSTANDING',
    input: 'Tip 200 nghìn cho Nam',
    description: 'Tip operation (employee pass-through)',
    expected: { intent: 'TIP_OPERATION', staff: 'Nam', amount: 200000 }
  },
  {
    id: 'INT_006',
    category: 'INTENT_UNDERSTANDING',
    input: 'Bo cho bé Linh 50k nhé',
    description: 'Tip operation with colloquial Vietnamese',
    expected: { intent: 'TIP_OPERATION', staff: 'Linh', amount: 50000 }
  },
  {
    id: 'INT_007',
    category: 'INTENT_UNDERSTANDING',
    input: 'Tìm khách Nguyễn Văn An',
    description: 'Customer lookup by full name',
    expected: { intent: 'SEARCH_CUSTOMER', customer: 'Nguyễn Văn An' }
  },
  {
    id: 'INT_008',
    category: 'INTENT_UNDERSTANDING',
    input: 'Tra cứu số điện thoại 0901234567',
    description: 'Customer lookup by phone number',
    expected: { intent: 'SEARCH_CUSTOMER' }
  },
  {
    id: 'INT_009',
    category: 'INTENT_UNDERSTANDING',
    input: 'Tạo khách hàng Lê Minh Châu số 0909887766',
    description: 'Create new customer request',
    expected: { intent: 'CREATE_CUSTOMER', customer: 'Lê Minh Châu' }
  },
  {
    id: 'INT_010',
    category: 'INTENT_UNDERSTANDING',
    input: 'Đổi số điện thoại khách Nguyễn Văn A sang 0911222333',
    description: 'Update customer information',
    expected: { intent: 'UPDATE_CUSTOMER', customer: 'Nguyễn Văn A' }
  },
  {
    id: 'INT_011',
    category: 'INTENT_UNDERSTANDING',
    input: 'Mai đặt chị Lan 3h nhé',
    description: 'Create appointment with date and time',
    expected: { intent: 'CREATE_APPOINTMENT', customer: 'Lan', time: '15:00' }
  },
  {
    id: 'INT_012',
    category: 'INTENT_UNDERSTANDING',
    input: 'Đặt lịch cho cô Hoa cắt tóc lúc 10h sáng mai',
    description: 'Create appointment with service and title',
    expected: { intent: 'CREATE_APPOINTMENT', customer: 'Hoa', service: 'cắt tóc', time: '10:00' }
  },
  {
    id: 'INT_013',
    category: 'INTENT_UNDERSTANDING',
    input: 'Hủy lịch của chị Lan ngày mai',
    description: 'Cancel appointment request',
    expected: { intent: 'CANCEL_APPOINTMENT', customer: 'Lan' }
  },
  {
    id: 'INT_014',
    category: 'INTENT_UNDERSTANDING',
    input: 'Xóa lịch hẹn của anh Nam lúc 14:00',
    description: 'Cancel appointment synonym',
    expected: { intent: 'CANCEL_APPOINTMENT', customer: 'Nam' }
  },
  {
    id: 'INT_015',
    category: 'INTENT_UNDERSTANDING',
    input: 'Hôm nay có bao nhiêu lịch hẹn?',
    description: 'Search appointment count today',
    expected: { intent: 'SEARCH_APPOINTMENT' }
  },
  {
    id: 'INT_016',
    category: 'INTENT_UNDERSTANDING',
    input: 'Xem lịch hẹn ngày mai',
    description: 'Search appointments for tomorrow',
    expected: { intent: 'SEARCH_APPOINTMENT' }
  },
  {
    id: 'INT_017',
    category: 'INTENT_UNDERSTANDING',
    input: 'Giá gội đầu dưỡng sinh bao nhiêu tiền?',
    description: 'Search service catalog & pricing',
    expected: { intent: 'SEARCH_SERVICE', service: 'gội đầu dưỡng sinh' }
  },
  {
    id: 'INT_018',
    category: 'INTENT_UNDERSTANDING',
    input: 'Kho còn dầu gội bưởi không?',
    description: 'Search inventory / product stock',
    expected: { intent: 'SEARCH_PRODUCT' }
  },
  {
    id: 'INT_019',
    category: 'INTENT_UNDERSTANDING',
    input: 'Hôm nay ai còn trống?',
    description: 'Find available staff',
    expected: { intent: 'SEARCH_STAFF' }
  },
  {
    id: 'INT_020',
    category: 'INTENT_UNDERSTANDING',
    input: 'Tính lương tháng này cho thợ',
    description: 'Unsupported payroll operation',
    expected: { isUnsupported: true }
  }
];
