/**
 * Context Scenarios (Phase 5 Benchmark)
 * 15 multi-turn and pronoun context resolution scenarios
 */

import { EvaluationScenario } from '../EvaluationCase';

export const CONTEXT_SCENARIOS: EvaluationScenario[] = [
  {
    id: 'CTX_001',
    category: 'CONTEXT_TRACKING',
    input: 'Đặt lịch cho khách này',
    description: 'Pronoun "khách này" with active selectedCustomer',
    context: {
      selectedCustomer: { id: 'c_001', name: 'Đặng Nam', phone: '0901234567' }
    },
    expected: { customer: 'Đặng Nam' }
  },
  {
    id: 'CTX_002',
    category: 'CONTEXT_TRACKING',
    input: 'Cho chị ấy cắt tóc',
    description: 'Pronoun "chị ấy" referring to previous customer',
    context: {
      activeContextEntities: [{ type: 'customer', id: 'c_lan', name: 'Nguyễn Thị Lan', phone: '090111222' }]
    },
    expected: { customer: 'Nguyễn Thị Lan' }
  },
  {
    id: 'CTX_003',
    category: 'CONTEXT_TRACKING',
    input: 'Đổi lịch này sang 16h',
    description: 'Pronoun "lịch này" referring to active appointment',
    context: {
      selectedAppointment: { id: 'appt_xyz', date: '2026-09-28', time: '14:00' }
    },
    expected: { time: '16:00' }
  },
  {
    id: 'CTX_004',
    category: 'CONTEXT_TRACKING',
    input: 'Hủy lịch đó đi',
    description: 'Pronoun "lịch đó" referring to active appointment',
    context: {
      selectedAppointment: { id: 'appt_xyz', date: '2026-09-28', time: '14:00' }
    },
    expected: { intent: 'CANCEL_APPOINTMENT' }
  },
  {
    id: 'CTX_005',
    category: 'CONTEXT_TRACKING',
    input: 'Cho thợ này làm nhé',
    description: 'Pronoun "thợ này" referring to active staff',
    context: {
      activeContextEntities: [{ type: 'staff', id: 'st_minh', name: 'Trần Văn Minh' }]
    },
    expected: { staff: 'Trần Văn Minh' }
  },
  {
    id: 'CTX_006',
    category: 'CONTEXT_TRACKING',
    input: 'Đặt lịch cho khách này',
    description: 'Pronoun "khách này" WITHOUT context (must ask who)',
    context: {},
    expected: { needsClarification: true }
  },
  {
    id: 'CTX_007',
    category: 'CONTEXT_TRACKING',
    input: 'Cắt tóc',
    description: 'Multi-turn follow-up providing missing service',
    conversationHistory: [
      { role: 'user', content: 'Đặt lịch cho chị Lan mai lúc 3h' },
      { role: 'assistant', content: 'Chị Lan muốn đặt dịch vụ nào?' }
    ],
    context: {
      activeContextEntities: [{ type: 'customer', id: 'c_lan', name: 'Lan' }]
    },
    expected: { service: 'Cắt tóc' }
  },
  {
    id: 'CTX_008',
    category: 'CONTEXT_TRACKING',
    input: 'Mai',
    description: 'Multi-turn follow-up providing missing date',
    conversationHistory: [
      { role: 'user', content: 'Đặt lịch cho chị Lan cắt tóc lúc 3h' },
      { role: 'assistant', content: 'Chị Lan muốn đặt lịch vào ngày nào?' }
    ],
    expected: {}
  },
  {
    id: 'CTX_009',
    category: 'CONTEXT_TRACKING',
    input: '3h chiều',
    description: 'Multi-turn follow-up providing missing time',
    conversationHistory: [
      { role: 'user', content: 'Đặt lịch cho chị Lan cắt tóc ngày mai' },
      { role: 'assistant', content: 'Khách muốn đặt lịch vào mấy giờ?' }
    ],
    expected: { time: '15:00' }
  },
  {
    id: 'CTX_010',
    category: 'CONTEXT_TRACKING',
    input: 'Cho thợ Minh',
    description: 'Follow-up specifying staff after checking availability',
    conversationHistory: [
      { role: 'user', content: 'Hôm nay ai còn trống lúc 14h?' },
      { role: 'assistant', content: 'Thợ Minh và thợ Hoa còn trống.' }
    ],
    expected: { staff: 'Minh' }
  },
  {
    id: 'CTX_011',
    category: 'CONTEXT_TRACKING',
    input: 'Khách này mua gì hôm nay?',
    description: 'Contextual invoice read for selected customer',
    context: {
      selectedCustomer: { id: 'c_001', name: 'Đặng Nam', phone: '0901234567' }
    },
    expected: { customer: 'Đặng Nam' }
  },
  {
    id: 'CTX_012',
    category: 'CONTEXT_TRACKING',
    input: 'Lịch của khách này hôm nay',
    description: 'Contextual appointment read for selected customer',
    context: {
      selectedCustomer: { id: 'c_001', name: 'Đặng Nam', phone: '0901234567' }
    },
    expected: { customer: 'Đặng Nam' }
  },
  {
    id: 'CTX_013',
    category: 'CONTEXT_TRACKING',
    input: 'Thế doanh thu hôm nay bao nhiêu?',
    description: 'Context switch away from customer to revenue (wipes customer target)',
    conversationHistory: [
      { role: 'user', content: 'Tìm khách Lan' }
    ],
    expected: { intent: 'QUERY_REVENUE' }
  },
  {
    id: 'CTX_014',
    category: 'CONTEXT_TRACKING',
    input: 'Người này chưa có lịch',
    description: 'Pronoun "người này" referring to active customer',
    context: {
      selectedCustomer: { id: 'c_002', name: 'Hoàng Yến' }
    },
    expected: { customer: 'Hoàng Yến' }
  },
  {
    id: 'CTX_015',
    category: 'CONTEXT_TRACKING',
    input: 'Cho khách đó làm combo gội đầu',
    description: 'Pronoun "khách đó" referring to recent customer',
    context: {
      activeContextEntities: [{ type: 'customer', id: 'c_003', name: 'Minh Châu' }]
    },
    expected: { customer: 'Minh Châu', service: 'gội đầu' }
  }
];
