export interface IAppointment {
  id: string;
  customer_id?: string;
  customer_name: string;
  customer_phone: string;
  service_id?: string;
  service_name: string;
  service_duration_minutes?: number;
  staff_id?: string;
  staff_name: string;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:MM
  end_time?: string; // HH:MM
  status: 'pending' | 'confirmed' | 'checked_in' | 'in_service' | 'completed' | 'cancelled';
  note?: string;
  created_at?: string;
}

export interface ISchedulingConflict {
  hasConflict: boolean;
  conflictingAppointment?: IAppointment;
  suggestedTimeSlots?: string[];
}

// 1. Book
export interface IBookAppointmentInput {
  customerName: string;
  customerPhone: string;
  serviceName: string;
  staffName?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  durationMinutes?: number;
  note?: string;
}

// 2. Reschedule
export interface IRescheduleAppointmentInput {
  appointmentId: string;
  newDate: string;
  newStartTime: string;
  reason?: string;
}

// 3. Cancel
export interface ICancelAppointmentInput {
  appointmentId: string;
  reason: string;
}

// 4. Find Available Employee
export interface IFindAvailableEmployeeInput {
  date: string;
  startTime: string;
  durationMinutes?: number;
}

// 5. Waiting List
export interface IWaitingListInput {
  action: 'add' | 'remove' | 'list';
  customerName?: string;
  customerPhone?: string;
  preferredDate?: string;
  preferredTime?: string;
  serviceName?: string;
  entryId?: string;
}

// 6. Reminder
export interface ISendReminderInput {
  appointmentId: string;
  channel?: 'sms' | 'zalo' | 'email';
}

// 7. Check-in
export interface ICheckInInput {
  appointmentId: string;
}

// 8. Check-out
export interface ICheckOutInput {
  appointmentId: string;
  paymentMethod?: 'cash' | 'transfer' | 'card';
}
