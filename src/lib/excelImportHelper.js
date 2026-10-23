/**
 * excelImportHelper.js
 * Tiện ích AI phân tích, khớp cột thông minh và nhập khẩu dữ liệu từ file Excel (.xlsx, .xls, .csv)
 * Hỗ trợ 3 nhóm dữ liệu trọng tâm của GloPro Salon:
 * 1. Khách hàng (CRM: Tên, SĐT, Email, Giới tính, Ngày sinh, Địa chỉ, Hạng thẻ, Ghi chú)
 * 2. Danh mục Dịch vụ (Tên dịch vụ, Đơn giá, Thời lượng, Nhóm dịch vụ, Mô tả)
 * 3. Sản phẩm & Kho hàng (Tên sản phẩm, Mã vạch/SKU, Giá bán, Giá vốn, Tồn kho, ĐVT, Danh mục)
 */

import * as XLSX from 'xlsx';
import { base44 } from '@/api/base44Client';
import { getTenantStorageKey } from '@/lib/tenantManager';

export const SUPPORTED_ENTITY_TYPES = [
  { id: 'customer', label: 'Khách hàng', icon: 'User', table: 'Customer', route: '/customers' },
  { id: 'service', label: 'Dịch vụ Salon', icon: 'Scissors', table: 'Service', route: '/services' },
  { id: 'product', label: 'Sản phẩm & Kho', icon: 'Package', table: 'Product', route: '/inventory' }
];

// Định nghĩa Schema chuẩn cho từng loại thực thể kèm danh sách từ khóa alias để AI tự khớp cột
export const ENTITY_SCHEMAS = {
  customer: {
    name: 'Khách hàng',
    uniqueField: 'phone',
    uniqueLabel: 'Số điện thoại',
    fields: [
      { key: 'name', label: 'Họ và tên', required: true, aliases: ['họ và tên', 'họ tên', 'tên', 'tên khách hàng', 'khách hàng', 'họ và tên khách', 'name', 'customer_name', 'full_name'] },
      { key: 'phone', label: 'Số điện thoại', required: true, aliases: ['số điện thoại', 'sđt', 'điện thoại', 'mobile', 'phone', 'tel', 'sdt', 'so dien thoai'] },
      { key: 'email', label: 'Email', required: false, aliases: ['email', 'thư điện tử', 'e-mail', 'mail'] },
      { key: 'gender', label: 'Giới tính', required: false, aliases: ['giới tính', 'phái', 'gender', 'sex'] },
      { key: 'birth_date', label: 'Ngày sinh', required: false, aliases: ['ngày sinh', 'sinh nhật', 'dob', 'birthday', 'birth_date', 'ngay sinh'] },
      { key: 'address', label: 'Địa chỉ', required: false, aliases: ['địa chỉ', 'nơi ở', 'address', 'dia chi'] },
      { key: 'tier', label: 'Hạng thành viên', required: false, aliases: ['hạng', 'hạng thẻ', 'hạng thành viên', 'loại khách', 'tier', 'rank', 'level'] },
      { key: 'total_spent', label: 'Tổng chi tiêu', required: false, aliases: ['tổng chi tiêu', 'chi tiêu', 'doanh số', 'total spent', 'total_spent', 'spent'] },
      { key: 'notes', label: 'Ghi chú', required: false, aliases: ['ghi chú', 'lưu ý', 'tiền sử', 'note', 'notes', 'ghi chu'] }
    ]
  },
  service: {
    name: 'Dịch vụ Salon',
    uniqueField: 'name',
    uniqueLabel: 'Tên dịch vụ',
    fields: [
      { key: 'name', label: 'Tên dịch vụ', required: true, aliases: ['tên dịch vụ', 'dịch vụ', 'tên', 'service_name', 'service', 'ten dich vu'] },
      { key: 'price', label: 'Đơn giá (VND)', required: true, aliases: ['giá', 'đơn giá', 'giá dịch vụ', 'giá bán', 'price', 'fee', 'don gia', 'gia'] },
      { key: 'duration_minutes', label: 'Thời lượng (phút)', required: false, aliases: ['thời lượng', 'thời gian', 'phút', 'duration', 'duration_minutes', 'thoi luong', 'thoi gian'] },
      { key: 'category', label: 'Nhóm / Danh mục', required: false, aliases: ['nhóm dịch vụ', 'danh mục', 'loại dịch vụ', 'nhóm', 'category', 'group', 'danh muc'] },
      { key: 'price_from', label: 'Giá từ (VND)', required: false, aliases: ['giá từ', 'giá tối thiểu', 'price_from'] },
      { key: 'description', label: 'Mô tả dịch vụ', required: false, aliases: ['mô tả', 'chi tiết', 'nội dung', 'description', 'mo ta'] }
    ]
  },
  product: {
    name: 'Sản phẩm & Kho',
    uniqueField: 'barcode',
    fallbackUniqueField: 'name',
    uniqueLabel: 'Mã vạch / SKU',
    fields: [
      { key: 'name', label: 'Tên sản phẩm', required: true, aliases: ['tên sản phẩm', 'sản phẩm', 'tên hàng', 'tên hàng hóa', 'product_name', 'name', 'ten san pham'] },
      { key: 'barcode', label: 'Mã vạch / SKU', required: false, aliases: ['mã vạch', 'mã sp', 'mã sản phẩm', 'sku', 'barcode', 'mã hàng', 'code', 'ma vach'] },
      { key: 'price', label: 'Giá bán lẻ (VND)', required: true, aliases: ['giá bán', 'đơn giá', 'giá bán lẻ', 'giá niêm yết', 'price', 'retail_price', 'gia ban'] },
      { key: 'cost_price', label: 'Giá vốn nhập (VND)', required: false, aliases: ['giá vốn', 'giá nhập', 'giá gốc', 'cost', 'cost_price', 'gia von', 'gia nhap'] },
      { key: 'stock', label: 'Tồn kho ban đầu', required: false, aliases: ['tồn kho', 'số lượng tồn', 'tồn', 'số lượng', 'stock', 'quantity', 'qty', 'ton kho'] },
      { key: 'unit', label: 'Đơn vị tính', required: false, aliases: ['đơn vị tính', 'đvt', 'đơn vị', 'unit', 'dvt', 'don vi tinh'] },
      { key: 'category', label: 'Danh mục sản phẩm', required: false, aliases: ['danh mục', 'loại sản phẩm', 'nhóm hàng', 'category', 'group', 'danh muc'] },
      { key: 'min_stock', label: 'Định mức tồn tối thiểu', required: false, aliases: ['tồn tối thiểu', 'định mức tồn', 'min_stock', 'min stock'] }
    ]
  }
};

