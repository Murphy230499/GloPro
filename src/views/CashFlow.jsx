'use client';
import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Wallet, Plus, Tag } from 'lucide-react';
import { useBranch } from '@/lib/BranchContext';
import { seedDefaultVoucherTypes } from '@/lib/cashFlowHelper';
import { useT } from '@/lib/i18n';
import IncomeTab from '@/components/cashflow/IncomeTab';
import ExpenseTab from '@/components/cashflow/ExpenseTab';
import VoucherTypeManager from '@/components/cashflow/VoucherTypeManager';
import ManualVoucherModal from '@/components/cashflow/ManualVoucherModal';

export default function CashFlow() {
  const { t } = useT();
  const { currentBranchId } = useBranch();
  const [activeTab, setActiveTab] = useState('income');
  const [modal, setModal] = useState(null); // null | 'income' | 'expense'
  const [reloadKey, setReloadKey] = useState(0);

  const TABS = [
    { id: 'income', label: t('cashflow.tab_income', 'Phiếu Thu'), icon: TrendingUp, color: 'emerald' },
    { id: 'expense', label: t('cashflow.tab_expense', 'Phiếu Chi'), icon: TrendingDown, color: 'red' },
    { id: 'types', label: t('cashflow.tab_types', 'Loại phiếu'), icon: Tag, color: 'slate' },
  ];

  // Seed default types once on mount
  useEffect(() => {
    seedDefaultVoucherTypes();
  }, []);

  const handleSaved = () => setReloadKey(k => k + 1);

  return (
    <div className="space-y-5 font-body">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-200">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{t('cashflow.page_title', 'Thu Chi')}</h1>
            <p className="text-xs text-slate-400">{t('cashflow.page_subtitle', 'Quản lý dòng tiền ra vào của cửa hàng')}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setModal('expense')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100 transition-colors border border-red-100"
          >
            <TrendingDown className="w-4 h-4" />
            <span className="hidden sm:inline">{t('cashflow.btn_expense_voucher', 'Phiếu Chi')}</span>
          </button>
          <button
            onClick={() => setModal('income')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-semibold hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-200 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{t('cashflow.btn_income_voucher', 'Phiếu Thu')}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="w-full overflow-x-auto custom-scrollbar pb-1 -mb-1">
        <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl w-max sm:w-fit">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            const activeStyle = {
              emerald: 'bg-white text-emerald-600 shadow-sm',
              red: 'bg-white text-red-500 shadow-sm',
              slate: 'bg-white text-slate-700 shadow-sm',
            }[tab.color];
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all shrink-0 ${
                  active ? activeStyle : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="animate-in fade-in duration-200">
        {activeTab === 'income' && (
          <IncomeTab branchId={currentBranchId} onReload={reloadKey} />
        )}
        {activeTab === 'expense' && (
          <ExpenseTab branchId={currentBranchId} onReload={reloadKey} />
        )}
        {activeTab === 'types' && (
          <VoucherTypeManager branchId={currentBranchId} />
        )}
      </div>

      {/* Manual Voucher Modal */}
      {modal && (
        <ManualVoucherModal
          defaultFlow={modal}
          branchId={currentBranchId}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
