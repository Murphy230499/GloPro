/**
 * bedSessionHelpers.js
 * Tiện ích quản lý vòng đời phiên giường, liên kết lượt phục vụ (Master Session)
 * và gom dịch vụ đa phòng cho tính năng Quản lý Giường / Phòng GloPro.
 */

/**
 * Tạo mã Lượt phục vụ duy nhất (Master Session ID)
 */
export function generateMasterSessionId() {
  return `ms_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}


/**
 * Tìm tất cả các phiên giường đang hoạt động của cùng một khách hàng trên mọi phòng
 * @param {Object} bedSessions Map bedId -> session
 * @param {Object} customer Khách hàng cần tìm
 * @param {string} masterSessionId (Tùy chọn) Mã lượt phục vụ
 * @param {string} currentBedId (Tùy chọn) ID giường hiện tại đang xét
 */
export function findCustomerActiveSessions(bedSessions = {}, customer = null, masterSessionId = null, currentBedId = null) {
  if (!bedSessions) return [];
  const list = Object.values(bedSessions).filter(Boolean);

  const cCustId = customer?.id || customer?.customer_id;
  const isRealCustomerId = cCustId && cCustId !== 'walk_in' && !customer?.is_guest;

  const cPhone = (customer?.phone || customer?.customer_phone || '').trim();
  const hasValidPhone = cPhone.length >= 7;

  const rawName = (customer?.name || customer?.customer_name || '').trim();
  const cNameLower = rawName.toLowerCase();
  const hasValidName = rawName.length > 1 && 
    cNameLower !== 'khách vãng lai' && 
    cNameLower !== 'vãng lai' && 
    cNameLower !== 'walk-in' &&
    cNameLower !== 'walk in';

  const matched = list.filter(s => {
    if (!s) return false;

    // 1. Giường hiện tại luôn khớp
    if (currentBedId && (s.bed_id === currentBedId || s.id === currentBedId)) {
      return true;
    }

    // 2. Trùng Master Session ID (lượt phục vụ chung)
    if (masterSessionId && s.master_session_id === masterSessionId) {
      return true;
    }

    // 3. Trùng ID khách hàng thật (từ danh bạ CRM)
    const sCustId = s.customer?.id || s.customer_id;
    if (isRealCustomerId && sCustId && String(sCustId) === String(cCustId)) {
      return true;
    }

    // 4. Trùng số điện thoại khách hàng (kể cả khách vãng lai nếu có SĐT)
    const sPhone = (s.customer?.phone || s.customer_phone || '').trim();
    if (hasValidPhone && sPhone && sPhone === cPhone) {
      return true;
    }

    // 5. Trùng tên khách hàng (nếu tên cụ thể và không phải chữ "Khách vãng lai")
    const sNameLower = (s.customer?.name || s.customer_name || '').trim().toLowerCase();
    if (hasValidName && sNameLower && sNameLower === cNameLower) {
      return true;
    }

    return false;
  });

  // Deduplicate theo bed_id
  const seenBeds = new Set();
  return matched.filter(s => {
    const key = s.bed_id || s.id;
    if (seenBeds.has(key)) return false;
    seenBeds.add(key);
    return true;
  });
}

/**
 * Gom tất cả dịch vụ của khách trên mọi giường thuộc mọi phòng (bao gồm cả các dịch vụ đã chuyển giao)
 * @param {Object} bedSessions Map bedId -> session
 * @param {Object} currentSession Phiên hiện tại đang tương tác
 */
export function getAllServicesForCustomer(bedSessions = {}, currentSession = null) {
  if (!currentSession) return [];

  const masterId = currentSession.master_session_id;
  const customer = currentSession.customer || {
    id: currentSession.customer_id,
    name: currentSession.customer_name,
    phone: currentSession.customer_phone
  };
  const currentBedId = currentSession.bed_id;

  // Lấy các phiên liên quan trên mọi giường / phòng
  const relatedSessions = findCustomerActiveSessions(bedSessions, customer, masterId, currentBedId);
  if (relatedSessions.length === 0 && currentSession) {
    relatedSessions.push(currentSession);
  }

  const allServices = [];
  const seenServiceKey = new Set();

  // 1. Thêm các dịch vụ lưu trong lịch sử chuyển phòng của phiên hiện tại (nếu có)
  if (Array.isArray(currentSession.past_services)) {
    currentSession.past_services.forEach(srv => {
      const key = `${srv.service_id || srv.id || srv.name}_${srv.bed_id || ''}_${srv.completed_at || srv.staff_id || ''}`;
      if (!seenServiceKey.has(key)) {
        seenServiceKey.add(key);
        allServices.push({ ...srv, is_past: true });
      }
    });
  }

  // 2. Thêm dịch vụ từ các phiên đang active tại tất cả các phòng / giường
  relatedSessions.forEach(ses => {
    // Dịch vụ quá khứ của các phiên liên quan
    if (Array.isArray(ses.past_services)) {
      ses.past_services.forEach(srv => {
        const key = `${srv.service_id || srv.id || srv.name}_${srv.bed_id || ''}_${srv.completed_at || srv.staff_id || ''}`;
        if (!seenServiceKey.has(key)) {
          seenServiceKey.add(key);
          allServices.push({ ...srv, is_past: true });
        }
      });
    }

    // Dịch vụ hiện tại đang thực hiện tại giường đó
    (ses.services || []).forEach(srv => {
      const key = `${srv.service_id || srv.id || srv.name}_${ses.bed_id}_${srv.staff_id || srv.staff_name || ''}`;
      if (!seenServiceKey.has(key)) {
        seenServiceKey.add(key);
        allServices.push({
          ...srv,
          bed_id: ses.bed_id,
          bed_name: srv.bed_name || ses.bed_name || 'Vị trí phục vụ',
          room_name: srv.room_name || ses.room_name || '',
          is_past: false
        });
      }
    });
  });

  return allServices;
}

/**
 * Xử lý chuyển khách từ Giường A sang Giường B
 * @param {string} fromBedId ID giường cũ
 * @param {string} toBedId ID giường mới
 * @param {Object} bedSessions Toàn bộ sessions hiện tại
 * @param {Object} options { targetBed, targetRoom, newServices, startTime }
 */
export function transferBedSession(fromBedId, toBedId, bedSessions = {}, options = {}) {
  const current = bedSessions[fromBedId];
  if (!current) return bedSessions;

  const now = new Date();
  const startH = String(now.getHours()).padStart(2, '0');
  const startM = String(now.getMinutes()).padStart(2, '0');
  const transferTime = options.startTime || `${startH}:${startM}`;

  // Đóng gói dịch vụ ở giường cũ vào danh sách past_services
  const completedFromServices = (current.services || []).map(s => ({
    ...s,
    bed_id: fromBedId,
    bed_name: current.bed_name,
    room_name: current.room_name,
    completed_at: transferTime
  }));

  const pastServices = [
    ...(current.past_services || []),
    ...completedFromServices
  ];

  // Dịch vụ áp dụng ở giường mới
  const targetServices = options.newServices && options.newServices.length > 0
    ? options.newServices
    : current.services;

  const totalDuration = targetServices.reduce((sum, s) => sum + (Number(s.duration) || 30), 0);
  
  // Tính giờ kết thúc dự kiến cho giường mới
  const [h, m] = transferTime.split(':').map(Number);
  const endMinutes = (h * 60 + m) + totalDuration;
  const endH = String(Math.floor(endMinutes / 60) % 24).padStart(2, '0');
  const endM = String(endMinutes % 60).padStart(2, '0');

  const newSessionForTargetBed = {
    ...current,
    id: `ses_${Date.now()}`,
    bed_id: toBedId,
    bed_name: options.targetBed?.name || 'Giường mới',
    room_name: options.targetRoom?.name || '',
    start_time: transferTime,
    end_time: `${endH}:${endM}`,
    total_duration_minutes: totalDuration,
    services: targetServices.map(s => ({
      ...s,
      bed_id: toBedId,
      bed_name: options.targetBed?.name || '',
      room_name: options.targetRoom?.name || ''
    })),
    past_services: pastServices,
    transferred_from: {
      bed_id: fromBedId,
      bed_name: current.bed_name,
      at: transferTime
    }
  };

  const updatedSessions = { ...bedSessions };
  // Giải phóng giường cũ
  delete updatedSessions[fromBedId];
  // Kích hoạt giường mới
  updatedSessions[toBedId] = newSessionForTargetBed;

  return updatedSessions;
}

/**
 * Giải phóng tất cả các giường liên quan đến một lượt phục vụ hoặc một khách hàng trên mọi phòng
 */
export function releaseCustomerBedSessions(bedSessions = {}, identifier = {}) {
  const { masterSessionId, customerId, customerPhone, customerName, bedId, bedIds = [] } = identifier;
  const updated = { ...bedSessions };
  const releasedBedIds = [];

  const explicitBedIds = new Set(bedIds.filter(Boolean));
  if (bedId) explicitBedIds.add(bedId);

  const cleanPhone = (customerPhone || '').trim();
  const cleanName = (customerName || '').trim().toLowerCase();
  const isValidName = cleanName.length > 1 && 
    cleanName !== 'khách vãng lai' && 
    cleanName !== 'vãng lai' && 
    cleanName !== 'walk-in' &&
    cleanName !== 'walk in';

  Object.entries(updated).forEach(([bId, session]) => {
    if (!session) return;
    let match = false;

    // 1. Chỉ định rõ ID giường
    if (explicitBedIds.has(bId)) {
      match = true;
    }
    // 2. Trùng Master Session
    else if (masterSessionId && session.master_session_id === masterSessionId) {
      match = true;
    }
    // 3. Trùng ID khách hàng CRM
    else if (customerId && customerId !== 'walk_in' && (String(session.customer?.id) === String(customerId) || String(session.customer_id) === String(customerId))) {
      match = true;
    }
    // 4. Trùng số điện thoại
    else if (cleanPhone && cleanPhone.length >= 7) {
      const sPhone = (session.customer?.phone || session.customer_phone || '').trim();
      if (sPhone && sPhone === cleanPhone) match = true;
    }
    // 5. Trùng tên khách cụ thể
    else if (isValidName) {
      const sName = (session.customer?.name || session.customer_name || '').trim().toLowerCase();
      if (sName && sName === cleanName) match = true;
    }

    if (match) {
      delete updated[bId];
      releasedBedIds.push(bId);
    }
  });

  return { updatedSessions: updated, releasedBedIds, releasedCount: releasedBedIds.length };
}