/**
 * Chuẩn hóa chuỗi text không dấu để đối chiếu từ khóa
 */
export function normalizeKeyword(str) {
  if (!str) return '';
  return String(str)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Đọc file Excel (.xlsx, .xls, .csv) thành danh sách sheets và dữ liệu dạng bảng
 */
export async function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          throw new Error('File Excel rỗng, không tìm thấy sheet nào.');
        }

        // Ưu tiên sheet đầu tiên
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Đọc dữ liệu thô dạng mảng dòng
        const rawJson = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: false });
        
        if (!rawJson || rawJson.length === 0) {
          throw new Error('Sheet dữ liệu không có dòng thông tin nào.');
        }

        // Lấy danh sách tiêu đề cột (Headers)
        const headers = Object.keys(rawJson[0]).map(h => String(h).trim()).filter(Boolean);

        resolve({
          fileName: file.name,
          fileSize: file.size,
          sheetNames: workbook.SheetNames,
          activeSheet: firstSheetName,
          headers,
          rawRows: rawJson,
          rowCount: rawJson.length
        });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Lỗi khi đọc file từ máy tính.'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Tự động nhận diện loại dữ liệu (Khách hàng, Dịch vụ hay Sản phẩm) dựa vào tiêu đề cột và nội dung mẫu
 */
