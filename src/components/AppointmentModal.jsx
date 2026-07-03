import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/Layout';
import { formatVND } from '@/lib/format';
import StaffAssignPicker from '@/components/StaffAssignPicker';

const SOURCES = [
  { value: 'reception', label: 'Quầy lễ tân' },
  { value: 'online', label: 'Khách tự đặt' },
  { value: 'phone', label: 'Gọi điện' },
  { value: 'walk_in', label: 'Walk-in' },
];

const emptyRow = () => ({ service_id: '', service_name: '', price: 0, duration_minutes: 0, staff_id: '', staff_name: '' });

export default function AppointmentModal({ open, onClose, onSaved, branchId, defaultDate, editing }) {
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [form, setForm] = useState({});
  const [rows, setRows] = useState([emptyRow()]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    Promise.all([
      base44.entities.Customer.list(),
      base44.entities.Service.filter({ is_active: true }),
      base44.entities.Staff.filter({ is_active: true }),
    ]).then(([c, s, st]) => {
      setCustomers(c);
      setServices(s.filter((x) => !x.branch_id || x.branch_id === branchId || branchId === 'all' || !branchId));
      setStaff(st.filter((x) => !x.branch_id || x.branch_id === branchId || branchId === 'all' || !branchId));
    });
  }, [open, branchId]);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setForm({
        ...editing,
        date: editing.date || defaultDate || new Date().toISOString().slice(0, 10),
      });
      if (editing.services && editing.services.length) {
        setRows(editing.services.map((s) => ({
          service_id: s.service_id || '', service_name: s.service_name || '',
          price: s.price || 0, duration_minutes: s.duration_minutes || 0,
          staff_id: s.staff_id || '', staff_name: s.staff_name || '',
        })));
      } else if (editing.service_id || editing.service_name) {
        setRows([{ service_id: editing.service_id || '', service_name: editing.service_name || '', price: editing.price || 0, duration_minutes: 0, staff_id: editing.staff_id || '', staff_name: editing.staff_name || '' }]);
      } else {
        setRows([emptyRow()]);
      }
    } else {
      setForm({
        date: defaultDate || new Date().toISOString().slice(0, 10),
        start_time: '09:00',
        source: 'reception',
        status: 'confirmed',
        customer_name: '',
        customer_phone: '',
        note: '',
        is_customer_requested_staff: false,
      });
      setRows([emptyRow()]);
    }
  }, [open, editing, defaultDate]);

  if (!open) return null;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setRow = (i, patch) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const addRow = () => setRows((rs) => [...rs, emptyRow()]);
  const removeRow = (i) => setRows((rs) => (rs.length > 1 ? rs.filter((_, j) => j !== i) : rs));

  const onServicePick = (i, serviceId) => {
    const svc = services.find((s) => s.id === serviceId);
    if (!svc) { setRow(i, { service_id: '', service_name: '', price: 0, duration_minutes: 0 }); return; }
    const totalMinutes = rows.reduce((sum, r, j) => (j === i ? (svc.duration_minutes || 0) : (r.duration_minutes || 0)), 0);
    const end = new Date(`2000-01-01T${form.start_time || '09:00'}:00`);
    end.setMinutes(end.getMinutes() + totalMinutes);
    set('end_time', end.toTimeString().slice(0, 5));
    setRow(i, { service_id: svc.id, service_name: svc.name, price: svc.price, duration_minutes: svc.duration_minutes || 0 });
  };

  const recalcEnd = (newRows, start) => {
    const totalMinutes = newRows.reduce((sum, r) => sum + (r.duration_minutes || 0), 0);
    if (!totalMinutes) return;
    const end = new Date(`2000-01-01T${start || '09:00'}:00`);
    end.setMinutes(end.getMinutes() + totalMinutes);
    set('end_time', end.toTimeString().slice(0, 5));
  };

  const onStartTimeChange = (t) => {
    set('start_time', t);
    recalcEnd(rows, t);
  };

  const onCustomerChange = (id) => {
    if (id === 'new') {
      set('customer_id', '');
      set('customer_name', '');
      set('customer_phone', '');
      return;
    }
    const c = customers.find((x) => x.id === id);
    if (c) {
      set('customer_id', c.id);
      set('customer_name', c.name);
      set('customer_phone', c.phone);
    }
  };

  const totalPrice = rows.reduce((s, r) => s + (r.price || 0), 0);

  const save = async () => {
    if (!form.customer_name) return toast.error('Vui lòng nhập tên khách');
    if (!form.date || !form.start_time) return toast.error('Thiếu ngày/giờ hẹn');
    const validRows = rows.filter((r) => r.service_id);
    setSaving(true);
    try {
      const payload = { ...form, branch_id: branchId };
      // multi-service array
      payload.services = validRows.map((r) => ({
        service_id: r.service_id, service_name: r.service_name,
        price: r.price, duration_minutes: r.duration_minutes,
        staff_id: r.staff_id, staff_name: r.staff_name,
      }));
      // legacy single-service fields (first row) for backward compat
      const first = validRows[0];
      if (first) {
        payload.service_id = first.service_id;
        payload.service_name = validRows.map((r) => r.service_name).join(' + ');
        payload.price = totalPrice;
        payload.staff_id = first.staff_id;
        payload.staff_name = first.staff_name;
      } else {
        payload.price = 0;
      }
      if (!payload.customer_id) delete payload.customer_id;
      if (!payload.staff_id) { delete payload.staff_id; delete payload.staff_name; }
      delete payload.services_ids;
      if (editing) {
        await base44.entities.Appointment.update(editing.id, payload);
        toast.success('Đã cập nhật lịch hẹn');
      } else {
        await base44.entities.Appointment.create(payload);
        toast.success('Đã tạo lịch hẹn');
      }
      onSaved();
      onClose();
    } catch (e) {
      toast.error('Lỗi khi lưu: ' + (e.message || e));
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative bg-white w-full md:max-w-lg rounded-t-3xl md:rounded-3xl p-5 max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">{editing ? 'Sửa lịch hẹn' : 'Tạo lịch hẹn'}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-600 mb-1.5 block">Khách hàng</label>
            <select
              value={form.customer_id || 'new'}
              onChange={(e) => onCustomerChange(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm"
            >
              <option value="new">+ Khách mới</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>
              ))}
            </select>
            {!form.customer_id && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                <input placeholder="Tên khách" value={form.customer_name || ''} onChange={(e) => set('customer_name', e.target.value)}
                  className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
                <input placeholder="Số điện thoại" value={form.customer_phone || ''} onChange={(e) => set('customer_phone', e.target.value)}
                  className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
              </div>
            )}
          </div>

          {/* Multi-service rows */}
          <div>
            <label className="text-sm font-medium text-slate-600 mb-1.5 block">Dịch vụ</label>
            <div className="space-y-2">
              {rows.map((r, i) => (
                <div key={i} className="bg-slate-50 rounded-xl p-2.5">
                  <div className="flex items-center gap-2">
                    <select value={r.service_id} onChange={(e) => onServicePick(i, e.target.value)}
                      className="flex-1 px-2.5 py-2 rounded-lg border border-slate-200 text-sm bg-white">
                      <option value="">— Chọn dịch vụ —</option>
                      {services.map((s) => (
                        <option key={s.id} value={s.id}>{s.name} — {formatVND(s.price)}</option>
                      ))}
                    </select>
                    {r.price > 0 && <span className="text-sm font-bold text-pink-600 shrink-0">{formatVND(r.price)}</span>}
                    {rows.length > 1 && (
                      <button onClick={() => removeRow(i)} className="text-slate-300 hover:text-red-500 shrink-0"><Trash2 className="w-4 h-4" /></button>
                    )}
                  </div>
                  <StaffAssignPicker
                    staff={staff}
                    value={r.staff_id}
                    onChange={(id, name) => setRow(i, { staff_id: id, staff_name: name })}
                  />
                </div>
              ))}
            </div>
            <button onClick={addRow} className="mt-2 flex items-center gap-1 text-sm text-pink-600 font-semibold">
              <Plus className="w-4 h-4" /> Thêm dịch vụ khác
            </button>
            {totalPrice > 0 && (
              <div className="mt-2 flex items-center justify-between px-2">
                <span className="text-sm text-slate-500">Tổng tiền dịch vụ</span>
                <span className="text-base font-bold text-pink-600">{formatVND(totalPrice)}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Ngày</label>
              <input type="date" value={form.date || ''} onChange={(e) => set('date', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Bắt đầu</label>
              <input type="time" value={form.start_time || ''} onChange={(e) => onStartTimeChange(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Kết thúc</label>
              <input type="time" value={form.end_time || ''} onChange={(e) => set('end_time', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm font-medium text-slate-600 mb-1.5 block">Nguồn đặt</label>
              <select value={form.source || 'reception'} onChange={(e) => set('source', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm">
                {SOURCES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600 mb-1.5 block">Trạng thái</label>
              <select value={form.status || 'confirmed'} onChange={(e) => set('status', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm">
                <option value="pending">Chờ xác nhận</option>
                <option value="confirmed">Đã xác nhận</option>
                <option value="checked_in">Đã check-in</option>
                <option value="in_progress">Đang làm</option>
                <option value="completed">Hoàn thành</option>
                <option value="cancelled">Đã hủy</option>
                <option value="no_show">Không đến</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-600 mb-1.5 block">Ghi chú</label>
            <textarea value={form.note || ''} onChange={(e) => set('note', e.target.value)} rows={2}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" placeholder="Sở thích, dị ứng, yêu cầu..." />
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-slate-100 font-semibold text-sm">Hủy</button>
          <button onClick={save} disabled={saving}
            className="flex-1 py-3 rounded-xl bg-primary text-white font-semibold text-sm disabled:opacity-50">
            {saving ? 'Đang lưu...' : 'Lưu lịch hẹn'}
          </button>
        </div>
      </div>
    </div>
  );
}