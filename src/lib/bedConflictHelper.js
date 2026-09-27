/**
 * bedConflictHelper.js
 * Module xử lý phát hiện và ngăn chặn xung đột thời gian (Time Conflict)
 * giữa Khách vãng lai (Walk-in) và Lịch hẹn đặt trước (Pre-booked Appointments)
 * tại tính năng Quản lý Giường / Phòng GloPro.
 */

import { timeStringToMinutes, formatMinutesToTime } from '@/components/appointments/constants';

// Thời gian đệm vệ sinh, thay ga giường giữa 2 lượt khách (15 phút theo cấu hình salon)
export const BED_BUFFER_MINUTES = 15;

/**
 * Lọc danh sách lịch hẹn hợp lệ trong ngày được xếp vào một giường cụ thể
 */
export function getTodayAppointmentsForBed(bedId, appointments = [], dateStr = null) {
  if (!bedId || !Array.isArray(appointments)) return [];

  const today = dateStr || new Date().toISOString().split('T')[0];
  const validStatuses = new Set(['confirmed', 'pending', 'checked_in']);

  return appointments
    .filter(appt => {
      if (!appt || !appt.facility_id) return false;
      const isSameBed = String(appt.facility_id) === String(bedId);
      const isToday = !appt.date || String(appt.date).startsWith(today);
      const isValidStatus = validStatuses.has(appt.status);
      return isSameBed && isToday && isValidStatus;
    })
    .sort((a, b) => {
      const aStart = timeStringToMinutes(a.start_time || '09:00');
      const bStart = timeStringToMinutes(b.start_time || '09:00');
      return aStart - bStart;
    });
}

/**
 * Tìm lịch hẹn sớm nhất tiếp theo trên giường bắt đầu sau thời điểm hiện tại
 */
export function getNextUpcomingAppointment(bedId, appointments = [], nowMinutes = null) {
  const currentMins = nowMinutes !== null ? nowMinutes : (() => {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  })();

  const bedAppts = getTodayAppointmentsForBed(bedId, appointments);
  if (bedAppts.length === 0) return null;

  // Tìm lịch hẹn đầu tiên có giờ bắt đầu sau thời điểm hiện tại (trừ đi 15 phút nếu khách đến sớm)
  return bedAppts.find(appt => {
    const startMins = timeStringToMinutes(appt.start_time || '09:00');
    return startMins >= currentMins - 15;
  }) || null;
}

/**
 * Tính toán khung thời gian khả dụng còn trống của một giường trước lịch hẹn tiếp theo
 */
export function calculateBedAvailableWindow(bedId, appointments = [], nowMinutes = null, bufferMinutes = BED_BUFFER_MINUTES) {
  const currentMins = nowMinutes !== null ? nowMinutes : (() => {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  })();

  const nextAppt = getNextUpcomingAppointment(bedId, appointments, currentMins);

  if (!nextAppt) {
    return {
      hasNextAppt: false,
      nextAppt: null,
      availableMinutes: 999, // Không giới hạn
      availableUntil: null,
      formattedBadge: '🟢 Trống cả ngày',
      summaryText: 'Không có lịch hẹn tiếp theo'
    };
  }

  const apptStartMins = timeStringToMinutes(nextAppt.start_time || '09:00');
  // Trừ đi thời gian dọn dẹp buffer giữa 2 lượt khách
  const availableMinutes = Math.max(0, apptStartMins - currentMins - bufferMinutes);
  const rawRemaining = Math.max(0, apptStartMins - currentMins);

  return {
    hasNextAppt: true,
    nextAppt,
    availableMinutes, // Số phút thực tế ca mới có thể làm
    rawRemainingMinutes: rawRemaining, // Số phút từ giờ tới lúc khách hẹn đến
    availableUntil: nextAppt.start_time,
    formattedBadge: availableMinutes > 0 
      ? `🟢 Trống đến ${nextAppt.start_time} (còn ~${availableMinutes}p)`
      : `⚠️ Hẹn lúc ${nextAppt.start_time}`,
    summaryText: `Lịch hẹn kế tiếp lúc ${nextAppt.start_time} (${nextAppt.customer_name || 'Khách hẹn'})`
  };
}

/**
 * Kiểm tra xem một ca phục vụ mới (dịch vụ khách vãng lai) có bị xung đột thời gian với lịch hẹn nào trên giường không
 * 
 * @param {Object} params
 *   - bedId: ID giường cần kiểm tra
 *   - serviceDurationMinutes: Tổng thời gian làm dịch vụ (phút)
 *   - startTimeStr: Giờ bắt đầu (mặc định là giờ hiện tại "HH:mm")
 *   - appointments: Toàn bộ danh sách lịch hẹn hôm nay
 *   - bufferMinutes: Thời gian đệm vệ sinh (mặc định 15 phút)
 */