export function autoDetectEntityType(headers = []) {
  const normHeaders = headers.map(normalizeKeyword);
  const scores = { customer: 0, service: 0, product: 0 };

  // 1. Chấm điểm Khách hàng
  normHeaders.forEach(h => {
    if (h.includes('so dien thoai') || h.includes('sdt') || h.includes('phone') || h.includes('mobile')) scores.customer += 5;
    if (h.includes('khach hang') || h.includes('ho va ten') || h.includes('ho ten')) scores.customer += 4;
    if (h.includes('ngay sinh') || h.includes('birthday') || h.includes('dob')) scores.customer += 3;
    if (h.includes('gioi tinh') || h.includes('gender')) scores.customer += 3;
    if (h.includes('hang thanh vien') || h.includes('hang the')) scores.customer += 3;
    if (h.includes('email')) scores.customer += 2;
    if (h.includes('dia chi') || h.includes('address')) scores.customer += 2;
  });

  // 2. Chấm điểm Dịch vụ
  normHeaders.forEach(h => {
    if (h.includes('ten dich vu') || h.includes('dich vu')) scores.service += 5;
    if (h.includes('thoi luong') || h.includes('duration') || h.includes('phut')) scores.service += 4;
    if (h.includes('gia dich vu') || h.includes('gia tu')) scores.service += 4;
    if (h.includes('nhom dich vu')) scores.service += 3;
  });

  // 3. Chấm điểm Sản phẩm & Kho
  normHeaders.forEach(h => {
    if (h.includes('ten san pham') || h.includes('san pham') || h.includes('hang hoa')) scores.product += 5;
    if (h.includes('ma vach') || h.includes('barcode') || h.includes('sku') || h.includes('ma sp')) scores.product += 5;
    if (h.includes('ton kho') || h.includes('stock') || h.includes('so luong ton')) scores.product += 4;
    if (h.includes('gia von') || h.includes('gia nhap') || h.includes('cost')) scores.product += 4;
    if (h.includes('don vi tinh') || h.includes('dvt')) scores.product += 3;
  });

  // Tìm loại có điểm cao nhất
  let detectedType = 'customer';
  let maxScore = scores.customer;

  if (scores.service > maxScore) {
    detectedType = 'service';
    maxScore = scores.service;
  }
  if (scores.product > maxScore) {
    detectedType = 'product';
    maxScore = scores.product;
  }

  return detectedType;
}

/**
 * Tự động ánh xạ (map) tiêu đề cột Excel vào các trường schema chuẩn
 */
export function autoMapColumns(headers = [], entityType = 'customer') {
  const schema = ENTITY_SCHEMAS[entityType] || ENTITY_SCHEMAS.customer;
  const mapping = {};

  schema.fields.forEach(field => {
    // Tìm cột trong headers khớp với bất kỳ alias nào
    const matchedHeader = headers.find(h => {
      const normH = normalizeKeyword(h);
      return field.aliases.some(alias => {
        const normAlias = normalizeKeyword(alias);
        return normH === normAlias || normH.includes(normAlias);
      });
    });

    if (matchedHeader) {
      mapping[field.key] = matchedHeader;
    }
  });

  return mapping;
}

/**
 * Chuẩn hóa số điện thoại Việt Nam (10 chữ số)
 */
export function sanitizePhoneNumber(phone) {
  if (!phone) return '';
  let clean = String(phone).replace(/[^\d+]/g, '').trim();
  if (clean.startsWith('+84')) {
    clean = '0' + clean.slice(3);
  } else if (clean.startsWith('84') && clean.length >= 11) {
    clean = '0' + clean.slice(2);
  }
  return clean;
}

/**
 * Chuẩn hóa giá tiền hoặc số lượng
 */
export function parseNumberField(val, defaultVal = 0) {
  if (val === undefined || val === null || val === '') return defaultVal;
  if (typeof val === 'number') return val;
  const clean = String(val).replace(/[^\d.-]/g, '');
  const num = parseFloat(clean);
  return isNaN(num) ? defaultVal : num;
}

/**
 * Chuyển đổi và kiểm tra tính hợp lệ của toàn bộ các dòng dữ liệu sau khi map cột
 */
