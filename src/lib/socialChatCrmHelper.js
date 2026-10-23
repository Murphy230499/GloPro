/**
 * socialChatCrmHelper.js
 * Helpers for Phase 3: Appointment pre-filling, Natural date/time parsing, and Customer CRM synchronization
 */

import { base44 } from '@/api/base44Client';

/**
 * Quy đổi ngày/giờ tự nhiên sang định dạng chuẩn YYYY-MM-DD và HH:MM cho input
 */
export function parseNaturalDateTime(dateStr = '', timeStr = '') {
  const now = new Date();
  let targetDate = new Date();
  const lower = (dateStr || '').toLowerCase();

  if (lower.includes('hôm nay') || lower.includes('today')) {
    targetDate = now;
  } else if (lower.includes('mai') || lower.includes('tomorrow')) {
    targetDate.setDate(now.getDate() + 1);
  } else if (lower.includes('ngày kia') || lower.includes('mốt')) {
    targetDate.setDate(now.getDate() + 2);
  } else if (lower.includes('thứ hai') || lower.includes('thứ 2') || lower.includes('monday')) {
    const day = now.getDay();
    const diff = (1 - day + 7) % 7 || 7;
    targetDate.setDate(now.getDate() + diff);
  } else if (lower.includes('thứ ba') || lower.includes('thứ 3') || lower.includes('tuesday')) {
    const day = now.getDay();
    const diff = (2 - day + 7) % 7 || 7;
    targetDate.setDate(now.getDate() + diff);
  } else if (lower.includes('thứ tư') || lower.includes('thứ 4') || lower.includes('wednesday')) {
    const day = now.getDay();
    const diff = (3 - day + 7) % 7 || 7;
    targetDate.setDate(now.getDate() + diff);
  } else if (lower.includes('thứ năm') || lower.includes('thứ 5') || lower.includes('thursday')) {
    const day = now.getDay();
    const diff = (4 - day + 7) % 7 || 7;
    targetDate.setDate(now.getDate() + diff);
  } else if (lower.includes('thứ sáu') || lower.includes('thứ 6') || lower.includes('friday')) {
    const day = now.getDay();
    const diff = (5 - day + 7) % 7 || 7;
    targetDate.setDate(now.getDate() + diff);
  } else if (lower.includes('thứ bảy') || lower.includes('thứ 7') || lower.includes('saturday')) {
    const day = now.getDay();
    const diff = (6 - day + 7) % 7 || 7;
    targetDate.setDate(now.getDate() + diff);
  } else if (lower.includes('chủ nhật') || lower.includes('cn') || lower.includes('sunday')) {
    const day = now.getDay();
    const diff = (7 - day + 7) % 7 || 7;
    targetDate.setDate(now.getDate() + diff);
  } else {
    // Kiểm tra định dạng YYYY-MM-DD có sẵn
    const matchYMD = (dateStr || '').match(/\d{4}-\d{2}-\d{2}/);
    if (matchYMD) {
      return { date: matchYMD[0], time: parseTime(timeStr, dateStr) };
    }
    const ddmmyyyy = (dateStr || '').match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (ddmmyyyy) {
      return {
        date: `${ddmmyyyy[3]}-${ddmmyyyy[2].padStart(2, '0')}-${ddmmyyyy[1].padStart(2, '0')}`,
        time: parseTime(timeStr, dateStr)
      };
    }
    // Mặc định ngày mai nếu chưa rõ
    targetDate.setDate(now.getDate() + 1);
  }

  const yyyy = targetDate.getFullYear();
  const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
  const dd = String(targetDate.getDate()).padStart(2, '0');

  return {
    date: `${yyyy}-${mm}-${dd}`,
    time: parseTime(timeStr, dateStr)
  };
}

/**
 * Trích xuất giờ định dạng HH:MM chuẩn
 */
