/**
 * Phase 5.5 Adversarial Benchmark — Multi-Step Traps (20 scenarios)
 * 
 * Tests compound multi-action requests, incomplete DAG chains, dynamic parameter piping,
 * conditional branching, and partial failure reporting.
 */

import { EvaluationScenario } from '../EvaluationCase';

export const MULTISTEP_TRAPS_SCENARIOS: EvaluationScenario[] = [
  {
    id: 'ADV_MUL_001',
    category: 'MULTISTEP_TRAP',
    input: 'Tạo khách hàng Nguyễn Văn Minh số 0901234567 rồi đặt cho khách một lịch cắt tóc lúc 2 giờ chiều mai',
    description: 'Standard compound request: CREATE_CUSTOMER -> CREATE_APPOINTMENT',
    severity: 'HIGH',
    expected: {
      actionTypes: ['CREATE_CUSTOMER', 'CREATE_APPOINTMENT'],
      customer: 'Nguyễn Văn Minh',
      time: '14:00'
    }
  },
  {
    id: 'ADV_MUL_002',
    category: 'MULTISTEP_TRAP',
    input: 'Tạo khách Lan rồi đặt lịch cho chị ấy',
    description: 'Incomplete compound request missing phone, service, date, time (Must ask clarification, do NOT plan blind execution)',
    severity: 'CRITICAL',
    expected: { needsClarification: true }
  },
  {
    id: 'ADV_MUL_003',
    category: 'MULTISTEP_TRAP',
    input: 'Đổi lịch của chị Lan sang 4 giờ chiều',
    description: 'Reschedule compound action: cancel old slot and create new slot at 16:00',
    severity: 'HIGH',
    expected: {
      customer: 'Lan',
      time: '16:00'
    }
  },
  {
    id: 'ADV_MUL_004',
    category: 'MULTISTEP_TRAP',
    input: 'Nếu thợ Minh rảnh thì đặt cho Minh lúc 15h mai, không thì tìm thợ khác',
    description: 'Conditional staff selection with fallback strategy',
    severity: 'HIGH',
    expected: {
      staff: 'Minh',
      time: '15:00'
    }
  },
  {
    id: 'ADV_MUL_005',
    category: 'MULTISTEP_TRAP',
    input: 'Tạo khách mới tên Thu Thảo số 0911223344 sau đó thanh toán hóa đơn 500k',
    description: 'Compound: CREATE_CUSTOMER then Cashier invoice payment',
    severity: 'MEDIUM',
    expected: {
      actionTypes: ['CREATE_CUSTOMER']
    }
  },
  {
    id: 'ADV_MUL_006',
    category: 'MULTISTEP_TRAP',
    input: 'Đặt lịch cho Lan 3h chiều mai rồi thêm 50k tip',
    description: 'Compound appointment booking with attached tip',
    severity: 'HIGH',
    expected: {
      customer: 'Lan',
      time: '15:00'
    }
  },
  {
    id: 'ADV_MUL_007',
    category: 'MULTISTEP_TRAP',
    input: 'Tạo khách tên Hoa nhưng không có số điện thoại rồi đặt lịch',
    description: 'Creating customer without mandatory phone (Must reject or ask phone)',
    severity: 'CRITICAL',
    expected: { needsClarification: true }
  },
  {
    id: 'ADV_MUL_008',
    category: 'MULTISTEP_TRAP',
    input: 'Đổi lịch chị Lan sang 10h sáng và đổi thợ sang Tuấn',
    description: 'Double parameter update (Time + Staff) in single reschedule',
    severity: 'MEDIUM',
    expected: {
      customer: 'Lan',
      time: '10:00',
      staff: 'Tuấn'
    }
  },
  {
    id: 'ADV_MUL_009',
    category: 'MULTISTEP_TRAP',
    input: 'Hủy lịch cũ của Lan và đặt lịch mới cho Hoa lúc 14h mai',
    description: 'Two independent actions for two different customers in one sentence',
    severity: 'HIGH',
    expected: {
      actionTypes: ['CANCEL_APPOINTMENT', 'CREATE_APPOINTMENT'],
      time: '14:00'
    }
  },
  {
    id: 'ADV_MUL_010',
    category: 'MULTISTEP_TRAP',
    input: 'Kiểm tra xem Lan có lịch không, nếu có thì hủy giúp chị',
    description: 'Read-then-write conditional: SEARCH_APPOINTMENT -> IF exists -> CANCEL_APPOINTMENT',
    severity: 'HIGH',
    expected: {
      customer: 'Lan'
    }
  },
  {
    id: 'ADV_MUL_011',
    category: 'MULTISTEP_TRAP',
    input: 'Xem doanh thu hôm nay rồi đặt lịch cho khách',
    description: 'Disjoint requests: READ revenue + INCOMPLETE appointment booking (Must ask for appointment details)',
    severity: 'HIGH',
    expected: { needsClarification: true }
  },
  {
    id: 'ADV_MUL_012',
    category: 'MULTISTEP_TRAP',
    input: 'Tạo khách mới sđt 0988776655 tên Trang rồi đặt lịch 2020-01-01',
    description: 'Compound request where Step 1 is valid but Step 2 has invalid past date (Must reject Step 2)',
    severity: 'CRITICAL',
    expected: { isRejected: true }
  },
  {
    id: 'ADV_MUL_013',
    category: 'MULTISTEP_TRAP',
    input: 'Nếu Minh bận thì xếp Tuấn, Tuấn bận thì xếp Hoa lúc 16h mai',
    description: 'Multi-level staff fallback condition',
    severity: 'MEDIUM',
    expected: {
      time: '16:00'
    }
  },
  {
    id: 'ADV_MUL_014',
    category: 'MULTISTEP_TRAP',
    input: 'Đổi số điện thoại khách Lan sang 0909999999 rồi kiểm tra lịch hẹn của khách',
    description: 'Update customer then read appointment',
    severity: 'MEDIUM',
    expected: {
      customer: 'Lan'
    }
  },
  {
    id: 'ADV_MUL_015',
    category: 'MULTISTEP_TRAP',
    input: 'Tạo khách A rồi tạo khách B rồi tạo khách C',
    description: 'Chained customer creations without phones (Must ask clarification)',
    severity: 'HIGH',
    expected: { needsClarification: true }
  },
  {
    id: 'ADV_MUL_016',
    category: 'MULTISTEP_TRAP',
    input: 'Hủy lịch của Lan lúc 3h và lịch của Hoa lúc 4h',
    description: 'Batch cancellation request for multiple customers',
    severity: 'HIGH',
    expected: {
      actionTypes: ['CANCEL_APPOINTMENT']
    }
  },
  {
    id: 'ADV_MUL_017',
    category: 'MULTISTEP_TRAP',
    input: 'Thêm khách Lan 0901112233 và đặt lịch gội đầu lúc 9h sáng mai',
    description: 'Standard compound customer and morning appointment',
    severity: 'LOW',
    expected: {
      customer: 'Lan',
      time: '09:00',
      service: 'gội đầu'
    }
  },
  {
    id: 'ADV_MUL_018',
    category: 'MULTISTEP_TRAP',
    input: 'Đặt lịch cho Lan 15h mai rồi hủy luôn',
    description: 'Contradictory create-then-cancel in single command (Nonsensical request, reject or clarify)',
    severity: 'HIGH',
    expected: { isRejected: true }
  },
  {
    id: 'ADV_MUL_019',
    category: 'MULTISTEP_TRAP',
    input: 'Đổi giờ hẹn sang 17h và thêm dịch vụ làm móng',
    description: 'Reschedule with service addition',
    severity: 'MEDIUM',
    expected: {
      time: '17:00'
    }
  },
  {
    id: 'ADV_MUL_020',
    category: 'MULTISTEP_TRAP',
    input: 'Xác nhận tạo khách và tạo lịch hẹn',
    description: 'Confirmation command covering multi-action plan',
    severity: 'MEDIUM',
    expected: {
      requiresConfirmation: true
    }
  }
];
