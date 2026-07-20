import { base44 } from '@/api/base44Client';

// ─── Seed data ───────────────────────────────────────────────────────────────
// 4 staff groups
const GROUPS = [
  { name: 'Tóc', color: '#A78BFA' },
  { name: 'Nail', color: '#F472B6' },
  { name: 'Spa & Massage', color: '#34D399' },
  { name: 'Quản lý & Lễ tân', color: '#60A5FA' },
];

// 8 shift templates
const SHIFT_TEMPLATES = [
  { name: 'Ca sáng', start_time: '07:30', end_time: '13:30' },
  { name: 'Ca chiều', start_time: '13:00', end_time: '20:00' },
  { name: 'Ca hành chính', start_time: '08:00', end_time: '17:00' },
  { name: 'Ca mở', start_time: '07:00', end_time: '14:00' },
  { name: 'Ca đóng', start_time: '14:00', end_time: '21:00' },
];

// 10 sample staff members
const SAMPLE_STAFF = [
  {
    full_name: 'Trần Thị Minh Châu',
    phone: '0901234567',
    role: 'manager',
    base_salary: 15000000,
    specialties: 'Quản lý vận hành, tư vấn khách hàng cấp cao',
    avatar_color: '#FF6B9D',
    can_be_booked: false,
    max_concurrent_bookings: 1,
    is_active: true,
    _group_name: 'Quản lý & Lễ tân',
  },
  {
    full_name: 'Nguyễn Hương Lan',
    phone: '0912345678',
    role: 'receptionist',
    base_salary: 7500000,
    specialties: 'Tiếp đón, tư vấn dịch vụ, đặt lịch hẹn',
    avatar_color: '#60A5FA',
    can_be_booked: false,
    max_concurrent_bookings: 1,
    is_active: true,
    _group_name: 'Quản lý & Lễ tân',
  },
  {
    full_name: 'Lê Văn Tuấn Anh',
    phone: '0923456789',
    role: 'stylist',
    base_salary: 9000000,
    specialties: 'Uốn, duỗi, nhuộm màu thời trang, balayage',
    avatar_color: '#A78BFA',
    can_be_booked: true,
    max_concurrent_bookings: 1,
    is_active: true,
    _group_name: 'Tóc',
  },
  {
    full_name: 'Phạm Thị Thu Hà',
    phone: '0934567890',
    role: 'stylist',
    base_salary: 8500000,
    specialties: 'Cắt tóc nữ, tạo kiểu cô dâu, gội dưỡng sinh',
    avatar_color: '#FBBF24',
    can_be_booked: true,
    max_concurrent_bookings: 2,
    is_active: true,
    _group_name: 'Tóc',
  },
  {
    full_name: 'Đinh Quang Hùng',
    phone: '0945678901',
    role: 'barber',
    base_salary: 8000000,
    specialties: 'Cắt nam, fade, beard trim, hot towel shave',
    avatar_color: '#34D399',
    can_be_booked: true,
    max_concurrent_bookings: 1,
    is_active: true,
    _group_name: 'Tóc',
  },
  {
    full_name: 'Võ Thị Kiều Anh',
    phone: '0956789012',
    role: 'therapist',
    base_salary: 8500000,
    specialties: 'Massage body, facial, trị liệu đá nóng, tắm trắng',
    avatar_color: '#34D399',
    can_be_booked: true,
    max_concurrent_bookings: 1,
    is_active: true,
    _group_name: 'Spa & Massage',
  },
  {
    full_name: 'Bùi Thị Ngọc Diệp',
    phone: '0967890123',
    role: 'therapist',
    base_salary: 8000000,
    specialties: 'Chăm sóc da mặt, lột da, trị mụn, phun xăm thẩm mỹ',
    avatar_color: '#F97316',
    can_be_booked: true,
    max_concurrent_bookings: 1,
    is_active: true,
    _group_name: 'Spa & Massage',
  },
  {
    full_name: 'Trịnh Thị Bảo Ngân',
    phone: '0978901234',
    role: 'nail_tech',
    base_salary: 8000000,
    specialties: 'Sơn gel, đắp bột acrylic, vẽ nail nghệ thuật, tháo móng',
    avatar_color: '#F472B6',
    can_be_booked: true,
    max_concurrent_bookings: 2,
    is_active: true,
    _group_name: 'Nail',
  },
  {
    full_name: 'Hoàng Thị Mai Linh',
    phone: '0989012345',
    role: 'nail_tech',
    base_salary: 7500000,
    specialties: 'Nail cô dâu, nail thiết kế 3D, chăm sóc móng cơ bản',
    avatar_color: '#FB7185',
    can_be_booked: true,
    max_concurrent_bookings: 2,
    is_active: true,
    _group_name: 'Nail',
  },
  {
    full_name: 'Lý Thị Thu Thảo',
    phone: '0990123456',
    role: 'cashier',
    base_salary: 7000000,
    specialties: 'Thu ngân, kế toán bán lẻ, quản lý kho sản phẩm',
    avatar_color: '#94A3B8',
    can_be_booked: false,
    max_concurrent_bookings: 1,
    is_active: true,
    _group_name: 'Quản lý & Lễ tân',
  },
];

