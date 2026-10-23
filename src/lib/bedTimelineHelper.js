/**
 * bedTimelineHelper.js
 * Logic hợp nhất dữ liệu lịch hẹn (Appointments) và khách trực tiếp/vãng lai (Walk-in / Bed Sessions)
 * phục vụ chế độ xem Timeline của Giường & Phòng (GloPro Salon Management).
 */

export const TIMELINE_START_HOUR = 7; // 07:00
export const TIMELINE_END_HOUR = 22;   // 22:00
export const TIMELINE_START_MINUTES = TIMELINE_START_HOUR * 60; // 420
export const TIMELINE_END_MINUTES = TIMELINE_END_HOUR * 60;     // 1320
export const TOTAL_TIMELINE_MINUTES = TIMELINE_END_MINUTES - TIMELINE_START_MINUTES; // 900 minutes
export const SLOT_INTERVAL_MINUTES = 30; // Bước nhảy 30 phút
export const DEFAULT_SLOT_WIDTH_PX = 100; // 100px cho mỗi 30 phút

/**
 * Sinh danh sách mốc giờ trên trục Timeline từ startHour đến endHour
 * @param {number} startHour - ví dụ 7
 * @param {number} endHour - ví dụ 22
 * @param {number} stepMinutes - ví dụ 30
 * @returns {Array<{ time: string, minutes: number }>}
 */
export function generateTimelineSlots(startHour = TIMELINE_START_HOUR, endHour = TIMELINE_END_HOUR, stepMinutes = SLOT_INTERVAL_MINUTES) {
  const slots = [];
  const startMins = startHour * 60;
  const endMins = endHour * 60;

  for (let m = startMins; m <= endMins; m += stepMinutes) {
    const hh = String(Math.floor(m / 60)).padStart(2, '0');
    const mm = String(m % 60).padStart(2, '0');
    slots.push({
      time: `${hh}:${mm}`,
      minutes: m
    });
  }
  return slots;
}

/**
 * Chuyển đổi định dạng giờ chuỗi (HH:mm, H:m, AM/PM, ISO date) sang tổng số phút trong ngày
 * @param {string|Date} t 
 * @returns {number} phút từ 0 đến 1440
 */
