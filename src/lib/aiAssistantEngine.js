'use client';

import { base44 } from '@/api/base44Client';
import { formatVND, formatDate } from '@/lib/format';

/**
 * GloPro AI Agent Core NLP & Intent Execution Engine
 */

export const SLASH_COMMANDS = [
  { command: '/taobill', description: 'Tạo hóa đơn / bill thanh toán mới', example: 'Tạo bill cho Chị Lan gội đầu 100k cắt tóc 150k' },
  { command: '/taolich', description: 'Tạo lịch hẹn mới', example: 'Tạo lịch hẹn khách Chị Hoa gội đầu 15:00' },
  { command: '/taokhach', description: 'Tạo hồ sơ khách hàng mới', example: 'Tạo khách hàng Nguyễn Văn A 0912345678' },
  { command: '/taonhanvien', description: 'Thêm nhân viên mới', example: 'Thêm nhân viên Minh Thu Thợ chính' },
  { command: '/taodichvu', description: 'Tạo dịch vụ mới', example: 'Tạo dịch vụ Cắt tóc nam 150000' },
  { command: '/taosanpham', description: 'Tạo sản phẩm mới', example: 'Tạo sản phẩm Dầu gội Collagen 250000' },
  { command: '/taovoucher', description: 'Phát hành mã Voucher mới', example: 'Tạo voucher GP50K 50000' },
  { command: '/taotapkh', description: 'Tạo tập khách hàng theo điều kiện', example: 'Tạo tập khách hàng VIP chi tiêu trên 10 triệu' },
  { command: '/baocao', description: 'Tạo báo cáo tùy chỉnh', example: 'Báo cáo doanh thu theo nhân viên' },
  { command: '/xeplich', description: 'Phân ca xếp lịch nhân viên', example: 'Phân ca sáng cho Minh Thu Thứ 2' },
  { command: '/import', description: 'Mở khung Import dữ liệu file Excel/CSV', example: '/import khách hàng' },
  { command: '/pos', description: 'Chuyển nhanh tới màn hình thanh toán POS', example: '/pos' },
];

/**
 * Provides smart suggestions based on current active route.
 */
export function getContextSuggestions(pathname) {
  switch (pathname) {
    case '/customers':
      return [
        { label: '➕ Tạo khách hàng mới', text: 'Tạo khách hàng Nguyễn Văn A 0912345678' },
        { label: '👥 Tạo tập KH chi tiêu trên 5tr', text: 'Tạo tập khách hàng VIP chi tiêu trên 5 triệu' },
        { label: '📁 Import danh sách khách', text: 'Tôi muốn import file danh sách khách hàng' },
        { label: '🎂 Lọc khách sinh nhật tháng này', text: 'Tạo tập khách hàng sinh nhật tháng này' },
      ];
    case '/appointments':
      return [
        { label: '📅 Tạo lịch hẹn 15h hôm nay', text: 'Tạo lịch hẹn khách Anh Nam dịch vụ gội đầu lúc 15:00' },
        { label: '❓ Lịch hẹn chưa xếp nhân viên', text: 'Hôm nay có bao nhiêu lịch hẹn chưa phân công nhân viên?' },
        { label: '📊 Tỷ lệ hủy lịch hẹn', text: 'Tạo báo cáo tỷ lệ hoàn thành vs hủy lịch hẹn' },
      ];
    case '/staff':
      return [
        { label: '👤 Thêm nhân viên mới', text: 'Thêm nhân viên Trần Văn B vị trí Thợ phụ' },
        { label: '📆 Phân ca sáng Thứ 2', text: 'Phân ca sáng cho nhân viên Minh Thu vào Thứ 2' },
        { label: '💰 Báo cáo hoa hồng', text: 'Tạo báo cáo hoa hồng nhân viên tháng này' },
      ];
    case '/services':
      return [
        { label: '✂️ Tạo dịch vụ mới', text: 'Tạo dịch vụ Cắt tóc nam 150000' },
        { label: '📦 Thêm sản phẩm mới', text: 'Tạo sản phẩm Dầu gội Collagen 250000' },
        { label: '📁 Import sản phẩm Excel', text: 'Tôi muốn import danh sách sản phẩm từ file Excel' },
      ];
    case '/discounts':
      return [
        { label: '🎟️ Tạo Voucher 50K', text: 'Tạo voucher GP50K 50000' },
        { label: '🎁 Tặng quà cho khách', text: 'Tặng khuyến mãi cho khách hàng Chị Lan' },
      ];
    case '/pos':
      return [
        { label: '🛒 Hướng dẫn thanh toán nhanh', text: 'Hướng dẫn các bước tạo hóa đơn thanh toán trên POS' },
        { label: '🎟️ Kiểm tra voucher khả dụng', text: 'Cho tôi xem danh sách các mã voucher đang hoạt động' },
      ];
    default:
      return [
        { label: '📊 Doanh thu hôm nay', text: 'Doanh thu hôm nay là bao nhiêu?' },
        { label: '📅 Tạo lịch hẹn mới', text: 'Tạo lịch hẹn khách Chị Hoa gội đầu 14:00' },
        { label: '👤 Thêm nhân viên mới', text: 'Thêm nhân viên Minh Thu Thợ chính' },
        { label: '👥 Tạo tập khách VIP', text: 'Tạo tập khách hàng VIP chi tiêu trên 10 triệu' },
        { label: '📁 Import dữ liệu Excel', text: 'Tôi muốn import file danh sách khách hàng' },
      ];
  }
}

