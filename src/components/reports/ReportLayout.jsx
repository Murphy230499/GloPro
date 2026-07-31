import React, { useState, useEffect } from 'react';
import { base44, getCachedPermissions } from '@/api/base44Client';
import { supabase } from '@/api/supabaseClient';
import {
  LayoutDashboard, TrendingUp, Calendar, Users, UserCheck, DollarSign,
  Scissors, Package, Layers, PackageCheck, Activity, Tag, CreditCard,
  Target, PieChart, Building2, ChevronRight, ChevronLeft, Gift, Sparkles, Wallet, PiggyBank
} from 'lucide-react';
import FilterBar from './FilterBar';
import DrillDownModal from './DrillDownModal';
import { exportToCSV, printReportTable } from '@/lib/exportHelpers';

// 18 Modules Definition
const REPORT_MODULES = [
  { id: 'overview', name: 'Dashboard', icon: LayoutDashboard },
  { id: 'revenue', name: 'Doanh Thu', icon: TrendingUp },
  { id: 'appointments', name: 'Lịch Hẹn', icon: Calendar },
  { id: 'customers', name: 'Khách Hàng', icon: Users },
  { id: 'staff', name: 'Nhân Viên', icon: UserCheck },
  { id: 'pos_cashier', name: 'Thu Ngân', icon: DollarSign },
  { id: 'services', name: 'Dịch Vụ', icon: Scissors },
  { id: 'products', name: 'Sản Phẩm', icon: Package },
  { id: 'inventory', name: 'Kho Hàng', icon: Layers },
  { id: 'packages', name: 'Gói Dịch Vụ', icon: PackageCheck },
  { id: 'treatments', name: 'Liệu Trình', icon: Activity },
  { id: 'service_combos', name: 'Combo Dịch Vụ', icon: Tag },
  { id: 'product_combos', name: 'Combo Sản Phẩm', icon: Tag },
  { id: 'prepaid_cards', name: 'Thẻ Tiền Mặt', icon: CreditCard },
  { id: 'tips', name: 'Tiền TIP', icon: Gift },
  { id: 'marketing', name: 'Marketing', icon: Target },
  { id: 'deposits', name: 'Tiền Cọc', icon: PiggyBank },
  { id: 'kpi', name: 'Chỉ Số KPI', icon: Target },
  { id: 'finance', name: 'Tài Chính (P&L)', icon: PieChart },
  { id: 'cash_flow', name: 'Dòng Tiền', icon: Wallet },
  { id: 'multi_branch', name: 'Chuỗi Chi Nhánh', icon: Building2 },
  { id: 'ai_report', name: 'Tạo Báo Cáo AI', icon: Sparkles }
];

export default function ReportLayout({ children, activeTab, setActiveTab, dataForExport = {} }) {
  const [datePreset, setDatePreset] = useState('30d');
  const [customRange, setCustomRange] = useState({ startDate: '', endDate: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [drillDownState, setDrillDownState] = useState({ open: false, title: '', data: [] });
  // Mặc định luôn mở rộng danh mục báo cáo để dễ xem
  const [collapsed, setCollapsed] = useState(false);

  const [allowedModules, setAllowedModules] = useState(null);

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

  const visibleModules = REPORT_MODULES.filter(mod => {
    if (!allowedModules || allowedModules === 'all') return true;
    const isAllowed = (key) => !allowedModules.blocked.includes(key);
    if (mod.id === 'ai_report') return isAllowed('report_ai_generate');
    if (mod.id === 'overview' || mod.id === 'kpi') return isAllowed('report_overview_view');
    if (mod.id === 'finance' || mod.id === 'cash_flow') return isAllowed('report_finance_view');
    return isAllowed('report_revenue_view');
  });

  useEffect(() => {
    if (visibleModules.length > 0 && !visibleModules.some(m => m.id === activeTab)) {
      setActiveTab(visibleModules[0].id);
    }
  }, [allowedModules, visibleModules, activeTab]);

  const activeModule = REPORT_MODULES.find(m => m.id === activeTab) || REPORT_MODULES[0];

  const handleExportCSV = () => {
    const list = dataForExport[activeTab] || [];
    if (!list.length) return;
    const headers = Object.keys(list[0]);
    const rows = list.map(item => Object.values(item));
    exportToCSV(`GloPro_BaoCao_${activeTab}`, headers, rows);
  };

  const handleExportPDF = () => {
    const list = dataForExport[activeTab] || [];
    if (!list.length) return;
    const headers = Object.keys(list[0]);
    const rows = list.map(item => Object.values(item));
    printReportTable(`Báo cáo ${activeModule.name}`, headers, rows);
  };

  const handleOpenDrillDown = (title, data) => {
    setDrillDownState({ open: true, title, data });
  };

  return (
    <div className="flex flex-col lg:flex-row gap-5 font-body w-full lg:items-start">
      
      {/* Left Sidebar: 18 Modules Menu (Cố định mở rộng) */}
      <div 
        className={`bg-white rounded-2xl border border-slate-200/80 p-3 shadow-2xs shrink-0 transition-all duration-300 relative lg:sticky lg:top-0 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto w-full lg:w-64`}
      >
        <div className="px-3 py-2 text-xs font-semibold text-slate-400 normal-case">
          Danh mục báo cáo
        </div>

        <div className="space-y-0.5">
          {visibleModules.map(mod => {
            const IconComp = mod.icon;
            const isActive = activeTab === mod.id;

            return (
              <button
                key={mod.id}
                onClick={() => {
                  setActiveTab(mod.id);
                }}
                className={`w-full flex items-center justify-between rounded-xl text-xs transition cursor-pointer px-3 py-2.5
                  ${isActive
                    ? 'bg-blue-50 text-blue-600 font-bold border border-blue-100 shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                  }`}
                title={mod.name}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <IconComp className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span className="truncate opacity-100">
                    {mod.name}
                  </span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area with min-w-0 for flex/Recharts safety */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Title Bar & FilterBar */}
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <activeModule.icon className="w-6 h-6 text-blue-600" />
                <span>{activeModule.name}</span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">Phân tích chuyên sâu & hỗ trợ ra quyết định kinh doanh trong 30s</p>
            </div>
          </div>

          <FilterBar
            datePreset={datePreset}
            setDatePreset={setDatePreset}
            customRange={customRange}
            setCustomRange={setCustomRange}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onExportCSV={(allowedModules === 'all' || allowedModules?.includes('report_export')) ? handleExportCSV : null}
            onExportPDF={(allowedModules === 'all' || allowedModules?.includes('report_export')) ? handleExportPDF : null}
          />
        </div>

        {/* Dynamic Active Tab Content */}
        <div className="animate-in fade-in zoom-in-95 duration-150">
          {children && React.isValidElement(children) ? React.cloneElement(children, { searchQuery, onDrillDown: handleOpenDrillDown, datePreset, customRange }) : children}
        </div>
      </div>

      {/* Drill-down detail pop-up modal */}
      <DrillDownModal
        open={drillDownState.open}
        title={drillDownState.title}
        data={drillDownState.data}
        onClose={() => setDrillDownState({ open: false, title: '', data: [] })}
      />

    </div>
  );
}
