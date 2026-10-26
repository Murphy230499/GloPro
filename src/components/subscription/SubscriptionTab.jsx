'use client';

import React, { useState } from 'react';
import { 
  Sparkles, Check, X, Shield, ArrowUpRight, Calendar, Clock, 
  AlertTriangle, RefreshCw, Zap, CheckCircle2, ChevronRight, Layers, ArrowDown
} from 'lucide-react';
import { PLANS } from '@/lib/planConfig';
import { usePlan } from '@/lib/PlanContext';
import PaymentModal from './PaymentModal';
import { toast } from '@/components/Layout';

export default function SubscriptionTab() {
  const { 
    subscription, 
    plan: currentPlan, 
    planId: currentPlanId, 
    startedAt, 
    expiresAt, 
    remainingDays, 
    isExpired, 
    status,
    downgradeToFree 
  } = usePlan();

  const [billingCycle, setBillingCycle] = useState('monthly');
  const [paymentModalState, setPaymentModalState] = useState({
    isOpen: false,
    targetPlanId: 'pro'
  });
  const [downgradeModalOpen, setDowngradeModalOpen] = useState(false);

  const formatDate = (isoString) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
    } catch {
      return isoString;
    }
  };

  const handleOpenPayment = (targetPlanId) => {
    setPaymentModalState({
      isOpen: true,
      targetPlanId
    });
  };

  const handleConfirmDowngrade = () => {
    downgradeToFree();
    setDowngradeModalOpen(false);
    toast.success('Đã hạ về gói Khởi Đầu (Free). Toàn bộ dữ liệu của bạn vẫn được lưu giữ an toàn.');
  };

  const isYearly = billingCycle === 'yearly';

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* 1. CURRENT SUBSCRIPTION HERO CARD */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 md:p-8">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-blue-500/10 via-indigo-500/5 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Gói dịch vụ hiện tại:
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${currentPlan.badgeColor}`}>
                {currentPlan.badge}
              </span>
              {currentPlanId !== 'free' && (
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                  isExpired 
                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300' 
                    : remainingDays <= 5 
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                }`}>
                  {isExpired ? 'Đã hết hạn' : remainingDays <= 5 ? 'Sắp hết hạn' : 'Đang hoạt động'}
                </span>
              )}
            </div>

            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {currentPlan.name}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 max-w-xl">
              {currentPlan.tagline}
            </p>
          </div>

          {/* Subscription Action buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {currentPlanId === 'free' ? (
              <button
                onClick={() => handleOpenPayment('pro')}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2"
              >
                <span>Nâng cấp gói ngay</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => handleOpenPayment(currentPlanId)}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-sm shadow-sm transition-all flex items-center gap-1.5"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Gia hạn gói</span>
                </button>

                {currentPlanId === 'pro' && (
                  <button
                    onClick={() => handleOpenPayment('ultra')}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md transition-all flex items-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Nâng lên Ultra AI</span>
                  </button>
                )}

                <button
                  onClick={() => setDowngradeModalOpen(true)}
                  className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-xs transition-colors flex items-center gap-1"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                  <span>Hạ gói</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* METRICS STRIP FOR PAID PLANS */}
        {currentPlanId !== 'free' && (
          <div className="mt-6 pt-6 border-t border-slate-200/80 dark:border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
              <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5 mb-1">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                <span>Ngày kích hoạt</span>
              </div>
              <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
                {formatDate(startedAt)}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
              <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5 mb-1">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>Ngày hết hạn</span>
              </div>
              <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
                {formatDate(expiresAt)}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
              <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5 mb-1">
                <Zap className="w-3.5 h-3.5 text-emerald-500" />
                <span>Thời gian còn lại</span>
              </div>
              <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
                {isExpired ? '0 ngày' : `${remainingDays} ngày`}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
              <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5 mb-1">
                <Shield className="w-3.5 h-3.5 text-indigo-500" />
                <span>Cơ chế bảo vệ</span>
              </div>
              <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                Bảo lưu 100% dữ liệu
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. PRICING COMPARISON TABLE */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Bảng giá và Quyền lợi các gói
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Chuyển đổi gói linh hoạt bất kỳ lúc nào. Khấu trừ tự động theo số ngày chưa dùng.
            </p>
          </div>

          {/* Cycle toggle */}
          <div className="inline-flex p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 self-start sm:self-auto">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Hàng tháng
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                billingCycle === 'yearly'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <span>Hàng năm</span>
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold">
                Giảm 20%
              </span>
            </button>
          </div>
        </div>

        {/* 3 Columns Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.values(PLANS).map((p) => {
            const isCurrent = currentPlanId === p.id;
            const price = isYearly ? p.priceYearly : p.price;
            const isHigher = (currentPlanId === 'free' && p.id !== 'free') || (currentPlanId === 'pro' && p.id === 'ultra');
            const isLower = (currentPlanId === 'ultra' && p.id !== 'ultra') || (currentPlanId === 'pro' && p.id === 'free');

            return (
              <div 
                key={p.id}
                className={`relative flex flex-col rounded-3xl border transition-all duration-200 ${
                  p.isPopular 
                    ? 'border-indigo-500/80 shadow-lg shadow-indigo-500/10 dark:shadow-indigo-500/5 bg-gradient-to-b from-white via-indigo-50/20 to-white dark:from-slate-900 dark:via-indigo-950/20 dark:to-slate-900'
                    : isCurrent
                    ? 'border-blue-500 bg-white dark:bg-slate-900 shadow-md'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                } p-6`}
              >
                {p.isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[11px] font-bold shadow-sm uppercase tracking-wide">
                    Được khuyên dùng nhiều nhất
                  </div>
                )}

                <div className="space-y-3 pb-6 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${p.badgeColor}`}>
                      {p.badge}
                    </span>
                    {isCurrent && (
                      <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-full">
                        Đang dùng
                      </span>
                    )}
                  </div>

                  <h4 className="text-xl font-bold text-slate-900 dark:text-white">
                    {p.name}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 min-h-[32px]">
                    {p.tagline}
                  </p>

                  <div className="pt-2">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                        {price.toLocaleString('vi-VN')}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        {p.price === 0 ? '' : isYearly ? 'đ / năm' : 'đ / tháng'}
                      </span>
                    </div>
                    {isYearly && p.price > 0 && (
                      <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                        Chỉ ~{Math.round(p.priceYearly / 12).toLocaleString('vi-VN')} đ/tháng (Tiết kiệm 20%)
                      </div>
                    )}
                  </div>
                </div>

                {/* Features list */}
                <div className="py-6 space-y-3 flex-1">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Quyền lợi chi tiết:
                  </div>
                  <ul className="space-y-2.5 text-xs">
                    {p.featureLabels.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        {feat.available ? (
                          <div className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-4 h-4 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center shrink-0 mt-0.5">
                            <X className="w-2.5 h-2.5" />
                          </div>
                        )}
                        <span className={feat.available ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500 line-through'}>
                          {feat.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action button */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  {isCurrent ? (
                    <button
                      onClick={() => handleOpenPayment(p.id)}
                      className="w-full py-2.5 rounded-xl border border-blue-500 text-blue-600 dark:text-blue-400 font-bold text-xs hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Gia hạn gói này</span>
                    </button>
                  ) : isHigher ? (
                    <button
                      onClick={() => handleOpenPayment(p.id)}
                      className={`w-full py-2.5 rounded-xl text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 ${
                        p.isPopular
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                          : 'bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900'
                      }`}
                    >
                      <span>Nâng cấp ngay</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => setDowngradeModalOpen(true)}
                      className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold text-xs transition-colors"
                    >
                      Hạ về gói này
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. MODAL CONFIRM DOWNGRADE */}
      {downgradeModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h4 className="text-xl font-bold text-slate-900 dark:text-white">
              Xác nhận hạ về Gói Khởi Đầu (Free)?
            </h4>
            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2">
              <p>
                <strong>Yên tâm:</strong> Toàn bộ dữ liệu của bạn (lịch hẹn, khách hàng, doanh thu, hóa đơn) sẽ được <strong>bảo lưu 100% nguyên vẹn</strong> và không bao giờ bị xóa.
              </p>
              <p>
                Sau khi hạ gói, các tính năng nâng cao (Sơ đồ Phòng/Giường 3D, Bảng lương, Quản lý kho, GloPro AI) sẽ tạm khóa cho đến khi bạn gia hạn hoặc nâng cấp lại.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                onClick={() => setDowngradeModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmDowngrade}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm"
              >
                Xác nhận hạ gói
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. PAYMENT & CHECKOUT MODAL */}
      <PaymentModal
        isOpen={paymentModalState.isOpen}
        targetPlanId={paymentModalState.targetPlanId}
        initialCycle={billingCycle}
        onClose={() => setPaymentModalState(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
