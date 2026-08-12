import { useT } from '@/lib/i18n';
import React, { useState } from 'react';
import { X } from 'lucide-react';
import Avatar from '@/components/Avatar';
import EmployeePayslipModal from './EmployeePayslipModal';

export default function PayrollHistoryDetailModal({ isOpen, onClose, historyRecord, staffData }) {
  const { t } = useT();
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  if (!isOpen || !historyRecord) return null;

  const formatMoney = (amount) => {
    if (!amount) return '0 đ';
    return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
  };

  // Calculate totals (since it's read-only, all staff are included in the mock data)
  const totals = staffData.reduce((acc, row) => {
    acc.salary += (row.salary || 0);
    acc.serviceCom += (row.serviceCom || 0);
    acc.treatmentCom += (row.treatmentCom || 0);
    acc.packageCom += (row.packageCom || 0);
    acc.serviceComboCom += (row.serviceComboCom || 0);
    acc.productComboCom += (row.productComboCom || 0);
    acc.productCom += (row.productCom || 0);
    acc.prepaidCardCom += (row.prepaidCardCom || 0);
    acc.requestedCom += (row.requestedCom || 0);
    acc.overtimeCom += (row.overtimeCom || 0);
    acc.revenueCom += (row.revenueCom || 0);
    acc.tip += (row.tip || 0);
    acc.bonus += (row.bonus || 0);
    acc.penalty += (row.penalty || 0);
    acc.total += (row.total || 0);
    return acc;
  }, {
    salary: 0, serviceCom: 0, treatmentCom: 0, packageCom: 0, serviceComboCom: 0,
    productComboCom: 0, productCom: 0, prepaidCardCom: 0, requestedCom: 0,
    overtimeCom: 0, revenueCom: 0, tip: 0, bonus: 0, penalty: 0, total: 0
  });

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="relative bg-slate-50 w-full h-full sm:h-[90vh] sm:max-w-[95vw] sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-800">{t('staff.payroll.history_detail_title', 'Chi tiết thanh toán lương')}</h2>
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors bg-slate-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Info Cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-4 border border-slate-100 flex items-center gap-4 shadow-sm">
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-0.5">{t('staff.payroll.pay_period', 'Kỳ lương')}</p>
                  <p className="text-sm font-normal text-slate-800">{historyRecord.payPeriod}</p>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-4 border border-slate-100 flex items-center gap-4 shadow-sm">
                <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-0.5">{t('staff.payroll.pay_date', 'Ngày thanh toán')}</p>
                  <p className="text-sm font-normal text-slate-800">{historyRecord.payDate}</p>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 border border-slate-100 flex items-center gap-4 shadow-sm">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-0.5">{t('staff.payroll.total_payout', 'Tổng thanh toán')}</p>
                  <p className="text-sm font-normal text-slate-800">{formatMoney(totals.total)}</p>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-max border-collapse">
                  <thead>
                    <tr className="bg-[#eff5ff] text-slate-700 font-semibold text-xs border-b border-slate-200">
                      <th className="py-4 px-5 sticky left-0 bg-[#eff5ff] z-10 min-w-[250px] whitespace-nowrap">{t('staff.payroll.col_staff', 'Nhân viên')}</th>
                      <th className="py-4 px-4 text-center whitespace-nowrap">{t('staff.payroll.col_payment_method', 'Phương thức TT')}</th>
                      <th className="py-4 px-4 text-right">{t('staff.payroll.col_base_salary', 'Lương CB')}</th>
                      <th className="py-4 px-4 text-right">{t('staff.payroll.col_prod_com', 'HH Sản phẩm')}</th>
                      <th className="py-4 px-4 text-right">{t('staff.payroll.col_svc_com', 'HH Dịch vụ')}</th>
                      <th className="py-4 px-4 text-right">{t('staff.payroll.col_trt_com', 'HH Liệu trình')}</th>
                      <th className="py-4 px-4 text-right">{t('staff.payroll.col_pkg_com', 'HH Gói DV')}</th>
                      <th className="py-4 px-4 text-right">{t('staff.payroll.col_svccmb_com', 'HH Combo DV')}</th>
                      <th className="py-4 px-4 text-right">{t('staff.payroll.col_prodcmb_com', 'HH Combo SP')}</th>
                      <th className="py-4 px-4 text-right">{t('staff.payroll.col_card_com', 'HH Thẻ TM')}</th>
                      <th className="py-4 px-4 text-right">{t('staff.payroll.col_req_com', 'HH Khách yêu cầu')}</th>
                      <th className="py-4 px-4 text-right">{t('staff.payroll.col_ot_com', 'HH Tăng ca')}</th>
                      <th className="py-4 px-4 text-right">{t('staff.payroll.col_rev_com', 'HH Doanh thu')}</th>
                      <th className="py-4 px-4 text-right">{t('staff.payroll.col_tip', 'Tiền Tip')}</th>
                      <th className="py-4 px-4 text-right">{t('staff.payroll.col_bonus', 'Thưởng')}</th>
                      <th className="py-4 px-4 text-right">{t('staff.payroll.col_penalty', 'Phạt')}</th>
                      <th className="py-4 px-5 text-right sticky right-0 bg-[#eff5ff] z-10 border-l border-slate-200 shadow-[-4px_0_10px_rgba(0,0,0,0.02)]">{t('staff.payroll.col_total', 'Tổng nhận')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {staffData.map(row => {
                      return (
                        <tr 
                          key={row.id} 
                          className="bg-white hover:bg-slate-50 transition-colors cursor-pointer"
                          onClick={() => setSelectedEmployee(row)}
                        >
                          <td className="py-4 px-5 sticky left-0 z-10 bg-inherit border-r border-slate-100 group">
                            <div className="flex items-center gap-3">
                              <Avatar src={row.avatar_url} name={row.name || row.full_name} size={28} color={row.avatar_color} />
                              <span className="text-sm font-normal text-slate-800 whitespace-nowrap group-hover:text-blue-600 transition-colors">{row.name || row.full_name}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-sm font-normal text-slate-600 text-center">{t('staff.payroll.cash', 'Tiền mặt')}</td>
                          <td className="py-4 px-4 text-sm font-normal text-slate-600 text-right">{formatMoney(row.salary)}</td>
                          <td className="py-4 px-4 text-sm font-normal text-slate-600 text-right">{formatMoney(row.productCom)}</td>
                          <td className="py-4 px-4 text-sm font-normal text-slate-600 text-right">{formatMoney(row.serviceCom)}</td>
                          <td className="py-4 px-4 text-sm font-normal text-slate-600 text-right">{formatMoney(row.treatmentCom)}</td>
                          <td className="py-4 px-4 text-sm font-normal text-slate-600 text-right">{formatMoney(row.packageCom)}</td>
                          <td className="py-4 px-4 text-sm font-normal text-slate-600 text-right">{formatMoney(row.serviceComboCom)}</td>
                          <td className="py-4 px-4 text-sm font-normal text-slate-600 text-right">{formatMoney(row.productComboCom)}</td>
                          <td className="py-4 px-4 text-sm font-normal text-slate-600 text-right">{formatMoney(row.prepaidCardCom)}</td>
                          <td className="py-4 px-4 text-sm font-normal text-slate-600 text-right">{formatMoney(row.requestedCom)}</td>
                          <td className="py-4 px-4 text-sm font-normal text-slate-600 text-right">{formatMoney(row.overtimeCom)}</td>
                          <td className="py-4 px-4 text-sm font-normal text-slate-600 text-right">{formatMoney(row.revenueCom)}</td>
                          <td className="py-4 px-4 text-sm font-normal text-slate-600 text-right">{formatMoney(row.tip)}</td>
                          <td className="py-4 px-4 text-sm font-normal text-slate-600 text-right">{formatMoney(row.bonus)}</td>
                          <td className="py-4 px-4 text-sm font-normal text-slate-600 text-right">{formatMoney(row.penalty)}</td>
                          <td className="py-4 px-5 text-sm font-normal text-slate-800 text-right sticky right-0 z-10 bg-inherit border-l border-slate-100 shadow-[-4px_0_10px_rgba(0,0,0,0.02)]">
                            {formatMoney(row.total)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-[#eff5ff] border-t border-slate-200">
                    <tr className="text-sm font-bold text-slate-800">
                      <td className="py-4 px-5 sticky left-0 bg-[#eff5ff] z-10">{t('staff.payroll.total_sum', 'Tổng cộng')}</td>
                      <td className="py-4 px-4"></td>
                      <td className="py-4 px-4 text-right">{formatMoney(totals.salary)}</td>
                      <td className="py-4 px-4 text-right">{formatMoney(totals.productCom)}</td>
                      <td className="py-4 px-4 text-right">{formatMoney(totals.serviceCom)}</td>
                      <td className="py-4 px-4 text-right">{formatMoney(totals.treatmentCom)}</td>
                      <td className="py-4 px-4 text-right">{formatMoney(totals.packageCom)}</td>
                      <td className="py-4 px-4 text-right">{formatMoney(totals.serviceComboCom)}</td>
                      <td className="py-4 px-4 text-right">{formatMoney(totals.productComboCom)}</td>
                      <td className="py-4 px-4 text-right">{formatMoney(totals.prepaidCardCom)}</td>
                      <td className="py-4 px-4 text-right">{formatMoney(totals.requestedCom)}</td>
                      <td className="py-4 px-4 text-right">{formatMoney(totals.overtimeCom)}</td>
                      <td className="py-4 px-4 text-right">{formatMoney(totals.revenueCom)}</td>
                      <td className="py-4 px-4 text-right">{formatMoney(totals.tip)}</td>
                      <td className="py-4 px-4 text-right">{formatMoney(totals.bonus)}</td>
                      <td className="py-4 px-4 text-right">{formatMoney(totals.penalty)}</td>
                      <td className="py-4 px-5 text-right sticky right-0 bg-[#eff5ff] z-10 border-l border-slate-200 shadow-[-4px_0_10px_rgba(0,0,0,0.02)]">
                        {formatMoney(totals.total)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-white border-t border-slate-100 px-6 py-4 flex justify-end">
            <button 
              onClick={onClose}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-8 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-colors"
            >
              {t('staff.scheduler.close_btn', 'Đóng')}
            </button>
          </div>
        </div>
      </div>

      {/* Employee Payslip Modal */}
      <EmployeePayslipModal 
        isOpen={!!selectedEmployee}
        onClose={() => setSelectedEmployee(null)}
        employee={selectedEmployee}
        payPeriod={historyRecord.payPeriod}
        payDate={historyRecord.payDate}
      />
    </>
  );
}
