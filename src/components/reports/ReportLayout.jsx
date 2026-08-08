import React, { useState, useEffect } from 'react';
import { base44, getCachedPermissions } from '@/api/base44Client';
import { supabase } from '@/api/supabaseClient';
import { useT } from '@/lib/i18n';
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
  { id: 'overview', key: 'mod_overview', defaultName: 'Dashboard', icon: LayoutDashboard },
  { id: 'revenue', key: 'mod_revenue', defaultName: 'Revenue', icon: TrendingUp },
  { id: 'appointments', key: 'mod_appointments', defaultName: 'Appointments', icon: Calendar },
  { id: 'customers', key: 'mod_customers', defaultName: 'Customers', icon: Users },
  { id: 'staff', key: 'mod_staff', defaultName: 'Staff', icon: UserCheck },
  { id: 'pos_cashier', key: 'mod_pos_cashier', defaultName: 'POS / Cashier', icon: DollarSign },
  { id: 'services', key: 'mod_services', defaultName: 'Services', icon: Scissors },
  { id: 'products', key: 'mod_products', defaultName: 'Products', icon: Package },
  { id: 'inventory', key: 'mod_inventory', defaultName: 'Inventory', icon: Layers },
  { id: 'packages', key: 'mod_packages', defaultName: 'Service Packages', icon: PackageCheck },
  { id: 'treatments', key: 'mod_treatments', defaultName: 'Treatments', icon: Activity },
  { id: 'service_combos', key: 'mod_service_combos', defaultName: 'Service Combos', icon: Tag },
  { id: 'product_combos', key: 'mod_product_combos', defaultName: 'Product Combos', icon: Tag },
  { id: 'prepaid_cards', key: 'mod_prepaid_cards', defaultName: 'Prepaid Cards', icon: CreditCard },
  { id: 'tips', key: 'mod_tips', defaultName: 'Tips', icon: Gift },
  { id: 'marketing', key: 'mod_marketing', defaultName: 'Marketing', icon: Target },
  { id: 'deposits', key: 'mod_deposits', defaultName: 'Deposits', icon: PiggyBank },
  { id: 'kpi', key: 'mod_kpi', defaultName: 'KPI Metrics', icon: Target },
  { id: 'finance', key: 'mod_finance', defaultName: 'Financials (P&L)', icon: PieChart },
  { id: 'cash_flow', key: 'mod_cash_flow', defaultName: 'Cash Flow', icon: Wallet },
  { id: 'multi_branch', key: 'mod_multi_branch', defaultName: 'Multi-Branch', icon: Building2 },
  { id: 'ai_report', key: 'mod_ai_report', defaultName: 'AI Report Generator', icon: Sparkles }
];

export default function ReportLayout({ children, activeTab, setActiveTab, dataForExport = {} }) {
  const t = useT();
  const [datePreset, setDatePreset] = useState('30d');
  const [customRange, setCustomRange] = useState({ startDate: '', endDate: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [drillDownState, setDrillDownState] = useState({ open: false, title: '', data: [] });
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
  const activeModuleName = t(`reports.${activeModule.key}`, activeModule.defaultName);

  const handleExportCSV = () => {
    const list = dataForExport[activeTab] || [];
    if (!list.length) return;
    const headers = Object.keys(list[0]);
    const rows = list.map(item => Object.values(item));
    exportToCSV(`GloPro_Report_${activeTab}`, headers, rows);
  };

  const handleExportPDF = () => {
    const list = dataForExport[activeTab] || [];
    if (!list.length) return;
    const headers = Object.keys(list[0]);
    const rows = list.map(item => Object.values(item));
    printReportTable(`Report ${activeModuleName}`, headers, rows);
  };

  const handleOpenDrillDown = (title, data) => {
    setDrillDownState({ open: true, title, data });
  };

  return (
    <div className="flex flex-col lg:flex-row gap-5 font-body w-full lg:items-start">
      
      {/* Left Sidebar: Modules Menu */}
      <div 
        className={`bg-white rounded-2xl border border-slate-200/80 p-3 shadow-2xs shrink-0 transition-all duration-300 relative lg:sticky lg:top-0 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto w-full lg:w-64`}
      >
        <div className="px-3 py-2 text-xs font-semibold text-slate-400 normal-case">
          {t('reports.sidebar_header', 'Report Categories')}
        </div>

        <div className="space-y-0.5">
          {visibleModules.map(mod => {
            const IconComp = mod.icon;
            const isActive = activeTab === mod.id;
            const modName = t(`reports.${mod.key}`, mod.defaultName);

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
                title={modName}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <IconComp className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span className="truncate opacity-100">
                    {modName}
                  </span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Title Bar & FilterBar */}
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <activeModule.icon className="w-6 h-6 text-blue-600" />
                <span>{activeModuleName}</span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">{t('reports.header_subtitle', 'In-depth analysis & business decision support in 30s')}</p>
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
