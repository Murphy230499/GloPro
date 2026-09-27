/**
 * Phase 5.5 Adversarial Benchmark — Correction & Contradiction Traps (15 scenarios)
 * 
 * Tests rapid mid-dialogue corrections, contrastive reversals, confirmation-with-modification,
 * and contradictory inputs.
 */

import { EvaluationScenario } from '../EvaluationCase';

export const CORRECTION_TRAPS_SCENARIOS: EvaluationScenario[] = [
  {
    id: 'ADV_COR_001',
    category: 'CORRECTION_TRAP',
    input: 'Không, 4 giờ',
    description: 'Direct time correction replacing 15:00 with 16:00',
    severity: 'MEDIUM',
    conversationHistory: [
      { role: 'user', content: 'Đặt cho Lan 3h' },
      { role: 'assistant', content: 'Xác nhận đặt lịch cho Lan lúc 15:00?' }
    ],
    expected: { time: '16:00', intent: 'UPDATE_APPOINTMENT' }
  },
  {
    id: 'ADV_COR_002',
    category: 'CORRECTION_TRAP',
    input: 'Không phải Lan, chị Hoa',
    description: 'Candidate replacement from Lan to Hoa during confirmation',
    severity: 'HIGH',
    conversationHistory: [
      { role: 'user', content: 'Đặt lịch cho Lan' },
      { role: 'assistant', content: 'Xác nhận tạo lịch cho Nguyễn Thị Lan?' }
    ],
    expected: { customer: 'Hoa', intent: 'UPDATE_APPOINTMENT' }
  },
  {
    id: 'ADV_COR_003',
    category: 'CORRECTION_TRAP',
    input: 'Không phải 15h mà là 14h',
    description: 'Contrastive time correction: "Không phải X mà là Y" -> captures 14:00',
    severity: 'HIGH',
    expected: { time: '14:00', intent: 'UPDATE_APPOINTMENT' }
  },
  {
    id: 'ADV_COR_004',
    category: 'CORRECTION_TRAP',
    input: 'Đặt lúc 17:00 chứ không phải 15:00',
    description: 'Explicit time replacement: "A chứ không phải B" -> captures 17:00',
    severity: 'HIGH',
    expected: { time: '17:00', intent: 'UPDATE_APPOINTMENT' }
  },
  {
    id: 'ADV_COR_005',
    category: 'CORRECTION_TRAP',
    input: 'Đổi sang thợ Minh nhé',
    description: 'Staff correction during booking flow',
    severity: 'MEDIUM',
    conversationHistory: [
      { role: 'user', content: 'Đặt cho Lan thợ Tuấn lúc 15h' },
      { role: 'assistant', content: 'Xác nhận đặt thợ Tuấn cho Lan?' }
    ],
    expected: { staff: 'Minh', intent: 'UPDATE_APPOINTMENT' }
  },
  {
    id: 'ADV_COR_006',
    category: 'CORRECTION_TRAP',
    input: 'Không làm cắt tóc nữa, đổi sang nhuộm tóc',
    description: 'Service replacement during booking',
    severity: 'MEDIUM',
    expected: { service: 'nhuộm', intent: 'UPDATE_APPOINTMENT' }
  },
  {
    id: 'ADV_COR_007',
    category: 'CORRECTION_TRAP',
    input: 'Đổi sang thứ 7 tuần này',
    description: 'Date replacement from weekday to Saturday',
    severity: 'MEDIUM',
    expected: { intent: 'UPDATE_APPOINTMENT' }
  },
  {
    id: 'ADV_COR_008',
    category: 'CORRECTION_TRAP',
    input: 'Đặt ngày mai... à hôm qua',
    description: 'Contradiction attempting to set appointment in the past (Must reject)',
    severity: 'CRITICAL',
    expected: { isRejected: true }
  },
  {
    id: 'ADV_COR_009',
    category: 'CORRECTION_TRAP',
    input: 'OK nhưng đổi sang 4h',
    description: 'Simultaneous confirmation and modification (Must NOT execute old 3h plan!)',
    severity: 'CRITICAL',
    conversationHistory: [
      { role: 'user', content: 'Đặt cho Lan lúc 15h' },
      { role: 'assistant', content: 'Xác nhận tạo lịch cho Lan lúc 15:00?' }
    ],
    expected: { time: '16:00', intent: 'UPDATE_APPOINTMENT' }
  },
  {
    id: 'ADV_COR_010',
    category: 'CORRECTION_TRAP',
    input: 'Đổi sang 15h, à thôi 16h đi em',
    description: 'Double correction in single message ("15h -> 16h") -> resolves 16:00',
    severity: 'HIGH',
    expected: { time: '16:00', intent: 'UPDATE_APPOINTMENT' }
  },
  {
    id: 'ADV_COR_011',
    category: 'CORRECTION_TRAP',
    input: '3h sáng... à nhầm 3h chiều nhé',
    description: 'Period correction AM to PM',
    severity: 'LOW',
    expected: { time: '15:00', intent: 'UPDATE_APPOINTMENT' }
  },
  {
    id: 'ADV_COR_012',
    category: 'CORRECTION_TRAP',
    input: 'Minh làm... không, Hoa làm mới đúng',
    description: 'Immediate staff correction',
    severity: 'MEDIUM',
    expected: { staff: 'Hoa', intent: 'UPDATE_APPOINTMENT' }
  },
  {
    id: 'ADV_COR_013',
    category: 'CORRECTION_TRAP',
    input: 'Không phải số đó, số mới là 0933445566',
    description: 'Customer phone correction',
    severity: 'MEDIUM',
    expected: { intent: 'UPDATE_CUSTOMER' }
  },
  {
    id: 'ADV_COR_014',
    category: 'CORRECTION_TRAP',
    input: 'Thôi đừng đổi nữa để nguyên lịch cũ',
    description: 'Correction abort, maintaining original plan',
    severity: 'LOW',
    expected: { isRejected: true }
  },
  {
    id: 'ADV_COR_015',
    category: 'CORRECTION_TRAP',
    input: 'Hủy hết mấy cái vừa sửa đi',
    description: 'Rollback pending corrections',
    severity: 'HIGH',
    expected: { isRejected: true }
  }
];
