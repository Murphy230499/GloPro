import { base44 } from '@/api/base44Client';
import { dbSelect, dbInsert } from '@/lib/supabaseClient';

export const INITIAL_SUPPLIERS = [
  {
    id: 'sup_01',
    code: 'NCC001',
    name: 'Công ty Mỹ Phẩm Loreal Việt Nam',
    phone: '0901234567',
    email: 'contact@loreal.vn',
    address: 'Tòa nhà Vincom, 72 Lê Thánh Tôn, Q.1, TP.HCM',
    tax_code: '0301234567',
    contact_person: 'Chị Nguyễn Thanh Hà',
    debt: 12500000,
    total_imported: 85000000,
    note: 'Nhà cung cấp dầu gội, thuốc nhuộm chính hãng Loreal',
    status: 'active'
  },
  {
    id: 'sup_02',
    code: 'NCC002',
    name: 'Nhà Phân Phối Dụng Cụ Barber & Beauty Kim Long',
    phone: '0988776655',
    email: 'barber.kimlong@gmail.com',
    address: '456 Lý Thường Kiệt, Q.10, TP.HCM',
    tax_code: '0309876543',
    contact_person: 'Anh Trần Kim Long',
    debt: 0,
    total_imported: 42000000,
    note: 'Chuyên cung cấp kéo cắt tóc, tông đơ Wahl, máy sấy xịn',
    status: 'active'
  },
  {
    id: 'sup_03',
    code: 'NCC003',
    name: 'Công Ty Dược Mỹ Phẩm Skincare Sài Gòn',
    phone: '0912348899',
    email: 'info@skincaresg.com',
    address: '123 Nguyễn Thị Minh Khai, Q.3, TP.HCM',
    tax_code: '0305558888',
    contact_person: 'Chị Lê Ngọc Mai',
    debt: 4800000,
    total_imported: 29000000,
    note: 'Cung cấp tinh chất serum, mặt nạ và kem dưỡng Spa',
    status: 'active'
  },
  {
    id: 'sup_04',
    code: 'NCC004',
    name: 'Tổng Kho Phụ Liệu Nail & Eyelash Huyền Trang',
    phone: '0977112233',
    email: 'nail.huyentrang@gmail.com',
    address: '89 Ba Tháng Hai, Q.10, TP.HCM',
    tax_code: '0311223344',
    contact_person: 'Chị Phạm Huyền Trang',
    debt: 1500000,
    total_imported: 18500000,
    note: 'Sơn gel cao cấp, mút dán, keo nối mi, đá trang trí',
    status: 'active'
  }
];

export const INITIAL_STOCK_RECEIPTS = [
  {
    id: 'receipt_01',
    code: 'NK-20260720-001',
    type: 'in', // 'in' (nhập kho), 'out' (xuất kho)
    supplier_id: 'sup_01',
    supplier_name: 'Công ty Mỹ Phẩm Loreal Việt Nam',
    branch_id: 'all',
    branch_name: 'Tổng kho Chi nhánh chính',
    date: '2026-07-20 10:30',
    created_by: 'Quản lý kho',
    total_amount: 18500000,
    paid_amount: 10000000,
    debt_amount: 8500000,
    reason: 'Nhập dồn kho định kỳ đầu tháng',
    status: 'completed',
    items: [
      { product_id: 'prod_1', product_name: 'Dầu Gội L’Oréal Elseve Color-Vive 500ml', unit: 'Chai', qty: 30, unit_price: 250000, total_price: 7500000 },
      { product_id: 'prod_2', product_name: 'Kem Dưỡng Tóc Keratin Argan Complex 250ml', unit: 'Hũ', qty: 20, unit_price: 350000, total_price: 7000000 },
      { product_id: 'prod_3', product_name: 'Tinh Chất Serum Phục Hồi Tóc Hư Tổn 100ml', unit: 'Chai', qty: 20, unit_price: 200000, total_price: 4000000 }
    ]
  },
  {
    id: 'receipt_02',
    code: 'NK-20260722-002',
    type: 'in',
    supplier_id: 'sup_02',
    supplier_name: 'Nhà Phân Phối Dụng Cụ Barber & Beauty Kim Long',
    branch_id: 'all',
    branch_name: 'Tổng kho Chi nhánh chính',
    date: '2026-07-22 14:15',
    created_by: 'Kế toán kho',
    total_amount: 12000000,
    paid_amount: 12000000,
    debt_amount: 0,
    reason: 'Nhập dụng cụ máy móc thay thế salon',
    status: 'completed',
    items: [
      { product_id: 'prod_4', product_name: 'Tông Đơ Wahl Magic Clip Cordless 5 Star', unit: 'Cái', qty: 5, unit_price: 1800000, total_price: 9000000 },
      { product_id: 'prod_5', product_name: 'Kéo Cắt Tóc KASHO Nhật Bản 6.0 Inch', unit: 'Cây', qty: 3, unit_price: 1000000, total_price: 3000000 }
    ]
  },
  {
    id: 'receipt_03',
    code: 'XK-20260721-001',
    type: 'out',
    supplier_id: '',
    supplier_name: 'Xuất dùng Salon',
    branch_id: 'all',
    branch_name: 'Chi nhánh Quận 1',
    date: '2026-07-21 09:00',
    created_by: 'Chuyên viên Spa',
    total_amount: 2100000,
    paid_amount: 0,
    debt_amount: 0,
    reason: 'Xuất tiêu hao nội bộ cho phòng gội đầu & liệu trình spa',
    status: 'completed',
    items: [
      { product_id: 'prod_1', product_name: 'Dầu Gội L’Oréal Elseve Color-Vive 500ml', unit: 'Chai', qty: 6, unit_price: 250000, total_price: 1500000 },
      { product_id: 'prod_6', product_name: 'Mặt Nạ Dưỡng Cấp Ẩm Hyaluronic Acid', unit: 'Hộp', qty: 4, unit_price: 150000, total_price: 600000 }
    ]
  },
  {
    id: 'receipt_04',
    code: 'XK-20260723-002',
    type: 'out',
    supplier_id: '',
    supplier_name: 'Xuất thanh lý/hủy',
    branch_id: 'all',
    branch_name: 'Chi nhánh Quận 1',
    date: '2026-07-23 11:20',
    created_by: 'Quản lý kho',
    total_amount: 450000,
    paid_amount: 0,
    debt_amount: 0,
    reason: 'Xuất hủy hũ kem dưỡng bị vỡ nắp trong quá trình vận chuyển',
    status: 'completed',
    items: [
      { product_id: 'prod_2', product_name: 'Kem Dưỡng Tóc Keratin Argan Complex 250ml', unit: 'Hũ', qty: 1, unit_price: 450000, total_price: 450000 }
    ]
  }
];

