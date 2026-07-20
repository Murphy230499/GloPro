import { base44 } from '@/api/base44Client';

// ─── Seed data ───────────────────────────────────────────────────────────────

const SERVICE_GROUPS = [
  { name: 'Chăm sóc tóc', color: '#A78BFA' },
  { name: 'Nail & Móng', color: '#F472B6' },
  { name: 'Spa & Massage', color: '#34D399' },
  { name: 'Bán lẻ sản phẩm', color: '#60A5FA' },
];

const SERVICES = [
  { name: 'Cắt tóc nữ', price: 150000, duration: 45, type: 'service', group: 'Chăm sóc tóc', description: 'Cắt tạo kiểu phù hợp khuôn mặt' },
  { name: 'Uốn tóc cơ bản', price: 400000, duration: 120, type: 'service', group: 'Chăm sóc tóc', description: 'Uốn xoăn/sóng tự nhiên bền đẹp' },
  { name: 'Nhuộm màu thời trang', price: 350000, duration: 90, type: 'service', group: 'Chăm sóc tóc', description: 'Nhuộm màu theo xu hướng hiện đại' },
  { name: 'Gội đầu dưỡng sinh', price: 80000, duration: 30, type: 'service', group: 'Chăm sóc tóc', description: 'Gội + massage đầu thư giãn' },
  { name: 'Cắt tóc nam', price: 100000, duration: 30, type: 'service', group: 'Chăm sóc tóc', description: 'Cắt + tạo kiểu + beard trim' },
  { name: 'Sơn gel móng tay', price: 120000, duration: 60, type: 'service', group: 'Nail & Móng', description: 'Sơn gel màu kéo dài 2-3 tuần' },
  { name: 'Tháo sơn gel & dưỡng móng', price: 50000, duration: 30, type: 'service', group: 'Nail & Móng', description: 'Tháo gel an toàn, dưỡng móng mềm mịn' },
  { name: 'Massage body 60 phút', price: 300000, duration: 60, type: 'service', group: 'Spa & Massage', description: 'Massage thư giãn toàn thân với tinh dầu' },
  { name: 'Facial cơ bản', price: 250000, duration: 60, type: 'service', group: 'Spa & Massage', description: 'Làm sạch da, cấp ẩm, massage mặt' },
  { name: 'Tắm trắng toàn thân', price: 450000, duration: 90, type: 'service', group: 'Spa & Massage', description: 'Tẩy tế bào chết + ủ dưỡng trắng da' },
];

const PRODUCTS = [
  { name: 'Dầu gội Argan Oil', price: 180000, category: 'product', group: 'Chăm sóc tóc', stock: 30, unit: 'chai' },
  { name: 'Kem dưỡng tóc phục hồi', price: 220000, category: 'product', group: 'Chăm sóc tóc', stock: 20, unit: 'hũ' },
  { name: 'Gel nail UV cao cấp', price: 75000, category: 'product', group: 'Nail & Móng', stock: 50, unit: 'lọ' },
  { name: 'Kem dưỡng da body', price: 350000, category: 'product', group: 'Spa & Massage', stock: 25, unit: 'hộp' },
  { name: 'Serum vitamin C làm trắng', price: 480000, category: 'product', group: 'Spa & Massage', stock: 15, unit: 'lọ' },
  { name: 'Mặt nạ collagen dưỡng ẩm', price: 95000, category: 'product', group: 'Spa & Massage', stock: 100, unit: 'miếng' },
];

const PACKAGES = [
  {
    name: 'Gói chăm sóc tóc VIP (5 buổi)',
    price: 800000,
    sessions: 5,
    description: 'Gồm 5 lần cắt tóc + gội dưỡng + tư vấn phong cách',
    group: 'Chăm sóc tóc',
  },
  {
    name: 'Gói Spa cơ thể (4 buổi)',
    price: 1200000,
    sessions: 4,
    description: 'Massage body 60p + facial cơ bản, 4 lần trọn gói',
    group: 'Spa & Massage',
  },
];

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

export async function seedServiceData(branchId, onProgress) {
  const b = branchId === 'all' ? '' : branchId;
  let created = { groups: 0, services: 0, products: 0, packages: 0 };

  // 1. Create service groups
  onProgress?.('Đang tạo nhóm dịch vụ...');
  const groupIdMap = {};
  for (const g of SERVICE_GROUPS) {
    const id = await upsertEntity(base44.entities.ServiceGroup, 'name', g.name, b, { ...g, branch_id: b });
    if (id) { groupIdMap[g.name] = id; created.groups++; }
  }

  // 2. Create services
  onProgress?.('Đang tạo danh mục dịch vụ...');
  for (const svc of SERVICES) {
    const { group, ...rest } = svc;
    await upsertEntity(base44.entities.Service, 'name', svc.name, b, {
      ...rest,
      branch_id: b,
      group_id: groupIdMap[group] || '',
      is_active: true,
      commission_rate: 30,
    });
    created.services++;
  }

  // 3. Create products
  onProgress?.('Đang tạo danh mục sản phẩm...');
  for (const prod of PRODUCTS) {
    const { group, category, ...rest } = prod;
    await upsertEntity(base44.entities.Product, 'name', prod.name, b, {
      ...rest,
      branch_id: b,
      group_id: groupIdMap[group] || '',
      is_active: true,
    });
    created.products++;
  }

  // 4. Create service packages
  onProgress?.('Đang tạo gói dịch vụ...');
  for (const pkg of PACKAGES) {
    const { group, ...rest } = pkg;
    await upsertEntity(base44.entities.ServicePackage, 'name', pkg.name, b, {
      ...rest,
      branch_id: b,
      group_id: groupIdMap[group] || '',
      is_active: true,
    });
    created.packages++;
  }

  onProgress?.(null);
  return created;
}

