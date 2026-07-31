'use client';
import React, { useState } from 'react';
import { Save, Clock, Calendar, Users, Loader2 } from 'lucide-react';
import WorkingHoursEditor from './WorkingHoursEditor';
import { toast } from '@/components/Layout';

const SLOT_OPTIONS = [
  { value: 15, label: '15 phút' },
  { value: 30, label: '30 phút' },
  { value: 60, label: '60 phút' },
];

const MIN_ADVANCE_OPTIONS = [
  { value: 0, label: 'Không giới hạn' },
  { value: 1, label: '1 giờ' },
  { value: 2, label: '2 giờ' },
  { value: 4, label: '4 giờ' },
  { value: 24, label: '1 ngày' },
];

export default function BookingSettingsTab({ setting, onChange, onSave, saving }) {
  const [slugError, setSlugError] = useState('');

  const update = (field, value) => onChange({ ...setting, [field]: value });

  const validateSlug = (val) => {
    const clean = val.toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (clean !== val) setSlugError('Chỉ dùng chữ thường, số và dấu gạch ngang (-)');
    else setSlugError('');
    update('slug', clean);
  };

  return (
    <div className="space-y-6">
      {/* Slug */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h3 className="text-sm font-bold text-slate-800 mb-1">🔗 Đường dẫn booking</h3>
        <p className="text-xs text-slate-400 mb-4">Địa chỉ link đặt lịch công khai của cửa hàng</p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 bg-slate-100 px-3 py-2.5 rounded-l-xl border border-slate-200 border-r-0 whitespace-nowrap">
            {typeof window !== 'undefined' ? window.location.origin : ''}/book/
          </span>
          <input
            value={setting?.slug || ''}
            onChange={e => validateSlug(e.target.value)}
            placeholder="ten-salon-cua-ban"
            className={`flex-1 px-3 py-2.5 rounded-r-xl border text-sm focus:outline-none ${
              slugError ? 'border-red-400 focus:border-red-400' : 'border-slate-200 focus:border-pink-400'
            }`}
          />
        </div>
        {slugError && <p className="text-xs text-red-500 mt-1">{slugError}</p>}
        <p className="text-xs text-slate-400 mt-1">VD: my-salon, spa-hoa-lan, ...</p>
      </div>

      {/* Slot duration */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h3 className="text-sm font-bold text-slate-800 mb-1">
          <Clock className="w-4 h-4 inline mr-1.5 text-pink-500" />
          Khoảng thời gian mỗi slot
        </h3>
        <p className="text-xs text-slate-400 mb-4">Đơn vị thời gian cho từng khung giờ hiển thị</p>
        <div className="flex gap-3">
          {SLOT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => update('slot_duration_minutes', opt.value)}
              className={`flex-1 py-3 rounded-xl border-2 text-sm font-bold transition-all ${
                setting?.slot_duration_minutes === opt.value
                  ? 'bg-pink-500 text-white border-pink-500 shadow-lg shadow-pink-100'
                  : 'border-slate-200 text-slate-600 hover:border-pink-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Working hours */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h3 className="text-sm font-bold text-slate-800 mb-1">
          <Calendar className="w-4 h-4 inline mr-1.5 text-pink-500" />
          Giờ làm việc
        </h3>
        <p className="text-xs text-slate-400 mb-4">Cài đặt khung giờ mở cửa từng ngày trong tuần</p>
        <WorkingHoursEditor
          value={setting?.working_hours || {}}
          onChange={val => update('working_hours', val)}
        />
      </div>

      {/* Booking rules */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-5">
        <h3 className="text-sm font-bold text-slate-800">
          <Users className="w-4 h-4 inline mr-1.5 text-pink-500" />
          Quy tắc đặt lịch
        </h3>

        {/* Allow double booking */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-800">Cho phép đặt trùng lịch</p>
            <p className="text-xs text-slate-400 mt-0.5">Nhiều khách có thể đặt cùng nhân viên cùng giờ</p>
          </div>
          <button
            onClick={() => update('allow_double_booking', !setting?.allow_double_booking)}
            className={`w-12 h-7 rounded-full transition-all relative ${setting?.allow_double_booking ? 'bg-pink-500' : 'bg-slate-300'}`}
          >
            <span className={`absolute top-1.5 w-4 h-4 bg-white rounded-full shadow transition-all ${setting?.allow_double_booking ? 'left-7' : 'left-1.5'}`} />
          </button>
        </div>

        {/* Max advance days */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-slate-800">Đặt trước tối đa</p>
            <span className="text-sm font-bold text-pink-600">{setting?.max_advance_days || 30} ngày</span>
          </div>
          <input
            type="range"
            min={1}
            max={90}
            value={setting?.max_advance_days || 30}
            onChange={e => update('max_advance_days', Number(e.target.value))}
            className="w-full accent-pink-500"
          />
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>1 ngày</span>
            <span>90 ngày</span>
          </div>
        </div>

        {/* Min advance hours */}
        <div>
          <p className="text-sm font-medium text-slate-800 mb-2">Đặt trước tối thiểu</p>
          <select
            value={setting?.min_advance_hours || 1}
            onChange={e => update('min_advance_hours', Number(e.target.value))}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-pink-400 bg-white"
          >
            {MIN_ADVANCE_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Save */}
      <button
        onClick={onSave}
        disabled={saving || !!slugError}
        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold text-sm shadow-lg shadow-pink-200 hover:from-pink-600 hover:to-rose-600 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {saving ? 'Đang lưu...' : 'Lưu cài đặt'}
      </button>
    </div>
  );
}
