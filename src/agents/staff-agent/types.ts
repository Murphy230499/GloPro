export interface IStaff {
  id: string;
  name: string;
  phone: string;
  role: string;
  baseSalary: number;
  commissionRate: number; // percentage e.g. 10%
  is_active: boolean;
  joined_date?: string;
}

export interface IAttendanceRecord {
  id: string;
  staffId: string;
  date: string;
  checkInTime: string;
  checkOutTime?: string;
  status: 'on_time' | 'late' | 'absent' | 'overtime';
  note?: string;
}

export interface ICommissionRecord {
  staffId: string;
  month: string; // YYYY-MM
  serviceCommission: number;
  productCommission: number;
  totalCommission: number;
}

export interface ISalaryCalculation {
  staffId: string;
  month: string;
  baseSalary: number;
  totalCommission: number;
  kpiBonus: number;
  deductions: number;
  netSalary: number;
  status: 'draft' | 'approved' | 'paid';
}

export interface IShiftSchedule {
  id: string;
  staffId: string;
  staffName: string;
  date: string;
  shiftType: 'morning' | 'afternoon' | 'full_day' | 'night';
  startTime: string;
  endTime: string;
}

export interface ILeaveRequest {
  id: string;
  staffId: string;
  staffName: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface IKPITarget {
  staffId: string;
  month: string;
  targetRevenue: number;
  targetServicesCount: number;
  actualRevenue: number;
  actualServicesCount: number;
  achievementPercentage: number;
}

// Tool Input Types
export interface IManageAttendanceInput {
  action: 'check_in' | 'check_out' | 'log_absent' | 'get_summary';
  staffId: string;
  date?: string;
  time?: string;
  note?: string;
}

export interface IManageCommissionInput {
  staffId: string;
  month: string;
  action: 'calculate' | 'adjust';
  adjustmentAmount?: number;
  reason?: string;
}

export interface IManageSalaryInput {
  staffId: string;
  month: string;
  action: 'calculate' | 'approve' | 'pay';
  kpiBonus?: number;
  deductions?: number;
}

export interface IManageScheduleInput {
  action: 'assign_shift' | 'swap_shift' | 'get_schedule';
  staffId: string;
  date: string;
  shiftType?: 'morning' | 'afternoon' | 'full_day' | 'night';
  targetStaffIdForSwap?: string;
}

export interface IEvaluatePerformanceInput {
  staffId: string;
  timeframe?: 'month' | 'quarter' | 'year';
}

export interface IManageLeaveInput {
  action: 'request' | 'approve' | 'reject' | 'list';
  staffId: string;
  startDate?: string;
  endDate?: string;
  reason?: string;
  requestId?: string;
}

export interface IManageKPIInput {
  action: 'set_target' | 'evaluate';
  staffId: string;
  month: string;
  targetRevenue?: number;
  targetServicesCount?: number;
}

export interface IGetStaffRevenueInput {
  staffId?: string;
  month?: string;
}
