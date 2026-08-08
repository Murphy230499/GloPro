import { useT } from '@/lib/i18n';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Plus, CalendarDays, Users, Gift, Wallet } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, startOfMonth, endOfMonth } from "date-fns";
import Avatar from '@/components/Avatar';
import RunPayrollModal from './RunPayrollModal';
import AddAdjustmentModal from './AddAdjustmentModal';
import StaffPayrollDetailView from './StaffPayrollDetailView';
import { toast } from '@/components/Layout';
import { Checkbox } from '@/components/ui/checkbox';

const PAYROLL_COLUMNS = [
  { id: 'shifts', label: 'Tổng số ca', type: 'text' },
  { id: 'daysOff', label: 'Số ngày nghỉ', type: 'num' },
  { id: 'salary', label: 'Lương CB', type: 'money' },
  { id: 'noServices', label: 'Số dịch vụ', type: 'num' },
  { id: 'serviceSales', label: 'Doanh số DV', type: 'money' },
  { id: 'serviceCom', label: 'Hoa hồng DV', type: 'money' },
  { id: 'noTreatment', label: 'Số liệu trình', type: 'num' },
  { id: 'treatmentSales', label: 'Doanh thu LT', type: 'money' },
  { id: 'treatmentCom', label: 'Hoa hồng LT', type: 'money' },
  { id: 'noPackage', label: 'Số gói DV', type: 'num' },
  { id: 'packageSales', label: 'Doanh thu gói DV', type: 'money' },
  { id: 'packageCom', label: 'Hoa hồng gói DV', type: 'money' },
  { id: 'noServiceCombo', label: 'Số combo DV', type: 'num' },
  { id: 'serviceComboSales', label: 'Doanh thu combo DV', type: 'money' },
  { id: 'serviceComboCom', label: 'Hoa hồng combo DV', type: 'money' },
  { id: 'noProductCombo', label: 'Số combo SP', type: 'num' },
  { id: 'productComboSales', label: 'Doanh thu combo SP', type: 'money' },
  { id: 'productComboCom', label: 'Hoa hồng combo SP', type: 'money' },
  { id: 'noProduct', label: 'Số sản phẩm', type: 'num' },
  { id: 'productSales', label: 'Doanh số SP', type: 'money' },
  { id: 'productCom', label: 'Hoa hồng SP', type: 'money' },
  { id: 'noPrepaidCard', label: 'Số thẻ TM', type: 'num' },
  { id: 'prepaidCardSales', label: 'Doanh thu thẻ TM', type: 'money' },
  { id: 'prepaidCardCom', label: 'Hoa hồng thẻ TM', type: 'money' },
  { id: 'requestedCom', label: 'HH khách yêu cầu', type: 'money' },
  { id: 'overtimeCom', label: 'HH tăng ca', type: 'money' },
  { id: 'revenueCom', label: 'HH doanh thu', type: 'money' },
  { id: 'tip', label: 'Tiền Tip', type: 'money' },
  { id: 'bonus', label: 'Thưởng', type: 'money' },
  { id: 'penalty', label: 'Phạt', type: 'money' },
  { id: 'total', label: 'Tổng nhận', type: 'money', isBold: true, px: 'px-5' }
];

const ROLES = {
  manager: { label: 'Quản lý', color: '#FF6B9D' },
  receptionist: { label: 'Lễ tân', color: '#60A5FA' },
  stylist: { label: 'Kỹ thuật viên tóc', color: '#A78BFA' },
  barber: { label: 'Barber', color: '#34D399' },
  therapist: { label: 'Chuyên viên Spa', color: '#FBBF24' },
  nail_tech: { label: 'Nail tech', color: '#F472B6' },
  technician: { label: 'Kỹ thuật viên', color: '#F97316' },
  cashier: { label: 'Thu ngân', color: '#94A3B8' },
};

