import { useT } from '@/lib/i18n';
import React, { useState } from 'react';
import PayrollHistoryDetailModal from './PayrollHistoryDetailModal';

export default function PayrollHistoryTab({ history = [], staff = [] }) {
  const { t } = useT();
  const [selectedRun, setSelectedRun] = useState(null);
  const [payrollDataMap, setPayrollDataMap] = React.useState({});

  const formatMoney = (val) => `${new Intl.NumberFormat('vi-VN').format(val || 0)}đ`;

  React.useEffect(() => {
    if (!staff.length || !history.length) return;
    
    // Generate mock payroll data for each history run to ensure totals match
    const newMap = {};
    history.forEach(h => {
      // If we already generated data for this run, keep it (to prevent random changing on re-renders)
      if (payrollDataMap[h.id]) {
        newMap[h.id] = payrollDataMap[h.id];
        return;
      }
      
      newMap[h.id] = staff.map(s => {
        const isNail = s.group === 'Nails';
        const isLash = s.group === 'Mi - Massage';
        const isGoiDau = s.group === 'Gội Đầu';
        const baseTotal = isNail ? 12000000 : isLash ? 8000000 : isGoiDau ? 6000000 : 5000000;
        const salary = s.salary_type === 'Cố định' ? (s.base_salary || baseTotal * 0.4) : 0;
        const productCom = baseTotal * 0.1;
        const serviceCom = baseTotal * 0.2;
        const treatmentCom = baseTotal * 0.05;
        const packageCom = baseTotal * 0.05;
        const serviceComboCom = baseTotal * 0.05;
        const productComboCom = baseTotal * 0.02;
        const prepaidCardCom = baseTotal * 0.02;
        const requestedCom = baseTotal * 0.01;
        const overtimeCom = baseTotal * 0.02;
        const revenueCom = baseTotal * 0.03;
        const tip = baseTotal * 0.05;
        const bonus = Math.floor(Math.random() * 500000);
        const penalty = Math.floor(Math.random() * 200000);
        const randomShifts = Math.floor(Math.random() * 10) + 20;
        const randomHours = Math.floor(randomShifts * (4 + Math.random()));
        
        return {
          ...s,
          shifts: `${randomShifts} Ca/ ${randomHours}h`,
          daysOff: Math.floor(Math.random() * 4),
          salary, productCom, serviceCom, treatmentCom, packageCom, serviceComboCom,
          productComboCom, prepaidCardCom, requestedCom, overtimeCom, revenueCom,
          tip, bonus, penalty,
          total: salary + productCom + serviceCom + treatmentCom + packageCom + serviceComboCom +
                 productComboCom + prepaidCardCom + requestedCom + overtimeCom + revenueCom + tip + bonus - penalty
        };
      });
    });
    setPayrollDataMap(newMap);
  }, [history, staff]);

  return (
    <>
      <div className="space-y-4">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-sans whitespace-nowrap min-w-max">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold text-xs">
                  <th className="py-4 px-6 border-r border-slate-100 w-[20%]">{t('staff.payroll.pay_date', 'Ngày trả')}</th>
                  <th className="py-4 px-6 border-r border-slate-100 w-[30%]">{t('staff.payroll.pay_period', 'Kỳ lương')}</th>
                  <th className="py-4 px-6 border-r border-slate-100 w-[20%]">{t('staff.payroll.status', 'Trạng thái')}</th>
                  <th className="py-4 px-6 border-r border-slate-100 w-[20%]">{t('staff.payroll.total_fund', 'Tổng quỹ lương')}</th>
                  <th className="py-4 px-6 w-[10%] text-center">{t('staff.payroll.details', 'Chi tiết')}</th>
                </tr>
              </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {history.map((row) => {
                const rowStaffData = payrollDataMap[row.id] || [];
                const actualTotal = rowStaffData.reduce((acc, curr) => acc + curr.total, 0);

                return (
                  <tr key={row.id} className="hover:bg-slate-50/20 transition-colors">
                    <td className="py-4 px-6 text-[13px] font-medium text-slate-700 border-r border-slate-100">{row.payDate}</td>
                    <td className="py-4 px-6 text-[13px] font-normal text-slate-600 border-r border-slate-100">{row.payPeriod}</td>
                    <td className="py-4 px-6 border-r border-slate-100">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold ${
                        row.status === 'Hoàn thành' 
                          ? 'bg-blue-50 text-blue-600 border border-blue-100'
                          : 'bg-orange-50 text-orange-600 border border-orange-100'
                      }`}>
                        {row.status === 'Hoàn thành' ? t('staff.payroll.completed', 'Hoàn thành') : row.status === 'Đang xử lý' ? t('staff.payroll.processing', 'Đang xử lý') : row.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-[13px] font-medium text-slate-700 border-r border-slate-100">{formatMoney(actualTotal)}</td>
                    <td className="py-4 px-6 text-center">
                      <button 
                        onClick={() => setSelectedRun(row)}
                        className="text-[13px] font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors mx-auto"
                      >
                        {t('staff.payroll.details', 'Chi tiết')}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            </table>
          </div>
        </div>
      </div>

      <PayrollHistoryDetailModal 
        isOpen={!!selectedRun}
        onClose={() => setSelectedRun(null)}
        historyRecord={selectedRun}
        staffData={selectedRun ? (payrollDataMap[selectedRun.id] || []) : []}
      />
    </>
  );
}
