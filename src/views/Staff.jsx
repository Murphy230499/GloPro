'use client';
import React, { useEffect, useState } from 'react';
import {
  Plus, Users, CalendarCheck2, Award, Settings2, ChevronRight, ChevronDown, UserRoundCog, Sparkles, Loader2,
  Copy, History, Settings, Receipt, CalendarDays, Clock
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { base44, getCachedPermissions } from '@/api/base44Client';
import { supabase } from '@/api/supabaseClient';
import { useBranch } from '@/lib/BranchContext';
import { useT } from '@/lib/i18n';
import { formatVND } from '@/lib/format';
import { toast } from '@/components/Layout';
import Avatar from '@/components/Avatar';
import { seedStaffData } from '@/lib/seeders/staffSeeder';
import EmptyStateSeeder from '@/components/EmptyStateSeeder';

import dynamic from 'next/dynamic';

const StaffGroupManager = dynamic(() => import('@/components/staff/StaffGroupManager'));
const StaffForm = dynamic(() => import('@/components/staff/StaffForm'));
const StaffDetail = dynamic(() => import('@/components/staff/StaffDetail'));
const ShiftTemplateManager = dynamic(() => import('@/components/staff/ShiftTemplateManager'));
const SchedulerGrid = dynamic(() => import('@/components/staff/SchedulerGrid'));
const AttendanceLog = dynamic(() => import('@/components/staff/AttendanceLog'));
const CommissionMatrix = dynamic(() => import('@/components/staff/CommissionMatrix'));
const AdvancedConfigModal = dynamic(() => import('@/components/staff/AdvancedConfigModal'));
const CopyCommissionModal = dynamic(() => import('@/components/staff/CopyCommissionModal'));
const AuditLogModal = dynamic(() => import('@/components/staff/AuditLogModal'));
const PayrollManager = dynamic(() => import('@/components/staff/PayrollManager'));
const StaffPayrollDetailView = dynamic(() => import('@/components/staff/StaffPayrollDetailView'));

export default function StaffPage() {
  const { t } = useT();

  const ROLES = {
    manager: { label: t('staff.roles.manager', 'Quản lý'), color: '#FF6B9D' },
    receptionist: { label: t('staff.roles.receptionist', 'Lễ tân'), color: '#60A5FA' },
    stylist: { label: t('staff.roles.stylist', 'Kỹ thuật viên tóc'), color: '#A78BFA' },
    barber: { label: t('staff.roles.barber', 'Barber'), color: '#34D399' },
    therapist: { label: t('staff.roles.therapist', 'Chuyên viên Spa'), color: '#FBBF24' },
    nail_tech: { label: t('staff.roles.nail_tech', 'Nail tech'), color: '#F472B6' },
    technician: { label: t('staff.roles.technician', 'Kỹ thuật viên'), color: '#F97316' },
    cashier: { label: t('staff.roles.cashier', 'Thu ngân'), color: '#94A3B8' },
  };

  const MAIN_TABS = [
    { id: 'staff', label: t('staff.tabs.manage', 'Quản lý Nhân viên'), icon: Users },
    { id: 'schedule', label: t('staff.tabs.schedule', 'Lịch làm việc'), icon: CalendarCheck2 },
    { id: 'attendance', label: t('staff.tabs.attendance', 'Chấm công'), icon: UserRoundCog },
    { id: 'commission', label: t('staff.tabs.commission', 'Hoa hồng Nhân viên'), icon: Award },
    { id: 'payroll', label: t('staff.tabs.payroll', 'Bảng tính lương'), icon: Receipt },
  ];

  const SCHEDULE_SUB_TABS = [
    { id: 'grid', label: t('staff.tabs.schedule.grid', 'Bảng xếp ca tuần'), icon: CalendarDays },
    { id: 'templates', label: t('staff.tabs.schedule.templates', 'Quản lý ca làm việc'), icon: Clock },
  ];

  const { currentBranchId } = useBranch();
  const searchParams = useSearchParams();
  const urlTab = searchParams?.get('tab');
  
  const [staff, setStaff] = useState([]);
  const [staffGroups, setStaffGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  const [mainTab, setMainTab] = useState(urlTab || 'staff');
  const urlSubTab = searchParams?.get('sub');
  const [scheduleSubTab, setScheduleSubTab] = useState(urlSubTab || 'grid');
  const [allowedModules, setAllowedModules] = useState(null);

  useEffect(() => {
    async function checkPermissions() {
      try {
        const cached = await getCachedPermissions();
        setAllowedModules(cached);
      } catch (err) {
        console.error('Error checking permissions:', err);
        setAllowedModules('all');
      }
    }
    checkPermissions();
  }, []);

  const visibleTabs = MAIN_TABS.filter(tab => {
    if (!allowedModules || allowedModules === 'all') return true;
    const isAllowed = (key) => !allowedModules.blocked.includes(key);
    if (tab.id === 'staff') return isAllowed('staff_view');
    if (tab.id === 'schedule') return isAllowed('staff_schedule_view');
    if (tab.id === 'attendance') return isAllowed('staff_attendance_view');
    if (tab.id === 'commission') return isAllowed('staff_commission_config');
    if (tab.id === 'payroll') return isAllowed('staff_payroll_view');
    return true;
  });

  useEffect(() => {
    if (visibleTabs.length > 0 && !visibleTabs.some(t => t.id === mainTab)) {
      setMainTab(visibleTabs[0].id);
    }
  }, [allowedModules, visibleTabs, mainTab]);

  useEffect(() => {
    if (urlTab) {
      setMainTab(urlTab);
    }
  }, [urlTab]);

  // Filter state
  const [searchQ, setSearchQ] = useState('');
  const [filterGroup, setFilterGroup] = useState('all');

  // Modal state
  const [showGroupManager, setShowGroupManager] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [detailStaff, setDetailStaff] = useState(null);
  const [selectedPayrollStaff, setSelectedPayrollStaff] = useState(null);

  // Commission Modal States
  const [showAdvancedConfig, setShowAdvancedConfig] = useState(false);
  const [showCopyCommission, setShowCopyCommission] = useState(false);
  const [showAuditLog, setShowAuditLog] = useState(false);

  // Seeding state
  const [seeding, setSeeding] = useState(false);
  const [seedProgress, setSeedProgress] = useState('');

  const loadData = async () => {
    setLoading(true);
    const filter = currentBranchId === 'all' ? {} : { branch_id: currentBranchId };
    
    let stList = [];
    try {
      stList = await base44.entities.Staff.filter(filter);
      const local = localStorage.getItem('glopro_staff');
      if (stList.length === 0 && local) {
        const parsed = JSON.parse(local);
        const idMap = {};
        for (const st of parsed) {
          const { id, ...data } = st;
          const created = await base44.entities.Staff.create(data);
          if (created && created.id) {
            idMap[id] = created.id;
          }
        }
        localStorage.setItem('glopro_staff_id_map', JSON.stringify(idMap));
        stList = await base44.entities.Staff.filter(filter);
      } else if (local) {
        const parsed = JSON.parse(local);
        const idMap = {};
        for (const st of parsed) {
          const matched = stList.find(x => x.name === st.name || x.phone === st.phone);
          if (matched) {
            idMap[st.id] = matched.id;
          }
        }
        localStorage.setItem('glopro_staff_id_map', JSON.stringify(idMap));
      }
    } catch (e) {
      console.error('Lỗi tải nhân viên từ API:', e);
      const local = localStorage.getItem('glopro_staff');
      stList = local ? JSON.parse(local) : [];
    }

    let gpList = [];
    try {
      gpList = await base44.entities.StaffGroup.list();
    } catch (e) {
      console.error('Lỗi tải nhóm nhân viên từ API:', e);
      const localGps = localStorage.getItem('glopro_staff_groups');
      gpList = localGps ? JSON.parse(localGps) : [];
    }

    // Sort by creation time so order stays stable
    stList.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
    setStaff(stList);
    setStaffGroups(gpList);
    setLoading(false);
  };


  useEffect(() => { loadData(); }, [currentBranchId]);

  const handleSaveStaff = async (formData) => {
    const payload = {
      ...formData,
      branch_id: formData.branch_id || (currentBranchId === 'all' ? '' : currentBranchId),
    };
    try {
      if (editingStaff?.id) {
        const updated = await base44.entities.Staff.update(editingStaff.id, payload);
        // Update in-place to prevent card reordering
        setStaff(prev => prev.map(s => s.id === editingStaff.id ? { ...s, ...updated } : s));
        toast.success('Đã cập nhật nhân viên');
      } else {
        const created = await base44.entities.Staff.create(payload);
        // Append new staff to end
        setStaff(prev => [...prev, created]);
        toast.success('Đã thêm nhân viên mới');
      }
      setEditingStaff(null);
    } catch (e) {
      toast.error('Lỗi lưu nhân viên: ' + (e.message || e));
    }
  };

  const handleDeleteStaff = async (s) => {
    if (!window.confirm(`Xoá nhân viên ${s.full_name}? Hành động này không thể hoàn tác.`)) return;
    try {
      // Kiểm tra lịch hẹn
      const appointments = await base44.entities.Appointment.filter({ staff_id: s.id });
      if (appointments.length > 0) {
        toast.error('Nhân viên này đang có lịch hẹn. Không thể xoá!');
        return;
      }

      // Cố gắng xoá lịch làm việc tự động trước (để tránh lỗi khoá ngoại)
      const schedules = await base44.entities.StaffSchedule.filter({ staff_id: s.id });
      for (const sch of schedules) {
        try { await base44.entities.StaffSchedule.delete(sch.id); } catch (e) {}
      }

      // Kiểm tra lại xem đã xoá hết chưa (vì Supabase RLS có thể chặn xoá ngầm mà không báo lỗi)
      const checkSchedules = await base44.entities.StaffSchedule.filter({ staff_id: s.id });
      if (checkSchedules.length > 0) {
        toast.error(`Không thể tự động xoá! Nhân viên này vẫn còn ${checkSchedules.length} ca làm việc chưa được xoá (có thể do lỗi phân quyền RLS Database). Vui lòng sang tab "Lịch làm việc" xoá thủ công trước.`);
        return;
      }

      await base44.entities.Staff.delete(s.id);
      toast.success('Đã xoá nhân viên');
      loadData();
    } catch (e) {
      toast.error('Lỗi xoá nhân viên: ' + (e.message || e));
    }
  };

  const handleSeedData = async () => {
    setSeeding(true);
    try {
      const result = await seedStaffData(currentBranchId, (msg) => setSeedProgress(msg || ''));
      toast.success(`Đã tạo dữ liệu mẫu: ${result.staff} nhân viên, ${result.groups} nhóm, ${result.templates} ca làm việc`);
      loadData();
    } catch (e) {
      toast.error('Lỗi tạo dữ liệu mẫu: ' + (e.message || e));
    } finally {
      setSeeding(false);
      setSeedProgress('');
    }
  };

  // Filter the staff list
  const filteredStaff = staff.filter(s => {
    const q = searchQ.toLowerCase();
    const matchQ = !q || s.full_name.toLowerCase().includes(q) || (s.phone || '').includes(q);
    const matchG = filterGroup === 'all' || s.group_id === filterGroup;
    return matchQ && matchG;
  });

  if (selectedPayrollStaff) {
    return (
      <StaffPayrollDetailView 
        staffData={selectedPayrollStaff} 
        onBack={() => {
          setSelectedPayrollStaff(null);
          setMainTab('payroll');
        }} 
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t('staff.title', 'Nhân sự')}</h1>
          <p className="text-slate-400 text-sm mt-1">{staff.length} {t('staff.active_staff_count', 'nhân viên đang hoạt động')}</p>
        </div>
        {mainTab === 'staff' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowGroupManager(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 font-semibold text-sm text-slate-700 shadow-xs"
            >
              <Settings2 className="w-4 h-4" /> {t('staff.group_btn', 'Nhóm nhân viên')}
            </button>
            <button
              onClick={() => setEditingStaff({})}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm shadow-sm"
            >
              <Plus className="w-4 h-4" /> {t('staff.add_btn', 'Thêm nhân viên')}
            </button>
          </div>
        )}
        {mainTab === 'commission' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAdvancedConfig(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 font-semibold text-sm text-slate-700 shadow-xs"
            >
              <Settings className="w-4 h-4 text-orange-500" /> {t('staff.commission.advanced_config', 'Cài đặt nâng cao')}
            </button>
            <button
              onClick={() => setShowCopyCommission(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 font-semibold text-sm text-slate-700 shadow-xs"
            >
              <Copy className="w-4 h-4 text-blue-500" /> {t('staff.commission.copy', 'Sao chép hoa hồng')}
            </button>
            <button
              onClick={() => setShowAuditLog(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 font-semibold text-sm text-slate-700 shadow-xs"
            >
              <History className="w-4 h-4 text-emerald-500" /> {t('staff.commission.history', 'Lịch sử thao tác')}
            </button>
          </div>
        )}
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex overflow-x-auto gap-1 bg-white border border-slate-100 rounded-2xl p-1 shadow-sm">
        {visibleTabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => { setMainTab(tab.id); window.history.replaceState(null, '', '?tab=' + tab.id); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs whitespace-nowrap transition-all ${
                mainTab === tab.id
                  ? 'bg-orange-500 text-white shadow-sm font-bold'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ========= TAB 1: Staff Management ========= */}
      {mainTab === 'staff' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
            <input
              type="text"
              placeholder={t('staff.search_placeholder', 'Tìm theo tên hoặc SĐT...')}
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              className="flex-1 min-w-[180px] px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-orange-500"
            />
            <div className="relative">
              <select
                value={filterGroup}
                onChange={(e) => setFilterGroup(e.target.value)}
                className="pl-3 pr-8 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-orange-500 appearance-none bg-white min-w-[130px]"
              >
                <option value="all">{t('staff.all_groups', 'Tất cả nhóm')}</option>
                {staffGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Staff Cards Grid */}
          {loading ? (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm animate-pulse h-32" />
              ))}
            </div>
          ) : filteredStaff.length === 0 && !searchQ && filterGroup === 'all' ? (
            <EmptyStateSeeder
              icon={<Users className="w-8 h-8 text-orange-500" />}
              title={t('staff.empty.title', 'Chưa có nhân viên nào')}
              description={t('staff.empty.desc', 'Thêm nhân viên đầu tiên của bạn hoặc tạo nhanh 10 nhân viên mẫu để thiết lập ca làm việc và xếp lịch.')}
              onSeed={handleSeedData}
              seeding={seeding}
              seedProgress={seedProgress}
              onAdd={() => setEditingStaff({})}
              addLabel={t('staff.add_btn', 'Thêm nhân viên')}
              seedLabel={t('staff.empty.seed_btn', 'Tạo 10 nhân viên mẫu')}
            />
          ) : filteredStaff.length === 0 ? (
            <div className="text-center py-20 text-slate-400 text-sm bg-white rounded-2xl border border-slate-100">
              {t('staff.not_found', 'Không tìm thấy nhân viên phù hợp. Thử thay đổi bộ lọc.')}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredStaff.map((s) => {
                const group = staffGroups.find(g => g.id === s.group_id);
                
                return (
                  <div
                    key={s.id}
                    className={`bg-white rounded-2xl p-3 border shadow-sm hover:shadow-md hover:border-slate-200 transition-all group cursor-pointer ${s.is_active === false ? 'opacity-50 border-slate-100 grayscale-[0.2]' : 'border-slate-100'}`}
                    onClick={() => setDetailStaff(s)}
                  >
                    <div className="flex items-start gap-2.5 mb-2.5">
                      <Avatar src={s.avatar_url} name={s.full_name} size={40} color={s.avatar_color || '#A78BFA'} />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-800 truncate text-sm">{s.full_name}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5 truncate flex items-center gap-1">
                          {s.phone ? <span>📞 {s.phone}</span> : <span className="italic">{t('staff.no_phone', 'Chưa có SĐT')}</span>}
                        </div>
                      </div>

                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-orange-500 transition-colors mt-1 shrink-0" />
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {group ? (
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background: group.color + '20', color: group.color }}
                          >
                            {group.name}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                            {t('staff.no_group', 'Chưa có nhóm')}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                        {formatVND(s.base_salary || 0)}/{t('staff.per_month', 'tháng')}
                      </div>
                    </div>

                    <div className="flex gap-2 mt-3 pt-3 border-t border-slate-50">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${s.is_active !== false ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                        {s.is_active !== false ? `✔ ${t('staff.status_active', 'Đang hoạt động')}` : `✗ ${t('staff.status_inactive', 'Ngừng hoạt động')}`}
                      </span>
                      {s.service_ids?.length > 0 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-orange-50 text-orange-600 border border-orange-100">
                          {s.service_ids.length} {t('staff.services_count', 'dịch vụ')}
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setEditingStaff(s)}
                        className="flex-1 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                      >
                        {t('common.edit', 'Chỉnh sửa')}
                      </button>
                      <button
                        onClick={() => handleDeleteStaff(s)}
                        className="py-1.5 px-3 text-xs font-semibold rounded-xl bg-red-50 hover:bg-red-100 text-red-500 transition-colors"
                      >
                        {t('common.delete', 'Xoá')}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========= TAB 2: Schedule (with underline tab bar) ========= */}
      {mainTab === 'schedule' && (
        <div className="space-y-4 font-body">
          {/* Underline Sub-tab Navigation Bar matching user image */}
          <div className="flex items-center gap-5 border-b border-slate-200/80 overflow-x-auto whitespace-nowrap scrollbar-none px-1">
            {SCHEDULE_SUB_TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => { setScheduleSubTab(t.id); window.history.replaceState(null, '', '?tab=' + mainTab + '&sub=' + t.id); }}
                className={`py-2 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                  scheduleSubTab === t.id
                    ? 'border-orange-500 text-orange-500'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {scheduleSubTab === 'grid' && <SchedulerGrid branchId={currentBranchId} />}
          {scheduleSubTab === 'templates' && <ShiftTemplateManager />}
        </div>
      )}

      {/* ========= TAB 3: Attendance ========= */}
      {mainTab === 'attendance' && (
        <AttendanceLog branchId={currentBranchId} />
      )}

      {/* ========= TAB 4: Commission Matrix ========= */}
      {mainTab === 'commission' && (
        <CommissionMatrix branchId={currentBranchId} />
      )}

      {/* ========= TAB 5: Payroll Manager ========= */}
      {mainTab === 'payroll' && (
        <PayrollManager staff={staff} onSelectStaffForDetail={setSelectedPayrollStaff} />
      )}

      {/* ========= Modals ========= */}

      {/* Staff Group Manager */}
      {showGroupManager && (
        <StaffGroupManager
          branchId={currentBranchId}
          onClose={() => setShowGroupManager(false)}
          onChanged={loadData}
        />
      )}

      {/* Staff Form (Create/Edit) */}
      {editingStaff !== null && (
        <StaffForm
          staff={editingStaff}
          branchId={currentBranchId}
          onClose={() => setEditingStaff(null)}
          onSave={handleSaveStaff}
        />
      )}

      {/* Staff Detail Panel */}
      {detailStaff && (
        <StaffDetail
          staff={detailStaff}
          onClose={() => setDetailStaff(null)}
        />
      )}

      {/* Commission Modal Overlays */}
      {showAdvancedConfig && <AdvancedConfigModal onClose={() => setShowAdvancedConfig(false)} />}
      {showCopyCommission && (
        <CopyCommissionModal
          staff={staff}
          onClose={() => setShowCopyCommission(false)}
          onRefresh={() => {
            // Trigger state reload in app
            loadData();
          }}
        />
      )}
      {showAuditLog && <AuditLogModal onClose={() => setShowAuditLog(false)} />}
    </div>
  );
}