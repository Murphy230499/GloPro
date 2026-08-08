import React, { useState, useEffect, useMemo } from 'react';
import { X, Search, Gift, CheckCircle2, User, Filter, ChevronDown } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useT } from '@/lib/i18n';
import toast from 'react-hot-toast';
import { loadCustomerTiers, loadCustomerSegments } from '@/utils/loyaltyFallbacks';

export default function GiftPromoModal({ promo, onClose }) {
  const { t } = useT();
  const [customers, setCustomers] = useState([]);
  const [tiers, setTiers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, new, returning
  const [filterTier, setFilterTier] = useState('all');
  const [filterGroup, setFilterGroup] = useState('all');
  const [filterSegment, setFilterSegment] = useState('all');
  
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    Promise.all([
      base44.entities.Customer.list(),
      base44.entities.CustomerGroup.list(),
      loadCustomerTiers(),
      loadCustomerSegments()
    ]).then(([custList, groupList, tierList, segmentList]) => {
      setCustomers(custList);
      setGroups(groupList);
      setTiers(tierList.sort((a, b) => (b.min_spend || 0) - (a.min_spend || 0)));
      setSegments(segmentList);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
      toast.error('Lỗi khi tải dữ liệu khách hàng');
    });
  }, []);

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

  const getCustomerTier = (customer) => {
    const spent = customer.total_spent || 0;
    return tiers.find(t => spent >= (t.min_spend || 0));
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      // Search
      const term = search.toLowerCase();
      const matchSearch = !term || c.name?.toLowerCase().includes(term) || c.phone?.includes(term);
      if (!matchSearch) return false;

      // Type
      const isReturning = (c.visitCount || 0) > 1 || (c.total_spent || 0) > 0;
      if (filterType === 'new' && isReturning) return false;
      if (filterType === 'returning' && !isReturning) return false;

      // Group
      if (filterGroup !== 'all' && String(c.group_id) !== String(filterGroup)) return false;

      // Tier
      if (filterTier !== 'all') {
        const cTier = getCustomerTier(c);
        if (!cTier || String(cTier.id) !== String(filterTier)) return false;
      }

      // Segment
      if (filterSegment !== 'all') {
        const segment = segments.find(s => String(s.id) === String(filterSegment));
        if (segment && !evaluateCustomer(c, segment.conditions)) return false;
      }

      return true;
    });
  }, [customers, search, filterType, filterGroup, filterTier, filterSegment, segments, tiers]);

  const handleSelectAll = () => {
    if (selectedIds.length === filteredCustomers.length && filteredCustomers.length > 0) {
      // Deselect all current visible
      setSelectedIds([]);
    } else {
      // Select all visible
      setSelectedIds(filteredCustomers.map(c => c.id));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleGift = () => {
    if (selectedIds.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 khách hàng');
      return;
    }

    try {
      const localStr = localStorage.getItem('glopro_customer_gifts') || '{}';
      const gifts = JSON.parse(localStr);
      
      let successCount = 0;
      selectedIds.forEach(id => {
        if (!gifts[id]) gifts[id] = [];
        gifts[id].push({
          promo_id: promo.id,
          assigned_at: new Date().toISOString()
        });
        successCount++;
      });

      localStorage.setItem('glopro_customer_gifts', JSON.stringify(gifts));
      toast.success(`Đã tặng quà cho ${successCount} khách hàng!`);
      onClose();
    } catch (err) {
      toast.error('Có lỗi xảy ra khi tặng quà');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm animate-in fade-in" onClick={onClose} />
      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl relative flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-600">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-slate-800">{t('discounts.gift_modal_title', 'Tặng Khuyến mãi')}</h2>
              <p className="text-xs text-slate-500 font-medium truncate max-w-[300px]">{promo.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-slate-100 shrink-0 bg-slate-50 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder={t('discounts.search_customer_ph', 'Tìm tên hoặc SĐT khách hàng...')} 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-pink-400 transition-colors text-slate-700 shadow-sm"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            <div className="flex-1 min-w-[140px] relative">
              <select 
                value={filterType} 
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full pl-3 pr-8 py-2 text-xs bg-white border border-slate-200 rounded-lg outline-none text-slate-700 appearance-none"
              >
                <option value="all">{t('discounts.filter_type_all', 'Loại: Tất cả')}</option>
                <option value="new">{t('discounts.filter_type_new', 'Khách mới')}</option>
                <option value="returning">{t('discounts.filter_type_returning', 'Khách cũ')}</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
            <div className="flex-1 min-w-[140px] relative">
              <select 
                value={filterTier} 
                onChange={(e) => setFilterTier(e.target.value)}
                className="w-full pl-3 pr-8 py-2 text-xs bg-white border border-slate-200 rounded-lg outline-none text-slate-700 appearance-none"
              >
                <option value="all">Hạng: Tất cả</option>
                {tiers.map(tier => <option key={tier.id} value={tier.id}>{tier.name}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
            <div className="flex-1 min-w-[140px] relative">
              <select 
                value={filterGroup} 
                onChange={(e) => setFilterGroup(e.target.value)}
                className="w-full pl-3 pr-8 py-2 text-xs bg-white border border-slate-200 rounded-lg outline-none text-slate-700 appearance-none"
              >
                <option value="all">Nhóm KH: Tất cả</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
            <div className="flex-1 min-w-[140px] relative">
              <select 
                value={filterSegment} 
                onChange={(e) => setFilterSegment(e.target.value)}
                className="w-full pl-3 pr-8 py-2 text-xs bg-white border border-slate-200 rounded-lg outline-none text-slate-700 appearance-none"
              >
                <option value="all">Tập KH: Tất cả</option>
                {segments.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Customer List */}
        <div className="flex-1 overflow-y-auto p-3">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-3">
              <div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
              <div className="text-sm">Đang tải danh sách...</div>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">Không tìm thấy khách hàng phù hợp.</div>
          ) : (
            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-2 pb-2 border-b border-slate-100 mb-2">
                <span className="text-xs font-semibold text-slate-500">Tìm thấy {filteredCustomers.length} khách hàng</span>
                <button onClick={handleSelectAll} className="text-xs font-bold text-pink-600 hover:text-pink-700">
                  {selectedIds.length === filteredCustomers.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                </button>
              </div>

              {filteredCustomers.map(c => {
                const isReturning = (c.visitCount || 0) > 1 || (c.total_spent || 0) > 0;
                const isSelected = selectedIds.includes(c.id);
                
                return (
                  <div 
                    key={c.id} 
                    onClick={() => toggleSelect(c.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors border ${isSelected ? 'bg-pink-50/50 border-pink-200' : 'bg-white border-slate-100 hover:border-pink-200'}`}
                  >
                    {/* Checkbox or Indicator */}
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-pink-500 border-pink-500' : 'border-slate-300'}`}>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                    </div>

                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center text-slate-400 font-bold">
                      {c.avatar_url ? (
                        <img src={c.avatar_url} alt={c.name} className="w-full h-full object-cover" />
                      ) : (
                        c.name ? c.name.charAt(0).toUpperCase() : <User className="w-5 h-5" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-slate-700 truncate">{c.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5 truncate">{c.phone || 'Chưa có SĐT'}</div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${isReturning ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                        {isReturning ? 'Khách cũ' : 'Khách mới'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 shrink-0 bg-white rounded-b-3xl flex justify-between items-center gap-4">
          <div className="text-sm font-semibold text-slate-600">
            {t('discounts.selected_customers', 'Đã chọn:')} <span className="text-pink-600 font-bold">{selectedIds.length}</span> {t('discounts.customers_unit', 'khách')}
          </div>
          <button 
            onClick={handleGift}
            disabled={selectedIds.length === 0}
            className="flex-1 py-3 rounded-xl bg-pink-600 text-white font-bold text-sm shadow-sm hover:bg-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 max-w-[200px] cursor-pointer"
          >
            <Gift className="w-4 h-4" /> {t('discounts.btn_gift', 'Tặng')} {selectedIds.length > 0 ? selectedIds.length : ''} {t('discounts.gift_item_unit', 'quà')}
          </button>
        </div>
      </div>
    </div>
  );
}
