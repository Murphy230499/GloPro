'use client';
import React, { useState, useEffect } from 'react';
import { Megaphone, Ticket, Plus, Edit3, Trash2, Calendar, Sparkles, Percent, ChevronDown, X, Clock, Gift } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { formatVND } from '@/lib/format';
import { toast } from '@/components/Layout';
import { reloadPromotions, reloadVouchers } from '@/utils/promos';
import { base44 } from '@/api/base44Client';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import VoucherDetailModal from '@/components/discounts/VoucherDetailModal';
import PromoDetailModal from '@/components/discounts/PromoDetailModal';
import GiftPromoModal from '@/components/discounts/GiftPromoModal';

const SCOPES = {
  service: 'Chỉ dịch vụ',
  product: 'Chỉ sản phẩm',
  invoice: 'Toàn hóa đơn'
};

const VALUE_TYPES = {
  percent: 'Giảm theo phần trăm (%)',
  fixed: 'Giảm số tiền cụ thể (đ)'
};

const ApplicableItemsDropdown = ({ items, groups, selectedIds, onChange, placeholder, itemType }) => {
  const { t } = useT();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const getGroupedItems = () => {
    const grouped = {};
    items.forEach(item => {
      const groupObj = groups.find(g => g.id === item.group_id);
      const groupName = groupObj ? groupObj.name : t('discounts.ungrouped', 'Chưa phân nhóm');
      if (!grouped[groupName]) grouped[groupName] = [];
      grouped[groupName].push(item);
    });
    return grouped;
  };

  const groupedItems = getGroupedItems();

  const handleSelectAll = (checked) => {
    if (checked) onChange(items.map(i => i.id));
    else onChange([]);
  };

  const handleToggleGroup = (groupItems, checked) => {
    const groupItemIds = groupItems.map(i => i.id);
    if (checked) {
      onChange([...new Set([...selectedIds, ...groupItemIds])]);
    } else {
      onChange(selectedIds.filter(id => !groupItemIds.includes(id)));
    }
  };

  const handleToggleItem = (id, checked) => {
    if (checked) onChange([...selectedIds, id]);
    else onChange(selectedIds.filter(i => i !== id));
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-normal text-slate-700 shadow-sm"
      >
        <span className="truncate font-normal text-slate-650">
          {selectedIds.length === 0 
            ? placeholder 
            : selectedIds.length === items.length 
              ? `${t('discounts.all', 'Tất cả')} ${itemType}` 
              : `${t('discounts.selected', 'Đã chọn')} ${selectedIds.length} ${itemType}`}
        </span>
        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-1 bg-white rounded-2xl border border-slate-200 shadow-2xl z-30 flex flex-col max-h-60 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 border-b border-slate-100">
            <input
              type="text"
              placeholder={t('discounts.search_placeholder', 'tìm kiếm...')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-xs font-medium outline-none text-slate-700 placeholder:text-slate-400/50"
            />
          </div>
          <div className="overflow-y-auto p-2 space-y-2">
            <label className="flex items-center gap-2.5 px-2 py-1.5 hover:bg-slate-50 rounded-xl cursor-pointer select-none">
              <input
                type="checkbox"
                checked={selectedIds.length === items.length && items.length > 0}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="rounded text-pink-500 focus:ring-pink-500 w-3.5 h-3.5 accent-pink-500 cursor-pointer"
              />
              <span className="text-xs font-normal text-slate-755">{t('discounts.select_all', 'Chọn tất cả')}</span>
            </label>

            {Object.entries(groupedItems).map(([groupName, groupMembers]) => {
              const visibleMembers = groupMembers.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));
              if (visibleMembers.length === 0) return null;

              const isGroupAllSelected = visibleMembers.every(m => selectedIds.includes(m.id));

              return (
                <div key={groupName} className="space-y-0.5">
                  <label className="flex items-center gap-2.5 px-2 py-1.5 hover:bg-slate-50 rounded-xl cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isGroupAllSelected}
                      onChange={(e) => handleToggleGroup(visibleMembers, e.target.checked)}
                      className="rounded text-pink-500 focus:ring-pink-500 w-3.5 h-3.5 accent-pink-500 cursor-pointer"
                    />
                    <span className="text-[10px] font-normal text-slate-400 uppercase tracking-wider">{groupName}</span>
                  </label>
                  
                  <div className="space-y-0.5 pl-4">
                    {visibleMembers.map(m => {
                      const isSelected = selectedIds.includes(m.id);
                      return (
                        <label
                          key={m.id}
                          className={`flex items-center gap-2.5 px-2 py-1.5 hover:bg-slate-50 rounded-xl cursor-pointer select-none ${isSelected ? 'bg-slate-100/60 font-medium' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => handleToggleItem(m.id, e.target.checked)}
                            className="rounded text-pink-500 focus:ring-pink-500 w-3.5 h-3.5 accent-pink-500 cursor-pointer"
                          />
                          <span className="text-xs font-normal text-slate-700 flex-1 truncate">{m.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
const DateRangePicker = ({ startDate, endDate, onChange, placeholder = "Chọn khoảng thời gian" }) => {
  const formatD = (d) => d ? d.split('-').reverse().join('/') : '';
  const display = (startDate && endDate) ? `${formatD(startDate)} - ${formatD(endDate)}` : startDate ? formatD(startDate) : placeholder;

  const handleSelect = (range) => {
    if (range) {
      const start = range.from ? new Date(range.from.getTime() - range.from.getTimezoneOffset() * 60000).toISOString().slice(0, 10) : '';
      const end = range.to ? new Date(range.to.getTime() - range.to.getTimezoneOffset() * 60000).toISOString().slice(0, 10) : '';
      onChange(start, end);
    } else {
      onChange('', '');
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-pink-400 text-slate-700 bg-white shadow-sm"
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <Calendar className="w-3.5 h-3.5 text-pink-500 shrink-0" />
            <span className="truncate">{display}</span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 rounded-2xl shadow-xl border-slate-200" align="start">
        <CalendarUI
          mode="range"
          selected={{
            from: startDate ? new Date(startDate) : undefined,
            to: endDate ? new Date(endDate) : undefined,
          }}
          onSelect={handleSelect}
          numberOfMonths={2}
        />
      </PopoverContent>
    </Popover>
  );
};

const DatePicker = ({ value, onChange, placeholder = "Chọn ngày" }) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-pink-400 text-slate-700 bg-white shadow-sm"
        >
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-pink-500" />
            <span>{value ? value.split('-').reverse().join('/') : placeholder}</span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 rounded-2xl shadow-xl border-slate-200" align="start">
        <CalendarUI
          mode="single"
          selected={value ? new Date(value) : undefined}
          onSelect={(date) => {
            if (date) {
              const d = new Date(date);
              d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
              onChange(d.toISOString().slice(0, 10));
            }
          }}
        />
      </PopoverContent>
    </Popover>
  );
};

function genVoucherCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default function Discounts() {
  const { t } = useT();
  const [activeTab, setActiveTab] = useState('promos'); // 'promos', 'vouchers'

  const getScopeLabel = (type) => {
    if (type === 'service') return t('discounts.scope_service', 'Chỉ dịch vụ');
    if (type === 'product') return t('discounts.scope_product', 'Chỉ sản phẩm');
    return t('discounts.scope_invoice', 'Toàn hóa đơn');
  };
  
  // Data lists
  const [promotions, setPromotions] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [usages, setUsages] = useState([]);
  const [selectedVoucherForDetail, setSelectedVoucherForDetail] = useState(null);
  const [selectedPromoForDetail, setSelectedPromoForDetail] = useState(null);
  const [services, setServices] = useState([]);
  const [products, setProducts] = useState([]);
  const [serviceGroups, setServiceGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form modals
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [giftingPromo, setGiftingPromo] = useState(null);

  // Promotion Form state
  const [editingPromoId, setEditingPromoId] = useState(null);
  const [promoName, setPromoName] = useState('');
  const [promoScope, setPromoScope] = useState('invoice');
  const [promoValueType, setPromoValueType] = useState('percent');
  const [promoValue, setPromoValue] = useState('');
  const [promoExpiry, setPromoExpiry] = useState('');
  const [promoApplicableItems, setPromoApplicableItems] = useState([]);
  
  const [promoStartDate, setPromoStartDate] = useState('');
  const [promoMinSpend, setPromoMinSpend] = useState('');
  const [promoMaxDiscount, setPromoMaxDiscount] = useState('');
  const [promoUsageLimit, setPromoUsageLimit] = useState('1');
  const [promoTargetAudience, setPromoTargetAudience] = useState('all');
  
  const [promoIsAdvancedTime, setPromoIsAdvancedTime] = useState(false);
  const [promoTimeType, setPromoTimeType] = useState('daily');
  const [promoTimeStart, setPromoTimeStart] = useState('00:00');
  const [promoTimeEnd, setPromoTimeEnd] = useState('23:59');
  const [promoDaysOfWeek, setPromoDaysOfWeek] = useState([]);
  const [promoDaysOfMonth, setPromoDaysOfMonth] = useState('');

  // Voucher Form state
  const [editingVoucherId, setEditingVoucherId] = useState(null);
  const [voucherName, setVoucherName] = useState('');
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherScope, setVoucherScope] = useState('invoice');
  const [voucherValueType, setVoucherValueType] = useState('fixed');
  const [voucherValue, setVoucherValue] = useState('');
  const [voucherExpiry, setVoucherExpiry] = useState('');
  const [voucherQty, setVoucherQty] = useState('10');

  // TikTok-style advanced states
  const [voucherStartDate, setVoucherStartDate] = useState('');
  const [voucherMinSpend, setVoucherMinSpend] = useState('');
  const [voucherMaxDiscount, setVoucherMaxDiscount] = useState('');
  const [voucherUsageLimit, setVoucherUsageLimit] = useState('1');
  const [voucherVisibility, setVoucherVisibility] = useState('public');
  const [voucherTargetAudience, setVoucherTargetAudience] = useState('all');
  
  // Advanced time scheduling
  const [voucherIsAdvancedTime, setVoucherIsAdvancedTime] = useState(false);
  const [voucherTimeType, setVoucherTimeType] = useState('daily');
  const [voucherTimeStart, setVoucherTimeStart] = useState('00:00');
  const [voucherTimeEnd, setVoucherTimeEnd] = useState('23:59');
  const [voucherDaysOfWeek, setVoucherDaysOfWeek] = useState([]);
  const [voucherDaysOfMonth, setVoucherDaysOfMonth] = useState('');
  const [voucherApplicableItems, setVoucherApplicableItems] = useState([]);
  const [voucherIsAutoApply, setVoucherIsAutoApply] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load Promotions
      const localPromos = localStorage.getItem('glopro_promotions');
      setPromotions(localPromos ? JSON.parse(localPromos) : []);

      // Load Vouchers
      const localVouchers = localStorage.getItem('glopro_vouchers');
      setVouchers(localVouchers ? JSON.parse(localVouchers) : []);

      // Load Promo Usages (to count usage statistics)
      const localUsages = localStorage.getItem('glopro_promo_usages');
      setUsages(localUsages ? JSON.parse(localUsages) : []);

      // Fetch from Base44
      const [fetchedServices, fetchedProducts, fetchedServiceGroups] = await Promise.all([
        base44.entities.Service.list().catch(() => []),
        base44.entities.Product.list().catch(() => []),
        base44.entities.ServiceGroup.list().catch(() => [])
      ]);
      
      setServices(fetchedServices || []);
      setProducts(fetchedProducts || []);
      setServiceGroups(fetchedServiceGroups || []);
    } catch (e) {
      console.error('Error loading discounts data:', e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const getVoucherUsageCount = (code) => {
    return usages.filter(u => u.promo_id === code || u.code === code).length;
  };

  // --- PROMOTION ACTIONS ---
  const resetPromoForm = () => {
    setEditingPromoId(null);
    setPromoName('');
    setPromoScope('invoice');
    setPromoValueType('percent');
    setPromoValue('');
    setPromoExpiry('');
    setPromoApplicableItems([]);
    
    setPromoStartDate('');
    setPromoMinSpend('');
    setPromoMaxDiscount('');
    setPromoUsageLimit('1');
    setPromoTargetAudience('all');
    setPromoIsAdvancedTime(false);
    setPromoTimeType('daily');
    setPromoTimeStart('00:00');
    setPromoTimeEnd('23:59');
    setPromoDaysOfWeek([]);
    setPromoDaysOfMonth('');
  };

  const handleSavePromo = () => {
    if (!promoName.trim()) return toast.error('Vui lòng nhập tên chương trình');
    if (!promoValue || Number(promoValue) <= 0) return toast.error('Vui lòng nhập giá trị giảm hợp lệ');
    if (promoValueType === 'percent' && Number(promoValue) > 100) return toast.error('Phần trăm giảm không được lớn hơn 100%');
    if (!promoExpiry) return toast.error('Vui lòng chọn ngày hết hạn');

    try {
      const local = localStorage.getItem('glopro_promotions');
      let list = local ? JSON.parse(local) : [];

      const payload = {
        id: editingPromoId || 'promo_cam_' + Date.now(),
        name: promoName.trim(),
        type: promoScope,
        valueType: promoValueType,
        value: Number(promoValue),
        startDate: promoStartDate,
        expiryDate: promoExpiry,
        minSpend: promoMinSpend ? Number(promoMinSpend) : null,
        maxDiscount: promoMaxDiscount ? Number(promoMaxDiscount) : null,
        usageLimit: Number(promoUsageLimit),
        targetAudience: promoTargetAudience,
        isAdvancedTime: promoIsAdvancedTime,
        timeType: promoTimeType,
        timeStart: promoTimeStart,
        timeEnd: promoTimeEnd,
        daysOfWeek: promoDaysOfWeek,
        daysOfMonth: promoDaysOfMonth,
        applicableItems: promoApplicableItems,
        isGiftable: true, // Always true now per user request
        created_at: new Date().toISOString().split('T')[0]
      };

      if (editingPromoId) {
        list = list.map(p => p.id === editingPromoId ? payload : p);
      } else {
        list.push(payload);
      }

      localStorage.setItem('glopro_promotions', JSON.stringify(list));
      toast.success(editingPromoId ? 'Đã cập nhật khuyến mãi' : 'Đã tạo chương trình khuyến mãi');
      
      reloadPromotions();
      setShowPromoModal(false);
      resetPromoForm();
      loadData();
    } catch (e) {
      toast.error('Lỗi khi lưu khuyến mãi');
    }
  };

  const handleEditPromo = (p) => {
    setEditingPromoId(p.id);
    setPromoName(p.name);
    setPromoScope(p.type);
    setPromoValueType(p.valueType || 'percent');
    setPromoValue(p.value);
    setPromoStartDate(p.startDate || '');
    setPromoExpiry(p.expiryDate || '');
    setPromoMinSpend(p.minSpend || '');
    setPromoMaxDiscount(p.maxDiscount || '');
    setPromoUsageLimit(p.usageLimit || '1');
    setPromoTargetAudience(p.targetAudience || 'all');
    setPromoIsAdvancedTime(p.isAdvancedTime || false);
    setPromoTimeType(p.timeType || 'daily');
    setPromoTimeStart(p.timeStart || '00:00');
    setPromoTimeEnd(p.timeEnd || '23:59');
    setPromoDaysOfWeek(p.daysOfWeek || []);
    setPromoDaysOfMonth(p.daysOfMonth || '');
    setPromoApplicableItems(p.applicableItems || []);
    setShowPromoModal(true);
  };

  const handleDeletePromo = (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa chương trình khuyến mãi này?')) return;
    try {
      const local = localStorage.getItem('glopro_promotions');
      let list = local ? JSON.parse(local) : [];
      list = list.filter(p => p.id !== id);
      localStorage.setItem('glopro_promotions', JSON.stringify(list));
      toast.success('Đã xóa chương trình khuyến mãi');
      reloadPromotions();
      loadData();
    } catch (e) {
      toast.error('Lỗi khi xóa khuyến mãi');
    }
  };

  // --- VOUCHER ACTIONS ---
  const resetVoucherForm = () => {
    setEditingVoucherId(null);
    setVoucherName('');
    setVoucherCode('');
    setVoucherScope('invoice');
    setVoucherValueType('fixed');
    setVoucherValue('');
    setVoucherExpiry('');
    setVoucherQty('10');
    setVoucherStartDate('');
    setVoucherMinSpend('');
    setVoucherMaxDiscount('');
    setVoucherUsageLimit('1');
    setVoucherVisibility('public');
    setVoucherTargetAudience('all');
    setVoucherIsAdvancedTime(false);
    setVoucherTimeType('daily');
    setVoucherTimeStart('00:00');
    setVoucherTimeEnd('23:59');
    setVoucherDaysOfWeek([]);
    setVoucherDaysOfMonth('');
    setVoucherApplicableItems([]);
    setVoucherIsAutoApply(false);
  };

  const handleSaveVoucher = () => {
    if (!voucherName.trim()) return toast.error('Vui lòng nhập tên voucher');
    if (!voucherCode.trim()) return toast.error('Vui lòng nhập mã voucher');
    if (!voucherValue || Number(voucherValue) <= 0) return toast.error('Vui lòng nhập giá trị giảm hợp lệ');
    if (voucherValueType === 'percent' && Number(voucherValue) > 100) return toast.error('Phần trăm giảm không được lớn hơn 100%');
    if (!voucherStartDate) return toast.error('Vui lòng chọn ngày bắt đầu');
    if (!voucherExpiry) return toast.error('Vui lòng chọn ngày kết thúc');
    if (voucherStartDate > voucherExpiry) return toast.error('Ngày bắt đầu không được lớn hơn ngày kết thúc');
    if (!voucherQty || Number(voucherQty) <= 0) return toast.error('Vui lòng nhập số lượng phát hành hợp lệ');

    // Check code duplication
    const duplicate = vouchers.find(v => v.code.toUpperCase() === voucherCode.trim().toUpperCase() && v.id !== editingVoucherId);
    if (duplicate) return toast.error('Mã voucher này đã tồn tại');

    try {
      const local = localStorage.getItem('glopro_vouchers');
      let list = local ? JSON.parse(local) : [];

      const payload = {
        id: editingVoucherId || 'voucher_' + Date.now(),
        name: voucherName.trim(),
        code: voucherCode.trim().toUpperCase(),
        type: voucherScope,
        valueType: voucherValueType,
        value: Number(voucherValue),
        expiryDate: voucherExpiry,
        quantity: Number(voucherQty),
        startDate: voucherStartDate,
        minSpend: Number(voucherMinSpend) || 0,
        maxDiscount: voucherValueType === 'percent' ? (Number(voucherMaxDiscount) || 0) : 0,
        usageLimit: Number(voucherUsageLimit) || 1,
        visibility: voucherVisibility,
        targetAudience: voucherTargetAudience,
        isAdvancedTime: voucherIsAdvancedTime,
        timeType: voucherTimeType,
        timeStart: voucherTimeStart,
        timeEnd: voucherTimeEnd,
        daysOfWeek: voucherDaysOfWeek,
        daysOfMonth: voucherDaysOfMonth,
        applicableItems: voucherApplicableItems,
        isAutoApply: voucherIsAutoApply,
        created_at: new Date().toISOString().split('T')[0]
      };

      if (editingVoucherId) {
        list = list.map(v => v.id === editingVoucherId ? payload : v);
      } else {
        list.push(payload);
      }

      localStorage.setItem('glopro_vouchers', JSON.stringify(list));
      toast.success(editingVoucherId ? 'Đã cập nhật voucher' : 'Đã tạo voucher thành công');
      
      // Mutate VOUCHERS dynamic list in POS promos utility
      reloadVouchers();

      setShowVoucherModal(false);
      resetVoucherForm();
      loadData();
    } catch (e) {
      toast.error('Lỗi khi lưu voucher');
    }
  };

  const handleEditVoucher = (v) => {
    setEditingVoucherId(v.id);
    setVoucherName(v.name);
    setVoucherCode(v.code);
    setVoucherScope(v.type);
    setVoucherValueType(v.valueType);
    setVoucherValue(v.value.toString());
    setVoucherExpiry(v.expiryDate || '');
    setVoucherQty(v.quantity.toString());
    setVoucherStartDate(v.startDate || '');
    setVoucherMinSpend(v.minSpend ? v.minSpend.toString() : '');
    setVoucherMaxDiscount(v.maxDiscount ? v.maxDiscount.toString() : '');
    setVoucherUsageLimit(v.usageLimit ? v.usageLimit.toString() : '1');
    setVoucherVisibility(v.visibility || 'public');
    setVoucherTargetAudience(v.targetAudience || 'all');
    setVoucherIsAdvancedTime(v.isAdvancedTime || false);
    setVoucherTimeType(v.timeType || 'daily');
    setVoucherTimeStart(v.timeStart || '00:00');
    setVoucherTimeEnd(v.timeEnd || '23:59');
    setVoucherDaysOfWeek(v.daysOfWeek || []);
    setVoucherDaysOfMonth(v.daysOfMonth || '');
    setVoucherApplicableItems(v.applicableItems || []);
    setVoucherIsAutoApply(v.isAutoApply || false);
    setShowVoucherModal(true);
  };

  const handleDeleteVoucher = (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa voucher này?')) return;
    try {
      const local = localStorage.getItem('glopro_vouchers');
      let list = local ? JSON.parse(local) : [];
      list = list.filter(v => v.id !== id);
      localStorage.setItem('glopro_vouchers', JSON.stringify(list));
      toast.success('Đã xóa voucher');
      
      reloadVouchers();
      loadData();
    } catch (e) {
      toast.error('Lỗi khi xóa voucher');
    }
  };

  const isExpired = (dateStr) => {
    if (!dateStr) return false;
    const today = new Date().toISOString().split('T')[0];
    return dateStr < today;
  };

  return (
    <div className="space-y-6">
      {/* Header section with Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-left">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 font-sans">{t('discounts.page_title', 'Giảm giá')}</h1>
          <p className="text-xs text-slate-400 font-semibold mt-0.5 font-sans">
            {t('discounts.page_subtitle', 'Quản lý chương trình khuyến mãi và voucher giảm giá')}
          </p>
        </div>

        {activeTab === 'promos' ? (
          <button 
            onClick={() => { resetPromoForm(); setShowPromoModal(true); }}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-pink-500 text-white font-bold text-sm shadow-sm hover:bg-pink-600 transition-all font-sans cursor-pointer"
          >
            <Plus className="w-4 h-4" /> {t('discounts.create_promo', 'Tạo chương trình')}
          </button>
        ) : (
          <button 
            onClick={() => { resetVoucherForm(); setShowVoucherModal(true); }}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-pink-500 text-white font-bold text-sm shadow-sm hover:bg-pink-600 transition-all font-sans cursor-pointer"
          >
            <Plus className="w-4 h-4" /> {t('discounts.create_voucher', 'Tạo voucher')}
          </button>
        )}
      </div>

      {/* Tabs Menu Bar */}
      <div className="flex overflow-x-auto gap-1 bg-white border border-slate-100 rounded-2xl p-1 shadow-sm max-w-max">
        <button 
          onClick={() => setActiveTab('promos')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'promos'
              ? 'bg-pink-500 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Megaphone className="w-4 h-4 shrink-0" />
          {t('discounts.tab_promos', 'Chương trình KM')}
        </button>
        <button 
          onClick={() => setActiveTab('vouchers')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'vouchers'
              ? 'bg-pink-500 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Ticket className="w-4 h-4 shrink-0" />
          {t('discounts.tab_vouchers', 'Voucher giảm giá')}
        </button>
      </div>

      {/* TAB 1: CTKM */}
      {activeTab === 'promos' && (
        <div className="space-y-5">

          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4 text-left">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-slate-800 font-sans">{t('discounts.list_promos_title', 'Danh sách chương trình đã tạo')}</h3>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400">Đang tải danh sách...</div>
            ) : promotions.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 font-sans">Chưa có chương trình khuyến mãi tự tạo nào. Hãy nhấn nút "Tạo chương trình" ở góc trên.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {promotions.map((p) => {
                  const pUsagesCount = usages.filter(u => String(u.promo_id) === String(p.id)).length;
                  const today = new Date().toISOString().split('T')[0];
                  const isPast = p.expiryDate && today > p.expiryDate;
                  const isUpcoming = p.startDate && today < p.startDate;
                  const isSoldOut = p.usageLimit && pUsagesCount >= p.usageLimit;

                  let timeStatus = { label: t('discounts.status_active', 'Đang diễn ra'), style: 'bg-emerald-50 text-emerald-600 border border-emerald-100' };
                  if (isUpcoming) {
                    timeStatus = { label: t('discounts.status_upcoming', 'Sắp diễn ra'), style: 'bg-blue-50 text-blue-600 border border-blue-100' };
                  } else if (isPast) {
                    timeStatus = { label: t('discounts.status_completed', 'Đã hoàn thành'), style: 'bg-slate-100 text-slate-500 border border-slate-200' };
                  } else if (isSoldOut) {
                    timeStatus = { label: t('discounts.status_sold_out', 'Hết lượt'), style: 'bg-amber-50 text-amber-600 border border-amber-100' };
                  }

                  return (
                    <div 
                      key={p.id} 
                      onClick={() => setSelectedPromoForDetail(p)} 
                      className="bg-white border-2 border-pink-200/90 rounded-2xl hover:shadow-xl hover:-translate-y-0.5 hover:border-pink-500 cursor-pointer flex font-sans relative overflow-hidden transition-all group shadow-sm"
                    >
                      {/* Left Ticket Stub */}
                      <div className={`w-14 shrink-0 flex flex-col items-center justify-center relative p-2 border-r border-dashed border-white/40 ${isPast || isSoldOut ? 'bg-slate-400 text-white' : 'bg-gradient-to-b from-pink-500 to-rose-500 text-white'}`}>
                        <Percent className="w-5 h-5" />
                        <span className="text-[8px] font-black uppercase tracking-widest mt-1 opacity-90">CTKM</span>
                      </div>

                      {/* Notches on Left & Right Edges */}
                      <div className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 bg-slate-50 rounded-full border-r-2 border-pink-200/90 z-10 pointer-events-none" />
                      <div className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 bg-slate-50 rounded-full border-l-2 border-pink-200/90 z-10 pointer-events-none" />

                      {/* Ticket Body Content */}
                      <div className="flex-1 p-3.5 flex flex-col justify-between gap-2.5 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <div className="text-left min-w-0">
                            <div className="font-bold text-xs text-slate-800 truncate" title={p.name}>{p.name}</div>
                            <div className="text-[10px] text-slate-500 mt-1 font-medium">
                              {t('discounts.discount_rate', 'Mức giảm:')} <span className="text-pink-600 font-bold">{p.valueType === 'percent' ? `${p.value}%` : formatVND(p.value)}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5 font-normal truncate">
                              {t('discounts.scope', 'Phạm vi:')} <span className="font-medium text-slate-600">{getScopeLabel(p.type)} {p.applicableItems?.length > 0 && `(${p.applicableItems.length})`}</span>
                            </div>
                          </div>

                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase shrink-0 ${timeStatus.style}`}>
                            {timeStatus.label}
                          </span>
                        </div>

                        {p.isGiftable && (
                          <div>
                            <button 
                              onClick={(e) => { e.stopPropagation(); setGiftingPromo(p); }}
                              className="w-full py-1.5 rounded-lg bg-pink-50 text-pink-600 hover:bg-pink-100 font-bold text-[11px] transition-colors flex items-center justify-center gap-1.5 border border-pink-100/80"
                            >
                              <Gift className="w-3.5 h-3.5" /> {t('discounts.gift_for_customer', 'Tặng quà cho khách')}
                            </button>
                          </div>
                        )}

                        <div className="flex items-center justify-between border-t border-dashed border-slate-200 pt-2 mt-0.5">
                          <div className="text-[9px] text-slate-400 font-medium flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" /> {t('discounts.expiry_date', 'HSD:')} {p.expiryDate || 'Vô thời hạn'}
                          </div>

                          <div className="flex items-center gap-1">
                            <button onClick={(e) => { e.stopPropagation(); handleEditPromo(p); }} className="p-1 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100 transition-colors" title={t('discounts.btn_edit', 'Sửa')}><Edit3 className="w-3.5 h-3.5" /></button>
                            <button onClick={(e) => { e.stopPropagation(); handleDeletePromo(p.id); }} className="p-1 text-red-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors" title={t('discounts.btn_delete', 'Xóa')}><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: VOUCHER */}
      {activeTab === 'vouchers' && (
        <div className="space-y-5">
          <div className="bg-pink-50 rounded-2xl p-4 border border-pink-100 flex flex-wrap items-center justify-between gap-3 text-left">
            <div className="text-left space-y-0.5 font-sans">
              <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                <Ticket className="w-4 h-4 text-pink-600" /> {t('discounts.voucher_banner_title', 'Thiết lập Voucher giảm giá')}
              </div>
              <div className="text-[10px] text-slate-400 font-semibold">
                {t('discounts.voucher_banner_subtitle', 'Phát hành các mã Voucher giảm giá độc lập. Khách hàng hoặc thu ngân có thể nhập trực tiếp mã này trên POS khi thanh toán hóa đơn.')}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4 text-left">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-slate-800 font-sans">{t('discounts.list_vouchers_title', 'Danh sách mã Voucher đã phát hành')}</h3>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400">Đang tải danh sách...</div>
            ) : vouchers.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 font-sans">Chưa có mã voucher tự phát hành nào. Hãy nhấn nút "Tạo voucher" ở góc trên.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {vouchers.map((v) => {
                  const usageCount = getVoucherUsageCount(v.code);
                  const remaining = Math.max(0, v.quantity - usageCount);
                  const isSoldOut = remaining <= 0;

                  const today = new Date().toISOString().split('T')[0];
                  let timeStatus = { label: t('discounts.status_active', 'Đang diễn ra'), style: 'bg-emerald-50 text-emerald-600 border border-emerald-100' };
                  
                  if (v.startDate && today < v.startDate) {
                    timeStatus = { label: t('discounts.status_upcoming', 'Sắp diễn ra'), style: 'bg-blue-50 text-blue-600 border border-blue-100' };
                  } else if (v.expiryDate && today > v.expiryDate) {
                    timeStatus = { label: t('discounts.status_completed', 'Đã hoàn thành'), style: 'bg-slate-100 text-slate-500 border border-slate-200' };
                  } else if (isSoldOut) {
                    timeStatus = { label: t('discounts.status_sold_out', 'Hết lượt'), style: 'bg-amber-50 text-amber-600 border border-amber-100' };
                  }
                  
                  const isPast = v.expiryDate && today > v.expiryDate;

                  return (
                    <div 
                      key={v.id} 
                      onClick={() => setSelectedVoucherForDetail(v)} 
                      className="bg-white border-2 border-amber-200/90 rounded-2xl hover:shadow-xl hover:-translate-y-0.5 hover:border-amber-500 transition-all cursor-pointer flex font-sans relative overflow-hidden group shadow-sm"
                    >
                      {/* Left Ticket Stub */}
                      <div className={`w-14 shrink-0 flex flex-col items-center justify-center relative p-2 border-r border-dashed border-white/40 ${isPast || isSoldOut ? 'bg-slate-400 text-white' : 'bg-gradient-to-b from-amber-500 to-orange-500 text-white'}`}>
                        <Ticket className="w-5 h-5" />
                        <span className="text-[8px] font-black uppercase tracking-widest mt-1 opacity-90">VOUCHER</span>
                      </div>

                      {/* Notches on Left & Right Edges */}
                      <div className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 bg-slate-50 rounded-full border-r-2 border-amber-200/90 z-10 pointer-events-none" />
                      <div className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 bg-slate-50 rounded-full border-l-2 border-amber-200/90 z-10 pointer-events-none" />

                      {/* Ticket Body Content */}
                      <div className="flex-1 p-3.5 flex flex-col justify-between gap-2.5 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <div className="text-left min-w-0">
                            <div className="font-bold text-xs text-slate-800 truncate" title={v.name}>{v.name}</div>
                            <div className="text-[10px] text-pink-600 font-bold bg-pink-50 border border-pink-100 px-2 py-0.5 rounded-lg inline-block mt-1">
                              {t('discounts.code_prefix', 'MÃ:')} {v.code}
                            </div>
                            <div className="text-[10px] text-slate-500 mt-1.5 font-medium">
                              {t('discounts.discount_rate', 'Mức giảm:')} <span className="text-slate-800 font-bold">{v.valueType === 'percent' ? `${v.value}%` : formatVND(v.value)}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-1 font-normal flex flex-wrap items-center gap-1">
                              <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-medium">{getScopeLabel(v.type)} {v.applicableItems?.length > 0 && `(${v.applicableItems.length})`}</span>
                              {v.minSpend > 0 && <span className="bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded border border-emerald-100 font-medium">{t('discounts.min_order_prefix', 'Đơn >')} {formatVND(v.minSpend)}</span>}
                              {v.visibility === 'private' && <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-medium">{t('discounts.private_code', 'Mã ẩn')}</span>}
                            </div>
                          </div>

                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase shrink-0 ${timeStatus.style}`}>
                            {timeStatus.label}
                          </span>
                        </div>

                        <div className="flex items-center justify-between border-t border-dashed border-slate-200 pt-2 mt-0.5">
                          <div className="text-[9px] text-slate-400 font-medium flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" /> {t('discounts.expiry_date', 'HSD:')} {v.expiryDate || t('discounts.unlimited_expiry', 'Vô thời hạn')}
                          </div>

                          <div className="flex items-center gap-1">
                            <button onClick={(e) => { e.stopPropagation(); handleEditVoucher(v); }} className="p-1 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100 transition-colors" title="Sửa"><Edit3 className="w-3.5 h-3.5" /></button>
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteVoucher(v.id); }} className="p-1 text-red-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors" title="Xóa"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* FORM MODAL 1: CTKM */}
      {showPromoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 z-50" onClick={() => setShowPromoModal(false)}>
          <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-xs animate-in fade-in duration-200" />
          <div className="relative bg-white w-full md:max-w-md rounded-3xl p-6 shadow-2xl relative text-left flex flex-col max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 md:slide-in-from-bottom-0 md:zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 shrink-0">
              <h2 className="text-base font-bold text-slate-800 font-sans">{editingPromoId ? t('discounts.modal_edit_promo', 'Sửa Khuyến mãi') : t('discounts.modal_create_promo', 'Thêm Khuyến mãi')}</h2>
              <button 
                onClick={() => setShowPromoModal(false)} 
                className="w-8 h-8 rounded-full bg-slate-200/50 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 font-sans text-xs">
              <div>
                <label className="block font-bold text-slate-500 mb-1 text-[11px]">{t('discounts.promo_name_label', 'Tên chương trình khuyến mãi')}</label>
                <input value={promoName} onChange={(e) => setPromoName(e.target.value)} placeholder={t('discounts.promo_name_ph', 'Ví dụ: Tri ân VIP, Khuyến mãi Thu...')} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-pink-400 text-slate-700 bg-white" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-500 mb-1 text-[11px]">{t('discounts.scope_label', 'Phạm vi áp dụng')}</label>
                  <div className="relative">
                    <select value={promoScope} onChange={(e) => setPromoScope(e.target.value)} className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs outline-none bg-white text-slate-700 appearance-none">
                      <option value="invoice">{t('discounts.scope_invoice', 'Toàn hóa đơn')}</option>
                      <option value="service">{t('discounts.scope_service', 'Chỉ dịch vụ')}</option>
                      <option value="product">{t('discounts.scope_product', 'Chỉ sản phẩm')}</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-500 mb-1 text-[11px]">{t('discounts.min_spend_label', 'Đơn tối thiểu (đ)')}</label>
                  <input type="number" value={promoMinSpend} onChange={(e) => setPromoMinSpend(e.target.value)} placeholder={t('discounts.min_spend_ph', '0 đ (Không bắt buộc)')} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-pink-400 text-slate-700 bg-white" />
                </div>
              </div>

              {(promoScope === 'service' || promoScope === 'product') && (
                <div>
                  <label className="block font-bold text-slate-500 mb-1.5 text-[11px]">
                    {t('discounts.select_item_label', 'Chọn')} {promoScope === 'service' ? t('discounts.type_service', 'dịch vụ') : t('discounts.type_product', 'sản phẩm')} {t('discounts.select_item_suffix', 'áp dụng')}
                  </label>
                  <ApplicableItemsDropdown
                    items={promoScope === 'service' ? services : products}
                    groups={serviceGroups}
                    selectedIds={promoApplicableItems}
                    onChange={setPromoApplicableItems}
                    placeholder={`${t('discounts.select_item_ph', 'Chọn')} ${promoScope === 'service' ? t('discounts.type_service', 'dịch vụ') : t('discounts.type_product', 'sản phẩm')}...`}
                    itemType={promoScope === 'service' ? t('discounts.type_service', 'dịch vụ') : t('discounts.type_product', 'sản phẩm')}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-500 mb-1 text-[11px]">{t('discounts.value_type_label', 'Kiểu giảm giá')}</label>
                  <div className="relative">
                    <select value={promoValueType} onChange={(e) => setPromoValueType(e.target.value)} className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs outline-none bg-white text-slate-700 appearance-none">
                      <option value="percent">{t('discounts.value_percent', 'Giảm theo phần trăm (%)')}</option>
                      <option value="fixed">{t('discounts.value_fixed', 'Giảm số tiền cụ thể (đ)')}</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-500 mb-1 text-[11px]">{t('discounts.discount_value_label', 'Mức giảm')}</label>
                  <input type="number" value={promoValue} onChange={(e) => setPromoValue(e.target.value)} placeholder={promoValueType === 'percent' ? t('discounts.value_percent_ph', 'Ví dụ: 10 (%)') : t('discounts.value_vnd_ph', 'Ví dụ: 50,000 (đ)')} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-pink-400 text-slate-700 bg-white" />
                </div>
              </div>

              {promoValueType === 'percent' && (
                <div>
                  <label className="block font-bold text-slate-500 mb-1 text-[11px]">{t('discounts.max_discount_label', 'Mức giảm tối đa (đ)')}</label>
                  <input type="number" value={promoMaxDiscount} onChange={(e) => setPromoMaxDiscount(e.target.value)} placeholder={t('discounts.max_discount_ph', 'Không giới hạn nếu để trống')} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-pink-400 text-slate-700 bg-white" />
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-500 mb-1 text-[11px]">{t('discounts.apply_time_label', 'Thời gian áp dụng')}</label>
                <DateRangePicker 
                  startDate={promoStartDate} 
                  endDate={promoExpiry} 
                  onChange={(start, end) => {
                    setPromoStartDate(start);
                    setPromoExpiry(end);
                  }} 
                  placeholder={t('discounts.date_range_ph', 'Chọn khoảng thời gian (Từ ngày - Đến ngày)')}
                />
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="advTimePromo" checked={promoIsAdvancedTime} onChange={(e) => setPromoIsAdvancedTime(e.target.checked)} className="rounded text-pink-500 focus:ring-pink-500 w-3.5 h-3.5 accent-pink-500" />
                <label htmlFor="advTimePromo" className="text-[11px] font-bold text-slate-600 cursor-pointer">{t('discounts.advanced_time_setting', 'Cài đặt thời gian nâng cao')}</label>
              </div>

              {promoIsAdvancedTime && (
                <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 space-y-3 relative overflow-hidden">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-slate-500 mb-1 text-[10px]">{t('discounts.time_range_label', 'Khung giờ áp dụng')}</label>
                      <div className="flex items-center gap-1">
                        <input type="time" value={promoTimeStart} onChange={(e) => setPromoTimeStart(e.target.value)} className="w-full px-2 py-2 rounded-lg border border-slate-200 text-xs outline-none focus:border-pink-400 text-slate-700 bg-white" />
                        <span className="text-slate-400">-</span>
                        <input type="time" value={promoTimeEnd} onChange={(e) => setPromoTimeEnd(e.target.value)} className="w-full px-2 py-2 rounded-lg border border-slate-200 text-xs outline-none focus:border-pink-400 text-slate-700 bg-white" />
                      </div>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-500 mb-1 text-[10px]">{t('discounts.repeat_cycle_label', 'Chu kỳ lặp')}</label>
                      <div className="relative">
                        <select value={promoTimeType} onChange={(e) => {
                          setPromoTimeType(e.target.value);
                          if (e.target.value === 'weekly' && promoDaysOfWeek.length === 0) setPromoDaysOfWeek([1,2,3,4,5,6,0]);
                        }} className="w-full px-2 py-2 rounded-lg border border-slate-200 text-xs outline-none bg-white text-slate-700 appearance-none">
                          <option value="daily">{t('discounts.daily', 'Hàng ngày')}</option>
                          <option value="weekly">{t('discounts.weekly', 'Hàng tuần')}</option>
                          <option value="monthly">{t('discounts.monthly', 'Hàng tháng')}</option>
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {promoTimeType === 'weekly' && (
                    <div>
                      <label className="block font-bold text-slate-500 mb-1.5 text-[10px]">{t('discounts.days_of_week_label', 'Áp dụng vào các ngày trong tuần')}</label>
                      <div className="flex flex-wrap gap-1.5">
                        {[{v: 1, l: t('discounts.day_mon', 'T2')}, {v: 2, l: t('discounts.day_tue', 'T3')}, {v: 3, l: t('discounts.day_wed', 'T4')}, {v: 4, l: t('discounts.day_thu', 'T5')}, {v: 5, l: t('discounts.day_fri', 'T6')}, {v: 6, l: t('discounts.day_sat', 'T7')}, {v: 0, l: t('discounts.day_sun', 'CN')}].map(day => (
                          <button
                            key={day.v}
                            type="button"
                            onClick={() => {
                              if (promoDaysOfWeek.includes(day.v)) setPromoDaysOfWeek(promoDaysOfWeek.filter(d => d !== day.v));
                              else setPromoDaysOfWeek([...promoDaysOfWeek, day.v]);
                            }}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${promoDaysOfWeek.includes(day.v) ? 'bg-pink-100 text-pink-600 border border-pink-200' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}
                          >
                            {day.l}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {promoTimeType === 'monthly' && (
                    <div>
                      <label className="block font-bold text-slate-500 mb-1 text-[10px]">{t('discounts.days_of_month_label', 'Các ngày trong tháng (cách nhau bởi dấu phẩy)')}</label>
                      <input type="text" value={promoDaysOfMonth} onChange={(e) => setPromoDaysOfMonth(e.target.value)} placeholder={t("discounts.days_of_month_ph", "Ví dụ: 1, 15, 30")} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs outline-none focus:border-pink-400 text-slate-700 bg-white" />
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-500 mb-1 text-[11px]">{t('discounts.usage_limit_per_person', 'Giới hạn / người')}</label>
                <input type="number" value={promoUsageLimit} onChange={(e) => setPromoUsageLimit(e.target.value)} min="1" placeholder="1" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-pink-400 text-slate-700 bg-white" />
              </div>

            </div>

            <div className="flex gap-2 pt-4 border-t border-slate-150/50 mt-4 shrink-0">
              <button onClick={() => setShowPromoModal(false)} className="flex-1 py-2.5 rounded-xl bg-slate-200/50 hover:bg-slate-250 transition-colors font-bold text-xs text-slate-600 font-sans cursor-pointer">{t('discounts.btn_cancel', 'Hủy')}</button>
              <button onClick={handleSavePromo} className="flex-1 py-2.5 rounded-xl bg-pink-500 text-white font-bold text-xs shadow-sm hover:bg-pink-600 transition-all font-sans cursor-pointer">
                {editingPromoId ? t('discounts.btn_update_promo', 'Cập nhật') : t('discounts.btn_save_promo', 'Tạo mới')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FORM MODAL 2: VOUCHER */}
      {showVoucherModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowVoucherModal(false)}>
          <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-xs animate-in fade-in duration-200" />
          <div className="relative bg-white w-full md:max-w-md rounded-3xl p-6 shadow-2xl relative text-left flex flex-col max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 md:slide-in-from-bottom-0 md:zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 shrink-0">
              <h2 className="text-base font-bold text-slate-800 font-sans">{editingVoucherId ? t('discounts.modal_edit_voucher', 'Sửa Voucher') : t('discounts.modal_create_voucher', 'Tạo Voucher mới')}</h2>
              <button onClick={() => setShowVoucherModal(false)} className="w-8 h-8 rounded-full bg-slate-200/50 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 font-sans text-xs">
              <input value={voucherName} onChange={(e) => setVoucherName(e.target.value)} placeholder={t('discounts.voucher_name_ph', 'Tên Voucher')} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-pink-400 text-slate-700 bg-white" />

              <div>
                <label className="block font-bold text-slate-500 mb-1 text-[11px]">{t('discounts.voucher_code_label', 'Mã Voucher')}</label>
                <div className="flex gap-2">
                  <input value={voucherCode} onChange={(e) => setVoucherCode(e.target.value.toUpperCase())} placeholder={t('discounts.voucher_code_ph', 'Ví dụ: GP50K')} className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-pink-400 text-slate-700 bg-white" />
                  <button onClick={() => setVoucherCode(genVoucherCode())} className="px-3 rounded-xl bg-slate-200/50 hover:bg-slate-200 transition-colors text-xs font-bold text-slate-655 font-sans whitespace-nowrap cursor-pointer">
                    {t('discounts.btn_gen_code', 'Tạo mã ngẫu nhiên')}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-500 mb-1 text-[11px]">{t('discounts.scope_label', 'Phạm vi áp dụng')}</label>
                  <div className="relative">
                    <select value={voucherScope} onChange={(e) => setVoucherScope(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none bg-white text-slate-700 appearance-none">
                      <option value="invoice">{t('discounts.scope_invoice', 'Toàn hóa đơn')}</option>
                      <option value="service">{t('discounts.scope_service', 'Chỉ dịch vụ')}</option>
                      <option value="product">{t('discounts.scope_product', 'Chỉ sản phẩm')}</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-500 mb-1 text-[11px]">{t('discounts.min_spend_label', 'Đơn tối thiểu (đ)')}</label>
                  <input type="number" value={voucherMinSpend} onChange={(e) => setVoucherMinSpend(e.target.value)} placeholder={t('discounts.min_spend_ph', '0 đ (Không bắt buộc)')} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-pink-400 text-slate-700 bg-white" />
                </div>
              </div>

              {(voucherScope === 'service' || voucherScope === 'product') && (
                <div>
                  <label className="block font-bold text-slate-500 mb-1.5 text-[11px]">
                    {t('discounts.select_item_label', 'Chọn')} {voucherScope === 'service' ? t('discounts.type_service', 'dịch vụ') : t('discounts.type_product', 'sản phẩm')} {t('discounts.select_item_suffix', 'áp dụng')}
                  </label>
                  <ApplicableItemsDropdown
                    items={voucherScope === 'service' ? services : products}
                    groups={serviceGroups}
                    selectedIds={voucherApplicableItems}
                    onChange={setVoucherApplicableItems}
                    placeholder={`${t('discounts.select_item_ph', 'Chọn')} ${voucherScope === 'service' ? t('discounts.type_service', 'dịch vụ') : t('discounts.type_product', 'sản phẩm')}...`}
                    itemType={voucherScope === 'service' ? t('discounts.type_service', 'dịch vụ') : t('discounts.type_product', 'sản phẩm')}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-500 mb-1 text-[11px]">{t('discounts.value_type_label', 'Kiểu giảm giá')}</label>
                  <div className="relative">
                    <select value={voucherValueType} onChange={(e) => setVoucherValueType(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none bg-white text-slate-700 appearance-none">
                      <option value="fixed">{t('discounts.value_fixed_short', 'Số tiền (đ)')}</option>
                      <option value="percent">{t('discounts.value_percent_short', 'Phần trăm (%)')}</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-500 mb-1 text-[11px]">{t('discounts.discount_value_label', 'Mức giảm')}</label>
                  <input type="number" value={voucherValue} onChange={(e) => setVoucherValue(e.target.value)} placeholder={voucherValueType === 'percent' ? t('discounts.value_percent_ph_short', '10 (%)') : t('discounts.value_vnd_ph_short', '50,000 (đ)')} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-pink-400 text-slate-700 bg-white" />
                </div>
              </div>

              {voucherValueType === 'percent' && (
                <div>
                  <label className="block font-bold text-slate-500 mb-1 text-[11px]">{t('discounts.max_discount_label', 'Mức giảm tối đa (đ)')}</label>
                  <input type="number" value={voucherMaxDiscount} onChange={(e) => setVoucherMaxDiscount(e.target.value)} placeholder={t('discounts.max_discount_ph', 'Không giới hạn nếu để trống')} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-pink-400 text-slate-700 bg-white" />
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-500 mb-1 text-[11px]">{t('discounts.apply_time_label', 'Thời gian áp dụng')}</label>
                <DateRangePicker 
                  startDate={voucherStartDate} 
                  endDate={voucherExpiry} 
                  onChange={(start, end) => {
                    setVoucherStartDate(start);
                    setVoucherExpiry(end);
                  }} 
                  placeholder={t('discounts.date_range_ph', 'Chọn khoảng thời gian (Từ ngày - Đến ngày)')}
                />
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="advTime" checked={voucherIsAdvancedTime} onChange={(e) => setVoucherIsAdvancedTime(e.target.checked)} className="rounded text-pink-500 focus:ring-pink-500 w-3.5 h-3.5 accent-pink-500" />
                <label htmlFor="advTime" className="text-[11px] font-bold text-slate-600 cursor-pointer">{t('discounts.advanced_time_setting', 'Cài đặt thời gian nâng cao')}</label>
              </div>

              {voucherIsAdvancedTime && (
                <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 space-y-3 relative overflow-hidden">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-slate-500 mb-1 text-[10px]">{t('discounts.time_range_label', 'Khung giờ áp dụng')}</label>
                      <div className="flex items-center gap-1">
                        <input type="time" value={voucherTimeStart} onChange={(e) => setVoucherTimeStart(e.target.value)} className="w-full px-2 py-2 rounded-lg border border-slate-200 text-xs outline-none focus:border-pink-400 text-slate-700 bg-white" />
                        <span className="text-slate-400">-</span>
                        <input type="time" value={voucherTimeEnd} onChange={(e) => setVoucherTimeEnd(e.target.value)} className="w-full px-2 py-2 rounded-lg border border-slate-200 text-xs outline-none focus:border-pink-400 text-slate-700 bg-white" />
                      </div>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-500 mb-1 text-[10px]">{t('discounts.repeat_cycle_label', 'Chu kỳ lặp')}</label>
                      <div className="relative">
                        <select value={voucherTimeType} onChange={(e) => {
                          setVoucherTimeType(e.target.value);
                          if (e.target.value === 'weekly' && voucherDaysOfWeek.length === 0) setVoucherDaysOfWeek([1,2,3,4,5,6,0]);
                        }} className="w-full px-2 py-2 rounded-lg border border-slate-200 text-xs outline-none bg-white text-slate-700 appearance-none">
                          <option value="daily">{t('discounts.daily', 'Hàng ngày')}</option>
                          <option value="weekly">{t('discounts.weekly', 'Hàng tuần')}</option>
                          <option value="monthly">{t('discounts.monthly', 'Hàng tháng')}</option>
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {voucherTimeType === 'weekly' && (
                    <div>
                      <label className="block font-bold text-slate-500 mb-1.5 text-[10px]">{t('discounts.days_of_week_label', 'Áp dụng vào các ngày trong tuần')}</label>
                      <div className="flex flex-wrap gap-1.5">
                        {[{v: 1, l: t('discounts.day_mon', 'T2')}, {v: 2, l: t('discounts.day_tue', 'T3')}, {v: 3, l: t('discounts.day_wed', 'T4')}, {v: 4, l: t('discounts.day_thu', 'T5')}, {v: 5, l: t('discounts.day_fri', 'T6')}, {v: 6, l: t('discounts.day_sat', 'T7')}, {v: 0, l: t('discounts.day_sun', 'CN')}].map(day => (
                          <button
                            key={day.v}
                            type="button"
                            onClick={() => {
                              if (voucherDaysOfWeek.includes(day.v)) setVoucherDaysOfWeek(voucherDaysOfWeek.filter(d => d !== day.v));
                              else setVoucherDaysOfWeek([...voucherDaysOfWeek, day.v]);
                            }}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${voucherDaysOfWeek.includes(day.v) ? 'bg-pink-100 text-pink-600 border border-pink-200' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}
                          >
                            {day.l}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {voucherTimeType === 'monthly' && (
                    <div>
                      <label className="block font-bold text-slate-500 mb-1 text-[10px]">{t('discounts.days_of_month_label', 'Các ngày trong tháng (cách nhau bởi dấu phẩy)')}</label>
                      <input type="text" value={voucherDaysOfMonth} onChange={(e) => setVoucherDaysOfMonth(e.target.value)} placeholder={t("discounts.days_of_month_ph", "Ví dụ: 1, 15, 30")} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs outline-none focus:border-pink-400 text-slate-700 bg-white" />
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-500 mb-1 text-[11px]">{t('discounts.total_quantity_label', 'Tổng phát hành')}</label>
                  <input type="number" value={voucherQty} onChange={(e) => setVoucherQty(e.target.value)} placeholder="100" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-pink-400 text-slate-700 bg-white" />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 mb-1 text-[11px]">{t('discounts.usage_limit_per_person', 'Giới hạn / người')}</label>
                  <input type="number" value={voucherUsageLimit} onChange={(e) => setVoucherUsageLimit(e.target.value)} min="1" placeholder="1" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-pink-400 text-slate-700 bg-white" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-500 mb-1 text-[11px]">{t('discounts.voucher_type_label', 'Loại voucher')}</label>
                  <div className="relative">
                    <select value={voucherVisibility} onChange={(e) => setVoucherVisibility(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none bg-white text-slate-700 appearance-none">
                      <option value="public">{t('discounts.public_voucher', 'Công khai')}</option>
                      <option value="private">{t('discounts.private_voucher', 'Mã ẩn')}</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-slate-500 mb-1 text-[11px]">{t('discounts.target_audience_label', 'Mục tiêu')}</label>
                  <div className="relative">
                    <select value={voucherTargetAudience} onChange={(e) => setVoucherTargetAudience(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none bg-white text-slate-700 appearance-none">
                      <option value="all">{t('discounts.target_all', 'Tất cả khách hàng')}</option>
                      <option value="new_customer">{t('discounts.target_new', 'Khách mới')}</option>
                      <option value="returning_customer">{t('discounts.target_returning', 'Khách cũ')}</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="mt-3 bg-pink-50 border border-pink-100 p-3 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-pink-700">{t('discounts.auto_apply_title', 'Tự động áp dụng')}</div>
                  <div className="text-[10px] text-pink-500 mt-0.5">{t('discounts.auto_apply_subtitle', 'Tự động chọn voucher này vào hóa đơn nếu đủ điều kiện.')}</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={voucherIsAutoApply} onChange={(e) => setVoucherIsAutoApply(e.target.checked)} />
                  <div className="w-9 h-5 bg-pink-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-pink-500"></div>
                </label>
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t border-slate-150/50 mt-4 shrink-0">
              <button onClick={() => setShowVoucherModal(false)} className="flex-1 py-2.5 rounded-xl bg-slate-200/50 hover:bg-slate-250 transition-colors font-bold text-xs text-slate-600 font-sans cursor-pointer">{t('discounts.btn_cancel', 'Hủy')}</button>
              <button onClick={handleSaveVoucher} className="flex-1 py-2.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs shadow-sm transition-all font-sans cursor-pointer">
                {editingVoucherId ? t('discounts.btn_update_voucher', 'Cập nhật') : t('discounts.btn_save_voucher', 'Tạo mới')}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedPromoForDetail && (
        <PromoDetailModal 
          promo={selectedPromoForDetail} 
          usages={usages} 
          onClose={() => setSelectedPromoForDetail(null)} 
        />
      )}

      {selectedVoucherForDetail && (
        <VoucherDetailModal 
          voucher={selectedVoucherForDetail} 
          usages={usages} 
          onClose={() => setSelectedVoucherForDetail(null)} 
        />
      )}

      {giftingPromo && (
        <GiftPromoModal
          promo={giftingPromo}
          onClose={() => setGiftingPromo(null)}
        />
      )}
    </div>
  );
}
