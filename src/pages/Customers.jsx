import React, { useEffect, useState } from 'react';
import { Search, Plus, X, Phone, Calendar, Gift, Edit3, Crown } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { formatVND, formatDate } from '@/lib/format';
import { toast } from '@/components/Layout';
import Avatar from '@/components/Avatar';
import ImageUpload from '@/components/ImageUpload';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [detail, setDetail] = useState(null);
  const [creating, setCreating] = useState(false);

  const load = () => {
    Promise.all([
    base44.entities.Customer.list(),
    base44.entities.Invoice.list(),
    base44.entities.Membership.list()]
    ).then(([c, inv, m]) => {
      setCustomers(c);
      setInvoices(inv);
      setMemberships(m);
      setLoading(false);
    });
  };
  useEffect(load, []);

  const filtered = customers.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search));

  const custInvoices = detail ? invoices.filter((i) => i.customer_id === detail.id).sort((a, b) => (b.date || '').localeCompare(a.date || '')) : [];
  const custMemberships = detail ? memberships.filter((m) => m.customer_id === detail.id) : [];

  const saveCustomer = async (data) => {
    if (editing) {
      await base44.entities.Customer.update(editing.id, data);
      toast.success('Đã cập nhật');
    } else {
      await base44.entities.Customer.create(data);
      toast.success('Đã thêm khách hàng');
    }
    setEditing(null);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Khách hàng</h1>
          <p className="text-slate-400 text-sm mt-1">{customers.length} khách hàng toàn chuỗi</p>
        </div>
        <button onClick={() => {setEditing({});}} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm">
          <Plus className="w-4 h-4" /> Thêm khách
        </button>
      </div>

      <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 px-3 py-2.5">
        <Search className="w-4 h-4 text-slate-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo tên hoặc SĐT..." className="bg-transparent outline-none text-sm flex-1" />
      </div>

      {loading ?
      <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin" /></div> :

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((c) => {
          const isVIP = (c.total_spent || 0) > 5000000;
          return (
            <button key={c.id} onClick={() => setDetail(c)} className="text-left rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-shadow bg-[hsl(var(--secondary))]">
                <div className="flex items-center gap-3">
                  <Avatar src={c.avatar_url} name={c.name} size={48} color="#E879A9" />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold truncate flex items-center gap-1.5">{c.name} {isVIP && <Crown className="w-3.5 h-3.5 text-amber-400" />}</div>
                    <div className="text-xs text-slate-400 flex items-center gap-1"><Phone className="w-3 h-3" />{c.phone}</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 mt-3 text-center">
                  <div><div className="font-bold text-sm">{c.visit_count || 0}</div><div className="text-[10px] text-slate-400">lần đến</div></div>
                  <div><div className="font-bold text-sm">{c.points || 0}</div><div className="text-[10px] text-slate-400">điểm</div></div>
                  <div><div className="font-bold text-sm text-pink-600">{formatVND(c.total_spent || 0).replace('₫', '')}</div><div className="text-[10px] text-slate-400">VNĐ</div></div>
                </div>
              </button>);

        })}
        </div>
      }

      {detail &&
      <CustomerDetail customer={detail} invoices={custInvoices} memberships={custMemberships} onClose={() => setDetail(null)} onEdit={() => {setEditing(detail);setDetail(null);}} />
      }
      {editing && <CustomerForm customer={editing} onClose={() => setEditing(null)} onSave={saveCustomer} />}
    </div>);

}

