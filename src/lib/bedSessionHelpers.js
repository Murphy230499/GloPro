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
 * Tìm tất cả các phiên giường đang hoạt động của cùng một khách hàng
 * @param {Object} bedSessions Map bedId -> session
 * @param {Object} customer Khách hàng cần tìm
 * @param {string} masterSessionId (Tùy chọn) Mã lượt phục vụ
 */
export function findCustomerActiveSessions(bedSessions = {}, customer = null, masterSessionId = null) {
  if (!bedSessions) return [];
  const list = Object.values(bedSessions).filter(Boolean);

  if (masterSessionId) {
    return list.filter(s => s.master_session_id === masterSessionId);
  }

  // Khách vãng lai ẩn danh (không có ID thật hoặc is_guest): không tự động gộp theo ID khách
  if (!customer || customer.id === 'walk_in' || customer.is_guest) {
    return [];
  }

  return list.filter(s => {
    if (s.customer?.id && String(s.customer.id) === String(customer.id)) return true;
    if (s.customer?.phone && customer.phone && s.customer.phone === customer.phone) return true;
    return false;
  });
}

/**
 * Gom tất cả dịch vụ của khách trên mọi giường thuộc lượt này (bao gồm cả các dịch vụ đã chuyển giao)
 * @param {Object} bedSessions Map bedId -> session
 * @param {Object} currentSession Phiên hiện tại đang tương tác
 */
export function getAllServicesForCustomer(bedSessions = {}, currentSession = null) {
  if (!currentSession) return [];

  const masterId = currentSession.master_session_id;
  const customerId = currentSession.customer?.id;
  const isGuest = currentSession.customer?.is_guest || customerId === 'walk_in';

  // Lấy các phiên liên quan
  const relatedSessions = Object.values(bedSessions || {}).filter(s => {
    if (!s) return false;
    if (masterId && s.master_session_id === masterId) return true;
    if (!isGuest && customerId && s.customer?.id && String(s.customer.id) === String(customerId)) return true;
    return s.id === currentSession.id;
  });

  const allServices = [];
  const seenServiceKey = new Set();

  // 1. Thêm các dịch vụ lưu trong lịch sử chuyển phòng của phiên hiện tại (nếu có)
  if (Array.isArray(currentSession.past_services)) {
    currentSession.past_services.forEach(srv => {
      const key = `${srv.service_id || srv.name}_${srv.bed_id}_${srv.completed_at || srv.staff_id || ''}`;
      if (!seenServiceKey.has(key)) {
        seenServiceKey.add(key);
        allServices.push({ ...srv, is_past: true });
      }
    });
  }

  // 2. Thêm dịch vụ từ các phiên đang active
  relatedSessions.forEach(ses => {
    // Dịch vụ quá khứ của các phiên liên quan
    if (Array.isArray(ses.past_services)) {
      ses.past_services.forEach(srv => {
        const key = `${srv.service_id || srv.name}_${srv.bed_id}_${srv.completed_at || srv.staff_id || ''}`;
        if (!seenServiceKey.has(key)) {
          seenServiceKey.add(key);
          allServices.push({ ...srv, is_past: true });
        }
      });
    }

    // Dịch vụ hiện tại
    (ses.services || []).forEach(srv => {
      const key = `${srv.service_id || srv.name}_${ses.bed_id}_${srv.staff_id || ''}`;
      if (!seenServiceKey.has(key)) {
        seenServiceKey.add(key);
        allServices.push({
          ...srv,
          bed_id: ses.bed_id,
          bed_name: srv.bed_name || ses.bed_name,
          room_name: srv.room_name || ses.room_name,
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
 * Giải phóng tất cả các giường liên quan đến một lượt phục vụ hoặc một khách hàng
 */
export function releaseCustomerBedSessions(bedSessions = {}, identifier = {}) {
  const { masterSessionId, customerId } = identifier;
  const updated = { ...bedSessions };
  let releasedCount = 0;

  Object.entries(updated).forEach(([bedId, session]) => {
    if (!session) return;
    let match = false;
    if (masterSessionId && session.master_session_id === masterSessionId) {
      match = true;
    } else if (customerId && session.customer?.id && String(session.customer.id) === String(customerId)) {
      match = true;
    }

    if (match) {
      delete updated[bedId];
      releasedCount++;
    }
  });

  return { updatedSessions: updated, releasedCount };
}
