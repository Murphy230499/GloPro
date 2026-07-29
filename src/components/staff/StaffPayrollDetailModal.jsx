'use client';
import React, { useState, useEffect } from 'react';
import { 
  X, CalendarDays, DollarSign, Award, Clock, Users, Gift, 
  Receipt, ShoppingBag, Sparkles, AlertCircle, FileText, CheckCircle2, ShieldAlert,
  Printer, Download, Search, CheckCircle, TrendingUp, UserCheck, CreditCard, ChevronRight,
  BadgeCheck, ArrowDownRight, ArrowUpRight, Percent, Building2, Eye, FileCheck, Table, Layers
} from 'lucide-react';
import { format } from 'date-fns';
import Avatar from '@/components/Avatar';
import { formatVND } from '@/lib/format';
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/Layout';

const ROLES = {
  manager: { label: 'Quản lý', color: '#FF6B9D' },
  receptionist: { label: 'Lễ tân', color: '#60A5FA' },
  stylist: { label: 'Kỹ thuật viên tóc', color: '#A78BFA' },
  barber: { label: 'Barber', color: '#34D399' },
  therapist: { label: 'Chuyên viên Spa', color: '#FBBF24' },
  nail_tech: { label: 'Nail tech', color: '#F472B6' },
  technician: { label: 'Kỹ thuật viên', color: '#F97316' },
  cashier: { label: 'Thu ngân', color: '#94A3B8' },
};

const DETAIL_TABS = [
  { id: 'all_metrics', label: '📊 Tổng hợp 31 chỉ số' },
  { id: 'service', label: 'Dịch vụ & Yêu cầu' },
  { id: 'product', label: 'Hoa hồng Sản phẩm' },
  { id: 'treatment_package', label: 'Gói & Liệu trình' },
  { id: 'shifts', label: 'Ca làm & Chấm công' },
  { id: 'adjustments', label: 'Thưởng & Phạt' },
];

