import React, { useState, useEffect } from 'react';
import { base44 } from '../api/base44Client';
import { Plus, Search, Filter, Trash2, Edit, Printer, X } from 'lucide-react';
import { formatVND, formatDate } from '@/lib/format';
import { useRouter } from 'next/navigation';
import Avatar from '@/components/Avatar';
import DepositModal from '../components/deposits/DepositModal';

import { useT } from '@/lib/i18n';

export default function DepositsView() {
  const { t } = useT();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [deposits, setDeposits] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDeposit, setEditingDeposit] = useState(null);
  const [printingDeposit, setPrintingDeposit] = useState(null);
  
  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const [data, custData] = await Promise.all([
        base44.entities.Deposit.list('-created_at', 100),
        base44.entities.Customer.list()
      ]);
      setDeposits(data || []);
      setCustomers(custData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm(t('deposits.confirm_delete', 'Are you sure you want to delete this deposit receipt?'))) return;
    try {
      await base44.entities.Deposit.delete(id);
      setDeposits(deposits.filter(d => d.id !== id));
    } catch (err) {
      console.error(err);
      alert(t('deposits.error_delete', 'Cannot delete deposit receipt'));
    }
  };

  return (
    <div className="flex-1 overflow-auto bg-slate-50/50">
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{t('deposits.page_title', 'Quản lý Đặt cọc')}</h1>
            <p className="text-slate-500 mt-1">{t('deposits.page_subtitle', 'Quản lý tiền cọc của khách hàng')}</p>
          </div>
          <button 
            onClick={() => { setEditingDeposit(null); setModalOpen(true); }}
            className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-sm"
          >
            <Plus className="w-5 h-5" />
            <span>{t('deposits.btn_create', 'Tạo đặt cọc')}</span>
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden flex-1 flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="relative max-w-sm w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={t('deposits.search_ph', 'Tìm kiếm mã cọc, khách hàng...')}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-400 transition-colors shadow-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 flex items-center gap-2 shadow-sm transition-all">
              <Filter className="w-4 h-4" />
              <span>{t('deposits.btn_filter', 'Lọc')}</span>
            </button>
          </div>

          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="p-8 text-center text-slate-400">{t('deposits.loading', 'Loading data...')}</div>
            ) : deposits.length === 0 ? (
              <div className="p-16 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">{t('deposits.empty_title', 'Chưa có đặt cọc nào')}</h3>
                <p className="text-slate-500 text-sm">{t('deposits.empty_desc', 'Hãy tạo đặt cọc đầu tiên cho khách hàng')}</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-medium sticky top-0 z-10 border-b border-slate-200 shadow-sm">
                  <tr>
                    <th className="px-4 py-3">{t('deposits.col_code', 'Mã cọc')}</th>
                    <th className="px-4 py-3">{t('deposits.col_customer', 'Khách hàng')}</th>
                    <th className="px-4 py-3">{t('deposits.col_created_at', 'Ngày tạo')}</th>
                    <th className="px-4 py-3 text-right">{t('deposits.col_required_amount', 'Số tiền yêu cầu')}</th>
                    <th className="px-4 py-3 text-right">{t('deposits.col_paid_amount', 'Đã thanh toán')}</th>
                    <th className="px-4 py-3 text-center">{t('deposits.col_status', 'Trạng thái')}</th>
                    <th className="px-4 py-3 text-right">{t('deposits.col_actions', 'Thao tác')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {deposits.map((d) => (
                    <tr 
                      key={d.id} 
                      onClick={() => { setEditingDeposit(d); setModalOpen(true); }}
                      className="hover:bg-slate-50/50 cursor-pointer transition-colors group"
                    >
                      <td className="px-4 py-3 font-medium text-slate-800">{d.deposit_number}</td>
                      <td className="px-4 py-3">
                        {(() => {
                          const cust = customers.find(c => c.id === d.customer_id);
                          return cust ? (
                            <div 
                              className="flex items-center gap-3 cursor-pointer group"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/customers?id=${cust.id}`);
                              }}
                            >
                              <Avatar src={cust.avatar_url} name={cust.name} size={32} color="#FBBF24" />
                              <div>
                                <div className="font-semibold text-slate-800 group-hover:text-pink-600 transition-colors">
                                  {cust.name}
                                </div>
                                <div className="text-xs text-slate-500">{cust.phone}</div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">{t('deposits.walk_in_customer', 'Khách vãng lai')}</span>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-500 text-sm">{formatDate(d.created_at)}</td>
                      <td className="px-4 py-3 text-right font-medium text-slate-800">{formatVND(d.required_amount)}</td>
                      <td className="px-4 py-3 text-right font-bold text-green-600">{formatVND(d.paid_amount)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          d.status === 'paid' ? 'bg-green-100 text-green-700' :
                          d.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {d.status === 'paid' ? t('deposits.status_paid', 'Đã thu') : d.status === 'pending' ? t('deposits.status_pending', 'Chờ thu') : d.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setPrintingDeposit(d); }}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title={t('deposits.btn_print', 'In phiếu cọc')}
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setEditingDeposit(d); setModalOpen(true); }}
                            className="p-1.5 text-slate-400 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors"
                            title={t('deposits.btn_edit', 'Chỉnh sửa')}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={(e) => handleDelete(e, d.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title={t('deposits.btn_delete', 'Xoá phiếu cọc')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <DepositModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editing={editingDeposit}
        onSaved={load}
      />

      {/* Print Deposit Preview Modal */}
      {printingDeposit && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm print:bg-white print:p-0">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl flex flex-col font-body animate-in fade-in zoom-in-95 duration-200 print:shadow-none print:w-full">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 no-print px-6 pt-5">
              <h2 className="text-lg font-bold text-slate-800">{t('deposits.print_title', 'In phiếu cọc')}</h2>
              <button onClick={() => setPrintingDeposit(null)} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="printable-receipt bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6 mx-6 mb-2 mt-0 font-mono text-xs text-slate-800 space-y-5 shadow-inner">
              <div className="text-center space-y-2 pb-4 border-b border-slate-200 border-dashed">
                <h1 className="text-xl font-bold tracking-widest text-slate-900">GLOPRO</h1>
                <div className="text-[10px] text-slate-400">{t('deposits.print_date', 'Ngày in:')} {new Date().toLocaleDateString('vi-VN')} {new Date().toLocaleTimeString('vi-VN')}</div>
                <div className="inline-block px-3 py-1 bg-slate-800 text-white rounded-full font-bold text-[10px] tracking-widest mt-2">
                  {t('deposits.receipt_header', 'PHIẾU ĐẶT CỌC')}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between"><span>{t('deposits.lbl_code', 'Mã phiếu:')}</span><span>{printingDeposit.deposit_number}</span></div>
                <div className="flex justify-between"><span>{t('deposits.lbl_customer', 'Khách hàng:')}</span><span className="font-bold text-right truncate max-w-[180px]">{customers.find(c => c.id === printingDeposit.customer_id)?.name || t('deposits.walk_in_customer', 'Khách vãng lai')}</span></div>
                <div className="flex justify-between"><span>{t('deposits.lbl_created_at', 'Ngày tạo:')}</span><span>{formatDate(printingDeposit.created_at)}</span></div>
              </div>

              <div className="pt-4 border-t border-slate-200 border-dashed space-y-3">
                <div className="flex justify-between text-sm"><span>{t('deposits.lbl_required', 'Số tiền yêu cầu:')}</span><span className="font-bold">{formatVND(printingDeposit.required_amount)}</span></div>
                <div className="flex justify-between text-sm"><span>{t('deposits.lbl_paid', 'Đã thanh toán:')}</span><span className="font-bold text-green-600">{formatVND(printingDeposit.paid_amount)}</span></div>
                <div className="flex justify-between"><span>{t('deposits.lbl_status', 'Trạng thái:')}</span><span>{printingDeposit.status === 'paid' ? t('deposits.status_paid', 'Đã thu') : printingDeposit.status === 'pending' ? t('deposits.status_pending', 'Chờ thu') : printingDeposit.status}</span></div>
              </div>

              {printingDeposit.notes && (
                <div className="pt-4 border-t border-slate-200 border-dashed">
                  <div className="mb-1 text-slate-500">{t('deposits.lbl_notes', 'Ghi chú:')}</div>
                  <div className="text-slate-700">{printingDeposit.notes}</div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-200 border-dashed text-center text-[10px] text-slate-400">
                {t('deposits.thank_you_msg', 'Cảm ơn quý khách đã sử dụng dịch vụ!')}
              </div>
            </div>

            <div className="mt-2 mb-6 px-6 flex gap-2 w-full shrink-0 no-print">
              <button 
                onClick={() => { window.print(); }} 
                className="flex-1 bg-slate-800 hover:bg-slate-900 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-sm shadow-slate-900/20"
              >
                <Printer className="w-4 h-4" /> {t('deposits.btn_print', 'In phiếu cọc')}
              </button>
              <button 
                onClick={() => setPrintingDeposit(null)} 
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-bold transition-colors"
              >
                {t('deposits.btn_close', 'Đóng')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