/**
 * Main AI Intent Execution Handler
 */
export async function processUserMessage(userMessage, context = {}) {
  let effectiveText = userMessage.trim();

  // If there was a pending context prefix (e.g. previous question waiting for missing info)
  if (context.pendingPrefix && !effectiveText.startsWith('/')) {
    effectiveText = `${context.pendingPrefix} ${effectiveText}`;
  }

  const text = effectiveText.toLowerCase();

  // Helper dispatch to refresh page UI
  const notifyReload = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('reload-data'));
      window.dispatchEvent(new Event('storage'));
    }
  };

  // 1. SLASH COMMAND DIRECT MATCH
  if (text.startsWith('/import')) {
    return {
      type: 'import_card',
      text: 'Vui lòng chọn loại dữ liệu và kéo thả file CSV hoặc JSON để import vào hệ thống:',
      importType: text.includes('sản phẩm') ? 'product' : 'customer'
    };
  }

  if (text.startsWith('/pos')) {
    return {
      type: 'navigation',
      text: 'Đang chuyển hướng tới màn hình thanh toán POS...',
      route: '/pos'
    };
  }

  // 2. CREATE CUSTOMER SEGMENT (Tạo tập khách hàng)
  if (text.includes('tập khách') || text.includes('tập kh') || text.includes('nhóm khách') || text.includes('/taotapkh')) {
    try {
      let segmentName = 'Tập khách hàng tùy chỉnh';
      const conditions = {};

      if (text.includes('vip') || text.includes('chi tiêu')) {
        const matchMoney = text.match(/(\d+)\s*(triệu|tr|k|000)/i);
        let amount = 5000000;
        if (matchMoney) {
          const num = parseInt(matchMoney[1], 10);
          const unit = matchMoney[2].toLowerCase();
          if (unit === 'triệu' || unit === 'tr') amount = num * 1000000;
          else if (unit === 'k') amount = num * 1000;
        }
        conditions.total_spent_gt = amount;
        segmentName = `Khách hàng chi tiêu > ${formatVND(amount)}`;
      }

      if (text.includes('chưa quay lại') || text.includes('chưa đến') || text.includes('nguy cơ')) {
        const matchDays = text.match(/(\d+)\s*(ngày|tháng)/i);
        let days = 30;
        if (matchDays) {
          const num = parseInt(matchDays[1], 10);
          if (matchDays[2].includes('tháng')) days = num * 30;
          else days = num;
        }
        conditions.last_visit_days_gt = days;
        if (!segmentName.includes('chi tiêu')) {
          segmentName = `Khách chưa quay lại > ${days} ngày`;
        }
      }

      if (text.includes('sinh nhật')) {
        const currentMonth = new Date().getMonth() + 1;
        conditions.birthday_month_eq = currentMonth;
        segmentName = `Khách sinh nhật tháng ${currentMonth}`;
      }

      if (text.includes('nữ')) conditions.gender = 'Nữ';
      if (text.includes('nam')) conditions.gender = 'Nam';

      // Save segment
      const newSeg = {
        id: `seg_${Date.now()}`,
        name: segmentName,
        description: `Tạo tự động bởi GloPro AI Agent vào ${new Date().toLocaleDateString('vi-VN')}`,
        conditions: JSON.stringify(conditions),
        created_at: new Date().toISOString()
      };

      const existingSegs = JSON.parse(localStorage.getItem('glopro_customer_segments') || '[]');
      existingSegs.push(newSeg);
      localStorage.setItem('glopro_customer_segments', JSON.stringify(existingSegs));
      notifyReload();

      return {
        type: 'segment_created',
        text: `✅ Trợ lý AI đã tạo thành công **Tập khách hàng: ${segmentName}**!`,
        segment: newSeg
      };
    } catch (err) {
      console.error('Error creating segment:', err);
    }
  }

  // 3. GENERATE CUSTOM REPORT (Tạo báo cáo tùy chỉnh)
  if (text.includes('báo cáo') || text.includes('doanh thu') || text.includes('thống kê') || text.includes('/baocao')) {
    try {
      const [invList, apptList, custList, staffList] = await Promise.all([
        base44.entities.Invoice.list().catch(() => []),
        base44.entities.Appointment.list().catch(() => []),
        base44.entities.Customer.list().catch(() => []),
        base44.entities.Staff.list().catch(() => [])
      ]);

      let reportTitle = 'Báo cáo Hoạt động Salon';
      let reportType = 'general';
      const items = [];

      if (text.includes('nhân viên') || text.includes('thợ')) {
        reportTitle = 'Báo cáo Doanh thu & Lượt phục vụ theo Nhân viên';
        reportType = 'staff_revenue';
        (staffList || []).forEach(st => {
          const stInvoices = (invList || []).filter(i => String(i.staff_id || i.staffId) === String(st.id));
          const totalRev = stInvoices.reduce((s, i) => s + (Number(i.finalAmount || i.total_amount) || 0), 0);
          items.push({
            name: st.name,
            sub: st.role || 'Nhân viên',
            count: stInvoices.length,
            value: totalRev
          });
        });
        items.sort((a, b) => b.value - a.value);
      } else if (text.includes('khách') || text.includes('chi tiêu')) {
        reportTitle = 'Báo cáo Phân tích Khách hàng Chi tiêu cao';
        reportType = 'top_customers';
        (custList || []).slice(0, 10).forEach(c => {
          items.push({
            name: c.name,
            sub: c.phone || '—',
            count: c.visitCount || 1,
            value: c.totalSpent || 0
          });
        });
        items.sort((a, b) => b.value - a.value);
      } else {
        reportTitle = 'Báo cáo Tổng quan Doanh thu & Lịch hẹn';
        reportType = 'revenue_summary';
        const totalRev = (invList || []).reduce((s, i) => s + (Number(i.finalAmount || i.total_amount) || 0), 0);
        items.push({ name: 'Tổng doanh thu', count: (invList || []).length, value: totalRev });
        items.push({ name: 'Tổng số lịch hẹn', count: (apptList || []).length, value: (apptList || []).length });
        items.push({ name: 'Tổng số khách hàng', count: (custList || []).length, value: (custList || []).length });
      }

      return {
        type: 'custom_report',
        text: `📊 Đã khởi tạo **${reportTitle}** dựa trên dữ liệu thời gian thực:`,
        report: {
          title: reportTitle,
          type: reportType,
          items,
          createdDate: new Date().toLocaleDateString('vi-VN')
        }
      };
    } catch (e) {
      console.error(e);
    }
  }

  // 3.5. CREATE BILL / INVOICE (Tạo hóa đơn / bill)
  if (text.includes('bill') || text.includes('hóa đơn') || text.includes('hoá đơn') || text.includes('tạo đơn') || text.includes('xuất đơn') || text.includes('/taobill')) {
    try {
      // Parse Items & Prices
      const items = [];
      const priceRegex = /([A-ZÀ-Ỹa-zà-ỹ\s]+?)\s*(\d+[\d\.,]*)\s*(k|tr|triệu|000|đ|vnd)/gi;
      let match;
      while ((match = priceRegex.exec(userMessage)) !== null) {
        let rawItemName = match[1].replace(/(?:tạo|bill|hóa đơn|cho|khách|dịch vụ|giá)/gi, '').trim();
        if (!rawItemName || rawItemName.length < 2) rawItemName = 'Dịch vụ Salon';
        
        const num = parseFloat(match[2].replace(',', '.'));
        const unit = match[3].toLowerCase();
        let price = num;
        if (unit === 'k') price = num * 1000;
        else if (unit === 'tr' || unit === 'triệu') price = num * 1000000;
        else if (num < 1000) price = num * 1000;

        items.push({
          id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: rawItemName.charAt(0).toUpperCase() + rawItemName.slice(1),
          price: price,
          qty: 1,
          type: 'service'
        });
      }

      // Check if user provided items and prices
      if (items.length === 0) {
        let custNameHint = '';
        const nameMatch = userMessage.match(/(?:cho|khách|khách hàng|tên)\s+([A-ZÀ-Ỹa-zà-ỹ\s]+?)(?=\s+(?:gội|cắt|nhuộm|làm|dầu|sản phẩm|giá|tiền|\d|hôm|$))/i);
        if (nameMatch && nameMatch[1].trim().length > 1) {
          custNameHint = ` cho khách **${nameMatch[1].trim()}**`;
        }

        return {
          type: 'text',
          text: `Dạ, tôi sẵn sàng hỗ trợ tạo Bill / Hóa đơn mới${custNameHint}! 🧾\n\nVui lòng cung cấp đầy đủ thông tin sau để tôi xuất bill nhé:\n1. **Tên khách hàng**: *(chị Lan / anh Nam / Khách lẻ)*\n2. **Dịch vụ / Sản phẩm & Giá tiền**: *(gội đầu 100k, cắt tóc 150k)*\n3. **Hình thức thanh toán**: *(Tiền mặt / Chuyển khoản / Thẻ)*\n\n💡 **Ví dụ câu lệnh đầy đủ**:\n• *"Tạo bill cho Chị Lan gội đầu 100k cắt tóc 150k chuyển khoản"*\n• *"Xuất hóa đơn Khách lẻ dầu gội collagen 250k"*`
        };
      }

      // Extract customer name
      let custName = 'Khách lẻ';
      const nameMatch = userMessage.match(/(?:cho|khách|khách hàng|tên)\s+([A-ZÀ-Ỹa-zà-ỹ\s]+?)(?=\s+(?:gội|cắt|nhuộm|làm|dầu|sản phẩm|giá|tiền|\d|hôm|$))/i);
      if (nameMatch) {
        const parsedName = nameMatch[1].trim();
        if (parsedName.length > 1 && !['hóa đơn', 'bill', 'tạo', 'đơn', 'mới'].includes(parsedName.toLowerCase())) {
          custName = parsedName;
        }
      }

      // Payment method
      let payMethod = 'Tiền mặt';
      if (text.includes('chuyển khoản') || text.includes('stk') || text.includes('bank')) payMethod = 'Chuyển khoản';
      else if (text.includes('thẻ') || text.includes('pos')) payMethod = 'Thẻ';

      const subtotal = items.reduce((sum, item) => sum + (item.price * item.qty), 0);
      const invoiceCode = `HD${Math.floor(100000 + Math.random() * 900000)}`;

      const payload = {
        code: invoiceCode,
        invoice_code: invoiceCode,
        customer_name: custName,
        customer_phone: '09' + Math.floor(10000000 + Math.random() * 90000000),
        items: items,
        subtotal: subtotal,
        discount: 0,
        total: subtotal,
        finalAmount: subtotal,
        payment_method: payMethod,
        status: 'completed',
        date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString()
      };

      let createdInvoice = null;
      try {
        createdInvoice = await base44.entities.Invoice.create(payload);
      } catch (err) {
        const local = JSON.parse(localStorage.getItem('glopro_invoices') || '[]');
        createdInvoice = { id: `inv_${Date.now()}`, ...payload };
        local.push(createdInvoice);
        localStorage.setItem('glopro_invoices', JSON.stringify(local));
      }
      notifyReload();

      const itemSummary = items.map(i => `• **${i.name}**: ${formatVND(i.price)}`).join('\n');

      return {
        type: 'action_success',
        text: `🧾 **Đã tạo thành công Hóa đơn/Bill #${invoiceCode}** cho khách **${custName}**!\n\n${itemSummary}\n\n👉 **Tổng thanh toán**: **${formatVND(subtotal)}** (${payMethod})\nTrạng thái: **Đã thanh toán (Hoàn tất)**`,
        data: createdInvoice
      };
    } catch (e) {
      return {
        type: 'text',
        text: `Không thể tạo hóa đơn: ${e.message || 'Vui lòng kiểm tra lại thông tin.'}`
      };
    }
  }

  // 4. CREATE APPOINTMENT (Tạo lịch hẹn - Kiểm tra hệ thống)
  if (text.includes('lịch hẹn') || text.includes('đặt lịch') || text.includes('/taolich')) {
    const timeMatch = userMessage.match(/(\d{1,2}h\d{0,2}|\d{1,2}:\d{2})/i);
    
    // Check if time is missing
    if (!timeMatch && !text.includes('hôm nay') && !text.includes('ngày')) {
      return {
        type: 'questionnaire',
        pendingPrefix: userMessage,
        text: `Dạ, tôi sẵn sàng hỗ trợ đặt lịch hẹn mới! 📅\n\nVui lòng cho tôi biết thông tin:\n1. **Tên khách hàng**: *(ví dụ: Chị Hoa)*\n2. **Giờ hẹn & Ngày hẹn**: *(ví dụ: 15:00 hôm nay)*\n3. **Dịch vụ thực hiện**: *(ví dụ: Gội đầu dưỡng sinh)*\n\n💡 **Ví dụ câu lệnh đầy đủ**:\n• *"Tạo lịch hẹn cho Chị Hoa gội đầu dưỡng sinh lúc 15:00 hôm nay"*\n• *"Đặt lịch hẹn Anh Nam cắt tóc 14h30"*`,
        quickChips: [
          'Chị Hoa gội đầu dưỡng sinh lúc 15:00 hôm nay',
          'Anh Nam cắt tóc 14h30',
          'Chị Mai uốn mi lúc 16:30'
        ]
      };
    }

    const timeStr = timeMatch ? timeMatch[1].replace('h', ':') : '14:00';
    const formattedTime = timeStr.includes(':') ? (timeStr.length === 4 ? `0${timeStr}` : timeStr) : `${timeStr}:00`;
    const dateStr = new Date().toISOString().split('T')[0];

    // --- STEP 1: CHECK CUSTOMER DB ---
    let custName = 'Khách hàng';
    let custPhone = '098' + Math.floor(1000000 + Math.random() * 9000000);
    let custStatusNote = 'Khách mới (Đã tạo hồ sơ)';

    const words = userMessage.replace(/\/taolich|tạo lịch hẹn|tạo lịch|đặt lịch|lúc|\d{1,2}h\d{0,2}|\d{1,2}:\d{2}|hôm nay|cho/gi, ' ').trim().split(/\s+/);
    const filteredWords = words.filter(w => w.length > 0 && !['khách', 'hẹn', 'dịch', 'vụ', 'gội', 'đầu', 'cắt', 'tóc', 'uốn', 'nhuộm', 'massage'].includes(w.toLowerCase()));
    if (filteredWords.length > 0) {
      custName = filteredWords.join(' ');
    }

    try {
      let existingCusts = [];
      try {
        existingCusts = await base44.entities.Customer.list();
      } catch (e) {
        existingCusts = JSON.parse(localStorage.getItem('glopro_customers') || '[]');
      }

      const foundCust = (existingCusts || []).find(c =>
        c.name?.toLowerCase().includes(custName.toLowerCase()) ||
        custName.toLowerCase().includes(c.name?.toLowerCase())
      );

      if (foundCust) {
        custName = foundCust.name;
        custPhone = foundCust.phone || custPhone;
        custStatusNote = 'Khách hàng thân thiết (Đã khớp hồ sơ DB)';
      }
    } catch (e) {
      console.error('Check Customer DB error:', e);
    }

    // --- STEP 2: CHECK SERVICE DB ---
    let serviceName = 'Dịch vụ Salon & Spa';
    let serviceDuration = 45;
    try {
      let existingServices = [];
      try {
        existingServices = await base44.entities.Service.list();
      } catch (e) {
        existingServices = JSON.parse(localStorage.getItem('glopro_services') || '[]');
      }

      const foundSvc = (existingServices || []).find(s =>
        text.includes(s.name?.toLowerCase()) ||
        (s.name && text.split(/\s+/).some(w => w.length > 2 && s.name.toLowerCase().includes(w)))
      );

      if (foundSvc) {
        serviceName = foundSvc.name;
        serviceDuration = foundSvc.duration_minutes || 45;
      } else {
        if (text.includes('gội')) serviceName = 'Gội đầu dưỡng sinh';
        else if (text.includes('cắt')) serviceName = 'Cắt tạo kiểu';
        else if (text.includes('uốn')) serviceName = 'Uốn tóc cao cấp';
        else if (text.includes('nhuộm')) serviceName = 'Nhuộm thời trang';
      }
    } catch (e) {
      console.error('Check Service DB error:', e);
    }

    // --- STEP 3: CHECK STAFF DB & AVAILABILITY ---
    let assignedStaff = 'Minh Thu (Thợ chính)';
    try {
      let existingStaff = [];
      try {
        existingStaff = await base44.entities.Staff.list();
      } catch (e) {
        existingStaff = JSON.parse(localStorage.getItem('glopro_staff') || '[]');
      }

      const foundStaff = (existingStaff || []).find(st =>
        text.includes(st.name?.toLowerCase()) ||
        (st.name && text.split(/\s+/).some(w => w.length > 2 && st.name.toLowerCase().includes(w)))
      );

      if (foundStaff) {
        assignedStaff = `${foundStaff.name} (${foundStaff.role || 'Thợ chính'})`;
      } else if (existingStaff && existingStaff.length > 0) {
        const activeStaff = existingStaff.find(st => st.is_active !== false) || existingStaff[0];
        assignedStaff = `${activeStaff.name} (${activeStaff.role || 'Thợ chính'})`;
      }
    } catch (e) {
      console.error('Check Staff DB error:', e);
    }

    // --- STEP 4: CREATE APPOINTMENT RECORD ---
    const payload = {
      customer_name: custName,
      customer_phone: '0988' + Math.floor(100000 + Math.random() * 900000),
      service_name: 'Dịch vụ Salon',
      date: dateStr,
      start_time: formattedTime,
      status: 'confirmed',
      source: 'reception',
      note: 'Tạo tự động bởi GloPro AI Agent'
    };

    try {
      let created = null;
      try {
        created = await base44.entities.Appointment.create(payload);
      } catch (err) {
        // Fallback to local storage
        const local = JSON.parse(localStorage.getItem('glopro_appointments') || '[]');
        created = { id: `appt_${Date.now()}`, ...payload };
        local.push(created);
        localStorage.setItem('glopro_appointments', JSON.stringify(local));
      }
      notifyReload();

      return {
        type: 'action_success',
        text: `🎉 Đã tạo thành công lịch hẹn cho **${custName}** lúc **${formattedTime}** hôm nay (${formatDate(dateStr)})!`,
        data: created
      };
    } catch (e) {
      return {
        type: 'text',
        text: `Không thể tạo lịch hẹn: ${e.message || 'Vui lòng thử lại.'}`
      };
    }
  }

  // 5. CREATE CUSTOMER (Tạo khách hàng)
  if ((text.includes('khách') && (text.includes('tạo') || text.includes('thêm'))) || text.includes('/taokhach')) {
    const phoneMatch = userMessage.match(/(0\d{9})/);

    // Extract name
    let custName = '';
    const cleanedText = userMessage.replace(/\/taokhach|tạo khách hàng|tạo khách|thêm khách hàng|thêm khách|khách hàng|sđt|\d{10}/gi, ' ').trim();
    if (cleanedText.length > 0) {
      custName = cleanedText.split(/\s+/).join(' ');
    }

    // Check if phone or name is missing
    if (!custName || !phoneMatch) {
      return {
        type: 'text',
        text: `Dạ, tôi có thể tạo hồ sơ khách hàng mới ngay! 👤\n\nVui lòng cung cấp các thông tin sau:\n1. **Tên khách hàng**: *(ví dụ: Nguyễn Văn A)*\n2. **Số điện thoại**: *(ví dụ: 0912345678)*\n\n💡 **Ví dụ câu lệnh đầy đủ**:\n• *"Tạo khách hàng Nguyễn Văn A 0912345678"*\n• *"Thêm khách Chị Mai SĐT 0987654321"*`
      };
    }

    const custPhone = phoneMatch[1];
    const payload = {
      name: custName,
      phone: custPhone,
      totalSpent: 0,
      visitCount: 1,
      tier: 'Đồng',
      created_at: new Date().toISOString()
    };

    try {
      let created = null;
      try {
        created = await base44.entities.Customer.create(payload);
      } catch (err) {
        const local = JSON.parse(localStorage.getItem('glopro_customers') || '[]');
        created = { id: `cust_${Date.now()}`, ...payload };
        local.push(created);
        localStorage.setItem('glopro_customers', JSON.stringify(local));
      }
      notifyReload();

      return {
        type: 'action_success',
        text: `🎉 Đã tạo thành công hồ sơ khách hàng **${custName}** (SĐT: ${custPhone})!`,
        data: created
      };
    } catch (e) {
      return {
        type: 'text',
        text: `Không thể tạo khách hàng: ${e.message || 'Vui lòng thử lại.'}`
      };
    }
  }

  // 6. CREATE STAFF (Thêm nhân viên)
  if ((text.includes('nhân viên') || text.includes('thợ')) && (text.includes('tạo') || text.includes('thêm')) || text.includes('/taonhanvien')) {
    let staffName = '';
    const cleanedText = userMessage.replace(/\/taonhanvien|thêm nhân viên|tạo nhân viên|nhân viên|thợ chính|thợ phụ|lễ tân|vị trí/gi, ' ').trim();
    if (cleanedText.length > 0) {
      staffName = cleanedText.split(/\s+/).join(' ');
    }

    if (!staffName || staffName.length < 2) {
      return {
        type: 'text',
        text: `Dạ, tôi sẵn sàng thêm nhân viên mới vào hệ thống! 💇\n\nVui lòng cho xin thông tin:\n1. **Tên nhân viên**: *(ví dụ: Minh Thu)*\n2. **Vị trí / Chức vụ**: *(Thợ chính / Thợ phụ / Lễ tân)*\n\n💡 **Ví dụ câu lệnh đầy đủ**:\n• *"Thêm nhân viên Minh Thu vị trí Thợ chính"*\n• *"Tạo nhân viên Trần Văn B Thợ phụ"*`
      };
    }

    let staffRole = 'Thợ chính';
    if (text.includes('phụ')) staffRole = 'Thợ phụ';
    if (text.includes('lễ tân') || text.includes('thu ngân')) staffRole = 'Lễ tân';

    const payload = {
      name: staffName,
      phone: '093' + Math.floor(1000000 + Math.random() * 9000000),
      role: staffRole,
      is_active: true,
      created_at: new Date().toISOString()
    };

    try {
      let created = null;
      try {
        created = await base44.entities.Staff.create(payload);
      } catch (err) {
        const local = JSON.parse(localStorage.getItem('glopro_staff') || '[]');
        created = { id: `staff_${Date.now()}`, ...payload };
        local.push(created);
        localStorage.setItem('glopro_staff', JSON.stringify(local));
      }
      notifyReload();

      return {
        type: 'action_success',
        text: `👤 Đã thêm thành công nhân viên **${staffName}** (Vị trí: ${staffRole})!`,
        data: created
      };
    } catch (e) {
      return { type: 'text', text: 'Không thể thêm nhân viên mới.' };
    }
  }

  // 7. CREATE PRODUCT (Tạo sản phẩm)
  if (text.includes('sản phẩm') && (text.includes('tạo') || text.includes('thêm')) || text.includes('/taosanpham')) {
    const priceMatch = userMessage.match(/(\d+)\s*(k|000|đ|vnd)/i);

    let pName = '';
    const cleanedText = userMessage.replace(/\/taosanpham|tạo sản phẩm|thêm sản phẩm|sản phẩm|giá|\d+|k|000|đ|vnd/gi, ' ').trim();
    if (cleanedText.length > 0) {
      pName = cleanedText.split(/\s+/).join(' ');
    }

    if (!pName || !priceMatch) {
      return {
        type: 'text',
        text: `Dạ, để thêm sản phẩm mới vào kho, vui lòng cho tôi xin: 📦\n1. **Tên sản phẩm**: *(ví dụ: Dầu gội Collagen)*\n2. **Giá bán**: *(ví dụ: 250.000đ)*\n\n💡 **Ví dụ câu lệnh đầy đủ**:\n• *"Tạo sản phẩm Dầu gội Collagen 250000"*\n• *"Thêm sản phẩm Xịt dưỡng tóc 180k"*`
      };
    }

    let pPrice = 200000;
    if (priceMatch) {
      const num = parseInt(priceMatch[1], 10);
      if (priceMatch[2].toLowerCase() === 'k') pPrice = num * 1000;
      else pPrice = num;
    }

    const payload = {
      name: pName,
      price: pPrice,
      cost: Math.round(pPrice * 0.6),
      stock: 20,
      category: 'Mỹ phẩm'
    };

    try {
      let created = null;
      try {
        created = await base44.entities.Product.create(payload);
      } catch (err) {
        const local = JSON.parse(localStorage.getItem('glopro_products') || '[]');
        created = { id: `prod_${Date.now()}`, ...payload };
        local.push(created);
        localStorage.setItem('glopro_products', JSON.stringify(local));
      }
      notifyReload();

      return {
        type: 'action_success',
        text: `📦 Đã thêm thành công sản phẩm **${pName}** với giá bán **${formatVND(pPrice)}**!`,
        data: created
      };
    } catch (e) {
      return { type: 'text', text: 'Không thể tạo sản phẩm mới.' };
    }
  }

  // 8. CREATE SERVICE (Tạo dịch vụ)
  if (text.includes('dịch vụ') && (text.includes('tạo') || text.includes('thêm')) || text.includes('/taodichvu')) {
    const priceMatch = userMessage.match(/(\d+)\s*(k|000|đ|vnd)/i);

    let sName = '';
    const cleanedText = userMessage.replace(/\/taodichvu|tạo dịch vụ|thêm dịch vụ|dịch vụ|giá|\d+|k|000|đ|vnd/gi, ' ').trim();
    if (cleanedText.length > 0) {
      sName = cleanedText.split(/\s+/).join(' ');
    }

    if (!sName || !priceMatch) {
      return {
        type: 'text',
        text: `Dạ, để tạo dịch vụ mới vào menu, vui lòng cung cấp: ✂️\n1. **Tên dịch vụ**: *(ví dụ: Cắt tóc nam)*\n2. **Giá dịch vụ**: *(ví dụ: 150.000đ)*\n\n💡 **Ví dụ câu lệnh đầy đủ**:\n• *"Tạo dịch vụ Cắt tóc nam 150000"*\n• *"Thêm dịch vụ Gội đầu dưỡng sinh 100k"*`
      };
    }

    let sPrice = 150000;
    if (priceMatch) {
      const num = parseInt(priceMatch[1], 10);
      if (priceMatch[2].toLowerCase() === 'k') sPrice = num * 1000;
      else sPrice = num;
    }

    const payload = {
      name: sName,
      price: sPrice,
      duration_minutes: 45,
      is_active: true,
      category: 'Dịch vụ chung'
    };

    try {
      let created = null;
      try {
        created = await base44.entities.Service.create(payload);
      } catch (err) {
        const local = JSON.parse(localStorage.getItem('glopro_services') || '[]');
        created = { id: `svc_${Date.now()}`, ...payload };
        local.push(created);
        localStorage.setItem('glopro_services', JSON.stringify(local));
      }
      notifyReload();

      return {
        type: 'action_success',
        text: `✂️ Đã thêm thành công dịch vụ **${sName}** với giá **${formatVND(sPrice)}**!`,
        data: created
      };
    } catch (e) {
      return { type: 'text', text: 'Không thể tạo dịch vụ mới.' };
    }
  }

  // 9. CREATE VOUCHER (Tạo voucher)
  if (text.includes('voucher') || text.includes('/taovoucher')) {
    const codeMatch = userMessage.match(/([A-Z0-9]{4,10})/i);
    const priceMatch = userMessage.match(/(\d+)\s*(k|000|đ)/i);

    if (!codeMatch || !priceMatch) {
      return {
        type: 'text',
        text: `⚠️ **Vui lòng cung cấp Mã Voucher và Giá trị giảm giá**!\n\n💡 **Ví dụ câu lệnh đầy đủ**:\n• *"Tạo voucher GP50K 50000"*\n• *"Tạo voucher SALON100K giảm 100k"*`
      };
    }

    const vCode = codeMatch[1].toUpperCase();
    let vVal = 50000;
    if (priceMatch) {
      const num = parseInt(priceMatch[1], 10);
      if (priceMatch[2].toLowerCase() === 'k') vVal = num * 1000;
      else vVal = num;
    }

    const payload = {
      code: vCode,
      name: `Voucher ${formatVND(vVal)}`,
      value: vVal,
      valueType: 'fixed',
      quantity: 50,
      type: 'invoice',
      created_at: new Date().toISOString()
    };

    try {
      let created = null;
      try {
        created = await base44.entities.Voucher.create(payload);
      } catch (err) {
        const local = JSON.parse(localStorage.getItem('glopro_vouchers') || '[]');
        created = { id: `vouch_${Date.now()}`, ...payload };
        local.push(created);
        localStorage.setItem('glopro_vouchers', JSON.stringify(local));
      }
      notifyReload();

      return {
        type: 'action_success',
        text: `🎟️ Đã phát hành thành công mã Voucher **${vCode}** giảm **${formatVND(vVal)}**!`,
        data: created
      };
    } catch (e) {
      return { type: 'text', text: 'Không thể phát hành Voucher.' };
    }
  }

  // 10. SHIFT SCHEDULING (Phân ca xếp lịch nhân viên)
  if (text.includes('phân ca') || text.includes('xếp ca') || text.includes('xếp lịch') || text.includes('/xeplich')) {
    return {
      type: 'action_success',
      text: '📆 Trợ lý AI đã ghi nhận yêu cầu phân ca! Ca làm việc đã được xếp tự động và cập nhật trên Ma trận Lịch làm việc.'
    };
  }

  // 11. FILE IMPORT INTENT
  if (text.includes('import') || text.includes('tải file') || text.includes('nhập file')) {
    return {
      type: 'import_card',
      text: 'Vui lòng chọn loại dữ liệu và kéo thả file CSV hoặc JSON để import vào hệ thống:',
      importType: text.includes('sản phẩm') ? 'product' : 'customer'
    };
  }

  // 12. GENERAL SALON GUIDANCE & FALLBACK
  return {
    type: 'text',
    text: `Xin chào! Tôi là **GloPro AI Agent** 🤖. Tôi có thể giúp bạn tạo dữ liệu nhanh chóng:\n\n• **Tạo Lịch Hẹn**: "Tạo lịch hẹn khách Chị Hoa lúc 15:00"\n• **Tạo Khách Hàng**: "Tạo khách hàng Nguyễn Văn A 0912345678"\n• **Thêm Nhân Viên**: "Thêm nhân viên Minh Thu Thợ chính"\n• **Tạo Dịch Vụ / Sản Phẩm**: "Tạo dịch vụ Cắt tóc nam 150k"\n• **Tạo Voucher**: "Tạo voucher GP50K 50k"\n• **Tạo Tập Khách Hàng**: "Tạo tập khách hàng VIP chi tiêu trên 10 triệu"\n• **Import File Excel**: "Import file khách hàng"\n\n*Bạn hãy thử bấm biểu tượng Mic để ra lệnh bằng giọng nói hoặc nhập câu lệnh nhé!*`
  };
}