export function validateAndTransformRows(rawRows = [], columnMapping = {}, entityType = 'customer') {
  const schema = ENTITY_SCHEMAS[entityType] || ENTITY_SCHEMAS.customer;
  const validRows = [];
  const invalidRows = [];

  rawRows.forEach((raw, idx) => {
    const item = {};
    const rowNum = idx + 2; // Dòng thứ tự trên Excel (tính cả dòng header 1)

    // Map từng trường
    schema.fields.forEach(field => {
      const sourceCol = columnMapping[field.key];
      let val = sourceCol && raw[sourceCol] !== undefined ? raw[sourceCol] : '';

      if (field.key === 'phone') {
        val = sanitizePhoneNumber(val);
      } else if (['price', 'cost_price', 'price_from', 'total_spent', 'stock', 'min_stock', 'duration_minutes'].includes(field.key)) {
        val = parseNumberField(val, field.key === 'duration_minutes' ? 45 : 0);
      } else {
        val = String(val).trim();
      }

      item[field.key] = val;
    });

    // Kiểm tra trường bắt buộc
    let errorReason = null;
    if (entityType === 'customer') {
      if (!item.name) errorReason = 'Thiếu họ và tên khách hàng';
      else if (!item.phone || item.phone.length < 8) errorReason = 'Số điện thoại không hợp lệ (ít hơn 8 số)';
    } else if (entityType === 'service') {
      if (!item.name) errorReason = 'Thiếu tên dịch vụ';
      else if (item.price === undefined || item.price < 0) errorReason = 'Giá dịch vụ không hợp lệ';
    } else if (entityType === 'product') {
      if (!item.name) errorReason = 'Thiếu tên sản phẩm';
    }

    if (errorReason) {
      invalidRows.push({ rowNum, raw, error: errorReason });
    } else {
      validRows.push({ rowNum, data: item });
    }
  });

  return {
    validRows,
    invalidRows,
    totalCount: rawRows.length,
    validCount: validRows.length,
    invalidCount: invalidRows.length
  };
}

/**
 * Thực thi Import vào Hệ thống với cơ chế xử lý trùng lặp tùy chọn
 * @param {Object} params
 * @param {string} params.entityType - 'customer' | 'service' | 'product'
 * @param {Array} params.validRows - Danh sách dòng hợp lệ từ validateAndTransformRows
 * @param {string} params.duplicateStrategy - 'skip' (Bỏ qua dòng trùng) | 'update' (Cập nhật / Ghi đè)
 * @param {string} params.currentBranchId - ID chi nhánh hiện hành
 */