function parseTime(timeStr = '', contextStr = '') {
  if (!timeStr || timeStr.includes('Chưa rõ') || timeStr.includes('不明')) {
    const lowerCtx = (contextStr || '').toLowerCase();
    if (lowerCtx.includes('sáng') || lowerCtx.includes('morning')) return '09:30';
    if (lowerCtx.includes('chiều') || lowerCtx.includes('afternoon')) return '14:30';
    if (lowerCtx.includes('tối') || lowerCtx.includes('evening')) return '18:00';
    return '14:00';
  }

  const clean = timeStr.trim();
  const m1 = clean.match(/(\d{1,2})[:h](\d{2})/i);
  if (m1) {
    const h = Math.min(23, parseInt(m1[1], 10));
    return `${String(h).padStart(2, '0')}:${m1[2]}`;
  }

  const m2 = clean.match(/(\d{1,2})[h:]?/i);
  if (m2) {
    const h = Math.min(23, parseInt(m2[1], 10));
    return `${String(h).padStart(2, '0')}:00`;
  }

  return '14:00';
}

/**
 * Tra cứu hoặc tự động tạo mới hồ sơ khách hàng vào CSDL GloPro CRM
 */
export async function syncOrCreateCustomer({ customerName, phone, channel, avatar }) {
  if (!phone) return null;
  const cleanPhone = phone.replace(/\s+/g, '');

  try {
    // 1. Tra cứu theo số điện thoại
    const existing = await base44.entities.Customer.filter({ phone: cleanPhone }).catch(() => []);
    if (existing && existing.length > 0) {
      return { customer: existing[0], isNew: false };
    }

    // 2. Nếu chưa có, tự động tạo hồ sơ khách mới
    const newRecord = await base44.entities.Customer.create({
      name: customerName || 'Khách Social Chat',
      phone: cleanPhone,
      client_source: channel || 'social_chat',
      avatar_url: avatar || '',
      note: `[GloPro Social Chat] Khách hàng tự động đồng bộ từ kênh ${channel?.toUpperCase() || 'Mạng xã hội'}`
    });

    return { customer: newRecord, isNew: true };
  } catch (err) {
    console.warn('[socialChatCrmHelper] syncOrCreateCustomer notice:', err);
    return null;
  }
}

/**
 * Lấy dữ liệu chi tiết CRM của khách hàng từ CSDL
 */
export async function fetchCustomerCrmDetails(phone) {
  if (!phone) return null;
  const cleanPhone = phone.replace(/\s+/g, '');

  try {
    const customers = await base44.entities.Customer.filter({ phone: cleanPhone }).catch(() => []);
    if (!customers || customers.length === 0) return null;

    const cust = customers[0];

    // Lấy danh sách hóa đơn và lịch hẹn của khách để thống kê lượt đến & tổng chi tiêu
    const [invoices, appointments] = await Promise.all([
      base44.entities.Invoice ? base44.entities.Invoice.filter({ customer_id: cust.id }).catch(() => []) : Promise.resolve([]),
      base44.entities.Appointment ? base44.entities.Appointment.filter({ customer_id: cust.id }).catch(() => []) : Promise.resolve([])
    ]);

    const totalSpent = (invoices || []).reduce((acc, inv) => acc + Number(inv.total_amount || inv.total || 0), 0);
    const visitCount = Math.max((invoices || []).length, (appointments || []).filter(a => a.status === 'completed').length, 1);

    let tier = 'Thành viên mới';
    if (totalSpent >= 10000000) tier = 'Hạng Kim Cương (VIP)';
    else if (totalSpent >= 5000000) tier = 'Hạng Vàng';
    else if (totalSpent >= 2000000) tier = 'Hạng Bạc';

    return {
      id: cust.id,
      name: cust.name,
      phone: cust.phone,
      tier,
      visitCount,
      totalSpent,
      notes: cust.note || 'Khách hàng quan tâm dịch vụ chăm sóc tóc cao cấp.',
      isDbSynced: true
    };
  } catch (err) {
    console.warn('[socialChatCrmHelper] fetchCustomerCrmDetails notice:', err);
    return null;
  }
}
