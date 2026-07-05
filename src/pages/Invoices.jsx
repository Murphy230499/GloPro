import React, { useEffect, useState } from 'react';
import { Search, ArrowLeft, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useBranch } from '@/lib/BranchContext';
import { formatVND } from '@/lib/format';
import { toast } from '@/components/Layout';

const STATUS_TABS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'paid', label: 'Đã thanh toán' },
  { value: 'unpaid', label: 'Chưa thanh toán' },
  { value: 'cancelled', label: 'Đã huỷ' },
];

const STATUS_BADGE = {
  paid: { bg: '#D1FAE5', text: '#047857', label: 'Đã thanh toán' },
  unpaid: { bg: '#FEF3C7', text: '#B45309', label: 'Chưa thanh toán' },
  cancelled: { bg: '#FEE2E2', text: '#B91C1C', label: 'Đã huỷ' },
  refunded: { bg: '#FEE2E2', text: '#B91C1C', label: 'Đã hoàn' },
};

const PAGE_SIZE = 10;

export default function Invoices() {
  const navigate = useNavigate();
  const { currentBranchId, branches } = useBranch();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState('all');
  const [page, setPage] = useState(1);

  const load = () => {
    setLoading(true);
    const filter = currentBranchId === 'all' ? {} : { branch_id: currentBranchId };
    base44.entities.Invoice.filter(filter).then((data) => {
      setInvoices(data.sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.invoice_code || '').localeCompare(a.invoice_code || '')));
      setLoading(false);
    });
  };

  useEffect(load, [currentBranchId]);

  const filtered = invoices.filter((inv) => {
    if (statusTab !== 'all' && inv.status !== statusTab) return false;
    if (search) {
      const q = search.toLowerCase();
      return (inv.invoice_code || '').toLowerCase().includes(q) || (inv.customer_name || '').toLowerCase().includes(q);
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const hasStaffAssigned = (inv) => (inv.items || []).some((it) => it.staff_id);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/pos')} className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">Danh sách hoá đơn</h1>
            <p className="text-slate-400 text-xs mt-0.5">{branches.find((b) => b.id === currentBranchId)?.name || 'Tất cả cơ sở'}</p>
          </div>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 hover:bg-slate-50">
          <RefreshCw className="w-4 h-4" /> Làm mới
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3 space-y-3">
        <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2.5">
          <Search className="w-4 h-4 text-slate-400" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Mã đơn hàng, tên khách hàng..." className="bg-transparent outline-none text-sm flex-1" />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {STATUS_TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => { setStatusTab(t.value); setPage(1); }}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${statusTab === t.value ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin" /></div>
        ) : pageData.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">Không có hoá đơn nào</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-3 py-3 font-semibold text-slate-500 text-xs">STT</th>
                  <th className="text-left px-3 py-3 font-semibold text-slate-500 text-xs">Mã đơn hàng</th>
                  <th className="text-left px-3 py-3 font-semibold text-slate-500 text-xs">Tên khách hàng</th>
                  <th className="text-center px-3 py-3 font-semibold text-slate-500 text-xs">Số dịch vụ</th>
                  <th className="text-left px-3 py-3 font-semibold text-slate-500 text-xs">Ngày tạo</th>
                  <th className="text-left px-3 py-3 font-semibold text-slate-500 text-xs">Xếp nhân viên</th>
                  <th className="text-left px-3 py-3 font-semibold text-slate-500 text-xs">Trạng thái</th>
                  <th className="text-center px-3 py-3 font-semibold text-slate-500 text-xs">Số lần in</th>
                  <th className="text-right px-3 py-3 font-semibold text-slate-500 text-xs">Tổng tiền</th>
                </tr>
              </thead>
              <tbody>
                {pageData.map((inv, i) => {
                  const badge = STATUS_BADGE[inv.status] || STATUS_BADGE.unpaid;
                  const serviceCount = (inv.items || []).filter((it) => it.type === 'service').reduce((s, it) => s + (it.qty || 1), 0);
                  const stAssigned = hasStaffAssigned(inv);
                  return (
                    <tr key={inv.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="px-3 py-3 text-slate-400">{(page - 1) * PAGE_SIZE + i + 1}</td>
                      <td className="px-3 py-3">
                        <button onClick={() => navigate(`/invoices/${inv.id}`)} className="text-blue-600 font-semibold hover:underline">
                          {inv.invoice_code || '—'}
                        </button>
                      </td>
                      <td className="px-3 py-3 font-medium">{inv.customer_name || '—'}</td>
                      <td className="px-3 py-3 text-center text-slate-600">{serviceCount}</td>
                      <td className="px-3 py-3 text-slate-500 text-xs">{inv.date || '—'}</td>
                      <td className="px-3 py-3">
                        <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ background: stAssigned ? '#DBEAFE' : '#F1F5F9', color: stAssigned ? '#2563EB' : '#64748B' }}>
                          {stAssigned ? 'Đã xếp NV' : 'Chưa xếp NV'}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ background: badge.bg, color: badge.text }}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center text-slate-400">{inv.print_count || 0}</td>
                      <td className="px-3 py-3 text-right font-bold text-pink-600">{formatVND(inv.total || 0)}</td>
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
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-3 py-1.5 rounded-lg text-sm font-medium border border-slate-200 disabled:opacity-40 hover:bg-slate-50">
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 10).map((p) => (
              <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg text-sm font-medium ${page === p ? 'bg-primary text-white' : 'border border-slate-200 hover:bg-slate-50'}`}>
                {p}
              </button>
            ))}
            <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="px-3 py-1.5 rounded-lg text-sm font-medium border border-slate-200 disabled:opacity-40 hover:bg-slate-50">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}