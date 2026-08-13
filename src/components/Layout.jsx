'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, CalendarDays, ShoppingCart, Users, UserSquare,
  Scissors, BarChart3, Settings as SettingsIcon, Grid, X, Megaphone, Boxes, Zap, ChevronLeft, ChevronRight, Wallet, CalendarCheck, PiggyBank } from
'lucide-react';
import { Toaster as SonnerToaster, toast } from 'sonner';
import { useT } from '@/lib/i18n';
import { useBranch } from '@/lib/BranchContext';
import TopBar from '@/components/TopBar';
import AppointmentModal from '@/components/AppointmentModal';
import POSInvoiceModal from '@/components/POSInvoiceModal';
import { base44, getCachedPermissions } from '@/api/base44Client';
import { supabase } from '@/api/supabaseClient';

export { toast };

const NAV = [
  { to: '/', tkey: 'nav.dashboard', icon: LayoutDashboard, color: '#FF6B9D', end: true },
  { to: '/appointments', tkey: 'nav.appointments', icon: CalendarDays, color: '#60A5FA' },
  { to: '/pos', tkey: 'nav.pos', icon: ShoppingCart, color: '#34D399' },
  { to: '/customers', tkey: 'nav.customers', icon: Users, color: '#FBBF24' },
  { to: '/staff', tkey: 'nav.staff', icon: UserSquare, color: '#F97316' },
  { to: '/services', tkey: 'nav.catalog', icon: Scissors, color: '#A78BFA' },
  { to: '/inventory', tkey: 'nav.inventory', icon: Boxes, color: '#8B5CF6' },
  { to: '/discounts', tkey: 'nav.discounts', icon: Megaphone, color: '#FF4B82' },
  { to: '/automations', tkey: 'nav.automations', icon: Zap, color: '#2563EB' },
  { to: '/cash-flow', tkey: 'nav.cash_flow', icon: Wallet, color: '#10B981' },
  { to: '/reports', tkey: 'nav.reports', icon: BarChart3, color: '#C084FC' },
  { to: '/booking', tkey: 'nav.booking', icon: CalendarCheck, color: '#EC4899' },
  { to: '/deposits', tkey: 'nav.deposits', icon: PiggyBank, color: '#F43F5E' },
  { to: '/settings', tkey: 'nav.settings', icon: SettingsIcon, color: '#94A3B8' }
];

const MOBILE_TABS = NAV.slice(0, 4);

