/**
 * Phase 5.5 Adversarial Benchmark — Date & Time Ambiguity (20 scenarios)
 * 
 * Tests time ranges, colloquial Vietnamese clock expressions, impossible hours,
 * relative dates, and edge case boundaries.
 */

import { EvaluationScenario } from '../EvaluationCase';

export const DATETIME_AMBIGUITY_SCENARIOS: EvaluationScenario[] = [
  {
    id: 'ADV_TIME_001',
    category: 'DATETIME_AMBIGUITY',
    input: 'Đặt lịch cho chị Lan chiều mai',
    description: 'Time range "chiều mai" without specific hour (Must ask exact time, do NOT silently pick 14:00)',
    severity: 'HIGH',
    expected: { needsClarification: true, isAmbiguous: true }
  },
  {
    id: 'ADV_TIME_002',
    category: 'DATETIME_AMBIGUITY',
    input: 'Cho khách này sáng nay làm tóc',
    description: 'Time range "sáng nay" without specific hour (Must ask exact time)',
    severity: 'MEDIUM',
    context: { selectedCustomer: { id: 'c_01', name: 'Minh' } },
    expected: { needsClarification: true, isAmbiguous: true }
  },
  {
    id: 'ADV_TIME_003',
    category: 'DATETIME_AMBIGUITY',
    input: 'Đặt lịch 12h trưa mai cho chị Lan',
    description: '12h trưa -> exact 12:00',
    severity: 'LOW',
    expected: { time: '12:00', customer: 'Lan' }
  },
  {
    id: 'ADV_TIME_004',
    category: 'DATETIME_AMBIGUITY',
    input: 'Đặt lịch 12h đêm mai cho chị Lan',
    description: '12h đêm -> 00:00 or salon closed outside business hours',
    severity: 'HIGH',
    expected: { time: '00:00', customer: 'Lan' }
  },
  {
    id: 'ADV_TIME_005',
    category: 'DATETIME_AMBIGUITY',
    input: 'Cho Lan qua lúc 1h chiều',
    description: '1h chiều explicitly specifies 13:00',
    severity: 'LOW',
    expected: { time: '13:00', customer: 'Lan' }
  },
  {
    id: 'ADV_TIME_006',
    category: 'DATETIME_AMBIGUITY',
    input: 'Cho Lan qua lúc 1h sáng',
    description: '1h sáng explicitly specifies 01:00 (Outside business hours)',
    severity: 'MEDIUM',
    expected: { time: '01:00', customer: 'Lan' }
  },
  {
    id: 'ADV_TIME_007',
    category: 'DATETIME_AMBIGUITY',
    input: 'Đặt lịch cho Lan lúc 25h ngày mai',
    description: 'Impossible hour 25h (Must reject or ask clarification, do NOT roll over into 01:00)',
    severity: 'CRITICAL',
    expected: { needsClarification: true }
  },
  {
    id: 'ADV_TIME_008',
    category: 'DATETIME_AMBIGUITY',
    input: 'Đặt lịch lúc 3h60 chiều mai',
    description: 'Impossible minute 60 (Invalid time format)',
    severity: 'HIGH',
    expected: { needsClarification: true }
  },
  {
    id: 'ADV_TIME_009',
    category: 'DATETIME_AMBIGUITY',
    input: 'Đặt lịch lúc 3:75 cho chị Lan',
    description: 'Impossible minute 75 (Invalid time format)',
    severity: 'HIGH',
    expected: { needsClarification: true }
  },
  {
    id: 'ADV_TIME_010',
    category: 'DATETIME_AMBIGUITY',
    input: 'Mai cho chị Lan qua tầm 3h rưỡi nha',
    description: 'Approximate "tầm 3h rưỡi" -> resolves to 15:30 with approximate flag',
    severity: 'MEDIUM',
    expected: { time: '15:30', customer: 'Lan' }
  },
  {
    id: 'ADV_TIME_011',
    category: 'DATETIME_AMBIGUITY',
    input: 'Khoảng sau 4h chiều mai',
    description: 'Modifier "sau 4h" -> modifier after, range requires specific appointment slot',
    severity: 'MEDIUM',
    expected: { time: '16:00' }
  },
  {
    id: 'ADV_TIME_012',
    category: 'DATETIME_AMBIGUITY',
    input: 'Trước 5h chiều nay cho chị Lan làm',
    description: 'Modifier "trước 5h" -> modifier before 17:00',
    severity: 'MEDIUM',
    expected: { time: '17:00', customer: 'Lan' }
  },
  {
    id: 'ADV_TIME_013',
    category: 'DATETIME_AMBIGUITY',
    input: 'Đặt lịch cho chị Lan lúc 3h kém 15 chiều mai',
    description: 'Colloquial "3h kém 15" -> 14:45 (afternoon)',
    severity: 'HIGH',
    expected: { customer: 'Lan' }
  },
  {
    id: 'ADV_TIME_014',
    category: 'DATETIME_AMBIGUITY',
    input: 'Cuối tuần này đặt lịch cho chị Lan 10h sáng',
    description: 'Relative date "cuối tuần" (Saturday of current week)',
    severity: 'MEDIUM',
    expected: { time: '10:00', customer: 'Lan' }
  },
  {
    id: 'ADV_TIME_015',
    category: 'DATETIME_AMBIGUITY',
    input: 'Thứ 2 tuần sau lúc 14h',
    description: 'Next Monday at 14:00',
    severity: 'MEDIUM',
    expected: { time: '14:00' }
  },
  {
    id: 'ADV_TIME_016',
    category: 'DATETIME_AMBIGUITY',
    input: 'Ngày mốt lúc 4 giờ chiều',
    description: 'Relative day "ngày mốt" (+2 days) at 16:00',
    severity: 'LOW',
    expected: { time: '16:00' }
  },
  {
    id: 'ADV_TIME_017',
    category: 'DATETIME_AMBIGUITY',
    input: 'Đặt lịch hôm qua cho chị Lan',
    description: 'Past date "hôm qua" (Must reject past appointment creation)',
    severity: 'CRITICAL',
    expected: { isRejected: true }
  },
  {
    id: 'ADV_TIME_018',
    category: 'DATETIME_AMBIGUITY',
    input: 'Chị Lan ghé chập tối được không?',
    description: 'Vague regional period "chập tối" (Time range, needs specific hour)',
    severity: 'HIGH',
    expected: { customer: 'Lan', needsClarification: true }
  },
  {
    id: 'ADV_TIME_019',
    category: 'DATETIME_AMBIGUITY',
    input: 'Đặt lịch cho Lan 00:00 ngày mai',
    description: 'Exact boundary midnight 00:00',
    severity: 'MEDIUM',
    expected: { time: '00:00', customer: 'Lan' }
  },
  {
    id: 'ADV_TIME_020',
    category: 'DATETIME_AMBIGUITY',
    input: 'Mai lúc 3',
    description: 'Bare number "3" without unit or period (Needs clarification whether 3h or date 3)',
    severity: 'HIGH',
    expected: { needsClarification: true }
  }
];
