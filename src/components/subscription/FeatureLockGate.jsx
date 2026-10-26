'use client';

import React from 'react';
import { Lock, Sparkles, ArrowRight, ShieldAlert } from 'lucide-react';
import { usePlan } from '@/lib/PlanContext';
import { PLANS } from '@/lib/planConfig';
import Link from 'next/link';

/**
 * FeatureLockGate component
 * Wraps any section/page that requires a specific plan feature.
 * If accessible, renders children directly.
 * If locked, renders a sleek glassmorphic upsell gate with direct upgrade CTA.
 */
export default function FeatureLockGate({
  feature,
  requiredPlan = 'pro',
  title = 'Tính năng nâng cao',
  description = 'Tính năng này yêu cầu nâng cấp gói dịch vụ để sử dụng.',
  children,
  blur = true
}) {
  const { hasFeature, planId } = usePlan();
  const isAccessible = hasFeature(feature);

  if (isAccessible) {
    return <>{children}</>;
  }

  const reqPlan = PLANS[requiredPlan] || PLANS.pro;

  return (
    <div className="relative min-h-[350px] w-full rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800">
      {/* Blurred background preview */}
      {blur && (
        <div className="filter blur-md pointer-events-none select-none opacity-40 dark:opacity-25 p-4">
          {children}
        </div>
      )}

      {/* Lock Gate Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-white/70 dark:bg-slate-900/70 backdrop-blur-md z-20">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4 shadow-lg shadow-blue-500/10">
          <Lock className="w-8 h-8" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border mb-3 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Yêu cầu {reqPlan.name} ({reqPlan.badge})</span>
        </div>

        <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-2 max-w-md">
          {title}
        </h3>
        
        <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mb-6 leading-relaxed">
          {description}
        </p>

        <Link
          href="/settings?tab=subscription"
          className={`px-6 py-3 rounded-2xl bg-gradient-to-r ${reqPlan.headerGradient} text-white font-bold text-sm shadow-lg hover:shadow-xl hover:scale-102 active:scale-98 transition-all flex items-center gap-2`}
        >
          <span>Mở khóa gói {reqPlan.name}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>

        <p className="text-xs text-slate-500 dark:text-slate-400 mt-4">
          Tự động khấu trừ số ngày chưa dùng • Khởi tạo tức thì
        </p>
      </div>
    </div>
  );
}