export default function Layout({ children }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const [apptOpen, setApptOpen] = useState(false);
  const [apptEditing, setApptEditing] = useState(null);
  const [color, setColor] = useState('#EC4899');
  const [invOpen, setInvOpen] = useState(false);
  const pathname = usePathname();
  const { t } = useT();
  const { currentBranchId } = useBranch();

  // Xác định xem trang hiện tại có phải là Báo cáo hay không
  const isReportsPage = pathname.startsWith('/reports');
  
  // Tự động thu gọn main menu nếu ở trang Báo cáo
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [allowedModules, setAllowedModules] = useState(null); // null means full access / loading

  useEffect(() => {
    async function checkPermissions() {
      try {
        const cached = await getCachedPermissions();
        setAllowedModules(cached);
      } catch (err) {
        console.error('Error checking permissions:', err);
        setAllowedModules('all');
      }
    }
    checkPermissions();
  }, []);

  useEffect(() => {
    // 1. Initial color check
    const currentTheme = localStorage.getItem('gp_theme') || '#EC4899';
    document.documentElement.style.setProperty('--theme-color', currentTheme);
    setColor(currentTheme);

    // 2. Setup theme event listener
    const handleThemeChange = (e) => {
      document.documentElement.style.setProperty('--theme-color', e.detail);
      setColor(e.detail);
    };
    window.addEventListener('theme-change', handleThemeChange);

    // 3. Setup appointment modal event listener
    const handleOpenAppt = (e) => {
      setApptEditing(e.detail || null);
      setApptOpen(true);
    };
    window.addEventListener('open-appointment-modal', handleOpenAppt);

    if (isReportsPage) {
      setIsSidebarCollapsed(true);
    } else {
      setIsSidebarCollapsed(false);
    }

    return () => {
      window.removeEventListener('theme-change', handleThemeChange);
      window.removeEventListener('open-appointment-modal', handleOpenAppt);
    };
  }, [isReportsPage]);

  const NavItem = ({ item }) => {
    const Icon = item.icon;
    const isActive = item.end ? pathname === item.to : pathname.startsWith(item.to);
    return (
      <Link
        href={item.to}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
          isActive ? 'text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
        } ${isSidebarCollapsed ? 'justify-center px-2' : ''}`}
        style={isActive ? { background: item.color } : undefined}
        title={t(item.tkey)}
      >
        <Icon className="w-5 h-5 shrink-0" />
        <span className={`transition-all duration-200 overflow-hidden whitespace-nowrap ${isSidebarCollapsed ? 'w-0 opacity-0 pointer-events-none' : 'w-auto opacity-100'}`}>
          {t(item.tkey)}
        </span>
      </Link>
    );
  };

  return (
    <div className="h-[100dvh] flex flex-col bg-slate-50 font-body overflow-hidden">
      <TopBar onNewAppointment={() => setApptOpen(true)} onNewInvoice={() => setInvOpen(true)} />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Desktop sidebar */}
        <aside 
          className={`hidden md:flex shrink-0 flex-col bg-white border-r border-slate-100 z-30 transition-all duration-300 relative
            ${isSidebarCollapsed ? 'w-16' : 'w-64'}`}
        >
          {/* Toggle Sidebar Button */}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="absolute top-4 right-[-10px] bg-white border border-slate-200 rounded-full w-5 h-5 flex items-center justify-center shadow-xs cursor-pointer hover:border-blue-500 hover:text-blue-500 z-40"
          >
            {isSidebarCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
          </button>

          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {NAV.filter(item => {
              if (!allowedModules || allowedModules === 'all') return true;
              
              if (item.to === '/dashboard') {
                return isAllowed('dashboard_view');
              }
              if (item.to === '/appointments') {
                return isAllowed('appointment_view');
              }
              if (item.to === '/pos') {
                return isAllowed('pos_view');
              }
              if (item.to === '/invoices') {
                return isAllowed('invoice_view');
              }
              if (item.to === '/customers') {
                return isAllowed('customer_view');
              }
              if (item.to === '/customer-reviews') {
                return isAllowed('customer_reviews_view');
              }
              if (item.to === '/services') {
                return isAllowed('catalog_view');
              }
              if (item.to === '/inventory') {
                return isAllowed('inventory_view');
              }
              if (item.to === '/discounts') {
                return isAllowed('discount_view');
              }
              if (item.to === '/automations') {
                return isAllowed('automation_view');
              }
              if (item.to === '/deposits') {
                return isAllowed('deposit_view');
              }
              if (item.to === '/cashflow') {
                return isAllowed('cashflow_view');
              }
              if (item.to === '/staff') {
                return isAllowed('staff_view') || isAllowed('staff_schedule_view') || isAllowed('staff_attendance_view') || isAllowed('staff_payroll_view');
              }
              if (item.to === '/reports') {
                return isAllowed('report_view') || isAllowed('report_overview_view') || isAllowed('report_revenue_view') || isAllowed('report_finance_view') || isAllowed('report_ai_generate');
              }
              if (item.to === '/settings') {
                return isAllowed('setting_branch_view') || isAllowed('setting_account_view') || isAllowed('setting_permission_edit');
              }
              
              return true;
            }).map((item) =>
              <NavItem key={item.to} item={item} />
            )}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0 overflow-y-auto pb-24 md:pb-0 flex flex-col" id="main-content">
          <div className="max-w-[1600px] w-full mx-auto px-3 py-4 md:px-8 md:py-6 flex-1 flex flex-col min-h-0 bg-[hsl(var(--background))]">
            {children}
          </div>
        </main>
      </div>

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
        editing={apptEditing}
        onClose={() => {
          setApptOpen(false);
          setTimeout(() => setApptEditing(null), 300);
        }}
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
    </div>
  );
}
