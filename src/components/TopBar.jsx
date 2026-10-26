'use client';
import React, { useState } from 'react';
import { Sparkles, MapPin, ChevronDown, Check, CalendarDays, Receipt, CloudUpload } from 'lucide-react';
import { useBranch } from '@/lib/BranchContext';
import { usePlan } from '@/lib/PlanContext';
import Link from 'next/link';
import GlobalSearch from '@/components/GlobalSearch';
import NotificationCenter from '@/components/NotificationCenter';
import ProfileMenu from '@/components/ProfileMenu';
import { useT } from '@/lib/i18n';
import { syncAllDataToSupabase } from '@/lib/syncSupabase';
import { toast } from '@/components/Layout';

export default function TopBar({ onNewAppointment, onNewInvoice }) {
  const { branches, currentBranchId, setBranch, currentBranch } = useBranch();
  const { plan, planId, remainingDays, isExpired } = usePlan();
  const [branchMenu, setBranchMenu] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const { t } = useT();

  const handleSyncSupabase = async () => {
    setSyncing(true);
    try {
      const res = await syncAllDataToSupabase((msg) => {
        if (msg) toast.info(msg);
      });
      if (res.errors && res.errors.length > 0) {
        toast.warning(`Đã đẩy dữ liệu: ${res.services} Dịch vụ, ${res.products} Sản phẩm, ${res.customers} Khách hàng, ${res.staff} Nhân viên! (${res.errors.length} cảnh báo)`);
      } else {
        toast.success(`Thành công! Đã đẩy ${res.services} Dịch vụ, ${res.products} Sản phẩm, ${res.customers} Khách hàng, ${res.staff} Nhân viên lên Supabase Database!`);
      }
    } catch (e) {
      toast.error('Lỗi kết nối Supabase: ' + (e.message || e));
    } finally {
      setSyncing(false);
    }
  };

  return (
    <header className="topbar-header glass-topbar sticky top-0 z-[99] bg-white/75 dark:bg-slate-900/75 backdrop-blur-xl border-b border-white/40 dark:border-slate-800/80 shadow-2xs transition-colors duration-300">
      <div className="h-16 flex items-center gap-1.5 md:gap-3 px-2 md:px-5">
        {/* Left: logo + branch + subscription badge */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center shadow-md">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold tracking-tight hidden lg:block">GloPro</span>
        </div>

        <div className="relative shrink-0 min-w-0">
          <button 
            onClick={() => setBranchMenu((v) => !v)} 
            className="btn-glass flex items-center gap-1 px-1.5 md:gap-1.5 md:px-3 py-2 rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-slate-200/60 dark:border-slate-700/60 hover:bg-white/90 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-2xs transition-all active:scale-98 cursor-pointer"
          >
            <MapPin className="w-4 h-4 text-pink-500 shrink-0" />
            <span className="text-sm font-semibold max-w-[130px] sm:max-w-[180px] truncate">
              {currentBranch?.name || branches[0]?.name || '—'}
            </span>
            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
          </button>
          {branchMenu && (
            <div className="absolute left-0 mt-2 w-60 bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl rounded-2xl border border-white/40 dark:border-slate-800 shadow-xl py-1 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              {branches.length === 0 ? (
                <div className="px-3 py-2 text-xs text-slate-400 italic">Đang tải chi nhánh...</div>
              ) : (
                branches.map((b) => (
                  <button 
                    key={b.id} 
                    onClick={() => { setBranch(b.id); setBranchMenu(false); }} 
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer ${
                      currentBranchId === b.id 
                        ? 'font-bold text-pink-600 dark:text-pink-400 bg-pink-50/50 dark:bg-pink-950/20' 
                        : 'text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <span className="truncate">{b.name}</span>
                    {currentBranchId === b.id && <Check className="w-4 h-4 text-pink-500 shrink-0" />}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Plan Subscription Badge */}
        <Link
          href="/settings?tab=subscription"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-2xs hover:scale-102 active:scale-98 cursor-pointer shrink-0 ${plan.badgeColor}`}
          title="Quản lý gói cước & Đăng ký"
        >
          <span>{plan.badge}</span>
          {planId !== 'free' && !isExpired && (
            <span className="text-[10px] font-semibold opacity-85 hidden sm:inline">
              • {remainingDays} ngày
            </span>
          )}
          {planId !== 'free' && isExpired && (
            <span className="text-[10px] font-semibold text-rose-500 hidden sm:inline">
              • Hết hạn
            </span>
          )}
        </Link>

        {/* Center: global search */}
        <div className="flex-1 hidden md:flex justify-end md:justify-center px-1 md:px-2 min-w-0">
          <GlobalSearch />
        </div>

        {/* Right cluster */}
        <div className="flex items-center gap-1 md:gap-2 shrink-0 ml-auto">

          <button
            onClick={onNewAppointment}
            className="btn-glass hidden md:flex items-center justify-center w-10 h-10 md:w-auto md:h-auto md:px-3 md:py-2 md:gap-1.5 rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-slate-200/60 dark:border-slate-700/60 hover:bg-white/90 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-2xs transition-all active:scale-98 cursor-pointer group"
            title={t('topbar.to_lch_hn', 'Tạo lịch hẹn')}
          >
            <CalendarDays className="w-5 h-5 md:w-4 md:h-4 text-blue-500 transition-transform group-hover:scale-110" />
            <span className="text-xs font-semibold hidden md:inline">{t('topbar.t_lch', 'Đặt lịch')}</span>
          </button>
          
          <button
            onClick={onNewInvoice}
            className="btn-glass hidden md:flex items-center justify-center w-10 h-10 md:w-auto md:h-auto md:px-3 md:py-2 md:gap-1.5 rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-slate-200/60 dark:border-slate-700/60 hover:bg-white/90 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-2xs transition-all active:scale-98 cursor-pointer group"
            title={t('topbar.to_ha_n', 'Tạo hóa đơn')}
          >
            <Receipt className="w-5 h-5 md:w-4 md:h-4 text-emerald-500 transition-transform group-hover:scale-110" />
            <span className="text-xs font-semibold hidden md:inline">{t('topbar.to_n', 'Tạo đơn')}</span>
          </button>

          <NotificationCenter />
          <ProfileMenu />
        </div>
      </div>
    </header>);

}