export const INITIAL_STOCK_TRANSFERS = [
  {
    id: 'transfer_01',
    code: 'CK-20260722-001',
    from_branch_id: 'branch_q1',
    from_branch_name: 'Chi nhánh 1 (Quận 1 - Trụ sở)',
    to_branch_id: 'branch_q3',
    to_branch_name: 'Chi nhánh 2 (Quận 3 - Spa VIP)',
    date: '2026-07-22 16:45',
    created_by: 'Quản lý kho',
    status: 'transferred', // 'pending', 'transferred', 'cancelled'
    note: 'Điều chuyển gấp tinh chất serum & dầu gội bù tồn chi nhánh Q3',
    items: [
      { product_id: 'prod_1', product_name: 'Dầu Gội L’Oréal Elseve Color-Vive 500ml', unit: 'Chai', qty: 5 },
      { product_id: 'prod_3', product_name: 'Tinh Chất Serum Phục Hồi Tóc Hư Tổn 100ml', unit: 'Chai', qty: 4 }
    ]
  },
  {
    id: 'transfer_02',
    code: 'CK-20260723-002',
    from_branch_id: 'branch_q1',
    from_branch_name: 'Chi nhánh 1 (Quận 1 - Trụ sở)',
    to_branch_id: 'branch_bt',
    to_branch_name: 'Chi nhánh 3 (Bình Thạnh - Beauty)',
    date: '2026-07-23 09:15',
    created_by: 'Kế toán chi nhánh',
    status: 'pending',
    note: 'Chuyển mút dán & bộ kéo bổ sung bàn làm việc thợ mới',
    items: [
      { product_id: 'prod_5', product_name: 'Kéo Cắt Tóc KASHO Nhật Bản 6.0 Inch', unit: 'Cây', qty: 1 }
    ]
  }
];

/**
 * Load or initialize Inventory seed data
 */
export const loadSuppliersData = () => {
  if (typeof window === 'undefined') return INITIAL_SUPPLIERS;
  const local = localStorage.getItem('glopro_suppliers');
  if (local) {
    try { return JSON.parse(local); } catch (e) {}
  }
  localStorage.setItem('glopro_suppliers', JSON.stringify(INITIAL_SUPPLIERS));
  return INITIAL_SUPPLIERS;
};

export const saveSuppliersData = (list) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('glopro_suppliers', JSON.stringify(list));
  }
};

export const loadStockReceiptsData = () => {
  if (typeof window === 'undefined') return INITIAL_STOCK_RECEIPTS;
  const local = localStorage.getItem('glopro_stock_receipts');
  if (local) {
    try { return JSON.parse(local); } catch (e) {}
  }
  localStorage.setItem('glopro_stock_receipts', JSON.stringify(INITIAL_STOCK_RECEIPTS));
  return INITIAL_STOCK_RECEIPTS;
};

export const saveStockReceiptsData = (list) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('glopro_stock_receipts', JSON.stringify(list));
  }
};

export const loadStockTransfersData = () => {
  if (typeof window === 'undefined') return INITIAL_STOCK_TRANSFERS;
  const local = localStorage.getItem('glopro_stock_transfers');
  if (local) {
    try { return JSON.parse(local); } catch (e) {}
  }
  localStorage.setItem('glopro_stock_transfers', JSON.stringify(INITIAL_STOCK_TRANSFERS));
  return INITIAL_STOCK_TRANSFERS;
};

export const saveStockTransfersData = (list) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('glopro_stock_transfers', JSON.stringify(list));
  }
};