export function checkBedAssignmentConflict({
  bedId,
  serviceDurationMinutes = 60,
  startTimeStr = null,
  appointments = [],
  bufferMinutes = BED_BUFFER_MINUTES
}) {
  const now = new Date();
  const currentMinsNow = now.getHours() * 60 + now.getMinutes();

  let startMins = currentMinsNow;
  if (startTimeStr) {
    startMins = timeStringToMinutes(startTimeStr);
  }

  const duration = Number(serviceDurationMinutes) || 60;
  const finishMins = startMins + duration;
  const finishWithBufferMins = finishMins + bufferMinutes;

  const finishTimeStr = formatMinutesToTime(finishMins);
  const finishWithBufferStr = formatMinutesToTime(finishWithBufferMins);

  const todayAppts = getTodayAppointmentsForBed(bedId, appointments);

  // Tìm lịch hẹn bị đè (nếu khoảng [startMins, finishWithBufferMins] giao thoa với [appt.start, appt.end])
  let conflictedAppointment = null;
  let overlapMinutes = 0;

  for (const appt of todayAppts) {
    const apptStartMins = timeStringToMinutes(appt.start_time || '09:00');
    const apptDuration = Number(appt.duration_minutes || appt.duration) || 60;
    const apptEndMins = apptStartMins + apptDuration;

    // Kiểm tra giao thoa:
    // Ca mới bắt đầu trước khi lịch hẹn kết thúc VÀ kết thúc (cộng buffer) sau khi lịch hẹn bắt đầu
    const isOverlapping = (startMins < apptEndMins) && (finishWithBufferMins > apptStartMins);

    if (isOverlapping) {
      conflictedAppointment = appt;
      overlapMinutes = finishWithBufferMins - apptStartMins;
      break;
    }
  }

  if (conflictedAppointment) {
    const apptStartStr = conflictedAppointment.start_time || '09:00';
    return {
      hasConflict: true,
      conflictedAppointment,
      requiredMinutes: duration,
      bufferMinutes,
      totalRequiredMinutes: duration + bufferMinutes,
      overlapMinutes,
      startTimeStr: formatMinutesToTime(startMins),
      finishTimeStr,
      finishWithBufferStr,
      nextApptStartTime: apptStartStr,
      customerName: conflictedAppointment.customer_name || 'Khách đặt hẹn',
      customerPhone: conflictedAppointment.customer_phone || '',
      serviceName: conflictedAppointment.service_name || 'Dịch vụ',
      message: `Ca phục vụ sẽ xong lúc ${finishTimeStr} (+15p dọn dẹp = ${finishWithBufferStr}), đè vào lịch hẹn lúc ${apptStartStr} của khách "${conflictedAppointment.customer_name || 'Khách hẹn'}" (${overlapMinutes} phút)!`
    };
  }

  return {
    hasConflict: false,
    conflictedAppointment: null,
    requiredMinutes: duration,
    bufferMinutes,
    totalRequiredMinutes: duration + bufferMinutes,
    overlapMinutes: 0,
    startTimeStr: formatMinutesToTime(startMins),
    finishTimeStr,
    finishWithBufferStr,
    nextApptStartTime: null,
    message: 'Thời gian phục vụ an toàn, không có xung đột lịch hẹn.'
  };
}

/**
 * Gợi ý các giường trống khác trong salon có đủ thời gian làm dịch vụ mà không bị xung đột
 */
export function findAlternativeAvailableBeds({
  beds = [],
  rooms = [],
  appointments = [],
  bedSessions = {},
  requiredMinutes = 60,
  currentBedId = null,
  nowMinutes = null,
  bufferMinutes = BED_BUFFER_MINUTES
}) {
  const currentMins = nowMinutes !== null ? nowMinutes : (() => {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  })();

  const totalRequired = requiredMinutes + bufferMinutes;

  return beds
    .filter(bed => {
      if (!bed || !bed.id) return false;
      if (currentBedId && bed.id === currentBedId) return false;

      // 1. Phải đang trống tại thời điểm hiện tại (không có active session)
      const currentSession = bedSessions[bed.id];
      if (currentSession) return false;

      // 2. Không được xung đột với lịch hẹn sắp tới
      const conflictCheck = checkBedAssignmentConflict({
        bedId: bed.id,
        serviceDurationMinutes: requiredMinutes,
        startTimeStr: formatMinutesToTime(currentMins),
        appointments,
        bufferMinutes
      });

      return !conflictCheck.hasConflict;
    })
    .map(bed => {
      const windowInfo = calculateBedAvailableWindow(bed.id, appointments, currentMins, bufferMinutes);
      const room = rooms.find(r => r.id === bed.room_id || r.name === bed.room_name);

      return {
        ...bed,
        room_name: room?.name || bed.room_name || 'Phòng chung',
        availableMinutes: windowInfo.availableMinutes,
        availableUntil: windowInfo.availableUntil,
        windowBadge: windowInfo.formattedBadge
      };
    });
}
