'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, CalendarDays, ShoppingCart, Users, UserSquare,
  Scissors, BarChart3, Settings as SettingsIcon, Grid, X, Megaphone } from
'lucide-react';
import { Toaster as SonnerToaster, toast } from 'sonner';
import { useT } from '@/lib/i18n';
import { useBranch } from '@/lib/BranchContext';
import TopBar from '@/components/TopBar';
import AppointmentModal from '@/components/AppointmentModal';
import POSInvoiceModal from '@/components/POSInvoiceModal';

export { toast };

const NAV = [
{ to: '/', tkey: 'nav.dashboard', icon: LayoutDashboard, color: '#FF6B9D', end: true },
{ to: '/appointments', tkey: 'nav.appointments', icon: CalendarDays, color: '#60A5FA' },
{ to: '/pos', tkey: 'nav.pos', icon: ShoppingCart, color: '#34D399' },
{ to: '/customers', tkey: 'nav.customers', icon: Users, color: '#FBBF24' },
{ to: '/staff', tkey: 'nav.staff', icon: UserSquare, color: '#F97316' },
{ to: '/services', tkey: 'nav.catalog', icon: Scissors, color: '#A78BFA' },
{ to: '/discounts', tkey: 'nav.discounts', icon: Megaphone, color: '#FF4B82' },
{ to: '/reports', tkey: 'nav.reports', icon: BarChart3, color: '#C084FC' },
{ to: '/settings', tkey: 'nav.settings', icon: SettingsIcon, color: '#94A3B8' }];


const MOBILE_TABS = NAV.slice(0, 4);

export default function Layout({ children }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const [apptOpen, setApptOpen] = useState(false);
  const [invOpen, setInvOpen] = useState(false);
  const pathname = usePathname();
  const { t } = useT();
  const { currentBranchId } = useBranch();

  const NavItem = ({ item, onClick }) => {
    const Icon = item.icon;
    const isActive = item.end ? pathname === item.to : pathname.startsWith(item.to);
    return (
      <Link
        href={item.to}
        onClick={onClick}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
          isActive ? 'text-white shadow-sm' : 'text-slate-655 hover:bg-slate-100'
        }`}
        style={isActive ? { background: item.color } : undefined}
      >
        <Icon className="w-5 h-5 shrink-0" />
        <span>{t(item.tkey)}</span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-body">
      <TopBar onNewAppointment={() => setApptOpen(true)} onNewInvoice={() => setInvOpen(true)} />

      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed top-16 left-0 bottom-0 w-64 flex-col bg-white border-r border-slate-100 z-30">
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV.map((item) =>
          <NavItem key={item.to} item={item} />
          )}
        </nav>
      </aside>

      {/* Content */}
      <main className="md:ml-64 pb-20 md:pb-8 min-h-screen">
        <div className="max-w-[1600px] md:px-8 md:py-8 bg-[hsl(var(--background))]">
          {children}
        </div>
      </main>

      {/* Mobile bottom tabs */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/90 backdrop-blur-lg border-t border-slate-100">
        <div className="grid grid-cols-5">
          {MOBILE_TABS.map((item) => {
            const Icon = item.icon;
            const active = item.end ? pathname === item.to : pathname.startsWith(item.to);
            return (
              <Link key={item.to} href={item.to} className="flex flex-col items-center justify-center py-2 gap-0.5">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
                  style={active ? { background: item.color } : undefined}>
                  <Icon className="w-5 h-5" style={{ color: active ? 'white' : '#94A3B8' }} />
                </div>
                <span className="text-[10px] font-medium" style={{ color: active ? item.color : '#94A3B8' }}>
                  {t(item.tkey)}
                </span>
              </Link>
            );
          })}
          <button onClick={() => setMoreOpen(true)} className="flex flex-col items-center justify-center py-2 gap-0.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-100">
              <Grid className="w-5 h-5 text-slate-500" />
            </div>
            <span className="text-[10px] font-medium text-slate-500">{t('nav.more')}</span>
          </button>
        </div>
      </nav>

      {/* More sheet */}
      {moreOpen &&
      <div className="md:hidden fixed inset-0 z-50 flex items-end" onClick={() => setMoreOpen(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <div
          className="relative w-full bg-white rounded-t-3xl p-5 pb-8 animate-in slide-in-from-bottom"
          onClick={(e) => e.stopPropagation()}>
          
            <div className="w-10 h-1.5 bg-slate-200 rounded-full mx-auto mb-4" />
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-lg">{t('nav.all_features')}</span>
              <button onClick={() => setMoreOpen(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {NAV.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  href={item.to}
                  onClick={() => setMoreOpen(false)}
                  className="flex flex-col items-center gap-1.5">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: item.color + '1a' }}>
                      <Icon className="w-6 h-6" style={{ color: item.color }} />
                    </div>
                    <span className="text-xs font-medium text-slate-600">{t(item.tkey)}</span>
                </Link>
              );
            })}
            </div>
          </div>
        </div>
      }

      <SonnerToaster position="top-center" richColors closeButton />

      <AppointmentModal
        open={apptOpen}
        onClose={() => setApptOpen(false)}
        onSaved={() => {
          window.dispatchEvent(new Event('reload-data'));
        }}
        branchId={currentBranchId}
      />

      <POSInvoiceModal
        open={invOpen}
        customer={null}
        onClose={() => {
          setInvOpen(false);
          window.dispatchEvent(new Event('reload-data'));
        }}
        onSaved={() => {
          window.dispatchEvent(new Event('reload-data'));
        }}
      />
    </div>);

}