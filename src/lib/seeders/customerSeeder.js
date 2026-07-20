import { base44 } from '@/api/base44Client';

// ─── Seed data ───────────────────────────────────────────────────────────────

const CUSTOMER_GROUPS = [
  { name: 'VIP', color: '#FBBF24', description: 'Khách hàng cao cấp, chi tiêu trên 5 triệu' },
  { name: 'Thân thiết', color: '#60A5FA', description: 'Khách hàng thường xuyên, trên 5 lần ghé thăm' },
  { name: 'Khách mới', color: '#34D399', description: 'Khách hàng mới đăng ký' },
];

const CUSTOMERS = [
  // VIP (2 khách)
  { full_name: 'Nguyễn Thị Thanh Hương', phone: '0901111001', email: 'huong.vip@gmail.com', gender: 'female', birth_date: '1985-03-15', address: '12 Nguyễn Huệ, Q.1, TP.HCM', notes: 'Thích màu tím và hồng, dị ứng hóa chất mạnh', loyalty_points: 2500, group: 'VIP' },
  { full_name: 'Trần Minh Quân', phone: '0901111002', email: 'quan.boss@gmail.com', gender: 'male', birth_date: '1980-07-22', address: '88 Lê Lợi, Q.1, TP.HCM', notes: 'Khách VIP, ưu tiên phục vụ nhanh', loyalty_points: 1800, group: 'VIP' },

  // Thân thiết (5 khách)
  { full_name: 'Lê Thị Bích Ngọc', phone: '0912222001', email: '', gender: 'female', birth_date: '1993-05-10', address: '', notes: 'Hay đến cuối tuần, thích gội dưỡng sinh', loyalty_points: 850, group: 'Thân thiết' },
  { full_name: 'Phạm Văn Hùng', phone: '0912222002', email: '', gender: 'male', birth_date: '1990-11-30', address: 'Quận Bình Thạnh, TP.HCM', notes: 'Cắt tóc mỗi tháng 1 lần', loyalty_points: 620, group: 'Thân thiết' },
  { full_name: 'Võ Thị Thu Lan', phone: '0912222003', email: 'thulan93@gmail.com', gender: 'female', birth_date: '1993-08-18', address: '', notes: 'Nail thường xuyên, hay làm nails vào thứ 6', loyalty_points: 1150, group: 'Thân thiết' },
  { full_name: 'Đỗ Thị Mỹ Linh', phone: '0912222004', email: '', gender: 'female', birth_date: '1998-02-14', address: 'Q.7, TP.HCM', notes: 'Sinh viên, hay mua combo tiết kiệm', loyalty_points: 430, group: 'Thân thiết' },
  { full_name: 'Hoàng Văn Tuấn', phone: '0912222005', email: '', gender: 'male', birth_date: '1987-09-05', address: '', notes: 'Làm spa mỗi 2 tuần', loyalty_points: 780, group: 'Thân thiết' },

  // Khách mới (5 khách)
  { full_name: 'Bùi Thị Ngân', phone: '0923333001', email: '', gender: 'female', birth_date: '2000-04-20', address: '', notes: '', loyalty_points: 50, group: 'Khách mới' },
  { full_name: 'Ngô Thành Đạt', phone: '0923333002', email: 'dat2000@gmail.com', gender: 'male', birth_date: '1999-12-01', address: '', notes: 'Được giới thiệu từ bạn', loyalty_points: 0, group: 'Khách mới' },
  { full_name: 'Trịnh Thị Hoa', phone: '0923333003', email: '', gender: 'female', birth_date: '1995-06-25', address: 'Quận Gò Vấp, TP.HCM', notes: '', loyalty_points: 120, group: 'Khách mới' },
  { full_name: 'Lý Văn Phúc', phone: '0923333004', email: '', gender: 'male', birth_date: '1992-01-08', address: '', notes: 'Khách Google Maps', loyalty_points: 0, group: 'Khách mới' },
  { full_name: 'Đinh Thị Kim Anh', phone: '0923333005', email: 'kimanh.beauty@gmail.com', gender: 'female', birth_date: '2001-10-15', address: '', notes: 'Hay hỏi về dịch vụ nail', loyalty_points: 80, group: 'Khách mới' },
];

// ─── Helper ───────────────────────────────────────────────────────────────────

async function upsertEntity(entity, filterKey, filterVal, branchId, payload) {
  try {
    const existing = await entity.filter({ [filterKey]: filterVal, branch_id: branchId });
    if (existing.length > 0) return existing[0].id;
    const created = await entity.create(payload);
    return created.id;
  } catch (_e) {
    return null;
  }
}

// ─── Seeder ───────────────────────────────────────────────────────────────────

export async function seedCustomerData(branchId, onProgress) {
  const b = branchId === 'all' ? '' : branchId;
  let created = { groups: 0, customers: 0 };

  // 1. Create customer groups
  onProgress?.('Đang tạo nhóm khách hàng...');
  const groupIdMap = {};
  for (const g of CUSTOMER_GROUPS) {
    const id = await upsertEntity(base44.entities.CustomerGroup, 'name', g.name, b, {
      name: g.name,
      color: g.color,
      branch_id: b,
    });
    if (id) { groupIdMap[g.name] = id; created.groups++; }
  }

  // 2. Create customers
  onProgress?.('Đang tạo dữ liệu khách hàng...');
  for (const c of CUSTOMERS) {
    const { group, ...rest } = c;
    await upsertEntity(base44.entities.Customer, 'phone', c.phone, b, {
      ...rest,
      branch_id: b,
      group_id: groupIdMap[group] || '',
      is_active: true,
      join_date: new Date().toISOString().slice(0, 10),
    });
    created.customers++;
  }

  onProgress?.(null);
  return created;
}

