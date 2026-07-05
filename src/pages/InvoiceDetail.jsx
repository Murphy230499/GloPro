import React, { useEffect, useState } from 'react';
import { ArrowLeft, Printer, Ban, Check, Edit3, Plus, Minus, Trash2, CreditCard, X } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { formatVND } from '@/lib/format';
import { toast } from '@/components/Layout';
import Avatar from '@/components/Avatar';
import StaffAssignPicker from '@/components/StaffAssignPicker';

const METHODS = [
  { value: 'cash', label: 'Tiền mặt' },
  { value: 'transfer', label: 'Chuyển khoản/QR' },
  { value: 'card', label: 'Thẻ ngân hàng' },
  { value: 'ewallet', label: 'Ví điện tử' },
  { value: 'membership', label: 'Thẻ membership' },
  { value: 'points', label: 'Điểm tích lũy' },
];

const STATUS_BADGE = {
  paid: { bg: '#D1FAE5', text: '#047857', label: 'Đã thanh toán' },
  unpaid: { bg: '#FEF3C7', text: '#B45309', label: 'Chưa thanh toán' },
  cancelled: { bg: '#FEE2E2', text: '#B91C1C', label: 'Đã huỷ' },
  refunded: { bg: '#FEE2E2', text: '#B91C1C', label: 'Đã hoàn' },
};

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [paying, setPaying] = useState(false);
  const [editItems, setEditItems] = useState([]);
  const [editDiscount, setEditDiscount] = useState(0);
  const [editTip, setEditTip] = useState(0);
  const [payMethods, setPayMethods] = useState([{ method: 'cash', amount: 0 }]);

  const load = () => {
    setLoading(true);
    Promise.all([
      base44.entities.Invoice.get(id),
      base44.entities.Staff.list(),
    ]).then(([inv, st]) => {
      setInvoice(inv);
      setStaff(st);
      setEditItems(inv.items || []);
      setEditDiscount(inv.discount || 0);
      setEditTip(inv.tip || 0);
      setLoading(false);
    });
  };

  useEffect(load, [id]);

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin" /></div>;
  }

  if (!invoice) {
    return <div className="text-center py-20 text-slate-400">Không tìm thấy hoá đơn</div>;
  }

  const badge = STATUS_BADGE[invoice.status] || STATUS_BADGE.unpaid;
  const isPaid = invoice.status === 'paid';
  const isUnpaid = invoice.status === 'unpaid';
  const isCancelled = invoice.status === 'cancelled' || invoice.status === 'refunded';

  const subtotal = editItems.reduce((s, x) => s + (x.price || 0) * (x.qty || 1), 0);
  const total = Math.max(0, subtotal - editDiscount);
  const grandTotal = total + editTip;
  const paidSum = payMethods.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const remaining = grandTotal - paidSum;

  const updateEditItem = (idx, patch) => setEditItems((arr) => arr.map((x, i) => (i === idx ? { ...x, ...patch } : x)));
  const removeEditItem = (idx) => setEditItems((arr) => arr.filter((_, i) => i !== idx));

  const saveEdit = async () => {
    try {
      const newSubtotal = editItems.reduce((s, x) => s + (x.price || 0) * (x.qty || 1), 0);
      const newTotal = Math.max(0, newSubtotal - editDiscount);
      await base44.entities.Invoice.update(id, {
        items: editItems,
        discount: editDiscount,
        subtotal: newSubtotal,
        total: newTotal,
        tip: editTip,
      });
      toast.success('Đã cập nhật hoá đơn');
      setEditing(false);
      load();
    } catch (e) {
      toast.error('Lỗi: ' + (e.message || e));
    }
  };

  const cancelInvoice = async () => {
    if (!confirm('Huỷ hoá đơn này? Hành động không thể hoàn tác.')) return;
    try {
      await base44.entities.Invoice.update(id, { status: 'cancelled' });
      toast.success('Đã huỷ hoá đơn');
      load();
    } catch (e) {
      toast.error('Lỗi: ' + (e.message || e));
    }
  };

  const payInvoice = async () => {
    if (Math.abs(remaining) > 1) return toast.error(`Số tiền chưa khớp (còn ${formatVND(remaining)})`);
    setPaying(true);
    try {
      const methods = payMethods.filter((p) => p.amount > 0);
      await base44.entities.Invoice.update(id, {
        status: 'paid',
        payment_methods: methods,
        tip: editTip,
      });
      toast.success('Thanh toán thành công');
      setPaying(false);
      load();
    } catch (e) {
      toast.error('Lỗi: ' + (e.message || e));
      setPaying(false);
    }
  };

  const printInvoice = async () => {
    const win = window.open('', '_blank', 'width=400,height=600');
    const itemsHtml = (invoice.items || []).map((it) => `
      <tr>
        <td>${it.name}</td>
        <td style="text-align:center">${it.qty || 1}</td>
        <td style="text-align:right">${formatVND((it.price || 0) * (it.qty || 1))}</td>
      </tr>
    `).join('');
    win.document.write(`
      <html><head><title>${invoice.invoice_code}</title>
      <style>
        body { font-family: sans-serif; padding: 20px; color: #333; }
        h2 { text-align: center; margin-bottom: 5px; }
        .info { margin: 10px 0; font-size: 13px; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 13px; }
        th, td { padding: 6px 4px; border-bottom: 1px solid #eee; }
        th { text-align: left; color: #666; }
        .total { font-size: 16px; font-weight: bold; margin-top: 10px; }
        .right { text-align: right; }
      </style></head><body>
      <h2>ZenGroom</h2>
      <div class="info"><b>Mã HD:</b> ${invoice.invoice_code}</div>
      <div class="info"><b>Khách hàng:</b> ${invoice.customer_name}</div>
      <div class="info"><b>Ngày:</b> ${invoice.date}</div>
      <table>
        <thead><tr><th>Dịch vụ/Sản phẩm</th><th>SL</th><th class="right">Giá</th></tr></thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      <div class="info">Tạm tính: <span class="right">${formatVND(invoice.subtotal)}</span></div>
      ${invoice.discount ? `<div class="info">Giảm giá: <span class="right">${formatVND(invoice.discount)}</span></div>` : ''}
      ${invoice.tip ? `<div class="info">Tip: <span class="right">${formatVND(invoice.tip)}</span></div>` : ''}
      <div class="total">Tổng cộng: <span class="right">${formatVND(invoice.total + (invoice.tip || 0))}</span></div>
      <div class="info" style="margin-top:20px;text-align:center;color:#999;font-size:12px">Cảm ơn quý khách!</div>
      </body></html>
    `);
    win.document.close();
    win.print();
    await base44.entities.Invoice.update(id, { print_count: (invoice.print_count || 0) + 1 });
    load();
  };

  const itemsToShow = editing ? editItems : (invoice.items || []);

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/invoices')} className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">{invoice.invoice_code}</h1>
            <p className="text-slate-400 text-xs mt-0.5">{invoice.date}</p>
          </div>
        </div>
        <span className="text-sm font-semibold px-3 py-1.5 rounded-full" style={{ background: badge.bg, color: badge.text }}>
          {badge.label}
        </span>
      </div>

      {/* Customer info */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
        <Avatar name={invoice.customer_name} size={44} color="#E879A9" />
        <div>
          <div className="font-bold">{invoice.customer_name}</div>
          <div className="text-xs text-slate-400">Mã hoá đơn: {invoice.invoice_code}</div>
        </div>
      </div>

      {/* Items */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold">Chi tiết hoá đơn</h3>
          {!isCancelled && !editing && (
            <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 text-sm text-pink-600 font-semibold">
              <Edit3 className="w-4 h-4" /> Chỉnh sửa
            </button>
          )}
        </div>

        <div className="space-y-2">
          {itemsToShow.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-4">Không có mục nào</p>
          ) : (
            itemsToShow.map((it, i) => (
              <div key={i} className="bg-slate-50 rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-sm flex-1">{it.name}</div>
                  {editing && <button onClick={() => removeEditItem(i)} className="text-slate-300 hover:text-red-500 ml-2"><Trash2 className="w-3.5 h-3.5" /></button>}
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  {editing ? (
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateEditItem(i, { qty: Math.max(1, (it.qty || 1) - 1) })} className="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center"><Minus className="w-3 h-3" /></button>
                      <span className="w-7 text-center text-sm font-semibold">{it.qty || 1}</span>
                      <button onClick={() => updateEditItem(i, { qty: (it.qty || 1) + 1 })} className="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center"><Plus className="w-3 h-3" /></button>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">SL: {it.qty || 1}</span>
                  )}
                  <span className="font-bold text-sm text-pink-600">{formatVND((it.price || 0) * (it.qty || 1))}</span>
                </div>
                {(editing || it.staff_name) && (
                  <div className="mt-1.5">
                    {editing ? (
                      <StaffAssignPicker staff={staff} value={it.staff_id} onChange={(sid, name) => updateEditItem(i, { staff_id: sid, staff_name: name })} />
                    ) : (
                      <span className="text-xs text-slate-500">KTV: {it.staff_name}</span>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Totals */}
        <div className="border-t border-slate-100 mt-3 pt-3 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Tạm tính</span>
            <span className="font-semibold">{formatVND(editing ? subtotal : invoice.subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Giảm giá</span>
            {editing ? (
              <input type="number" value={editDiscount || ''} onChange={(e) => setEditDiscount(Math.max(0, Number(e.target.value) || 0))} placeholder="0" className="w-24 text-right px-2 py-1 rounded-lg border border-slate-200 text-sm" />
            ) : (
              <span className="font-semibold">{formatVND(invoice.discount)}</span>
            )}
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Tip</span>
            {editing ? (
              <input type="number" value={editTip || ''} onChange={(e) => setEditTip(Math.max(0, Number(e.target.value) || 0))} placeholder="0" className="w-24 text-right px-2 py-1 rounded-lg border border-slate-200 text-sm" />
            ) : (
              <span className="font-semibold">{formatVND(invoice.tip)}</span>
            )}
          </div>
          <div className="flex justify-between items-center pt-1">
            <span className="font-bold">Tổng cộng</span>
            <span className="text-xl font-bold text-pink-600">{formatVND(editing ? grandTotal : (invoice.total + (invoice.tip || 0)))}</span>
          </div>
        </div>

        {/* Payment methods display (for paid) */}
        {!editing && invoice.payment_methods && invoice.payment_methods.length > 0 && (
          <div className="border-t border-slate-100 mt-3 pt-3">
            <div className="text-sm font-semibold mb-2">Phương thức thanh toán</div>
            {invoice.payment_methods.map((p, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-slate-500">{METHODS.find((m) => m.value === p.method)?.label || p.method}</span>
                <span className="font-medium">{formatVND(p.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment section for unpaid */}
      {isUnpaid && !editing && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <h3 className="font-bold mb-3 flex items-center gap-2"><CreditCard className="w-4 h-4 text-slate-500" /> Thanh toán</h3>
          {payMethods.map((p, i) => (
            <div key={i} className="flex items-center gap-2 mb-2">
              <select value={p.method} onChange={(e) => setPayMethods((arr) => arr.map((x, j) => (j === i ? { ...x, method: e.target.value } : x)))} className="flex-1 px-2 py-2 rounded-lg border border-slate-200 text-sm bg-white">
                {METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              <input type="number" value={p.amount || ''} onChange={(e) => setPayMethods((arr) => arr.map((x, j) => (j === i ? { ...x, amount: Number(e.target.value) || 0 } : x)))} placeholder="0" className="w-28 px-2 py-2 rounded-lg border border-slate-200 text-sm" />
              {payMethods.length > 1 && <button onClick={() => setPayMethods((arr) => arr.filter((_, j) => j !== i))} className="text-slate-300"><X className="w-4 h-4" /></button>}
            </div>
          ))}
          <div className="flex items-center justify-between text-xs mb-3">
            <span className={remaining > 1 ? 'text-red-500 font-semibold' : 'text-green-600 font-semibold'}>
              {remaining > 1 ? `Còn ${formatVND(remaining)}` : remaining < -1 ? `Thừa ${formatVND(-remaining)}` : 'Đủ thanh toán ✓'}
            </span>
            <button onClick={() => setPayMethods((arr) => [...arr, { method: 'cash', amount: 0 }])} className="text-pink-600 font-medium flex items-center gap-1 text-xs"><Plus className="w-3 h-3" /> Thêm</button>
          </div>
          <button onClick={payInvoice} disabled={paying} className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
            {paying ? 'Đang xử lý...' : <><Check className="w-4 h-4" /> Xác nhận thanh toán</>}
          </button>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 flex-wrap">
        {editing && (
          <>
            <button onClick={saveEdit} className="flex-1 py-3 rounded-xl bg-primary text-white font-bold text-sm flex items-center justify-center gap-2">
              <Check className="w-4 h-4" /> Lưu thay đổi
            </button>
            <button onClick={() => { setEditing(false); setEditItems(invoice.items || []); setEditDiscount(invoice.discount || 0); setEditTip(invoice.tip || 0); }} className="flex-1 py-3 rounded-xl bg-slate-100 font-bold text-sm">
              Huỷ
            </button>
          </>
        )}
        {!editing && !isCancelled && isPaid && (
          <>
            <button onClick={printInvoice} className="flex-1 py-3 rounded-xl bg-blue-500 text-white font-bold text-sm flex items-center justify-center gap-2">
              <Printer className="w-4 h-4" /> In hoá đơn
            </button>
            <button onClick={() => setEditing(true)} className="flex-1 py-3 rounded-xl border border-slate-200 bg-white font-bold text-sm flex items-center justify-center gap-2">
              <Edit3 className="w-4 h-4" /> Chỉnh sửa
            </button>
            <button onClick={cancelInvoice} className="flex-1 py-3 rounded-xl bg-red-50 text-red-600 font-bold text-sm flex items-center justify-center gap-2">
              <Ban className="w-4 h-4" /> Huỷ hoá đơn
            </button>
          </>
        )}
        {!editing && !isCancelled && isUnpaid && (
          <>
            <button onClick={() => setEditing(true)} className="flex-1 py-3 rounded-xl border border-slate-200 bg-white font-bold text-sm flex items-center justify-center gap-2">
              <Edit3 className="w-4 h-4" /> Chỉnh sửa
            </button>
            <button onClick={cancelInvoice} className="flex-1 py-3 rounded-xl bg-red-50 text-red-600 font-bold text-sm flex items-center justify-center gap-2">
              <Ban className="w-4 h-4" /> Huỷ hoá đơn
            </button>
          </>
        )}
        {!editing && isCancelled && (
          <div className="w-full text-center py-4 text-slate-400 text-sm">Hoá đơn đã bị huỷ</div>
        )}
      </div>
    </div>
  );
}