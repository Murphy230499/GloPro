'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, CalendarDays, DollarSign, Award, Clock, Users, Gift, 
  Receipt, ShoppingBag, Sparkles, AlertCircle, FileText, CheckCircle2, ShieldAlert,
  Printer, Download, Search, CheckCircle, TrendingUp, UserCheck, CreditCard, ChevronRight,
  BadgeCheck, Table, FileCheck, Layers, FileSpreadsheet, HeartHandshake, Tag, Filter,
  Pencil, Trash2, Plus, X
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
  { id: 'all_metrics', label: 'Bảng tổng hợp hạch toán' },
  { id: 'commission', label: 'Hoa hồng phát sinh' },
  { id: 'revenue', label: 'Doanh thu đóng góp' },
  { id: 'tip', label: 'Tiền Tip khách hàng' },
  { id: 'shifts', label: 'Ca làm & Chấm công' },
  { id: 'adjustments', label: 'Thưởng & Phạt' },
];

const CATEGORY_FILTERS = [
  { id: 'ALL', label: 'Tất cả 10 hạng mục' },
  { id: 'DV', label: '1. Dịch vụ' },
  { id: 'LT', label: '2. Liệu trình' },
  { id: 'GDV', label: '3. Gói dịch vụ' },
  { id: 'CBDV', label: '4. Combo dịch vụ' },
  { id: 'SP', label: '5. Sản phẩm' },
  { id: 'CMSP', label: '6. Combo sản phẩm' },
  { id: 'TTM', label: '7. Thẻ tiền mặt' },
  { id: 'HHKYC', label: '8. Hoa hồng khách yêu cầu' },
  { id: 'HHTC', label: '9. Hoa hồng tăng ca' },
  { id: 'HHDT', label: '10. Hoa hồng theo doanh thu' },
];

const REVENUE_CATEGORY_FILTERS = [
  { id: 'ALL', label: 'Tất cả 7 hạng mục doanh thu' },
  { id: 'DV', label: '1. Dịch vụ' },
  { id: 'LT', label: '2. Liệu trình' },
  { id: 'GDV', label: '3. Gói dịch vụ' },
  { id: 'CBDV', label: '4. Combo dịch vụ' },
  { id: 'SP', label: '5. Sản phẩm' },
  { id: 'CMSP', label: '6. Combo sản phẩm' },
  { id: 'TTM', label: '7. Thẻ tiền mặt' },
];

const CATEGORY_BADGE_STYLES = {
  DV: 'bg-blue-50 text-blue-700 border-blue-200/80',
  LT: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
  GDV: 'bg-purple-50 text-purple-700 border-purple-200/80',
  CBDV: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200/80',
  SP: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  CMSP: 'bg-teal-50 text-teal-700 border-teal-200/80',
  TTM: 'bg-cyan-50 text-cyan-700 border-cyan-200/80',
  HHKYC: 'bg-orange-50 text-orange-700 border-orange-200/80',
  HHTC: 'bg-amber-50 text-amber-700 border-amber-200/80',
  HHDT: 'bg-rose-50 text-rose-700 border-rose-200/80',
};

const SHIFT_BADGE_STYLES = {
  'Ca sáng': 'bg-blue-50 text-blue-700 border-blue-200',
  'Ca chiều': 'bg-purple-50 text-purple-700 border-purple-200',
  'Ca tối': 'bg-amber-50 text-amber-700 border-amber-200',
  'Tăng ca': 'bg-orange-50 text-orange-700 border-orange-200',
  'Nghỉ phép': 'bg-slate-100 text-slate-600 border-slate-200',
};

const ATTENDANCE_STATUS_STYLES = {
  'Đủ công': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Đi muộn': 'bg-amber-50 text-amber-700 border-amber-200',
  'Về sớm': 'bg-orange-50 text-orange-700 border-orange-200',
  'Nghỉ phép': 'bg-slate-100 text-slate-600 border-slate-200',
};

