import React, { useState, useEffect } from 'react';
import { X, Plus, Check } from 'lucide-react';
import { formatVND } from '@/lib/format';
import { toast } from '@/components/Layout';

const METHODS = [
  { value: 'cash', label: 'Tiền mặt' },
  { value: 'transfer', label: 'Chuyển khoản/QR' },
  { value: 'card', label: 'Thẻ ngân hàng' },
  { value: 'ewallet', label: 'Ví điện tử' },
  { value: 'membership', label: 'Thẻ membership' },
  { value: 'points', label: 'Điểm tích lũy' },
];

export default function CheckoutModal({ open, onClose, session, onConfirm, paying }) {
  const [payments, setPayments] = useState([{ method: 'cash', amount: 0 }]);
  const [tip, setTip] = useState(0);
  const [discount, setDiscount] = useState(0);

  useEffect(() => {
    if (open && session) {
      setTip(session.tip || 0);
      setDiscount(session.discount || 0);
      setPayments([{ method: 'cash', amount: 0 }]);
    }
  }, [open, session]);

  if (!open || !session) return null;

  const cart = session.cart || [];
  const subtotal = cart.reduce((s, x) => s + (x.price || 0) * (x.qty || 1), 0);
  const total = Math.max(0, subtotal - discount) + tip;
  const paidSum = payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const remaining = total - paidSum;

  const confirm = () => {
    if (Math.abs(remaining) > 1) return toast.error(`Số tiền chưa khớp (còn ${formatVND(remaining)})`);
    onConfirm({ tip, discount, payments: payments.filter((p) => p.amount > 0) });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative bg-white w-full md:max-w-md rounded-t-3xl md:rounded-3xl p-5 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Thanh toán</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"><X className="w-4 h-4" /></button>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm"><span className="text-slate-500">Tạm tính</span><span className="font-semibold">{formatVND(subtotal)}</span></div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Giảm giá</span>
            <input type="number" value={discount || ''} onChange={(e) => setDiscount(Math.max(0, Number(e.target.value) || 0))} placeholder="0"
              className="w-28 text-right px-2 py-1.5 rounded-lg border border-slate-200 text-sm" />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Tip</span>
            <input type="number" value={tip || ''} onChange={(e) => setTip(Math.max(0, Number(e.target.value) || 0))} placeholder="0"
              className="w-28 text-right px-2 py-1.5 rounded-lg border border-slate-200 text-sm" />
          </div>
          <div className="flex justify-between items-center pt-1 border-t border-slate-100">
            <span className="font-bold">Tổng cộng</span>
            <span className="text-xl font-bold text-pink-600">{formatVND(total)}</span>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="text-sm font-semibold">Phương thức thanh toán</div>
          {payments.map((p, i) => (
            <div key={i} className="flex items-center gap-2">
              <select value={p.method} onChange={(e) => setPayments((arr) => arr.map((x, j) => (j === i ? { ...x, method: e.target.value } : x)))}
                className="flex-1 px-2.5 py-2.5 rounded-lg border border-slate-200 text-sm bg-white">
                {METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              <input type="number" value={p.amount || ''} onChange={(e) => setPayments((arr) => arr.map((x, j) => (j === i ? { ...x, amount: Number(e.target.value) || 0 } : x)))} placeholder="0"
                className="w-28 px-2.5 py-2.5 rounded-lg border border-slate-200 text-sm" />
              {payments.length > 1 && <button onClick={() => setPayments((arr) => arr.filter((_, j) => j !== i))} className="text-slate-300 hover:text-red-500"><X className="w-4 h-4" /></button>}
            </div>
          ))}
          <div className="flex items-center justify-between">
            <span className={`text-sm font-semibold ${remaining > 1 ? 'text-red-500' : remaining < -1 ? 'text-blue-500' : 'text-green-600'}`}>
              {remaining > 1 ? `Còn ${formatVND(remaining)}` : remaining < -1 ? `Thừa ${formatVND(-remaining)}` : 'Đủ thanh toán ✓'}
            </span>
            <button onClick={() => setPayments((arr) => [...arr, { method: 'cash', amount: 0 }])} className="text-sm text-primary font-semibold flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> Thêm phương thức
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-slate-100 font-semibold text-sm">Huỷ</button>
          <button onClick={confirm} disabled={paying} className="flex-1 py-3 rounded-xl bg-primary text-white font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
            {paying ? 'Đang xử lý...' : <><Check className="w-4 h-4" /> Xác nhận</>}
          </button>
        </div>
      </div>
    </div>
  );
}