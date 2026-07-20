import { base44 } from '@/api/base44Client';

// ─── Helper ───────────────────────────────────────────────────────────────────

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateInvoiceCode(index) {
  const prefix = 'HD';
  const num = String(1000 + index).padStart(4, '0');
  return `${prefix}${num}`;
}

// ─── Seeder ───────────────────────────────────────────────────────────────────

export async function seedInvoiceData(branchId, onProgress) {
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
      console.error('Cannot load branch for invoice seeder:', e);
      b = '';
    }
  }
  const filter = b ? { branch_id: b } : {};

  onProgress?.('Đang tải dữ liệu phụ thuộc...');

  let customerList = [];
  let serviceList = [];
  let staffList = [];

  try {
    const [c, s, st] = await Promise.all([
      base44.entities.Customer.filter(filter),
      base44.entities.Service.filter({ ...filter, is_active: true }),
      base44.entities.Staff.filter(filter),
    ]);
    customerList = c;
    serviceList = s;
    staffList = st.filter(x => x.is_active !== false);
  } catch (e) {
    console.error('Invoice seeder: cannot load dependencies', e);
  }

  if (customerList.length === 0 || serviceList.length === 0) {
    onProgress?.(null);
    return { invoices: 0, note: 'Cần có Khách hàng + Dịch vụ trước khi tạo hóa đơn mẫu' };
  }

  onProgress?.('Đang tạo hoá đơn mẫu...');

  // 6 sample invoices
  const INVOICE_TEMPLATES = [
    { daysAgo: 1, status: 'paid', itemCount: 2, discount: 0 },
    { daysAgo: 3, status: 'paid', itemCount: 1, discount: 10 },
    { daysAgo: 5, status: 'paid', itemCount: 3, discount: 0 },
    { daysAgo: 10, status: 'paid', itemCount: 2, discount: 0 },
    { daysAgo: 20, status: 'paid', itemCount: 1, discount: 15 },
    { daysAgo: 0, status: 'unpaid', itemCount: 2, discount: 0 },
  ];

  let created = 0;

  for (let idx = 0; idx < INVOICE_TEMPLATES.length; idx++) {
    const tmpl = INVOICE_TEMPLATES[idx];
    const customer = customerList[idx % customerList.length];
    const staff = staffList.length > 0 ? staffList[idx % staffList.length] : null;
    const dateStr = daysAgo(tmpl.daysAgo);

    // Build invoice items
    const items = [];
    let subtotal = 0;

    for (let j = 0; j < tmpl.itemCount; j++) {
      const svc = serviceList[(idx + j) % serviceList.length];
      const qty = 1;
      const price = svc.price || 0;
      subtotal += price * qty;
      items.push({
        id: svc.id,
        name: svc.name,
        type: 'service',
        price,
        qty,
        staff_id: staff?.id || '',
        staff_name: staff?.full_name || '',
      });
    }

    const discountAmount = tmpl.discount > 0 ? Math.round(subtotal * tmpl.discount / 100) : 0;
    const total = subtotal - discountAmount;

    const payload = {
      branch_id: b,
      invoice_code: generateInvoiceCode(idx + 1),
      customer_id: customer.id,
      customer_name: customer.full_name,
      customer_phone: customer.phone || '',
      date: dateStr,
      items,
      subtotal,
      discount_amount: discountAmount,
      discount_type: tmpl.discount > 0 ? 'percent' : '',
      discount_value: tmpl.discount,
      total,
      paid_amount: tmpl.status === 'paid' ? total : 0,
      payment_method: tmpl.status === 'paid' ? (idx % 2 === 0 ? 'cash' : 'transfer') : '',
      status: tmpl.status,
      notes: tmpl.status === 'unpaid' ? 'Khách hẹn thanh toán sau' : '',
      loyalty_points_earned: tmpl.status === 'paid' ? Math.floor(total / 10000) : 0,
    };

    try {
      await base44.entities.Invoice.create(payload);
      created++;
    } catch (_e) {
      // ignore
    }
  }

  onProgress?.(null);
  return { invoices: created };
}
