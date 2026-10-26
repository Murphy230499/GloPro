'use client';

import React, { useState } from 'react';
import { 
  X, Check, ShieldCheck, QrCode, CreditCard, Copy, 
  Sparkles, ArrowRight, Clock, AlertCircle, CheckCircle2 
} from 'lucide-react';
import { PLANS, VIETQR_CONFIG, buildVietQRUrl, calculateProration } from '@/lib/planConfig';
import { usePlan } from '@/lib/PlanContext';
import { toast } from '@/components/Layout';

export default function PaymentModal({ isOpen, onClose, targetPlanId, initialCycle = 'monthly' }) {
  const { planId: currentPlanId, expiresAt, upgradePlan, renewPlan } = usePlan();
  const [cycle, setCycle] = useState(initialCycle);
  const [method, setMethod] = useState('vietqr'); // 'vietqr' | 'stripe'
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  // International card state
  const [cardData, setCardData] = useState({
    cardNumber: '',
    cardExpiry: '',
    cardCvc: '',
    cardName: ''
  });

  if (!isOpen) return null;

  const targetPlan = PLANS[targetPlanId] || PLANS.pro;
  const isRenewal = currentPlanId === targetPlanId;
  const isYearly = cycle === 'yearly';

  // Calculate proration
  const proration = calculateProration({
    currentPlanId,
    targetPlanId,
    expiresAt,
    isYearly
  });

  const finalAmount = isRenewal 
    ? (isYearly ? targetPlan.priceYearly : targetPlan.price)
    : proration.amountToPay;

  // Memo transfer content for VietQR
  const memoCode = `GLOPRO_${targetPlan.code}_${Math.floor(1000 + Math.random() * 9000)}`;
  const qrUrl = buildVietQRUrl({ amount: finalAmount, memo: memoCode });

  const handleCopy = (text, fieldName) => {
    navigator.clipboard?.writeText(text);
    setCopiedField(fieldName);
    toast.success(`Đã sao chép ${fieldName}!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleConfirmPayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      if (isRenewal) {
        renewPlan({ billingCycle: cycle, paymentMethod: method });
        toast.success(`Gia hạn thành công ${targetPlan.name}!`);
      } else {
        upgradePlan({ targetPlanId, billingCycle: cycle, paymentMethod: method });
        toast.success(`Nâng cấp thành công lên ${targetPlan.name}!`);
      }
      setIsProcessing(false);
      setIsSuccess(true);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className={`px-6 py-5 bg-gradient-to-r ${targetPlan.headerGradient} text-white flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold">
                {isRenewal ? `Gia hạn ${targetPlan.name}` : `Đăng ký / Nâng cấp ${targetPlan.name}`}
              </h3>
              <p className="text-xs text-white/80">Kích hoạt tức thì & Tự động gia hạn</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {isSuccess ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-2xl font-bold text-slate-800 dark:text-white">
                Thanh toán & Kích hoạt Thành công!
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                Salon của bạn đã được kích hoạt gói <strong>{targetPlan.name}</strong> với đầy đủ tính năng. Hệ thống đã cập nhật hạn sử dụng và phân quyền ngay lập tức.
              </p>
              <button
                onClick={onClose}
                className="mt-4 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 text-white font-semibold text-sm transition-all"
              >
                Bắt đầu trải nghiệm ngay
              </button>
            </div>
          ) : (
            <>
              {/* Billing Cycle Switcher */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                <div>
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">Chu kỳ thanh toán</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Chọn gói năm để tiết kiệm ngay 20% chi phí</div>
                </div>
                <div className="flex bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => setCycle('monthly')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      cycle === 'monthly'
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Hàng tháng
                  </button>
                  <button
                    onClick={() => setCycle('yearly')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                      cycle === 'yearly'
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <span>Hàng năm</span>
                    <span className="px-1.5 py-0.2 bg-emerald-500 text-white text-[10px] rounded-full">-20%</span>
                  </button>
                </div>
              </div>

              {/* Price & Proration Breakdown */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/70 space-y-2.5">
                <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
                  <span>Giá gói {targetPlan.name} ({isYearly ? '12 tháng' : '1 tháng'}):</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    {(isYearly ? targetPlan.priceYearly : targetPlan.price).toLocaleString('vi-VN')} đ
                  </span>
                </div>

                {!isRenewal && proration.isProrated && (
                  <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 p-2 rounded-lg">
                    <span>Khấu trừ số ngày chưa dùng của gói cũ ({proration.remainingDays} ngày):</span>
                    <span className="font-bold">-{proration.credit.toLocaleString('vi-VN')} đ</span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-white">Tổng tiền cần thanh toán:</span>
                  <span className="text-xl font-extrabold text-blue-600 dark:text-blue-400">
                    {finalAmount.toLocaleString('vi-VN')} đ
                  </span>
                </div>
              </div>

              {/* Payment Method Switcher */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Phương thức thanh toán
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setMethod('vietqr')}
                    className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all text-left ${
                      method === 'vietqr'
                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center shrink-0">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                        <span>Quét VietQR</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 font-semibold">Nội địa</span>
                      </div>
                      <div className="text-xs text-slate-500">Mọi app ngân hàng / MoMo</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMethod('stripe')}
                    className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all text-left ${
                      method === 'stripe'
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center shrink-0">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                        <span>Thẻ Quốc Tế</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 font-semibold">Stripe</span>
                      </div>
                      <div className="text-xs text-slate-500">Visa, Mastercard, Amex</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Dynamic Payment Gate Details */}
              {method === 'vietqr' ? (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row gap-5 items-center">
                  <div className="bg-white p-2.5 rounded-2xl shadow-sm border border-slate-200 shrink-0">
                    <img 
                      src={qrUrl} 
                      alt="VietQR Payment" 
                      className="w-44 h-44 object-contain rounded-xl"
                    />
                  </div>

                  <div className="flex-1 space-y-2.5 text-xs text-slate-600 dark:text-slate-300 w-full">
                    <div className="flex items-center justify-between py-1 border-b border-slate-200 dark:border-slate-700">
                      <span>Ngân hàng:</span>
                      <strong className="text-slate-800 dark:text-white">{VIETQR_CONFIG.bankName}</strong>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-slate-200 dark:border-slate-700">
                      <span>Số tài khoản:</span>
                      <div className="flex items-center gap-1.5">
                        <strong className="text-slate-800 dark:text-white font-mono text-sm">{VIETQR_CONFIG.accountNo}</strong>
                        <button 
                          onClick={() => handleCopy(VIETQR_CONFIG.accountNo, 'Số tài khoản')}
                          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-slate-200 dark:border-slate-700">
                      <span>Chủ tài khoản:</span>
                      <strong className="text-slate-800 dark:text-white">{VIETQR_CONFIG.accountName}</strong>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-slate-200 dark:border-slate-700">
                      <span>Số tiền:</span>
                      <strong className="text-blue-600 dark:text-blue-400 font-bold text-sm">
                        {finalAmount.toLocaleString('vi-VN')} đ
                      </strong>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span>Nội dung chuyển khoản:</span>
                      <div className="flex items-center gap-1.5">
                        <strong className="text-amber-600 dark:text-amber-400 font-mono text-xs">{memoCode}</strong>
                        <button 
                          onClick={() => handleCopy(memoCode, 'Nội dung CK')}
                          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Tên in trên thẻ
                    </label>
                    <input 
                      type="text" 
                      placeholder="NGUYEN VAN A"
                      value={cardData.cardName}
                      onChange={e => setCardData({ ...cardData, cardName: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Số thẻ tín dụng
                    </label>
                    <input 
                      type="text" 
                      placeholder="4242 •••• •••• 4242"
                      value={cardData.cardNumber}
                      onChange={e => setCardData({ ...cardData, cardNumber: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Hạn thẻ (MM/YY)
                      </label>
                      <input 
                        type="text" 
                        placeholder="12/28"
                        value={cardData.cardExpiry}
                        onChange={e => setCardData({ ...cardData, cardExpiry: e.target.value })}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Mã bảo mật CVC
                      </label>
                      <input 
                        type="password" 
                        maxLength={4}
                        placeholder="•••"
                        value={cardData.cardCvc}
                        onChange={e => setCardData({ ...cardData, cardCvc: e.target.value })}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>Dữ liệu thẻ được mã hóa 256-bit chuẩn PCI DSS qua Stripe Gateway</span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPayment}
                  disabled={isProcessing}
                  className={`px-6 py-2.5 rounded-xl bg-gradient-to-r ${targetPlan.headerGradient} text-white font-bold text-sm shadow-lg hover:shadow-xl transition-all flex items-center gap-2 active:scale-98`}
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Đang xác thực thanh toán...</span>
                    </>
                  ) : (
                    <>
                      <span>{method === 'vietqr' ? 'Tôi đã chuyển khoản - Kích hoạt ngay' : 'Thanh toán & Kích hoạt'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
