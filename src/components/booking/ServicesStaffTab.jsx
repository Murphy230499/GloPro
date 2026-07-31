'use client';
import React, { useState, useEffect } from 'react';
import { Scissors, Users, Save, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { formatVND } from '@/lib/format';

function ToggleItem({ item, enabled, onToggle, imageUrl, subtitle }) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
      enabled ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-50 border-slate-100 opacity-60'
    }`} onClick={onToggle}>
      <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 shrink-0">
        {imageUrl
          ? <img src={imageUrl} alt={item.name} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-slate-400 text-lg">
              {item.name?.[0] || '?'}
            </div>
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 truncate">{item.name}</p>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      <div className={`w-10 h-6 rounded-full relative transition-all shrink-0 ${enabled ? 'bg-pink-500' : 'bg-slate-300'}`}>
        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${enabled ? 'left-5' : 'left-1'}`} />
      </div>
    </div>
  );
}

export default function ServicesStaffTab({ setting, onChange, onSave, saving, branchId }) {
  const [subTab, setSubTab] = useState('services');
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const filter = branchId && branchId !== 'all' ? { branch_id: branchId } : {};
    Promise.all([
      base44.entities.Service.filter(filter).catch(() => []),
      base44.entities.Staff.filter(filter).catch(() => []),
    ]).then(([s, st]) => {
      setServices((s || []).filter(x => x.is_active !== false));
      setStaff((st || []).filter(x => x.is_active !== false));
    }).finally(() => setLoading(false));
  }, [branchId]);

  const enabledServices = setting?.enabled_service_ids || [];
  const enabledStaff = setting?.enabled_staff_ids || [];

  const isServiceEnabled = (id) => enabledServices.length === 0 || enabledServices.includes(id);
  const isStaffEnabled = (id) => enabledStaff.length === 0 || enabledStaff.includes(id);

  const toggleService = (id) => {
    let current = enabledServices.length === 0 ? services.map(s => s.id) : [...enabledServices];
    const next = current.includes(id) ? current.filter(x => x !== id) : [...current, id];
    onChange({ ...setting, enabled_service_ids: next.length === services.length ? [] : next });
  };

  const toggleStaff = (id) => {
    let current = enabledStaff.length === 0 ? staff.map(s => s.id) : [...enabledStaff];
    const next = current.includes(id) ? current.filter(x => x !== id) : [...current, id];
    onChange({ ...setting, enabled_staff_ids: next.length === staff.length ? [] : next });
  };

  const enableAllServices = () => onChange({ ...setting, enabled_service_ids: [] });
  const disableAllServices = () => onChange({ ...setting, enabled_service_ids: [] });
  const enableAllStaff = () => onChange({ ...setting, enabled_staff_ids: [] });

  return (
    <div className="space-y-4">
      {/* Sub tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl w-fit">
        {[
          { id: 'services', label: '✂️ Dịch vụ', count: services.length },
          { id: 'staff', label: '👥 Nhân viên', count: staff.length },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              subTab === t.id ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-600">{t.count}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-3 border-pink-200 border-t-pink-500 rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Services */}
          {subTab === 'services' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <p className="text-xs text-slate-500">
                  {enabledServices.length === 0
                    ? `Tất cả ${services.length} dịch vụ được bật`
                    : `${enabledServices.length}/${services.length} dịch vụ được bật`
                  }
                </p>
                <div className="flex gap-2">
                  <button onClick={enableAllServices} className="text-xs text-pink-500 font-medium hover:text-pink-700">
                    Bật tất cả
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                {services.map(s => (
                  <ToggleItem
                    key={s.id}
                    item={s}
                    enabled={isServiceEnabled(s.id)}
                    onToggle={() => toggleService(s.id)}
                    imageUrl={s.image_url || s.image}
                    subtitle={s.price ? formatVND(s.price) + (s.duration_minutes ? ` · ${s.duration_minutes} phút` : '') : ''}
                  />
                ))}
                {services.length === 0 && (
                  <p className="text-center text-slate-400 text-sm py-8">
                    Chưa có dịch vụ nào. Thêm dịch vụ trong module <strong>Danh mục</strong>.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Staff */}
          {subTab === 'staff' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <p className="text-xs text-slate-500">
                  {enabledStaff.length === 0
                    ? `Tất cả ${staff.length} nhân viên được bật`
                    : `${enabledStaff.length}/${staff.length} nhân viên được bật`
                  }
                </p>
                <button onClick={enableAllStaff} className="text-xs text-pink-500 font-medium hover:text-pink-700">
                  Bật tất cả
                </button>
              </div>
              <div className="space-y-2">
                {staff.map(s => (
                  <ToggleItem
                    key={s.id}
                    item={s}
                    enabled={isStaffEnabled(s.id)}
                    onToggle={() => toggleStaff(s.id)}
                    imageUrl={s.avatar_url || s.avatar}
                    subtitle={s.role || s.position || ''}
                  />
                ))}
                {staff.length === 0 && (
                  <p className="text-center text-slate-400 text-sm py-8">
                    Chưa có nhân viên nào. Thêm trong module <strong>Nhân viên</strong>.
                  </p>
                )}
              </div>
            </div>
          )}
        </>
      )}

      <button
        onClick={onSave}
        disabled={saving}
        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold text-sm shadow-lg shadow-pink-200 hover:from-pink-600 hover:to-rose-600 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {saving ? 'Đang lưu...' : 'Lưu cài đặt'}
      </button>
    </div>
  );
}
