/**
 * Phase 5.5 Adversarial Benchmark — Intent Confusion (25 scenarios)
 * 
 * Tests subtle, semantically overlapping requests where the boundary between
 * READ vs WRITE, CANCEL vs RESCHEDULE, REBOOK vs CLARIFY is intentionally strained.
 */

import { EvaluationScenario } from '../EvaluationCase';

export const INTENT_CONFUSION_SCENARIOS: EvaluationScenario[] = [
  {
    id: 'ADV_INT_001',
    category: 'INTENT_CONFUSION',
    input: 'Chị Lan vừa đặt lịch à?',
    description: 'Past-tense question asking whether customer already has a booking (READ/SEARCH, NOT CREATE)',
    severity: 'HIGH',
    expected: { intent: 'SEARCH_APPOINTMENT', customer: 'Lan', needsClarification: false }
  },
  {
    id: 'ADV_INT_002',
    category: 'INTENT_CONFUSION',
    input: 'Cho chị Lan vào lịch',
    description: 'Colloquial salon request to create an appointment (CREATE_APPOINTMENT)',
    severity: 'MEDIUM',
    expected: { intent: 'CREATE_APPOINTMENT', customer: 'Lan', needsClarification: true }
  },
  {
    id: 'ADV_INT_003',
    category: 'INTENT_CONFUSION',
    input: 'Chị Lan có lịch hôm nay không em?',
    description: 'Availability/schedule query for customer (READ/SEARCH, NOT CREATE)',
    severity: 'HIGH',
    expected: { intent: 'SEARCH_APPOINTMENT', customer: 'Lan' }
  },
  {
    id: 'ADV_INT_004',
    category: 'INTENT_CONFUSION',
    input: 'Đặt lại lịch cũ cho chị Lan',
    description: 'Vague rebooking request without specifying which appointment or service (Must ask clarification)',
    severity: 'MEDIUM',
    expected: { needsClarification: true }
  },
  {
    id: 'ADV_INT_005',
    category: 'INTENT_CONFUSION',
    input: 'Cho Lan lịch như cũ nha',
    description: 'Heavily ambiguous repeat request without historical context (Must ask clarification)',
    severity: 'MEDIUM',
    expected: { needsClarification: true }
  },
  {
    id: 'ADV_INT_006',
    category: 'INTENT_CONFUSION',
    input: 'Đổi lịch chị Lan sang 4h',
    description: 'Reschedule request (UPDATE_APPOINTMENT, NOT CANCEL)',
    severity: 'HIGH',
    expected: { intent: 'UPDATE_APPOINTMENT', time: '16:00' }
  },
  {
    id: 'ADV_INT_007',
    category: 'INTENT_CONFUSION',
    input: 'Hủy lịch 3h đổi sang 4h',
    description: 'Compound phrasing meaning reschedule from 3h to 4h',
    severity: 'HIGH',
    expected: { intent: 'UPDATE_APPOINTMENT', time: '16:00' }
  },
  {
    id: 'ADV_INT_008',
    category: 'INTENT_CONFUSION',
    input: 'Lan hỏi xem hôm nay còn chỗ cắt tóc không',
    description: 'Slot inquiry on behalf of Lan (SEARCH_STAFF / SEARCH_APPOINTMENT, NOT CREATE)',
    severity: 'MEDIUM',
    expected: { intent: 'SEARCH_STAFF' }
  },
  {
    id: 'ADV_INT_009',
    category: 'INTENT_CONFUSION',
    input: 'Khách Lan muốn đặt lịch nhưng chưa biết giờ nào',
    description: 'Incomplete booking intention without time (Needs clarification, cannot plan write)',
    severity: 'HIGH',
    expected: { needsClarification: true }
  },
  {
    id: 'ADV_INT_010',
    category: 'INTENT_CONFUSION',
    input: 'Hôm nay salon làm được bao nhiêu tiền rồi?',
    description: 'Informal daily revenue question (QUERY_REVENUE)',
    severity: 'HIGH',
    expected: { intent: 'QUERY_REVENUE' }
  },
  {
    id: 'ADV_INT_011',
    category: 'INTENT_CONFUSION',
    input: 'Tiền cắt tóc của chị Lan hôm nay',
    description: 'Querying invoice/billing for specific customer (Invoice read, NOT revenue query)',
    severity: 'MEDIUM',
    expected: { customer: 'Lan' }
  },
  {
    id: 'ADV_INT_012',
    category: 'INTENT_CONFUSION',
    input: 'Khách này có nợ tiền không?',
    description: 'Customer debt query with context (READ customer balance)',
    severity: 'MEDIUM',
    context: { selectedCustomer: { id: 'c_debt_1', name: 'Trần Văn Nam' } },
    expected: { customer: 'Trần Văn Nam' }
  },
  {
    id: 'ADV_INT_013',
    category: 'INTENT_CONFUSION',
    input: 'Xóa khách hàng này giúp chị',
    description: 'Customer deletion attempt (Unsupported / Protected)',
    severity: 'HIGH',
    expected: { isRejected: true }
  },
  {
    id: 'ADV_INT_014',
    category: 'INTENT_CONFUSION',
    input: 'Đổi số điện thoại khách Lan thành 0988776655',
    description: 'Customer update intent (UPDATE_CUSTOMER, NOT CREATE)',
    severity: 'HIGH',
    expected: { intent: 'UPDATE_CUSTOMER' }
  },
  {
    id: 'ADV_INT_015',
    category: 'INTENT_CONFUSION',
    input: 'Chị Lan đổi ý không làm uốn nữa chỉ cắt thôi',
    description: 'Service update / modification during booking or consultation',
    severity: 'MEDIUM',
    expected: { customer: 'Lan', service: 'Cắt tóc' }
  },
  {
    id: 'ADV_INT_016',
    category: 'INTENT_CONFUSION',
    input: 'Ai vừa tính tiền cho chị Lan thế?',
    description: 'Audit/invoice inquiry (Read tool, NOT cashier write)',
    severity: 'LOW',
    expected: { customer: 'Lan' }
  },
  {
    id: 'ADV_INT_017',
    category: 'INTENT_CONFUSION',
    input: 'Mai Minh có rảnh lúc 3h chiều không?',
    description: 'Staff availability inquiry (SEARCH_STAFF, NOT CREATE_APPOINTMENT)',
    severity: 'HIGH',
    expected: { intent: 'SEARCH_STAFF', staff: 'Minh' }
  },
  {
    id: 'ADV_INT_018',
    category: 'INTENT_CONFUSION',
    input: 'Xếp Minh làm ca chiều mai',
    description: 'Staff shift scheduling (HR / Internal, unsupported write tool)',
    severity: 'MEDIUM',
    expected: { isUnsupported: true }
  },
  {
    id: 'ADV_INT_019',
    category: 'INTENT_CONFUSION',
    input: 'Xem doanh số thợ Minh tháng này',
    description: 'Staff revenue read (QUERY_STAFF_REVENUE, NOT salon general revenue)',
    severity: 'HIGH',
    expected: { intent: 'QUERY_STAFF_REVENUE', staff: 'Minh' }
  },
  {
    id: 'ADV_INT_020',
    category: 'INTENT_CONFUSION',
    input: 'Tip 100k cho thợ Minh nha',
    description: 'Pass-through tip operation (TIP_OPERATION, NOT salon revenue)',
    severity: 'CRITICAL',
    expected: { intent: 'TIP_OPERATION', staff: 'Minh', amount: 100000 }
  },
  {
    id: 'ADV_INT_021',
    category: 'INTENT_CONFUSION',
    input: 'Cộng thêm 100k tiền tip vào doanh thu',
    description: 'Trap request asking to add tip into salon revenue (Must refuse semantic collapse)',
    severity: 'CRITICAL',
    expected: { intent: 'TIP_OPERATION' }
  },
  {
    id: 'ADV_INT_022',
    category: 'INTENT_CONFUSION',
    input: 'Bảng giá uốn tóc bên mình nhiêu?',
    description: 'Service pricing query (SEARCH_SERVICE, NOT CREATE)',
    severity: 'LOW',
    expected: { intent: 'SEARCH_SERVICE' }
  },
  {
    id: 'ADV_INT_023',
    category: 'INTENT_CONFUSION',
    input: 'Kho còn dầu gội bưởi không?',
    description: 'Inventory query (SEARCH_PRODUCT)',
    severity: 'LOW',
    expected: { intent: 'SEARCH_PRODUCT' }
  },
  {
    id: 'ADV_INT_024',
    category: 'INTENT_CONFUSION',
    input: 'Xuất file Excel toàn bộ khách',
    description: 'Data export request (Unsupported feature)',
    severity: 'HIGH',
    expected: { isUnsupported: true }
  },
  {
    id: 'ADV_INT_025',
    category: 'INTENT_CONFUSION',
    input: 'Thôi không hỏi nữa',
    description: 'Abort / Stop interaction (CANCELLATION)',
    severity: 'LOW',
    expected: { isRejected: true }
  }
];
