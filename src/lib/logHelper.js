import { formatVND } from '@/lib/format';

export const METHOD_LABELS = {
  cash: 'Tiền mặt',
  transfer: 'Chuyển khoản',
  card: 'Thẻ tín dụng',
  ewallet: 'Ví điện tử',
  membership: 'Thẻ tiền mặt',
  points: 'Điểm tích lũy',
  debt: 'Ghi nợ'
};

export function createLogEntry(action, details = '', user = 'Thu ngân') {
  return {
    id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    action,
    details,
    time: new Date().toISOString(),
    user
  };
}

export function getNormalizedLogs(inv) {
  if (!inv) return [];

  let parsedLogs = inv.logs;
  if (typeof parsedLogs === 'string') {
    try {
      parsedLogs = JSON.parse(parsedLogs);
    } catch (e) {
      parsedLogs = [];
    }
  }
  const rawLogs = Array.isArray(parsedLogs) ? [...parsedLogs] : [];
  
  const saleCode = inv.invoice_code || inv.saleCode || (inv.id ? String(inv.id).slice(-6) : '');
  const customerName = inv.customer_name || inv.customer?.name || 'Khách vãng lai';
  const timeStr = inv.createdAt || inv.created_at || (inv.date ? (inv.date.includes('T') ? inv.date : inv.date + 'T00:00:00Z') : new Date().toISOString());

  // 1. Ensure creation log exists
  const hasCreateLog = rawLogs.some(l => l && l.action && (l.action.toLowerCase().includes('tạo hoá đơn') || l.action.toLowerCase().includes('tạo hóa đơn')));
  if (!hasCreateLog) {
    rawLogs.unshift({
      id: 'log_create_' + (inv.id || saleCode),
      action: `Tạo hoá đơn #${saleCode}`,
      details: `Khởi tạo hoá đơn cho ${customerName}`,
      time: timeStr,
      user: 'Lễ tân'
    });
  }

  // 2. Ensure payment log exists if paid
  const isPaid = inv.status === 'paid';
  const hasPayLog = rawLogs.some(l => l && l.action && (l.action.toLowerCase().includes('thanh toán') || l.action.toLowerCase().includes('hoàn tất')));
  if (isPaid && !hasPayLog) {
    const totalAmount = inv.total !== undefined ? inv.total : 0;
    const methodStr = Array.isArray(inv.payment_methods) && inv.payment_methods.length > 0
      ? inv.payment_methods.map(m => METHOD_LABELS[m.method] || m.method || m).join(', ')
      : 'Tiền mặt';
    rawLogs.push({
      id: 'log_pay_' + (inv.id || saleCode),
      action: 'Thanh toán hoá đơn',
      details: `Thanh toán thành công ${totalAmount ? formatVND(totalAmount) : ''} qua ${methodStr}`,
      time: timeStr,
      user: 'Thu ngân'
    });
  }

  // 3. Ensure cancel log exists if cancelled
  const isCancelled = inv.status === 'cancelled' || inv.status === 'refunded';
  const hasCancelLog = rawLogs.some(l => l && l.action && l.action.toLowerCase().includes('huỷ hoá đơn'));
  if (isCancelled && !hasCancelLog) {
    rawLogs.push({
      id: 'log_cancel_' + (inv.id || saleCode),
      action: 'Huỷ hoá đơn',
      details: 'Hoá đơn đã được huỷ khỏi hệ thống',
      time: timeStr,
      user: 'Thu ngân'
    });
  }

  return rawLogs;
}
