import { IAppointment, ISchedulingConflict } from './types';

function parseTimeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function formatMinutesToTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export function checkSchedulingConflict(
  existingAppointments: IAppointment[],
  staffName: string,
  date: string,
  startTime: string,
  durationMinutes: number = 45,
  excludeAppointmentId?: string
): ISchedulingConflict {
  const reqStart = parseTimeToMinutes(startTime);
  const reqEnd = reqStart + durationMinutes;

  const sameDayAppts = existingAppointments.filter(a =>
    a.date === date &&
    a.status !== 'cancelled' &&
    a.id !== excludeAppointmentId &&
    a.staff_name &&
    (a.staff_name.toLowerCase().includes(staffName.toLowerCase()) || staffName.toLowerCase().includes(a.staff_name.toLowerCase()))
  );

  for (const appt of sameDayAppts) {
    const apptStart = parseTimeToMinutes(appt.start_time);
    const apptDuration = appt.service_duration_minutes || 45;
    const apptEnd = apptStart + apptDuration;

    // Overlap condition: (StartA < EndB) and (EndA > StartB)
    if (reqStart < apptEnd && reqEnd > apptStart) {
      // Conflict detected! Generate alternative available slots
      const suggestedTimeSlots: string[] = [];
      
      // Try 30 mins before, 45 mins after, 90 mins after
      const candidateMinutes = [reqStart - 45, reqEnd + 15, reqEnd + 60];
      for (const cand of candidateMinutes) {
        if (cand >= 8 * 60 && cand + durationMinutes <= 20 * 60) {
          suggestedTimeSlots.push(formatMinutesToTime(cand));
        }
      }

      return {
        hasConflict: true,
        conflictingAppointment: appt,
        suggestedTimeSlots
      };
    }
  }

  return { hasConflict: false };
}
