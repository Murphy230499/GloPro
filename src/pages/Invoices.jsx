import React, { useEffect, useState } from 'react';
import { Search, Filter, Printer, ChevronLeft, ChevronRight, CreditCard, Ban, ArrowLeft, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const { currentBranchId, branches } = useBranch();
  const [invoices, setInvoices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState('unpaid');
  const [page, setPage] = useState(1);

  const load = () => {
    setLoading(true);
    const filter = currentBranchId === 'all' ? {} : { branch_id: currentBranchId };
    Promise.all([
      base44.entities.Invoice.filter(filter),
      base44.entities.Staff.list(),
    ]).then(([data, st]) => {
      setInvoices(data.sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.invoice_code || '').localeCompare(a.invoice_code || '')));
      setStaff(st);
      setLoading(false);
    });
  };

  useEffect(load, [currentBranchId]);

  const counts = STATUS_TABS.reduce((acc, t) => {
    acc[t.value] = invoices.filter((i) => i.status === t.value).length;
    return acc;
  }, {});

  const filtered = invoices.filter((inv) => {
    if (inv.status !== statusTab) return false;
    if (search) {
      const q = search.toLowerCase();
      const staffNames = (inv.items || []).map((it) => it.staff_name).filter(Boolean).join(' ');
      return (inv.invoice_code || '').toLowerCase().includes(q) || (inv.customer_name || '').toLowerCase().includes(q) || staffNames.toLowerCase().includes(q);
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

  const voidInvoice = async (inv) => {
    if (!confirm('Huỷ hoá đơn này?')) return;
    try {
      await base44.entities.Invoice.update(inv.id, { status: 'cancelled' });
      toast.success('Đã huỷ hoá đơn');
      load();
    } catch (e) { toast.error('Lỗi: ' + (e.message || e)); }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/pos')} className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="text-xs text-slate-400">Thu ngân</div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">Doanh thu trong ngày</h1>
          </div>
        </div>
        <button onClick={() => navigate('/pos')} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white font-semibold text-sm">
          <FileText className="w-4 h-4" /> Tạo đơn mới
        </button>
      </div>

      {/* Status tabs */}
      <div className="flex items-center gap-1.5">
        {STATUS_TABS.map((t) => (
          <button key={t.value} onClick={() => { setStatusTab(t.value); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${statusTab === t.value ? 'bg-primary text-white' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
            {t.label} <span className="ml-1 opacity-70">({counts[t.value] || 0})</span>
          </button>
        ))}
      </div>

      {/* Table panel */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-2 p-3 border-b border-slate-100">
          <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2 flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Tìm theo mã đơn, khách hàng hoặc nhân viên..."
              className="bg-transparent outline-none text-sm flex-1" />
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-500 hover:bg-slate-50">
              <Filter className="w-4 h-4" /> <span className="hidden sm:inline">Lọc</span>
            </button>
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-500 hover:bg-slate-50">
              <Printer className="w-4 h-4" /> <span className="hidden sm:inline">In</span>
            </button>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin" /></div>
        ) : pageData.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">Không có hoá đơn nào</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs">Mã đơn</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs">Khách hàng</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs">Nhân viên</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs">Ngày tạo</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-500 text-xs">Tổng tiền</th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-500 text-xs">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {pageData.map((inv) => {
                  const stfList = getStaffList(inv);
                  return (
                    <tr key={inv.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="px-4 py-3">
                        <button onClick={() => navigate(`/invoices/${inv.id}`)} className="text-primary font-semibold hover:underline">
                          {inv.invoice_code || '—'}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar name={inv.customer_name} size={28} color="#E879A9" />
                          <span className="font-medium">{inv.customer_name || '—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
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
                            <div className="w-7 h-7 rounded-full bg-slate-100 ring-2 ring-white flex items-center justify-center text-xs font-bold text-slate-500" style={{ marginLeft: '-8px' }}>
                              +{stfList.length - 3}
                            </div>
                          )}
                          {stfList.length === 0 && <span className="text-slate-300 text-xs">—</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{inv.date || '—'}</td>
                      <td className="px-4 py-3 text-right font-bold text-pink-600">{formatVND((inv.total || 0) + (inv.tip || 0))}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button onClick={() => navigate(`/invoices/${inv.id}`)} className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50" title="Xem chi tiết">
                            <CreditCard className="w-4 h-4" />
                          </button>
                          {inv.status !== 'cancelled' && (
                            <button onClick={() => voidInvoice(inv)} className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-red-400 hover:bg-red-50 hover:border-red-200" title="Huỷ hoá đơn">
                              <Ban className="w-4 h-4" />
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
          <div className="flex items-center justify-center gap-1.5 py-3 border-t border-slate-100">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-2.5 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50">
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 10).map((p) => (
              <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg text-sm font-medium ${page === p ? 'bg-primary text-white' : 'border border-slate-200 hover:bg-slate-50'}`}>
                {p}
              </button>
            ))}
            <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="px-2.5 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}