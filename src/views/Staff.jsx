'use client';
import React, { useEffect, useState } from 'react';
import {
  Plus, Users, CalendarCheck2, Award, Settings2, ChevronRight, UserRoundCog, Sparkles, Loader2
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useBranch } from '@/lib/BranchContext';
import { formatVND } from '@/lib/format';
import { toast } from '@/components/Layout';
import Avatar from '@/components/Avatar';
import { seedStaffData } from '@/lib/seeders/staffSeeder';
import EmptyStateSeeder from '@/components/EmptyStateSeeder';

// --- Sub-components (imported) ---
import StaffGroupManager from '@/components/staff/StaffGroupManager';
import StaffForm from '@/components/staff/StaffForm';
import StaffDetail from '@/components/staff/StaffDetail';
import ShiftTemplateManager from '@/components/staff/ShiftTemplateManager';
import SchedulerGrid from '@/components/staff/SchedulerGrid';
import AttendanceLog from '@/components/staff/AttendanceLog';
import CommissionMatrix from '@/components/staff/CommissionMatrix';

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

const MAIN_TABS = [
  { id: 'staff', label: 'Quản lý Nhân viên', icon: Users },
  { id: 'schedule', label: 'Lịch làm việc', icon: CalendarCheck2 },
  { id: 'attendance', label: 'Theo dõi Chấm công', icon: UserRoundCog },
  { id: 'commission', label: 'Hoa hồng Nhân viên', icon: Award },
];

const SCHEDULE_SUB_TABS = [
  { id: 'grid', label: 'Bảng xếp ca tuần' },
  { id: 'templates', label: 'Quản lý ca' },
];


