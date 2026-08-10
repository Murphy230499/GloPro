import { base44 } from '@/api/base44Client';

// ─── Seed data ───────────────────────────────────────────────────────────────

const CUSTOMER_GROUPS_LANG = {
  vi: [
    { name: 'VIP', color: '#FBBF24', description: 'Khách hàng cao cấp, chi tiêu trên 5 triệu' },
    { name: 'Thân thiết', color: '#60A5FA', description: 'Khách hàng thường xuyên, trên 5 lần ghé thăm' },
    { name: 'Khách mới', color: '#34D399', description: 'Khách hàng mới đăng ký' },
  ],
  en: [
    { name: 'VIP', color: '#FBBF24', description: 'Premium customers, spending over 5 million' },
    { name: 'Loyal', color: '#60A5FA', description: 'Frequent customers, over 5 visits' },
    { name: 'New', color: '#34D399', description: 'Newly registered customers' },
  ]
};

const CUSTOMERS_LANG = {
  vi: [
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
  ],
  en: [
    { full_name: 'Sarah Connor', phone: '0901111001', email: 'sarah.vip@gmail.com', gender: 'female', birth_date: '1985-03-15', address: 'District 1, HCMC', notes: 'Prefers purple and pink, allergic to strong chemicals', loyalty_points: 2500, group: 'VIP' },
    { full_name: 'John Smith', phone: '0901111002', email: 'john.boss@gmail.com', gender: 'male', birth_date: '1980-07-22', address: 'District 1, HCMC', notes: 'VIP client, prioritize fast service', loyalty_points: 1800, group: 'VIP' },

    { full_name: 'Emily Davis', phone: '0912222001', email: '', gender: 'female', birth_date: '1993-05-10', address: '', notes: 'Visits on weekends, likes hair spas', loyalty_points: 850, group: 'Loyal' },
    { full_name: 'Michael Johnson', phone: '0912222002', email: '', gender: 'male', birth_date: '1990-11-30', address: 'Binh Thanh Dist, HCMC', notes: 'Haircut once a month', loyalty_points: 620, group: 'Loyal' },
    { full_name: 'Jessica Brown', phone: '0912222003', email: 'jess93@gmail.com', gender: 'female', birth_date: '1993-08-18', address: '', notes: 'Regular nails, usually on Fridays', loyalty_points: 1150, group: 'Loyal' },
    { full_name: 'Linda Wilson', phone: '0912222004', email: '', gender: 'female', birth_date: '1998-02-14', address: 'D7, HCMC', notes: 'Student, often buys saver combos', loyalty_points: 430, group: 'Loyal' },
    { full_name: 'David Lee', phone: '0912222005', email: '', gender: 'male', birth_date: '1987-09-05', address: '', notes: 'Spa every 2 weeks', loyalty_points: 780, group: 'Loyal' },

    { full_name: 'Amanda Taylor', phone: '0923333001', email: '', gender: 'female', birth_date: '2000-04-20', address: '', notes: '', loyalty_points: 50, group: 'New' },
    { full_name: 'Daniel White', phone: '0923333002', email: 'dan2000@gmail.com', gender: 'male', birth_date: '1999-12-01', address: '', notes: 'Referred by a friend', loyalty_points: 0, group: 'New' },
    { full_name: 'Olivia Harris', phone: '0923333003', email: '', gender: 'female', birth_date: '1995-06-25', address: 'Go Vap, HCMC', notes: '', loyalty_points: 120, group: 'New' },
    { full_name: 'James Martin', phone: '0923333004', email: '', gender: 'male', birth_date: '1992-01-08', address: '', notes: 'Google Maps walk-in', loyalty_points: 0, group: 'New' },
    { full_name: 'Sophia Clark', phone: '0923333005', email: 'sophia.beauty@gmail.com', gender: 'female', birth_date: '2001-10-15', address: '', notes: 'Often asks about nail services', loyalty_points: 80, group: 'New' },
  ]
};

// ─── Helper ───────────────────────────────────────────────────────────────────

async function upsertEntity(entity, filterKey, filterVal, branchId, payload) {
  try {
    const filter = { [filterKey]: filterVal };
    if ('branch_id' in payload) filter.branch_id = branchId;
    if ('branch_ids' in payload) filter.branch_ids = branchId ? [branchId] : undefined;
    
    const existing = await entity.filter(filter);
    if (existing && existing.length > 0) return existing[0].id;
    const created = await entity.create(payload);
    return created ? created.id : null;
  } catch (e) {
    console.error(`Error in upsertEntity for ${filterVal}:`, e);
    throw e;
  }
}

// ─── Seeder ───────────────────────────────────────────────────────────────────

export async function seedCustomerData(branchId = 'all', onProgress = null, lang = 'vi') {
  const b = branchId === 'all' ? '' : branchId;

  // Fallback to vi if language is not supported
  const l = (lang === 'en') ? 'en' : 'vi';
  const groups = CUSTOMER_GROUPS_LANG[l];
  const customers = CUSTOMERS_LANG[l];

  // 1. Create Customer Groups
  onProgress?.('Đang tạo nhóm khách hàng...');
  const groupIdMap = {};
  for (const g of groups) {
    const payload = {
      name: g.name,
      color: g.color,
      branch_id: b,
    };
    const id = await upsertEntity(base44.entities.CustomerGroup, 'name', g.name, b, payload);
    groupIdMap[g.name] = id;
  }

  // 2. Create customers
  onProgress?.('Đang tạo dữ liệu khách hàng...');
  for (const c of customers) {
    const { group, full_name, birth_date, notes, loyalty_points, join_date, ...rest } = c;
    const payload = {
      ...rest,
      name: full_name,
      birthday: birth_date,
      note: notes,
      points: loyalty_points,
      group_id: groupIdMap[group] || null,
      is_active: true,
      avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(full_name)}&background=random&color=fff&size=150`,
    };

    await upsertEntity(base44.entities.Customer, 'phone', c.phone, b, payload);
  }

  onProgress?.(null);
  return { customers: customers.length, groups: groups.length };
}
