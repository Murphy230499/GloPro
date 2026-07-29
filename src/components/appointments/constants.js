export const DEFAULT_FACILITIES = [
  { id: 'fac_nail_1', name: 'Bàn Làm Nail 1', category: 'Dịch vụ Nail', icon: '💅' },
  { id: 'fac_nail_2', name: 'Bàn Làm Nail 2', category: 'Dịch vụ Nail', icon: '💅' },
  { id: 'fac_nail_3', name: 'Bàn Làm Nail 3', category: 'Dịch vụ Nail', icon: '💅' },
  { id: 'fac_nail_4', name: 'Bàn Làm Nail 4', category: 'Dịch vụ Nail', icon: '💅' },
  { id: 'fac_room_1', name: 'Phòng Spa VIP 1', category: 'Spa & Chăm sóc', icon: '💆‍♀️' },
  { id: 'fac_room_2', name: 'Phòng Spa VIP 2', category: 'Spa & Chăm sóc', icon: '💆‍♀️' },
  { id: 'fac_vip_1', name: 'Ghế Cắt Tóc VIP 1', category: 'Tóc & Hóa chất', icon: '💇‍♀️' },
  { id: 'fac_vip_2', name: 'Ghế Cắt Tóc VIP 2', category: 'Tóc & Hóa chất', icon: '💇‍♀️' },
];

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