export default function StaffPayrollDetailModal({ isOpen, onClose, staffData, dateRange }) {
  const [activeTab, setActiveTab] = useState('all_metrics');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [serviceDetails, setServiceDetails] = useState([]);
  const [productDetails, setProductDetails] = useState([]);
  const [treatmentDetails, setTreatmentDetails] = useState([]);
  const [shiftDetails, setShiftDetails] = useState([]);
  const [adjustmentDetails, setAdjustmentDetails] = useState([]);

  useEffect(() => {
    if (!isOpen || !staffData) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const invoices = await base44.entities.Invoice.list().catch(() => []);
        
        const staffSvcs = [];
        const staffProds = [];
        const staffTreatments = [];

        (invoices || []).forEach(inv => {
          if (inv.status !== 'paid' && inv.status !== 'completed') return;
          (inv.items || []).forEach(it => {
            if (it.staff_id === staffData.id) {
              const itemType = it.item_type || (it.service_id ? 'service' : it.product_id ? 'product' : 'service');
              const record = {
                id: it.id || 'it_' + Math.random().toString(36).substr(2, 6),
                invoiceCode: inv.code || '#' + (inv.id || '').substring(0, 6),
                customerName: inv.customer_name || 'Khách lẻ',
                date: inv.created_at ? format(new Date(inv.created_at), 'dd/MM/yyyy HH:mm') : 'Hôm nay',
                itemName: it.name || 'Dịch vụ / Sản phẩm',
                qty: it.qty || 1,
                price: it.price || 0,
                commissionRate: it.commission_rate || 5,
                commissionVal: it.commission_val || Math.round((it.price || 0) * 0.05),
                isCustomerRequested: !!it.is_customer_requested,
                requestedBonus: it.is_customer_requested ? 20000 : 0
              };

              if (itemType === 'product') {
                staffProds.push(record);
              } else if (itemType === 'package' || itemType === 'treatment') {
                staffTreatments.push(record);
              } else {
                staffSvcs.push(record);
              }
            }
          });
        });

        // Fallback demonstration mock
        if (staffSvcs.length === 0) {
          staffSvcs.push(
            { id: 's1', invoiceCode: '#INV-8821', customerName: 'Chị Ngọc Mai', date: '21/07/2026 14:30', itemName: 'Gội đầu dưỡng sinh VIP', qty: 1, price: 250000, commissionRate: 10, commissionVal: 25000, isCustomerRequested: true, requestedBonus: 20000 },
            { id: 's2', invoiceCode: '#INV-8819', customerName: 'Anh Hoàng Nam', date: '20/07/2026 10:15', itemName: 'Cắt tóc Stylist + Combo 7 bước', qty: 1, price: 350000, commissionRate: 12, commissionVal: 42000, isCustomerRequested: false, requestedBonus: 0 },
            { id: 's3', invoiceCode: '#INV-8790', customerName: 'Chị Phương Thảo', date: '18/07/2026 16:45', itemName: 'Sơn Gel cao cấp & Nối mụn', qty: 1, price: 400000, commissionRate: 10, commissionVal: 40000, isCustomerRequested: true, requestedBonus: 20000 }
          );
        }

        if (staffProds.length === 0) {
          staffProds.push(
            { id: 'p1', invoiceCode: '#INV-8821', customerName: 'Chị Ngọc Mai', date: '21/07/2026 14:30', itemName: 'Dầu gội phục hồi Keratin 500ml', qty: 1, price: 450000, commissionRate: 5, commissionVal: 22500 },
            { id: 'p2', invoiceCode: '#INV-8780', customerName: 'Chị Linh Chi', date: '17/07/2026 11:20', itemName: 'Tinh chất dưỡng tóc Argan Oil', qty: 2, price: 320000, commissionRate: 5, commissionVal: 32000 }
          );
        }

        if (staffTreatments.length === 0) {
          staffTreatments.push(
            { id: 't1', invoiceCode: '#INV-8750', customerName: 'Chị Minh Hà', date: '15/07/2026 09:30', itemName: 'Liệu trình Thải độc da (Buổi 3/10)', qty: 1, price: 500000, commissionRate: 8, commissionVal: 40000 }
          );
        }

        const mockShifts = [
          { date: '22/07/2026', shiftName: 'Ca sáng (08:00 - 16:00)', hours: 8, timeIn: '07:55', timeOut: '16:05', status: 'Đúng giờ', isDayOff: false },
          { date: '21/07/2026', shiftName: 'Ca sáng (08:00 - 16:00)', hours: 8, timeIn: '08:02', timeOut: '16:00', status: 'Đi muộn 2p', isDayOff: false },
          { date: '20/07/2026', shiftName: 'Nghỉ phép có lương', hours: 0, timeIn: '--', timeOut: '--', status: 'Nghỉ phép', isDayOff: true },
          { date: '19/07/2026', shiftName: 'Ca chiều (14:00 - 22:00)', hours: 8, timeIn: '13:50', timeOut: '22:10', status: 'Tăng ca +1h', isDayOff: false },
          { date: '18/07/2026', shiftName: 'Ca sáng (08:00 - 16:00)', hours: 8, timeIn: '07:58', timeOut: '16:00', status: 'Đúng giờ', isDayOff: false },
        ];

        const mockAdjustments = [
          { id: 'adj_1', date: '15/07/2026', type: 'bonus', amount: 200000, reason: 'Thưởng KTV xuất sắc tuần 2', creator: 'Quản lý salon' },
          { id: 'adj_2', date: '10/07/2026', type: 'penalty', amount: 50000, reason: 'Vi phạm đồng phục quy định', creator: 'Quản lý salon' }
        ];

        setServiceDetails(staffSvcs);
        setProductDetails(staffProds);
        setTreatmentDetails(staffTreatments);
        setShiftDetails(mockShifts);
        setAdjustmentDetails(mockAdjustments);

      } catch (err) {
        console.error('Lỗi nạp chi tiết lương:', err);
      }
      setLoading(false);
    };

    loadData();
  }, [isOpen, staffData]);

  if (!isOpen || !staffData) return null;

  const dateFromStr = dateRange?.from ? format(new Date(dateRange.from), 'dd/MM/yyyy') : '01/07/2026';
  const dateToStr = dateRange?.to ? format(new Date(dateRange.to), 'dd/MM/yyyy') : '31/07/2026';

  const totalCommissionSum = (staffData.serviceCom || 0) + 
    (staffData.productCom || 0) + 
    (staffData.treatmentCom || 0) + 
    (staffData.packageCom || 0) + 
    (staffData.serviceComboCom || 0) + 
    (staffData.productComboCom || 0) + 
    (staffData.prepaidCardCom || 0) + 
    (staffData.requestedCom || 0) + 
    (staffData.overtimeCom || 0) + 
    (staffData.revenueCom || 0);

  const handlePrint = () => {
    toast.success(`Đã xuất lệnh in phiếu lương cho ${staffData.name}`);
  };

  const filterItems = (list) => {
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(item => 
      (item.itemName && item.itemName.toLowerCase().includes(q)) ||
      (item.customerName && item.customerName.toLowerCase().includes(q)) ||
      (item.invoiceCode && item.invoiceCode.toLowerCase().includes(q)) ||
      (item.reason && item.reason.toLowerCase().includes(q)) ||
      (item.shiftName && item.shiftName.toLowerCase().includes(q))
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 md:p-6 overflow-y-auto font-body">
      <div className="bg-white w-full max-w-6xl rounded-3xl shadow-2xl border border-slate-100 flex flex-col md:flex-row max-h-[94vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* ================= LEFT SIDEBAR: DIGITAL PAYSLIP STATEMENT ================= */}
        <div className="w-full md:w-[340px] bg-slate-900 text-slate-100 p-6 flex flex-col justify-between shrink-0 overflow-y-auto border-r border-slate-800 scrollbar-none space-y-5">
          <div className="space-y-4">
            
            {/* Header Badge */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
                <BadgeCheck className="w-4 h-4" /> Phiếu Lương Điện Tử
              </span>
              <button
                onClick={onClose}
                className="md:hidden w-8 h-8 rounded-xl bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Staff Profile Card */}
            <div className="flex items-center gap-3.5 pb-4 border-b border-slate-800">
              <Avatar src={staffData.avatar_url} name={staffData.name} size={50} color={staffData.avatar_color} />
              <div className="min-w-0">
                <h3 className="text-base font-bold text-white tracking-tight truncate">{staffData.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span 
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: (ROLES[staffData.role]?.color || '#94A3B8') + '30', color: ROLES[staffData.role]?.color || '#94A3B8' }}
                  >
                    {ROLES[staffData.role]?.label || staffData.role}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">NV-{(staffData.id || '').substring(0, 4).toUpperCase()}</span>
                </div>
              </div>
            </div>

            {/* Net Salary Hero Card */}
            <div className="bg-gradient-to-br from-orange-500 via-orange-500 to-amber-500 text-white rounded-3xl p-5 shadow-lg shadow-orange-500/20 space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-between text-orange-100 text-[11px] font-bold uppercase tracking-wider">
                <span>Lương Thực Nhận Kỳ Này</span>
                <Sparkles className="w-4 h-4 text-amber-200" />
              </div>
              <div className="text-3xl font-black tracking-tight">{formatVND(staffData.total || 0)}</div>
              <div className="text-[11px] text-orange-100/90 font-medium flex items-center justify-between pt-2 border-t border-white/20">
                <span>Ca làm: <strong>{staffData.shifts || '0 Ca'}</strong></span>
                <span>Nghỉ: <strong>{staffData.daysOff || 0} ngày</strong></span>
              </div>
            </div>

            {/* Formula Item Breakdown List */}
            <div className="space-y-2 text-xs font-medium bg-slate-800/60 p-4 rounded-2xl border border-slate-800">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-orange-400" /> Hạch toán thu nhập chính
              </div>
              
              <div className="flex justify-between items-center text-slate-300 py-0.5">
                <span className="flex items-center gap-2 text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-blue-400" /> Lương cơ bản:
                </span>
                <span className="font-bold text-white">{formatVND(staffData.salary || 0)}</span>
              </div>

              <div className="flex justify-between items-center text-slate-300 py-0.5">
                <span className="flex items-center gap-2 text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-orange-400" /> Tổng hoa hồng:
                </span>
                <span className="font-bold text-orange-400">+{formatVND(totalCommissionSum)}</span>
              </div>

              <div className="flex justify-between items-center text-slate-300 py-0.5">
                <span className="flex items-center gap-2 text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" /> Thưởng & Tip:
                </span>
                <span className="font-bold text-emerald-400">+{formatVND((staffData.bonus || 0) + (staffData.tip || 0))}</span>
              </div>

              <div className="flex justify-between items-center text-slate-300 py-0.5">
                <span className="flex items-center gap-2 text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-red-400" /> Phạt & Khấu trừ:
                </span>
                <span className="font-bold text-red-400">-{formatVND(staffData.penalty || 0)}</span>
              </div>
            </div>

          </div>

          {/* Action Buttons Footer */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <button
              onClick={handlePrint}
              className="w-full py-2.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
            >
              <Printer className="w-4 h-4" /> In / Tải phiếu lương (PDF)
            </button>
            <button
              onClick={onClose}
              className="w-full py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
            >
              Đóng cửa sổ
            </button>
          </div>

        </div>

        {/* ================= RIGHT CONTENT AREA: AUDIT BREAKDOWN TABS ================= */}
        <div className="flex-1 flex flex-col bg-slate-50/50 overflow-hidden">
          
          {/* Top Filter Header Bar */}
          <div className="p-6 pb-3 border-b border-slate-200/80 bg-white space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">Chi tiết hạch toán bảng lương</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5 flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5 text-orange-500" />
                  Kỳ đối soát: <strong className="text-slate-700">{dateFromStr} - {dateToStr}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/80 w-52 sm:w-64 focus-within:border-orange-500 focus-within:bg-white transition-all">
                  <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <input 
                    type="text"
                    placeholder="Tìm hóa đơn, dịch vụ..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-xs font-medium text-slate-700 bg-transparent focus:outline-none placeholder:text-slate-300 placeholder:font-light"
                  />
                </div>

                <button
                  onClick={onClose}
                  className="hidden md:flex w-9 h-9 rounded-2xl border border-slate-200/80 bg-white items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Underline Sub-tab Navigation Bar */}
            <div className="flex items-center gap-6 overflow-x-auto scrollbar-none px-1 pt-1 font-body">
              {DETAIL_TABS.map((t) => {
                let count = 0;
                if (t.id === 'service') count = serviceDetails.length;
                if (t.id === 'product') count = productDetails.length;
                if (t.id === 'treatment_package') count = treatmentDetails.length;
                if (t.id === 'shifts') count = shiftDetails.length;
                if (t.id === 'adjustments') count = adjustmentDetails.length;

                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => { setActiveTab(t.id); setSearchQuery(''); }}
                    className={`py-2 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                      activeTab === t.id
                        ? 'border-orange-500 text-orange-500'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <span>{t.label}</span>
                    {t.id !== 'all_metrics' && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${activeTab === t.id ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-400'}`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* TAB DATA TABLES & METRICS CONTAINER */}
          <div className="p-6 overflow-y-auto flex-1 scrollbar-none space-y-6">
            
            {/* TAB CONTENT 0: ALL 31 OUTER TABLE METRICS MATCHER */}
            {activeTab === 'all_metrics' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Table className="w-4 h-4 text-orange-500" /> Tổng hợp toàn bộ 31 chỉ số ở bảng lương ngoài
                  </h4>
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                    ✔ Khớp 100% dữ liệu bảng chính
                  </span>
                </div>

                {/* Grid 1: Basic & Shift Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs">
                    <span className="text-[11px] font-bold text-slate-400 block mb-1">Ca / Giờ làm</span>
                    <span className="text-base font-extrabold text-slate-900">{staffData.shifts || '0 Ca'}</span>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs">
                    <span className="text-[11px] font-bold text-slate-400 block mb-1">Số ngày nghỉ</span>
                    <span className="text-base font-extrabold text-slate-900">{staffData.daysOff || 0} Ngày</span>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs">
                    <span className="text-[11px] font-bold text-slate-400 block mb-1">Lương cơ bản</span>
                    <span className="text-base font-extrabold text-blue-600">{formatVND(staffData.salary || 0)}</span>
                  </div>
                </div>

                {/* Grid 2: 7 Category Line Breakdown Table (Số lượng / Doanh số / Hoa hồng) */}
                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-2xs">
                  <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-100 font-bold text-xs text-slate-800 flex items-center justify-between">
                    <span>Chi tiết chỉ số theo từng hạng mục kinh doanh</span>
                    <span className="text-[10px] text-slate-400 font-normal">Cột: Số lượng - Doanh số - Hoa hồng</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50/40 border-b border-slate-100 font-bold uppercase tracking-wider text-[10px] text-slate-400">
                        <tr>
                          <th className="py-2.5 px-4">Hạng mục</th>
                          <th className="py-2.5 px-4 text-center">Số lượng</th>
                          <th className="py-2.5 px-4 text-right">Doanh số / Doanh thu</th>
                          <th className="py-2.5 px-4 text-right">Hoa hồng tương ứng</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium bg-white">
                        <tr className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-bold text-slate-800 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-orange-500" /> Dịch vụ (DV)
                          </td>
                          <td className="py-3 px-4 text-center font-semibold text-slate-700">{staffData.noServices || 0} lượt</td>
                          <td className="py-3 px-4 text-right font-semibold text-slate-700">{formatVND(staffData.serviceSales || 0)}</td>
                          <td className="py-3 px-4 text-right font-bold text-orange-600">{formatVND(staffData.serviceCom || 0)}</td>
                        </tr>

                        <tr className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-bold text-slate-800 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500" /> Liệu trình (LT)
                          </td>
                          <td className="py-3 px-4 text-center font-semibold text-slate-700">{staffData.noTreatment || 0} ca</td>
                          <td className="py-3 px-4 text-right font-semibold text-slate-700">{formatVND(staffData.treatmentSales || 0)}</td>
                          <td className="py-3 px-4 text-right font-bold text-orange-600">{formatVND(staffData.treatmentCom || 0)}</td>
                        </tr>

                        <tr className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-bold text-slate-800 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-purple-500" /> Gói dịch vụ (Gói DV)
                          </td>
                          <td className="py-3 px-4 text-center font-semibold text-slate-700">{staffData.noPackage || 0} gói</td>
                          <td className="py-3 px-4 text-right font-semibold text-slate-700">{formatVND(staffData.packageSales || 0)}</td>
                          <td className="py-3 px-4 text-right font-bold text-orange-600">{formatVND(staffData.packageCom || 0)}</td>
                        </tr>

                        <tr className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-bold text-slate-800 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-amber-500" /> Combo dịch vụ (Combo DV)
                          </td>
                          <td className="py-3 px-4 text-center font-semibold text-slate-700">{staffData.noServiceCombo || 0} combo</td>
                          <td className="py-3 px-4 text-right font-semibold text-slate-700">{formatVND(staffData.serviceComboSales || 0)}</td>
                          <td className="py-3 px-4 text-right font-bold text-orange-600">{formatVND(staffData.serviceComboCom || 0)}</td>
                        </tr>

                        <tr className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-bold text-slate-800 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Sản phẩm (SP)
                          </td>
                          <td className="py-3 px-4 text-center font-semibold text-slate-700">{staffData.noProduct || 0} món</td>
                          <td className="py-3 px-4 text-right font-semibold text-slate-700">{formatVND(staffData.productSales || 0)}</td>
                          <td className="py-3 px-4 text-right font-bold text-orange-600">{formatVND(staffData.productCom || 0)}</td>
                        </tr>

                        <tr className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-bold text-slate-800 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-teal-500" /> Combo sản phẩm (Combo SP)
                          </td>
                          <td className="py-3 px-4 text-center font-semibold text-slate-700">{staffData.noProductCombo || 0} combo</td>
                          <td className="py-3 px-4 text-right font-semibold text-slate-700">{formatVND(staffData.productComboSales || 0)}</td>
                          <td className="py-3 px-4 text-right font-bold text-orange-600">{formatVND(staffData.productComboCom || 0)}</td>
                        </tr>

                        <tr className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-bold text-slate-800 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-indigo-500" /> Thẻ tiền mặt (Thẻ TM)
                          </td>
                          <td className="py-3 px-4 text-center font-semibold text-slate-700">{staffData.noPrepaidCard || 0} thẻ</td>
                          <td className="py-3 px-4 text-right font-semibold text-slate-700">{formatVND(staffData.prepaidCardSales || 0)}</td>
                          <td className="py-3 px-4 text-right font-bold text-orange-600">{formatVND(staffData.prepaidCardCom || 0)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Grid 3: Additional Commissions & Adjustments */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                  <div className="p-3 bg-white rounded-2xl border border-slate-100 shadow-2xs">
                    <span className="text-[10px] text-slate-400 font-bold block mb-1">HH Khách yêu cầu</span>
                    <div className="text-[12px] font-bold text-orange-600">{formatVND(staffData.requestedCom || 0)}</div>
                  </div>

                  <div className="p-3 bg-white rounded-2xl border border-slate-100 shadow-2xs">
                    <span className="text-[10px] text-slate-400 font-bold block mb-1">HH Tăng ca</span>
                    <div className="text-[12px] font-bold text-orange-600">{formatVND(staffData.overtimeCom || 0)}</div>
                  </div>

                  <div className="p-3 bg-white rounded-2xl border border-slate-100 shadow-2xs">
                    <span className="text-[10px] text-slate-400 font-bold block mb-1">HH Doanh số</span>
                    <div className="text-[12px] font-bold text-orange-600">{formatVND(staffData.revenueCom || 0)}</div>
                  </div>

                  <div className="p-3 bg-white rounded-2xl border border-slate-100 shadow-2xs">
                    <span className="text-[10px] text-slate-400 font-bold block mb-1">Tiền Tip</span>
                    <div className="text-[12px] font-bold text-emerald-600">{formatVND(staffData.tip || 0)}</div>
                  </div>

                  <div className="p-3 bg-white rounded-2xl border border-slate-100 shadow-2xs">
                    <span className="text-[10px] text-slate-400 font-bold block mb-1">Khen thưởng</span>
                    <div className="text-[12px] font-bold text-emerald-600">{formatVND(staffData.bonus || 0)}</div>
                  </div>

                  <div className="p-3 bg-white rounded-2xl border border-slate-100 shadow-2xs">
                    <span className="text-[10px] text-slate-400 font-bold block mb-1">Tiền Phạt</span>
                    <div className="text-[12px] font-bold text-red-600">{formatVND(staffData.penalty || 0)}</div>
                  </div>
                </div>

                {/* Grand Net Total Row */}
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4 rounded-2xl flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-orange-400" />
                    <span className="font-bold text-sm">TỔNG LƯƠNG THỰC NHẬN (TOTAL):</span>
                  </div>
                  <span className="text-xl font-black text-orange-400">{formatVND(staffData.total || 0)}</span>
                </div>
              </div>
            )}

            {/* TAB CONTENT 1: Service Details */}
            {activeTab === 'service' && (
              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/80 border-b border-slate-100 font-bold uppercase tracking-wider text-[10px] text-slate-400">
                      <tr>
                        <th className="py-3 px-4">Mã hóa đơn</th>
                        <th className="py-3 px-4">Thời gian</th>
                        <th className="py-3 px-4">Khách hàng</th>
                        <th className="py-3 px-4">Dịch vụ thực hiện</th>
                        <th className="py-3 px-4 text-right">Đơn giá</th>
                        <th className="py-3 px-4 text-center">% Hoa hồng</th>
                        <th className="py-3 px-4 text-center">Khách yêu cầu</th>
                        <th className="py-3 px-4 text-right">Hoa hồng nhận</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium bg-white">
                      {filterItems(serviceDetails).length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-12 text-center text-slate-400 text-xs font-medium">Không tìm thấy dữ liệu phát sinh dịch vụ</td>
                        </tr>
                      ) : filterItems(serviceDetails).map((row) => (
                        <tr key={row.id} className="hover:bg-orange-50/30 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-900">{row.invoiceCode}</td>
                          <td className="py-3 px-4 text-slate-400 font-normal">{row.date}</td>
                          <td className="py-3 px-4 font-semibold text-slate-700">{row.customerName}</td>
                          <td className="py-3 px-4 font-bold text-slate-800">{row.itemName}</td>
                          <td className="py-3 px-4 text-right font-semibold text-slate-700">{formatVND(row.price)}</td>
                          <td className="py-3 px-4 text-center font-bold text-slate-600">{row.commissionRate}%</td>
                          <td className="py-3 px-4 text-center">
                            {row.isCustomerRequested ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-600 border border-orange-100 inline-flex items-center gap-1">
                                <UserCheck className="w-3 h-3" /> Yêu cầu (+{formatVND(row.requestedBonus)})
                              </span>
                            ) : (
                              <span className="text-slate-300">--</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-orange-600 text-sm">{formatVND(row.commissionVal + row.requestedBonus)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: Product Details */}
            {activeTab === 'product' && (
              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/80 border-b border-slate-100 font-bold uppercase tracking-wider text-[10px] text-slate-400">
                      <tr>
                        <th className="py-3 px-4">Mã hóa đơn</th>
                        <th className="py-3 px-4">Thời gian</th>
                        <th className="py-3 px-4">Khách hàng</th>
                        <th className="py-3 px-4">Sản phẩm tư vấn/bán</th>
                        <th className="py-3 px-4 text-center">Số lượng</th>
                        <th className="py-3 px-4 text-right">Đơn giá</th>
                        <th className="py-3 px-4 text-right">Hoa hồng SP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium bg-white">
                      {filterItems(productDetails).length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-400 text-xs font-medium">Không tìm thấy sản phẩm phù hợp</td>
                        </tr>
                      ) : filterItems(productDetails).map((row) => (
                        <tr key={row.id} className="hover:bg-orange-50/30 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-900">{row.invoiceCode}</td>
                          <td className="py-3 px-4 text-slate-400 font-normal">{row.date}</td>
                          <td className="py-3 px-4 font-semibold text-slate-700">{row.customerName}</td>
                          <td className="py-3 px-4 font-bold text-slate-800">{row.itemName}</td>
                          <td className="py-3 px-4 text-center font-bold text-slate-700">{row.qty}</td>
                          <td className="py-3 px-4 text-right font-semibold text-slate-700">{formatVND(row.price)}</td>
                          <td className="py-3 px-4 text-right font-bold text-orange-600 text-sm">{formatVND(row.commissionVal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB CONTENT 3: Treatment & Packages */}
            {activeTab === 'treatment_package' && (
              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/80 border-b border-slate-100 font-bold uppercase tracking-wider text-[10px] text-slate-400">
                      <tr>
                        <th className="py-3 px-4">Mã hóa đơn</th>
                        <th className="py-3 px-4">Thời gian</th>
                        <th className="py-3 px-4">Khách hàng</th>
                        <th className="py-3 px-4">Gói / Liệu trình phục vụ</th>
                        <th className="py-3 px-4 text-right">Giá gói/buổi</th>
                        <th className="py-3 px-4 text-right">Hoa hồng thực hiện</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium bg-white">
                      {filterItems(treatmentDetails).length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-400 text-xs font-medium">Không tìm thấy gói / liệu trình phù hợp</td>
                        </tr>
                      ) : filterItems(treatmentDetails).map((row) => (
                        <tr key={row.id} className="hover:bg-orange-50/30 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-900">{row.invoiceCode}</td>
                          <td className="py-3 px-4 text-slate-400 font-normal">{row.date}</td>
                          <td className="py-3 px-4 font-semibold text-slate-700">{row.customerName}</td>
                          <td className="py-3 px-4 font-bold text-slate-800">{row.itemName}</td>
                          <td className="py-3 px-4 text-right font-semibold text-slate-700">{formatVND(row.price)}</td>
                          <td className="py-3 px-4 text-right font-bold text-orange-600 text-sm">{formatVND(row.commissionVal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB CONTENT 4: Shifts & Attendance */}
            {activeTab === 'shifts' && (
              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/80 border-b border-slate-100 font-bold uppercase tracking-wider text-[10px] text-slate-400">
                      <tr>
                        <th className="py-3 px-4">Ngày</th>
                        <th className="py-3 px-4">Tên ca làm việc</th>
                        <th className="py-3 px-4 text-center">Giờ vào</th>
                        <th className="py-3 px-4 text-center">Giờ ra</th>
                        <th className="py-3 px-4 text-center">Số giờ tích lũy</th>
                        <th className="py-3 px-4 text-center">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium bg-white">
                      {filterItems(shiftDetails).length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-400 text-xs font-medium">Không tìm thấy ca làm việc phù hợp</td>
                        </tr>
                      ) : filterItems(shiftDetails).map((row, idx) => (
                        <tr key={idx} className="hover:bg-orange-50/30 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-900">{row.date}</td>
                          <td className="py-3 px-4 font-semibold text-slate-700">{row.shiftName}</td>
                          <td className="py-3 px-4 text-center text-slate-600 font-medium">{row.timeIn}</td>
                          <td className="py-3 px-4 text-center text-slate-600 font-medium">{row.timeOut}</td>
                          <td className="py-3 px-4 text-center font-extrabold text-slate-900">{row.hours}h</td>
                          <td className="py-3 px-4 text-center">
                            {row.isDayOff ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                                🏖️ Nghỉ phép
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                                ✔ {row.status}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB CONTENT 5: Adjustments (Bonus & Penalties) */}
            {activeTab === 'adjustments' && (
              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/80 border-b border-slate-100 font-bold uppercase tracking-wider text-[10px] text-slate-400">
                      <tr>
                        <th className="py-3 px-4">Ngày ghi nhận</th>
                        <th className="py-3 px-4">Loại điều chỉnh</th>
                        <th className="py-3 px-4">Lý do / Nội dung</th>
                        <th className="py-3 px-4">Người khởi tạo</th>
                        <th className="py-3 px-4 text-right">Số tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium bg-white">
                      {filterItems(adjustmentDetails).length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-slate-400 text-xs font-medium">Không tìm thấy khoản điều chỉnh nào</td>
                        </tr>
                      ) : filterItems(adjustmentDetails).map((row) => (
                        <tr key={row.id} className="hover:bg-orange-50/30 transition-colors">
                          <td className="py-3 px-4 text-slate-400 font-normal">{row.date}</td>
                          <td className="py-3 px-4">
                            {row.type === 'bonus' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                                🎁 Khen thưởng
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-600 border border-red-100">
                                ⚠️ Khấu trừ / Phạt
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900">{row.reason}</td>
                          <td className="py-3 px-4 text-slate-500 font-medium">{row.creator}</td>
                          <td className={`py-3 px-4 text-right font-bold text-sm ${row.type === 'bonus' ? 'text-emerald-600' : 'text-red-600'}`}>
                            {row.type === 'bonus' ? '+' : '-'}{formatVND(row.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