export default function StaffPage() {
  const { currentBranchId } = useBranch();
  const [staff, setStaff] = useState([]);
  const [staffGroups, setStaffGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  const [mainTab, setMainTab] = useState('staff');
  const [scheduleSubTab, setScheduleSubTab] = useState('grid');

  // Filter state
  const [searchQ, setSearchQ] = useState('');
  const [filterGroup, setFilterGroup] = useState('all');

  // Modal state
  const [showGroupManager, setShowGroupManager] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [detailStaff, setDetailStaff] = useState(null);

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
        for (const st of parsed) {
          const { id, ...data } = st;
          await base44.entities.Staff.create(data);
        }
        stList = await base44.entities.Staff.filter(filter);
      }
    } catch (e) {
      console.error('Lỗi tải nhân viên từ API:', e);
      const local = localStorage.getItem('glopro_staff');
      stList = local ? JSON.parse(local) : [];
    }

    let gpList = [];
    try {
      gpList = await base44.entities.StaffGroup.list();
      const localGps = localStorage.getItem('glopro_staff_groups');
      if (gpList.length === 0 && localGps) {
        const parsed = JSON.parse(localGps);
        for (const g of parsed) {
          const { id, ...data } = g;
          await base44.entities.StaffGroup.create(data);
        }
        gpList = await base44.entities.StaffGroup.list();
      }
    } catch (e) {
      console.error('Lỗi tải nhóm nhân viên từ API:', e);
      const localGps = localStorage.getItem('glopro_staff_groups');
      gpList = localGps ? JSON.parse(localGps) : [];
    }

    setStaff(stList.filter(x => x.is_active !== false));
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
        await base44.entities.Staff.update(editingStaff.id, payload);
        toast.success('Đã cập nhật nhân viên');
      } else {
        await base44.entities.Staff.create(payload);
        toast.success('Đã thêm nhân viên mới');
      }
      setEditingStaff(null);
      loadData();
    } catch (e) {
      toast.error('Lỗi lưu nhân viên: ' + (e.message || e));
    }
  };

  const handleDeleteStaff = async (s) => {
    if (!window.confirm(`Xoá nhân viên ${s.full_name}? Hành động này không thể hoàn tác.`)) return;
    try {
      await base44.entities.Staff.update(s.id, { is_active: false });
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

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Nhân sự</h1>
          <p className="text-slate-400 text-sm mt-1">{staff.length} nhân viên đang hoạt động</p>
        </div>
        {mainTab === 'staff' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowGroupManager(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 font-semibold text-sm text-slate-700 shadow-xs"
            >
              <Settings2 className="w-4 h-4" /> Nhóm nhân viên
            </button>
            <button
              onClick={() => setEditingStaff({})}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-semibold text-sm shadow-sm"
            >
              <Plus className="w-4 h-4" /> Thêm nhân viên
            </button>
          </div>
        )}
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex overflow-x-auto gap-1 bg-white border border-slate-100 rounded-2xl p-1 shadow-sm">
        {MAIN_TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setMainTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs whitespace-nowrap transition-all ${
                mainTab === tab.id
                  ? 'bg-purple-500 text-white shadow-sm'
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
              placeholder="Tìm theo tên hoặc SĐT..."
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              className="flex-1 min-w-[180px] px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-purple-400"
            />
            <select
              value={filterGroup}
              onChange={(e) => setFilterGroup(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-purple-400"
            >
              <option value="all">Tất cả nhóm</option>
              {staffGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>

          {/* Staff Cards Grid */}
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm animate-pulse h-32" />
              ))}
            </div>
          ) : filteredStaff.length === 0 && !searchQ && filterGroup === 'all' ? (
            <EmptyStateSeeder
              icon={<Users className="w-8 h-8 text-purple-500" />}
              title="Chưa có nhân viên nào"
              description="Thêm nhân viên đầu tiên của bạn hoặc tạo nhanh 10 nhân viên mẫu để thiết lập ca làm việc và xếp lịch."
              onSeed={handleSeedData}
              seeding={seeding}
              seedProgress={seedProgress}
              onAdd={() => setEditingStaff({})}
              addLabel="Thêm nhân viên"
              seedLabel="Tạo 10 nhân viên mẫu"
            />
          ) : filteredStaff.length === 0 ? (
            <div className="text-center py-20 text-slate-400 text-sm bg-white rounded-2xl border border-slate-100">
              Không tìm thấy nhân viên phù hợp. Thử thay đổi bộ lọc.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredStaff.map((s) => {
                const role = ROLES[s.role] || { label: s.role, color: '#94A3B8' };
                const group = staffGroups.find(g => g.id === s.group_id);
                
                return (
                  <div
                    key={s.id}
                    className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all group cursor-pointer"
                    onClick={() => setDetailStaff(s)}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <Avatar src={s.avatar_url} name={s.full_name} size={48} color={s.avatar_color || '#A78BFA'} />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-800 truncate text-sm">{s.full_name}</div>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background: role.color + '20', color: role.color }}
                          >
                            {role.label}
                          </span>
                          {group && (
                            <span
                              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                              style={{ background: group.color + '20', color: group.color }}
                            >
                              {group.name}
                            </span>
                          )}
                        </div>
                      </div>

                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-purple-500 transition-colors mt-1 shrink-0" />
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <div>
                        {s.phone && <span>📞 {s.phone}</span>}
                      </div>
                      <div className="font-semibold text-emerald-600">
                        {formatVND(s.base_salary || 0)}/tháng
                      </div>
                    </div>

                    <div className="flex gap-2 mt-3 pt-3 border-t border-slate-50">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${s.can_be_booked !== false ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                        {s.can_be_booked !== false ? '✔ Nhận lịch hẹn' : '✗ Không nhận lịch'}
                      </span>
                      {s.service_ids?.length > 0 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-purple-50 text-purple-600 border border-purple-100">
                          {s.service_ids.length} dịch vụ
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setEditingStaff(s)}
                        className="flex-1 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                      >
                        Chỉnh sửa
                      </button>
                      <button
                        onClick={() => handleDeleteStaff(s)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-red-50 hover:bg-red-100 text-red-500 transition-colors"
                      >
                        Xoá
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========= TAB 2: Schedule (with sub-tabs) ========= */}
      {mainTab === 'schedule' && (
        <div className="space-y-4">
          {/* Sub-tabs */}
          <div className="flex gap-2 bg-white border border-slate-100 rounded-2xl p-1 shadow-sm w-fit">
            {SCHEDULE_SUB_TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setScheduleSubTab(t.id)}
                className={`px-4 py-2 rounded-xl font-semibold text-xs whitespace-nowrap transition-all ${
                  scheduleSubTab === t.id
                    ? 'bg-purple-500 text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50'
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
      {detailStaff !== null && (
        <StaffDetail
          staff={detailStaff}
          onClose={() => setDetailStaff(null)}
        />
      )}
    </div>
  );
}