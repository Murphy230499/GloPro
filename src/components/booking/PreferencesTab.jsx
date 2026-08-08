'use client';
import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, Minus, ChevronDown, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { useT } from '@/lib/i18n';

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
const DAY_LABELS = ['CN','T2','T3','T4','T5','T6','T7'];

function MiniCalendar({ selectedDate, onSelectDate, onClose, disabledDates = [] }) {
  const t = useT();
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

  const monthName = viewDate.toLocaleDateString(t('locale', 'vi-VN'), { month: 'long' });

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
        <span className="text-sm font-bold text-slate-800 capitalize">{monthName} {year}</span>
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
function SlotDurationCard({ value, onChange }) {
  const t = useT();
  const SLOT_MARKS = [
    { value: 5, label: t('booking.unit_mins', '{count} mins', { count: 5 }) },
    { value: 10, label: t('booking.unit_mins', '{count} mins', { count: 10 }) },
    { value: 15, label: t('booking.unit_mins', '{count} mins', { count: 15 }) },
    { value: 30, label: t('booking.unit_mins', '{count} mins', { count: 30 }) },
    { value: 60, label: t('booking.unit_mins', '{count} mins', { count: 60 }) },
  ];

  return (
    <SettingCard
      title={t('booking.slot_duration_title', 'Slot Duration')}
      description={t('booking.slot_duration_desc', 'Select interval for time slots displayed on booking page')}
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
  const t = useT();
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
    onChange([...blocked, { date: iso, label: t('booking.default_day_off_label', 'Day off') }]);
  };

  const remove = (date) => onChange(blocked.filter(b => b.date !== date));

  return (
    <SettingCard
      title={t('booking.blocked_dates_title', 'Blackout Dates / Days Off')}
      description={t('booking.blocked_dates_desc', 'Dates when customers cannot book online')}
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
            <span>{t('booking.add_day_off', 'Add Day Off')}</span>
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
              {new Date(b.date + 'T00:00:00').toLocaleDateString(t('locale', 'vi-VN'), { day: 'numeric', month: 'short', year: 'numeric' })}
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
  const t = useT();
  const up = (f, v) => onChange({ ...setting, [f]: v });

  const FUTURE_OPTIONS = [
    { value: 7, label: t('booking.opt_1_week', '1 week') },
    { value: 14, label: t('booking.opt_2_weeks', '2 weeks') },
    { value: 30, label: t('booking.opt_1_month', '1 month') },
    { value: 60, label: t('booking.opt_2_months', '2 months') },
    { value: 90, label: t('booking.opt_3_months', '3 months') },
    { value: 180, label: t('booking.opt_6_months', '6 months') },
  ];

  const IDENTIFIER_OPTIONS = [
    { value: 'email', label: t('booking.identifier_email', 'Email') },
    { value: 'phone', label: t('booking.identifier_phone', 'Phone Number') },
    { value: 'name', label: t('booking.identifier_name', 'Customer Name') },
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
        title={t('booking.allow_double_booking_title', 'Allow Double Booking')}
        description={t('booking.allow_double_booking_desc', 'Multiple customers can book the same staff in the same slot')}
        toggle={!!setting?.allow_double_booking}
        onToggle={() => up('allow_double_booking', !setting?.allow_double_booking)}
      >
        {setting?.allow_double_booking && (
          <div>
            <p className="text-xs text-slate-500 mb-2">{t('booking.max_per_slot', 'Maximum capacity per slot')}</p>
            <Counter value={setting?.max_double_bookings || 1} onChange={v => up('max_double_bookings', v)} />
          </div>
        )}
      </SettingCard>

      <SettingCard
        title={t('booking.advance_limit_title', 'Advance Booking Limit')}
        description={t('booking.advance_limit_desc', 'How far in advance customers can book')}
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
        title={t('booking.self_cancel_title', 'Customer Self-Cancellation')}
        description={t('booking.self_cancel_desc', 'Allow customers to cancel online up to X hours before appointment')}
        toggle={!!setting?.allow_self_cancel}
        onToggle={() => up('allow_self_cancel', !setting?.allow_self_cancel)}
      >
        {setting?.allow_self_cancel && (
          <div>
            <p className="text-xs text-slate-500 mb-2">{t('booking.min_hours_before', 'Minimum hours before')}</p>
            <Counter value={setting?.self_cancel_hours || 2} onChange={v => up('self_cancel_hours', v)} />
          </div>
        )}
      </SettingCard>

      <SettingCard
        title={t('booking.slot_capacity_title', 'Slot Capacity Limit')}
        description={t('booking.slot_capacity_desc', 'Limit total appointments per time slot')}
        toggle={!!setting?.limit_booking_slots}
        onToggle={() => up('limit_booking_slots', !setting?.limit_booking_slots)}
      >
        {setting?.limit_booking_slots && (
          <div>
            <p className="text-xs text-slate-500 mb-2">{t('booking.max_per_hour', 'Maximum bookings per hour')}</p>
            <Counter value={setting?.max_slots_per_hour || 3} onChange={v => up('max_slots_per_hour', v)} />
          </div>
        )}
      </SettingCard>

      <SettingCard
        title={t('booking.primary_identifier_title', 'Customer Primary Identifier')}
        description={t('booking.primary_identifier_desc', 'Main field used to identify and contact customers')}
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
        title={t('booking.group_booking_title', 'Group Booking')}
        description={t('booking.group_booking_desc', 'Allow customers to book appointments for multiple people')}
        toggle={!!setting?.allow_group_appointments}
        onToggle={() => up('allow_group_appointments', !setting?.allow_group_appointments)}
      />

      <SettingCard
        title={t('booking.require_staff_title', 'Require Staff Selection')}
        description={t('booking.require_staff_desc', 'Customers must select a specific staff member when booking')}
        toggle={!!setting?.require_staff_selection}
        onToggle={() => up('require_staff_selection', !setting?.require_staff_selection)}
      />

      <SettingCard
        title={t('booking.show_prices_title', 'Display Service Prices')}
        description={t('booking.show_prices_desc', 'Show price for each service during selection')}
        toggle={!!setting?.show_service_prices}
        onToggle={() => up('show_service_prices', !setting?.show_service_prices)}
      />

      <SettingCard
        title={t('booking.auto_confirm_title', 'Auto-Confirm Appointments')}
        description={t('booking.auto_confirm_desc', 'Automatically confirm appointment when customer books online')}
        toggle={!!setting?.auto_confirm}
        onToggle={() => up('auto_confirm', !setting?.auto_confirm)}
      />
    </div>
  );
}
