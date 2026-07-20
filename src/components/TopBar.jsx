'use client';
import React, { useState } from 'react';
import { Sparkles, MapPin, ChevronDown, Check, CalendarDays, Receipt } from 'lucide-react';
import { useBranch } from '@/lib/BranchContext';
import GlobalSearch from '@/components/GlobalSearch';
import NotificationCenter from '@/components/NotificationCenter';
import ProfileMenu from '@/components/ProfileMenu';
import { useT } from '@/lib/i18n';

export default function TopBar({ onNewAppointment, onNewInvoice }) {
  const { branches, currentBranchId, setBranch, currentBranch } = useBranch();
  const [branchMenu, setBranchMenu] = useState(false);
  const { t } = useT();

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-slate-100">
      <div className="h-16 flex items-center gap-3 px-3 sm:px-5">
        {/* Left: logo + branch */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center shadow-md">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold tracking-tight hidden lg:block">GlowPro</span>
        </div>

        <div className="relative shrink-0">
          <button onClick={() => setBranchMenu((v) => !v)} className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700">
            <MapPin className="w-4 h-4 text-pink-500" />
            <span className="text-sm font-semibold max-w-[120px] truncate">
              {currentBranchId === 'all' ? t('top.all_branches') : currentBranch?.name || '—'}
            </span>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>
          {branchMenu &&
          <div className="absolute left-0 mt-2 w-60 bg-white rounded-2xl border border-slate-100 shadow-xl py-1 z-50">
              <button onClick={() => {setBranch('all');setBranchMenu(false);}} className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-slate-50">
                <span>{t('top.all_branches')}</span>
                {currentBranchId === 'all' && <Check className="w-4 h-4 text-pink-500" />}
              </button>
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
        <div className="flex-1 flex justify-center px-2">
          <GlobalSearch />
        </div>

        {/* Right cluster */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onNewAppointment}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            title="Tạo lịch hẹn"
          >
            <CalendarDays className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-semibold hidden md:inline">Đặt lịch</span>
          </button>
          
          <button
            onClick={onNewInvoice}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            title="Tạo hóa đơn"
          >
            <Receipt className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-semibold hidden md:inline">Tạo đơn</span>
          </button>

          <NotificationCenter />
          <ProfileMenu />
        </div>
      </div>
    </header>);

}