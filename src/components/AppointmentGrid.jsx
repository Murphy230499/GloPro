import React from 'react';
import { UserPlus, Clock } from 'lucide-react';
import Avatar from '@/components/Avatar';

const START_HOUR = 8;
const END_HOUR = 21;
const SLOT_PX = 44; // per 30 min

const toMin = (t) => {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
};

const STATUS_BG = {
  pending: '#F1F5F9', confirmed: '#DBEAFE', checked_in: '#FEF3C7',
  in_progress: '#EDE9FE', completed: '#D1FAE5', cancelled: '#FEE2E2', no_show: '#FFE4E6',
};
const STATUS_BORDER = {
  pending: '#CBD5E1', confirmed: '#93C5FD', checked_in: '#FCD34D',
  in_progress: '#C4B5FD', completed: '#6EE7B7', cancelled: '#FCA5A5', no_show: '#FDA4AF',
};
const STATUS_TEXT = {
  pending: '#64748B', confirmed: '#2563EB', checked_in: '#B45309',
  in_progress: '#6D28D9', completed: '#047857', cancelled: '#B91C1C', no_show: '#BE123C',
};

export default function AppointmentGrid({ appointments, staff, onApptClick, onEmptyClick }) {
  const columns = [
    ...staff.map((s) => ({ id: s.id, name: s.full_name, avatar_url: s.avatar_url, color: s.avatar_color || '#FF6B9D' })),
    { id: '__unassigned', name: 'Chưa phân', color: '#94A3B8', avatar_url: null },
  ];

  const getColId = (appt) => {
    const sid = appt.staff_id || appt.services?.find((sv) => sv.staff_id)?.staff_id;
    return sid && columns.some((c) => c.id === sid) ? sid : '__unassigned';
  };

  const topFor = (t) => ((toMin(t) - START_HOUR * 60) / 30) * SLOT_PX;
  const heightFor = (appt) => {
    const start = toMin(appt.start_time);
    let end = toMin(appt.end_time);
    if (end <= start) end = start + 60;
    return Math.max(36, ((end - start) / 30) * SLOT_PX - 3);
  };

  const hours = [];
  for (let h = START_HOUR; h < END_HOUR; h++) hours.push(h);

  const gridHeight = (END_HOUR - START_HOUR) * 2 * SLOT_PX;
  const colWidth = 180;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <div className="min-w-max">
          {/* Header row */}
          <div className="flex sticky top-0 z-10 bg-white border-b border-slate-100">
            <div className="w-14 shrink-0 border-r border-slate-100" />
            {columns.map((c) => (
              <div key={c.id} className="shrink-0 border-r border-slate-100 px-2 py-2.5 text-center" style={{ width: colWidth }}>
                <div className="flex flex-col items-center gap-1">
                  <Avatar src={c.avatar_url} name={c.name} size={32} color={c.color} />
                  <span className="text-xs font-semibold truncate max-w-full">{c.name}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Grid body */}
          <div className="flex relative">
            {/* Time column */}
            <div className="w-14 shrink-0 border-r border-slate-100 relative" style={{ height: gridHeight }}>
              {hours.map((h) => (
                <div key={h} className="absolute left-0 right-0 text-[11px] text-slate-400 font-medium pl-2" style={{ top: (h - START_HOUR) * 2 * SLOT_PX - 8 }}>
                  {h}:00
                </div>
              ))}
            </div>

            {/* Staff columns */}
            {columns.map((col) => {
              const colAppts = appointments.filter((a) => a.status !== 'cancelled' && getColId(a) === col.id);
              return (
                <div
                  key={col.id}
                  className="shrink-0 border-r border-slate-100 relative"
                  style={{ width: colWidth, height: gridHeight, background: col.id === '__unassigned' ? 'repeating-linear-gradient(45deg,#fafafa,#fafafa 10px,#f8fafc 10px,#f8fafc 20px)' : undefined }}
                >
                  {/* Hour lines */}
                  {hours.map((h) => (
                    <div key={h} className="absolute left-0 right-0 border-t border-slate-50" style={{ top: (h - START_HOUR) * 2 * SLOT_PX }} />
                  ))}
                  {hours.map((h) => (
                    <div key={h + 'h'} className="absolute left-0 right-0 border-t border-dashed border-slate-100" style={{ top: (h - START_HOUR) * 2 * SLOT_PX + SLOT_PX }} />
                  ))}

                  {/* Clickable empty slot to create */}
                  <button
                    type="button"
                    onClick={() => onEmptyClick?.(col.id, col.id === '__unassigned' ? null : col.id)}
                    className="absolute inset-0 w-full h-full"
                    aria-label="Tạo lịch"
                  />

                  {/* Appointments */}
                  {colAppts.map((a) => {
                    const services = a.services && a.services.length ? a.services : (a.service_name ? [{ service_name: a.service_name, staff_name: a.staff_name }] : []);
                    const isUnassigned = !a.staff_id && !services.find((s) => s.staff_id);
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onApptClick?.(a); }}
                        className="absolute left-1 right-1 rounded-lg px-2 py-1.5 text-left overflow-hidden border-l-2 shadow-sm hover:shadow-md hover:z-10 transition-shadow"
                        style={{
                          top: topFor(a.start_time),
                          height: heightFor(a),
                          background: STATUS_BG[a.status],
                          borderColor: STATUS_BORDER[a.status],
                        }}
                      >
                        <div className="font-semibold text-[11px] leading-tight flex items-center gap-1" style={{ color: STATUS_TEXT[a.status] }}>
                          <Clock className="w-3 h-3 shrink-0" />
                          {a.start_time?.slice(0, 5)} {a.end_time && `– ${a.end_time.slice(0, 5)}`}
                        </div>
                        <div className="text-[11px] font-bold truncate" style={{ color: STATUS_TEXT[a.status] }}>{a.customer_name}</div>
                        <div className="text-[10px] truncate text-slate-600">
                          {services.map((s) => s.service_name).join(' + ') || 'Chưa chọn dịch vụ'}
                        </div>
                        {isUnassigned && (
                          <div className="text-[9px] mt-0.5 inline-flex items-center gap-0.5 text-amber-600 font-semibold">
                            <UserPlus className="w-2.5 h-2.5" /> Cần phân KTV
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}