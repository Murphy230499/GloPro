'use client';
import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useBranch } from '@/lib/BranchContext';

import ReportLayout from '@/components/reports/ReportLayout';

// Import 18 Tab Components
import OverviewTab from '@/components/reports/tabs/OverviewTab';
import RevenueTab from '@/components/reports/tabs/RevenueTab';
import AppointmentsTab from '@/components/reports/tabs/AppointmentsTab';
import CustomersTab from '@/components/reports/tabs/CustomersTab';
import StaffTab from '@/components/reports/tabs/StaffTab';
import PosCashierTab from '@/components/reports/tabs/PosCashierTab';
import ServicesTab from '@/components/reports/tabs/ServicesTab';
import ProductsTab from '@/components/reports/tabs/ProductsTab';
import InventoryTab from '@/components/reports/tabs/InventoryTab';
import PackagesTab from '@/components/reports/tabs/PackagesTab';
import TreatmentsTab from '@/components/reports/tabs/TreatmentsTab';
import ServiceCombosTab from '@/components/reports/tabs/ServiceCombosTab';
import ProductCombosTab from '@/components/reports/tabs/ProductCombosTab';
import PrepaidCardsTab from '@/components/reports/tabs/PrepaidCardsTab';
import TipReportTab from '@/components/reports/tabs/TipReportTab';
import MarketingTab from '@/components/reports/tabs/MarketingTab';
import DepositReportTab from '@/components/reports/tabs/DepositReportTab';
import KPIDashboardTab from '@/components/reports/tabs/KPIDashboardTab';
import FinanceTab from '@/components/reports/tabs/FinanceTab';
import MultiBranchTab from '@/components/reports/tabs/MultiBranchTab';
import AiReportTab from '@/components/reports/tabs/AiReportTab';
import CashFlowReportTab from '@/components/reports/tabs/CashFlowReportTab';

export default function Reports() {
  const { currentBranchId, branches } = useBranch();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  // Entities state
  const [invoices, setInvoices] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [staff, setStaff] = useState([]);
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [packages, setPackages] = useState([]);
  const [treatments, setTreatments] = useState([]);
  const [serviceCombos, setServiceCombos] = useState([]);
  const [productCombos, setProductCombos] = useState([]);
  const [prepaidCards, setPrepaidCards] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [cashVouchers, setCashVouchers] = useState([]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    const filter = (currentBranchId === 'all' || !currentBranchId) ? {} : { branch_id: currentBranchId };

    const safeFilter = (entity, filterObj) => {
      if (!entity || typeof entity.filter !== 'function') return Promise.resolve([]);
      return entity.filter(filterObj).catch(() => []);
    };

    const safeList = (entity) => {
      if (!entity || typeof entity.list !== 'function') return Promise.resolve([]);
      return entity.list().catch(() => []);
    };

    Promise.all([
      safeFilter(base44.entities?.Invoice, filter),
      safeFilter(base44.entities?.Appointment, filter),
      safeList(base44.entities?.Customer),
      safeFilter(base44.entities?.Staff, filter),
      safeFilter(base44.entities?.Product, filter),
      safeFilter(base44.entities?.Service, filter),
      safeFilter(base44.entities?.ServicePackage, filter),
      safeFilter(base44.entities?.Treatment, filter),
      safeFilter(base44.entities?.ServiceCombo, filter),
      safeFilter(base44.entities?.ProductCombo, filter),
      safeFilter(base44.entities?.PrepaidCard, filter),
      safeFilter(base44.entities?.Deposit, filter)
    ]).then(([inv, appt, cust, st, prod, serv, pkg, trt, sc, pc, card, dep]) => {
      if (!isMounted) return;
      setInvoices(inv || []);
      setAppointments(appt || []);
      setCustomers(cust || []);
      setStaff((st || []).filter(x => x && x.is_active !== false));
      setProducts((prod || []).filter(x => x && x.is_active !== false));
      setServices((serv || []).filter(x => x && x.is_active !== false));
      setPackages((pkg || []).filter(x => x && x.is_active !== false));
      setTreatments((trt || []).filter(x => x && x.is_active !== false));
      setServiceCombos((sc || []).filter(x => x && x.is_active !== false));
      setProductCombos((pc || []).filter(x => x && x.is_active !== false));
      setPrepaidCards(card || []);
      setDeposits(dep || []);
      // Load cashVouchers separately (non-blocking)
      safeList(base44.entities?.CashVoucher).then(cv => { if (isMounted) setCashVouchers(cv || []); });
      setLoading(false);
    }).catch(err => {
      console.error('Error loading reports data:', err);
      if (isMounted) setLoading(false);
    });

    return () => { isMounted = false; };
  }, [currentBranchId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-3">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        <span className="text-xs font-semibold text-slate-500">Đang tổng hợp dữ liệu báo cáo...</span>
      </div>
    );
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab invoices={invoices} appointments={appointments} customers={customers} staff={staff} products={products} services={services} packages={packages} treatments={treatments} serviceCombos={serviceCombos} productCombos={productCombos} prepaidCards={prepaidCards} />;
      case 'revenue':
        return <RevenueTab invoices={invoices} />;
      case 'appointments':
        return <AppointmentsTab appointments={appointments} />;
      case 'customers':
        return <CustomersTab customers={customers} invoices={invoices} />;
      case 'staff':
        return <StaffTab staff={staff} invoices={invoices} />;
      case 'pos_cashier':
        return <PosCashierTab invoices={invoices} />;
      case 'services':
        return <ServicesTab services={services} invoices={invoices} />;
      case 'products':
        return <ProductsTab products={products} invoices={invoices} />;
      case 'inventory':
        return <InventoryTab products={products} />;
      case 'packages':
        return <PackagesTab packages={packages} invoices={invoices} />;
      case 'treatments':
        return <TreatmentsTab treatments={treatments} invoices={invoices} />;
      case 'service_combos':
        return <ServiceCombosTab serviceCombos={serviceCombos} invoices={invoices} />;
      case 'product_combos':
        return <ProductCombosTab productCombos={productCombos} invoices={invoices} />;
      case 'prepaid_cards':
        return <PrepaidCardsTab prepaidCards={prepaidCards} />;
      case 'tips':
        return <TipReportTab invoices={invoices} staff={staff} />;
      case 'marketing':
        return <MarketingTab customers={customers} />;
      case 'deposits':
        return <DepositReportTab deposits={deposits} searchQuery={''} />;
      case 'kpi':
        return <KPIDashboardTab invoices={invoices} appointments={appointments} />;
      case 'finance':
        return <FinanceTab invoices={invoices} />;
      case 'multi_branch':
        return <MultiBranchTab branches={branches} invoices={invoices} />;
      case 'ai_report':
        return <AiReportTab />;
      case 'cash_flow':
        return <CashFlowReportTab />;
      default:
        return <OverviewTab invoices={invoices} appointments={appointments} customers={customers} staff={staff} products={products} />;
    }
  };

  const dataForExport = {
    overview: invoices,
    revenue: invoices,
    appointments: appointments,
    customers: customers,
    staff: staff,
    pos_cashier: invoices,
    services: services,
    products: products,
    inventory: products,
    packages: packages,
    treatments: treatments,
    service_combos: serviceCombos,
    product_combos: productCombos,
    prepaid_cards: prepaidCards,
    tips: invoices,
    marketing: customers,
    deposits: deposits,
    kpi: invoices,
    finance: invoices,
    cash_flow: cashVouchers,
    multi_branch: branches
  };

  return (
    <ReportLayout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      dataForExport={dataForExport}
    >
      {renderActiveTab()}
    </ReportLayout>
  );
}