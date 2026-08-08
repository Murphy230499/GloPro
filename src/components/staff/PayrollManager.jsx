import { useT } from '@/lib/i18n';
import React, { useState } from 'react';
import { Table, Clock } from 'lucide-react';
import PayrollRunTab from './PayrollRunTab';
import PayrollHistoryTab from './PayrollHistoryTab';
import { createExpenseVoucher } from '@/lib/cashFlowHelper';

const INITIAL_HISTORY = [
  { id: 1, payDate: '1 Th07, 2024', payPeriod: '01/06/2023 - 30/06/2023', status: 'Đang xử lý', total: 432 },
  { id: 2, payDate: '1 Th06, 2024', payPeriod: '01/05/2023 - 30/05/2023', status: 'Hoàn thành', total: 472 },
  { id: 3, payDate: '1 Th05, 2024', payPeriod: '01/04/2023 - 30/04/2023', status: 'Hoàn thành', total: 342 },
  { id: 4, payDate: '1 Th04, 2024', payPeriod: '01/03/2023 - 31/03/2023', status: 'Hoàn thành', total: 754 },
  { id: 5, payDate: '1 Th03, 2024', payPeriod: '01/02/2023 - 28/02/2023', status: 'Hoàn thành', total: 543 },
  { id: 6, payDate: '1 Th02, 2024', payPeriod: '01/01/2023 - 31/01/2023', status: 'Hoàn thành', total: 865 },
  { id: 7, payDate: '1 Th01, 2024', payPeriod: '01/12/2023 - 31/12/2023', status: 'Hoàn thành', total: 434 },
];

export default function PayrollManager({ staff, onSelectStaffForDetail }) {
  const { t } = useT();
  const [activeTab, setActiveTab] = useState('run'); // 'run' or 'history'
  const [history, setHistory] = useState(INITIAL_HISTORY);

  const handleRunPayroll = (newRun) => {
    setHistory(prev => [{ ...newRun, id: Date.now() }, ...prev]);
    setActiveTab('history');

    // ── Auto cash flow: Phiếu Chi lương ──────────────────────────────────
    const totalSalary = Number(newRun.total || 0);
    if (totalSalary > 0) {
      const period = newRun.payPeriod || newRun.payDate || '';
      createExpenseVoucher({
        typeCode: 'salary',
        typeName: 'Chi lương',
        amount: totalSalary,
        description: `Thanh toán lương kỳ ${period}`,
        paymentMethod: 'transfer',
        refCode: `PAYROLL-${Date.now()}`,
      }).catch(e => console.warn('[CashFlow] Salary expense voucher failed:', e.message));
    }
    // ───────────────────────────────────────────────────────────────
  };

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="flex items-center gap-5 border-b border-slate-200/80 overflow-x-auto whitespace-nowrap scrollbar-none px-1 font-body">
        <button
          type="button"
          onClick={() => setActiveTab('run')}
          className={`py-2 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === 'run'
              ? 'border-orange-500 text-orange-500'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          {t('staff.payroll.tab_run', 'Bảng lương nhân viên')}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`py-2 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === 'history'
              ? 'border-orange-500 text-orange-500'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          {t('staff.payroll.tab_history', 'Lịch sử thanh toán')}
        </button>
      </div>

      {/* Tab Content */}
      <div className="w-full">
        {activeTab === 'run' && (
          <PayrollRunTab 
            staff={staff} 
            onRunPayroll={handleRunPayroll} 
            onSelectStaffForDetail={onSelectStaffForDetail} 
          />
        )}
        {activeTab === 'history' && <PayrollHistoryTab history={history} staff={staff} />}
      </div>
    </div>
  );
}
