/**
 * Phase 5.5 Adversarial Benchmark — Context Traps & Session Isolation (25 scenarios)
 * 
 * Tests multi-turn context switches, stale TTL expiration, cross-session leaks,
 * cancellation resets, and ambiguous pronoun resolutions.
 */

import { EvaluationScenario } from '../EvaluationCase';

export const CONTEXT_TRAPS_SCENARIOS: EvaluationScenario[] = [
  {
    id: 'ADV_CTX_001',
    category: 'CONTEXT_TRAP',
    input: 'Cho chị ấy vào lịch',
    description: 'Fresh conversation with no prior customer entity in session (Must ask clarification)',
    severity: 'HIGH',
    conversationHistory: [],
    expected: { needsClarification: true }
  },
  {
    id: 'ADV_CTX_002',
    category: 'CONTEXT_TRAP',
    input: 'Đặt lịch cho người này 4h chiều mai',
    description: 'No active context on screen and no history (Must ask who "người này" is)',
    severity: 'HIGH',
    expected: { needsClarification: true }
  },
  {
    id: 'ADV_CTX_003',
    category: 'CONTEXT_TRAP',
    input: 'À thôi, cho anh Minh',
    description: 'User switches customer from Lan to Minh in multi-turn',
    severity: 'MEDIUM',
    conversationHistory: [
      { role: 'user', content: 'Đặt lịch cho Lan mai 3h' },
      { role: 'assistant', content: 'Xác nhận tạo lịch cho Lan lúc 15:00 ngày mai?' }
    ],
    expected: { customer: 'Minh', intent: 'UPDATE_APPOINTMENT' }
  },
  {
    id: 'ADV_CTX_004',
    category: 'CONTEXT_TRAP',
    input: 'Cho chị ấy làm uốn tóc',
    description: 'Pronoun resolution to recent customer in same dialogue',
    severity: 'MEDIUM',
    conversationHistory: [
      { role: 'user', content: 'Tìm khách Nguyễn Thị Lan' },
      { role: 'assistant', content: 'Tìm thấy khách hàng Nguyễn Thị Lan, SĐT: 0901234567.' }
    ],
    context: {
      activeContextEntities: [{ type: 'customer', id: 'c_lan', name: 'Nguyễn Thị Lan', phone: '0901234567' }]
    },
    expected: { customer: 'Nguyễn Thị Lan', service: 'uốn' }
  },
  {
    id: 'ADV_CTX_005',
    category: 'CONTEXT_TRAP',
    input: 'Khách này có lịch hẹn nào không?',
    description: 'Querying appointments for active screen customer',
    severity: 'LOW',
    context: { selectedCustomer: { id: 'c_01', name: 'Vũ Thu Phương' } },
    expected: { customer: 'Vũ Thu Phương' }
  },
  {
    id: 'ADV_CTX_006',
    category: 'CONTEXT_TRAP',
    input: 'Thôi hủy đi',
    description: 'User cancels pending booking workflow',
    severity: 'HIGH',
    conversationHistory: [
      { role: 'user', content: 'Đặt lịch cắt tóc cho Lan mai 3h' },
      { role: 'assistant', content: 'Xác nhận đặt lịch cho Lan lúc 15:00 ngày mai?' }
    ],
    expected: { isRejected: true }
  },
  {
    id: 'ADV_CTX_007',
    category: 'CONTEXT_TRAP',
    input: 'Cho chị ấy vào lịch mai 3h',
    description: 'Pronoun used immediately after an explicit cancellation (Must NOT silently resurrect cancelled customer)',
    severity: 'CRITICAL',
    conversationHistory: [
      { role: 'user', content: 'Đặt lịch cho Lan' },
      { role: 'user', content: 'Thôi hủy đi không làm nữa' },
      { role: 'assistant', content: 'Đã hủy thao tác theo yêu cầu.' }
    ],
    expected: { needsClarification: true }
  },
  {
    id: 'ADV_CTX_008',
    category: 'CONTEXT_TRAP',
    input: 'Doanh thu hôm nay bao nhiêu?',
    description: 'Context switch away from customer to general revenue (Wipes customer targeting)',
    severity: 'LOW',
    conversationHistory: [
      { role: 'user', content: 'Tìm khách hàng Lan' },
      { role: 'assistant', content: 'Tìm thấy thông tin khách Lan.' }
    ],
    expected: { intent: 'QUERY_REVENUE' }
  },
  {
    id: 'ADV_CTX_009',
    category: 'CONTEXT_TRAP',
    input: 'Đặt 4h',
    description: 'Turn 4 in multi-turn appointment assembly: Turn 1=Lan, Turn 2=Cắt tóc, Turn 3=Mai, Turn 4=4h',
    severity: 'HIGH',
    conversationHistory: [
      { role: 'user', content: 'Đặt lịch cho chị Lan' },
      { role: 'assistant', content: 'Chị Lan muốn làm dịch vụ gì ạ?' },
      { role: 'user', content: 'Cắt tóc' },
      { role: 'assistant', content: 'Vào ngày nào ạ?' },
      { role: 'user', content: 'Mai' },
      { role: 'assistant', content: 'Vào mấy giờ ạ?' }
    ],
    context: {
      activeContextEntities: [{ type: 'customer', id: 'c_lan', name: 'Lan' }]
    },
    expected: { customer: 'Lan', service: 'Cắt tóc', time: '16:00' }
  },
  {
    id: 'ADV_CTX_010',
    category: 'CONTEXT_TRAP',
    input: 'Đổi sang thợ Minh nhé',
    description: 'Staff assignment updated during multi-turn booking without wiping customer or time',
    severity: 'MEDIUM',
    conversationHistory: [
      { role: 'user', content: 'Đặt cho Lan mai lúc 15h' },
      { role: 'assistant', content: 'Xác nhận tạo lịch cho Lan lúc 15:00 ngày mai?' }
    ],
    expected: { staff: 'Minh', intent: 'UPDATE_APPOINTMENT' }
  },
  {
    id: 'ADV_CTX_011',
    category: 'CONTEXT_TRAP',
    input: 'Cho khách đó làm uốn lạnh',
    description: 'Pronoun "khách đó" referring to customer in context',
    severity: 'MEDIUM',
    context: {
      activeContextEntities: [{ type: 'customer', id: 'c_thanh', name: 'Nguyễn Tiến Thành' }]
    },
    expected: { customer: 'Nguyễn Tiến Thành', service: 'uốn' }
  },
  {
    id: 'ADV_CTX_012',
    category: 'CONTEXT_TRAP',
    input: 'Hủy lịch vừa đặt',
    description: 'Pronoun "lịch vừa đặt" with active appointment context',
    severity: 'HIGH',
    context: {
      selectedAppointment: { id: 'appt_recent_1', customer_name: 'Lan', start_time: '15:00' }
    },
    expected: { intent: 'CANCEL_APPOINTMENT' }
  },
  {
    id: 'ADV_CTX_013',
    category: 'CONTEXT_TRAP',
    input: 'Thế còn thợ đó chiều nay có rảnh không?',
    description: 'Pronoun "thợ đó" referring to staff in context',
    severity: 'MEDIUM',
    context: {
      activeContextEntities: [{ type: 'staff', id: 's_tuan', name: 'Tuấn' }]
    },
    expected: { staff: 'Tuấn', intent: 'SEARCH_STAFF' }
  },
  {
    id: 'ADV_CTX_014',
    category: 'CONTEXT_TRAP',
    input: 'Hôm nay khách này chi tiêu bao nhiêu?',
    description: 'Contextual invoice read for selected customer',
    severity: 'LOW',
    context: { selectedCustomer: { id: 'c_02', name: 'Phạm Băng Băng' } },
    expected: { customer: 'Phạm Băng Băng' }
  },
  {
    id: 'ADV_CTX_015',
    category: 'CONTEXT_TRAP',
    input: 'Lịch của người đó lúc mấy giờ?',
    description: 'Querying appointment time for selected customer',
    severity: 'LOW',
    context: { selectedCustomer: { id: 'c_03', name: 'Trần Đô Linh' } },
    expected: { customer: 'Trần Đô Linh' }
  },
  {
    id: 'ADV_CTX_016',
    category: 'CONTEXT_TRAP',
    input: 'Đổi sang ngày mai chứ không phải hôm nay',
    description: 'Date correction in active booking',
    severity: 'MEDIUM',
    conversationHistory: [
      { role: 'user', content: 'Đặt lịch cho Lan hôm nay 15h' },
      { role: 'assistant', content: 'Xác nhận tạo lịch cho Lan lúc 15:00 hôm nay?' }
    ],
    expected: { intent: 'UPDATE_APPOINTMENT' }
  },
  {
    id: 'ADV_CTX_017',
    category: 'CONTEXT_TRAP',
    input: 'Ủa vậy thợ nào rảnh chiều mai?',
    description: 'Follow-up staff search after discovering preferred staff is busy',
    severity: 'LOW',
    conversationHistory: [
      { role: 'user', content: 'Minh rảnh chiều mai không?' },
      { role: 'assistant', content: 'Minh đã kín lịch chiều mai.' }
    ],
    expected: { intent: 'SEARCH_STAFF' }
  },
  {
    id: 'ADV_CTX_018',
    category: 'CONTEXT_TRAP',
    input: 'Cho thợ Hoa đi',
    description: 'Follow-up selection of staff Hoa inheriting date and time from previous turn',
    severity: 'MEDIUM',
    conversationHistory: [
      { role: 'user', content: 'Ai còn trống 15h mai?' },
      { role: 'assistant', content: 'Thợ Hoa và thợ Tuấn còn trống lúc 15:00 ngày mai.' }
    ],
    expected: { staff: 'Hoa' }
  },
  {
    id: 'ADV_CTX_019',
    category: 'CONTEXT_TRAP',
    input: 'Không, chị Lan khác',
    description: 'Disambiguation correction rejection ("Không, Lan khác")',
    severity: 'HIGH',
    conversationHistory: [
      { role: 'user', content: 'Đặt cho Lan' },
      { role: 'assistant', content: 'Bạn muốn đặt cho Nguyễn Thị Lan (SĐT: 0901234567)?' }
    ],
    expected: { needsClarification: true }
  },
  {
    id: 'ADV_CTX_020',
    category: 'CONTEXT_TRAP',
    input: 'Lan đuôi 999 đó em',
    description: 'Clarifying customer identity with phone suffix',
    severity: 'MEDIUM',
    conversationHistory: [
      { role: 'user', content: 'Không, Lan khác' },
      { role: 'assistant', content: 'Vui lòng cung cấp số điện thoại của chị Lan.' }
    ],
    expected: { customer: '999' }
  },
  {
    id: 'ADV_CTX_021',
    category: 'CONTEXT_TRAP',
    input: 'Thôi bỏ đi',
    description: 'Colloquial cancellation phrasing ("Thôi bỏ đi")',
    severity: 'LOW',
    expected: { isRejected: true }
  },
  {
    id: 'ADV_CTX_022',
    category: 'CONTEXT_TRAP',
    input: 'Dừng lại đừng lưu',
    description: 'Explicit rejection of unconfirmed write operation',
    severity: 'HIGH',
    expected: { isRejected: true }
  },
  {
    id: 'ADV_CTX_023',
    category: 'CONTEXT_TRAP',
    input: 'Không đặt nữa nhé',
    description: 'Explicit abort intent',
    severity: 'LOW',
    expected: { isRejected: true }
  },
  {
    id: 'ADV_CTX_024',
    category: 'CONTEXT_TRAP',
    input: 'Cho khách này qua salon chi nhánh 2',
    description: 'Cross-branch transfer request (Needs branch validation)',
    severity: 'HIGH',
    context: { selectedCustomer: { id: 'c_01', name: 'Lan' } },
    expected: { customer: 'Lan' }
  },
  {
    id: 'ADV_CTX_025',
    category: 'CONTEXT_TRAP',
    input: 'Xóa lịch của người này',
    description: 'Delete appointment for selected customer',
    severity: 'HIGH',
    context: { selectedCustomer: { id: 'c_01', name: 'Lan' } },
    expected: { intent: 'CANCEL_APPOINTMENT', customer: 'Lan' }
  }
];
