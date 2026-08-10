import { base44 } from '@/api/base44Client';

// ─── Seed data ───────────────────────────────────────────────────────────────

const SERVICE_GROUPS_LANG = {
  vi: [
    { name: 'Chăm sóc tóc', color: '#A78BFA', type: 'service' },
    { name: 'Nail & Móng', color: '#F472B6', type: 'service' },
    { name: 'Spa & Massage', color: '#34D399', type: 'service' },
    { name: 'Bán lẻ sản phẩm', color: '#60A5FA', type: 'product' },
  ],
  en: [
    { name: 'Hair Care', color: '#A78BFA', type: 'service' },
    { name: 'Nail & Spa', color: '#F472B6', type: 'service' },
    { name: 'Massage', color: '#34D399', type: 'service' },
    { name: 'Retail Products', color: '#60A5FA', type: 'product' },
  ]
};

const SERVICES_LANG = {
  vi: [
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
  ],
  en: [
    { name: 'Women Haircut', price: 150000, duration: 45, type: 'service', group: 'Hair Care', description: 'Custom styled haircut' },
    { name: 'Basic Perm', price: 400000, duration: 120, type: 'service', group: 'Hair Care', description: 'Natural waves and curls' },
    { name: 'Fashion Hair Color', price: 350000, duration: 90, type: 'service', group: 'Hair Care', description: 'Modern trending colors' },
    { name: 'Nourishing Shampoo', price: 80000, duration: 30, type: 'service', group: 'Hair Care', description: 'Shampoo + relaxing head massage' },
    { name: 'Men Haircut', price: 100000, duration: 30, type: 'service', group: 'Hair Care', description: 'Haircut + styling + beard trim' },
    { name: 'Gel Manicure', price: 120000, duration: 60, type: 'service', group: 'Nail & Spa', description: 'Gel polish lasts 2-3 weeks' },
    { name: 'Gel Removal & Care', price: 50000, duration: 30, type: 'service', group: 'Nail & Spa', description: 'Safe removal and nail care' },
    { name: 'Body Massage 60m', price: 300000, duration: 60, type: 'service', group: 'Massage', description: 'Relaxing full body massage with oils' },
    { name: 'Basic Facial', price: 250000, duration: 60, type: 'service', group: 'Massage', description: 'Cleansing, hydrating, facial massage' },
    { name: 'Full Body Whitening', price: 450000, duration: 90, type: 'service', group: 'Massage', description: 'Body scrub + whitening mask' },
  ]
};

const PRODUCTS_LANG = {
  vi: [
    { name: 'Dầu gội Argan Oil', price: 180000, category: 'product', group: 'Chăm sóc tóc', stock: 30, unit: 'chai' },
    { name: 'Kem dưỡng tóc phục hồi', price: 220000, category: 'product', group: 'Chăm sóc tóc', stock: 20, unit: 'hũ' },
    { name: 'Gel nail UV cao cấp', price: 75000, category: 'product', group: 'Nail & Móng', stock: 50, unit: 'lọ' },
    { name: 'Kem dưỡng da body', price: 350000, category: 'product', group: 'Spa & Massage', stock: 25, unit: 'hộp' },
    { name: 'Serum vitamin C làm trắng', price: 480000, category: 'product', group: 'Spa & Massage', stock: 15, unit: 'lọ' },
    { name: 'Mặt nạ collagen dưỡng ẩm', price: 95000, category: 'product', group: 'Spa & Massage', stock: 100, unit: 'miếng' },
  ],
  en: [
    { name: 'Argan Oil Shampoo', price: 180000, category: 'product', group: 'Hair Care', stock: 30, unit: 'bottle' },
    { name: 'Recovery Hair Cream', price: 220000, category: 'product', group: 'Hair Care', stock: 20, unit: 'jar' },
    { name: 'Premium UV Nail Gel', price: 75000, category: 'product', group: 'Nail & Spa', stock: 50, unit: 'bottle' },
    { name: 'Body Lotion', price: 350000, category: 'product', group: 'Massage', stock: 25, unit: 'box' },
    { name: 'Vitamin C Whitening Serum', price: 480000, category: 'product', group: 'Massage', stock: 15, unit: 'bottle' },
    { name: 'Hydrating Collagen Mask', price: 95000, category: 'product', group: 'Massage', stock: 100, unit: 'piece' },
  ]
};