function CustomerDetail({ customer, invoices, memberships, onClose, onEdit }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative bg-white w-full md:max-w-lg rounded-t-3xl md:rounded-3xl p-5 max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">{customer.name}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <Avatar src={customer.avatar_url} name={customer.name} size={56} color="#E879A9" />
          <div>
            <div className="text-sm text-slate-500 flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{customer.phone}</div>
            {customer.birthday && <div className="text-sm text-slate-500 flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{formatDate(customer.birthday)}</div>}
          </div>
          <button onClick={onEdit} className="ml-auto px-3 py-1.5 rounded-full bg-slate-100 text-sm font-medium flex items-center gap-1"><Edit3 className="w-3.5 h-3.5" />Sửa</button>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-pink-50 rounded-xl p-3 text-center"><div className="font-bold text-pink-600">{formatVND(customer.total_spent || 0)}</div><div className="text-xs text-slate-500">Tổng chi</div></div>
          <div className="bg-amber-50 rounded-xl p-3 text-center"><div className="font-bold text-amber-600 flex items-center justify-center gap-1"><Gift className="w-3.5 h-3.5" />{customer.points || 0}</div><div className="text-xs text-slate-500">Điểm</div></div>
          <div className="bg-blue-50 rounded-xl p-3 text-center"><div className="font-bold text-blue-600">{customer.visit_count || 0}</div><div className="text-xs text-slate-500">Lần đến</div></div>
        </div>
        {customer.note && <div className="bg-slate-50 rounded-xl p-3 text-sm text-slate-600 mb-4">📝 {customer.note}</div>}

        {memberships.length > 0 &&
        <div className="mb-4">
            <h3 className="font-bold text-sm mb-2">Thẻ & gói</h3>
            <div className="space-y-2">
              {memberships.map((m) =>
            <div key={m.id} className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100">
                  <div>
                    <div className="font-semibold text-sm">{m.name || m.type}</div>
                    <div className="text-xs text-slate-500">{m.type === 'cash_card' ? formatVND(m.balance) + ' còn lại' : `${m.sessions_remaining}/${m.total_sessions} buổi`}</div>
                  </div>
                  <Crown className="w-5 h-5 text-purple-400" />
                </div>
            )}
            </div>
          </div>
        }

        <h3 className="font-bold text-sm mb-2">Lịch sử thanh toán</h3>
        {invoices.length === 0 ?
        <p className="text-slate-400 text-sm text-center py-6">Chưa có giao dịch</p> :

        <div className="space-y-2">
            {invoices.slice(0, 15).map((inv) =>
          <div key={inv.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                <div>
                  <div className="font-semibold text-sm">{inv.invoice_code || 'HĐ'}</div>
                  <div className="text-xs text-slate-400">{formatDate(inv.date)} • {(inv.items || []).map((i) => i.name).join(', ')}</div>
                </div>
                <div className="font-bold text-sm text-pink-600">{formatVND(inv.total)}</div>
              </div>
          )}
          </div>
        }
      </div>
    </div>);

}

function CustomerForm({ customer, onClose, onSave }) {
  const [f, setF] = useState({ name: customer.name || '', phone: customer.phone || '', email: customer.email || '', gender: customer.gender || 'female', birthday: customer.birthday || '', address: customer.address || '', note: customer.note || '', avatar_url: customer.avatar_url || '' });
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative bg-white w-full md:max-w-md rounded-t-3xl md:rounded-3xl p-5 max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold mb-4">{customer.id ? 'Sửa khách hàng' : 'Thêm khách hàng'}</h2>
        <div className="space-y-3">
          <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Họ tên" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
          <input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="Số điện thoại" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
          <input value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="Email" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
          <div className="grid grid-cols-2 gap-2">
            <select value={f.gender} onChange={(e) => setF({ ...f, gender: e.target.value })} className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm">
              <option value="female">Nữ</option><option value="male">Nam</option><option value="other">Khác</option>
            </select>
            <input type="date" value={f.birthday} onChange={(e) => setF({ ...f, birthday: e.target.value })} className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
          </div>
          <input value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} placeholder="Địa chỉ" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
          <textarea value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} placeholder="Ghi chú, sở thích, dị ứng..." rows={3} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
          <ImageUpload value={f.avatar_url} onChange={(v) => setF({ ...f, avatar_url: v })} label="Ảnh đại diện" shape="circle" />
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-slate-100 font-semibold text-sm">Hủy</button>
          <button onClick={() => f.name && f.phone ? onSave(f) : toast.error('Nhập tên & SĐT')} className="flex-1 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm">Lưu</button>
        </div>
      </div>
    </div>);

}