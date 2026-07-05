import React, { useState } from 'react';
import { Search, Plus, Minus, Trash2, Printer, UserX, Ban, CreditCard, X } from 'lucide-react';
import { formatVND } from '@/lib/format';
import Avatar from '@/components/Avatar';
import StaffAssignPicker from '@/components/StaffAssignPicker';
import EmptyCart from '@/components/pos/EmptyCart';

export default function TicketColumn({ session, staff, customers, onUpdate, onPickCustomer, onClearCustomer, onNewCustomer, onCheckout, onCancel, disabled }) {
  const [showClientSearch, setShowClientSearch] = useState(false);
  const [clientQ, setClientQ] = useState('');

  if (!session) return <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex-1 flex items-center justify-center"><EmptyCart /></div>;

  const cart = session.cart || [];
  const customer = session.customer;
  const discount = session.discount || 0;
  const tip = session.tip || 0;

  const subtotal = cart.reduce((s, x) => s + (x.price || 0) * (x.qty || 1), 0);
  const total = Math.max(0, subtotal - discount) + tip;

  const updateCart = (idx, patch) => onUpdate({ cart: cart.map((x, i) => (i === idx ? { ...x, ...patch } : x)) });
  const removeItem = (idx) => onUpdate({ cart: cart.filter((_, i) => i !== idx) });

  const clientResults = clientQ
    ? customers.filter((c) => c.name?.toLowerCase().includes(clientQ.toLowerCase()) || c.phone?.includes(clientQ)).slice(0, 6)
    : customers.slice(0, 6);

  const created = session.createdAt ? new Date(session.createdAt) : new Date();
  const dateStr = created.toLocaleDateString('vi-VN') + ' ' + created.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col h-full overflow-hidden">
      {/* Sale meta */}
      <div className="px-4 py-3 border-b border-slate-100">
        <div className="text-xs text-slate-400">Mã đơn: <span className="font-semibold text-slate-600">{session.saleCode}</span></div>
        <div className="text-xs text-slate-400 mt-0.5">{dateStr}</div>
      </div>

      {/* Client */}
      <div className="px-4 py-3 border-b border-slate-100">
        {customer ? (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-pink-50">
            <Avatar src={customer.avatar_url} name={customer.name} size={36} color="#E879A9" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm truncate">{customer.name}</div>
              <div className="text-xs text-slate-500">{customer.points || 0} điểm • {formatVND(customer.total_spent || 0)}</div>
            </div>
            <button onClick={onClearCustomer} className="text-slate-400 hover:text-red-500"><UserX className="w-4 h-4" /></button>
          </div>
        ) : showClientSearch ? (
          <div className="relative">
            <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2.5 mb-2">
              <Search className="w-4 h-4 text-slate-400" />
              <input autoFocus value={clientQ} onChange={(e) => setClientQ(e.target.value)}
                placeholder="Nhập tên, email hoặc SĐT..."
                className="bg-transparent outline-none text-sm flex-1" />
              <button onClick={() => { setShowClientSearch(false); setClientQ(''); }} className="text-slate-400"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              <button onClick={() => { onPickCustomer({ name: 'Khách vãng lai', phone: '', points: 0, total_spent: 0 }); setShowClientSearch(false); }}
                className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 text-left text-sm text-slate-500">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-xs">VL</div>
                Khách vãng lai
              </button>
              {clientResults.map((c) => (
                <button key={c.id} onClick={() => { onPickCustomer(c); setShowClientSearch(false); setClientQ(''); }}
                  className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 text-left">
                  <Avatar src={c.avatar_url} name={c.name} size={32} color="#E879A9" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{c.name}</div>
                    <div className="text-xs text-slate-400">{c.phone} • {c.points || 0} điểm</div>
                  </div>
                </button>
              ))}
            </div>
            <button onClick={onNewCustomer} className="text-sm text-primary font-semibold flex items-center gap-1 mt-2">
              <Plus className="w-4 h-4" /> Thêm khách hàng mới
            </button>
          </div>
        ) : (
          <button onClick={() => setShowClientSearch(true)}
            className="w-full flex items-center gap-2 p-2.5 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 text-sm hover:border-pink-300 hover:text-pink-500 transition-colors">
            <Search className="w-4 h-4" /> Nhập tên, email hoặc SĐT khách hàng
          </button>
        )}
      </div>

      {/* Cart items */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {cart.length === 0 ? (
          <EmptyCart subtitle="Chọn dịch vụ, sản phẩm hoặc gói để thanh toán" />
        ) : (
          <div className="space-y-2">
            {cart.map((x, i) => (
              <div key={i} className="bg-slate-50 rounded-xl p-2.5">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-sm flex-1 min-w-0 truncate">{x.name}</div>
                  <button onClick={() => removeItem(i)} className="text-slate-300 hover:text-red-500 ml-2 shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <div className="flex items-center gap-1">
                    <button onClick={() => updateCart(i, { qty: Math.max(1, (x.qty || 1) - 1) })} className="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center"><Minus className="w-3 h-3" /></button>
                    <span className="w-7 text-center text-sm font-semibold">{x.qty || 1}</span>
                    <button onClick={() => updateCart(i, { qty: (x.qty || 1) + 1 })} className="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center"><Plus className="w-3 h-3" /></button>
                  </div>
                  <span className="font-bold text-sm text-pink-600">{formatVND((x.price || 0) * (x.qty || 1))}</span>
                </div>
                {x.type === 'service' && (
                  <div className="mt-1.5">
                    <StaffAssignPicker staff={staff} value={x.staff_id} onChange={(id, name) => updateCart(i, { staff_id: id, staff_name: name })} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="border-t border-slate-100 px-4 py-3 space-y-2">
        <div className="flex justify-between text-sm"><span className="text-slate-500">Tạm tính</span><span className="font-semibold">{formatVND(subtotal)}</span></div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Giảm giá</span>
          <input type="number" value={discount || ''} onChange={(e) => onUpdate({ discount: Math.max(0, Number(e.target.value) || 0) })} placeholder="0"
            className="w-24 text-right px-2 py-1 rounded-lg border border-slate-200 text-sm" />
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Tip</span>
          <input type="number" value={tip || ''} onChange={(e) => onUpdate({ tip: Math.max(0, Number(e.target.value) || 0) })} placeholder="0"
            className="w-24 text-right px-2 py-1 rounded-lg border border-slate-200 text-sm" />
        </div>
        <div className="flex justify-between items-center pt-1">
          <span className="font-bold">Tổng tiền</span>
          <span className="text-xl font-bold text-pink-600">{formatVND(total)}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-100 px-4 py-3 flex items-center gap-2">
        <button disabled className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-300 cursor-not-allowed">
          <Printer className="w-4 h-4" />
        </button>
        <button onClick={onCancel} className="px-4 py-2.5 rounded-xl border border-slate-200 font-semibold text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-1.5">
          <Ban className="w-4 h-4" /> Huỷ đơn
        </button>
        <button onClick={onCheckout} disabled={disabled || cart.length === 0}
          className="flex-1 py-2.5 rounded-xl bg-primary text-white font-bold text-sm disabled:opacity-40 flex items-center justify-center gap-2">
          <CreditCard className="w-4 h-4" /> Thanh toán
        </button>
      </div>
    </div>
  );
}