const PACKAGES_LANG = {
  vi: [
    { name: 'Gói chăm sóc tóc VIP (5 buổi)', price: 800000, sessions: 5, description: 'Gồm 5 lần cắt tóc + gội dưỡng + tư vấn phong cách', group: 'Chăm sóc tóc' },
    { name: 'Gói Spa cơ thể (4 buổi)', price: 1200000, sessions: 4, description: 'Massage body 60p + facial cơ bản, 4 lần trọn gói', group: 'Spa & Massage' },
  ],
  en: [
    { name: 'VIP Hair Care Package (5 sessions)', price: 800000, sessions: 5, description: 'Includes 5 haircuts + spa shampoo + styling', group: 'Hair Care' },
    { name: 'Body Spa Package (4 sessions)', price: 1200000, sessions: 4, description: 'Body massage 60m + basic facial, 4 sessions', group: 'Massage' },
  ]
};

const TREATMENTS_LANG = {
  vi: [
    { name: 'Liệu trình Chăm sóc da chuyên sâu (10 buổi)', price: 2500000, total_sessions: 10, group: 'Spa & Massage', description: 'Liệu trình chăm sóc da mụn & dưỡng sáng da VIP' },
    { name: 'Liệu trình Phục hồi tóc cháy/hư tổn (5 buổi)', price: 1800000, total_sessions: 5, group: 'Chăm sóc tóc', description: 'Phục hồi Keratin + Hấp dầu Nano 5 buổi' }
  ],
  en: [
    { name: 'Intensive Skin Care Treatment (10 sessions)', price: 2500000, total_sessions: 10, group: 'Massage', description: 'Acne skin care & VIP skin brightening' },
    { name: 'Damaged Hair Recovery Treatment (5 sessions)', price: 1800000, total_sessions: 5, group: 'Hair Care', description: 'Keratin recovery + Nano steaming 5 sessions' }
  ]
};

const SERVICE_COMBOS_LANG = {
  vi: [
    { name: 'Combo Cắt tóc + Gội dưỡng sinh + Nhuộm', price: 490000, items_count: 3, description: 'Gói combo tiết kiệm 20% cho quý khách làm trọn bộ tóc' },
    { name: 'Combo Sơn gel + Tháo gel + Dưỡng móng', price: 150000, items_count: 3, description: 'Trọn gói móng xinh cuốn hút' }
  ],
  en: [
    { name: 'Combo Haircut + Spa Shampoo + Color', price: 490000, items_count: 3, description: 'Save 20% on full hair package' },
    { name: 'Combo Gel Manicure + Removal + Care', price: 150000, items_count: 3, description: 'Beautiful nails package' }
  ]
};

const PRODUCT_COMBOS_LANG = {
  vi: [
    { name: 'Bộ đôi Dầu gội Argan + Kem dưỡng tóc', price: 360000, description: 'Combo dưỡng tóc chuyên sâu tại nhà' }
  ],
  en: [
    { name: 'Argan Shampoo + Hair Cream Duo', price: 360000, description: 'Intensive home hair care combo' }
  ]
};

const PREPAID_CARDS_LANG = {
  vi: [
    { name: 'Thẻ Tiền Mặt Membership Silver (Nạp 2Tr tặng 300k)', value: 2300000, price: 2000000, card_code: 'CARD-SILVER-01' },
    { name: 'Thẻ Tiền Mặt Membership Gold (Nạp 5Tr tặng 1Tr)', value: 6000000, price: 5000000, card_code: 'CARD-GOLD-01' },
  ],
  en: [
    { name: 'Silver Membership Cash Card (Deposit 2M get 300k)', value: 2300000, price: 2000000, card_code: 'CARD-SILVER-01' },
    { name: 'Gold Membership Cash Card (Deposit 5M get 1M)', value: 6000000, price: 5000000, card_code: 'CARD-GOLD-01' },
  ]
};