export function parseTimeToMinutes(t) {
  if (!t) return 0;
  if (t instanceof Date) {
    return t.getHours() * 60 + t.getMinutes();
  }

  const str = String(t).trim();
  // Nếu là ISO datetime (chứa T hoặc dấu gạch nối ngày)
  if (str.includes('T')) {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      return d.getHours() * 60 + d.getMinutes();
    }
  }

  const isPM = str.toUpperCase().includes('PM');
  const isAM = str.toUpperCase().includes('AM');
  const clean = str.replace(/(AM|PM)/gi, '').trim();

  const parts = clean.split(':');
  let hours = parseInt(parts[0], 10);
  let minutes = parts[1] ? parseInt(parts[1], 10) : 0;

  if (isNaN(hours)) hours = 9;
  if (isNaN(minutes)) minutes = 0;

  if (isPM && hours < 12) hours += 12;
  if (isAM && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

/**
 * Chuyển số phút sang chuỗi "HH:mm"
 * @param {number} minutes 
 * @returns {string} ví dụ "09:30"
 */
export function formatMinutesToString(minutes) {
  const bounded = Math.max(0, Math.min(1439, Math.round(minutes)));
  const hh = String(Math.floor(bounded / 60)).padStart(2, '0');
  const mm = String(bounded % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

/**
 * Kiểm tra xem 2 chuỗi ngày có trùng ngày không (YYYY-MM-DD)
 */
export function isSameDay(date1, date2) {
  if (!date1 || !date2) return false;
  const d1 = typeof date1 === 'string' ? date1.slice(0, 10) : new Date(date1).toISOString().slice(0, 10);
  const d2 = typeof date2 === 'string' ? date2.slice(0, 10) : new Date(date2).toISOString().slice(0, 10);
  return d1 === d2;
}

/**
 * Lấy chuỗi YYYY-MM-DD của ngày hôm nay theo giờ địa phương
 */
export function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Hợp nhất toàn bộ dữ liệu lịch hẹn và phiên giường thành sự kiện Timeline cho từng giường
 * 
 * @param {Object} params
 * @param {string} params.selectedDate - Ngày được chọn (YYYY-MM-DD)
 * @param {Array} params.beds - Danh sách giường hiện hành
 * @param {Array} params.appointments - Danh sách lịch hẹn
 * @param {Object} params.bedSessions - Bản đồ phiên giường đang hoạt động ({ [bed_id]: session })
 * @param {Array} params.staff - Danh sách nhân viên
 * @param {Array} params.services - Danh sách dịch vụ
 * @param {number} params.currentMinutes - Số phút hiện tại trong ngày
 * @returns {Object} Bản đồ { [bed_id]: Array<BedTimelineEvent> }
 */
export function aggregateBedTimelineEvents({
  selectedDate = getTodayDateString(),
  beds = [],
  appointments = [],
  bedSessions = {},
  completedBedSessions = [],
  staff = [],
  services = [],
  currentMinutes = (new Date().getHours() * 60 + new Date().getMinutes())
}) {
  const result = {};
  const isSelectedDayToday = isSameDay(selectedDate, getTodayDateString());

  // Khởi tạo mảng rỗng cho tất cả giường
  beds.forEach(b => {
    if (b.id) result[b.id] = [];
  });

  // 1. Xử lý các Lịch hẹn (Appointments) có gán giường
  (appointments || []).forEach(appt => {
    // Lọc theo ngày
    const apptDate = appt.date || appt.appointment_date || appt.start_time;
    if (apptDate && !isSameDay(apptDate, selectedDate)) return;

    // Lọc bỏ các trạng thái đã hủy
    if (appt.status === 'cancelled') return;

    // Xác định giường
    const bedId = appt.facility_id || appt.bed_id || appt.services?.[0]?.facility_id;
    if (!bedId || !result[bedId]) return;

    // Giờ bắt đầu & kết thúc
    const startMins = parseTimeToMinutes(appt.start_time || '09:00');
    let durationMins = parseInt(appt.duration_minutes || appt.duration || 60, 10);
    if (isNaN(durationMins) || durationMins <= 0) durationMins = 60;

    let endMins = appt.end_time ? parseTimeToMinutes(appt.end_time) : (startMins + durationMins);
    if (endMins <= startMins) endMins = startMins + durationMins;

    // Tìm tên KTV
    const staffObj = (staff || []).find(s => s.id === appt.staff_id);
    const staffName = appt.staff_name || staffObj?.full_name || staffObj?.name || 'KTV Chưa phân công';

    // Tìm dịch vụ
    const serviceName = appt.service_name || 
                        (appt.services && appt.services.length > 0 ? appt.services.map(s => s.name || s.service_name).join(', ') : 'Dịch vụ spa');

    const isOvertime = isSelectedDayToday && 
                       (appt.status === 'in_progress' || appt.status === 'checked_in') && 
                       currentMinutes > endMins;

    result[bedId].push({
      id: `appt_${appt.id}`,
      originalId: appt.id,
      type: 'appointment', // Khách đặt trước
      typeLabel: 'Lịch hẹn',
      bed_id: bedId,
      customer_id: appt.customer_id,
      customer_name: appt.customer_name || 'Khách đặt lịch',
      customer_phone: appt.customer_phone || '',
      staff_id: appt.staff_id,
      staff_name: staffName,
      service_name: serviceName,
      services: appt.services || [{ name: serviceName, price: appt.price || 0 }],
      start_time: formatMinutesToString(startMins),
      end_time: formatMinutesToString(endMins),
      start_minutes: startMins,
      end_minutes: endMins,
      duration_minutes: durationMins,
      status: appt.status || 'confirmed',
      is_overtime: isOvertime,
      price: appt.price || appt.total_amount || 0,
      notes: appt.notes || '',
      raw: appt
    });
  });

  // 2. Xử lý các Khách vãng lai / Trực tiếp đang hoạt động (Bed Sessions)
  // Chỉ hiển thị phiên active nếu ngày được chọn là "Hôm nay"
  if (isSelectedDayToday && bedSessions) {
    Object.entries(bedSessions).forEach(([bedId, session]) => {
      if (!session || !result[bedId]) return;

      // Tránh trùng lặp nếu session này được tạo từ 1 appointment đã nằm trong danh sách
      const isDuplicate = result[bedId].some(e => 
        (e.originalId && String(e.originalId) === String(session.id)) ||
        (session.appointment_id && String(e.originalId) === String(session.appointment_id))
      );
      if (isDuplicate) return;

      const startMins = parseTimeToMinutes(session.start_time || '08:00');
      let durationMins = parseInt(session.total_duration_minutes || session.duration || 60, 10);
      if (isNaN(durationMins) || durationMins <= 0) durationMins = 60;

      let endMins = session.end_time ? parseTimeToMinutes(session.end_time) : (startMins + durationMins);
      if (endMins <= startMins) endMins = startMins + durationMins;

      // Dịch vụ
      const serviceName = session.services && session.services.length > 0
        ? session.services.map(s => s.name || s.service_name).join(', ')
        : (session.service_name || 'Dịch vụ trực tiếp');

      // KTV
      const staffName = session.services?.[0]?.staff_name || 
                        session.staff_name || 
                        'KTV Phục vụ';

      const isOvertime = currentMinutes > endMins;

      result[bedId].push({
        id: `walkin_${session.id || bedId}`,
        originalId: session.id,
        type: 'walk_in', // Khách vãng lai / trực tiếp
        typeLabel: session.status === 'cleaning' ? 'Dọn dẹp' : 'Vãng lai',
        bed_id: bedId,
        customer_id: session.customer?.id || session.customer_id,
        customer_name: session.customer_name || session.customer?.name || (session.status === 'cleaning' ? 'Đang dọn dẹp' : 'Khách vãng lai'),
        customer_phone: session.customer_phone || session.customer?.phone || '',
        staff_id: session.services?.[0]?.staff_id || session.staff_id,
        staff_name: staffName,
        service_name: serviceName,
        services: session.services || [{ name: serviceName, price: session.price || 0 }],
        start_time: formatMinutesToString(startMins),
        end_time: formatMinutesToString(endMins),
        start_minutes: startMins,
        end_minutes: endMins,
        duration_minutes: durationMins,
        status: session.status || 'in_progress',
        is_overtime: isOvertime,
        price: session.total_price || session.price || 0,
        notes: session.notes || '',
        raw: session
      });
    });
  }

  // 3. Xử lý các Phiên giường đã hoàn tất trong ngày (Completed Bed Sessions / Trả phòng)
  // Giúp xem tổng quan toàn bộ lịch sử phục vụ của từng giường trong ngày
  if (completedBedSessions && Array.isArray(completedBedSessions)) {
    completedBedSessions.forEach(session => {
      if (!session) return;
      const sessionDate = session.date || (session.completed_at ? String(session.completed_at).slice(0, 10) : getTodayDateString());
      if (!isSameDay(sessionDate, selectedDate)) return;

      const bedId = session.bed_id;
      if (!bedId || !result[bedId]) return;

      // Tránh trùng lặp nếu session này đã có trong result[bedId] (ví dụ từ appointment hoặc phiên đang chạy)
      const isDuplicate = result[bedId].some(e => 
        (e.originalId && String(e.originalId) === String(session.id || session.originalId)) ||
        (session.appointment_id && String(e.originalId) === String(session.appointment_id))
      );
      if (isDuplicate) return;

      const startMins = parseTimeToMinutes(session.start_time || '08:00');
      let durationMins = parseInt(session.total_duration_minutes || session.duration || 60, 10);
      if (isNaN(durationMins) || durationMins <= 0) durationMins = 60;

      let endMins = session.end_time ? parseTimeToMinutes(session.end_time) : (startMins + durationMins);
      if (endMins <= startMins) endMins = startMins + durationMins;

      // Dịch vụ
      const serviceName = session.services && session.services.length > 0
        ? session.services.map(s => s.name || s.service_name).join(', ')
        : (session.service_name || 'Dịch vụ đã hoàn tất');

      // KTV
      const staffName = session.services?.[0]?.staff_name || 
                        session.staff_name || 
                        'KTV Phục vụ';

      result[bedId].push({
        id: `completed_${session.id || bedId}_${startMins}`,
        originalId: session.id,
        type: 'completed_session',
        typeLabel: 'Đã trả phòng',
        bed_id: bedId,
        customer_id: session.customer?.id || session.customer_id,
        customer_name: session.customer_name || session.customer?.name || 'Khách phục vụ xong',
        customer_phone: session.customer_phone || session.customer?.phone || '',
        customer: session.customer,
        staff_id: session.services?.[0]?.staff_id || session.staff_id,
        staff_name: staffName,
        service_name: serviceName,
        services: session.services || [{ name: serviceName, price: session.price || 0 }],
        start_time: formatMinutesToString(startMins),
        end_time: formatMinutesToString(endMins),
        start_minutes: startMins,
        end_minutes: endMins,
        duration_minutes: durationMins,
        status: 'completed',
        is_overtime: false,
        price: session.total_price || session.price || 0,
        notes: session.notes || '',
        raw: session
      });
    });
  }

  // Sắp xếp các sự kiện trên mỗi giường theo thứ tự giờ bắt đầu tăng dần
  Object.keys(result).forEach(bedId => {
    result[bedId].sort((a, b) => a.start_minutes - b.start_minutes);
  });

  return result;
}

/**
 * Tính toán vị trí CSS (left, width) cho 1 khối sự kiện trên Timeline
 * @param {Object} event - Sự kiện giường
 * @param {number} timelineStartMinutes - Mốc bắt đầu Timeline (mặc định 420 = 07:00)
 * @param {number} slotWidthPx - Độ rộng 1 slot 30 phút (mặc định 100px)
 * @param {number} slotIntervalMinutes - Độ dài phút 1 slot (mặc định 30)
 * @returns {{ left: number, width: number, isVisible: boolean }}
 */
export function calculateTimelinePosition(
  event,
  timelineStartMinutes = TIMELINE_START_MINUTES,
  slotWidthPx = DEFAULT_SLOT_WIDTH_PX,
  slotIntervalMinutes = SLOT_INTERVAL_MINUTES
) {
  const pixelsPerMinute = slotWidthPx / slotIntervalMinutes;
  
  // Tính tọa độ điểm bắt đầu
  const offsetMinutes = Math.max(0, event.start_minutes - timelineStartMinutes);
  const left = offsetMinutes * pixelsPerMinute;

  // Tính độ rộng
  let visibleDuration = event.duration_minutes;
  // Nếu sự kiện bắt đầu trước mốc timelineStartMinutes
  if (event.start_minutes < timelineStartMinutes) {
    visibleDuration = Math.max(15, (event.start_minutes + event.duration_minutes) - timelineStartMinutes);
  }

  const width = Math.max(45, visibleDuration * pixelsPerMinute);

  // Kiểm tra có nằm trong khung giờ nhìn thấy không
  const isVisible = (event.end_minutes > timelineStartMinutes) && 
                    (event.start_minutes < TIMELINE_END_MINUTES);

  return { left, width, isVisible };
}
