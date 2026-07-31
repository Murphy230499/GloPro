'use client';
import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, Minus, ChevronDown, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';

// ─── Màu chủ đạo Booking ──────────────────────────────────────────────────────
const P = {
  toggle: 'bg-pink-500',
  toggleOff: 'bg-slate-200',
  btn: 'bg-pink-500 text-white border-pink-500 shadow-md',
  btnHover: 'border-slate-200 text-slate-600 hover:border-pink-300',
  chip: 'bg-pink-50 text-pink-700 border border-pink-100',
  chipX: 'hover:text-red-500',
  focus: 'focus:border-pink-400',
  check: 'bg-pink-500 border-pink-500',
  checkOff: 'border-slate-300',
  selected: 'bg-pink-500 text-white shadow-sm scale-105 rounded-full',
};

// ─── Reusable components ──────────────────────────────────────────────────────

export function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={onChange}
      className={`w-11 h-6 rounded-full transition-all relative shrink-0 focus:outline-none ${checked ? P.toggle : P.toggleOff}`}
    >
      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${checked ? 'left-6' : 'left-1'}`} />
    </button>
  );
}

export function Counter({ value, onChange, min = 1, max = 99 }) {
  return (
    <div className="flex items-center gap-0 border border-slate-200 rounded-lg overflow-hidden w-28">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-9 h-9 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-all border-r border-slate-200"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>
      <input
        type="number"
        value={value}
        min={min} max={max}
        onChange={e => onChange(Math.min(max, Math.max(min, Number(e.target.value))))}
        className="flex-1 text-center text-sm font-medium py-2 focus:outline-none bg-white"
      />
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-9 h-9 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-all border-l border-slate-200"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function SettingCard({ title, description, toggle, onToggle, children }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-800">{title}</p>
          {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
        </div>
        {toggle !== undefined && <Toggle checked={toggle} onChange={onToggle} />}
      </div>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

// ─── Mini Calendar Popover ──────────────────────────────────────────────────
const MONTH_NAMES_VI = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];
const DAY_LABELS = ['CN','T2','T3','T4','T5','T6','T7'];

function MiniCalendar({ selectedDate, onSelectDate, onClose, disabledDates = [] }) {
  const todayISO = new Date().toISOString().split('T')[0];
  const [viewDate, setViewDate] = useState(() => {
    if (selectedDate) {
      const [y, m] = selectedDate.split('-').map(Number);
      return new Date(y, m - 1, 1);
    }
    return new Date();
  });

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();

  const cells = [];
  for (let i = firstDow - 1; i >= 0; i--) {
    const d = daysInPrev - i;
    cells.push({ day: d, iso: new Date(year, month - 1, d).toISOString().split('T')[0], current: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${year}-${String(month + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    cells.push({ day: d, iso, current: true });
  }
  const fill = Math.ceil(cells.length / 7) * 7 - cells.length;
  for (let d = 1; d <= fill; d++) {
    cells.push({ day: d, iso: new Date(year, month + 1, d).toISOString().split('T')[0], current: false });
  }

  return (
    <div className="absolute top-full mt-2 left-0 w-72 bg-white rounded-2xl border border-slate-200 shadow-2xl p-4 z-[60] animate-in fade-in zoom-in-95 duration-150">
      <div className="flex items-center justify-between mb-3 px-1">
        <button type="button" onClick={() => setViewDate(new Date(year, month - 1, 1))}
          className="w-8 h-8 rounded-xl border border-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-all">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-bold text-slate-800">{MONTH_NAMES_VI[month]} {year}</span>
        <button type="button" onClick={() => setViewDate(new Date(year, month + 1, 1))}
          className="w-8 h-8 rounded-xl border border-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-all">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 text-center mb-1">
        {DAY_LABELS.map(d => (
          <span key={d} className="text-[11px] font-semibold text-slate-400 py-1">{d}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5 text-center text-xs">
        {cells.map((cell, i) => {
          const isSelected = cell.iso === selectedDate;
          const isToday = cell.iso === todayISO;
          const isDisabled = disabledDates.includes(cell.iso) || cell.iso < todayISO;
          let cls = 'h-8 flex items-center justify-center rounded-full transition-all font-semibold ';
          if (!cell.current) cls += 'text-slate-300 font-normal ';
          else if (isDisabled) cls += 'text-slate-300 cursor-not-allowed font-normal ';
          else if (isSelected) cls += `${P.selected} `;
          else if (isToday) cls += 'bg-pink-50 text-pink-600 font-bold ';
          else cls += 'text-slate-700 hover:bg-slate-100 cursor-pointer ';

          return (
            <button
              key={i}
              type="button"
              disabled={isDisabled && cell.current}
              onClick={() => { if (!isDisabled) { onSelectDate(cell.iso); onClose(); } }}
              className={cls}
            >
              {cell.day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Slot duration ────────────────────────────────────────────────────────────
const SLOT_MARKS = [
  { value: 5, label: '5 phút' },
  { value: 10, label: '10 phút' },
  { value: 15, label: '15 phút' },
  { value: 30, label: '30 phút' },
  { value: 60, label: '60 phút' },
];

function SlotDurationCard({ value, onChange }) {
  return (
    <SettingCard
      title="Thời lượng mỗi slot"
      description="Chọn khoảng thời gian cho từng khung giờ hiển thị trên trang đặt lịch"
    >
      <div className="flex gap-2 flex-wrap">
        {SLOT_MARKS.map(m => (
          <button
            key={m.value}
            onClick={() => onChange(m.value)}
            className={`px-5 py-2.5 rounded-xl border-2 text-sm transition-all ${value === m.value ? P.btn : P.btnHover}`}
          >
            {m.label}
          </button>
        ))}
      </div>
    </SettingCard>
  );
}

// ─── Blocked dates ────────────────────────────────────────────────────────────
function BlockedDatesCard({ blocked, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const blockedSet = blocked.map(b => b.date);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (iso) => {
    if (blockedSet.includes(iso)) return;
    onChange([...blocked, { date: iso, label: 'Ngày nghỉ' }]);
  };

  const remove = (date) => onChange(blocked.filter(b => b.date !== date));

  return (
    <SettingCard
      title="Ngày không nhận đặt lịch"
      description="Những ngày khách hàng không thể đặt lịch online"
    >
      <div className="relative mb-3 w-48" ref={ref}>
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          className={`w-full flex items-center justify-between px-3 py-2 border rounded-lg text-sm transition-all ${
            open ? 'border-pink-400 bg-pink-50 text-pink-700' : 'border-slate-200 text-slate-600 hover:border-pink-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-slate-400" />
            <span>Thêm ngày nghỉ</span>
          </div>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180 text-pink-500' : 'text-slate-400'}`} />
        </button>

        {open && (
          <MiniCalendar
            selectedDate={null}
            onSelectDate={handleSelect}
            onClose={() => setOpen(false)}
            disabledDates={blockedSet}
          />
        )}
      </div>

      {blocked.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {[...blocked].sort((a, b) => a.date.localeCompare(b.date)).map(b => (
            <span key={b.date} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${P.chip}`}>
              {new Date(b.date + 'T00:00:00').toLocaleDateString('vi-VN', { day: 'numeric', month: 'short', year: 'numeric' })}
              <button onClick={() => remove(b.date)} className={P.chipX}>
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </SettingCard>
  );
}

// ─── Main Preferences Tab ─────────────────────────────────────────────────────
export default function PreferencesTab({ setting, onChange }) {
  const up = (f, v) => onChange({ ...setting, [f]: v });

  const FUTURE_OPTIONS = [
    { value: 7, label: '1 tuần' },
    { value: 14, label: '2 tuần' },
    { value: 30, label: '1 tháng' },
    { value: 60, label: '2 tháng' },
    { value: 90, label: '3 tháng' },
    { value: 180, label: '6 tháng' },
  ];

  const IDENTIFIER_OPTIONS = [
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Số điện thoại' },
    { value: 'name', label: 'Tên khách hàng' },
  ];

  return (
    <div className="space-y-3 pb-8">
      <SlotDurationCard
        value={setting?.slot_duration_minutes || 30}
        onChange={v => up('slot_duration_minutes', v)}
      />

      <BlockedDatesCard
        blocked={setting?.blocked_dates || []}
        onChange={v => up('blocked_dates', v)}
      />

      <SettingCard
        title="Cho phép đặt trùng lịch"
        description="Nhiều khách có thể đặt cùng nhân viên trong cùng một khung giờ"
        toggle={!!setting?.allow_double_booking}
        onToggle={() => up('allow_double_booking', !setting?.allow_double_booking)}
      >
        {setting?.allow_double_booking && (
          <div>
            <p className="text-xs text-slate-500 mb-2">Số lượng tối đa mỗi slot</p>
            <Counter value={setting?.max_double_bookings || 1} onChange={v => up('max_double_bookings', v)} />
          </div>
        )}
      </SettingCard>

      <SettingCard
        title="Giới hạn đặt lịch trước"
        description="Khách hàng có thể đặt lịch trước tối đa bao lâu"
        toggle={!!setting?.enable_advance_limit}
        onToggle={() => up('enable_advance_limit', !setting?.enable_advance_limit)}
      >
        {setting?.enable_advance_limit && (
          <div className="relative w-48">
            <select
              value={setting?.max_advance_days || 90}
              onChange={e => up('max_advance_days', Number(e.target.value))}
              className={`w-full appearance-none px-3 py-2 pr-8 rounded-lg border border-slate-200 text-sm focus:outline-none ${P.focus} bg-white`}
            >
              {FUTURE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        )}
      </SettingCard>

      <SettingCard
        title="Khách tự hủy lịch"
        description="Cho phép khách tự hủy lịch online trước một số giờ nhất định"
        toggle={!!setting?.allow_self_cancel}
        onToggle={() => up('allow_self_cancel', !setting?.allow_self_cancel)}
      >
        {setting?.allow_self_cancel && (
          <div>
            <p className="text-xs text-slate-500 mb-2">Trước tối thiểu (giờ)</p>
            <Counter value={setting?.self_cancel_hours || 2} onChange={v => up('self_cancel_hours', v)} />
          </div>
        )}
      </SettingCard>

      <SettingCard
        title="Giới hạn số lượt đặt mỗi slot"
        description="Giới hạn số lượng lịch hẹn trong mỗi khung giờ"
        toggle={!!setting?.limit_booking_slots}
        onToggle={() => up('limit_booking_slots', !setting?.limit_booking_slots)}
      >
        {setting?.limit_booking_slots && (
          <div>
            <p className="text-xs text-slate-500 mb-2">Số lượt tối đa mỗi giờ</p>
            <Counter value={setting?.max_slots_per_hour || 3} onChange={v => up('max_slots_per_hour', v)} />
          </div>
        )}
      </SettingCard>

      <SettingCard
        title="Trường định danh khách hàng"
        description="Trường chính để nhận diện và liên hệ khách hàng"
      >
        <div className="relative w-52">
          <select
            value={setting?.primary_identifier || 'email'}
            onChange={e => up('primary_identifier', e.target.value)}
            className={`w-full appearance-none px-3 py-2 pr-8 rounded-lg border border-slate-200 text-sm focus:outline-none ${P.focus} bg-white`}
          >
            {IDENTIFIER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </SettingCard>

      <SettingCard
        title="Đặt lịch theo nhóm"
        description="Cho phép khách đặt lịch cho nhiều người cùng lúc"
        toggle={!!setting?.allow_group_appointments}
        onToggle={() => up('allow_group_appointments', !setting?.allow_group_appointments)}
      />

      <SettingCard
        title="Bắt buộc chọn nhân viên"
        description="Khách hàng bắt buộc phải chọn 1 nhân viên cụ thể khi đặt lịch"
        toggle={!!setting?.require_staff_selection}
        onToggle={() => up('require_staff_selection', !setting?.require_staff_selection)}
      />

      <SettingCard
        title="Hiển thị giá dịch vụ"
        description="Giá tiền của từng dịch vụ sẽ được hiển thị khi khách chọn dịch vụ"
        toggle={!!setting?.show_service_prices}
        onToggle={() => up('show_service_prices', !setting?.show_service_prices)}
      />

      <SettingCard
        title="Tự động xác nhận lịch hẹn"
        description="Hệ thống tự động xác nhận lịch hẹn khi khách đặt từ link booking"
        toggle={!!setting?.auto_confirm}
        onToggle={() => up('auto_confirm', !setting?.auto_confirm)}
      />
    </div>
  );
}