// ─── Seeder function ──────────────────────────────────────────────────────────
export async function seedStaffData(branchId, onProgress) {
  const b = branchId === 'all' ? '' : branchId;

  // 1. Create groups
  onProgress?.('Đang tạo nhóm nhân viên...');
  const createdGroups = {};
  for (const g of GROUPS) {
    try {
      const existing = await base44.entities.StaffGroup.filter({ name: g.name, branch_id: b });
      if (existing.length > 0) {
        createdGroups[g.name] = existing[0].id;
      } else {
        const created = await base44.entities.StaffGroup.create({ ...g, branch_id: b });
        createdGroups[g.name] = created.id;
      }
    } catch (e) {
      // Save to localStorage as fallback
      const localGps = localStorage.getItem('glopro_staff_groups');
      const list = localGps ? JSON.parse(localGps) : [];
      const id = 'local_group_' + Date.now() + '_' + g.name;
      list.push({ id, ...g, branch_id: b });
      localStorage.setItem('glopro_staff_groups', JSON.stringify(list));
      createdGroups[g.name] = id;
    }
  }

  // 2. Create shift templates
  onProgress?.('Đang tạo ca làm việc mẫu...');
  const createdTemplates = {};
  for (const t of SHIFT_TEMPLATES) {
    try {
      const existing = await base44.entities.ShiftTemplate.filter({ name: t.name });
      if (existing.length > 0) {
        createdTemplates[t.name] = existing[0].id;
      } else {
        const created = await base44.entities.ShiftTemplate.create(t);
        createdTemplates[t.name] = created.id;
      }
    } catch (e) {
      const localTmpl = localStorage.getItem('glopro_shift_templates');
      const list = localTmpl ? JSON.parse(localTmpl) : [];
      const id = 'local_tmpl_' + Date.now() + '_' + t.name;
      list.push({ id, ...t });
      localStorage.setItem('glopro_shift_templates', JSON.stringify(list));
      createdTemplates[t.name] = id;
    }
  }

  // 3. Create staff members
  onProgress?.('Đang tạo hồ sơ nhân viên...');
  let staffCreated = 0;
  for (const member of SAMPLE_STAFF) {
    const { _group_name, ...staffPayload } = member;
    const groupId = createdGroups[_group_name] || '';
    const payload = {
      ...staffPayload,
      group_id: groupId,
      branch_id: b,
      service_ids: [],
    };

    try {
      // Check if already exists by phone
      const existingStaff = await base44.entities.Staff.filter({ phone: member.phone });
      if (existingStaff.length === 0) {
        await base44.entities.Staff.create(payload);
        staffCreated++;
      }
    } catch (e) {
      const localStaff = localStorage.getItem('glopro_staff');
      const list = localStaff ? JSON.parse(localStaff) : [];
      const alreadyExists = list.some(x => x.phone === member.phone);
      if (!alreadyExists) {
        const id = 'local_staff_' + Date.now() + '_' + staffPayload.phone;
        list.push({ id, ...payload });
        localStorage.setItem('glopro_staff', JSON.stringify(list));
        staffCreated++;
      }
    }
  }

  // 4. Create sample schedules for current week
  onProgress?.('Đang xếp lịch ca mẫu cho tuần này...');
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(today.setDate(diff));

  const bookableStaff = SAMPLE_STAFF.filter(s => s.can_be_booked);
  const shiftCycles = ['Ca sáng', 'Ca chiều', 'Ca hành chính', 'Ca mở', 'Ca đóng'];

  try {
    const allStaff = await base44.entities.Staff.filter(b ? { branch_id: b } : {});
    const staffIds = allStaff.filter(s => s.can_be_booked !== false && s.is_active !== false).map(s => s.id);
    const tmplList = await base44.entities.ShiftTemplate.list();

    for (let dayIdx = 0; dayIdx < 5; dayIdx++) {
      const schedDate = new Date(monday);
      schedDate.setDate(monday.getDate() + dayIdx);
      const dateStr = schedDate.toISOString().slice(0, 10);

      for (let sIdx = 0; sIdx < staffIds.length; sIdx++) {
        const tmplName = shiftCycles[(sIdx + dayIdx) % shiftCycles.length];
        const tmpl = tmplList.find(t => t.name === tmplName);
        if (!tmpl) continue;

        try {
          const existing = await base44.entities.StaffSchedule.filter({ staff_id: staffIds[sIdx], date: dateStr });
          if (existing.length === 0) {
            await base44.entities.StaffSchedule.create({
              staff_id: staffIds[sIdx],
              date: dateStr,
              shift_template_id: tmpl.id,
              is_off: false,
              off_type: ''
            });
          }
        } catch (_e) {
          // ignore schedule creation failure
        }
      }
    }
  } catch (_e) {
    // Staff query failed — schedules skipped
  }

  onProgress?.(null); // Done

  return {
    groups: Object.keys(createdGroups).length,
    templates: Object.keys(createdTemplates).length,
    staff: staffCreated,
  };
}