export async function executeImportBatch({
  entityType = 'customer',
  validRows = [],
  duplicateStrategy = 'skip', // 'skip' | 'update'
  currentBranchId = 'all'
}) {
  if (!validRows || validRows.length === 0) {
    return { success: false, message: 'Không có dữ liệu hợp lệ để import.' };
  }

  let createdCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  const errors = [];

  try {
    if (entityType === 'customer') {
      // 1. Tải danh sách khách hàng hiện có để kiểm tra trùng SĐT
      const existingCustomers = await base44.entities.Customer.list().catch(() => []);
      const phoneMap = new Map();
      existingCustomers.forEach(c => {
        const p = sanitizePhoneNumber(c.phone);
        if (p) phoneMap.set(p, c);
      });

      for (const row of validRows) {
        const item = row.data;
        const existing = phoneMap.get(item.phone);

        if (existing) {
          if (duplicateStrategy === 'update') {
            await base44.entities.Customer.update(existing.id, {
              name: item.name || existing.name,
              email: item.email || existing.email,
              gender: item.gender || existing.gender,
              birth_date: item.birth_date || existing.birth_date,
              address: item.address || existing.address,
              tier: item.tier || existing.tier,
              note: item.notes || existing.note,
              totalSpent: item.total_spent ? (existing.totalSpent || 0) + item.total_spent : existing.totalSpent
            }).catch(e => errors.push({ rowNum: row.rowNum, error: e.message }));
            updatedCount++;
          } else {
            skippedCount++;
          }
        } else {
          const newCust = await base44.entities.Customer.create({
            name: item.name,
            phone: item.phone,
            email: item.email || '',
            gender: item.gender || 'Khác',
            birth_date: item.birth_date || null,
            address: item.address || '',
            tier: item.tier || 'Đồng',
            note: item.notes || '',
            totalSpent: item.total_spent || 0,
            visitCount: 1,
            created_at: new Date().toISOString()
          }).catch(e => errors.push({ rowNum: row.rowNum, error: e.message }));

          if (newCust) {
            phoneMap.set(item.phone, newCust);
            createdCount++;
          }
        }
      }

      // Kích hoạt đồng bộ màn hình
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('reload-data'));
        window.dispatchEvent(new Event('gp_customers_updated'));
      }
    } else if (entityType === 'service') {
      // 2. Tải danh mục dịch vụ hiện có để kiểm tra trùng tên
      const existingServices = await base44.entities.Service.list().catch(() => []);
      const nameMap = new Map();
      existingServices.forEach(s => {
        if (s.name) nameMap.set(normalizeKeyword(s.name), s);
      });

      for (const row of validRows) {
        const item = row.data;
        const normName = normalizeKeyword(item.name);
        const existing = nameMap.get(normName);

        if (existing) {
          if (duplicateStrategy === 'update') {
            await base44.entities.Service.update(existing.id, {
              price: item.price || existing.price,
              duration_minutes: item.duration_minutes || existing.duration_minutes,
              category: item.category || existing.category,
              description: item.description || existing.description
            }).catch(e => errors.push({ rowNum: row.rowNum, error: e.message }));
            updatedCount++;
          } else {
            skippedCount++;
          }
        } else {
          const newService = await base44.entities.Service.create({
            name: item.name,
            price: item.price,
            price_from: item.price_from || item.price,
            duration_minutes: item.duration_minutes || 45,
            category: item.category || 'Dịch vụ Salon',
            description: item.description || '',
            is_active: true,
            branch_ids: currentBranchId && currentBranchId !== 'all' ? [currentBranchId] : []
          }).catch(e => errors.push({ rowNum: row.rowNum, error: e.message }));

          if (newService) {
            nameMap.set(normName, newService);
            createdCount++;
          }
        }
      }

      // Kích hoạt reload
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('reload-data'));
        window.dispatchEvent(new Event('gp_services_updated'));
      }
    } else if (entityType === 'product') {
      // 3. Tải danh sách sản phẩm để kiểm tra trùng Mã vạch/SKU hoặc Tên
      const existingProducts = await base44.entities.Product.list().catch(() => []);
      const barcodeMap = new Map();
      const nameMap = new Map();
      existingProducts.forEach(p => {
        if (p.sku || p.barcode) barcodeMap.set(String(p.sku || p.barcode).trim(), p);
        if (p.name) nameMap.set(normalizeKeyword(p.name), p);
      });

      for (const row of validRows) {
        const item = row.data;
        const barcodeKey = item.barcode ? String(item.barcode).trim() : null;
        const normName = normalizeKeyword(item.name);
        const existing = (barcodeKey && barcodeMap.get(barcodeKey)) || nameMap.get(normName);

        if (existing) {
          if (duplicateStrategy === 'update') {
            await base44.entities.Product.update(existing.id, {
              price: item.price || existing.price,
              cost_price: item.cost_price || existing.cost_price,
              stock: item.stock !== undefined ? item.stock : existing.stock,
              unit: item.unit || existing.unit,
              category: item.category || existing.category,
              sku: item.barcode || existing.sku
            }).catch(e => errors.push({ rowNum: row.rowNum, error: e.message }));
            updatedCount++;
          } else {
            skippedCount++;
          }
        } else {
          const newProd = await base44.entities.Product.create({
            name: item.name,
            price: item.price,
            cost_price: item.cost_price || item.price * 0.6,
            stock: item.stock || 0,
            unit: item.unit || 'Cái',
            category: item.category || 'Mỹ phẩm',
            sku: item.barcode || '',
            is_active: true,
            branch_ids: currentBranchId && currentBranchId !== 'all' ? [currentBranchId] : []
          }).catch(e => errors.push({ rowNum: row.rowNum, error: e.message }));

          if (newProd) {
            if (item.barcode) barcodeMap.set(item.barcode, newProd);
            nameMap.set(normName, newProd);
            createdCount++;
          }
        }
      }

      // Kích hoạt reload
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('reload-data'));
        window.dispatchEvent(new Event('gp_inventory_updated'));
      }
    }

    return {
      success: true,
      entityType,
      total: validRows.length,
      createdCount,
      updatedCount,
      skippedCount,
      errors
    };
  } catch (err) {
    return {
      success: false,
      message: err.message || 'Lỗi trong quá trình import dữ liệu.'
    };
  }
}