export default function StaffPayrollDetailView({ staffData, dateRange, onBack }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('all_metrics');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedAdjFilter, setSelectedAdjFilter] = useState('ALL');
  
  const [allRecords, setAllRecords] = useState([]);
  const [tipRecords, setTipRecords] = useState([]);
  const [shiftDetails, setShiftDetails] = useState([]);
  const [adjustmentDetails, setAdjustmentDetails] = useState([]);

  // Adjustments Modal State
  const [isAdjModalOpen, setIsAdjModalOpen] = useState(false);
  const [editingAdj, setEditingAdj] = useState(null);
  const [adjFormData, setAdjFormData] = useState({
    type: 'bonus',
    reason: '',
    amount: '',
    date: format(new Date(), 'dd/MM/yyyy'),
    creator: 'Quản lý salon'
  });

  useEffect(() => {
    if (!staffData) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const invoices = await base44.entities.Invoice.list().catch(() => []);
        const loadedRecords = [];
        const loadedTips = [];

        (invoices || []).forEach(inv => {
          if (inv.status !== 'paid' && inv.status !== 'completed') return;
          (inv.items || []).forEach(it => {
            if (it.staff_id === staffData.id) {
              const itemType = it.item_type || (it.service_id ? 'service' : it.product_id ? 'product' : 'service');
              
              let categoryKey = 'DV';
              let categoryLabel = 'Dịch vụ';
              if (itemType === 'product') { categoryKey = 'SP'; categoryLabel = 'Sản phẩm'; }
              else if (itemType === 'package') { categoryKey = 'GDV'; categoryLabel = 'Gói dịch vụ'; }
              else if (itemType === 'treatment') { categoryKey = 'LT'; categoryLabel = 'Liệu trình'; }
              else if (itemType === 'prepaid') { categoryKey = 'TTM'; categoryLabel = 'Thẻ tiền mặt'; }

              const sysCode = inv.invoice_code || inv.code || ('HD' + format(new Date(inv.created_at || Date.now()), 'yyyyMMdd') + '-001');

              const record = {
                id: it.id || 'it_' + Math.random().toString(36).substr(2, 6),
                invoiceId: inv.id,
                invoiceCode: sysCode,
                customerName: inv.customer_name || 'Chị Ngọc Mai',
                customerPhone: inv.customer_phone || '0988 123 456',
                customerAvatar: inv.customer_avatar || '',
                date: inv.created_at ? format(new Date(inv.created_at), 'dd/MM/yyyy HH:mm') : '21/07/2026 14:30',
                itemName: it.name || 'Dịch vụ / Sản phẩm',
                categoryKey: categoryKey,
                categoryLabel: categoryLabel,
                qty: it.qty || 1,
                price: it.price || 0,
                revenueVal: (it.price || 0) * (it.qty || 1),
                commissionRate: it.commission_rate || 10,
                commissionVal: it.commission_val || Math.round((it.price || 0) * 0.1),
                isCustomerRequested: !!it.is_customer_requested,
                requestedBonus: it.is_customer_requested ? 20000 : 0
              };

              loadedRecords.push(record);
            }
          });
        });

        // System Format Mock Records (HDYYYYMMDD-XXX)
        if (loadedRecords.length === 0) {
          loadedRecords.push(
            { id: 'r1', invoiceId: 'inv_8821', invoiceCode: 'HD20260721-001', customerName: 'Chị Ngọc Mai', customerPhone: '0988 123 456', customerAvatar: '', date: '21/07/2026 14:30', itemName: 'Gội đầu dưỡng sinh VIP 9 bước', categoryKey: 'DV', categoryLabel: 'Dịch vụ', qty: 1, price: 250000, revenueVal: 250000, commissionRate: 10, commissionVal: 25000 },
            { id: 'r2', invoiceId: 'inv_8819', invoiceCode: 'HD20260720-002', customerName: 'Anh Hoàng Nam', customerPhone: '0912 345 678', customerAvatar: '', date: '20/07/2026 10:15', itemName: 'Cắt uốn tóc Stylist chuyên nghiệp', categoryKey: 'DV', categoryLabel: 'Dịch vụ', qty: 1, price: 350000, revenueVal: 350000, commissionRate: 12, commissionVal: 42000 },
            { id: 'r3', invoiceId: 'inv_8805', invoiceCode: 'HD20260719-003', customerName: 'Chị Minh Hà', customerPhone: '0903 888 999', customerAvatar: '', date: '19/07/2026 16:20', itemName: 'Liệu trình Thải độc da (Buổi 3/10)', categoryKey: 'LT', categoryLabel: 'Liệu trình', qty: 1, price: 500000, revenueVal: 500000, commissionRate: 8, commissionVal: 40000 },
            { id: 'r4', invoiceId: 'inv_8798', invoiceCode: 'HD20260718-004', customerName: 'Chị Phương Thảo', customerPhone: '0977 112 233', customerAvatar: '', date: '18/07/2026 11:00', itemName: 'Gói Chăm sóc Da Toàn Diện 5 buổi', categoryKey: 'GDV', categoryLabel: 'Gói dịch vụ', qty: 1, price: 1500000, revenueVal: 1500000, commissionRate: 5, commissionVal: 75000 },
            { id: 'r5', invoiceId: 'inv_8785', invoiceCode: 'HD20260717-005', customerName: 'Anh Quốc Bảo', customerPhone: '0933 445 566', customerAvatar: '', date: '17/07/2026 15:40', itemName: 'Combo Nhuộm + Phục hồi Olaplex', categoryKey: 'CBDV', categoryLabel: 'Combo dịch vụ', qty: 1, price: 850000, revenueVal: 850000, commissionRate: 10, commissionVal: 85000 },
            { id: 'r6', invoiceId: 'inv_8821', invoiceCode: 'HD20260721-001', customerName: 'Chị Ngọc Mai', customerPhone: '0988 123 456', customerAvatar: '', date: '21/07/2026 14:30', itemName: 'Dầu gội phục hồi Keratin 500ml', categoryKey: 'SP', categoryLabel: 'Sản phẩm', qty: 1, price: 450000, revenueVal: 450000, commissionRate: 5, commissionVal: 22500 },
            { id: 'r7', invoiceId: 'inv_8770', invoiceCode: 'HD20260716-006', customerName: 'Chị Linh Chi', customerPhone: '0966 778 899', customerAvatar: '', date: '16/07/2026 09:15', itemName: 'Combo Bộ Gội Xả Dưỡng Tóc Cao Cấp', categoryKey: 'CMSP', categoryLabel: 'Combo sản phẩm', qty: 1, price: 780000, revenueVal: 780000, commissionRate: 6, commissionVal: 46800 },
            { id: 'r8', invoiceId: 'inv_8762', invoiceCode: 'HD20260715-007', customerName: 'Anh Tuấn Kiệt', customerPhone: '0909 223 344', customerAvatar: '', date: '15/07/2026 14:10', itemName: 'Thẻ Tiền Mặt Ưu Đãi 5.000.000đ', categoryKey: 'TTM', categoryLabel: 'Thẻ tiền mặt', qty: 1, price: 5000000, revenueVal: 5000000, commissionRate: 3, commissionVal: 150000 },
            { id: 'r9', invoiceId: 'inv_8790', invoiceCode: 'HD20260718-008', customerName: 'Chị Phương Thảo', customerPhone: '0977 112 233', customerAvatar: '', date: '18/07/2026 16:45', itemName: 'Khách chọn đích danh KTV phục vụ', categoryKey: 'HHKYC', categoryLabel: 'Khách yêu cầu', qty: 1, price: 50000, revenueVal: 50000, commissionRate: 100, commissionVal: 20000 },
            { id: 'r10', invoiceId: 'inv_8740', invoiceCode: 'HD20260714-009', customerName: 'Chị Ánh Tuyết', customerPhone: '0918 667 788', customerAvatar: '', date: '14/07/2026 21:00', itemName: 'Phụ thu tăng ca ngoài giờ quy định', categoryKey: 'HHTC', categoryLabel: 'Tăng ca', qty: 1, price: 100000, revenueVal: 100000, commissionRate: 100, commissionVal: 35000 },
            { id: 'r11', invoiceId: 'inv_sys01', invoiceCode: 'HD20260731-010', customerName: 'Salon Hệ Thống', customerPhone: '--', customerAvatar: '', date: '31/07/2026 18:00', itemName: 'Thưởng vượt chỉ tiêu doanh thu tháng', categoryKey: 'HHDT', categoryLabel: 'Doanh thu', qty: 1, price: 15000000, revenueVal: 15000000, commissionRate: 2, commissionVal: 300000 }
          );
        }

        // System Format Tip Records
        if (loadedTips.length === 0) {
          loadedTips.push(
            { id: 'tip_1', invoiceId: 'inv_8821', invoiceCode: 'HD20260721-001', customerName: 'Chị Ngọc Mai', customerPhone: '0988 123 456', customerAvatar: '', date: '21/07/2026 14:30', itemName: 'Gội đầu dưỡng sinh VIP 9 bước', tipAmount: 50000 },
            { id: 'tip_2', invoiceId: 'inv_8819', invoiceCode: 'HD20260720-002', customerName: 'Anh Hoàng Nam', customerPhone: '0912 345 678', customerAvatar: '', date: '20/07/2026 10:15', itemName: 'Cắt uốn tóc Stylist chuyên nghiệp', tipAmount: 50000 },
            { id: 'tip_3', invoiceId: 'inv_8790', invoiceCode: 'HD20260718-008', customerName: 'Chị Phương Thảo', customerPhone: '0977 112 233', customerAvatar: '', date: '18/07/2026 16:45', itemName: 'Sơn Gel cao cấp & Nối mụn', tipAmount: 50000 }
          );
        }

        // Mock Shifts with Color & Tracking Status
        const mockShifts = [
          { date: '22/07/2026', shiftName: 'Ca sáng', shiftTime: '08:00 - 16:00', hours: 8, timeIn: '07:55', timeOut: '16:05', status: 'Đủ công', isDayOff: false },
          { date: '21/07/2026', shiftName: 'Ca sáng', shiftTime: '08:00 - 16:00', hours: 8, timeIn: '08:12', timeOut: '16:00', status: 'Đi muộn', isDayOff: false },
          { date: '20/07/2026', shiftName: 'Nghỉ phép', shiftTime: '--', hours: 0, timeIn: '--', timeOut: '--', status: 'Nghỉ phép', isDayOff: true },
          { date: '19/07/2026', shiftName: 'Tăng ca', shiftTime: '14:00 - 22:00', hours: 9, timeIn: '13:50', timeOut: '22:50', status: 'Đủ công', isDayOff: false },
          { date: '18/07/2026', shiftName: 'Ca sáng', shiftTime: '08:00 - 16:00', hours: 8, timeIn: '07:58', timeOut: '15:30', status: 'Về sớm', isDayOff: false },
        ];

        const mockAdjustments = [
          { id: 'adj_1', date: '15/07/2026', type: 'bonus', amount: 200000, reason: 'Thưởng KTV xuất sắc tuần 2', creator: 'Quản lý salon' },
          { id: 'adj_2', date: '10/07/2026', type: 'penalty', amount: 50000, reason: 'Vi phạm đồng phục quy định', creator: 'Quản lý salon' }
        ];

        setAllRecords(loadedRecords);
        setTipRecords(loadedTips);
        setShiftDetails(mockShifts);
        setAdjustmentDetails(mockAdjustments);

      } catch (err) {
        console.error('Lỗi nạp chi tiết lương:', err);
      }
      setLoading(false);
    };

    loadData();
  }, [staffData]);

  if (!staffData) return null;

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

  const handleNavigateInvoice = (invId) => {
    if (!invId) {
      toast.info('Xem thông tin hóa đơn hệ thống');
      router.push('/invoices');
      return;
    }
    router.push(`/invoices/${invId}`);
  };

  // Adjustments Modal Handlers
  const handleOpenAddAdj = () => {
    setEditingAdj(null);
    setAdjFormData({
      type: 'bonus',
      reason: '',
      amount: '',
      date: format(new Date(), 'dd/MM/yyyy'),
      creator: 'Quản lý salon'
    });
    setIsAdjModalOpen(true);
  };

  const handleEditAdj = (row) => {
    setEditingAdj(row);
    setAdjFormData({
      type: row.type,
      reason: row.reason,
      amount: row.amount,
      date: row.date,
      creator: row.creator || 'Quản lý salon'
    });
    setIsAdjModalOpen(true);
  };

  const handleDeleteAdj = (id) => {
    setAdjustmentDetails(prev => prev.filter(item => item.id !== id));
    toast.success('Đã xóa khoản điều chỉnh');
  };

  const handleSaveAdj = (e) => {
    e.preventDefault();
    if (!adjFormData.reason.trim()) {
      toast.error('Vui lòng nhập lý do điều chỉnh');
      return;
    }
    const numAmount = Number(adjFormData.amount) || 0;
    if (numAmount <= 0) {
      toast.error('Vui lòng nhập số tiền hợp lệ (> 0)');
      return;
    }

    if (editingAdj) {
      setAdjustmentDetails(prev => prev.map(item => item.id === editingAdj.id ? {
        ...item,
        type: adjFormData.type,
        reason: adjFormData.reason,
        amount: numAmount,
        date: adjFormData.date,
        creator: adjFormData.creator
      } : item));
      toast.success('Đã cập nhật khoản điều chỉnh');
    } else {
      const newRecord = {
        id: 'adj_' + Date.now(),
        type: adjFormData.type,
        reason: adjFormData.reason,
        amount: numAmount,
        date: adjFormData.date || format(new Date(), 'dd/MM/yyyy'),
        creator: adjFormData.creator || 'Quản lý salon'
      };
      setAdjustmentDetails(prev => [newRecord, ...prev]);
      toast.success('Đã thêm khoản điều chỉnh mới');
    }

    setIsAdjModalOpen(false);
  };

  const filterRecords = (list) => {
    let result = list;
    if (selectedCategory !== 'ALL') {
      result = result.filter(r => r.categoryKey === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(item => 
        (item.itemName && item.itemName.toLowerCase().includes(q)) ||
        (item.customerName && item.customerName.toLowerCase().includes(q)) ||
        (item.customerPhone && item.customerPhone.includes(q)) ||
        (item.invoiceCode && item.invoiceCode.toLowerCase().includes(q)) ||
        (item.reason && item.reason.toLowerCase().includes(q)) ||
        (item.shiftName && item.shiftName.toLowerCase().includes(q))
      );
    }
    return result;
  };

  // Filtered lists for active tabs
  const filteredComms = filterRecords(allRecords);
  const filteredRevenues = filterRecords(allRecords).filter(r => r.categoryKey !== 'HHKYC' && r.categoryKey !== 'HHTC' && r.categoryKey !== 'HHDT');
  const filteredTips = tipRecords.filter(t => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (t.customerName && t.customerName.toLowerCase().includes(q)) ||
           (t.customerPhone && t.customerPhone.includes(q)) ||
           (t.invoiceCode && t.invoiceCode.toLowerCase().includes(q)) ||
           (t.itemName && t.itemName.toLowerCase().includes(q));
  });
  const filteredShifts = shiftDetails.filter(s => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (s.shiftName && s.shiftName.toLowerCase().includes(q)) || (s.status && s.status.toLowerCase().includes(q));
  });

  const filteredAdjustments = adjustmentDetails.filter(a => {
    if (selectedAdjFilter !== 'ALL' && a.type !== selectedAdjFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (a.reason && a.reason.toLowerCase().includes(q)) || (a.creator && a.creator.toLowerCase().includes(q));
  });

  // Commission Tab Totals
  const commTotalSales = filteredComms.reduce((sum, r) => sum + (r.revenueVal || 0), 0);
  const commTotalComms = filteredComms.reduce((sum, r) => sum + (r.commissionVal || 0), 0);

  // Revenue Tab Totals
  const revTotalQty = filteredRevenues.reduce((sum, r) => sum + (r.qty || 1), 0);
  const revTotalSales = filteredRevenues.reduce((sum, r) => sum + (r.revenueVal || 0), 0);

  // Tip Tab Totals
  const tipTotalSum = filteredTips.reduce((sum, r) => sum + (r.tipAmount || 0), 0);

  // Shifts Totals
  const shiftTotalHours = filteredShifts.reduce((sum, r) => sum + (r.hours || 0), 0);
  const shiftOffCount = filteredShifts.filter(s => s.isDayOff).length;

  // Adjustments Totals
  const adjTotalBonus = filteredAdjustments.filter(a => a.type === 'bonus').reduce((sum, a) => sum + (a.amount || 0), 0);
  const adjTotalPenalty = filteredAdjustments.filter(a => a.type === 'penalty').reduce((sum, a) => sum + (a.amount || 0), 0);

  return (
    <div className="w-full space-y-4 font-sans text-slate-800 antialiased animate-in fade-in duration-200">
      
      {/* ================= 1. MINIMALIST BREADCRUMB & HEADER BAR ================= */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-white px-5 py-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Quay lại danh sách
          </button>

          <div className="h-4 w-[1px] bg-slate-200 hidden sm:block" />

          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <span>Bảng tính lương</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span>Bảng lương nhân viên</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-slate-900 font-bold">{staffData.name}</span>
          </div>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs transition-colors cursor-pointer shadow-2xs"
        >
          <Printer className="w-3.5 h-3.5" /> In phiếu lương
        </button>
      </div>

      {/* ================= 2. CLEAN PROFILE HEADER ================= */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-4">
          <Avatar src={staffData.avatar_url} name={staffData.name} size={48} color={staffData.avatar_color} />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">{staffData.name}</h2>
              <span 
                className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                style={{ background: (ROLES[staffData.role]?.color || '#94A3B8') + '20', color: ROLES[staffData.role]?.color || '#94A3B8' }}
              >
                {ROLES[staffData.role]?.label || staffData.role}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-normal mt-1 flex items-center gap-2">
              <span>Mã NV: NV-{(staffData.id || '').substring(0, 4).toUpperCase()}</span>
              <span>•</span>
              <span>Kỳ đối soát: {dateFromStr} - {dateToStr}</span>
            </p>
          </div>
        </div>
      </div>

      {/* ================= 2.1 EXECUTIVE OVERVIEW METRIC CARDS ================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Card 1: Lương CB */}
        <div className="bg-white p-4 sm:p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-xs font-semibold text-slate-500">Lương cơ bản</span>
            <DollarSign className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-base font-bold text-slate-900">{formatVND(staffData.salary || 0)}</div>
          <span className="text-xs font-normal text-slate-500 mt-0.5 block">Hợp đồng chính</span>
        </div>

        {/* Card 2: Ca & Giờ làm */}
        <div className="bg-white p-4 sm:p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-xs font-semibold text-slate-500">Ca / Giờ làm</span>
            <Clock className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-base font-bold text-slate-900">{staffData.shifts || '0 Ca'}</div>
          <span className="text-xs font-normal text-slate-500 mt-0.5 block">Nghỉ {staffData.daysOff || 0} ngày</span>
        </div>

        {/* Card 3: Tổng hoa hồng */}
        <div className="bg-white p-4 sm:p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-xs font-semibold text-orange-600">Tổng hoa hồng</span>
            <TrendingUp className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-base font-bold text-orange-600">+{formatVND(totalCommissionSum)}</div>
          <span className="text-xs font-normal text-slate-500 mt-0.5 block">10 hạng mục phát sinh</span>
        </div>

        {/* Card 4: Thưởng & Tip */}
        <div className="bg-white p-4 sm:p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-xs font-semibold text-emerald-600">Thưởng & Tip</span>
            <Gift className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-base font-bold text-emerald-600">+{formatVND((staffData.bonus || 0) + (staffData.tip || 0))}</div>
          <span className="text-xs font-normal text-slate-500 mt-0.5 block">Tip ({formatVND(staffData.tip || 0)})</span>
        </div>

        {/* Card 5: Phạt & Khấu trừ */}
        <div className="bg-white p-4 sm:p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-xs font-semibold text-red-500">Khấu trừ phạt</span>
            <AlertCircle className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-base font-bold text-red-600">-{formatVND(staffData.penalty || 0)}</div>
          <span className="text-xs font-normal text-slate-500 mt-0.5 block">Vi phạm quy định</span>
        </div>

        {/* Card 6: Lương Thực Nhận (Net Total) */}
        <div className="bg-gradient-to-br from-orange-500 to-amber-500 text-white p-4 sm:p-4.5 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-orange-100 mb-1.5">
            <span className="text-xs font-bold">Thực nhận (Net)</span>
            <BadgeCheck className="w-4 h-4 text-white" />
          </div>
          <div className="text-base font-bold text-white">{formatVND(staffData.total || 0)}</div>
          <span className="text-xs font-medium text-orange-100 mt-0.5 block">Đã chốt sổ</span>
        </div>
      </div>

      {/* ================= 3. UNIFIED SUB-TABS & FINANCIAL STATEMENT ================= */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-5">
        
        {/* Clean Underline Sub-tab Bar + Integrated Search */}
        <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-200 pb-1.5 font-sans">
          <div className="flex items-center gap-6 overflow-x-auto scrollbar-none px-1">
            {DETAIL_TABS.map((t) => {
              let count = 0;
              if (t.id === 'commission') count = filteredComms.length;
              if (t.id === 'revenue') count = filteredRevenues.length;
              if (t.id === 'tip') count = filteredTips.length;
              if (t.id === 'shifts') count = filteredShifts.length;
              if (t.id === 'adjustments') count = filteredAdjustments.length;

              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => { setActiveTab(t.id); setSearchQuery(''); setSelectedCategory('ALL'); setSelectedAdjFilter('ALL'); }}
                  className={`py-2 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === t.id
                      ? 'border-orange-500 text-orange-500'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span>{t.label}</span>
                  {t.id !== 'all_metrics' && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${activeTab === t.id ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500'}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200 w-48 sm:w-64 focus-within:border-orange-500 focus-within:bg-white transition-all mb-1">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input 
              type="text"
              placeholder="Tìm hóa đơn, khách..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs font-medium text-slate-700 bg-transparent focus:outline-none placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* TAB 0: SINGLE FINANCIAL STATEMENT TABLE (Phiếu Bảng Lương Tổng Hợp) */}
        {activeTab === 'all_metrics' && (
          <div className="overflow-x-auto rounded-xl border border-slate-200 animate-in fade-in duration-150">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-slate-50 font-semibold text-xs text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 w-1/3">Hạng mục hạch toán lương</th>
                  <th className="py-3 px-4 text-center">Số lượng / Ghi chú</th>
                  <th className="py-3 px-4 text-right">Doanh số / Doanh thu</th>
                  <th className="py-3 px-4 text-right">Số tiền hạch toán (VNĐ)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium bg-white text-slate-700">
                
                {/* SECTION 1: LƯƠNG CƠ BẢN & CHẤM CÔNG */}
                <tr className="bg-slate-50/70">
                  <td colSpan={4} className="py-3 px-4 font-bold text-slate-900 text-xs">
                    I. Lương cơ bản & Chấm công
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-800 pl-8">Lương cơ bản hợp đồng</td>
                  <td className="py-3 px-4 text-center text-slate-600 font-medium">Hợp đồng chính thức</td>
                  <td className="py-3 px-4 text-right text-slate-400">--</td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">{formatVND(staffData.salary || 0)}</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-800 pl-8">Tổng số ca làm việc</td>
                  <td className="py-3 px-4 text-center text-slate-700 font-bold">{staffData.shifts || '0 Ca'}</td>
                  <td className="py-3 px-4 text-right text-slate-400">--</td>
                  <td className="py-3 px-4 text-right text-slate-500 font-medium">Theo ca quy định</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-800 pl-8">Số ngày nghỉ phép</td>
                  <td className="py-3 px-4 text-center text-slate-700 font-bold">{staffData.daysOff || 0} ngày</td>
                  <td className="py-3 px-4 text-right text-slate-400">--</td>
                  <td className="py-3 px-4 text-right text-slate-500 font-medium">Không trừ lương</td>
                </tr>

                {/* SECTION 2: TỔNG HOA HỒNG PHÁT SINH */}
                <tr className="bg-slate-50/70">
                  <td colSpan={3} className="py-3 px-4 font-bold text-slate-900 text-xs">
                    II. Tổng hoa hồng phát sinh
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-orange-600">
                    +{formatVND(totalCommissionSum)}
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-800 pl-8">1. Hoa hồng Dịch vụ</td>
                  <td className="py-3 px-4 text-center text-slate-700 font-medium">{staffData.noServices || 0} lượt</td>
                  <td className="py-3 px-4 text-right text-slate-700">{formatVND(staffData.serviceSales || 0)}</td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">{formatVND(staffData.serviceCom || 0)}</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-800 pl-8">2. Hoa hồng Liệu trình</td>
                  <td className="py-3 px-4 text-center text-slate-700 font-medium">{staffData.noTreatment || 0} ca</td>
                  <td className="py-3 px-4 text-right text-slate-700">{formatVND(staffData.treatmentSales || 0)}</td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">{formatVND(staffData.treatmentCom || 0)}</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-800 pl-8">3. Hoa hồng Gói dịch vụ</td>
                  <td className="py-3 px-4 text-center text-slate-700 font-medium">{staffData.noPackage || 0} gói</td>
                  <td className="py-3 px-4 text-right text-slate-700">{formatVND(staffData.packageSales || 0)}</td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">{formatVND(staffData.packageCom || 0)}</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-800 pl-8">4. Hoa hồng Combo dịch vụ</td>
                  <td className="py-3 px-4 text-center text-slate-700 font-medium">{staffData.noServiceCombo || 0} combo</td>
                  <td className="py-3 px-4 text-right text-slate-700">{formatVND(staffData.serviceComboSales || 0)}</td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">{formatVND(staffData.serviceComboCom || 0)}</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-800 pl-8">5. Hoa hồng Sản phẩm</td>
                  <td className="py-3 px-4 text-center text-slate-700 font-medium">{staffData.noProduct || 0} món</td>
                  <td className="py-3 px-4 text-right text-slate-700">{formatVND(staffData.productSales || 0)}</td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">{formatVND(staffData.productCom || 0)}</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-800 pl-8">6. Hoa hồng Combo sản phẩm</td>
                  <td className="py-3 px-4 text-center text-slate-700 font-medium">{staffData.noProductCombo || 0} combo</td>
                  <td className="py-3 px-4 text-right text-slate-700">{formatVND(staffData.productComboSales || 0)}</td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">{formatVND(staffData.productComboCom || 0)}</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-800 pl-8">7. Hoa hồng Thẻ tiền mặt</td>
                  <td className="py-3 px-4 text-center text-slate-700 font-medium">{staffData.noPrepaidCard || 0} thẻ</td>
                  <td className="py-3 px-4 text-right text-slate-700">{formatVND(staffData.prepaidCardSales || 0)}</td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">{formatVND(staffData.prepaidCardCom || 0)}</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-800 pl-8">8. Hoa hồng khách yêu cầu</td>
                  <td className="py-3 px-4 text-center text-slate-700 font-medium">Yêu cầu KTV</td>
                  <td className="py-3 px-4 text-right text-slate-400">Phụ thu chọn KTV</td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">{formatVND(staffData.requestedCom || 0)}</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-800 pl-8">9. Hoa hồng tăng ca</td>
                  <td className="py-3 px-4 text-center text-slate-700 font-medium">Tăng ca</td>
                  <td className="py-3 px-4 text-right text-slate-400">Ngoài giờ quy định</td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">{formatVND(staffData.overtimeCom || 0)}</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-800 pl-8">10. Hoa hồng theo doanh thu</td>
                  <td className="py-3 px-4 text-center text-slate-700 font-medium">Theo doanh thu</td>
                  <td className="py-3 px-4 text-right text-slate-400">Thưởng chỉ tiêu DS</td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">{formatVND(staffData.revenueCom || 0)}</td>
                </tr>

                {/* SECTION 3: THƯỞNG, TIP & KHẤU TRỪ */}
                <tr className="bg-slate-50/70">
                  <td colSpan={4} className="py-3 px-4 font-bold text-slate-900 text-xs">
                    III. Thưởng, Tip & Khấu trừ phạt
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-800 pl-8">1. Tiền Tip trực tiếp từ khách hàng</td>
                  <td className="py-3 px-4 text-center text-slate-500 font-medium">Tiền Tip</td>
                  <td className="py-3 px-4 text-right text-slate-400">--</td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-600">+{formatVND(staffData.tip || 0)}</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-800 pl-8">2. Thưởng khen thưởng xuất sắc</td>
                  <td className="py-3 px-4 text-center text-slate-500 font-medium">Khen thưởng</td>
                  <td className="py-3 px-4 text-right text-slate-400">--</td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-600">+{formatVND(staffData.bonus || 0)}</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-800 pl-8">3. Tiền phạt vi phạm / Khấu trừ</td>
                  <td className="py-3 px-4 text-center text-slate-500 font-medium">Khấu trừ</td>
                  <td className="py-3 px-4 text-right text-slate-400">--</td>
                  <td className="py-3 px-4 text-right font-bold text-red-600">-{formatVND(staffData.penalty || 0)}</td>
                </tr>

                {/* GRAND TOTAL NET SALARY */}
                <tr className="bg-orange-50/80 border-t-2 border-orange-200 text-slate-900 font-bold text-xs">
                  <td colSpan={2} className="py-3.5 px-4 text-slate-900 font-bold">
                    Tổng lương thực nhận kỳ này (Net Total)
                  </td>
                  <td className="py-3.5 px-4 text-right font-medium text-slate-500">
                    = (I) + (II) + (III)
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-sm text-orange-600">
                    {formatVND(staffData.total || 0)}
                  </td>
                </tr>

              </tbody>
            </table>
          </div>
        )}

        {/* TAB 1: COMMISSION (Hoa Hồng Phát Sinh - 10 Loại) */}
        {activeTab === 'commission' && (
          <div className="space-y-3.5 animate-in fade-in duration-150">
            
            {/* 10 Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 mr-1 shrink-0">
                <Filter className="w-3.5 h-3.5 text-slate-400" /> Lọc hạng mục:
              </span>
              {CATEGORY_FILTERS.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    selectedCategory === cat.id
                      ? 'bg-orange-500 text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Tab Summary Stat Bar */}
            <div className="flex flex-wrap items-center gap-6 bg-slate-50/80 px-4 py-3 rounded-2xl border border-slate-200/80 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">Tổng số lượt/đơn hoa hồng:</span>
                <span className="font-bold text-slate-900">{filteredComms.length} lượt</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">Tổng doanh số hạch toán:</span>
                <span className="font-bold text-slate-900">{formatVND(commTotalSales)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-orange-600 font-semibold">Tổng hoa hồng nhận:</span>
                <span className="font-bold text-orange-600">+{formatVND(commTotalComms)}</span>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200/80 shadow-2xs">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-xs text-slate-500">
                  <tr>
                    <th className="py-3 px-4">Mã hóa đơn</th>
                    <th className="py-3 px-4">Ngày tạo hóa đơn</th>
                    <th className="py-3 px-4">Khách hàng</th>
                    <th className="py-3 px-4">Tên sản phẩm / dịch vụ</th>
                    <th className="py-3 px-4 text-right">Doanh số (VNĐ)</th>
                    <th className="py-3 px-4 text-center">% Hoa hồng</th>
                    <th className="py-3 px-4 text-right">Số tiền hoa hồng (VNĐ)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium bg-white text-slate-700">
                  {filteredComms.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-400 text-xs font-medium">Không tìm thấy khoản hoa hồng phù hợp</td>
                    </tr>
                  ) : filteredComms.map((row) => (
                    <tr key={row.id} className="hover:bg-orange-50/30 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900 align-middle">
                        <button
                          type="button"
                          onClick={() => handleNavigateInvoice(row.invoiceId)}
                          className="text-orange-600 hover:text-orange-700 hover:underline font-bold transition-colors cursor-pointer text-left"
                          title="Click để xem chi tiết hóa đơn"
                        >
                          {row.invoiceCode}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-normal align-middle">{row.date}</td>
                      <td className="py-3.5 px-4 align-middle">
                        <div className="flex items-center gap-2.5">
                          <Avatar 
                            name={row.customerName} 
                            src={row.customerAvatar} 
                            size={30} 
                            onClick={() => router.push(`/customers?name=${encodeURIComponent(row.customerName)}`)}
                            title="Click để xem chi tiết khách hàng"
                          />
                          <div>
                            <button
                              type="button"
                              onClick={() => router.push(`/customers?name=${encodeURIComponent(row.customerName)}`)}
                              className="font-bold text-slate-800 leading-tight hover:text-orange-600 hover:underline cursor-pointer text-left block"
                              title="Click để xem chi tiết khách hàng"
                            >
                              {row.customerName}
                            </button>
                            <div className="text-[11px] text-slate-400 font-normal mt-0.5">{row.customerPhone}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 align-middle">
                        <div className="font-bold text-slate-900 leading-tight">{row.itemName}</div>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border inline-block mt-1 ${CATEGORY_BADGE_STYLES[row.categoryKey] || 'bg-slate-100 text-slate-600'}`}>
                          {row.categoryLabel}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-slate-800 align-middle">{formatVND(row.revenueVal)}</td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-700 align-middle">{row.commissionRate}%</td>
                      <td className="py-3.5 px-4 text-right font-bold text-orange-600 align-middle">+{formatVND(row.commissionVal)}</td>
                    </tr>
                  ))}
                </tbody>
                {filteredComms.length > 0 && (
                  <tfoot className="bg-slate-50/90 border-t border-slate-200 font-bold text-xs">
                    <tr>
                      <td colSpan={4} className="py-3.5 px-4 text-slate-900 font-bold">Tổng cộng hoa hồng ({filteredComms.length} lượt)</td>
                      <td className="py-3.5 px-4 text-right text-slate-900">{formatVND(commTotalSales)}</td>
                      <td className="py-3.5 px-4 text-center text-slate-400">--</td>
                      <td className="py-3.5 px-4 text-right text-orange-600">+{formatVND(commTotalComms)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: REVENUE (Doanh Thu Đóng Góp - 7 Hạng Mục Doanh Thu Thực Tế) */}
        {activeTab === 'revenue' && (
          <div className="space-y-3.5 animate-in fade-in duration-150">
            
            {/* 7 Revenue Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 mr-1 shrink-0">
                <Filter className="w-3.5 h-3.5 text-slate-400" /> Lọc hạng mục:
              </span>
              {REVENUE_CATEGORY_FILTERS.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    selectedCategory === cat.id
                      ? 'bg-orange-500 text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Tab Summary Stat Bar */}
            <div className="flex flex-wrap items-center gap-6 bg-slate-50/80 px-4 py-3 rounded-2xl border border-slate-200/80 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">Tổng số lượng / đơn:</span>
                <span className="font-bold text-slate-900">{revTotalQty} đơn</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">Tổng doanh thu mang về:</span>
                <span className="font-bold text-slate-900">{formatVND(revTotalSales)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">Hoa hồng tương ứng:</span>
                <span className="font-bold text-orange-600">+{formatVND(commTotalComms)}</span>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200/80 shadow-2xs">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-xs text-slate-500">
                  <tr>
                    <th className="py-3 px-4">Mã hóa đơn</th>
                    <th className="py-3 px-4">Ngày tạo hóa đơn</th>
                    <th className="py-3 px-4">Khách hàng</th>
                    <th className="py-3 px-4">Hạng mục doanh thu</th>
                    <th className="py-3 px-4 text-center">Số lượng</th>
                    <th className="py-3 px-4 text-right">Đơn giá (VNĐ)</th>
                    <th className="py-3 px-4 text-right">Số tiền doanh thu (VNĐ)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium bg-white text-slate-700">
                  {filteredRevenues.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-400 text-xs font-medium">Không tìm thấy khoản doanh thu phù hợp</td>
                    </tr>
                  ) : filteredRevenues.map((row) => (
                    <tr key={row.id} className="hover:bg-orange-50/30 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900 align-middle">
                        <button
                          type="button"
                          onClick={() => handleNavigateInvoice(row.invoiceId)}
                          className="text-orange-600 hover:text-orange-700 hover:underline font-bold transition-colors cursor-pointer text-left"
                          title="Click để xem chi tiết hóa đơn"
                        >
                          {row.invoiceCode}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-normal align-middle">{row.date}</td>
                      <td className="py-3.5 px-4 align-middle">
                        <div className="flex items-center gap-2.5">
                          <Avatar 
                            name={row.customerName} 
                            src={row.customerAvatar} 
                            size={30} 
                            onClick={() => router.push(`/customers?name=${encodeURIComponent(row.customerName)}`)}
                            title="Click để xem chi tiết khách hàng"
                          />
                          <div>
                            <button
                              type="button"
                              onClick={() => router.push(`/customers?name=${encodeURIComponent(row.customerName)}`)}
                              className="font-bold text-slate-800 leading-tight hover:text-orange-600 hover:underline cursor-pointer text-left block"
                              title="Click để xem chi tiết khách hàng"
                            >
                              {row.customerName}
                            </button>
                            <div className="text-[11px] text-slate-400 font-normal mt-0.5">{row.customerPhone}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 align-middle">
                        <div className="font-bold text-slate-900 leading-tight">{row.itemName}</div>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border inline-block mt-1 ${CATEGORY_BADGE_STYLES[row.categoryKey] || 'bg-slate-100 text-slate-600'}`}>
                          {row.categoryLabel}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-800 align-middle">{row.qty}</td>
                      <td className="py-3.5 px-4 text-right font-semibold text-slate-800 align-middle">{formatVND(row.price)}</td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900 align-middle">{formatVND(row.revenueVal)}</td>
                    </tr>
                  ))}
                </tbody>
                {filteredRevenues.length > 0 && (
                  <tfoot className="bg-slate-50/90 border-t border-slate-200 font-bold text-xs">
                    <tr>
                      <td colSpan={4} className="py-3.5 px-4 text-slate-900 font-bold">Tổng cộng doanh thu ({filteredRevenues.length} đơn)</td>
                      <td className="py-3.5 px-4 text-center text-slate-900">{revTotalQty}</td>
                      <td className="py-3.5 px-4 text-right text-slate-400">--</td>
                      <td className="py-3.5 px-4 text-right text-slate-900">{formatVND(revTotalSales)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: TIP (Tiền Tip Khách Hàng) */}
        {activeTab === 'tip' && (
          <div className="space-y-3.5 animate-in fade-in duration-150">
            
            {/* Tab Summary Stat Bar */}
            <div className="flex flex-wrap items-center gap-6 bg-slate-50/80 px-4 py-3 rounded-2xl border border-slate-200/80 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">Tổng số lượt nhận Tip:</span>
                <span className="font-bold text-slate-900">{filteredTips.length} lượt</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-600 font-semibold">Tổng tiền Tip thực nhận:</span>
                <span className="font-bold text-emerald-600">+{formatVND(tipTotalSum)}</span>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200/80 shadow-2xs">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-xs text-slate-500">
                  <tr>
                    <th className="py-3 px-4">Mã hóa đơn</th>
                    <th className="py-3 px-4">Ngày tạo hóa đơn</th>
                    <th className="py-3 px-4">Khách hàng</th>
                    <th className="py-3 px-4">Dịch vụ / Sản phẩm phục vụ</th>
                    <th className="py-3 px-4 text-right">Số tiền Tip (VNĐ)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium bg-white text-slate-700">
                  {filteredTips.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-slate-400 text-xs font-medium">Chưa có khoản tiền Tip nào trong kỳ này</td>
                    </tr>
                  ) : filteredTips.map((row) => (
                    <tr key={row.id} className="hover:bg-orange-50/30 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900 align-middle">
                        <button
                          type="button"
                          onClick={() => handleNavigateInvoice(row.invoiceId)}
                          className="text-orange-600 hover:text-orange-700 hover:underline font-bold transition-colors cursor-pointer text-left"
                          title="Click để xem chi tiết hóa đơn"
                        >
                          {row.invoiceCode}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-normal align-middle">{row.date}</td>
                      <td className="py-3.5 px-4 align-middle">
                        <div className="flex items-center gap-2.5">
                          <Avatar 
                            name={row.customerName} 
                            src={row.customerAvatar} 
                            size={30} 
                            onClick={() => router.push(`/customers?name=${encodeURIComponent(row.customerName)}`)}
                            title="Click để xem chi tiết khách hàng"
                          />
                          <div>
                            <button
                              type="button"
                              onClick={() => router.push(`/customers?name=${encodeURIComponent(row.customerName)}`)}
                              className="font-bold text-slate-800 leading-tight hover:text-orange-600 hover:underline cursor-pointer text-left block"
                              title="Click để xem chi tiết khách hàng"
                            >
                              {row.customerName}
                            </button>
                            <div className="text-[11px] text-slate-400 font-normal mt-0.5">{row.customerPhone}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 align-middle">{row.itemName}</td>
                      <td className="py-3.5 px-4 text-right font-bold text-emerald-600 align-middle">+{formatVND(row.tipAmount)}</td>
                    </tr>
                  ))}
                </tbody>
                {filteredTips.length > 0 && (
                  <tfoot className="bg-slate-50/90 border-t border-slate-200 font-bold text-xs">
                    <tr>
                      <td colSpan={4} className="py-3.5 px-4 text-slate-900 font-bold">Tổng cộng tiền tip ({filteredTips.length} lượt)</td>
                      <td className="py-3.5 px-4 text-right text-emerald-600">+{formatVND(tipTotalSum)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: SHIFTS & ATTENDANCE (Ca Làm & Chấm Công) */}
        {activeTab === 'shifts' && (
          <div className="space-y-3.5 animate-in fade-in duration-150">
            
            {/* Tab Summary Stat Bar */}
            <div className="flex flex-wrap items-center gap-6 bg-slate-50/80 px-4 py-3 rounded-2xl border border-slate-200/80 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">Tổng số ca đăng ký:</span>
                <span className="font-bold text-slate-900">{filteredShifts.length} ca</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">Tổng số giờ tích lũy:</span>
                <span className="font-bold text-slate-900">{shiftTotalHours} giờ</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">Số ngày nghỉ phép:</span>
                <span className="font-bold text-slate-900">{shiftOffCount} ngày</span>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200/80 shadow-2xs">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-xs text-slate-500">
                  <tr>
                    <th className="py-3 px-4">Ngày</th>
                    <th className="py-3 px-4">Tên ca làm việc</th>
                    <th className="py-3 px-4 text-center">Giờ vào</th>
                    <th className="py-3 px-4 text-center">Giờ ra</th>
                    <th className="py-3 px-4 text-center">Số giờ tích lũy</th>
                    <th className="py-3 px-4 text-center">Trạng thái chấm công</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium bg-white text-slate-700">
                  {filteredShifts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-400 text-xs font-medium">Không tìm thấy ca làm việc phù hợp</td>
                    </tr>
                  ) : filteredShifts.map((row, idx) => (
                    <tr key={idx} className="hover:bg-orange-50/30 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900 align-middle">{row.date}</td>
                      <td className="py-3.5 px-4 align-middle">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border inline-block ${SHIFT_BADGE_STYLES[row.shiftName] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                          {row.shiftName} ({row.shiftTime})
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-600 align-middle">{row.timeIn}</td>
                      <td className="py-3.5 px-4 text-center text-slate-600 align-middle">{row.timeOut}</td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-900 align-middle">{row.hours}h</td>
                      <td className="py-3.5 px-4 text-center align-middle">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border inline-block ${ATTENDANCE_STATUS_STYLES[row.status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                          ✔ {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: ADJUSTMENTS (Thưởng & Phạt - Interactive) */}
        {activeTab === 'adjustments' && (
          <div className="space-y-3.5 animate-in fade-in duration-150">
            
            {/* Filter Pills + Add New Adjustment Button */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 mr-1 shrink-0">
                  <Filter className="w-3.5 h-3.5 text-slate-400" /> Phân loại:
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedAdjFilter('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    selectedAdjFilter === 'ALL'
                      ? 'bg-orange-500 text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  Tất cả ({adjustmentDetails.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedAdjFilter('bonus')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    selectedAdjFilter === 'bonus'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                  }`}
                >
                  🎁 Khen thưởng ({adjustmentDetails.filter(a => a.type === 'bonus').length})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedAdjFilter('penalty')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    selectedAdjFilter === 'penalty'
                      ? 'bg-red-600 text-white shadow-2xs'
                      : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
                  }`}
                >
                  ⚠️ Khấu trừ / Phạt ({adjustmentDetails.filter(a => a.type === 'penalty').length})
                </button>
              </div>

              <button
                type="button"
                onClick={handleOpenAddAdj}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs shadow-2xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Thêm khoản điều chỉnh
              </button>
            </div>

            {/* Tab Summary Stat Bar */}
            <div className="flex flex-wrap items-center gap-6 bg-slate-50/80 px-4 py-3 rounded-2xl border border-slate-200/80 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-emerald-600 font-medium">Tổng tiền thưởng:</span>
                <span className="font-bold text-emerald-600">+{formatVND(adjTotalBonus)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-red-500 font-medium">Tổng khấu trừ phạt:</span>
                <span className="font-bold text-red-600">-{formatVND(adjTotalPenalty)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-700 font-semibold">Chênh lệch điều chỉnh:</span>
                <span className={`font-bold ${adjTotalBonus - adjTotalPenalty >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {formatVND(adjTotalBonus - adjTotalPenalty)}
                </span>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200/80 shadow-2xs">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-xs text-slate-500">
                  <tr>
                    <th className="py-3 px-4">Ngày ghi nhận</th>
                    <th className="py-3 px-4">Loại điều chỉnh</th>
                    <th className="py-3 px-4">Lý do / Nội dung</th>
                    <th className="py-3 px-4">Người khởi tạo</th>
                    <th className="py-3 px-4 text-right">Số tiền</th>
                    <th className="py-3 px-4 text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium bg-white text-slate-700">
                  {filteredAdjustments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-400 text-xs font-medium">Không tìm thấy khoản điều chỉnh nào</td>
                    </tr>
                  ) : filteredAdjustments.map((row) => (
                    <tr key={row.id} className="hover:bg-orange-50/30 transition-colors">
                      <td className="py-3.5 px-4 text-slate-500 font-normal align-middle">{row.date}</td>
                      <td className="py-3.5 px-4 align-middle">
                        {row.type === 'bonus' ? (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100 inline-block">
                            🎁 Khen thưởng
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-100 inline-block">
                            ⚠️ Khấu trừ / Phạt
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 align-middle">{row.reason}</td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium align-middle">{row.creator}</td>
                      <td className={`py-3.5 px-4 text-right font-bold align-middle ${row.type === 'bonus' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {row.type === 'bonus' ? '+' : '-'}{formatVND(row.amount)}
                      </td>
                      <td className="py-3.5 px-4 text-center align-middle">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleEditAdj(row)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="Chỉnh sửa khoản này"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAdj(row.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Xóa khoản này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* ================= ADJUSTMENT ADD / EDIT MODAL ================= */}
      {isAdjModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 p-6 shadow-xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                {editingAdj ? 'Chỉnh sửa khoản điều chỉnh' : 'Thêm khoản thưởng / phạt mới'}
              </h3>
              <button
                type="button"
                onClick={() => setIsAdjModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAdj} className="space-y-4 text-xs font-sans">
              {/* Type selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Loại điều chỉnh</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjFormData(prev => ({ ...prev, type: 'bonus' }))}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      adjFormData.type === 'bonus'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-500 ring-2 ring-emerald-200'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    🎁 Khen thưởng (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjFormData(prev => ({ ...prev, type: 'penalty' }))}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      adjFormData.type === 'penalty'
                        ? 'bg-red-50 text-red-700 border-red-500 ring-2 ring-red-200'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    ⚠️ Khấu trừ / Phạt (-)
                  </button>
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Lý do / Nội dung ghi nhận</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Thưởng KTV xuất sắc tuần 2..."
                  value={adjFormData.reason}
                  onChange={(e) => setAdjFormData(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium text-slate-800 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Số tiền (VNĐ)</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="Nhập số tiền..."
                  value={adjFormData.amount}
                  onChange={(e) => setAdjFormData(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                />
              </div>

              {/* Date & Creator */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ngày ghi nhận</label>
                  <input
                    type="text"
                    value={adjFormData.date}
                    onChange={(e) => setAdjFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium text-slate-700 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Người khởi tạo</label>
                  <input
                    type="text"
                    value={adjFormData.creator}
                    onChange={(e) => setAdjFormData(prev => ({ ...prev, creator: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium text-slate-700 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAdjModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs transition-colors shadow-2xs cursor-pointer"
                >
                  {editingAdj ? 'Lưu cập nhật' : 'Thêm điều chỉnh'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
