'use client';
import React, { useState, useEffect } from 'react';
import { ShieldAlert, Save, RefreshCw, Info, Check, Search, ChevronDown } from 'lucide-react';
import { formatVND } from '@/lib/format';
import { toast } from '@/components/Layout';
import { base44 } from '@/api/base44Client';
import { loadLoyaltyRule, saveLoyaltyRule } from '@/utils/loyaltyFallbacks';

export default function LoyaltyPointsTab({ onChanged }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [runningReset, setRunningReset] = useState(false);

  // Loyalty Rule fields
  const [ruleId, setRuleId] = useState('');
  const [earnOnService, setEarnOnService] = useState(true);
  const [earnOnProduct, setEarnOnProduct] = useState(true);
  const [earnOnPackage, setEarnOnPackage] = useState(true);
  const [earnOnTreatment, setEarnOnTreatment] = useState(true);
  const [earnOnPrepaidCard, setEarnOnPrepaidCard] = useState(false);
  const [earnOnBooking, setEarnOnBooking] = useState(true);
  const [earnOnReferral, setEarnOnReferral] = useState(true);
  const [pointsPerVnd, setPointsPerVnd] = useState('10000');
  const [bookingPoints, setBookingPoints] = useState('50');
  const [referralPoints, setReferralPoints] = useState('100');
  const [resetSchedule, setResetSchedule] = useState('none');
  const [resetInactivityDays, setResetInactivityDays] = useState('365');
  const [excludedItemIds, setExcludedItemIds] = useState([]);

  // Catalog items list for exclusion config
  const [allItems, setAllItems] = useState([]);
  const [searchCatalog, setSearchCatalog] = useState('');

  const load = async () => {
    setLoading(true);
    
    // Load Loyalty settings
    const rule = await loadLoyaltyRule();
    setRuleId(rule.id || '');
    setEarnOnService(rule.earn_on_service);
    setEarnOnProduct(rule.earn_on_product);
    setEarnOnPackage(rule.earn_on_package);
    setEarnOnTreatment(rule.earn_on_treatment);
    setEarnOnPrepaidCard(rule.earn_on_prepaid_card);
    setEarnOnBooking(rule.earn_on_booking);
    setEarnOnReferral(rule.earn_on_referral);
    setPointsPerVnd(rule.points_per_vnd?.toString() || '10000');
    setBookingPoints(rule.booking_points?.toString() || '50');
    setReferralPoints(rule.referral_points?.toString() || '100');
    setResetSchedule(rule.reset_schedule || 'none');
    setResetInactivityDays(rule.reset_inactivity_days?.toString() || '365');
    setExcludedItemIds(rule.excluded_item_ids || []);

    // Load Catalog items (services + products) to configure exclusion
    try {
      const [services, products] = await Promise.all([
        base44.entities.Service.list(),
        base44.entities.Product.list()
      ]);
      const combined = [
        ...services.map(s => ({ id: s.id, name: s.name, type: 'Dịch vụ' })),
        ...products.map(p => ({ id: p.id, name: p.name, type: 'Sản phẩm' }))
      ];
      setAllItems(combined);
    } catch (e) {
      console.error('Error loading catalog:', e);
    }
    
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    setSaving(true);
    const data = {
      id: ruleId,
      earn_on_service: earnOnService,
      earn_on_product: earnOnProduct,
      earn_on_package: earnOnPackage,
      earn_on_treatment: earnOnTreatment,
      earn_on_prepaid_card: earnOnPrepaidCard,
      earn_on_booking: earnOnBooking,
      earn_on_referral: earnOnReferral,
      points_per_vnd: Number(pointsPerVnd) || 10000,
      booking_points: Number(bookingPoints) || 50,
      referral_points: Number(referralPoints) || 100,
      reset_schedule: resetSchedule,
      reset_inactivity_days: Number(resetInactivityDays) || 365,
      excluded_item_ids: excludedItemIds
    };

    await saveLoyaltyRule(data);
    toast.success('Đã lưu cấu hình tích điểm thành công');
    setSaving(false);
    load();
    onChanged?.();
  };

  const handleToggleExclusion = (itemId) => {
    setExcludedItemIds(prev => 
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  const simulateReset = async () => {
    setRunningReset(true);
    try {
      const custs = await base44.entities.Customer.list();
      let resetCount = 0;
      const thresholdDate = new Date();
      thresholdDate.setDate(thresholdDate.getDate() - Number(resetInactivityDays));

      for (let c of custs) {
        let shouldReset = false;
        
        if (resetSchedule === 'inactivity_duration') {
          if (c.last_visit) {
            const lastVisitDate = new Date(c.last_visit);
            if (lastVisitDate < thresholdDate && (c.points || 0) > 0) {
              shouldReset = true;
            }
          } else if ((c.points || 0) > 0) {
            shouldReset = true;
          }
        } else if (resetSchedule !== 'none') {
          if ((c.points || 0) > 0) {
            shouldReset = true;
          }
        }

        if (shouldReset) {
          await base44.entities.Customer.update(c.id, { points: 0 }).catch(() => {});
          resetCount++;
        }
      }

      toast.success(`Đã mô phỏng reset điểm thành công! Có ${resetCount} khách hàng bị reset điểm tích lũy.`);
      onChanged?.();
    } catch (e) {
      toast.error('Lỗi chạy mô phỏng: ' + e.message);
    }
    setRunningReset(false);
  };

  const filteredCatalog = allItems.filter(item => 
    item.name.toLowerCase().includes(searchCatalog.toLowerCase()) || 
    item.type.toLowerCase().includes(searchCatalog.toLowerCase())
  );

  if (loading) {
    return <div className="py-12 text-center text-xs text-slate-400">Đang tải cấu hình tích điểm...</div>;
  }

  return (
    <div className="grid md:grid-cols-12 gap-5 items-start">
      {/* Simulation Reset Banner */}
      <div className="col-span-12 bg-amber-50/50 rounded-2xl p-4 border border-amber-100 flex flex-wrap items-center justify-between gap-3">
        <div className="text-left space-y-0.5">
          <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5"><ShieldAlert className="w-4 h-4 text-amber-500" /> Cài đặt & Mô phỏng Reset điểm tích luỹ</div>
          <div className="text-[10px] text-slate-400 font-semibold">Bấm nút để mô phỏng dọn dẹp điểm tích lũy của những khách hàng quá chu kỳ không ghé spa.</div>
        </div>
        <button
          onClick={simulateReset}
          disabled={runningReset || resetSchedule === 'none'}
          className="px-4 py-2 bg-amber-500 text-white rounded-xl text-xs font-bold shadow-sm hover:opacity-95 disabled:opacity-50 transition-all flex items-center gap-1.5 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${runningReset ? 'animate-spin' : ''}`} /> Mô phỏng reset điểm
        </button>
      </div>

      {/* Column 1: Config Rule & Reset Schedule */}
      <div className="col-span-12 md:col-span-6 bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-5">
        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
          <h3 className="font-bold text-sm text-slate-800">Quy tắc tích luỹ điểm</h3>
          <button onClick={handleSave} disabled={saving} className="px-3.5 py-1.5 rounded-xl bg-primary text-white text-xs font-bold hover:opacity-95 transition-all flex items-center gap-1.5 shadow-sm">
            <Save className="w-3.5 h-3.5" /> {saving ? 'Đang lưu...' : 'Lưu cấu hình'}
          </button>
        </div>

        <div className="space-y-4 text-left">
          {/* Points Per Cash Ratio */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="block text-xs font-bold text-slate-700">Tỷ lệ quy đổi điểm</span>
              <span className="text-[10px] text-slate-400 font-semibold">Quy đổi số tiền chi tiêu của hóa đơn sang 1 điểm tích lũy.</span>
            </div>
            <div className="relative w-36 shrink-0">
              <input type="number" value={pointsPerVnd} onChange={(e) => setPointsPerVnd(e.target.value)} className="w-full pl-3 pr-8 py-2 border border-slate-200 rounded-xl text-sm text-right text-slate-700 outline-none focus:border-primary bg-white" />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">đ</span>
            </div>
          </div>

          {/* Checklist Toggles */}
          <div className="space-y-2">
            <span className="block text-xs text-slate-400 px-1">Tích điểm khi thanh toán</span>
            
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 cursor-pointer select-none">
                <input type="checkbox" checked={earnOnService} onChange={(e) => setEarnOnService(e.target.checked)} className="rounded border-slate-350 text-primary focus:ring-primary w-4 h-4" />
                <span className="text-xs font-medium text-slate-600">Dùng dịch vụ</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 cursor-pointer select-none">
                <input type="checkbox" checked={earnOnProduct} onChange={(e) => setEarnOnProduct(e.target.checked)} className="rounded border-slate-350 text-primary focus:ring-primary w-4 h-4" />
                <span className="text-xs font-medium text-slate-600">Mua sản phẩm</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 cursor-pointer select-none">
                <input type="checkbox" checked={earnOnPackage} onChange={(e) => setEarnOnPackage(e.target.checked)} className="rounded border-slate-350 text-primary focus:ring-primary w-4 h-4" />
                <span className="text-xs font-medium text-slate-600">Mua gói dịch vụ</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 cursor-pointer select-none">
                <input type="checkbox" checked={earnOnTreatment} onChange={(e) => setEarnOnTreatment(e.target.checked)} className="rounded border-slate-350 text-primary focus:ring-primary w-4 h-4" />
                <span className="text-xs font-medium text-slate-600">Mua liệu trình</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 cursor-pointer select-none">
                <input type="checkbox" checked={earnOnPrepaidCard} onChange={(e) => setEarnOnPrepaidCard(e.target.checked)} className="rounded border-slate-350 text-primary focus:ring-primary w-4 h-4" />
                <span className="text-xs font-medium text-slate-600">Mua thẻ tiền mặt</span>
              </label>
            </div>
          </div>

          {/* Booking & Referral Points bonus */}
          <div className="space-y-2 pt-1">
            <span className="block text-xs text-slate-400 px-1">Điểm thưởng hoạt động</span>
            
            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="flex items-center gap-2 mb-1.5 cursor-pointer select-none">
                  <input type="checkbox" checked={earnOnBooking} onChange={(e) => setEarnOnBooking(e.target.checked)} className="rounded border-slate-350 text-primary focus:ring-primary w-3.5 h-3.5" />
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Đặt lịch trước</span>
                </label>
                <input type="number" disabled={!earnOnBooking} value={bookingPoints} onChange={(e) => setBookingPoints(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-primary disabled:opacity-40 text-slate-700 bg-white" placeholder="Số điểm thưởng..." />
              </div>

              <div>
                <label className="flex items-center gap-2 mb-1.5 cursor-pointer select-none">
                  <input type="checkbox" checked={earnOnReferral} onChange={(e) => setEarnOnReferral(e.target.checked)} className="rounded border-slate-350 text-primary focus:ring-primary w-3.5 h-3.5" />
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Giới thiệu khách</span>
                </label>
                <input type="number" disabled={!earnOnReferral} value={referralPoints} onChange={(e) => setReferralPoints(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-primary disabled:opacity-40 text-slate-700 bg-white" placeholder="Số điểm thưởng..." />
              </div>
            </div>
          </div>

          {/* Reset settings */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <span className="block text-xs text-slate-400 px-1">Lịch reset điểm tích luỹ</span>
            
            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Chu kỳ reset điểm</label>
                <div className="relative">
                  <select value={resetSchedule} onChange={(e) => setResetSchedule(e.target.value)} className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm outline-none bg-white text-slate-700 appearance-none">
                    <option value="none">Không reset</option>
                    <option value="annually">Hằng năm</option>
                    <option value="half_yearly">Hằng 6 tháng</option>
                    <option value="quarterly">Hằng quý</option>
                    <option value="inactivity_duration">Xét khoảng thời gian không ghé</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {resetSchedule === 'inactivity_duration' && (
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Số ngày không ghé tối đa</label>
                  <input type="number" value={resetInactivityDays} onChange={(e) => setResetInactivityDays(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-primary text-slate-700 bg-white" placeholder="Ví dụ: 365" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Column 2: Items exclusion catalog selection */}
      <div className="col-span-12 md:col-span-6 bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col min-h-[460px]">
        <div className="border-b border-slate-100 pb-2">
          <h3 className="font-bold text-sm text-slate-800 text-left">Danh sách loại trừ tích điểm</h3>
          <p className="text-[10px] text-slate-400 font-semibold text-left">Tích chọn các dịch vụ hoặc sản phẩm cụ thể muốn LOẠI TRỪ không cho tích điểm.</p>
        </div>

        {/* Search inside catalog list */}
        <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-2.5 py-1.5 mt-3 shrink-0">
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <input value={searchCatalog} onChange={(e) => setSearchCatalog(e.target.value)} placeholder="Tìm dịch vụ/sản phẩm loại trừ..." className="text-xs bg-transparent outline-none flex-grow" />
        </div>

        {/* Items List scroll */}
        <div className="overflow-y-auto flex-grow max-h-[300px] space-y-2 mt-4 pr-1">
          {filteredCatalog.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">Không tìm thấy sản phẩm/dịch vụ nào</div>
          ) : (
            filteredCatalog.map((item) => {
              const isExcluded = excludedItemIds.includes(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => handleToggleExclusion(item.id)}
                  className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                    isExcluded ? 'bg-red-50/30 border-red-200 text-red-700 font-semibold' : 'bg-slate-50 border-slate-100 text-slate-650 hover:bg-slate-100/50'
                  }`}
                >
                  <div className="text-left min-w-0">
                    <span className="font-bold text-xs truncate block">{item.name}</span>
                    <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">{item.type}</span>
                  </div>

                  <span className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                    isExcluded ? 'bg-red-500 border-red-500 text-white' : 'border-slate-300 bg-white'
                  }`}>
                    {isExcluded && <Check className="w-3 h-3 stroke-[3]" />}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
