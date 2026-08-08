'use client';
import React, { useEffect, useState } from 'react';
import { ArrowLeft, Printer, Trash2, Edit3, Plus, Minus, CreditCard, X, Crown, Phone, Clock, User, Users, Camera, RefreshCw, History, RotateCcw } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useT } from '@/lib/i18n';
import { base44 } from '@/api/base44Client';
import { formatVND, formatDate } from '@/lib/format';
import { toast } from '@/components/Layout';
import StaffAssignPicker from '@/components/StaffAssignPicker';
import POSInvoiceModal from '@/components/POSInvoiceModal';
import Avatar from '@/components/Avatar';
import { getNormalizedLogs, createLogEntry } from '@/lib/logHelper';







const groupCartItems = (cart) => {
  const groups = {};
  (cart || []).forEach((item, index) => {
    const type = item.type || 'service';
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push({ item, index });
  });
  return groups;
};

export default function InvoiceDetail({ invoiceId: invoiceIdProp } = {}) {
  const { t } = useT();

  const METHODS = [
    { value: 'cash', label: t('pos.payment.cash', 'Tiền mặt') },
    { value: 'transfer', label: t('pos.payment.transfer', 'Chuyển khoản') },
    { value: 'card', label: t('pos.payment.card', 'Thẻ tín dụng') },
    { value: 'ewallet', label: t('pos.payment.ewallet', 'Ví điện tử') },
    { value: 'membership', label: t('pos.payment.membership', 'Thẻ tiền mặt') },
    { value: 'points', label: t('pos.payment.points', 'Điểm tích lũy') },
    { value: 'debt', label: t('pos.payment.debt', 'Ghi nợ') },
  ];

  const STATUS_BADGE = {
    paid: { bg: '#E6F4EA', text: '#137333', border: '#CEEAD6', label: t('invoices.status.paid', 'Đã thanh toán') },
    unpaid: { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A', label: t('invoices.status.unpaid', 'Chưa thanh toán') },
    cancelled: { bg: '#FEE2E2', text: '#DC2626', border: '#FCA5A5', label: t('invoices.status.cancelled', 'Đã huỷ') },
    refunded: { bg: '#FEE2E2', text: '#DC2626', border: '#FCA5A5', label: t('invoices.status.refunded', 'Đã hoàn') },
  };

  const TYPE_LABELS = {
    service: t('pos.invoice.service', 'Dịch vụ'),
    product: t('pos.invoice.product', 'Sản phẩm'),
    package: t('pos.invoice.package', 'Gói dịch vụ'),
    treatment: t('pos.invoice.treatment', 'Liệu trình'),
    service_combo: t('pos.invoice.service_combo', 'Combo dịch vụ'),
    product_combo: t('pos.invoice.product_combo', 'Combo sản phẩm'),
    prepaid_card: t('pos.invoice.prepaid_card', 'Thẻ tiền mặt'),
  };
  const params = useParams();
  const id = invoiceIdProp || params?.id;
  const router = useRouter();

  const [invoice, setInvoice] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editItems, setEditItems] = useState([]);
  const [editDiscount, setEditDiscount] = useState(0);
  const [editTip, setEditTip] = useState(0);

  // Modals state
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showPosModal, setShowPosModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payMethods, setPayMethods] = useState([{ method: 'cash', amount: 0 }]);

  const [customerMemberships, setCustomerMemberships] = useState([]);

  const load = () => {
    setLoading(true);
    Promise.all([
      base44.entities.Invoice.get(id),
      base44.entities.Staff.list(),
      base44.entities.Customer.list()
    ]).then(([inv, st, cus]) => {
      setInvoice(inv);
      setStaff(st.filter((x) => x.is_active !== false));
      setEditItems(inv.items || []);
      setEditDiscount(inv.discount || 0);
      setEditTip(inv.tip || 0);

      const matchedCustomer = cus.find(c => (inv.customer_id && String(c.id) === String(inv.customer_id)) || (inv.customer_name && inv.customer_name !== t('invoices.walk_in', 'Khách vãng lai') && c.name && c.name.trim().toLowerCase() === inv.customer_name.trim().toLowerCase()));
      setCustomer(matchedCustomer || null);

      if (inv.total) {
        setPayMethods(inv.payment_methods?.length ? inv.payment_methods : [{ method: 'cash', amount: inv.total }]);
      }

      if (inv.customer_id) {
        base44.entities.Membership.filter({ customer_id: inv.customer_id })
          .then((mems) => setCustomerMemberships(mems || []))
          .catch(() => {});
      }

      setLoading(false);
    }).catch((err) => {
      console.error(err);
      setLoading(false);
    });
  };

  useEffect(load, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-20 bg-white">
        <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-20 text-slate-400 font-sans bg-white">
        Không tìm thấy hoá đơn
      </div>
    );
  }

  const displayDateTime = (() => {
    if (invoice?.time && invoice?.date) {
      return `${invoice.time} ${invoice.date}`;
    }
    if (invoice?.created_at) {
      try {
        const d = new Date(invoice.created_at);
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const mo = String(d.getMonth() + 1).padStart(2, '0');
        const yr = d.getFullYear();
        return `${hh}:${mm} ${day}/${mo}/${yr}`;
      } catch (e) {}
    }
    if (invoice?.date) {
      if (invoice.date.includes(':')) return invoice.date;
      return `14:34 ${invoice.date}`;
    }
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm} ${formatDate(d)}`;
  })();

  const badge = STATUS_BADGE[invoice.status] || STATUS_BADGE.unpaid;
  const isPaid = invoice.status === 'paid';
  const isUnpaid = invoice.status === 'unpaid';
  const isCancelled = invoice.status === 'cancelled' || invoice.status === 'refunded';

  const subtotal = editItems.reduce((s, x) => s + (x.price || 0) * (x.qty || 1), 0);
  const total = Math.max(0, subtotal - editDiscount);
  const grandTotal = total + editTip;
  const paidSum = isPaid 
    ? (invoice.payment_methods?.reduce((s, p) => s + (Number(p.amount) || 0), 0) || invoice.total) 
    : payMethods.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const remaining = Math.max(0, (invoice.total || grandTotal) - paidSum);

  const updateEditItem = (idx, patch) => setEditItems((arr) => arr.map((x, i) => (i === idx ? { ...x, ...patch } : x)));
  const removeEditItem = (idx) => setEditItems((arr) => arr.filter((_, i) => i !== idx));

  const addLogEntry = (action, details) => {
    const existing = getNormalizedLogs(invoice);
    return [
      ...existing,
      createLogEntry(action, details, 'Thu ngân')
    ];
  };

  const saveEdit = async () => {
    try {
      const newSubtotal = editItems.reduce((s, x) => s + (x.price || 0) * (x.qty || 1), 0);
      const newTotal = Math.max(0, newSubtotal - editDiscount);
      const updatedLogs = addLogEntry(t('invoices.action.edit', 'Chỉnh sửa hoá đơn'), `Cập nhật lại chi tiết hoá đơn và giảm giá (${formatVND(editDiscount)})`);
      await base44.entities.Invoice.update(id, {
        customer_name: (invoice.customer_name && invoice.customer_name.trim()) ? invoice.customer_name.trim() : t('invoices.walk_in', 'Khách vãng lai'),
        items: editItems,
        discount: editDiscount,
        subtotal: newSubtotal,
        total: newTotal,
        tip: editTip,
        logs: JSON.stringify(updatedLogs),
      });
      toast.success(t('invoice_detail.toast_updated', 'Đã cập nhật hoá đơn'));
      setEditing(false);
      load();
    } catch (e) {
      toast.error(t('invoices.error_prefix', 'Lỗi: ') + (e.message || e));
    }
  };

  const cancelInvoice = async () => {
    if (!confirm(`${t('invoices.action.delete', 'Huỷ hoá đơn')} này? Hành động không thể hoàn tác.`)) return;
    try {
      const prevStatus = invoice.status || 'unpaid';
      const updatedLogs = addLogEntry(t('invoices.action.delete', 'Huỷ hoá đơn'), `${t('invoices.action.delete', 'Huỷ hoá đơn')} khỏi hệ thống`);
      await base44.entities.Invoice.update(id, { status: 'cancelled', previous_status: prevStatus, logs: JSON.stringify(updatedLogs) });
      toast.success(t('invoices.action.delete', 'Đã huỷ hoá đơn'));
      load();
    } catch (e) {
      toast.error(t('invoices.error_prefix', 'Lỗi: ') + (e.message || e));
    }
  };

  const permanentlyDeleteInvoice = async () => {
    if (!confirm('Bạn có chắc muốn xoá vĩnh viễn hoá đơn này? Hành động này không thể hoàn tác.')) return;
    try {
      await base44.entities.Invoice.delete(id);
      toast.success('Đã xoá vĩnh viễn hoá đơn');
      router.back(); // Quay lại trang trước đó sau khi xoá vĩnh viễn
    } catch (e) {
      toast.error(t('invoices.error_prefix', 'Lỗi: ') + (e.message || e));
    }
  };

  const restoreInvoice = async () => {
    const targetStatus = invoice.previous_status || 'unpaid';
    const statusLabel = targetStatus === 'paid' ? t('invoices.status.paid', 'Đã thanh toán') : 'Chưa thanh toán';
    if (!confirm(`Khôi phục hoá đơn về trạng thái ${statusLabel}?`)) return;
    try {
      const updatedLogs = addLogEntry('Khôi phục hoá đơn', `Khôi phục hoá đơn về trạng thái ${statusLabel}`);
      await base44.entities.Invoice.update(id, { status: targetStatus, logs: JSON.stringify(updatedLogs) });
      toast.success(`Đã khôi phục hoá đơn về trạng thái ${statusLabel}`);
      load();
    } catch (e) {
      toast.error('Lỗi khi khôi phục hoá đơn: ' + (e.message || e));
    }
  };

  const unpayInvoice = async () => {
    if (!confirm(`${t('invoices.action.cancel_payment', 'Huỷ thanh toán')} cho hoá đơn này và chuyển lại về trạng thái Chưa thanh toán?`)) return;
    try {
      const updatedLogs = addLogEntry(t('invoices.action.cancel_payment', 'Huỷ thanh toán'), 'Chuyển hoá đơn về trạng thái chưa thanh toán');
      await base44.entities.Invoice.update(id, { status: 'unpaid', payment_methods: [], logs: JSON.stringify(updatedLogs) });
      toast.success('Đã chuyển hoá đơn về trạng thái chưa thanh toán');
      load();
    } catch (e) {
      toast.error(t('invoices.error_prefix', 'Lỗi: ') + (e.message || e));
    }
  };

  const payInvoice = async () => {
    if (Math.abs(remaining) > 1) return toast.error(`Số tiền chưa khớp (còn ${formatVND(remaining)})`);
    setPaying(true);
    try {
      const methods = payMethods.filter((p) => p.amount > 0);
      const methodLabels = methods.map(m => METHODS.find(x => x.value === m.method)?.label || m.method).join(', ');
      const updatedLogs = addLogEntry(`${t('invoice_detail.pay', 'Thanh toán')} hoá đơn`, `${t('invoice_detail.pay', 'Thanh toán')} số tiền ${formatVND(invoice.total || total)} qua ${methodLabels || 'Tiền mặt'}`);
      await base44.entities.Invoice.update(id, {
        customer_name: (invoice.customer_name && invoice.customer_name.trim()) ? invoice.customer_name.trim() : t('invoices.walk_in', 'Khách vãng lai'),
        status: 'paid',
        payment_methods: methods,
        tip: editTip,
        logs: JSON.stringify(updatedLogs),
      });
      toast.success(`${t('invoice_detail.pay', 'Thanh toán')} thành công`);
      setPaying(false);
      setShowPayModal(false);
      load();
    } catch (e) {
      toast.error(t('invoices.error_prefix', 'Lỗi: ') + (e.message || e));
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
      <html><head><title>${invoice.invoice_code || id}</title>
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
      <h2>EasySalon</h2>
      <div class="info"><b>Mã HD:</b> ${invoice.invoice_code || id}</div>
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
      </body></html>
    `);
    win.document.close();
    win.print();
    const updatedLogs = addLogEntry(`${t('invoices.action.print', 'In hoá đơn')} thanh toán`, `${t('invoices.action.print', 'In hoá đơn')} lần thứ ${(invoice.print_count || 0) + 1}`);
    await base44.entities.Invoice.update(id, { print_count: (invoice.print_count || 0) + 1, logs: JSON.stringify(updatedLogs) });
    load();
  };

  const itemsToShow = editing ? editItems : (invoice.items || []);

  return (
    <div className="bg-white min-h-screen pb-12 font-sans text-slate-800 px-4 md:px-8 pt-2">
      {/* 1. Header Navigation & Action Bar (All buttons moved directly into detail header) */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 mb-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.back()} 
            className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors shadow-2xs text-slate-700 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-base md:text-lg font-bold text-slate-900 tracking-tight">
            {t('invoice_detail.title', 'Chi tiết hoá đơn')} {invoice.invoice_code ? `#${invoice.invoice_code}` : ''}
          </h1>
        </div>

        {/* Action Buttons inside detail view */}
        <div className="flex items-center gap-2 flex-wrap">
          <button 
            onClick={() => setShowHistoryModal(true)} 
            className="px-3.5 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <History className="w-4 h-4 text-slate-500" /> {t('invoice_detail.action_history', 'Lịch sử thao tác')}
          </button>
          {isCancelled && (
            <>
              <button 
                onClick={restoreInvoice} 
                className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" /> Khôi phục hoá đơn
              </button>
              <button 
                onClick={permanentlyDeleteInvoice} 
                className="px-3.5 py-2 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" /> Xoá vĩnh viễn
              </button>
            </>
          )}
          {!isCancelled && (
            <button 
              onClick={cancelInvoice} 
              className="px-3.5 py-2 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" /> {t('invoices.action.delete', 'Huỷ hoá đơn')}
            </button>
          )}
          {!isCancelled && (
            <button 
              onClick={() => {
                setEditItems(invoice?.items ? [...invoice.items] : []);
                setShowStaffModal(true);
              }} 
              className="px-3.5 py-2 rounded-lg border border-blue-400 text-blue-600 hover:bg-blue-50 font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Users className="w-4 h-4" /> {t('invoice_detail.assign_staff', 'Xếp nhân viên')}
            </button>
          )}
          <button 
            onClick={printInvoice} 
            className="px-3.5 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" /> {t('invoices.action.print', 'In hoá đơn')}
          </button>
          {!isCancelled && (
            <button 
              onClick={() => setShowPosModal(true)} 
              className="px-3.5 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Edit3 className="w-4 h-4" /> {t('invoices.action.edit', 'Chỉnh sửa')}
            </button>
          )}
          {isUnpaid && !isCancelled ? (
            <button 
              onClick={() => setShowPosModal(true)} 
              className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <CreditCard className="w-4 h-4" /> {t('invoice_detail.pay', 'Thanh toán')}
            </button>
          ) : isPaid && !isCancelled ? (
            <button 
              onClick={unpayInvoice} 
              className="px-3.5 py-2 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" /> {t('invoices.action.cancel_payment', 'Huỷ thanh toán')}
            </button>
          ) : null}
        </div>
      </div>

      {/* 2. Customer Info Line (Pure White Layout matching Image) */}
      <div className="flex flex-wrap items-center justify-between gap-4 py-2 mb-4 bg-white">
        <div className="flex items-center gap-6 flex-wrap">
          {/* Avatar + Customer Name Link */}
          <div 
            onClick={() => router.push((customer?.id || invoice.customer_id) ? `/customers?id=${customer?.id || invoice.customer_id}` : `/customers?name=${encodeURIComponent(customer?.name || invoice.customer_name)}`)}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <Avatar 
              src={customer?.avatar_url || invoice.customer_avatar} 
              name={customer?.name || invoice.customer_name || t('invoices.walk_in', 'Khách vãng lai')} 
              size={32} 
              color="#10B981" 
            />
            <div className="flex flex-col">
              <span className="font-bold text-blue-600 group-hover:underline text-xs md:text-sm leading-snug">
                {customer?.name || invoice.customer_name || t('invoices.walk_in', 'Khách vãng lai')}
              </span>
              {(customer?.phone || invoice.customer_phone) && (
                <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" />
                  {customer?.phone || invoice.customer_phone}
                </span>
              )}
            </div>
          </div>

          {/* Date Time */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{displayDateTime}</span>
          </div>
        </div>

        {/* Status Badge */}
        <div>
          <span 
            className="text-xs font-semibold px-2.5 py-1 rounded border"
            style={{ backgroundColor: badge.bg, color: badge.text, borderColor: badge.border }}
          >
            {badge.label}
          </span>
        </div>
      </div>

      {/* 3. Main Line Items Table View */}
      <div className="bg-white border border-slate-200/80 overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-900 font-bold">
              <tr>
                <th className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">{t('invoice_detail.table.name', 'Tên')}</th>
                <th className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">{t('invoice_detail.table.type', 'Loại')}</th>
                <th className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">{t('invoices.table.staff', 'Nhân viên')}</th>
                <th className="py-3.5 px-4 text-right font-bold text-slate-900 whitespace-nowrap">{t('invoice_detail.table.unit_price', 'Đơn giá')}</th>
                <th className="py-3.5 px-4 text-center font-bold text-slate-900 whitespace-nowrap">{t('invoice_detail.table.qty', 'Số lượng')}</th>
                <th className="py-3.5 px-4 text-right font-bold text-slate-900 whitespace-nowrap">{t('invoices.print.discount', 'Giảm giá')}</th>
                <th className="py-3.5 px-4 text-right font-bold text-slate-900 whitespace-nowrap">{t('invoices.table.total', 'Tổng tiền')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {itemsToShow.map((it, idx) => {
                const isService = it.type === 'service';
                const isPackage = it.type === 'package';
                const isProduct = it.type === 'product';

                const performerName = it.do_staff_name || (isService ? it.staff_name : null);
                const sellerName = it.sell_staff_name || it.staff_name;
                const bonusNote = '(Bổ sung hoa hồng)';

                const itemTotalAmount = it.total !== undefined ? it.total : ((it.price || 0) * (it.qty || 1) - (it.discount || 0));

                return (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors align-top">
                    {/* Tên */}
                    <td className="py-3.5 px-5 font-bold text-slate-900">
                      {editing ? (
                        <div className="flex items-center justify-between gap-1">
                          <input 
                            type="text" 
                            value={it.name} 
                            onChange={(e) => updateEditItem(idx, { name: e.target.value })}
                            className="w-full px-2 py-1 border border-slate-200 rounded text-xs font-semibold"
                          />
                          <button onClick={() => removeEditItem(idx)} className="text-slate-300 hover:text-red-500 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      ) : (
                        it.name
                      )}
                    </td>
                    
                    {/* Loại */}
                    <td className="py-3.5 px-4 text-slate-700 whitespace-nowrap">
                      {isService ? (
                        <div>{t('invoice_detail.type.service', 'Làm dịch vụ')}</div>
                      ) : isPackage ? (
                        <div>{t('invoice_detail.type.package', 'Bán gói')}</div>
                      ) : (
                        <div>{t('invoice_detail.type.product', 'Bán sản phẩm')}</div>
                      )}
                    </td>

                    {/* Nhân viên */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {editing ? (
                        <StaffAssignPicker 
                          staff={staff} 
                          value={it.staff_id} 
                          onChange={(sid, name) => updateEditItem(idx, { staff_id: sid, staff_name: name })} 
                          color="emerald-500" 
                        />
                      ) : (
                        <div>
                          {performerName || sellerName ? (
                            <span>
                              <span className="text-blue-600 font-semibold">{performerName || sellerName}</span>
                              {it.do_staff_amount ? <span className="text-slate-600 font-normal">: {formatVND(it.do_staff_amount)}</span> : null}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-normal">{t('invoice_detail.unassigned', 'Chưa xếp nhân viên')}</span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Đơn giá */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      {editing ? (
                        <input 
                          type="number" 
                          value={it.price} 
                          onChange={(e) => updateEditItem(idx, { price: Number(e.target.value) || 0 })}
                          className="w-20 px-2 py-1 text-right border border-slate-200 rounded text-xs"
                        />
                      ) : (
                        formatVND(it.price || 0)
                      )}
                    </td>

                    {/* Số lượng */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {editing ? (
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => updateEditItem(idx, { qty: Math.max(1, (it.qty || 1) - 1) })} className="w-5 h-5 rounded bg-slate-100 flex items-center justify-center"><Minus className="w-3 h-3" /></button>
                          <span className="w-6 text-center font-bold">{it.qty || 1}</span>
                          <button onClick={() => updateEditItem(idx, { qty: (it.qty || 1) + 1 })} className="w-5 h-5 rounded bg-slate-100 flex items-center justify-center"><Plus className="w-3 h-3" /></button>
                        </div>
                      ) : (
                        it.qty || 1
                      )}
                    </td>

                    {/* Giảm giá */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      {formatVND(it.discount || 0)}
                    </td>

                    {/* Tổng tiền */}
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900 whitespace-nowrap">
                      {formatVND(itemTotalAmount)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Discount / Tip Form if Editing */}
      {editing && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-xs mb-6">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-600">Giảm giá hoá đơn (đ)</span>
            <input 
              type="number" 
              value={editDiscount || ''} 
              onChange={(e) => setEditDiscount(Math.max(0, Number(e.target.value) || 0))} 
              className="w-32 px-3 py-1.5 rounded border border-slate-200 text-right text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 bg-white" 
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-600">Tiền tip (đ)</span>
            <input 
              type="number" 
              value={editTip || ''} 
              onChange={(e) => setEditTip(Math.max(0, Number(e.target.value) || 0))} 
              className="w-32 px-3 py-1.5 rounded border border-slate-200 text-right text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 bg-white" 
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setEditing(false)} className="px-4 py-2 rounded bg-white border border-slate-200 font-bold text-slate-600">Huỷ</button>
            <button onClick={saveEdit} className="px-4 py-2 rounded bg-emerald-500 text-white font-bold shadow-2xs">{t('invoice_detail.save_changes', 'Lưu thay đổi')}</button>
          </div>
        </div>
      )}

      {/* 4. Financial Breakdown Summary List (Pure White Right Aligned like Image) */}
      <div className="flex justify-end pt-2 pb-6 bg-white">
        <div className="w-full md:w-80 space-y-2.5 text-xs md:text-sm text-slate-700 text-right">
          <div className="flex justify-between items-center">
            <span>{t('invoice_detail.subtotal', 'Thành tiền')}</span>
            <span className="text-slate-900 font-bold">{formatVND(invoice.subtotal || subtotal)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span>{t('invoice_detail.need_to_pay', 'Cần thanh toán')}</span>
            <span className="text-slate-900 font-bold">{formatVND(invoice.total || total)}</span>
          </div>
          {isPaid && (
            <div className="flex justify-between items-center">
              <span>{t('invoices.status.paid', 'Đã thanh toán')}</span>
              <span className="text-slate-900 font-bold">{formatVND(invoice.total || total)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Staff Assignment Modal (Identical to POS/Cashier TicketColumn bulk staff picker modal) */}
      {showStaffModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-slate-950/65 backdrop-blur-xs pointer-events-auto select-none" onClick={() => setShowStaffModal(false)}>
          <div className="relative bg-white w-full md:max-w-md rounded-t-3xl md:rounded-3xl p-5 shadow-2xl transition-all max-h-[85vh] flex flex-col select-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 shrink-0">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                <Users className="w-5 h-5 text-emerald-500" />
                {t('invoice_detail.assign_staff', 'Xếp nhân viên')} {t('invoice_detail.bulk', 'hàng loạt')}
              </h3>
              <button onClick={() => setShowStaffModal(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-4 mb-4">
              {itemsToShow.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">Chưa có dịch vụ/sản phẩm</div>
              ) : (
                Object.entries(groupCartItems(itemsToShow)).map(([type, entries]) => {
                  const label = TYPE_LABELS[type] || 'Khác';
                  const totalQty = entries.reduce((s, e) => s + (e.item.qty || 1), 0);
                  return (
                    <div key={type} className="space-y-2">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label} ({totalQty})</span>
                        <div className="h-px bg-slate-100 flex-1 ml-3" />
                      </div>
                      <div className="space-y-2">
                        {entries.map(({ item: x, index: i }) => (
                          <div key={i} className="flex flex-col gap-1 p-2 rounded-xl bg-slate-50 border border-slate-100">
                            <div className="flex justify-between items-center px-1">
                              <span className="font-medium text-xs text-slate-700 truncate max-w-[240px]">{x.name}</span>
                              <span className="text-[10px] text-slate-400 font-semibold shrink-0">x{x.qty || 1}</span>
                            </div>
                            <StaffAssignPicker 
                              staff={staff} 
                              value={x.staff_id} 
                              isRequested={x.is_customer_requested} 
                              onChange={(id, name, req) => {
                                const updated = itemsToShow.map((item, idx) => idx === i ? { 
                                  ...item, 
                                  staff_id: id, 
                                  staff_name: name, 
                                  do_staff_name: name, 
                                  sell_staff_name: name,
                                  is_customer_requested: req 
                                } : item);
                                setEditItems(updated);
                              }} 
                              color="emerald-500" 
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <button 
              onClick={async () => {
                try {
                  const updatedLogs = addLogEntry(t('invoice_detail.assign_staff', 'Xếp nhân viên'), 'Cập nhật phân công nhân viên phục vụ & bán hàng');
                  await base44.entities.Invoice.update(id, { items: editItems, logs: JSON.stringify(updatedLogs) });
                  toast.success('Đã xếp nhân viên thành công');
                  setShowStaffModal(false);
                  load();
                } catch (err) {
                  toast.error('Lỗi khi xếp nhân viên: ' + (err.message || err));
                }
              }} 
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 transition-colors text-white font-bold text-sm shrink-0 cursor-pointer"
            >
              Hoàn tất
            </button>
          </div>
        </div>
      )}

      {/* Quick Pay Modal for Unpaid Invoice */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs select-none" onClick={() => setShowPayModal(false)}>
          <div className="relative bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 select-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800">{t('invoice_detail.pay', 'Thanh toán')} hoá đơn</h3>
              <button onClick={() => setShowPayModal(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="text-slate-500">Chọn phương thức và số tiền thanh toán:</div>
              {payMethods.map((p, i) => (
                <div key={i} className="flex items-center gap-2">
                  <select 
                    value={p.method} 
                    onChange={(e) => setPayMethods((arr) => arr.map((x, j) => (j === i ? { ...x, method: e.target.value } : x)))} 
                    className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white font-semibold text-slate-700 outline-none"
                  >
                    {METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                  <input 
                    type="number" 
                    value={p.amount || ''} 
                    onChange={(e) => setPayMethods((arr) => arr.map((x, j) => (j === i ? { ...x, amount: Number(e.target.value) || 0 } : x)))} 
                    placeholder="0" 
                    className="w-32 px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 text-right outline-none" 
                  />
                  {payMethods.length > 1 && (
                    <button onClick={() => setPayMethods((arr) => arr.filter((_, j) => j !== i))} className="text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  )}
                </div>
              ))}
              <div className="flex justify-between items-center pt-1">
                <span className={remaining > 1 ? 'text-amber-600 font-bold' : 'text-emerald-600 font-bold'}>
                  {remaining > 1 ? `Còn thiếu: ${formatVND(remaining)}` : remaining < -1 ? `Thừa: ${formatVND(-remaining)}` : 'Đủ thanh toán ✓'}
                </span>
                <button onClick={() => setPayMethods((arr) => [...arr, { method: 'cash', amount: 0 }])} className="text-emerald-600 hover:underline font-bold flex items-center gap-1 text-xs">
                  <Plus className="w-3.5 h-3.5" /> Thêm phương thức
                </button>
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-slate-100">
              <button onClick={() => setShowPayModal(false)} className="flex-1 py-2.5 rounded-xl bg-slate-100 font-semibold text-xs text-slate-600">Huỷ</button>
              <button onClick={payInvoice} disabled={paying} className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-2xs transition-colors">
                {paying ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Activity History Modal (Identical to POS/Cashier TicketColumn history modal) */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-slate-950/65 backdrop-blur-xs pointer-events-auto select-none" onClick={() => setShowHistoryModal(false)}>
          <div className="relative bg-white w-full md:max-w-md rounded-t-3xl md:rounded-3xl p-5 shadow-2xl transition-all max-h-[80vh] flex flex-col select-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 shrink-0">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                <History className="w-5 h-5 text-emerald-500" />
                {t('invoice_detail.action_history', 'Lịch sử thao tác')} đơn
              </h3>
              <button onClick={() => setShowHistoryModal(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-4 mb-4">
              {(() => {
                const logs = getNormalizedLogs(invoice).reverse();

                if (logs.length === 0) {
                  return <div className="text-center py-12 text-slate-400 text-sm">Chưa có thao tác nào được thực hiện</div>;
                }

                return (
                  <div className="relative pl-4 border-l border-slate-100 space-y-4">
                    {logs.map((log) => {
                      const logTime = new Date(log.time);
                      const timeStr = isNaN(logTime.getTime()) 
                        ? (log.time || displayDateTime) 
                        : `${logTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} ${logTime.toLocaleDateString('vi-VN')}`;
                      return (
                        <div key={log.id} className="relative">
                          {/* Dot */}
                          <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white ring-4 ring-emerald-50" />
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-xs text-slate-700">{log.action}</span>
                              <span className="text-[10px] text-slate-400 font-medium shrink-0">{timeStr}</span>
                            </div>
                            {log.details && <div className="text-xs text-slate-500 mt-0.5">{log.details}</div>}
                            <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                              <span>Người thực hiện:</span>
                              <span className="font-semibold text-slate-500">{log.user || 'Lễ tân'}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            <button onClick={() => setShowHistoryModal(false)} className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors text-slate-700 font-bold text-sm shrink-0 cursor-pointer">
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* Direct POS Modal for Pending Bill Checkout */}
      {showPosModal && (
        <POSInvoiceModal
          open={showPosModal}
          existingInvoice={invoice}
          customer={customer}
          onClose={() => setShowPosModal(false)}
          onSaved={() => {
            setShowPosModal(false);
            load();
          }}
        />
      )}
    </div>
  );
}