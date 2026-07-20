'use client';
import React, { useEffect, useState } from 'react';
import { ArrowLeft, Printer, Ban, Check, Edit3, Plus, Minus, Trash2, CreditCard, X, Crown, QrCode, ShieldCheck } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { base44 } from '@/api/base44Client';
import { formatVND, formatDate } from '@/lib/format';
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

export default function InvoiceDetail({ invoiceId: invoiceIdProp } = {}) {
  const params = useParams();
  const id = invoiceIdProp || params?.id;
  const router = useRouter();
  const [invoice, setInvoice] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [paying, setPaying] = useState(false);
  const [editItems, setEditItems] = useState([]);
  const [editDiscount, setEditDiscount] = useState(0);
  const [editTip, setEditTip] = useState(0);
  const [payMethods, setPayMethods] = useState([{ method: 'cash', amount: 0 }]);

  const [customerMemberships, setCustomerMemberships] = useState([]);
  const [customerInvoices, setCustomerInvoices] = useState([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      base44.entities.Invoice.get(id),
      base44.entities.Staff.list(),
      base44.entities.Customer.list()
    ]).then(([inv, st, cus]) => {
      setInvoice(inv);
      setStaff(st);
      setEditItems(inv.items || []);
      setEditDiscount(inv.discount || 0);
      setEditTip(inv.tip || 0);
      const matchedCustomer = cus.find(c => c.id === inv.customer_id);
      setCustomer(matchedCustomer || null);

      if (inv.customer_id) {
        Promise.all([
          base44.entities.Membership.filter({ customer_id: inv.customer_id }),
          base44.entities.Invoice.filter({ customer_id: inv.customer_id })
        ]).then(([mems, invs]) => {
          setCustomerMemberships(mems || []);
          setCustomerInvoices(invs || []);
        }).catch(() => {});
      }

      setLoading(false);
    }).catch(() => {
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
      // Check if any package items were removed from the invoice
      try {
        const oldPackages = (invoice.items || []).filter(item => item.type !== 'service' && item.type !== 'product');
        const newPackages = (editItems || []).filter(item => item.type !== 'service' && item.type !== 'product');
        
        for (const oldPkg of oldPackages) {
          const stillExists = newPackages.some(newPkg => newPkg.name === oldPkg.name);
          if (!stillExists) {
            const relatedMems = await base44.entities.Membership.filter({ invoice_id: id, name: oldPkg.name });
            for (const m of relatedMems) {
              await base44.entities.Membership.update(m.id, { is_deleted: true, status: 'deleted' });
            }
          }
        }
      } catch (err) {
        console.error('Lỗi khi cập nhật trạng thái thẻ mua kèm hoá đơn:', err);
      }

      const newSubtotal = editItems.reduce((s, x) => s + (x.price || 0) * (x.qty || 1), 0);
      const newTotal = Math.max(0, newSubtotal - editDiscount);
      await base44.entities.Invoice.update(id, {
        customer_name: (invoice.customer_name && invoice.customer_name.trim()) ? invoice.customer_name.trim() : 'Khách vãng lai',
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
      
      // Update associated memberships to deleted status
      try {
        const relatedMems = await base44.entities.Membership.filter({ invoice_id: id });
        for (const m of relatedMems) {
          await base44.entities.Membership.update(m.id, { is_deleted: true, status: 'deleted' });
        }
      } catch (err) {
        console.error('Lỗi khi cập nhật trạng thái thẻ mua kèm hoá đơn:', err);
      }

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
        customer_name: (invoice.customer_name && invoice.customer_name.trim()) ? invoice.customer_name.trim() : 'Khách vãng lai',
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

  const boughtCardItem = invoice && (invoice.items || []).find(item => 
    item.name.toLowerCase().includes('thẻ') || 
    item.name.toLowerCase().includes('card') || 
    item.name.toLowerCase().includes('ví')
  );

  const matchedCard = boughtCardItem && customerMemberships.find(m => 
    m.name === boughtCardItem.name && m.type === 'cash_card'
  );

  const usageInvoices = customerInvoices.filter(inv => 
    (inv.payment_methods || []).some(pm => pm.method === 'membership' || pm.method === 'cash_card')
  );

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push(-1)} className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50">
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
        <Avatar src={customer?.avatar_url} name={invoice.customer_name} size={44} color="#E879A9" />
        <div>
          <div className="font-bold">{invoice.customer_name}</div>
          <div className="text-xs text-slate-400">{customer?.phone || 'Chưa cập nhật số điện thoại'}</div>
        </div>
      </div>

      {/* Purchased Cash Card (Prepaid Card) Section */}
      {matchedCard && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
          <div className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 text-primary" /> Thẻ tiền mặt đã mua trong đơn hàng này
          </div>
          
          {/* Card Look */}
          <div 
            onClick={() => setShowHistoryModal(true)}
            className="cursor-pointer relative overflow-hidden rounded-2xl p-5 text-white shadow-md hover:shadow-lg transition-all flex flex-col justify-between h-40 bg-gradient-to-tr from-pink-500 to-rose-400 group"
          >
            <div className="absolute top-0 right-0 w-28 h-28 bg-white/10 rounded-full -mr-8 -mt-8 blur-lg transition-all group-hover:scale-110" />
            <div className="flex justify-between items-start">
              <div>
                <div className="text-[10px] uppercase tracking-wider opacity-75 font-bold">Thẻ Tiền Mặt</div>
                <div className="font-extrabold text-base tracking-wide mt-0.5">{matchedCard.name}</div>
              </div>
              <Crown className="w-6 h-6 text-amber-300 opacity-90 animate-pulse" />
            </div>
            
            <div className="space-y-1">
              <div className="text-[10px] uppercase tracking-wider opacity-75 font-bold">Số dư hiện tại</div>
              <div className="text-2xl font-black tracking-tight">{formatVND(matchedCard.balance)}</div>
            </div>
            
            <div className="flex justify-between items-center text-[10px] opacity-75 font-semibold">
              <span>Mã thẻ: **** **** **** {matchedCard.id.slice(-4).toUpperCase()}</span>
              <span className="bg-white/20 px-2 py-0.5 rounded text-[9px] uppercase font-bold text-white hover:bg-white/30 transition-colors">
                Xem lịch sử chi tiêu &rarr;
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Card Spending History Modal Overlay */}
      {showHistoryModal && matchedCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-in fade-in duration-200" onClick={() => setShowHistoryModal(false)}>
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full border border-slate-100 shadow-2xl relative text-left text-xs text-slate-650 space-y-4 animate-in scale-in duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Lịch sử chi tiêu qua thẻ</h3>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">{matchedCard.name}</p>
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>

            {/* List of usage invoices */}
            <div className="max-h-[350px] overflow-y-auto space-y-2.5 pr-1">
              {usageInvoices.length === 0 ? (
                <p className="text-slate-400 text-xs text-center py-10 font-normal">Chưa có giao dịch chi tiêu nào qua thẻ này</p>
              ) : (
                usageInvoices.map((inv) => {
                  const pmItem = (inv.payment_methods || []).find(pm => pm.method === 'membership' || pm.method === 'cash_card');
                  return (
                    <div key={inv.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors">
                      <div className="space-y-1">
                        <div className="font-bold text-slate-800 flex items-center gap-1.5">
                          <button 
                            onClick={() => {
                              setShowHistoryModal(false);
                              router.push(`/invoices/${inv.id}`);
                            }}
                            className="text-primary hover:underline font-bold"
                          >
                            {inv.invoice_code || '—'}
                          </button>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100 font-bold">Thanh toán</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-normal">Ngày dùng: {formatDate(inv.date)}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-extrabold text-sm text-rose-600">-{formatVND(pmItem?.amount || 0)}</div>
                        <div className="text-[9px] text-slate-400 font-normal">Khấu trừ số dư</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors text-slate-600 font-bold text-xs"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

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