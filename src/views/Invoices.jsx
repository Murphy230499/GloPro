'use client';
import React, { useEffect, useState } from 'react';
import { Search, Filter, Printer, ChevronLeft, ChevronRight, CreditCard, Trash2, RotateCcw, Undo2, X, Eye, ShieldCheck, QrCode } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { base44 } from '@/api/base44Client';
import { useBranch } from '@/lib/BranchContext';
import { formatVND } from '@/lib/format';
import { toast } from '@/components/Layout';
import Avatar from '@/components/Avatar';

const STATUS_TABS = [
  { value: 'unpaid', label: 'Chưa thanh toán' },
  { value: 'paid', label: 'Đã thanh toán' },
  { value: 'cancelled', label: 'Đã huỷ' },
];

const PAGE_SIZE = 10;

export default function Invoices() {
  const router = useRouter();
  const { currentBranchId } = useBranch();
  const [invoices, setInvoices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState('unpaid');
  const [page, setPage] = useState(1);

  // Filter states
  const [filterOpen, setFilterOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState('all');
  const [selectedCustomerId, setSelectedCustomerId] = useState('all');

  // Printing state
  const [printingInvoice, setPrintingInvoice] = useState(null);
  const [isDraftPrint, setIsDraftPrint] = useState(false);

  const load = () => {
    setLoading(true);
    const filter = currentBranchId === 'all' ? {} : { branch_id: currentBranchId };
    Promise.all([
      base44.entities.Invoice.filter(filter),
      base44.entities.Staff.list(),
      base44.entities.Customer.list(),
    ]).then(([data, st, cust]) => {
      setInvoices(data.sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.invoice_code || '').localeCompare(a.invoice_code || '')));
      setStaff(st);
      setCustomers(cust);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
    window.addEventListener('reload-data', load);
    return () => window.removeEventListener('reload-data', load);
  }, [currentBranchId]);

  const counts = STATUS_TABS.reduce((acc, t) => {
    acc[t.value] = invoices.filter((i) => i.status === t.value).length;
    return acc;
  }, {});

  const filtered = invoices.filter((inv) => {
    if (inv.status !== statusTab) return false;
    
    // Search text filter
    if (search) {
      const q = search.toLowerCase();
      const staffNames = (inv.items || []).map((it) => it.staff_name).filter(Boolean).join(' ');
      const codeMatch = (inv.invoice_code || '').toLowerCase().includes(q);
      const custMatch = (inv.customer_name || '').toLowerCase().includes(q);
      const staffMatch = staffNames.toLowerCase().includes(q);
      if (!codeMatch && !custMatch && !staffMatch) return false;
    }

    // Date Range Filter
    if (startDate && inv.date && inv.date < startDate) return false;
    if (endDate && inv.date && inv.date > endDate) return false;

    // Staff Filter
    if (selectedStaffId !== 'all') {
      const hasStaff = (inv.items || []).some(it => it.staff_id === selectedStaffId);
      const hasTipSplit = (inv.tip_splits || []).some(ts => ts.staff_id === selectedStaffId);
      if (!hasStaff && !hasTipSplit) return false;
    }

    // Customer Filter
    if (selectedCustomerId !== 'all') {
      if (selectedCustomerId === 'walk-in') {
        if (inv.customer_id) return false;
      } else {
        if (inv.customer_id !== selectedCustomerId) return false;
      }
    }

    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const getStaffList = (inv) => {
    const map = {};
    (inv.items || []).forEach((it) => { if (it.staff_id) map[it.staff_id] = { id: it.staff_id, name: it.staff_name }; });
    return Object.values(map);
  };

  // 1. Actions for Paid Invoices
  const cancelPayment = async (inv) => {
    if (!confirm(`Bạn có chắc muốn huỷ thanh toán cho hoá đơn ${inv.invoice_code}? Hoá đơn sẽ trở về trạng thái chưa thanh toán và có thể chỉnh sửa.`)) return;
    try {
      await base44.entities.Invoice.update(inv.id, { status: 'unpaid' });
      toast.success('Đã chuyển hóa đơn thành Chưa thanh toán. Đang chuyển hướng...');
      router.push(`/pos?edit_invoice_id=${inv.id}`);
    } catch (e) {
      toast.error('Lỗi: ' + (e.message || e));
    }
  };

  const deleteInvoice = async (inv) => {
    if (!confirm(`Bạn có chắc muốn xoá hoá đơn ${inv.invoice_code}?`)) return;
    try {
      await base44.entities.Invoice.update(inv.id, { status: 'cancelled', previous_status: inv.status });
      
      // Update associated memberships to deleted status
      try {
        const relatedMems = await base44.entities.Membership.filter({ invoice_id: inv.id });
        for (const m of relatedMems) {
          await base44.entities.Membership.update(m.id, { is_deleted: true, status: 'deleted' });
        }
      } catch (err) {
        console.error('Lỗi khi cập nhật trạng thái thẻ mua kèm hoá đơn:', err);
      }

      toast.success('Đã huỷ/xoá hoá đơn');
      load();
    } catch (e) {
      toast.error('Lỗi: ' + (e.message || e));
    }
  };

  // 2. Actions for Unpaid Invoices
  const payInvoice = (inv) => {
    router.push(`/pos?edit_invoice_id=${inv.id}`);
  };

  // 3. Actions for Cancelled Invoices
  const restoreInvoice = async (inv) => {
    const targetStatus = inv.previous_status || 'unpaid';
    try {
      await base44.entities.Invoice.update(inv.id, { status: targetStatus, previous_status: '' });
      
      // Restore associated memberships
      try {
        const relatedMems = await base44.entities.Membership.filter({ invoice_id: inv.id });
        for (const m of relatedMems) {
          await base44.entities.Membership.update(m.id, { is_deleted: false, status: 'active' });
        }
      } catch (err) {
        console.error('Lỗi khi khôi phục trạng thái thẻ mua kèm hoá đơn:', err);
      }

      toast.success(`Đã khôi phục hoá đơn về trạng thái ${targetStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}`);
      load();
    } catch (e) {
      toast.error('Lỗi: ' + (e.message || e));
    }
  };

  // Print Preview Dialog Trigger
  const handlePrintPreview = (inv, draft) => {
    setPrintingInvoice(inv);
    setIsDraftPrint(draft);
  };

  // Print all list
  const printList = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/pos')} className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50">
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <div className="text-xs text-slate-400">Thu ngân</div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">Danh sách hoá đơn</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => router.push('/pos')} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm">
            Quay lại thu ngân
          </button>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-100 pb-1">
        {STATUS_TABS.map((t) => (
          <button key={t.value} onClick={() => { setStatusTab(t.value); setPage(1); }}
            className={`px-4 py-2 rounded-t-xl text-sm font-semibold transition-colors border-b-2 ${statusTab === t.value ? 'border-primary text-primary font-bold bg-primary/5' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
            {t.label} <span className="ml-1 opacity-70 text-xs">({counts[t.value] || 0})</span>
          </button>
        ))}
      </div>

      {/* Filter and Table Panel */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 p-4 border-b border-slate-100 flex-wrap">
          <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2.5 flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Tìm theo mã đơn, khách hàng hoặc nhân viên..."
              className="bg-transparent outline-none text-sm flex-1" />
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setFilterOpen(!filterOpen)} 
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-sm font-bold transition-all ${filterOpen ? 'bg-primary/5 border-primary text-primary' : 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50'}`}
            >
              <Filter className="w-4 h-4" /> <span>Lọc</span>
            </button>
            <button onClick={printList} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 bg-white hover:bg-slate-50">
              <Printer className="w-4 h-4" /> <span>In danh sách</span>
            </button>
          </div>
        </div>

        {/* Expandable Filter Box */}
        {filterOpen && (
          <div className="bg-slate-50/50 p-4 border-b border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-semibold text-slate-600">
            <div className="space-y-1.5">
              <label>Từ ngày</label>
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white outline-none focus:border-primary text-slate-700" 
              />
            </div>
            
            <div className="space-y-1.5">
              <label>Đến ngày</label>
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white outline-none focus:border-primary text-slate-700" 
              />
            </div>

            <div className="space-y-1.5">
              <label>Nhân viên</label>
              <select 
                value={selectedStaffId} 
                onChange={(e) => { setSelectedStaffId(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white outline-none focus:border-primary text-slate-700 font-medium"
              >
                <option value="all">Tất cả nhân viên</option>
                {staff.map(st => (
                  <option key={st.id} value={st.id}>{st.full_name || st.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label>Khách hàng</label>
              <select 
                value={selectedCustomerId} 
                onChange={(e) => { setSelectedCustomerId(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white outline-none focus:border-primary text-slate-700 font-medium"
              >
                <option value="all">Tất cả khách hàng</option>
                <option value="walk-in">Khách vãng lai</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-4 flex justify-end">
              <button 
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setSelectedStaffId('all');
                  setSelectedCustomerId('all');
                  setPage(1);
                  toast('Đã xoá bộ lọc');
                }}
                className="px-4 py-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 transition-colors font-bold text-slate-500"
              >
                Xoá bộ lọc
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-slate-100 border-t-primary rounded-full animate-spin" /></div>
        ) : invoices.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">Chưa có hoá đơn nào.</div>
        ) : pageData.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">Không có hoá đơn nào phù hợp bộ lọc</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="text-left px-5 py-4 font-bold">Mã đơn</th>
                  <th className="text-left px-5 py-4 font-bold">Khách hàng</th>
                  <th className="text-left px-5 py-4 font-bold">Nhân viên</th>
                  <th className="text-left px-5 py-4 font-bold">Ngày tạo</th>
                  <th className="text-right px-5 py-4 font-bold">Tổng tiền</th>
                  <th className="text-center px-5 py-4 font-bold">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pageData.map((inv) => {
                  const stfList = getStaffList(inv);
                  const custObj = customers.find(c => c.id === inv.customer_id);
                  const phoneNum = custObj?.phone || '';
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-4 font-bold text-primary">
                        <button onClick={() => router.push(`/invoices/${inv.id}`)} className="hover:underline">
                          {inv.invoice_code || '—'}
                        </button>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <Avatar src={custObj?.avatar_url} name={inv.customer_name} size={32} color={custObj?.avatar_color || '#E879A9'} />
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-700">{inv.customer_name || 'Khách vãng lai'}</span>
                            {phoneNum && <span className="text-[11px] text-slate-400 font-medium">{phoneNum}</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center">
                          {stfList.slice(0, 3).map((s, i) => {
                            const stf = staff.find((x) => x.id === s.id);
                            return (
                              <div key={i} className="rounded-full ring-2 ring-white" style={{ marginLeft: i > 0 ? '-8px' : 0, zIndex: 3 - i }}>
                                <Avatar src={stf?.avatar_url} name={s.name} size={28} color={stf?.avatar_color || '#FF6B9D'} />
                              </div>
                            );
                          })}
                          {stfList.length > 3 && (
                            <div className="w-7 h-7 rounded-full bg-slate-100 ring-2 ring-white flex items-center justify-center text-[10px] font-bold text-slate-500" style={{ marginLeft: '-8px' }}>
                              +{stfList.length - 3}
                            </div>
                          )}
                          {stfList.length === 0 && <span className="text-slate-300 text-xs">—</span>}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-500 text-xs font-semibold">{inv.date || '—'}</td>
                      <td className="px-5 py-4 text-right font-black text-slate-800">{formatVND((inv.total || 0))}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-2">
                          {/* Render actions according to invoice status */}
                          {inv.status === 'paid' && (
                            <>
                              <button onClick={() => cancelPayment(inv)} className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center text-amber-500 hover:bg-amber-50 hover:border-amber-100 transition-colors" title="Huỷ thanh toán & Sửa">
                                <RotateCcw className="w-4 h-4" />
                              </button>
                              <button onClick={() => handlePrintPreview(inv, false)} className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-650 hover:bg-slate-50 hover:text-slate-850 transition-colors" title="In hoá đơn">
                                <Printer className="w-4 h-4" />
                              </button>
                              <button onClick={() => deleteInvoice(inv)} className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center text-red-500 hover:bg-red-50 hover:border-red-100 transition-colors" title="Xoá hoá đơn">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          {inv.status === 'unpaid' && (
                            <>
                              <button onClick={() => payInvoice(inv)} className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center text-green-600 hover:bg-green-50 hover:border-green-150 transition-colors" title="Thanh toán hóa đơn">
                                <CreditCard className="w-4 h-4" />
                              </button>
                              <button onClick={() => handlePrintPreview(inv, true)} className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors" title="In hoá đơn tạm tính">
                                <Printer className="w-4 h-4" />
                              </button>
                              <button onClick={() => deleteInvoice(inv)} className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center text-red-500 hover:bg-red-50 hover:border-red-100 transition-colors" title="Xoá hoá đơn">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          {inv.status === 'cancelled' && (
                            <button onClick={() => restoreInvoice(inv)} className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center text-blue-500 hover:bg-blue-50 hover:border-blue-100 transition-colors" title="Khôi phục hoá đơn">
                              <Undo2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1.5 py-4 border-t border-slate-100">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-2.5 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50">
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 10).map((p) => (
              <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg text-sm font-medium ${page === p ? 'bg-primary text-white border border-primary' : 'border border-slate-200 hover:bg-slate-50'}`}>
                {p}
              </button>
            ))}
            <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="px-2.5 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Invoice Receipt Print Preview Modal Overlay */}
      {printingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 overflow-y-auto">
          <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 flex flex-col my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 no-print">
              <span className="text-sm font-bold text-slate-700">
                {isDraftPrint ? 'In hoá đơn tạm tính' : 'In hóa đơn thanh toán'}
              </span>
              <button onClick={() => setPrintingInvoice(null)} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>

            {/* Paper Receipt Look */}
            <div className="printable-receipt bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6 font-mono text-xs text-slate-800 space-y-5 shadow-inner">
              {/* Header info */}
              <div className="text-center space-y-1 pb-4 border-b border-slate-200">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-primary mb-2">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <div className="font-bold text-sm tracking-tight">GloPro Spa & Beauty</div>
                <div className="text-[10px] text-slate-400">{printingInvoice.date || '—'}</div>
                <div className="font-black text-sm tracking-wider uppercase pt-3 text-slate-750">
                  {isDraftPrint ? 'HÓA ĐƠN TẠM TÍNH' : 'HÓA ĐƠN BÁN HÀNG'}
                </div>
                <div className="inline-block border border-dashed border-slate-300 rounded px-2.5 py-1.5 font-bold tracking-tight bg-white text-[10px] mt-1">
                  {printingInvoice.invoice_code}
                </div>
              </div>

              {/* Customer Details */}
              <div className="space-y-1 border-b border-slate-200 pb-3">
                <div className="flex justify-between"><span>Tên khách hàng:</span><span className="font-bold text-right truncate max-w-[180px]">{printingInvoice.customer_name || 'Khách vãng lai'}</span></div>
                <div className="flex justify-between"><span>Số điện thoại:</span><span>—</span></div>
                <div className="flex justify-between"><span>Mã hóa đơn:</span><span>{printingInvoice.invoice_code}</span></div>
              </div>

              {/* Line Items */}
              <div className="space-y-3 pb-3 border-b border-slate-200">
                {(printingInvoice.items || []).map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start">
                    <span className="truncate pr-2">{item.name} {item.qty > 1 && `x${item.qty}`}</span>
                    <span className="shrink-0 font-semibold">{formatVND(item.price * item.qty)}</span>
                  </div>
                ))}
              </div>

              {/* Calculations */}
              <div className="space-y-1 border-b border-slate-200 pb-3">
                <div className="flex justify-between"><span>Tạm tính:</span><span>{formatVND(printingInvoice.subtotal || 0)}</span></div>
                <div className="flex justify-between"><span>Giảm giá:</span><span>-{formatVND(printingInvoice.discount || 0)}</span></div>
                <div className="flex justify-between"><span>Thuế (Tax):</span><span>0 đ</span></div>
                <div className="flex justify-between"><span>Tiền tip:</span><span>{formatVND(printingInvoice.tip || 0)}</span></div>
              </div>

              {/* Total */}
              <div className="flex justify-between items-center text-sm font-black tracking-wider pb-3 border-b border-slate-200 text-slate-900">
                <span>TỔNG THANH TOÁN:</span>
                <span>{formatVND(printingInvoice.total || 0)}</span>
              </div>

              {/* Payments */}
              {!isDraftPrint && (
                <div className="space-y-1">
                  <div className="font-bold uppercase tracking-wider text-[10px] text-slate-400">Phương thức thanh toán</div>
                  {(printingInvoice.payment_methods || []).map((p, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span className="capitalize">{METHODS.find(m => m.value === p.method)?.label || p.method}</span>
                      <span className="font-semibold">{formatVND(p.amount)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* QR block code */}
              <div className="text-center space-y-2 pt-4 border-t border-slate-200">
                <div className="text-[10px] text-slate-400 max-w-[200px] mx-auto">Quét mã QR để tải ứng dụng đặt lịch hẹn</div>
                <div className="bg-white border border-slate-200 p-2.5 rounded-xl inline-block shadow-xs">
                  <QrCode className="w-20 h-20 text-slate-700" />
                </div>
                <div className="text-[9px] text-slate-400 max-w-[240px] mx-auto pt-2 leading-relaxed font-sans">
                  Cảm ơn quý khách đã sử dụng dịch vụ tại GloPro Spa & Beauty. Rất hân hạnh được phục vụ quý khách lần sau!
                </div>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="mt-5 flex gap-2 w-full shrink-0 no-print">
              <button 
                onClick={() => { window.print(); toast.success('Đang thực thi in...'); }}
                className="flex-1 py-3 rounded-xl border border-slate-200 font-bold text-sm text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5 bg-white"
              >
                <Printer className="w-4 h-4" /> In hóa đơn
              </button>
              <button 
                onClick={() => setPrintingInvoice(null)} 
                className="flex-1 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/95 transition-colors flex items-center justify-center gap-1.5"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}