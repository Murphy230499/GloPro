import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/Layout';

const SOURCES = [
  { value: 'reception', label: 'Quầy lễ tân' },
  { value: 'online', label: 'Khách tự đặt' },
  { value: 'phone', label: 'Gọi điện' },
  { value: 'walk_in', label: 'Walk-in' },
];

export default function AppointmentModal({ open, onClose, onSaved, branchId, defaultDate, editing }) {
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [form, setForm] = useState({});
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
      setForm({ ...editing });
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
    }
  }, [open, editing, defaultDate]);

  if (!open) return null;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const onServiceChange = (serviceId) => {
    const svc = services.find((s) => s.id === serviceId);
    if (!svc) return;
    const end = new Date(`2000-01-01T${form.start_time || '09:00'}:00`);
    end.setMinutes(end.getMinutes() + (svc.duration_minutes || 60));
    set('service_id', svc.id);
    set('service_name', svc.name);
    set('price', svc.price);
    set('end_time', end.toTimeString().slice(0, 5));
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

  const onStaffChange = (id) => {
    const s = staff.find((x) => x.id === id);
    set('staff_id', id);
    set('staff_name', s ? s.full_name : '');
  };

  const save = async () => {
    if (!form.customer_name) return toast.error('Vui lòng nhập tên khách');
    if (!form.date || !form.start_time) return toast.error('Thiếu ngày/giờ hẹn');
    setSaving(true);
    try {
      const payload = { ...form, branch_id: branchId };
      if (!payload.customer_id) delete payload.customer_id;
      if (!payload.service_id) { delete payload.service_id; delete payload.service_name; payload.price = 0; }
      if (!payload.staff_id) { delete payload.staff_id; delete payload.staff_name; }
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

          <div>
            <label className="text-sm font-medium text-slate-600 mb-1.5 block">Dịch vụ</label>
            <select value={form.service_id || ''} onChange={(e) => onServiceChange(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm">
              <option value="">— Chọn dịch vụ —</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>{s.name} — {s.price.toLocaleString('vi-VN')}₫</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-600 mb-1.5 block">Kỹ thuật viên</label>
            <select value={form.staff_id || ''} onChange={(e) => onStaffChange(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm">
              <option value="">— Bất kỳ / Chưa phân —</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>{s.full_name}</option>
              ))}
            </select>
            <label className="flex items-center gap-2 mt-2 text-sm text-slate-600">
              <input type="checkbox" checked={!!form.is_customer_requested_staff} onChange={(e) => set('is_customer_requested_staff', e.target.checked)} />
              Khách yêu cầu riêng KTV này (tính hoa hồng ưu tiên)
            </label>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Ngày</label>
              <input type="date" value={form.date || ''} onChange={(e) => set('date', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Giờ bắt đầu</label>
              <input type="time" value={form.start_time || ''} onChange={(e) => set('start_time', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Giờ kết thúc</label>
              <input type="time" value={form.end_time || ''} onChange={(e) => set('end_time', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-600 mb-1.5 block">Nguồn đặt</label>
            <select value={form.source || 'reception'} onChange={(e) => set('source', e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm">
              {SOURCES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
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