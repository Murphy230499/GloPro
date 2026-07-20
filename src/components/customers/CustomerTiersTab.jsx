'use client';
import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, ShieldCheck, Play, Sparkles, ChevronDown, X } from 'lucide-react';
import { formatVND } from '@/lib/format';
import { toast } from '@/components/Layout';
import { base44 } from '@/api/base44Client';
import { loadCustomerTiers, saveCustomerTier, deleteCustomerTier, saveCustomerTierHistory, loadCustomerTierHistory } from '@/utils/loyaltyFallbacks';

const COLORS = ['#FF6B9D', '#34D399', '#60A5FA', '#A78BFA', '#FBBF24', '#F97316', '#FB7185', '#06B6D4', '#94A3B8'];
const PERIOD_LABELS = {
  year: 'Hằng năm',
  '6_months': 'Hằng 6 tháng',
  quarter: 'Hằng quý',
  upgrade_duration: 'Số ngày sau nâng hạng'
};

export default function CustomerTiersTab({ onChanged, createTrigger }) {
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [runningCheck, setRunningCheck] = useState(false);

  // Form states
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [minSpend, setMinSpend] = useState('');
  const [minPoints, setMinPoints] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');
  const [discountAmount, setDiscountAmount] = useState('');
  const [maintenancePeriod, setMaintenancePeriod] = useState('year');
  const [maintenanceDays, setMaintenanceDays] = useState('365');
  const [color, setColor] = useState(COLORS[0]);
  const [showFormModal, setShowFormModal] = useState(false);

  const load = async () => {
    setLoading(true);
    const data = await loadCustomerTiers();
    setTiers(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (createTrigger > 0) {
      resetForm();
      setShowFormModal(true);
    }
  }, [createTrigger]);

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setMinSpend('');
    setMinPoints('');
    setDiscountPercent('');
    setDiscountAmount('');
    setMaintenancePeriod('year');
    setMaintenanceDays('365');
    setColor(COLORS[0]);
  };

  const resetFormAndClose = () => {
    resetForm();
    setShowFormModal(false);
  };

  const handleSave = async () => {
    if (!name.trim()) return toast.error('Vui lòng nhập tên hạng');
    const data = {
      id: editingId,
      name,
      min_spend: Number(minSpend) || 0,
      min_points: Number(minPoints) || 0,
      discount_percent: Number(discountPercent) || 0,
      discount_amount: Number(discountAmount) || 0,
      maintenance_period: maintenancePeriod,
      maintenance_days: Number(maintenanceDays) || 365,
      color
    };

    await saveCustomerTier(data);
    toast.success(editingId ? 'Đã cập nhật hạng thành viên' : 'Đã thêm hạng thành viên');
    resetFormAndClose();
    load();
    onChanged?.();
  };

  const handleEdit = (t) => {
    setEditingId(t.id);
    setName(t.name || '');
    setMinSpend(t.min_spend || '');
    setMinPoints(t.min_points || '');
    setDiscountPercent(t.discount_percent || '');
    setDiscountAmount(t.discount_amount || '');
    setMaintenancePeriod(t.maintenance_period || 'year');
    setMaintenanceDays(t.maintenance_days || '365');
    setColor(t.color || COLORS[0]);
    setShowFormModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa hạng này? Khách hàng thuộc hạng này sẽ trở về Hạng thường.')) return;
    await deleteCustomerTier(id);
    toast.success('Đã xóa hạng thành viên');
    load();
    onChanged?.();
  };

  const runMaintenanceCheck = async () => {
    setRunningCheck(true);
    try {
      const custs = await base44.entities.Customer.list();
      const loadedTiers = await loadCustomerTiers();
      
      // Sort tiers descending to match highest eligible tier
      const sortedTiers = [...loadedTiers].sort((a, b) => b.min_spend - a.min_spend);
      let changeCount = 0;
      
      const localMappings = localStorage.getItem('glopro_customer_group_mappings');
      const mappings = localMappings ? JSON.parse(localMappings) : {};

      for (let c of custs) {
        const spend = c.total_spent || 0;
        const pts = c.points || 0;
        
        // Find the matched tier
        const matchedTier = sortedTiers.find(t => spend >= t.min_spend || pts >= t.min_points);
        const currentTierId = c.group_id || mappings[c.id];

        if (matchedTier && currentTierId !== matchedTier.id) {
          const currentTierName = loadedTiers.find(x => x.id === currentTierId)?.name || 'Hạng thường';
          
          // Log history
          await saveCustomerTierHistory({
            customer_id: c.id,
            customer_name: c.name,
            old_tier_name: currentTierName,
            new_tier_name: matchedTier.name,
            reason: 'Tự động kiểm tra nâng hạng định kỳ của hệ thống',
            date: new Date().toISOString().split('T')[0]
          });

          // Save mapping local
          mappings[c.id] = matchedTier.id;
          
          // Try to update DB customer object group_id
          await base44.entities.Customer.update(c.id, { group_id: matchedTier.id }).catch(() => {});
          
          changeCount++;
        }
      }

      localStorage.setItem('glopro_customer_group_mappings', JSON.stringify(mappings));
      toast.success(`Đã hoàn tất xét duy trì hạng! Có ${changeCount} khách hàng được thay đổi hạng.`);
      onChanged?.();
    } catch (e) {
      toast.error('Lỗi chạy kiểm tra duy trì hạng: ' + e.message);
    }
    setRunningCheck(false);
  };

  return (
    <div className="space-y-5">
      {/* Simulation Box */}
      <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10 flex flex-wrap items-center justify-between gap-3 text-left">
        <div className="text-left space-y-0.5">
          <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-primary" /> Xét duyệt nâng & hạ hạng tự động</div>
          <div className="text-[10px] text-slate-400 font-semibold">Chạy quét toàn bộ chi tiêu và điểm tích luỹ khách hàng theo chu kỳ thiết lập.</div>
        </div>
        <button
          onClick={runMaintenanceCheck}
          disabled={runningCheck}
          className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold shadow-sm hover:opacity-95 disabled:opacity-50 transition-all flex items-center gap-1.5 shrink-0"
        >
          <Play className="w-3.5 h-3.5 fill-white" /> {runningCheck ? 'Đang xét hạng...' : 'Chạy xét duy trì hạng'}
        </button>
      </div>

      {/* Main List: Display tiers list */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
          <h3 className="font-bold text-sm text-slate-800">Danh sách hạng thành viên hiện tại</h3>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Đang tải cấu hình hạng...</div>
        ) : tiers.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 font-sans">Chưa có hạng thành viên nào được định nghĩa</div>
        ) : (
          <div className="space-y-3">
            {tiers.map((t) => (
              <div key={t.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-white" style={{ background: t.color }}>
                    <Sparkles className="w-2.5 h-2.5" />
                  </span>
                  <div className="text-left font-sans">
                    <div className="font-bold text-xs text-slate-700">{t.name}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5 font-normal">
                      Điều kiện: Chi tiêu <span className="font-semibold text-slate-600">{formatVND(t.min_spend)}</span> hoặc <span className="font-semibold text-slate-600">{t.min_points} điểm</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 font-normal">
                      Quyền lợi: Giảm {t.discount_percent > 0 ? `${t.discount_percent}%` : formatVND(t.discount_amount)} hóa đơn • Chu kỳ: {t.maintenance_period === 'upgrade_duration' ? `${t.maintenance_days} ngày` : PERIOD_LABELS[t.maintenance_period]}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button onClick={() => handleEdit(t)} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors" title="Chỉnh sửa"><Edit3 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(t.id)} className="p-2 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors" title="Xóa"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Left Form: Tier Config Modal Popup */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-in fade-in duration-200" onClick={resetFormAndClose}>
          <div className="bg-slate-50 rounded-3xl p-6 max-w-md w-full border border-slate-105 shadow-2xl relative text-left flex flex-col max-h-[90vh] overflow-y-auto animate-in scale-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-150/50 pb-4 mb-4 shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-800 font-sans">{editingId ? 'Chỉnh sửa hạng khách' : 'Tạo hạng khách mới'}</h3>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5 font-sans">Thiết lập điều kiện & Quyền lợi</p>
              </div>
              <button 
                onClick={resetFormAndClose} 
                className="w-8 h-8 rounded-full bg-slate-200/50 flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Content */}
            <div className="space-y-4 font-sans text-xs">
              <div>
                <label className="block font-bold text-slate-500 mb-1">Tên hạng thành viên</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ví dụ: Hạng Vàng, VIP, Diamond..." className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-primary text-slate-700 bg-white" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-500 mb-1">Tổng chi tiêu tối thiểu</label>
                  <input type="number" value={minSpend} onChange={(e) => setMinSpend(e.target.value)} placeholder="Ví dụ: 5,000,000" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-primary text-slate-700 bg-white" />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 mb-1">Hoặc số điểm tối thiểu</label>
                  <input type="number" value={minPoints} onChange={(e) => setMinPoints(e.target.value)} placeholder="Ví dụ: 500" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-primary text-slate-700 bg-white" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-500 mb-1">Giảm giá mặc định (%)</label>
                  <input type="number" value={discountPercent} onChange={(e) => setDiscountPercent(e.target.value)} placeholder="Ví dụ: 5" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-primary text-slate-700 bg-white" />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 mb-1">Hoặc giảm giá số tiền</label>
                  <input type="number" value={discountAmount} onChange={(e) => setDiscountAmount(e.target.value)} placeholder="Ví dụ: 50,000" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-primary text-slate-700 bg-white" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-500 mb-1">Chu kỳ duy trì</label>
                  <div className="relative">
                    <select value={maintenancePeriod} onChange={(e) => setMaintenancePeriod(e.target.value)} className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs outline-none bg-white text-slate-700 appearance-none">
                      <option value="year">Hằng năm</option>
                      <option value="6_months">Hằng 6 tháng</option>
                      <option value="quarter">Hằng quý</option>
                      <option value="upgrade_duration">Thời gian sau nâng hạng</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                {maintenancePeriod === 'upgrade_duration' && (
                  <div>
                    <label className="block font-bold text-slate-500 mb-1">Số ngày duy trì</label>
                    <input type="number" value={maintenanceDays} onChange={(e) => setMaintenanceDays(e.target.value)} placeholder="365" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-primary text-slate-700 bg-white" />
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-500 mb-1.5">Màu đại diện</label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {COLORS.map((c) => (
                    <button key={c} onClick={() => setColor(c)} className={`w-7 h-7 rounded-full transition-all ${color === c ? 'ring-2 ring-offset-2 ring-slate-400 scale-105' : ''}`} style={{ background: c }} />
                  ))}
                </div>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="flex gap-2 pt-4 border-t border-slate-150/50 mt-4 shrink-0">
              <button onClick={resetFormAndClose} className="flex-1 py-2.5 rounded-xl bg-slate-250 hover:bg-slate-300 transition-colors font-bold text-xs text-slate-600 font-sans">Hủy</button>
              <button onClick={handleSave} className="flex-1 py-2.5 rounded-xl bg-primary text-white font-bold text-xs shadow-sm hover:opacity-95 transition-all font-sans">
                {editingId ? 'Cập nhật' : 'Thêm hạng'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
