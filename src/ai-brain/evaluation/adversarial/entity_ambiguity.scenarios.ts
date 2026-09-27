/**
 * Phase 5.5 Adversarial Benchmark — Entity Ambiguity & Collision (25 scenarios)
 * 
 * Tests duplicate customer names, staff vs customer name collisions,
 * fuzzy typos, diacritic omissions, and vague pronoun references.
 */

import { EvaluationScenario } from '../EvaluationCase';

export const ENTITY_AMBIGUITY_SCENARIOS: EvaluationScenario[] = [
  {
    id: 'ADV_ENT_001',
    category: 'ENTITY_AMBIGUITY',
    input: 'Đặt lịch cho chị Lan 3h chiều mai',
    description: 'Duplicate customer names in database (Must ask clarification, do NOT pick first match)',
    severity: 'HIGH',
    context: {
      databaseSnapshot: {
        customers: [
          { id: 'c_lan_1', name: 'Nguyễn Thị Lan', phone: '0901111111' },
          { id: 'c_lan_2', name: 'Trần Thị Lan', phone: '0902222222' }
        ]
      }
    },
    expected: { needsClarification: true, isAmbiguous: true }
  },
  {
    id: 'ADV_ENT_002',
    category: 'ENTITY_AMBIGUITY',
    input: 'Đặt lịch cho chị Lan số 0901111111 mai lúc 15h',
    description: 'Customer with explicit phone number resolves disambiguation',
    severity: 'MEDIUM',
    context: {
      databaseSnapshot: {
        customers: [
          { id: 'c_lan_1', name: 'Nguyễn Thị Lan', phone: '0901111111' },
          { id: 'c_lan_2', name: 'Trần Thị Lan', phone: '0902222222' }
        ]
      }
    },
    expected: { customer: 'Lan', time: '15:00' }
  },
  {
    id: 'ADV_ENT_003',
    category: 'ENTITY_AMBIGUITY',
    input: 'Đặt lịch cho Minh mai lúc 3h chiều',
    description: 'Customer Minh vs Staff Minh collision: in "đặt lịch cho X", X is the customer',
    severity: 'HIGH',
    context: {
      databaseSnapshot: {
        customers: [{ id: 'c_minh_1', name: 'Lê Văn Minh', phone: '0912345678' }],
        staff: [{ id: 's_minh_1', name: 'Nguyễn Văn Minh' }]
      }
    },
    expected: { customer: 'Minh', time: '15:00' }
  },
  {
    id: 'ADV_ENT_004',
    category: 'ENTITY_AMBIGUITY',
    input: 'Xếp Minh làm cho chị Lan lúc 4h chiều mai',
    description: 'Customer Lan and Staff Minh: Xếp Minh làm cho chị Lan -> Staff=Minh, Customer=Lan',
    severity: 'CRITICAL',
    expected: { staff: 'Minh', customer: 'Lan', time: '16:00' }
  },
  {
    id: 'ADV_ENT_005',
    category: 'ENTITY_AMBIGUITY',
    input: 'Minh có lịch hôm nay không?',
    description: 'Collision query: could mean staff schedule or customer schedule without context (Needs clarification)',
    severity: 'HIGH',
    context: {
      databaseSnapshot: {
        customers: [{ id: 'c_minh_1', name: 'Minh' }],
        staff: [{ id: 's_minh_1', name: 'Minh' }]
      }
    },
    expected: { staff: 'Minh' }
  },
  {
    id: 'ADV_ENT_006',
    category: 'ENTITY_AMBIGUITY',
    input: 'Cho chị ấy vào lịch mai lúc 2h chiều',
    description: 'Pronoun "chị ấy" with zero previous context (Must ask clarification)',
    severity: 'HIGH',
    expected: { needsClarification: true }
  },
  {
    id: 'ADV_ENT_007',
    category: 'ENTITY_AMBIGUITY',
    input: 'Đặt lịch cho khách này ngày mai lúc 16h',
    description: 'Pronoun "khách này" with active context on screen',
    severity: 'MEDIUM',
    context: { selectedCustomer: { id: 'c_sel_1', name: 'Ngô Thanh Vân' } },
    expected: { customer: 'Ngô Thanh Vân', time: '16:00' }
  },
  {
    id: 'ADV_ENT_008',
    category: 'ENTITY_AMBIGUITY',
    input: 'Đặt lịch cho Nguyen Thi Lan 3h chiều',
    description: 'Customer name completely unaccented (fuzzy diacritic normalization)',
    severity: 'MEDIUM',
    expected: { customer: 'Lan', time: '15:00' }
  },
  {
    id: 'ADV_ENT_009',
    category: 'ENTITY_AMBIGUITY',
    input: 'Đặt cho chị Lann lúc 15h mai',
    description: 'Minor typo "Lann" with single matching customer Lan',
    severity: 'LOW',
    expected: { customer: 'Lan', time: '15:00' }
  },
  {
    id: 'ADV_ENT_010',
    category: 'ENTITY_AMBIGUITY',
    input: 'Cho chị Lan Nguyễn làm tóc mai 4h',
    description: 'Reverse word order "Lan Nguyễn" vs "Nguyễn Thị Lan"',
    severity: 'MEDIUM',
    expected: { customer: 'Lan', time: '16:00' }
  },
  {
    id: 'ADV_ENT_011',
    category: 'ENTITY_AMBIGUITY',
    input: 'Đặt cho cô Hoa 10h sáng mai dịch vụ cắt',
    description: 'Ambiguous service "cắt" (cắt tóc nam, cắt tóc nữ hay cắt tóc trẻ em? Needs clarification)',
    severity: 'MEDIUM',
    expected: { customer: 'Hoa', time: '10:00' }
  },
  {
    id: 'ADV_ENT_012',
    category: 'ENTITY_AMBIGUITY',
    input: 'Đặt cho chị Vy làm combo gội dưỡng sinh 14h mai',
    description: 'Precise service name "gội dưỡng sinh"',
    severity: 'LOW',
    expected: { customer: 'Vy', service: 'gội đầu', time: '14:00' }
  },
  {
    id: 'ADV_ENT_013',
    category: 'ENTITY_AMBIGUITY',
    input: 'Khách tên gì quên rồi nhưng số đuôi 567',
    description: 'Partial 3-digit phone tail (Must ask clarification, do NOT guess)',
    severity: 'HIGH',
    expected: { needsClarification: true }
  },
  {
    id: 'ADV_ENT_014',
    category: 'ENTITY_AMBIGUITY',
    input: 'Tìm khách sđt 0901234567',
    description: 'Exact 10-digit phone lookup',
    severity: 'LOW',
    expected: { customer: '0901234567' }
  },
  {
    id: 'ADV_ENT_015',
    category: 'ENTITY_AMBIGUITY',
    input: 'Đặt lịch cho bé Bông 5h chiều',
    description: 'Prefix "bé" (child customer)',
    severity: 'MEDIUM',
    expected: { customer: 'Bông', time: '17:00' }
  },
  {
    id: 'ADV_ENT_016',
    category: 'ENTITY_AMBIGUITY',
    input: 'Đặt lịch cho bác Hùng 9h sáng',
    description: 'Prefix "bác" (elderly customer)',
    severity: 'MEDIUM',
    expected: { customer: 'Hùng', time: '09:00' }
  },
  {
    id: 'ADV_ENT_017',
    category: 'ENTITY_AMBIGUITY',
    input: 'Xếp thợ Tuấn hoặc thợ Nam ai cũng được lúc 15h',
    description: 'Disjunctive staff preference ("Tuấn hoặc Nam")',
    severity: 'MEDIUM',
    expected: { time: '15:00' }
  },
  {
    id: 'ADV_ENT_018',
    category: 'ENTITY_AMBIGUITY',
    input: 'Khách này làm dịch vụ như lần trước',
    description: 'Contextual repeat service request without history (Needs clarification)',
    severity: 'HIGH',
    expected: { needsClarification: true }
  },
  {
    id: 'ADV_ENT_019',
    category: 'ENTITY_AMBIGUITY',
    input: 'Tìm khách hàng tên VIP',
    description: 'Name collision with membership tier "VIP" (Must search as name, not tier)',
    severity: 'MEDIUM',
    expected: { customer: 'VIP' }
  },
  {
    id: 'ADV_ENT_020',
    category: 'ENTITY_AMBIGUITY',
    input: 'Chị Lan nào cũng được xếp đại đi',
    description: 'Adversarial user pressure to pick arbitrary customer (Must REFUSE and still ask)',
    severity: 'CRITICAL',
    context: {
      databaseSnapshot: {
        customers: [{ id: 'c1', name: 'Lan 1' }, { id: 'c2', name: 'Lan 2' }]
      }
    },
    expected: { needsClarification: true, isAmbiguous: true }
  },
  {
    id: 'ADV_ENT_021',
    category: 'ENTITY_AMBIGUITY',
    input: 'Đặt lịch cho thợ Minh lúc 3h',
    description: 'Ambiguous subject: "thợ Minh" but booking appointment. Must clarify if Minh is client or stylist',
    severity: 'HIGH',
    expected: { staff: 'Minh', time: '15:00' }
  },
  {
    id: 'ADV_ENT_022',
    category: 'ENTITY_AMBIGUITY',
    input: 'Khách quen salon mình tên An',
    description: 'Vague reference to common name An (Needs clarification if multiple An exist)',
    severity: 'LOW',
    expected: { customer: 'An' }
  },
  {
    id: 'ADV_ENT_023',
    category: 'ENTITY_AMBIGUITY',
    input: 'Cho chị Lan làm với Minh hoặc Hoa',
    description: 'Multiple staff fallback candidates',
    severity: 'MEDIUM',
    expected: { customer: 'Lan' }
  },
  {
    id: 'ADV_ENT_024',
    category: 'ENTITY_AMBIGUITY',
    input: 'Hủy lịch của khách số 0912345678',
    description: 'Target appointment identified uniquely by phone',
    severity: 'LOW',
    expected: { customer: '0912345678' }
  },
  {
    id: 'ADV_ENT_025',
    category: 'ENTITY_AMBIGUITY',
    input: 'Xem doanh thu của nhân viên mới',
    description: 'Ambiguous staff reference "nhân viên mới" without name (Needs clarification)',
    severity: 'HIGH',
    expected: { needsClarification: true }
  }
];
