import { base44 } from '@/api/base44Client';

// ─── Seeder ───────────────────────────────────────────────────────────────────

export async function seedAppointmentData(branchId, onProgress) {
  let b = branchId;
  if (!b || b === 'all') {
    try {
      const branches = await base44.entities.Branch.list();
      if (branches && branches.length > 0) {
        b = branches[0].id;
      } else {
        const defaultBranch = await base44.entities.Branch.create({ name: 'Chi nhánh chính' });
        b = defaultBranch.id;
      }
    } catch (e) {
      console.error('Cannot load branch for appointment seeder:', e);
      b = '';
    }
  }
  const filter = b ? { branch_id: b } : {};

  onProgress?.('Đang tải danh sách nhân viên & dịch vụ...');

  // Load existing staff and services
  let staffList = [];
  let serviceList = [];
  let customerList = [];

  try {
    const [s, sv, c] = await Promise.all([
      base44.entities.Staff.filter(filter),
      base44.entities.Service.filter({ ...filter, is_active: true }),
      base44.entities.Customer.filter(filter),
    ]);
    staffList = s.filter(x => x.can_be_booked !== false && x.is_active !== false);
    serviceList = sv;
    customerList = c;
  } catch (e) {
    console.error('Appointment seeder: cannot load dependencies', e);
  }

  if (staffList.length === 0 || serviceList.length === 0) {
    onProgress?.(null);
    return { appointments: 0, note: 'Cần có Nhân viên + Dịch vụ trước khi tạo lịch hẹn mẫu' };
  }

  // Build appointments spanning today → +6 days
  const today = new Date();
  const STATUSES = ['confirmed', 'confirmed', 'confirmed', 'pending', 'pending', 'completed', 'completed', 'cancelled'];
  const TIME_SLOTS = ['09:00', '10:00', '11:00', '13:30', '14:30', '15:30', '16:30', '17:30'];

  const SAMPLE_CUSTOMERS = [
    { name: 'Nguyễn Thị Thanh Hương', phone: '0901111001' },
    { name: 'Lê Thị Bích Ngọc', phone: '0912222001' },
    { name: 'Võ Thị Thu Lan', phone: '0912222003' },
    { name: 'Trần Minh Quân', phone: '0901111002' },
    { name: 'Đinh Thị Kim Anh', phone: '0923333005' },
    { name: 'Bùi Thị Ngân', phone: '0923333001' },
    { name: 'Hoàng Văn Tuấn', phone: '0912222005' },
    { name: 'Ngô Thành Đạt', phone: '0923333002' },
  ];

  onProgress?.('Đang tạo lịch hẹn mẫu...');
  let created = 0;

  for (let i = 0; i < 8; i++) {
    const apptDate = new Date(today);
    apptDate.setDate(today.getDate() + Math.floor(i / 2)); // 2 per day
    const dateStr = apptDate.toISOString().slice(0, 10);
    const timeStr = TIME_SLOTS[i];
    const status = STATUSES[i];

    const staffMember = staffList[i % staffList.length];
    const service = serviceList[i % serviceList.length];

    // Try to find a matching customer from seeded customers
    const custSample = SAMPLE_CUSTOMERS[i % SAMPLE_CUSTOMERS.length];
    const matchedCustomer = customerList.find(c => c.phone === custSample.phone);

    const payload = {
      branch_id: b,
      staff_id: staffMember.id,
      staff_name: staffMember.full_name,
      service_id: service.id,
      service_name: service.name,
      customer_id: matchedCustomer?.id || '',
      customer_name: matchedCustomer?.full_name || custSample.name,
      customer_phone: matchedCustomer?.phone || custSample.phone,
      date: dateStr,
      time: timeStr,
      duration: service.duration || 60,
      status,
      notes: status === 'cancelled' ? 'Khách báo bận không đến được' : '',
    };

    try {
      await base44.entities.Appointment.create(payload);
      created++;
    } catch (_e) {
      // ignore
    }
  }

  onProgress?.(null);
  return { appointments: created };
}