export default function PayrollRunTab({ staff = [], onRunPayroll, onSelectStaffForDetail }) {
  const { t } = useT();
  const router = useRouter();
  const [isStaffDropdownOpen, setIsStaffDropdownOpen] = useState(false);
  const [selectedStaffIds, setSelectedStaffIds] = useState(staff.map(s => s.id));
  const [staffSearch, setStaffSearch] = useState('');
  
  const [date, setDate] = useState({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) });
  const [tempDate, setTempDate] = useState({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) });
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const [visibleColumns, setVisibleColumns] = useState(PAYROLL_COLUMNS.map(c => c.id));
  const [tempVisibleColumns, setTempVisibleColumns] = useState(PAYROLL_COLUMNS.map(c => c.id));
  const [isColumnPickerOpen, setIsColumnPickerOpen] = useState(false);

  const [isRunPayrollModalOpen, setIsRunPayrollModalOpen] = useState(false);
  const [isAddAdjustmentModalOpen, setIsAddAdjustmentModalOpen] = useState(false);
  const [selectedStaffForDetail, setSelectedStaffForDetail] = useState(null);
  const [adjustments, setAdjustments] = useState([]);

  if (selectedStaffForDetail) {
    return (
      <StaffPayrollDetailView 
        staffData={selectedStaffForDetail} 
        dateRange={date} 
        onBack={() => setSelectedStaffForDetail(null)} 
      />
    );
  }

  const groupedStaff = staff.reduce((acc, emp) => {
    const role = emp.role || 'Chưa phân nhóm';
    if (!acc[role]) acc[role] = [];
    acc[role].push(emp);
    return acc;
  }, {});

  const handleSelectAllStaff = () => {
    if (selectedStaffIds.length === staff.length) {
      setSelectedStaffIds([]);
    } else {
      setSelectedStaffIds(staff.map(s => s.id));
    }
  };

  const handleToggleStaff = (id) => {
    if (selectedStaffIds.includes(id)) {
      setSelectedStaffIds(selectedStaffIds.filter(sId => sId !== id));
    } else {
      setSelectedStaffIds([...selectedStaffIds, id]);
    }
  };

  const handleToggleStaffGroup = (groupMembers) => {
    const groupIds = groupMembers.map(m => m.id);
    const allSelected = groupIds.every(id => selectedStaffIds.includes(id));
    if (allSelected) {
      setSelectedStaffIds(selectedStaffIds.filter(id => !groupIds.includes(id)));
    } else {
      const nextIds = [...selectedStaffIds];
      groupIds.forEach(id => {
        if (!nextIds.includes(id)) nextIds.push(id);
      });
      setSelectedStaffIds(nextIds);
    }
  };

  const displayStaff = selectedStaffIds.length === 0 
    ? staff 
    : staff.filter(s => selectedStaffIds.includes(s.id));

  const payrollData = displayStaff.map(s => {
    const randomShifts = Math.floor(Math.random() * 10) + 20;
    const randomHours = Math.floor(randomShifts * (4 + Math.random()));
    
    const staffAdjustments = adjustments.filter(adj => adj.staffIds.includes(s.id));
    const bonus = staffAdjustments.filter(adj => adj.type === 'bonus').reduce((sum, adj) => sum + adj.amount, 0);
    const penalty = staffAdjustments.filter(adj => adj.type === 'penalty').reduce((sum, adj) => sum + adj.amount, 0);
    const totalPay = (s.base_salary || 0) + bonus - penalty;

    return {
    id: s.id,
    name: s.full_name || 'No Name',
    role: s.role,
    avatar_url: s.avatar_url,
    avatar_color: s.avatar_color || '#94A3B8',
    shifts: `${randomShifts} Ca/ ${randomHours}h`,
    daysOff: Math.floor(Math.random() * 4),
    salary: s.base_salary || 0,
    noServices: 0,
    serviceSales: 0,
    serviceCom: 0,
    noTreatment: 0,
    treatmentSales: 0,
    treatmentCom: 0,
    noPackage: 0,
    packageSales: 0,
    packageCom: 0,
    noServiceCombo: 0,
    serviceComboSales: 0,
    serviceComboCom: 0,
    noProductCombo: 0,
    productComboSales: 0,
    productComboCom: 0,
    noProduct: 0,
    productSales: 0,
    productCom: 0,
    noPrepaidCard: 0,
    prepaidCardSales: 0,
    prepaidCardCom: 0,
    requestedCom: 0,
    overtimeCom: 0,
    revenueCom: 0,
    tip: 0,
    bonus,
    penalty,
    total: totalPay,
  };
  });
  // Format currency wrapper
  const formatMoney = (val) => `${new Intl.NumberFormat('vi-VN').format(val || 0)}đ`;
  const formatNum = (val) => new Intl.NumberFormat('vi-VN').format(val || 0);

  const totals = payrollData.reduce((acc, row) => {
    row.total = row.salary + row.serviceCom + row.treatmentCom + row.packageCom + row.serviceComboCom + row.productComboCom + row.productCom + row.prepaidCardCom + row.requestedCom + row.overtimeCom + row.revenueCom + row.tip + row.bonus - row.penalty;
    return {
    shifts: '',
    daysOff: acc.daysOff + row.daysOff,
    salary: acc.salary + row.salary,
    noServices: acc.noServices + row.noServices,
    serviceSales: acc.serviceSales + row.serviceSales,
    serviceCom: acc.serviceCom + row.serviceCom,
    noTreatment: acc.noTreatment + row.noTreatment,
    treatmentSales: acc.treatmentSales + row.treatmentSales,
    treatmentCom: acc.treatmentCom + row.treatmentCom,
    noPackage: acc.noPackage + row.noPackage,
    packageSales: acc.packageSales + row.packageSales,
    packageCom: acc.packageCom + row.packageCom,
    noServiceCombo: acc.noServiceCombo + row.noServiceCombo,
    serviceComboSales: acc.serviceComboSales + row.serviceComboSales,
    serviceComboCom: acc.serviceComboCom + row.serviceComboCom,
    noProductCombo: acc.noProductCombo + row.noProductCombo,
    productComboSales: acc.productComboSales + row.productComboSales,
    productComboCom: acc.productComboCom + row.productComboCom,
    noProduct: acc.noProduct + row.noProduct,
    productSales: acc.productSales + row.productSales,
    productCom: acc.productCom + row.productCom,
    noPrepaidCard: acc.noPrepaidCard + row.noPrepaidCard,
    prepaidCardSales: acc.prepaidCardSales + row.prepaidCardSales,
    prepaidCardCom: acc.prepaidCardCom + row.prepaidCardCom,
    requestedCom: acc.requestedCom + row.requestedCom,
    overtimeCom: acc.overtimeCom + row.overtimeCom,
    revenueCom: acc.revenueCom + row.revenueCom,
    tip: acc.tip + row.tip,
    bonus: acc.bonus + row.bonus,
    penalty: acc.penalty + row.penalty,
    total: acc.total + row.total,
  };
  }, {
    shifts: '', daysOff: 0, salary: 0, 
    noServices: 0, serviceSales: 0, serviceCom: 0,
    noTreatment: 0, treatmentSales: 0, treatmentCom: 0,
    noPackage: 0, packageSales: 0, packageCom: 0,
    noServiceCombo: 0, serviceComboSales: 0, serviceComboCom: 0,
    noProductCombo: 0, productComboSales: 0, productComboCom: 0,
    noProduct: 0, productSales: 0, productCom: 0, 
    noPrepaidCard: 0, prepaidCardSales: 0, prepaidCardCom: 0,
    requestedCom: 0, overtimeCom: 0, revenueCom: 0,
    tip: 0, bonus: 0, penalty: 0, total: 0
  });

  return (
    <div className="space-y-4">
      {/* Top Controls */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                onClick={() => setTempDate(date)}
                className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-normal text-slate-700 focus:border-orange-500 shadow-sm min-w-[200px]"
              >
                {date?.from ? (
                  date.to ? (
                    <>
                      <CalendarDays className="w-4 h-4 text-orange-500" />
                      {format(date.from, "dd/MM/yyyy")} - {format(date.to, "dd/MM/yyyy")}
                    </>
                  ) : (
                    <>
                      <CalendarDays className="w-4 h-4 text-orange-500" />
                      {format(date.from, "dd/MM/yyyy")}
                    </>
                  )
                ) : (
                  <>
                    <CalendarDays className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-400 lowercase">{t('staff.payroll.date_placeholder', 'khoảng thời gian')}</span>
                  </>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-2xl shadow-xl border-slate-200" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={tempDate?.from}
                selected={tempDate}
                onSelect={setTempDate}
                numberOfMonths={1}
                className="p-3"
              />
              <div className="p-3 border-t border-slate-100 flex items-center justify-between gap-3 bg-white rounded-b-2xl">
                <button 
                  onClick={() => setIsDatePickerOpen(false)}
                  className="flex-1 py-1.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 transition-colors"
                >
                  {t('staff.scheduler.cancel', 'Hủy')}
                </button>
                <button 
                  onClick={() => { setDate(tempDate); setIsDatePickerOpen(false); }}
                  className="flex-1 py-1.5 rounded-xl bg-orange-500 text-sm font-medium text-white hover:bg-orange-600 transition-colors"
                >
                  {t('staff.commission.apply_btn', 'Áp dụng')}
                </button>
              </div>
            </PopoverContent>
          </Popover>
          
          <div className="relative min-w-[180px]">
            <button
              type="button"
              onClick={() => setIsStaffDropdownOpen(!isStaffDropdownOpen)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 focus:border-orange-500 shadow-sm"
            >
              <span className={`flex items-center gap-2 truncate ${selectedStaffIds.length === 0 || selectedStaffIds.length === staff.length ? 'text-slate-400/80 font-normal lowercase text-[13px]' : ''}`}>
                <Users className="w-4 h-4 shrink-0 text-slate-400" />
                {selectedStaffIds.length === 0 
                  ? t('staff.payroll.all_staff', 'tất cả nhân viên') 
                  : selectedStaffIds.length === staff.length 
                    ? t('staff.payroll.all_staff', 'tất cả nhân viên') 
                    : t('staff.payroll.selected_staff', 'Đã chọn {count} nhân viên').replace('{count}', selectedStaffIds.length)}
              </span>
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
            </button>

            {isStaffDropdownOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setIsStaffDropdownOpen(false)} />
                <div className="absolute left-0 top-full mt-1 w-[260px] bg-white rounded-2xl border border-slate-200 shadow-xl z-30 flex flex-col max-h-80 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 border-b border-slate-100">
                    <input
                      type="text"
                      placeholder={t("staff.commission.search_staff", "tìm kiếm nhân viên...")}
                      value={staffSearch}
                      onChange={(e) => setStaffSearch(e.target.value)}
                      className="w-full bg-transparent text-xs font-medium outline-none text-slate-700 placeholder:text-slate-400/50 placeholder:font-normal placeholder:lowercase"
                    />
                  </div>
                  <div className="overflow-y-auto p-2 space-y-2">
                    <label className="flex items-center gap-2.5 px-2 py-1.5 hover:bg-slate-50 rounded-xl cursor-pointer select-none">
                      <Checkbox 
                        checked={selectedStaffIds.length === staff.length && staff.length > 0}
                        onCheckedChange={handleSelectAllStaff}
                        className="border-slate-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500 data-[state=checked]:text-white focus-visible:ring-orange-500 cursor-pointer"
                      />
                      <span className="text-xs font-normal text-slate-700">{t('staff.commission.select_all', 'Chọn tất cả')}</span>
                    </label>

                    {Object.entries(groupedStaff).map(([roleName, members]) => {
                      const visibleMembers = members.filter(m => m.full_name.toLowerCase().includes(staffSearch.toLowerCase()));
                      if (visibleMembers.length === 0) return null;

                      const isGroupAllSelected = visibleMembers.every(m => selectedStaffIds.includes(m.id));

                      return (
                        <div key={roleName} className="space-y-0.5">
                          <label className="flex items-center gap-2.5 px-2 py-1.5 hover:bg-slate-50 rounded-xl cursor-pointer select-none">
                            <Checkbox 
                              checked={isGroupAllSelected}
                              onCheckedChange={() => handleToggleStaffGroup(visibleMembers)}
                              className="border-slate-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500 data-[state=checked]:text-white focus-visible:ring-orange-500 cursor-pointer"
                            />
                            <span className="text-[10px] font-normal text-slate-400 uppercase tracking-wider">{roleName}</span>
                          </label>
                          
                          <div className="space-y-0.5 pl-4">
                            {visibleMembers.map(m => {
                              const isSelected = selectedStaffIds.includes(m.id);
                              return (
                                <label
                                  key={m.id}
                                  className={`flex items-center gap-2.5 px-2 py-1.5 hover:bg-slate-50 rounded-xl cursor-pointer select-none ${isSelected ? 'bg-slate-100/60 font-medium' : ''}`}
                                >
                                  <Checkbox 
                                    checked={isSelected}
                                    onCheckedChange={() => handleToggleStaff(m.id)}
                                    className="border-slate-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500 data-[state=checked]:text-white focus-visible:ring-orange-500 cursor-pointer"
                                  />
                                  <Avatar src={m.avatar_url} name={m.full_name} size={20} color={m.avatar_color} />
                                  <span className="text-xs font-normal text-slate-700">{m.full_name}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsAddAdjustmentModalOpen(true)}
            className="flex items-center bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-colors"
          >
            <Gift className="w-4 h-4 mr-2 text-slate-500" />
            {t('staff.payroll.add_adjustment', 'Thêm thưởng/phạt')}
          </button>
          <button 
            onClick={() => setIsRunPayrollModalOpen(true)}
            className="flex items-center bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-colors"
          >
            <Wallet className="w-4 h-4 mr-2" />
            {t('staff.payroll.run_payroll', 'Thanh toán lương')}
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-sans min-w-max whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold text-xs">
                <th className="py-4 px-4 text-xs font-bold text-slate-500 min-w-[200px] sticky left-0 bg-slate-50 z-10 border-r border-slate-100">{t('staff.commission.staff_col', 'Nhân viên')}</th>
                {PAYROLL_COLUMNS.map(col => {
                  if (!visibleColumns.includes(col.id)) return null;
                  return (
                    <th key={col.id} className={`py-4 ${col.px || 'px-3'} border-r border-slate-100`}>
                      {t(`staff.payroll.col_${col.id}`, col.label)}
                    </th>
                  );
                })}
                <th className="py-4 px-3 sticky right-0 bg-slate-50 z-10">
                  <Popover open={isColumnPickerOpen} onOpenChange={setIsColumnPickerOpen}>
                    <PopoverTrigger asChild>
                      <button onClick={() => setTempVisibleColumns(visibleColumns)} className="w-6 h-6 rounded-full border border-orange-500 text-orange-500 flex items-center justify-center hover:bg-orange-50 transition-colors bg-white">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[280px] p-0 rounded-2xl shadow-xl border-slate-200" align="end">
                      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 rounded-t-2xl">
                        <span className="text-sm font-medium text-slate-700">{t('staff.payroll.choose_columns', 'Chọn cột muốn hiển thị')}</span>
                      </div>
                      <div className="max-h-[300px] overflow-y-auto p-2 space-y-0.5 custom-scrollbar">
                        {PAYROLL_COLUMNS.map(col => {
                          const isSelected = tempVisibleColumns.includes(col.id);
                          return (
                            <button
                              key={col.id}
                              onClick={() => {
                                if (isSelected) setTempVisibleColumns(tempVisibleColumns.filter(id => id !== col.id));
                                else setTempVisibleColumns([...tempVisibleColumns, col.id]);
                              }}
                              className="w-full flex items-center gap-3 text-left py-2 px-2 hover:bg-slate-50 rounded-xl transition-colors"
                            >
                              <div className={`shrink-0 flex items-center justify-center w-4 h-4 rounded ${isSelected ? 'bg-orange-500 border-orange-500' : 'bg-white border-slate-300'} border`}>
                                {isSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                              </div>
                              <span className="text-sm font-normal text-slate-700">{t(`staff.payroll.col_${col.id}`, col.label)}</span>
                            </button>
                          )
                        })}
                      </div>
                      <div className="p-3 border-t border-slate-100 flex items-center justify-between gap-3 bg-white rounded-b-2xl">
                        <button onClick={() => setIsColumnPickerOpen(false)} className="flex-1 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 transition-colors">
                           Hủy
                        </button>
                        <button onClick={() => { setVisibleColumns(tempVisibleColumns); setIsColumnPickerOpen(false); }} className="flex-1 py-2 rounded-xl bg-orange-500 text-sm font-medium text-white hover:bg-orange-600 transition-colors">
                          {t('staff.commission.apply_btn', 'Áp dụng')}
                        </button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </th>
              </tr>
            </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {payrollData.map((row) => (
              <tr 
                key={row.id} 
                onClick={() => {
                  router.push(`/staff/payroll/${row.id}`);
                }}
                className="hover:bg-orange-50/40 cursor-pointer transition-colors group"
                title={t("staff.payroll.view_detail_tooltip", "Bấm để xem chi tiết lương nhân viên")}
              >
                <td className="py-3 px-4 font-semibold text-sm text-slate-800 sticky left-0 bg-white group-hover:bg-orange-50/80 z-10 border-r border-slate-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <Avatar src={row.avatar_url} name={row.name} size={32} color={row.avatar_color} />
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-xs text-slate-800 group-hover:text-orange-600 transition-colors">{row.name}</div>
                      <span 
                        className="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full mt-0.5"
                        style={{ background: (ROLES[row.role]?.color || '#94A3B8') + '15', color: ROLES[row.role]?.color || '#94A3B8' }}
                      >
                        {ROLES[row.role]?.label || row.role}
                      </span>
                    </div>
                  </div>
                </td>
                {PAYROLL_COLUMNS.map(col => {
                  if (!visibleColumns.includes(col.id)) return null;
                  const value = col.type === 'money' ? formatMoney(row[col.id]) : col.type === 'text' ? row[col.id] : formatNum(row[col.id]);
                  return (
                    <td key={col.id} className={`py-3 ${col.px || 'px-3'} text-xs ${col.isBold ? 'font-semibold text-slate-800' : 'font-normal text-slate-600'} border-r border-slate-100`}>
                      {value}
                    </td>
                  );
                })}
                <td className="py-3 px-3 sticky right-0 bg-white group-hover:bg-orange-50/80 z-10 transition-colors"></td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-50 border-t border-slate-100">
            <tr className="text-xs font-semibold text-slate-800">
              <td className="py-4 px-4 sticky left-0 bg-slate-50 z-10 border-r border-slate-100">{t('staff.payroll.total_sum', 'Tổng cộng')}</td>
              {PAYROLL_COLUMNS.map(col => {
                if (!visibleColumns.includes(col.id)) return null;
                const value = col.type === 'money' ? formatMoney(totals[col.id]) : col.type === 'text' ? totals[col.id] : formatNum(totals[col.id]);
                return (
                  <td key={col.id} className={`py-4 ${col.px || 'px-3'} border-r border-slate-100 ${col.isBold ? 'font-semibold text-slate-800' : ''}`}>
                    {value}
                  </td>
                );
              })}
              <td className="py-4 px-3 sticky right-0 bg-slate-50 z-10"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
      
      <RunPayrollModal 
        isOpen={isRunPayrollModalOpen}
        onClose={() => setIsRunPayrollModalOpen(false)}
        staffData={payrollData}
        dateRange={date}
        onRunPayroll={(newRun) => {
          if (onRunPayroll) onRunPayroll(newRun);
          toast.success(t('staff.payroll.run_success', 'Thanh toán lương thành công!'));
          setIsRunPayrollModalOpen(false);
        }}
      />

      <AddAdjustmentModal
        isOpen={isAddAdjustmentModalOpen}
        onClose={() => setIsAddAdjustmentModalOpen(false)}
        staff={staff}
        onApply={(adj) => setAdjustments(prev => [...prev, adj])}
      />
    </div>
  );
}
