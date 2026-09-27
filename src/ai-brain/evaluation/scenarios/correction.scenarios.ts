/**
 * Correction and Cancellation Scenarios (Phase 5 Benchmark)
 * 20 scenarios (10 corrections, 10 cancellations)
 */

import { EvaluationScenario } from '../EvaluationCase';

export const CORRECTION_SCENARIOS: EvaluationScenario[] = [
  {
    id: 'COR_001',
    category: 'CORRECTION',
    input: 'Không, 4 giờ',
    description: 'User corrects time from 15:00 to 16:00 during confirmation wait',
    conversationHistory: [
      { role: 'user', content: 'Đặt lịch cho Lan 3h' },
      { role: 'assistant', content: 'Xác nhận tạo lịch cho Lan lúc 15:00?' }
    ],
    expected: { time: '16:00', intent: 'UPDATE_APPOINTMENT' }
  },
  {
    id: 'COR_002',
    category: 'CORRECTION',
    input: 'Đổi sang 16h',
    description: 'Direct time correction',
    expected: { time: '16:00' }
  },
  {
    id: 'COR_003',
    category: 'CORRECTION',
    input: 'Không phải 15h mà là 14h',
    description: 'Contrastive time correction',
    expected: { time: '14:00' }
  },
  {
    id: 'COR_004',
    category: 'CORRECTION',
    input: 'Đặt lúc 17:00 chứ không phải 15:00',
    description: 'Explicit time replacement',
    expected: { time: '17:00' }
  },
  {
    id: 'COR_005',
    category: 'CORRECTION',
    input: 'Đổi sang ngày mai chứ không phải hôm nay',
    description: 'Date correction',
    expected: {}
  },
  {
    id: 'COR_006',
    category: 'CORRECTION',
    input: 'Không phải Lan, chị Hoa',
    description: 'Customer candidate correction',
    expected: { customer: 'Hoa' }
  },
  {
    id: 'COR_007',
    category: 'CORRECTION',
    input: 'Đổi thợ sang Minh nhé',
    description: 'Staff correction during booking',
    expected: { staff: 'Minh' }
  },
  {
    id: 'COR_008',
    category: 'CORRECTION',
    input: 'Không làm cắt tóc, đổi sang nhuộm',
    description: 'Service correction',
    expected: { service: 'nhuộm' }
  },
  {
    id: 'COR_009',
    category: 'CORRECTION',
    input: 'Nhầm số, sđt là 0909998877',
    description: 'Phone number correction during customer creation',
    expected: { customer: '0909998877' }
  },
  {
    id: 'COR_010',
    category: 'CORRECTION',
    input: 'Sửa lại giờ là 10h sáng',
    description: 'Morning hour correction',
    expected: { time: '10:00' }
  }
];

export const CANCELLATION_SCENARIOS: EvaluationScenario[] = [
  {
    id: 'CAN_001',
    category: 'CANCELLATION',
    input: 'Thôi',
    description: 'Colloquial cancellation',
    expected: { isRejected: true }
  },
  {
    id: 'CAN_002',
    category: 'CANCELLATION',
    input: 'Hủy đi',
    description: 'Direct abort command',
    expected: { isRejected: true }
  },
  {
    id: 'CAN_003',
    category: 'CANCELLATION',
    input: 'Không đặt nữa',
    description: 'Stop booking process',
    expected: { isRejected: true }
  },
  {
    id: 'CAN_004',
    category: 'CANCELLATION',
    input: 'Dừng lại, đừng tạo',
    description: 'Abort confirmation prompt',
    expected: { isRejected: true }
  },
  {
    id: 'CAN_005',
    category: 'CANCELLATION',
    input: 'Bỏ qua đi',
    description: 'Dismiss active prompt',
    expected: { isRejected: true }
  },
  {
    id: 'CAN_006',
    category: 'CANCELLATION',
    input: 'Thôi không làm nữa',
    description: 'Withdraw request completely',
    expected: { isRejected: true }
  },
  {
    id: 'CAN_007',
    category: 'CANCELLATION',
    input: 'Cancel',
    description: 'English cancel keyword in Vietnamese context',
    expected: { isRejected: true }
  },
  {
    id: 'CAN_008',
    category: 'CANCELLATION',
    input: 'Không đồng ý',
    description: 'Explicit rejection of confirmation gate',
    expected: { isRejected: true }
  },
  {
    id: 'CAN_009',
    category: 'CANCELLATION',
    input: 'Hủy bỏ thao tác này',
    description: 'Formal cancellation command',
    expected: { isRejected: true }
  },
  {
    id: 'CAN_010',
    category: 'CANCELLATION',
    input: 'Đừng lưu',
    description: 'Reject database persist',
    expected: { isRejected: true }
  }
];
