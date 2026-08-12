'use client';
import React, { useState, useEffect } from 'react';
import { X, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/Layout';
import { todayStr } from '@/lib/format';
import { generateCode } from '@/lib/cashFlowHelper';

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Tiền mặt' },
  { value: 'transfer', label: 'Chuyển khoản' },
  { value: 'card', label: 'Thẻ tín dụng' },
  { value: 'ewallet', label: 'Ví điện tử' },
];

import { useT } from '@/lib/i18n';

export default function ManualVoucherModal({ defaultFlow = 'income', onClose, onSaved, branchId }) {
  const { t } = useT();
  const [flow, setFlow] = useState(defaultFlow);
  const [types, setTypes] = useState([]);
  const [form, setForm] = useState({
    type_id: '',
    type_code: '',
    type_name: '',
    amount: '',
    date: todayStr(),
    description: '',
    note: '',
    payment_method: 'cash',
  });
  const [saving, setSaving] = useState(false);

  const PAYMENT_METHODS = [
    { value: 'cash', label: t('cashflow.pm_cash', 'Tiền mặt') },
    { value: 'transfer', label: t('cashflow.pm_transfer', 'Chuyển khoản') },
    { value: 'card', label: t('cashflow.pm_card', 'Thẻ tín dụng') },
    { value: 'ewallet', label: t('cashflow.pm_ewallet', 'Ví điện tử') },
  ];

  useEffect(() => {
    base44.entities.CashVoucherType.list().then(all => {
      setTypes((all || []).filter(t => t.flow === flow));
    }).catch(() => {});
  }, [flow]);

  useEffect(() => {
    setForm(f => ({ ...f, type_id: '', type_code: '', type_name: '' }));
  }, [flow]);

  const filteredTypes = types.filter(t => t.flow === flow);

  const handleTypeChange = (id) => {
    const found = types.find(t => t.id === id);
    setForm(f => ({
      ...f,
      type_id: id,
      type_code: found?.code || '',
      type_name: found?.name || '',
    }));
  };

  const handleSave = async () => {
    if (!form.type_id) return toast.error('Vui lòng chọn loại phiếu');
    const amount = Number(form.amount);
    if (!amount || amount <= 0) return toast.error('Số tiền phải lớn hơn 0');
    if (!form.date) return toast.error('Vui lòng chọn ngày');

    setSaving(true);
    try {
      const prefix = flow === 'income' ? 'PT' : 'PC';
      const date = form.date.replace(/-/g, '');
      const rand = String(Math.floor(100 + Math.random() * 900));
      const code = `${prefix}-${date}-${rand}`;

      await base44.entities.CashVoucher.create({
        code,
        flow,
        type_id: form.type_id,
        type_code: form.type_code,
        type_name: form.type_name,
        amount: Math.round(amount),
        date: form.date,
        description: form.description,
        note: form.note,
        payment_method: form.payment_method,
        source: 'manual',
        branch_id: branchId || null,
        created_by: 'user',
      });
      toast.success(`Đã tạo ${flow === 'income' ? 'phiếu thu' : 'phiếu chi'} thành công!`);
      onSaved?.();
      onClose();
    } catch (e) {
      toast.error('Lỗi: ' + (e.message || e));
    } finally {
      setSaving(false);
    }
  };

  const isIncome = flow === 'income';

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        className="relative bg-white w-full mx-3 md:mx-0 md:max-w-lg rounded-3xl p-6 shadow-2xl max-h-[82vh] md:max-h-[90vh] flex flex-col overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isIncome ? 'bg-emerald-100' : 'bg-red-100'}`}>
              {isIncome
                ? <TrendingUp className="w-5 h-5 text-emerald-600" />
                : <TrendingDown className="w-5 h-5 text-red-500" />
              }
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isIncome ? t('cashflow.modal_create_income', 'Tạo Phiếu Thu') : t('cashflow.modal_create_expense', 'Tạo Phiếu Chi')}
              </h2>
              <p className="text-xs text-slate-400">{t('cashflow.manual_entry', 'Nhập thủ công')}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Flow Toggle */}
        <div className="flex rounded-xl border border-slate-200 p-1 mb-5 bg-slate-50">
          {[{ value: 'income', label: `📥 ${t('cashflow.tab_income', 'Phiếu Thu')}` }, { value: 'expense', label: `📤 ${t('cashflow.tab_expense', 'Phiếu Chi')}` }].map(opt => (
            <button
              key={opt.value}
              onClick={() => setFlow(opt.value)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                flow === opt.value
                  ? opt.value === 'income' ? 'bg-emerald-500 text-white shadow-sm' : 'bg-red-500 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Type */}
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">{t('cashflow.lbl_voucher_type', 'Loại phiếu *')}</label>
            <select
              value={form.type_id}
              onChange={e => handleTypeChange(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:border-emerald-400 focus:outline-none"
            >
              <option value="">-- {t('cashflow.select_voucher_type_ph', 'Chọn loại phiếu')} --</option>
              {filteredTypes.map(tItem => (
                <option key={tItem.id} value={tItem.id}>{tItem.code ? t(`cashflow.type_${tItem.code}`, tItem.name) : tItem.name}</option>
              ))}
            </select>
          </div>

          {/* Amount + Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">{t('cashflow.lbl_amount', 'Số tiền (VND) *')}</label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-emerald-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">{t('cashflow.lbl_date', 'Ngày *')}</label>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-emerald-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Payment method */}
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">{t('cashflow.lbl_payment_method', 'Phương thức thanh toán')}</label>
            <div className="grid grid-cols-4 gap-2">
              {PAYMENT_METHODS.map(m => (
                <button
                  key={m.value}
                  onClick={() => setForm(f => ({ ...f, payment_method: m.value }))}
                  className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                    form.payment_method === m.value
                      ? 'bg-slate-800 text-white border-slate-800'
                      : 'border-slate-200 text-slate-600 hover:border-slate-400'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">{t('cashflow.lbl_description', 'Mô tả')}</label>
            <input
              type="text"
              placeholder={t('cashflow.ph_description', 'Mô tả ngắn gọn về khoản thu/chi...')}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-emerald-400 focus:outline-none"
            />
          </div>

          {/* Note */}
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">{t('cashflow.lbl_note', 'Ghi chú')}</label>
            <textarea
              rows={2}
              placeholder={t('cashflow.ph_note', 'Ghi chú thêm (nếu có)...')}
              value={form.note}
              onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-emerald-400 focus:outline-none resize-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-5">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            {t('cashflow.btn_cancel', 'Huỷ')}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex-1 py-3 rounded-xl text-sm font-bold text-white shadow-lg transition-all disabled:opacity-60 ${
              isIncome
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-emerald-200'
                : 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 shadow-red-200'
            }`}
          >
            {saving ? <Loader2 className="w-4 h-4 mx-auto animate-spin" /> : `${t('cashflow.btn_save', 'Lưu')} ${isIncome ? t('cashflow.tab_income', 'Phiếu Thu') : t('cashflow.tab_expense', 'Phiếu Chi')}`}
          </button>
        </div>
      </div>
    </div>
  );
}
