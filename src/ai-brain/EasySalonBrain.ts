/**
 * EasySalon Business Brain (Master AI Coordinator)
 * 
 * Orchestrates the full pipeline:
 * USER REQUEST
 *   ↓
 * UNDERSTAND INTENT
 *   ↓
 * EXTRACT INFORMATION
 *   ↓
 * CHECK REQUIRED INFORMATION
 *   ↓
 * CHECK AMBIGUITY (Ambiguity Gate)
 *   ↓
 * IF MISSING → ASK USER (Clarification)
 * IF MULTIPLE MATCH → ASK USER TO CHOOSE
 * IF COMPLETE → PREPARE ACTION / ANSWER
 */

import { IntentType, IStructuredIntent, IBrainDecision, IEntitySlot } from './intent/IntentTypes';
import { parseVietnameseDateTime } from './intent/DateTimeParser';
import { EntityResolver } from './intent/EntityResolver';
import { AmbiguityGate } from './intent/AmbiguityGate';

export function parseCustomerProfile(text: string): {
  name: string | null;
  phone: string | null;
  email: string | null;
  birthday: string | null;
  gender: string | null;
  address: string | null;
  note: string | null;
} {
  // 1. Phone (10 digits starting with 0)
  const phoneMatch = text.match(/(0\d{9})/);
  const phone = phoneMatch ? phoneMatch[1] : null;

  // 2. Email
  const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  const email = emailMatch ? emailMatch[1] : null;

  // 3. Birthday / DoB (e.g. 23/04/1999, 1999-04-23, sinh ngày 23/04/1999)
  const dobMatch = text.match(/(?:sinh ngày|ngày sinh|năm sinh|sinh|sn)\s*[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}|\d{4})/i);
  let birthday = dobMatch ? dobMatch[1] : null;
  if (!birthday) {
    const rawDateMatch = text.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
    if (rawDateMatch) birthday = rawDateMatch[1];
  }

  // 4. Gender
  let gender: string | null = null;
  if (/giới\s*tính\s*[:\s]*(?:nam|trai)/i.test(text) || /\bgiới tính nam\b/i.test(text) || /\bnam\b/i.test(text)) {
    gender = 'male';
  } else if (/giới\s*tính\s*[:\s]*(?:nữ|gái)/i.test(text) || /\bgiới tính nữ\b/i.test(text) || /\bnữ\b/i.test(text)) {
    gender = 'female';
  }

  // 5. Note
  const noteMatch = text.match(/(?:ghi chú|lưu ý|note)\s*[:\s]*(.+)$/i);
  const note = noteMatch ? noteMatch[1].trim() : null;

  // 6. Address
  const addrMatch = text.match(/(?:địa chỉ|ở tại|quê quán|đ\/c)\s*[:\s]*([^,;]+(?:,[^,;]+)*?)(?=(?:,\s*(?:ghi chú|sđt|email|giới tính|sinh ngày|$))|$)/i);
  const address = addrMatch ? addrMatch[1].trim() : null;

  // 7. Name
  let name: string | null = null;
  const firstCommaIdx = text.indexOf(',');
  if (firstCommaIdx > 0) {
    const candidate = text.substring(0, firstCommaIdx)
      .replace(/^(?:tạo|thêm|đăng ký)\s+(?:khách\s*hàng|khách)?(?:\s+mới)?\s*/i, '')
      .replace(/^(?:anh|chị|em|bác|cô|chú)\s+/i, '')
      .trim();
    if (candidate.length >= 2 && !/\d/.test(candidate)) {
      name = candidate;
    }
  }

  if (!name) {
    const nameMatch = text.match(/(?:tên|họ tên|khách\s*hàng|khách)\s*[:\s]*([A-ZÀ-Ỹa-zà-ỹ\s]+?)(?=[,;\n]|sđt|số|0\d|$)/i);
    if (nameMatch) {
      name = nameMatch[1].trim();
    }
  }

  if (!name) {
    const stripped = text
      .replace(/^(?:tạo|thêm|đăng ký)\s+(?:khách\s*hàng|khách)?(?:\s+mới)?\s*/i, '')
      .replace(/0\d{9}/g, '')
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '')
      .replace(/(?:sinh ngày|ngày sinh|năm sinh|sinh|sn)\s*[:\s]*\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}/gi, '')
      .replace(/(?:giới tính|nam|nữ)/gi, '')
      .replace(/(?:địa chỉ|ở tại|đ\/c)\s*[:\s]*[^,;]+/gi, '')
      .replace(/(?:ghi chú|lưu ý|note)\s*[:\s]*.+$/gi, '')
      .replace(/[,;:]/g, ' ')
      .trim();
    const words = stripped.split(/\s+/).filter(w => w.length > 0);
    if (words.length >= 2 && words.length <= 5) {
      name = words.join(' ');
    }
  }

  return { name, phone, email, birthday, gender, address, note };
}

