import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, CalendarDays, ShoppingCart, Users, UserSquare,
  Scissors, BarChart3, Settings as SettingsIcon, Grid, X } from
'lucide-react';
import { Toaster as SonnerToaster, toast } from 'sonner';
import TopBar from '@/components/TopBar';

export { toast };

const NAV = [
{ to: '/', label: 'Tổng quan', icon: LayoutDashboard, color: '#FF6B9D', end: true },
{ to: '/appointments', label: 'Lịch hẹn', icon: CalendarDays, color: '#60A5FA' },
{ to: '/pos', label: 'Thu ngân', icon: ShoppingCart, color: '#34D399' },
{ to: '/customers', label: 'Khách hàng', icon: Users, color: '#FBBF24' },
{ to: '/staff', label: 'Nhân viên', icon: UserSquare, color: '#F97316' },
{ to: '/services', label: 'Dịch vụ', icon: Scissors, color: '#A78BFA' },
{ to: '/reports', label: 'Báo cáo', icon: BarChart3, color: '#C084FC' },
{ to: '/settings', label: 'Cài đặt', icon: SettingsIcon, color: '#94A3B8' }];


const MOBILE_TABS = NAV.slice(0, 4);

export default function Layout() {
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();

  const NavItem = ({ item, onClick }) => {
    const Icon = item.icon;
    return (
      <NavLink
        to={item.to}
        end={item.end}
        onClick={onClick}
        className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
        isActive ?
        'text-white shadow-sm' :
        'text-slate-600 hover:bg-slate-100'}`

        }
        style={({ isActive }) =>
        isActive ? { background: item.color } : undefined
        }>
        
        <Icon className="w-5 h-5 shrink-0" />
        <span>{item.label}</span>
      </NavLink>);

  };

  return (
    <div className="min-h-screen bg-slate-50 font-body">
      <TopBar />

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
        <div className="max-w-6xl px-4 md:px-8 py-5 md:py-8 mr-1">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom tabs */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/90 backdrop-blur-lg border-t border-slate-100">
        <div className="grid grid-cols-5">
          {MOBILE_TABS.map((item) => {
            const Icon = item.icon;
            const active = item.end ? location.pathname === '/' : location.pathname.startsWith(item.to);
            return (
              <NavLink key={item.to} to={item.to} end={item.end} className="flex flex-col items-center justify-center py-2 gap-0.5">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
                  style={active ? { background: item.color } : undefined}>
                  
                  <Icon className="w-5 h-5" style={{ color: active ? 'white' : '#94A3B8' }} />
                </div>
                <span className="text-[10px] font-medium" style={{ color: active ? item.color : '#94A3B8' }}>
                  {item.label}
                </span>
              </NavLink>);

          })}
          <button onClick={() => setMoreOpen(true)} className="flex flex-col items-center justify-center py-2 gap-0.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-100">
              <Grid className="w-5 h-5 text-slate-500" />
            </div>
            <span className="text-[10px] font-medium text-slate-500">Khác</span>
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
              <span className="font-bold text-lg">Tất cả chức năng</span>
              <button onClick={() => setMoreOpen(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {NAV.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setMoreOpen(false)}
                  className="flex flex-col items-center gap-1.5">
                  
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: item.color + '1a' }}>
                      <Icon className="w-6 h-6" style={{ color: item.color }} />
                    </div>
                    <span className="text-xs font-medium text-slate-600">{item.label}</span>
                  </NavLink>);

            })}
            </div>
          </div>
        </div>
      }

      <SonnerToaster position="top-center" richColors closeButton />
    </div>);

}