async function upsertEntity(entity, filterKey, filterVal, branchId, payload) {
  try {
    const filter = { [filterKey]: filterVal };
    if ('branch_id' in payload && branchId) filter.branch_id = branchId;
    if ('branch_ids' in payload && branchId) filter.branch_ids = [branchId];
    
    const existing = await entity.filter(filter);
    if (existing && existing.length > 0) {
      const updated = await entity.update(existing[0].id, payload);
      return updated ? updated.id : existing[0].id;
    }
    const created = await entity.create(payload);
    return created ? created.id : null;
  } catch (e) {
    console.error(`Error in upsertEntity for ${filterVal}:`, e);
    throw e;
  }
}

// ─── Seeder ───────────────────────────────────────────────────────────────────

export async function seedServiceData(branchId = 'all', onProgress = null, lang = 'vi') {
  const b = branchId === 'all' ? '' : branchId;

  // Fallback to vi if language is not supported
  const l = (lang === 'en') ? 'en' : 'vi';
  
  const SERVICE_GROUPS = SERVICE_GROUPS_LANG[l];
  const SERVICES = SERVICES_LANG[l];
  const PRODUCTS = PRODUCTS_LANG[l];
  const PACKAGES = PACKAGES_LANG[l];
  const TREATMENTS = TREATMENTS_LANG[l];
  const SERVICE_COMBOS = SERVICE_COMBOS_LANG[l];
  const PRODUCT_COMBOS = PRODUCT_COMBOS_LANG[l];
  const PREPAID_CARDS = PREPAID_CARDS_LANG[l];

  let created = { groups: 0, services: 0, products: 0, packages: 0, treatments: 0, serviceCombos: 0, productCombos: 0, prepaidCards: 0 };

  // 1. Create service groups
  onProgress?.('Đang tạo nhóm dịch vụ...');
  const groupIdMap = {};
  for (const g of SERVICE_GROUPS) {
    const payload = { ...g, branch_id: b };
    const id = await upsertEntity(base44.entities.ServiceGroup, 'name', g.name, b, payload);
    if (id) { groupIdMap[g.name] = id; created.groups++; }
  }

  // 2. Create services
  onProgress?.('Đang tạo danh mục dịch vụ...');
  for (const svc of SERVICES) {
    const { group, type, ...rest } = svc;
    await upsertEntity(base44.entities.Service, 'name', svc.name, b, {
      ...rest,
      branch_ids: b ? [b] : [],
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
      branch_ids: b ? [b] : [],
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
      branch_ids: b ? [b] : [],
      group_id: groupIdMap[group] || '',
      is_active: true,
    });
    created.packages++;
  }

  // 5. Create treatments
  onProgress?.('Đang tạo liệu trình...');
  for (const trt of TREATMENTS) {
    const { group, ...rest } = trt;
    await upsertEntity(base44.entities.Treatment, 'name', trt.name, b, {
      ...rest,
      branch_ids: b ? [b] : [],
      group_id: groupIdMap[group] || '',
      is_active: true,
    });
    created.treatments++;
  }

  // 6. Create service combos
  onProgress?.('Đang tạo combo dịch vụ...');
  for (const sc of SERVICE_COMBOS) {
    await upsertEntity(base44.entities.ServiceCombo, 'name', sc.name, b, {
      ...sc,
      branch_ids: b ? [b] : [],
      is_active: true,
    });
    created.serviceCombos++;
  }

  // 7. Create product combos
  onProgress?.('Đang tạo combo sản phẩm...');
  for (const pc of PRODUCT_COMBOS) {
    await upsertEntity(base44.entities.ProductCombo, 'name', pc.name, b, {
      ...pc,
      branch_ids: b ? [b] : [],
      is_active: true,
    });
    created.productCombos++;
  }

  // 8. Create prepaid cards
  onProgress?.('Đang tạo thẻ tiền mặt...');
  for (const card of PREPAID_CARDS) {
    await upsertEntity(base44.entities.PrepaidCard, 'name', card.name, b, {
      ...card,
      branch_ids: b ? [b] : [],
      is_active: true,
    });
    created.prepaidCards++;
  }

  onProgress?.(null);
  return created;
}
