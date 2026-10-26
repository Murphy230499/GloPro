'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, ArrowUpRight, Clock, ShieldCheck, RefreshCw } from 'lucide-react';
import { usePlan } from '@/lib/PlanContext';

export default function SidebarSubscriptionWidget({ isCollapsed }) {
  const { plan, planId, remainingDays, isExpired, expiresAt } = usePlan();

  const formatDate = (isoString) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
    } catch {
      return '';
    }
  };

  if (isCollapsed) {
    return (
      <div className="p-2 border-t border-slate-200/60 dark:border-slate-800/80 flex justify-center">
        <Link
          href="/settings?tab=subscription"
          title={`${plan.name} • ${planId === 'free' ? 'Bấm để nâng cấp' : isExpired ? 'Đã hết hạn' : `Còn ${remainingDays} ngày`}`}
          className={`w-10 h-10 rounded-2xl flex items-center justify-center border transition-all duration-200 hover:scale-105 active:scale-95 shadow-2xs ${plan.badgeColor}`}
        >
          <span className="text-sm font-bold">
            {planId === 'ultra' ? '💎' : planId === 'pro' ? '⭐' : '🌱'}
          </span>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-3 border-t border-slate-200/60 dark:border-slate-800/80">
      <div className="p-3 rounded-2xl bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-800/50 dark:via-slate-800/80 dark:to-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs space-y-2.5 transition-all">
        
        {/* Top: Plan badge & remaining tag */}
        <div className="flex items-center justify-between gap-1">
          <span className={`px-2 py-0.5 rounded-lg text-[11px] font-extrabold border ${plan.badgeColor}`}>
            {plan.badge}
          </span>

          {planId !== 'free' && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
              isExpired
                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                : remainingDays <= 5
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
            }`}>
              {isExpired ? 'Hết hạn' : `Còn ${remainingDays} ngày`}
            </span>
          )}
        </div>

        {/* Middle: Expiry or Plan Status */}
        <div className="text-xs">
          {planId === 'free' ? (
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Gói Khởi Đầu cơ bản (1 cơ sở, 5 NV)
            </p>
          ) : (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span>Hết hạn:</span>
                <strong className="text-slate-700 dark:text-slate-200 font-mono">
                  {formatDate(expiresAt)}
                </strong>
              </div>
              
              {/* Progress bar */}
              <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    isExpired 
                      ? 'bg-rose-500 w-full' 
                      : remainingDays <= 5 
                      ? 'bg-amber-500' 
                      : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                  }`}
                  style={{ width: isExpired ? '100%' : `${Math.min(100, Math.max(5, (remainingDays / 30) * 100))}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Bottom CTA */}
        <Link
          href="/settings?tab=subscription"
          className="w-full py-1.5 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-2xs active:scale-98"
        >
          {planId === 'free' ? (
            <>
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Nâng cấp gói</span>
            </>
          ) : planId === 'pro' ? (
            <>
              <ArrowUpRight className="w-3 h-3 text-indigo-400" />
              <span>Nâng lên Ultra AI</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              <span>Quản lý gói</span>
            </>
          )}
        </Link>
      </div>
    </div>
  );
}