export class EasySalonBrain {
  /**
   * Main entry point to process a user request through the Business Brain
   */
  static processRequest(
    query: string,
    context: any = {},
    history: Array<{ role: string; content: string }> = []
  ): IBrainDecision {
    const text = query.trim();
    const lower = text.toLowerCase();

    // 1. INTENT DETECTION
    const detectedIntent = this.detectIntent(lower, context, history);

    // 2. EXTRACT ENTITIES
    const entities: Record<string, IEntitySlot> = {};

    // A. Parse Date & Time
    const parsedDt = parseVietnameseDateTime(text);
    if (parsedDt.date) {
      entities.date = {
        value: parsedDt.date.value,
        rawText: parsedDt.date.raw,
        resolved: parsedDt.date.resolved
      };
    }
    if (parsedDt.time) {
      entities.time = {
        value: parsedDt.time.value,
        rawText: parsedDt.time.raw,
        resolved: parsedDt.time.isExact,
        isRange: parsedDt.time.isRange,
        rangeLabel: parsedDt.time.rangeLabel
      };
    }

    // B. Parse Customer / Person
    const customerRes = EntityResolver.resolveCustomer(text, context, history);
    if (customerRes.resolved) {
      entities.customer = {
        value: customerRes.value,
        rawText: customerRes.value || '',
        resolved: true,
        metadata: { id: customerRes.id, source: customerRes.source }
      };
    } else if (/\b(khách này|anh này|chị này|ông này|anh ấy|chị ấy)\b/i.test(lower)) {
      entities.customer = {
        value: null,
        rawText: 'khách này',
        resolved: false
      };
    }

    // C. Parse Staff / Employee
    const staffRes = EntityResolver.resolveStaff(text);
    if (staffRes.resolved) {
      entities.staff = {
        value: staffRes.value,
        rawText: staffRes.value || '',
        resolved: true
      };
    }

    // D. Parse Service (Order compound terms before substrings)
    const serviceMatch = text.match(/(?:cắt tóc nữ|cắt tóc nam|cắt tóc|gội đầu dưỡng sinh|gội đầu|nhuộm tóc|nhuộm|uốn tóc|làm nail|chăm sóc da|tẩy tế bào chết|massage|\buốn\b)/i);
    if (serviceMatch) {
      entities.service = {
        value: serviceMatch[0],
        rawText: serviceMatch[0],
        resolved: true
      };
    }

    // E. Parse Phone & Amount
    const phoneMatch = text.match(/(0\d{9})/);
    if (phoneMatch) {
      entities.phone = {
        value: phoneMatch[1],
        rawText: phoneMatch[1],
        resolved: true
      };
    }

    const amountMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:nghìn|k|triệu|tr|đ|vnd|đồng)/i);
    if (amountMatch) {
      let multiplier = 1000;
      if (lower.includes('triệu') || lower.includes('tr')) multiplier = 1000000;
      const num = parseFloat(amountMatch[1].replace(',', '.'));
      const totalAmount = num * multiplier;
      entities.amount = {
        value: totalAmount,
        rawText: amountMatch[0],
        resolved: true
      };
    }
    // F. Customer Creation Entities
    if (detectedIntent === 'CREATE_CUSTOMER') {
      const profile = parseCustomerProfile(text);
      if (profile.name) {
        entities.name = {
          value: profile.name,
          rawText: profile.name,
          resolved: true
        };
      }
      if (profile.phone) {
        entities.phone = {
          value: profile.phone,
          rawText: profile.phone,
          resolved: true
        };
      }
      if (profile.email) {
        entities.email = {
          value: profile.email,
          rawText: profile.email,
          resolved: true
        };
      }
      if (profile.birthday) {
        entities.birthday = {
          value: profile.birthday,
          rawText: profile.birthday,
          resolved: true
        };
      }
      if (profile.gender) {
        entities.gender = {
          value: profile.gender,
          rawText: profile.gender,
          resolved: true
        };
      }
      if (profile.address) {
        entities.address = {
          value: profile.address,
          rawText: profile.address,
          resolved: true
        };
      }
      if (profile.note) {
        entities.note = {
          value: profile.note,
          rawText: profile.note,
          resolved: true
        };
      }
    }

    // G. Parse Product & Quantity for Stock Operations
    if (detectedIntent === 'RECEIVE_STOCK' || detectedIntent === 'ADJUST_STOCK' || detectedIntent === 'SEARCH_PRODUCT') {
      const qtyMatch = text.match(/(\d+)\s*(?:chai|hộp|tuýp|lọ|thùng|cái|bộ|gói|sp|sản\s+phẩm)/i);
      if (qtyMatch) {
        entities.quantity = {
          value: parseInt(qtyMatch[1], 10),
          rawText: qtyMatch[0],
          resolved: true
        };
      }
      const prodMatch = text.match(/(?:nhập\s+(?:kho\s+)?(?:hàng\s+)?|\d+\s*(?:chai|hộp|tuýp|lọ|thùng|cái|bộ|gói|sp|sản\s+phẩm)\s+)([A-ZÀ-Ỹa-zà-ỹ0-9\s]+?)(?:\s+(?:giá|từ|với|tồn|\d|$))/i);
      if (prodMatch && prodMatch[1].trim()) {
        let pName = prodMatch[1].replace(/^\d+\s*(?:chai|hộp|tuýp|lọ|thùng|cái|bộ|gói|sp|sản\s+phẩm)\s*/i, '').trim();
        if (pName.length >= 2) {
          entities.product = {
            value: pName,
            rawText: pName,
            resolved: true
          };
        }
      }
    }

    // 3. BUILD STRUCTURED INTENT
    const structuredIntent: IStructuredIntent = {
      intent: detectedIntent,
      confidence: 0.95,
      entities,
      missingRequired: [],
      ambiguities: [],
      needsClarification: false
    };

    // 4. RUN THROUGH AMBIGUITY GATE
    return AmbiguityGate.evaluate(structuredIntent);
  }

  /**
   * Distinguishes user intent accurately based on domain semantics
   */
  private static detectIntent(lower: string, context: any, history: Array<{ role: string; content: string }> = []): IntentType {
    // 0. UNSUPPORTED SALON DOMAINS (Shift management, password change, bulk export)
    if (
      lower.includes('làm ca') || 
      lower.includes('xếp ca') || 
      lower.includes('đổi ca') || 
      lower.includes('ca sáng') || 
      lower.includes('ca chiều') || 
      lower.includes('đổi mật khẩu') ||
      lower.includes('xuất file')
    ) {
      return 'UNSUPPORTED';
    }

    // 0. POST-CHECKOUT TIP (e.g., "Hóa đơn đã thanh toán rồi, giờ khách tip thêm...")
    if (
      (lower.includes('đã thanh toán') || lower.includes('thanh toán rồi')) &&
      (lower.includes('tip thêm') || lower.includes('bo thêm') || lower.includes('tiền tip') || lower.includes('tiền bo'))
    ) {
      return 'TIP_OPERATION';
    }

    // 0. CHECKOUT WITH TIP INCLUDED (e.g., "thanh toán gộp cả tiền tip qua qr", "thanh toán tiền tip")
    if (
      (lower.includes('thanh toán') || lower.includes('chốt bill') || lower.includes('chốt hóa đơn')) &&
      (lower.includes('gộp') || lower.includes('qr') || lower.includes('tiền mặt') || lower.includes('chuyển khoản'))
    ) {
      return 'CHECKOUT_INVOICE';
    }

    // 0. SOFTWARE GUIDANCE & HOW-TO QUESTIONS (e.g. "Làm sao để đặt lịch", "Cách chia hoa hồng cho thợ")
    if (
      /^(?:làm sao|làm thế nào|cách|hướng dẫn|chỉ tôi|tạo ở đâu|xem ở đâu|như thế nào)\b/i.test(lower) ||
      lower.includes('hướng dẫn sử dụng') ||
      lower.includes('cách sử dụng') ||
      lower.includes('chỉ cách') ||
      lower.includes('hướng dẫn cách')
    ) {
      return 'SOFTWARE_GUIDE';
    }

    // 0. STAFF REVENUE INQUIRY WITH TIP QUESTION (e.g. "Doanh thu thợ Nam hôm nay có tính tiền tip không?")
    if (
      lower.includes('doanh thu') &&
      (lower.includes('thợ') || lower.includes('nhân viên')) &&
      (lower.includes('tiền tip') || lower.includes('tiền bo')) &&
      (lower.includes('có tính') || lower.includes('không') || lower.includes('hông'))
    ) {
      return 'QUERY_STAFF_REVENUE';
    }

    // 0. GENERAL SALON REVENUE TIP INQUIRY (e.g. "doanh thu có tính tiền bo", "doanh thu bữa nay có tính tiền tip")
    if (
      (lower.includes('tiền bo') || lower.includes('tiền tip') || lower.includes('tiền boa') || lower.includes('bồi dưỡng')) &&
      (lower.includes('có tính') || lower.includes('hông') || lower.includes('không') || lower.includes('thu hộ'))
    ) {
      return 'TIP_OPERATION';
    }

    // 0. REVENUE ACCOUNTING QUESTIONS (Check before TIP_OPERATION so questions like "Doanh thu có tính tip không?" aren't treated as TIP_OPERATION)
    if (
      lower.includes('doanh thu salon là') || 
      (lower.includes('doanh thu') && (lower.includes('đúng không') || lower.includes('có tính') || lower.includes('1tr2') || lower.includes('thuần')))
    ) {
      if ((lower.includes('thợ') || lower.includes('nhân viên') || lower.includes('của')) && !lower.includes('của tiệm') && !lower.includes('của salon') && !lower.includes('của quán')) {
        return 'QUERY_STAFF_REVENUE';
      }
      return 'QUERY_REVENUE';
    }

    // 1. PAYROLL (Lương, thưởng, hoa hồng, thực nhận của nhân viên)
    if (
      lower.includes('bảng lương') || 
      lower.includes('lương của') || 
      lower.includes('lương') || 
      lower.includes('thưởng') ||
      lower.includes('hoa hồng') || 
      lower.includes('thực nhận') || 
      (lower.includes('nhận bao nhiêu tiền') && (lower.includes('tháng') || lower.includes('lương') || lower.includes('nhận') || lower.includes('nhân viên') || lower.includes('thợ'))) ||
      /tháng này .* nhận bao nhiêu/i.test(lower)
    ) {
      return 'QUERY_PAYROLL';
    }

    // 2. TIP OPERATION (Tiền tip thu hộ nhân viên, KHÔNG PHẢI doanh thu salon)
    if (
      lower.includes('tip') || 
      lower.includes('tiền bồi dưỡng') || 
      lower.includes('bo cho') || 
      lower.includes('tiền bo') ||
      lower.includes('boa') ||
      /\b(?:bo|boa|tip|bồi dưỡng)\b/i.test(lower)
    ) {
      return 'TIP_OPERATION';
    }

    // 3. INVENTORY (RECEIVE vs READ vs GENERAL PRODUCT)
    if (
      lower.includes('nhập kho') || 
      lower.includes('nhập hàng') || 
      lower.includes('nhập thêm') || 
      lower.includes('chỉnh tồn kho') || 
      lower.includes('điều chỉnh tồn')
    ) {
      return 'RECEIVE_STOCK';
    }

    if (
      lower.includes('kho còn') ||
      lower.includes('kiểm tra tồn kho') ||
      lower.includes('tồn kho') ||
      lower.includes('còn bao nhiêu chai') ||
      lower.includes('còn bao nhiêu lọ') ||
      lower.includes('còn bao nhiêu hộp') ||
      lower.includes('kho chi nhánh') ||
      lower.includes('hết hàng chưa') ||
      lower.includes('cảnh báo hết hàng')
    ) {
      return 'READ_STOCK';
    }

    if (
      lower.includes('sản phẩm') || 
      lower.includes('kho hàng') || 
      lower.includes('mỹ phẩm') ||
      lower.includes('dầu gội') ||
      lower.includes('dầu xả') ||
      lower.includes('serum') ||
      lower.includes('chai') ||
      lower.includes('lọ')
    ) {
      return 'SEARCH_PRODUCT';
    }

    // 4. CASHIER & INVOICE / PAYMENT
    if (
      lower.includes('thanh toán bill') &&
      (lower.includes('nhuộm') || lower.includes('cắt') || lower.includes('uốn') || lower.includes('nail') || lower.includes('massage') || lower.includes('gội'))
    ) {
      return 'CREATE_INVOICE';
    }

    if (
      lower.includes('thanh toán') || 
      lower.includes('trả tiền') || 
      lower.includes('trả thẻ') ||
      lower.includes('quét qr') ||
      lower.includes('chốt bill') || 
      lower.includes('chốt hóa đơn')
    ) {
      return 'CHECKOUT_INVOICE';
    }

    if (
      lower.includes('tạo bill') || 
      lower.includes('tạo hóa đơn') || 
      lower.includes('lập hóa đơn') || 
      lower.includes('lập bill') ||
      lower.includes('lên bill') ||
      lower.includes('hóa đơn mới') ||
      lower.includes('in hóa đơn') ||
      lower.includes('tạo lại bill') ||
      (lower.includes('chuyển khoản') && lower.includes('hóa đơn')) ||
      (lower.includes('hóa đơn') && (lower.includes('đưa') || lower.includes('khách'))) ||
      (lower.includes('bill') && (lower.includes('cho chị') || lower.includes('cho anh') || lower.includes('làm') || lower.includes('cắt') || lower.includes('gội') || lower.includes('nhuộm') || lower.includes('uốn') || lower.includes('nail') || lower.includes('massage')))
    ) {
      return 'CREATE_INVOICE';
    }

    // 5. STAFF SHIFTS & SCHEDULE
    if (
      lower.includes('lịch làm việc') || 
      lower.includes('ca làm') || 
      lower.includes('lịch làm của')
    ) {
      return 'SEARCH_STAFF';
    }

    // 6. REVENUE QUERY (STAFF vs SALON)
    if (
      lower.includes('làm được bao nhiêu tiền') ||
      (lower.includes('doanh số') && (lower.includes('thợ') || lower.includes('nhân viên') || lower.includes('cao nhất')))
    ) {
      if (lower.includes('salon') || lower.includes('tiệm') || lower.includes('quán')) {
        return 'QUERY_REVENUE';
      }
      return 'QUERY_STAFF_REVENUE';
    }

    if (lower.includes('doanh thu') || lower.includes('doanh số') || lower.includes('lời bao nhiêu')) {
      if ((lower.includes('của') || lower.includes('nhân viên') || lower.includes('thợ')) && !lower.includes('của tiệm') && !lower.includes('của salon') && !lower.includes('của quán')) {
        return 'QUERY_STAFF_REVENUE';
      }
      return 'QUERY_REVENUE';
    }

    if (
      lower.includes('tiền hôm nay') ||
      lower.includes('tiền bán') ||
      lower.includes('thu được bao nhiêu tiền') ||
      lower.includes('tiền mặt trong két') ||
      (lower.includes('bán được') && !lower.includes('chai') && !lower.includes('hộp') && !lower.includes('lọ')) ||
      lower.includes('chạy nhất') ||
      lower.includes('top dịch vụ')
    ) {
      return 'QUERY_REVENUE';
    }

    // 7. CORRECTION & FOLLOW-UP (UPDATE APPOINTMENT)
    if (
      lower.startsWith('không phải') && (lower.includes('mà là') || lower.includes('thay vì'))
    ) {
      return 'UPDATE_APPOINTMENT';
    }

    // 8. APPOINTMENT AUDIT / QUESTION vs WRITE
    if (
      lower.includes('bao nhiêu khách hủy') ||
      lower.includes('bao nhiêu lịch') ||
      /\b(?:vừa|đã)\s+đặt\s+lịch/i.test(lower) ||
      /\bđặt\s+lịch\s*(?:à|hả|chưa|không)\b/i.test(lower) ||
      /\bcó\s+lịch\s*(?:hôm\s*qua|hôm\s*nay|chưa|không|à|hả)\b/i.test(lower)
    ) {
      return 'SEARCH_APPOINTMENT';
    }

    if (lower.includes('hủy lịch') || lower.includes('xoá lịch') || lower.includes('xóa lịch')) {
      return 'CANCEL_APPOINTMENT';
    }

    // 8. CUSTOMER CREATION vs UPDATE (Evaluated BEFORE Appointment to avoid misclassification)
    const lastAssistantMsg = (history || []).filter(h => h.role === 'assistant' || h.role === 'model').slice(-1)[0]?.content || '';
    const hasPhone = /0\d{9}/.test(lower);
    const hasCustomerProfileClues = 
      /(?:sinh ngày|ngày sinh|năm sinh|\bsn\b|giới tính|email|địa chỉ|quê quán|ghi chú|thích gái|thích cắt|dị ứng)/i.test(lower) ||
      /^[a-zà-ỹ\s]+,\s*0\d{9}/i.test(lower.trim());

    const isAnsweringCustomerPrompt = 
      /(?:tạo mới.*khách hàng|tạo khách hàng|thêm khách hàng|hồ sơ khách hàng|họ và tên khách hàng|thông tin bắt buộc.*khách hàng|để tạo.*khách hàng|cung cấp giúp em các thông tin.*khách hàng)/i.test(lastAssistantMsg) ||
      ((context?.currentRoute === '/customers' || context?.page === 'customers') && /(?:thông tin|họ và tên|số điện thoại|khách hàng)/i.test(lastAssistantMsg));

    const hasSearchKeyword = /(?:tìm|tra cứu|xem|lọc|kiểm tra|ở đâu|hiển thị|danh sách)/i.test(lower);

    if (
      (lower.includes('tạo khách') || lower.includes('thêm khách') || lower.includes('thêm khách hàng') || lower.includes('tạo khách hàng') || lower.includes('đăng ký khách') || lower.includes('nhập khách')) && 
      !hasSearchKeyword
    ) {
      return 'CREATE_CUSTOMER';
    }

    if (
      !hasSearchKeyword &&
      (isAnsweringCustomerPrompt || hasCustomerProfileClues) &&
      hasPhone &&
      !lower.includes('đặt lịch') &&
      !lower.includes('tạo lịch') &&
      !lower.includes('book lịch') &&
      !/(?:cắt tóc nữ|cắt tóc nam|gội đầu dưỡng sinh|nhuộm tóc|uốn tóc|làm nail)/i.test(lower)
    ) {
      return 'CREATE_CUSTOMER';
    }

    if (
      lower.includes('đổi số điện thoại') || 
      lower.includes('sửa thông tin') || 
      lower.includes('cập nhật khách') ||
      lower.includes('số mới là') ||
      lower.includes('sđt mới') ||
      lower.includes('đổi số') ||
      lower.includes('sửa số')
    ) {
      return 'UPDATE_CUSTOMER';
    }

    // 9. APPOINTMENT AUDIT / QUESTION vs WRITE
    const isAnsweringApptPrompt = 
      (/(?:đặt lịch|tạo lịch|lịch hẹn|thời gian hẹn|khách muốn làm dịch vụ gì|mấy giờ|ngày nào)/i.test(lastAssistantMsg) && 
      !isAnsweringCustomerPrompt);

    const hasServiceKeyword = /(?:cắt tóc nữ|cắt tóc nam|cắt tóc|gội đầu dưỡng sinh|gội đầu|nhuộm tóc|nhuộm|uốn tóc|uốn|làm móng|làm nail|massage|chăm sóc da|tẩy tế bào chết)/i.test(lower);
    const hasTimeKeyword = /(?:hôm nay|ngày mai|chiều mai|sáng mai|tối mai|mai|mốt|thứ\s*[2-7]|chủ nhật|\d{1,2}\s*(?:h|giờ|:)|\d{1,2}[\/\-]\d{1,2})/i.test(lower);

    if (
      !lower.includes('hóa đơn') &&
      !lower.includes('bill') &&
      !lower.includes('thanh toán')
    ) {
      if (isAnsweringApptPrompt && (hasPhone || hasServiceKeyword || hasTimeKeyword)) {
        return 'CREATE_APPOINTMENT';
      }

      if (hasPhone && hasServiceKeyword) {
        return 'CREATE_APPOINTMENT';
      }

      if (hasServiceKeyword && hasTimeKeyword && !lower.includes('giá') && !lower.includes('báo cáo') && !lower.includes('doanh thu')) {
        return 'CREATE_APPOINTMENT';
      }

      if (
        lower.includes('đặt lịch') || 
        lower.includes('tạo lịch') || 
        lower.includes('book lịch') ||
        /\b(?:mai|hôm nay|ngày mai)\s+(?:chị|anh|em|khách|[a-zà-ỹ]+)?\s*(?:qua|ghé|vào\s+lịch|đặt)\b/i.test(lower) ||
        /\bqua\s+lúc\b/i.test(lower) ||
        /\bvào\s+lịch\b/i.test(lower) ||
        lower.includes('đổi thợ') ||
        /\b(?:mần tóc|làm tóc)\b/i.test(lower) ||
        /\bđổi\s+thợ\b/i.test(lower) ||
        /\bđặt\s+(?:cho\s+)?(?:chị|anh|cô|bác|em|bé|[a-zà-ỹ]+)\s+\d{1,2}(?:h| giờ|:)/i.test(lower) ||
        /(?:cắt tóc|gội đầu|nhuộm|uốn|làm móng|massage)\s+(?:lúc|vào|chiều|sáng|\d)/i.test(lower) ||
        /^(?:xếp|cho|đặt)\s+(?:thợ\s+|nhân viên\s+)?([A-ZÀ-Ỹa-zà-ỹ\s]+)$/i.test(lower)
      ) {
        return 'CREATE_APPOINTMENT';
      }
    }

    if (lower.includes('lịch hẹn') || lower.includes('xem lịch') || lower.includes('lịch hôm nay') || lower.includes('lịch ngày mai') || lower.includes('lịch hôm qua')) {
      return 'SEARCH_APPOINTMENT';
    }

    // 10. STAFF AVAILABILITY
    if (
      lower.includes('nhân viên') || 
      lower.includes('danh sách thợ') || 
      lower.includes('thợ nào') ||
      lower.includes('ai còn trống') ||
      lower.includes('ai rảnh') ||
      lower.includes('có rảnh') ||
      lower.includes('còn rảnh') ||
      lower.includes('còn chỗ') ||
      lower.includes('còn thợ')
    ) {
      return 'SEARCH_STAFF';
    }

    // LỌC & TẠO TẬP KHÁCH HÀNG (CUSTOMER SEGMENTATION)
    if (
      lower.includes('lọc') || 
      lower.includes('tập khách') || 
      lower.includes('phân nhóm') || 
      lower.includes('nhóm khách') || 
      lower.includes('chưa quay lại') || 
      lower.includes('chưa ghé') || 
      lower.includes('chưa đến') ||
      lower.includes('chi tiêu trên') || 
      lower.includes('tiêu trên') || 
      lower.includes('chi tiêu >') ||
      lower.includes('ghé trên') || 
      lower.includes('ghé 1 lần') || 
      lower.includes('khách mới ghé') || 
      (lower.includes('sinh nhật') && lower.includes('khách')) ||
      (lower.includes('những khách') && (lower.includes('tiêu') || lower.includes('làm') || lower.includes('ghé')))
    ) {
      return 'FILTER_CUSTOMER';
    }

    if (
      lower.includes('tìm khách') || 
      lower.includes('khách hàng') || 
      lower.includes('tra cứu khách') ||
      lower.includes('tra cứu số điện thoại') ||
      lower.includes('tra cứu sđt') ||
      lower.includes('khách vip') ||
      /^(?:sđt\s*[:\s]*)?0\d{9}$/.test(lower.replace(/[\s.-]/g, ''))
    ) {
      return 'SEARCH_CUSTOMER';
    }

    // 9. SERVICES CATALOG
    if (lower.includes('dịch vụ') || lower.includes('bảng giá') || lower.includes('giá cắt') || lower.includes('giá gội') || lower.includes('liệu trình') || (lower.includes('bao nhiêu tiền') && !lower.includes('làm được') && !lower.includes('thu được'))) {
      return 'SEARCH_SERVICE';
    }

    // 10. NAVIGATION
    if (lower.includes('chuyển') || lower.includes('mở màn hình') || lower.includes('mở trang') || lower.includes('qua pos')) {
      return 'NAVIGATION';
    }

    // 11. GENERAL
    if (lower.includes('xin chào') || lower.includes('chào bạn') || lower.includes('cảm ơn') || lower.includes('bạn là ai')) {
      return 'GENERAL_CONVERSATION';
    }

    return 'UNKNOWN';
  }
}
