'use client';
import React, { useState } from 'react';
import { Sparkles, MapPin, ChevronDown, Check, CalendarDays, Receipt, CloudUpload } from 'lucide-react';
import { useBranch } from '@/lib/BranchContext';
import GlobalSearch from '@/components/GlobalSearch';
import NotificationCenter from '@/components/NotificationCenter';
import ProfileMenu from '@/components/ProfileMenu';
import { useT } from '@/lib/i18n';
import { syncAllDataToSupabase } from '@/lib/syncSupabase';
import { toast } from '@/components/Layout';

export default function TopBar({ onNewAppointment, onNewInvoice }) {
  const { branches, currentBranchId, setBranch, currentBranch } = useBranch();
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
    <header className="sticky top-0 z-[99] bg-white/80 backdrop-blur-lg border-b border-slate-100">
      <div className="h-16 flex items-center gap-1.5 md:gap-3 px-2 md:px-5">
        {/* Left: logo + branch */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center shadow-md">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold tracking-tight hidden lg:block">GlowPro</span>
        </div>

        <div className="relative shrink-0 min-w-0">
          <button onClick={() => setBranchMenu((v) => !v)} className="flex items-center gap-1 px-1.5 md:gap-1.5 md:px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700">
            <MapPin className="w-4 h-4 text-pink-500 shrink-0" />
            <span className="text-sm font-semibold max-w-[130px] sm:max-w-[180px] truncate">
              {currentBranchId === 'all' ? t('top.all_branches') : currentBranch?.name || '—'}
            </span>
            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
          </button>
          {branchMenu &&
          <div className="absolute left-0 mt-2 w-60 bg-white rounded-2xl border border-slate-100 shadow-xl py-1 z-50">
              {branches.map((b) =>
            <button key={b.id} onClick={() => {setBranch(b.id);setBranchMenu(false);}} className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-slate-50">
                  <span className="truncate">{b.name}</span>
                  {currentBranchId === b.id && <Check className="w-4 h-4 text-pink-500 shrink-0" />}
                </button>
            )}
            </div>
          }
        </div>

        {/* Center: global search */}
        <div className="flex-1 hidden md:flex justify-end md:justify-center px-1 md:px-2 min-w-0">
          <GlobalSearch />
        </div>

        {/* Right cluster */}
        <div className="flex items-center gap-1 md:gap-2 shrink-0 ml-auto">

          <button
            onClick={onNewAppointment}
            className="hidden md:flex items-center justify-center w-10 h-10 md:w-auto md:h-auto md:px-3 md:py-2 md:gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            title={t('topbar.to_lch_hn', 'Tạo lịch hẹn')}
          >
            <CalendarDays className="w-5 h-5 md:w-4 md:h-4 text-blue-500" />
            <span className="text-xs font-semibold hidden md:inline">{t('topbar.t_lch', 'Đặt lịch')}</span>
          </button>
          
          <button
            onClick={onNewInvoice}
            className="hidden md:flex items-center justify-center w-10 h-10 md:w-auto md:h-auto md:px-3 md:py-2 md:gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            title={t('topbar.to_ha_n', 'Tạo hóa đơn')}
          >
            <Receipt className="w-5 h-5 md:w-4 md:h-4 text-emerald-500" />
            <span className="text-xs font-semibold hidden md:inline">{t('topbar.to_n', 'Tạo đơn')}</span>
          </button>

          <NotificationCenter />
          <ProfileMenu />
        </div>
      </div>
    </header>);

}