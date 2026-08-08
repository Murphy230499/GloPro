import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, PiggyBank, CreditCard, Banknote, Landmark } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/Layout';
import { formatVND } from '@/lib/format';
import CustomerPicker from '@/components/CustomerPicker';
import NewCustomerModal from '@/components/pos/NewCustomerModal';

import { useT } from '@/lib/i18n';

export default function DepositModal({ open, onClose, editing, onSaved }) {
  const { t } = useT();
  const [form, setForm] = useState({
    deposit_number: '',
    customer_id: '',
    appointment_id: '',
    required_amount: 0,
    paid_amount: 0,
    payment_method: 'transfer',
    notes: ''
  });
  const [saving, setSaving] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [newCustomerOpen, setNewCustomerOpen] = useState(false);

  useEffect(() => {
    if (open) {
      base44.entities.Customer.list().then(setCustomers).catch(() => {});
    }
  }, [open]);

  useEffect(() => {
    if (editing) {
      setForm({
        ...editing
      });
    } else {
      setForm({
        deposit_number: `DEP-${Math.floor(Math.random() * 1000000)}`,
        customer_id: '',
        appointment_id: '',
        required_amount: 0,
        paid_amount: 0,
        payment_method: 'transfer',
        notes: ''
      });
    }
  }, [editing, open]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = {
        ...form,
        status: form.paid_amount >= form.required_amount ? 'paid' : (form.paid_amount > 0 ? 'partially_paid' : 'pending')
      };

      if (editing?.id) {
        await base44.entities.Deposit.update(editing.id, payload);
        toast.success(t('deposits.msg_update_success', 'Deposit updated successfully'));
      } else {
        await base44.entities.Deposit.create(payload);
        toast.success(t('deposits.msg_create_success', 'Deposit created successfully'));
      }
      onSaved?.();
      onClose();
    } catch (e) {
      console.error(e);
      toast.error(t('deposits.msg_save_error', 'Error saving deposit'));
    } finally {
      setSaving(false);
    }
  };

  const handleAmountChange = (e, field) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, '');
    setForm({ ...form, [field]: Number(rawValue) });
  };

  if (!open) return null;

  return (
    <>
      {createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col font-body animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center text-pink-600">
                  <PiggyBank className="w-5 h-5" />
                </div>
                <div>
              <h2 className="text-lg font-bold text-slate-800">
                {editing ? t('deposits.edit_modal_title', 'Cập nhật Đặt cọc') : t('deposits.create_modal_title', 'Tạo Đặt cọc Mới')}
              </h2>
              <p className="text-xs text-slate-500 font-medium">{t('deposits.lbl_code_prefix', 'Code:')} {form.deposit_number}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[70vh] space-y-4">
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">{t('deposits.lbl_customer_field', 'Khách hàng')}</label>
              <CustomerPicker
                customers={customers}
                value={form.customer_id}
                onChange={(id) => setForm({...form, customer_id: id})}
                onAddNew={() => setNewCustomerOpen(true)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">{t('deposits.lbl_required_field', 'Số tiền yêu cầu')}</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={form.required_amount ? Number(form.required_amount).toLocaleString('vi-VN') : ''}
                    onChange={e => handleAmountChange(e, 'required_amount')}
                    placeholder="0"
                    className="w-full px-4 py-2.5 pr-8 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-50 transition-all font-bold text-slate-800 text-right"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">đ</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">{t('deposits.lbl_paid_field', 'Đã thanh toán')}</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={form.paid_amount ? Number(form.paid_amount).toLocaleString('vi-VN') : ''}
                    onChange={e => handleAmountChange(e, 'paid_amount')}
                    placeholder="0"
                    className="w-full px-4 py-2.5 pr-8 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:border-pink-400 focus:ring-4 focus:ring-green-50 transition-all font-bold text-green-600 text-right"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">đ</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">{t('deposits.lbl_method_field', 'Phương thức')}</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'cash', label: t('cashflow.pm_cash', 'Tiền mặt'), icon: Banknote },
                  { id: 'transfer', label: t('cashflow.pm_transfer', 'Chuyển khoản'), icon: Landmark },
                  { id: 'card', label: t('cashflow.pm_card_swipe', 'Quẹt thẻ'), icon: CreditCard }
                ].map(pm => (
                  <button
                    key={pm.id}
                    onClick={() => setForm({...form, payment_method: pm.id})}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                      form.payment_method === pm.id 
                        ? 'border-pink-500 bg-pink-50 text-pink-700 shadow-sm' 
                        : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <pm.icon className={`w-5 h-5 mb-1.5 ${form.payment_method === pm.id ? 'text-pink-500' : 'text-slate-400'}`} />
                    <span className="text-xs font-medium">{pm.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">{t('deposits.lbl_notes_field', 'Ghi chú')}</label>
              <textarea 
                rows="3"
                value={form.notes || ''}
                onChange={e => setForm({...form, notes: e.target.value})}
                placeholder={t('deposits.ph_notes', 'Ghi chú về khoản đặt cọc...')}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-50 transition-all resize-none"
              ></textarea>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-xl transition-colors"
          >
            {t('deposits.btn_cancel', 'Hủy bỏ')}
          </button>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 text-sm font-bold text-white bg-pink-600 hover:bg-pink-700 rounded-xl flex items-center gap-2 transition-all shadow-sm shadow-pink-500/20 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? t('deposits.btn_saving', 'Đang lưu...') : t('deposits.btn_save', 'Lưu đặt cọc')}</span>
          </button>
        </div>

      </div>
    </div>,
    document.body
  )}
      {newCustomerOpen && (
        <NewCustomerModal
          onClose={() => setNewCustomerOpen(false)}
          onCreate={(c) => {
            setCustomers(prev => [...prev, c]);
            setForm({...form, customer_id: c.id});
            setNewCustomerOpen(false);
          }}
        />
      )}
    </>
  );
}
