/**
 * Date/Time Scenarios (Phase 5 Benchmark)
 * 15 real-world Vietnamese temporal scenarios
 */

import { EvaluationScenario } from '../EvaluationCase';

export const DATETIME_SCENARIOS: EvaluationScenario[] = [
  {
    id: 'TIME_001',
    category: 'DATETIME_UNDERSTANDING',
    input: 'Đặt lịch 3h chiều',
    description: 'Afternoon 12h to 24h conversion',
    expected: { time: '15:00' }
  },
  {
    id: 'TIME_002',
    category: 'DATETIME_UNDERSTANDING',
    input: 'Đặt lúc 15h',
    description: 'Exact 24h hour format',
    expected: { time: '15:00' }
  },
  {
    id: 'TIME_003',
    category: 'DATETIME_UNDERSTANDING',
    input: 'Đặt lúc 3 rưỡi chiều',
    description: 'Vietnamese colloquial "rưỡi" (half hour)',
    expected: { time: '15:30' }
  },
  {
    id: 'TIME_004',
    category: 'DATETIME_UNDERSTANDING',
    input: 'Khách hẹn 3h30 chiều mai',
    description: 'Date and hour with minutes',
    expected: { time: '15:30' }
  },
  {
    id: 'TIME_005',
    category: 'DATETIME_UNDERSTANDING',
    input: 'Hẹn lúc 9h sáng',
    description: 'Morning hour format',
    expected: { time: '09:00' }
  },
  {
    id: 'TIME_006',
    category: 'DATETIME_UNDERSTANDING',
    input: 'Đặt lịch ngày mai lúc 10:00',
    description: 'Tomorrow standard format',
    expected: { time: '10:00' }
  },
  {
    id: 'TIME_007',
    category: 'DATETIME_UNDERSTANDING',
    input: 'Đặt lịch ngày mốt lúc 14:00',
    description: 'Day after tomorrow ("ngày mốt")',
    expected: { time: '14:00' }
  },
  {
    id: 'TIME_008',
    category: 'DATETIME_UNDERSTANDING',
    input: 'Khách đến hôm nay lúc 16h',
    description: 'Today exact hour',
    expected: { time: '16:00' }
  },
  {
    id: 'TIME_009',
    category: 'DATETIME_UNDERSTANDING',
    input: 'Chiều mai khách ghé',
    description: 'Afternoon range without exact time (must ask)',
    expected: { needsClarification: true, isAmbiguous: true }
  },
  {
    id: 'TIME_010',
    category: 'DATETIME_UNDERSTANDING',
    input: 'Sáng mai đặt lịch cắt tóc',
    description: 'Morning range without exact time (must ask)',
    expected: { needsClarification: true, isAmbiguous: true }
  },
  {
    id: 'TIME_011',
    category: 'DATETIME_UNDERSTANDING',
    input: 'Tối nay 19h',
    description: 'Evening exact hour',
    expected: { time: '19:00' }
  },
  {
    id: 'TIME_012',
    category: 'DATETIME_UNDERSTANDING',
    input: 'Khoảng 3h chiều',
    description: 'Approximate time expression',
    expected: { time: '15:00' }
  },
  {
    id: 'TIME_013',
    category: 'DATETIME_UNDERSTANDING',
    input: 'Hẹn sau 4h chiều',
    description: 'Time with relative modifier "sau"',
    expected: { time: '16:00' }
  },
  {
    id: 'TIME_014',
    category: 'DATETIME_UNDERSTANDING',
    input: 'Đặt lịch thứ 2 lúc 10h',
    description: 'Day of week resolution',
    expected: { time: '10:00' }
  },
  {
    id: 'TIME_015',
    category: 'DATETIME_UNDERSTANDING',
    input: 'Cuối tuần này lúc 15:00',
    description: 'Weekend resolution',
    expected: { time: '15:00' }
  }
];
