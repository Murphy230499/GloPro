/**
 * Entity Resolution Scenarios (Phase 5 Benchmark)
 * 20 real-world Vietnamese entity resolution scenarios
 */

import { EvaluationScenario } from '../EvaluationCase';

export const ENTITY_SCENARIOS: EvaluationScenario[] = [
  {
    id: 'ENT_001',
    category: 'ENTITY_RESOLUTION',
    input: 'Tìm khách Nguyễn Văn Minh',
    description: 'Exact full name resolution',
    expected: { customer: 'Nguyễn Văn Minh' }
  },
  {
    id: 'ENT_002',
    category: 'ENTITY_RESOLUTION',
    input: 'Tìm khách Nguyen Van Minh',
    description: 'Diacritic-insensitive name resolution',
    expected: { customer: 'Nguyen Van Minh' }
  },
  {
    id: 'ENT_003',
    category: 'ENTITY_RESOLUTION',
    input: 'Tìm chị Lan',
    description: 'Common title "chị" resolution',
    expected: { customer: 'Lan' }
  },
  {
    id: 'ENT_004',
    category: 'ENTITY_RESOLUTION',
    input: 'Tìm anh Nam',
    description: 'Common title "anh" resolution',
    expected: { customer: 'Nam' }
  },
  {
    id: 'ENT_005',
    category: 'ENTITY_RESOLUTION',
    input: 'Đặt lịch cho cô Hoa',
    description: 'Title "cô" resolution',
    expected: { customer: 'Hoa' }
  },
  {
    id: 'ENT_006',
    category: 'ENTITY_RESOLUTION',
    input: 'Tìm hồ sơ của bác Hùng',
    description: 'Title "bác" resolution',
    expected: { customer: 'Hùng' }
  },
  {
    id: 'ENT_007',
    category: 'ENTITY_RESOLUTION',
    input: 'Cắt tóc cho em Trang',
    description: 'Title "em" resolution',
    expected: { customer: 'Trang' }
  },
  {
    id: 'ENT_008',
    category: 'ENTITY_RESOLUTION',
    input: 'Cắt tóc cho bé Linh',
    description: 'Title "bé" resolution',
    expected: { customer: 'Linh' }
  },
  {
    id: 'ENT_009',
    category: 'ENTITY_RESOLUTION',
    input: 'Tìm khách sđt 0905554433',
    description: 'Customer by phone number format',
    expected: { customer: '0905554433' }
  },
  {
    id: 'ENT_010',
    category: 'ENTITY_RESOLUTION',
    input: 'Doanh thu của thợ Minh Châu',
    description: 'Staff by compound name',
    expected: { staff: 'Minh Châu' }
  },
  {
    id: 'ENT_011',
    category: 'ENTITY_RESOLUTION',
    input: 'Cho chị ấy vào lịch của kỹ thuật viên Tuấn',
    description: 'Staff with title "kỹ thuật viên"',
    expected: { staff: 'Tuấn' }
  },
  {
    id: 'ENT_012',
    category: 'ENTITY_RESOLUTION',
    input: 'Bảng giá dịch vụ gội đầu dưỡng sinh',
    description: 'Service exact name matching',
    expected: { service: 'gội đầu dưỡng sinh' }
  },
  {
    id: 'ENT_013',
    category: 'ENTITY_RESOLUTION',
    input: 'Khách muốn nhuộm tóc phục hồi',
    description: 'Service with modifier',
    expected: { service: 'nhuộm tóc' }
  },
  {
    id: 'ENT_014',
    category: 'ENTITY_RESOLUTION',
    input: 'Giá làm nail và sơn gel bao nhiêu?',
    description: 'Service resolution for nail',
    expected: { service: 'làm nail' }
  },
  {
    id: 'ENT_015',
    category: 'ENTITY_RESOLUTION',
    input: 'Có 2 khách tên Lan trong hệ thống',
    description: 'Duplicate customer names ambiguity protection',
    context: {
      databaseSnapshot: {
        customers: [
          { id: 'c1', name: 'Nguyễn Thị Lan', phone: '0901111111' },
          { id: 'c2', name: 'Trần Thị Lan', phone: '0902222222' }
        ]
      }
    },
    expected: { isAmbiguous: true, needsClarification: true }
  },
  {
    id: 'ENT_016',
    category: 'ENTITY_RESOLUTION',
    input: 'Tìm khách số điện thoại 0901234567',
    description: 'Exact phone number resolution',
    expected: { customer: '0901234567' }
  },
  {
    id: 'ENT_017',
    category: 'ENTITY_RESOLUTION',
    input: 'Đặt lịch thợ Nam',
    description: 'Staff resolution in booking',
    expected: { staff: 'Nam' }
  },
  {
    id: 'ENT_018',
    category: 'ENTITY_RESOLUTION',
    input: 'Khách Hoàng Yến cắt tóc nữ',
    description: 'Customer and service resolution',
    expected: { customer: 'Hoàng Yến', service: 'cắt tóc nữ' }
  },
  {
    id: 'ENT_019',
    category: 'ENTITY_RESOLUTION',
    input: 'Đặt cho Dang Nam lich cat toc',
    description: 'Unaccented customer and service',
    expected: { customer: 'Dang Nam' }
  },
  {
    id: 'ENT_020',
    category: 'ENTITY_RESOLUTION',
    input: 'Tìm khách tên Nguyen Van A',
    description: 'Customer name unaccented lookup',
    expected: { customer: 'Nguyen Van A' }
  }
];
