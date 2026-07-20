'use client';
import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, Users, Search, Sparkles, ChevronDown, X, Gift } from 'lucide-react';
import Avatar from '@/components/Avatar';
import { formatVND } from '@/lib/format';
import { toast } from '@/components/Layout';
import { base44 } from '@/api/base44Client';
import { loadCustomerSegments, saveCustomerSegment, deleteCustomerSegment } from '@/utils/loyaltyFallbacks';

const COLORS = ['#34D399', '#60A5FA', '#FF6B9D', '#A78BFA', '#FBBF24', '#F97316', '#FB7185', '#06B6D4', '#94A3B8'];

export default function CustomerSegmentsTab({ createTrigger }) {
  const [segments, setSegments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedSegId, setSelectedSegId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [lastVisitDays, setLastVisitDays] = useState('');
  const [totalSpent, setTotalSpent] = useState('');
  const [visitCount, setVisitCount] = useState('');
  const [birthdayMonth, setBirthdayMonth] = useState('');
  const [gender, setGender] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);

  // Awards and analytics states
  const [awards, setAwards] = useState([]);
  const [usages, setUsages] = useState([]);
  const [showAwardModal, setShowAwardModal] = useState(false);
  const [availableCampaigns, setAvailableCampaigns] = useState([]);
  const [selectedCampaignIds, setSelectedCampaignIds] = useState([]);

  const load = async () => {
    setLoading(true);
    const segs = await loadCustomerSegments();
    setSegments(segs);
    if (segs.length > 0 && !selectedSegId) {
      setSelectedSegId(segs[0].id);
    }
    const custs = await base44.entities.Customer.list().catch(() => []);
    setCustomers(custs);
    setLoading(false);
  };

  const loadAwardsAndUsages = () => {
    try {
      const localAwards = localStorage.getItem('glopro_segment_campaign_awards');
      setAwards(localAwards ? JSON.parse(localAwards) : []);

      const localUsages = localStorage.getItem('glopro_promo_usages');
      setUsages(localUsages ? JSON.parse(localUsages) : []);

      const localPromos = localStorage.getItem('glopro_promotions');
      const parsedPromos = localPromos ? JSON.parse(localPromos) : [];
      setAvailableCampaigns(parsedPromos);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (createTrigger > 0) {
      resetForm();
      setShowFormModal(true);
    }
  }, [createTrigger]);

  useEffect(() => {
    loadAwardsAndUsages();
  }, [selectedSegId]);

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setColor(COLORS[0]);
    setLastVisitDays('');
    setTotalSpent('');
    setVisitCount('');
    setBirthdayMonth('');
    setGender('');
  };

  const resetFormAndClose = () => {
    resetForm();
    setShowFormModal(false);
  };

  const handleApplyTemplate = (type) => {
    const currentMonth = new Date().getMonth() + 1;
    if (type === 'inactive') {
      setName('Khách hàng ngủ đông (Chưa ghé > 30 ngày)');
      setLastVisitDays('30');
      setTotalSpent('');
      setVisitCount('');
      setBirthdayMonth('');
      setGender('');
      setColor('#EF4444');
    } else if (type === 'vip') {
      setName('Khách hàng VIP (Tổng chi tiêu > 5tr)');
      setLastVisitDays('');
      setTotalSpent('5000000');
      setVisitCount('');
      setBirthdayMonth('');
      setGender('');
      setColor('#FBBF24');
    } else if (type === 'birthday') {
      setName(`Khách hàng sinh nhật trong Tháng ${currentMonth}`);
      setLastVisitDays('');
      setTotalSpent('');
      setVisitCount('');
      setBirthdayMonth(currentMonth.toString());
      setGender('');
      setColor('#FF6B9D');
    } else if (type === 'new') {
      setName('Khách hàng mới (Số lần đến = 1)');
      setLastVisitDays('');
      setTotalSpent('');
      setVisitCount('1');
      setBirthdayMonth('');
      setGender('');
      setColor('#3B82F6');
    }
    toast.success('Đã áp dụng mẫu điều kiện');
  };

  const handleSave = async () => {
    if (!name.trim()) return toast.error('Vui lòng nhập tên tập khách hàng');
    
    const conditions = {};
    if (lastVisitDays) conditions.last_visit_days_gt = Number(lastVisitDays);
    if (totalSpent) conditions.total_spent_gt = Number(totalSpent);
    if (visitCount) conditions.visit_count_eq = Number(visitCount);
    if (birthdayMonth) conditions.birthday_month_eq = Number(birthdayMonth);
    if (gender) conditions.gender = gender;

    const data = {
      id: editingId,
      name,
      color,
      conditions
    };

    const saved = await saveCustomerSegment(data);
    toast.success(editingId ? 'Đã cập nhật tập khách hàng' : 'Đã tạo tập khách hàng');
    
    resetFormAndClose();
    setSelectedSegId(saved.id);
    load();
  };

  const handleAwardCampaigns = () => {
    if (selectedCampaignIds.length === 0) return toast.error('Vui lòng chọn ít nhất một chương trình khuyến mãi');
    if (!activeSegment) return;

    try {
      const localAwards = localStorage.getItem('glopro_segment_campaign_awards');
      let parsedAwards = localAwards ? JSON.parse(localAwards) : [];

      const segmentCustomerIds = matchedCustomers.map(c => c.id);

      selectedCampaignIds.forEach(campaignId => {
        const campaign = availableCampaigns.find(c => c.id === campaignId);
        if (!campaign) return;

        const newAward = {
          id: 'award_' + Date.now() + Math.random().toString(36).substr(2, 5),
          segment_id: activeSegment.id,
          segment_name: activeSegment.name,
          campaign_id: campaign.id,
          campaign_name: campaign.name,
          awarded_at: new Date().toISOString().split('T')[0],
          customer_ids: segmentCustomerIds,
          expiry_date: campaign.expiryDate
        };

        parsedAwards.push(newAward);
      });

      localStorage.setItem('glopro_segment_campaign_awards', JSON.stringify(parsedAwards));
      toast.success('Đã gửi tặng chương trình khuyến mãi thành công!');
      
      setSelectedCampaignIds([]);
      setShowAwardModal(false);
      loadAwardsAndUsages();
    } catch (e) {
      console.error(e);
      toast.error('Lỗi khi lưu thông tin tặng khuyến mãi');
    }
  };

  const handleEdit = (s) => {
    setEditingId(s.id);
    setName(s.name || '');
    setColor(s.color || COLORS[0]);
    const cond = s.conditions || {};
    setLastVisitDays(cond.last_visit_days_gt || '');
    setTotalSpent(cond.total_spent_gt || '');
    setVisitCount(cond.visit_count_eq || '');
    setBirthdayMonth(cond.birthday_month_eq || '');
    setGender(cond.gender || '');
    setShowFormModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa tập khách hàng này?')) return;
    await deleteCustomerSegment(id);
    toast.success('Đã xóa tập khách hàng');
    if (selectedSegId === id) setSelectedSegId(null);
    load();
  };

  const evaluateCustomer = (c, cond) => {
    if (!cond) return true;

    // 1. last_visit_days_gt
    if (cond.last_visit_days_gt !== undefined) {
      if (!c.last_visit) return false;
      const diffTime = Math.abs(new Date() - new Date(c.last_visit));
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays <= Number(cond.last_visit_days_gt)) return false;
    }

    // 2. total_spent_gt
    if (cond.total_spent_gt !== undefined) {
      if ((c.total_spent || 0) <= Number(cond.total_spent_gt)) return false;
    }

    // 3. visit_count_eq
    if (cond.visit_count_eq !== undefined) {
      if ((c.visit_count || 0) !== Number(cond.visit_count_eq)) return false;
    }

    // 4. birthday_month_eq
    if (cond.birthday_month_eq !== undefined) {
      if (!c.birthday) return false;
      const month = new Date(c.birthday).getMonth() + 1;
      if (month !== Number(cond.birthday_month_eq)) return false;
    }

    // 5. gender
    if (cond.gender) {
      if (c.gender !== cond.gender) return false;
    }

    return true;
  };

  const activeSegment = segments.find(s => s.id === selectedSegId);
  const matchedCustomers = customers.filter(c => evaluateCustomer(c, activeSegment?.conditions));

  const segmentAwards = awards.filter(a => a.segment_id === activeSegment?.id);

  const awardStats = segmentAwards.map(a => {
    const awardUsages = usages.filter(u => u.campaign_id === a.campaign_id && a.customer_ids.includes(u.customer_id));
    const usedCount = awardUsages.length;
    
    const today = new Date().toISOString().split('T')[0];
    const isExpired = a.expiry_date < today;

    const usedCustomerIds = new Set(awardUsages.map(u => u.customer_id));
    let unusedCount = 0;
    let expiredCount = 0;

    a.customer_ids.forEach(cid => {
      const hasUsed = usedCustomerIds.has(cid);
      if (!hasUsed) {
        if (isExpired) {
          expiredCount++;
        } else {
          unusedCount++;
        }
      }
    });

    const totalCost = awardUsages.reduce((sum, u) => sum + (u.discount_amount || 0), 0);
    const totalRevenue = awardUsages.reduce((sum, u) => sum + (u.invoice_total || 0), 0);

    return {
      ...a,
      awardedCount: a.customer_ids.length,
      usedCount,
      unusedCount,
      expiredCount,
      totalCost,
      totalRevenue,
      usages: awardUsages
    };
  });

  const segmentUsages = usages.filter(u => 
    segmentAwards.some(a => a.campaign_id === u.campaign_id && a.customer_ids.includes(u.customer_id))
  );

  return (
    <div className="grid md:grid-cols-12 gap-5 items-start">
      {/* Left pane: Segments list selector */}
      <div className="col-span-12 md:col-span-6 bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-2">Danh sách tập khách hàng</h3>
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Đang tải tập khách hàng...</div>
        ) : segments.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 font-sans">Chưa có tập khách hàng nào</div>
        ) : (
          <div className="space-y-2">
            {segments.map((s) => {
              const isSelected = selectedSegId === s.id;
              return (
                <div
                  key={s.id}
                  onClick={() => setSelectedSegId(s.id)}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                    isSelected ? 'bg-slate-50 border-primary shadow-xs' : 'border-slate-100 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ background: s.color }} />
                    <div className="font-semibold text-xs text-slate-700 truncate font-sans">{s.name}</div>
                  </div>

                  <div className="flex items-center shrink-0">
                    <button onClick={(e) => { e.stopPropagation(); handleEdit(s); }} className="p-1.5 text-slate-400 hover:text-slate-655 rounded-lg hover:bg-slate-100 transition-colors" title="Sửa"><Edit3 className="w-3.5 h-3.5" /></button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }} className="p-1.5 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors" title="Xóa"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Right pane: Real-time matched customers list */}
      <div className="col-span-12 md:col-span-6 bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col min-h-[400px]">
        <div className="border-b border-slate-100 pb-2 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-slate-800">Khách hàng thuộc tập</h3>
            <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full font-sans">
              {matchedCustomers.length} khách
            </span>
          </div>
          {activeSegment && matchedCustomers.length > 0 && (
            <button 
              onClick={() => setShowAwardModal(true)}
              className="px-2.5 py-1.5 bg-pink-500 hover:bg-pink-650 text-white rounded-xl text-[10px] font-bold shadow-xs transition-all flex items-center gap-1.5 font-sans"
            >
              <Gift className="w-3.5 h-3.5" /> Tặng khuyến mãi
            </button>
          )}
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400 flex-1 flex items-center justify-center">Đang tải khách hàng...</div>
        ) : matchedCustomers.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 flex-1 flex items-center justify-center font-sans">Không có khách hàng nào đạt điều kiện</div>
        ) : (
          <div className="overflow-y-auto flex-grow max-h-[350px] space-y-3 pt-2">
            {matchedCustomers.map((c) => (
              <div key={c.id} className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 border border-slate-100">
                <Avatar src={c.avatar_url} name={c.name} size={36} color="#E879A9" />
                <div className="text-left min-w-0 flex-1 font-sans">
                  <div className="font-bold text-xs text-slate-700 truncate">{c.name}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5 font-normal">SĐT: {c.phone}</div>
                </div>
                <div className="text-right shrink-0 font-sans">
                  <div className="text-xs font-bold text-pink-600">{formatVND(c.total_spent || 0)}</div>
                  <div className="text-[9px] text-slate-400 mt-0.5 font-normal">{c.visit_count || 0} lần đến</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Segment Config Popup Modal Dialog */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-in fade-in duration-200" onClick={resetFormAndClose}>
          <div className="bg-slate-50 rounded-3xl p-6 max-w-md w-full border border-slate-105 shadow-2xl relative text-left flex flex-col max-h-[90vh] overflow-y-auto animate-in scale-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-150/50 pb-4 mb-4 shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-800 font-sans">{editingId ? 'Chỉnh sửa tập khách' : 'Tạo tập khách hàng mới'}</h3>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5 font-sans">Thiết lập các điều kiện lọc khách hàng</p>
              </div>
              <button 
                onClick={resetFormAndClose} 
                className="w-8 h-8 rounded-full bg-slate-200/50 flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* suggestion templates */}
            <div className="space-y-1.5 mb-4">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans">Mẫu điều kiện gợi ý</label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => handleApplyTemplate('inactive')} className="p-2 border border-red-100 bg-red-50/50 hover:bg-red-50 text-red-600 rounded-xl text-[10px] font-bold transition-all text-center font-sans">💤 Khách ngủ đông</button>
                <button type="button" onClick={() => handleApplyTemplate('vip')} className="p-2 border border-amber-100 bg-amber-50/50 hover:bg-amber-50 text-amber-600 rounded-xl text-[10px] font-bold transition-all text-center font-sans">💎 Khách hàng VIP</button>
                <button type="button" onClick={() => handleApplyTemplate('birthday')} className="p-2 border border-pink-100 bg-pink-50/50 hover:bg-pink-50 text-pink-600 rounded-xl text-[10px] font-bold transition-all text-center font-sans">🎂 Sinh nhật tháng</button>
                <button type="button" onClick={() => handleApplyTemplate('new')} className="p-2 border border-blue-100 bg-blue-50/50 hover:bg-blue-50 text-blue-600 rounded-xl text-[10px] font-bold transition-all text-center font-sans">✨ Khách hàng mới</button>
              </div>
            </div>

            {/* config inputs */}
            <div className="space-y-4 font-sans text-xs flex-grow">
              <div>
                <label className="block font-bold text-slate-500 mb-1">Tên tập khách hàng</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ví dụ: Khách sinh nhật tháng 7..." className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-primary text-slate-700 bg-white" />
              </div>

              <div>
                <label className="block font-bold text-slate-500 mb-1">Số ngày chưa ghé lớn hơn (ngày)</label>
                <input type="number" value={lastVisitDays} onChange={(e) => setLastVisitDays(e.target.value)} placeholder="Ví dụ: 30" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-primary text-slate-700 bg-white" />
              </div>

              <div>
                <label className="block font-bold text-slate-500 mb-1">Tổng chi tiêu lớn hơn (VNĐ)</label>
                <input type="number" value={totalSpent} onChange={(e) => setTotalSpent(e.target.value)} placeholder="Ví dụ: 5,000,000" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-primary text-slate-700 bg-white" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-500 mb-1">Số lần ghé bằng</label>
                  <input type="number" value={visitCount} onChange={(e) => setVisitCount(e.target.value)} placeholder="Ví dụ: 1" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-primary text-slate-700 bg-white" />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 mb-1">Tháng sinh nhật</label>
                  <div className="relative">
                    <select value={birthdayMonth} onChange={(e) => setBirthdayMonth(e.target.value)} className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs outline-none bg-white text-slate-700 appearance-none">
                      <option value="">— Chọn tháng —</option>
                      {[...Array(12)].map((_, i) => <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-500 mb-1">Giới tính</label>
                <div className="relative">
                  <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs outline-none bg-white text-slate-700 appearance-none">
                    <option value="">— Tất cả giới tính —</option>
                    <option value="female">Nữ</option>
                    <option value="male">Nam</option>
                    <option value="other">Khác</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-500 mb-1.5">Màu nhãn dán</label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {COLORS.map((c) => (
                    <button key={c} type="button" onClick={() => setColor(c)} className={`w-6 h-6 rounded-full transition-all ${color === c ? 'ring-2 ring-offset-2 ring-slate-400 scale-105' : ''}`} style={{ background: c }} />
                  ))}
                </div>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="flex gap-2 pt-4 border-t border-slate-150/50 mt-4 shrink-0">
              <button type="button" onClick={resetFormAndClose} className="flex-1 py-2.5 rounded-xl bg-slate-250 hover:bg-slate-300 transition-colors font-bold text-xs text-slate-600 font-sans">Hủy</button>
              <button type="button" onClick={handleSave} className="flex-1 py-2.5 rounded-xl bg-primary text-white font-bold text-xs shadow-sm hover:opacity-95 transition-all font-sans">
                {editingId ? 'Cập nhật' : 'Tạo tập khách'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Campaign Analytics Panel */}
      {activeSegment && (
        <div className="col-span-12 bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-6 text-left">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-800 font-sans">Báo cáo hiệu quả CTKM đã tặng</h3>
            <p className="text-[10px] text-slate-400 mt-0.5 font-semibold font-sans">Thống kê chi phí, doanh thu và tình trạng sử dụng của các chương trình khuyến mãi đã áp dụng cho tập khách hàng này.</p>
          </div>

          {awardStats.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 font-sans">Chưa có chiến dịch khuyến mãi nào được tặng cho tập này.</div>
          ) : (
            <div className="space-y-6">
              {/* Campaign summary table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-100">
                <table className="w-full text-xs font-sans text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-450 font-bold border-b border-slate-100">
                      <th className="p-3">Tên chương trình</th>
                      <th className="p-3 text-center">Đã tặng</th>
                      <th className="p-3 text-center">Đã dùng</th>
                      <th className="p-3 text-center">Chưa dùng</th>
                      <th className="p-3 text-center">Hết hạn</th>
                      <th className="p-3 text-right">Tổng chi phí</th>
                      <th className="p-3 text-right">Doanh thu mang về</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {awardStats.map(stat => (
                      <tr key={stat.id} className="hover:bg-slate-50/50">
                        <td className="p-3 font-semibold text-slate-700">{stat.campaign_name}</td>
                        <td className="p-3 text-center font-semibold text-slate-600">{stat.awardedCount}</td>
                        <td className="p-3 text-center font-bold text-emerald-600">{stat.usedCount}</td>
                        <td className="p-3 text-center font-semibold text-slate-500">{stat.unusedCount}</td>
                        <td className="p-3 text-center font-semibold text-red-500">{stat.expiredCount}</td>
                        <td className="p-3 text-right font-bold text-pink-600">{formatVND(stat.totalCost)}</td>
                        <td className="p-3 text-right font-bold text-slate-700">{formatVND(stat.totalRevenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Detailed usages list */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs text-slate-700 border-b border-slate-100 pb-1.5 flex items-center justify-between">
                  <span>Chi tiết khách hàng đã sử dụng</span>
                  <span className="text-[10px] font-normal text-slate-400 font-sans">Tổng cộng: {segmentUsages.length} lượt sử dụng</span>
                </h4>

                {segmentUsages.length === 0 ? (
                  <div className="py-4 text-center text-xs text-slate-400 font-sans">Chưa có khách hàng nào sử dụng ưu đãi.</div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-100">
                    <table className="w-full text-xs font-sans text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-450 font-bold border-b border-slate-100">
                          <th className="p-3">Khách hàng</th>
                          <th className="p-3">Chương trình khuyến mãi</th>
                          <th className="p-3">Mã hóa đơn</th>
                          <th className="p-3 text-right">Giá trị đơn</th>
                          <th className="p-3 text-right">Số tiền giảm</th>
                          <th className="p-3 text-center">Ngày sử dụng</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {segmentUsages.map(u => (
                          <tr key={u.id} className="hover:bg-slate-50/50">
                            <td className="p-3 font-semibold text-slate-700">{u.customer_name}</td>
                            <td className="p-3 text-slate-600">{u.campaign_name}</td>
                            <td className="p-3 font-semibold text-primary">{u.invoice_code}</td>
                            <td className="p-3 text-right font-bold text-slate-700">{formatVND(u.invoice_total)}</td>
                            <td className="p-3 text-right font-bold text-pink-600">{formatVND(u.discount_amount)}</td>
                            <td className="p-3 text-center text-slate-450">{u.date}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Award Campaigns Modal */}
      {showAwardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-in fade-in duration-200" onClick={() => setShowAwardModal(false)}>
          <div className="bg-slate-50 rounded-3xl p-6 max-w-md w-full border border-slate-105 shadow-2xl relative text-left flex flex-col max-h-[90vh] overflow-y-auto animate-in scale-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-slate-150/50 pb-4 mb-4 shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-800 font-sans">Tặng KM cho Tập khách hàng</h3>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5 font-sans">Tập: {activeSegment?.name}</p>
              </div>
              <button 
                onClick={() => setShowAwardModal(false)} 
                className="w-8 h-8 rounded-full bg-slate-200/50 flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 font-sans text-xs flex-grow">
              <div>
                <label className="block font-bold text-slate-500 mb-2">Chọn chương trình muốn tặng (Có thể chọn nhiều)</label>
                {availableCampaigns.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 bg-white rounded-xl border border-slate-200">
                    Chưa có chương trình khuyến mãi nào được tạo. Hãy tạo chương trình trong tab "Chương trình KM" trước.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
                    {availableCampaigns.map(c => {
                      const isSelected = selectedCampaignIds.includes(c.id);
                      return (
                        <div 
                          key={c.id} 
                          onClick={() => {
                            if (isSelected) {
                              setSelectedCampaignIds(selectedCampaignIds.filter(id => id !== c.id));
                            } else {
                              setSelectedCampaignIds([...selectedCampaignIds, c.id]);
                            }
                          }}
                          className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                            isSelected ? 'bg-primary/5 border-primary' : 'bg-white border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <div className="text-left">
                            <div className="font-bold text-slate-700">{c.name}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5 font-normal">
                              Mức giảm: {c.valueType === 'percent' ? `${c.value}%` : formatVND(c.value)} • Hết hạn: {c.expiryDate}
                            </div>
                          </div>
                          <input 
                            type="checkbox" 
                            checked={isSelected} 
                            readOnly 
                            className="rounded text-primary focus:ring-primary w-4 h-4"
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t border-slate-150/50 mt-4 shrink-0">
              <button onClick={() => setShowAwardModal(false)} className="flex-1 py-2.5 rounded-xl bg-slate-250 hover:bg-slate-300 transition-colors font-bold text-xs text-slate-600 font-sans">Hủy</button>
              <button 
                onClick={handleAwardCampaigns} 
                disabled={availableCampaigns.length === 0}
                className="flex-1 py-2.5 rounded-xl bg-primary text-white font-bold text-xs shadow-sm hover:opacity-95 disabled:opacity-50 transition-all font-sans"
              >
                Xác nhận tặng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
