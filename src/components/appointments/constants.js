export const INITIAL_DEMO_ROOMS = [
  { id: 'room_1', name: 'Phòng 1', display_order: 1 },
  { id: 'room_2', name: 'Phòng 2', display_order: 2 },
  { id: 'room_3', name: 'Phòng 3', display_order: 3 },
  { id: 'room_4', name: 'Phòng 4', display_order: 4 },
];

export const INITIAL_DEMO_BEDS = [
  // Phòng 1 (4 giường)
  { id: 'bed_p1_1', name: 'Giường 1', room_id: 'room_1', room_name: 'Phòng 1', display_name: 'Giường 1 (Phòng 1)', is_active: true },
  { id: 'bed_p1_2', name: 'Giường 2', room_id: 'room_1', room_name: 'Phòng 1', display_name: 'Giường 2 (Phòng 1)', is_active: true },
  { id: 'bed_p1_3', name: 'Giường 3', room_id: 'room_1', room_name: 'Phòng 1', display_name: 'Giường 3 (Phòng 1)', is_active: true },
  { id: 'bed_p1_4', name: 'Giường 4', room_id: 'room_1', room_name: 'Phòng 1', display_name: 'Giường 4 (Phòng 1)', is_active: true },

  // Phòng 2 (3 giường)
  { id: 'bed_p2_1', name: 'Giường 1', room_id: 'room_2', room_name: 'Phòng 2', display_name: 'Giường 1 (Phòng 2)', is_active: true },
  { id: 'bed_p2_2', name: 'Giường 2', room_id: 'room_2', room_name: 'Phòng 2', display_name: 'Giường 2 (Phòng 2)', is_active: true },
  { id: 'bed_p2_3', name: 'Giường 3', room_id: 'room_2', room_name: 'Phòng 2', display_name: 'Giường 3 (Phòng 2)', is_active: true },

  // Phòng 3 (2 giường)
  { id: 'bed_p3_1', name: 'Giường 1', room_id: 'room_3', room_name: 'Phòng 3', display_name: 'Giường 1 (Phòng 3)', is_active: true },
  { id: 'bed_p3_2', name: 'Giường 2', room_id: 'room_3', room_name: 'Phòng 3', display_name: 'Giường 2 (Phòng 3)', is_active: true },

  // Phòng 4 (1 giường VIP)
  { id: 'bed_p4_1', name: 'Giường VIP 1', room_id: 'room_4', room_name: 'Phòng 4', display_name: 'Giường VIP 1 (Phòng 4)', is_active: true },
];

export const DEFAULT_FACILITIES = INITIAL_DEMO_BEDS;

export const TIMELINE_SLOTS = [
  '00:00', '00:30', '01:00', '01:30', '02:00', '02:30', '03:00', '03:30',
  '04:00', '04:30', '05:00', '05:30', '06:00', '06:30', '07:00', '07:30',
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
  '20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00', '23:30', '24:00'
];

export const STATUS_CARD_THEMES = {
  pending: { label: 'Chờ xác nhận', bg: 'bg-amber-50 border-amber-200 text-amber-900', badge: 'bg-amber-100 text-amber-700' },
  confirmed: { label: 'Đã xác nhận', bg: 'bg-blue-50 border-blue-200 text-blue-900', badge: 'bg-blue-100 text-blue-700' },
  checked_in: { label: 'Đã check-in', bg: 'bg-orange-50 border-orange-200 text-orange-900', badge: 'bg-orange-100 text-orange-700' },
  in_progress: { label: 'Đang thực hiện', bg: 'bg-purple-50 border-purple-200 text-purple-900', badge: 'bg-purple-100 text-purple-700' },
  completed: { label: 'Hoàn thành', bg: 'bg-emerald-50 border-emerald-200 text-emerald-900', badge: 'bg-emerald-100 text-emerald-700' },
  cancelled: { label: 'Đã hủy', bg: 'bg-rose-50 border-rose-200 text-rose-900', badge: 'bg-rose-100 text-rose-700' },
};

export function timeStringToMinutes(t) {
  if (!t) return 0;
  const str = String(t).trim();
  const isPM = str.toUpperCase().includes('PM');
  const isAM = str.toUpperCase().includes('AM');
  const clean = str.replace(/(AM|PM)/gi, '').trim();

  let [hours, minutes] = clean.split(':').map(Number);
  if (isNaN(hours)) hours = 9;
  if (isNaN(minutes)) minutes = 0;

  if (isPM && hours < 12) hours += 12;
  if (isAM && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

export function formatMinutesToTime(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function getAppointmentTimes(appt) {
  let startStr = appt.start_time || '09:00';
  let endStr = appt.end_time;

  const startMins = timeStringToMinutes(startStr);

  if (!endStr) {
    const duration = appt.duration_minutes || appt.duration || 60;
    endStr = formatMinutesToTime(startMins + duration);
  }

  let endMins = timeStringToMinutes(endStr);
  if (endMins <= startMins) {
    endMins = startMins + (appt.duration_minutes || 60);
  }

  const durationMins = Math.max(15, endMins - startMins);

  return {
    startMins,
    endMins,
    durationMins,
    displayStart: formatMinutesToTime(startMins),
    displayEnd: formatMinutesToTime(endMins)
  };
}
