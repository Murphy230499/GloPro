'use client';

import { useT } from '@/lib/i18n';
import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Trash2, Search, ChevronDown, UserCheck, FolderCheck, AlertCircle 
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { formatVND } from '@/lib/format';
import { toast } from '@/components/Layout';
import Avatar from '@/components/Avatar';
import { Checkbox } from '@/components/ui/checkbox';

export default function RevenueConfigTab({ 
  branchId,
  staff, 
  services, 
  products, 
  packages, 
  treatments, 
  serviceCombos, 
  productCombos, 
  prepaidCards 
}) {
  const { t } = useT();
  const [rules, setRules] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Dropdown states
  const [activeStaffDrop, setActiveStaffDrop] = useState(null); // ruleId
  const [activeItemDrop, setActiveItemDrop] = useState(null); // ruleId
  const [activeItemTab, setActiveItemTab] = useState('service'); // service | product | package | treatment | prepaid_card
  
  // Search states inside dropdowns
  const [staffSearch, setStaffSearch] = useState('');
  const [itemSearch, setItemSearch] = useState('');

  const dropdownRef = useRef(null);

  const translateRole = (role) => {
    const map = {
      'main_technician': 'Thợ chính',
      'assistant_technician': 'Thợ phụ',
      'technician': 'Kỹ thuật viên',
      'cashier': 'Thu ngân',
      'manager': 'Quản lý',
      'partner': 'Đối tác',
      'staff': 'Nhân viên'
    };
    return map[role.toLowerCase()] || role;
  };

  useEffect(() => {
    const loadRules = async () => {
      try {
        const list = await base44.entities.RevenueBonusRule.list();
        setRules(list || []);
      } catch (e) {
        console.error('Lỗi tải cấu hình hoa hồng doanh thu:', e);
        const localRules = localStorage.getItem('glopro_revenue_bonus_rules');
        setRules(localRules ? JSON.parse(localRules) : []);
      }
    };

    const loadGroups = async () => {
      try {
        const filter = branchId === 'all' ? {} : { branch_id: branchId };
        const list = await base44.entities.ServiceGroup.filter(filter);
        setGroups(list || []);
      } catch (e) {
        console.error('Lỗi tải nhóm dịch vụ:', e);
        const localGroups = localStorage.getItem('glopro_service_groups');
        setGroups(localGroups ? JSON.parse(localGroups) : []);
      }
    };

    const run = async () => {
      setLoading(true);
      await Promise.allSettled([loadRules(), loadGroups()]);
      setLoading(false);
    };
    run();
  }, [branchId]);

  // Handle click outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveStaffDrop(null);
        setActiveItemDrop(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  const handleAddRuleOption = () => {
    const newRule = {
      id: 'new_' + Date.now(),
      name: 'Hoa hồng doanh thu mới',
      staff_ids: [],
      item_ids: [],
      mechanism: 'threshold', // threshold | tiered
      ranges: [
        { from: 1000000, to: 10000000, type: 'percent', value: 5 },
        { from: 10000000, to: 30000000, type: 'percent', value: 10 }
      ]
    };
    setRules([...rules, newRule]);
  };

  const handleUpdateRule = (ruleId, patch) => {
    setRules(rules.map(r => r.id === ruleId ? { ...r, ...patch } : r));
  };

  const handleDeleteRule = async (ruleId) => {
    if (String(ruleId).startsWith('new_')) {
      setRules(rules.filter(r => r.id !== ruleId));
      return;
    }

    try {
      await base44.entities.RevenueBonusRule.delete(ruleId);
      setRules(rules.filter(r => r.id !== ruleId));
      toast.success('Đã xóa cấu hình hoa hồng doanh thu!');
    } catch (e) {
      toast.error('Lỗi khi xóa: ' + (e.message || e));
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const savedRules = [];
      for (const rule of rules) {
        // Validate
        if (!rule.name.trim()) {
          toast.error("Vui lòng nhập tên cho cấu hình hoa hồng!");
          setSaving(false);
          return;
        }

        const payload = {
          name: rule.name,
          staff_ids: rule.staff_ids,
          item_ids: rule.item_ids,
          mechanism: rule.mechanism,
          ranges: rule.ranges.map(rg => ({
            from: Number(rg.from) || 0,
            to: Number(rg.to) || 0,
            type: rg.type,
            value: Number(rg.value) || 0
          }))
        };

        let savedRule;
        try {
          if (String(rule.id).startsWith('new_')) {
            savedRule = await base44.entities.RevenueBonusRule.create(payload);
          } else {
            savedRule = await base44.entities.RevenueBonusRule.update(rule.id, payload);
          }
        } catch (apiErr) {
          console.warn("API save failed, falling back to local storage simulation", apiErr);
          const mockId = String(rule.id).startsWith('new_') ? 'rule_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5) : rule.id;
          savedRule = { ...payload, id: mockId };
        }
        savedRules.push(savedRule);
      }
      
      try {
        const list = await base44.entities.RevenueBonusRule.list();
        setRules(list && list.length > 0 ? list : savedRules);
        // Synchronized via Supabase API
      await Promise.all(list.map(r => r.id ? base44.entities.RevenueBonusRule.update(r.id, r) : base44.entities.RevenueBonusRule.create(r)));
      } catch {
        setRules(savedRules);
        // Synchronized via Supabase API
      await Promise.all(list.map(r => r.id ? base44.entities.RevenueBonusRule.update(r.id, r) : base44.entities.RevenueBonusRule.create(r)));
      }
      
      toast.success(t('staff.commission.save_revenue_success', 'Cập nhật cấu hình hoa hồng doanh thu thành công!'));
    } catch (e) {
      console.error('Lỗi khi lưu cấu hình hoa hồng doanh thu:', e);
      toast.error('Lỗi khi lưu: ' + (e.message || e));
    }
    setSaving(false);
  };

  // Get catalog items for current tab
  const getCatalogItemsByTab = () => {
    if (activeItemTab === 'service') return services;
    if (activeItemTab === 'product') return products;
    if (activeItemTab === 'package') return packages;
    if (activeItemTab === 'treatment') return treatments;
    if (activeItemTab === 'service_combo') return serviceCombos;
    if (activeItemTab === 'product_combo') return productCombos;
    if (activeItemTab === 'prepaid_card') return prepaidCards;
    return [];
  };

  // Group items helper for current tab
  const getGroupedItems = (items) => {
    const filtered = items.filter(x => x.name.toLowerCase().includes(itemSearch.toLowerCase()));
    
    // Group items by group_id directly
    const groupedMap = {};
    
    filtered.forEach(item => {
      const gid = item.group_id || 'uncategorized';
      if (!groupedMap[gid]) {
        const groupObj = groups.find(g => g.id === gid);
        let name = groupObj ? groupObj.name : 'Chưa phân nhóm';
        
        if (gid === 'uncategorized') {
          if (activeItemTab === 'prepaid_card') name = 'Thẻ tiền mặt';
          else if (activeItemTab === 'service_combo') name = 'Combo dịch vụ';
          else if (activeItemTab === 'product_combo') name = 'Combo sản phẩm';
        }
        
        groupedMap[gid] = {
          id: gid,
          name: name,
          items: []
        };
      }
      groupedMap[gid].items.push(item);
    });

    // Convert map to array and sort (put uncategorized at the end)
    const groupedList = Object.values(groupedMap);
    groupedList.sort((a, b) => {
      if (a.id === 'uncategorized') return 1;
      if (b.id === 'uncategorized') return -1;
      return a.name.localeCompare(b.name);
    });

    return groupedList;
  };



  if (loading) {
    return <div className="text-center py-20"><div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header Block */}
      <div className="flex justify-between items-center bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="font-bold text-slate-800 text-sm">{t("staff.commission.revenue_title", "Hoa hồng theo doanh thu")}</h2>
          <p className="text-[10px] text-slate-400 mt-1">{t("staff.commission.revenue_subtitle", "Nhân viên sẽ được nhận hoa hồng khi tổng doanh thu kỳ lương đạt mức đã cài đặt")}</p>
        </div>
        <button 
          onClick={handleSaveAll}
          disabled={saving}
          className="px-5 py-2.5 bg-orange-500 text-white font-bold text-xs rounded-xl shadow-sm hover:bg-orange-600 transition-colors disabled:opacity-50"
        >
          {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Cập nhật'}
        </button>
      </div>

      {rules.map((rule) => {
        const isStaffDropOpen = activeStaffDrop === rule.id;
        const isItemDropOpen = activeItemDrop === rule.id;

        return (
          <div key={rule.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-5 relative">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{t('staff.commission.rule_name', 'Tên cấu hình hoa hồng')}</span>
                <input 
                  type="text" 
                  value={rule.name}
                  onChange={(e) => handleUpdateRule(rule.id, { name: e.target.value })}
                  placeholder={t("staff.commission.rule_name_placeholder", "nhập tên cấu hình hoa hồng")}
                  className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-750 bg-white outline-none focus:border-orange-500 w-80 shadow-sm placeholder:text-slate-400/45 placeholder:font-normal placeholder:lowercase"
                />
              </div>
              <button 
                onClick={() => handleDeleteRule(rule.id)}
                className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 border border-slate-150 hover:border-red-200 flex items-center justify-center transition-colors shadow-xs animate-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Selector Fields */}
            <div className="grid grid-cols-2 gap-6 relative" ref={dropdownRef}>
              
              {/* Staff Select Dropdown */}
              <div className="space-y-1.5 relative">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><UserCheck className="w-3.5 h-3.5 text-orange-500" /> {t('staff.commission.apply_staff', 'Nhân viên áp dụng')}</span>
                <button
                  type="button"
                  onClick={() => { setActiveStaffDrop(isStaffDropOpen ? null : rule.id); setActiveItemDrop(null); }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-normal text-slate-500 bg-white hover:bg-slate-50 transition-colors shadow-sm min-w-0"
                >
                  <span className="truncate min-w-0 flex-1 text-left">
                    {rule.staff_ids.length === 0 
                      ? t('staff.commission.select_staff_empty', 'chọn nhân viên áp dụng') 
                      : staff.filter(s => rule.staff_ids.includes(s.id)).map(s => s.full_name).join(', ')
                    }
                  </span>
                  <ChevronDown className="w-4 h-4 text-slate-450 shrink-0 ml-2" />
                </button>

                {isStaffDropOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl border border-slate-250/70 shadow-2xl p-3 z-30 max-h-72 overflow-y-auto space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 focus-within:border-orange-500 transition-all">
                      <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <input 
                        type="text"
                        placeholder={t("staff.commission.search_staff", "tìm kiếm nhân viên...")}
                        value={staffSearch}
                        onChange={(e) => setStaffSearch(e.target.value)}
                        className="bg-transparent text-xs font-medium outline-none w-full text-slate-700 placeholder:text-slate-400"
                      />
                    </div>

                    <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                      {/* Check all option */}
                      <label className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded-xl cursor-pointer select-none">
                        <Checkbox 
                          checked={rule.staff_ids.length === staff.length}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              handleUpdateRule(rule.id, { staff_ids: staff.map(s => s.id) });
                            } else {
                              handleUpdateRule(rule.id, { staff_ids: [] });
                            }
                          }}
                          className="border-slate-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500 data-[state=checked]:text-white focus-visible:ring-orange-500 cursor-pointer"
                        />
                        <span className="text-xs font-bold text-slate-650">{t('staff.commission.all_staff', 'Tất cả nhân viên')}</span>
                      </label>

                      {/* Grouped list */}
                      {Object.entries(
                        staff.filter(s => s.full_name.toLowerCase().includes(staffSearch.toLowerCase())).reduce((acc, s) => {
                          const roleName = translateRole(s.role || 'Nhân viên');
                          if (!acc[roleName]) acc[roleName] = [];
                          acc[roleName].push(s);
                          return acc;
                        }, {})
                      ).map(([roleName, members]) => (
                        <div key={roleName} className="space-y-1">
                          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider px-2 bg-slate-50/50 py-0.5 rounded">{roleName}</div>
                          {members.map(s => {
                            const isChecked = rule.staff_ids.includes(s.id);
                            return (
                              <label key={s.id} className="flex items-center gap-2.5 px-2 py-1 hover:bg-slate-50 rounded-xl cursor-pointer select-none">
                                <Checkbox 
                                  checked={isChecked}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      handleUpdateRule(rule.id, { staff_ids: [...rule.staff_ids, s.id] });
                                    } else {
                                      handleUpdateRule(rule.id, { staff_ids: rule.staff_ids.filter(id => id !== s.id) });
                                    }
                                  }}
                                  className="border-slate-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500 data-[state=checked]:text-white focus-visible:ring-orange-500 cursor-pointer"
                                />
                                <Avatar src={s.avatar_url} name={s.full_name} size={20} color={s.avatar_color} />
                                <span className="text-xs font-semibold text-slate-650">{s.full_name}</span>
                              </label>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
                 {/* Catalog Items Select Dropdown */}
              <div className="space-y-1.5 relative">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><FolderCheck className="w-3.5 h-3.5 text-orange-500" /> {t('staff.commission.apply_catalog', 'Danh mục áp dụng')}</span>
                <button
                  type="button"
                  onClick={() => { setActiveItemDrop(isItemDropOpen ? null : rule.id); setActiveStaffDrop(null); }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-normal text-slate-500 bg-white hover:bg-slate-50 transition-colors shadow-sm min-w-0"
                >
                  <span className="truncate min-w-0 flex-1 text-left">
                    {rule.item_ids.length === 0 
                      ? t('staff.commission.select_catalog_empty', 'chọn dịch vụ / sản phẩm áp dụng') 
                      : `đã chọn ${rule.item_ids.length} ${t('staff.commission.items', 'mục')}`
                    }
                  </span>
                  <ChevronDown className="w-4 h-4 text-slate-450 shrink-0 ml-2" />
                </button>

                {isItemDropOpen && (
                  <div className="absolute top-full mt-1.5 bg-white rounded-2xl border border-slate-200 shadow-2xl p-5 z-30 space-y-3.5 animate-in fade-in slide-in-from-top-2 duration-200 w-[460px] -left-20 text-left">
                    
                    {/* Search inside catalog dropdown */}
                    <div className="flex items-center gap-2 bg-slate-50/80 px-3.5 py-2 rounded-xl border border-slate-200 focus-within:border-orange-500 transition-all">
                      <Search className="w-4 h-4 text-slate-400 shrink-0" />
                      <input 
                        type="text"
                        placeholder={
                          activeItemTab === 'service' ? t('staff.commission.search_service', 'Tìm kiếm dịch vụ...') :
                          activeItemTab === 'product' ? t('staff.commission.search_product', 'Tìm kiếm sản phẩm...') :
                          activeItemTab === 'package' ? t('staff.commission.search_package', 'Tìm kiếm gói dịch vụ...') :
                          activeItemTab === 'treatment' ? t('staff.commission.search_treatment', 'Tìm kiếm liệu trình...') :
                          activeItemTab === 'prepaid_card' ? t('staff.commission.search_card', 'Tìm kiếm thẻ tiền mặt...') :
                          t('staff.common.search', 'Tìm kiếm...')
                        }
                        value={itemSearch}
                        onChange={(e) => setItemSearch(e.target.value)}
                        className="bg-transparent text-xs font-medium outline-none w-full text-slate-700 placeholder:text-slate-400/80"
                      />
                    </div>

                    {/* Item categories navigation tabs */}
                    <div className="flex border-b border-slate-100 overflow-x-auto whitespace-nowrap scrollbar-none gap-5 pt-1">
                      {[
                        { id: 'service', label: t('staff.commission.item_service', 'Dịch vụ') },
                        { id: 'product', label: t('staff.commission.item_product', 'Sản phẩm') },
                        { id: 'package', label: t('staff.commission.item_package', 'Gói dịch vụ') },
                        { id: 'treatment', label: t('staff.commission.item_treatment', 'Liệu trình') },
                        { id: 'prepaid_card', label: t('staff.commission.item_prepaid_card', 'Thẻ tiền mặt') },
                        { id: 'service_combo', label: t('staff.commission.item_service_combo', 'Combo dịch vụ') },
                        { id: 'product_combo', label: t('staff.commission.item_product_combo', 'Combo sản phẩm') }
                      ].map(t => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => { setActiveItemTab(t.id); setItemSearch(''); }}
                          className={`pb-2 text-xs font-bold transition-all relative whitespace-nowrap ${
                            activeItemTab === t.id ? 'text-orange-600' : 'text-slate-500 hover:text-slate-700'
                          }`}
                        >
                          {t.label}
                          {activeItemTab === t.id && (
                            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600 rounded-full" />
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Scrollable list with checkbox */}
                    <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                      {(() => {
                        const tabItems = getCatalogItemsByTab();
                        const visibleItems = tabItems.filter(x => x.name.toLowerCase().includes(itemSearch.toLowerCase()));
                        
                        // Items that are NOT configured in another rule
                        const enabledVisibleItems = visibleItems.filter(x => !rules.some(r => r.id !== rule.id && r.item_ids.includes(x.id)));
                        
                        const isAllSelected = enabledVisibleItems.length > 0 && enabledVisibleItems.every(x => rule.item_ids.includes(x.id));
                        
                        const grouped = getGroupedItems(tabItems);

                        return (
                          <>
                            {enabledVisibleItems.length > 0 && (
                              <label className="flex items-center gap-2.5 px-2 py-1.5 hover:bg-slate-50 rounded-xl cursor-pointer select-none border-b border-slate-100 pb-2">
                                <Checkbox 
                                  checked={isAllSelected}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      const toAdd = enabledVisibleItems.filter(x => !rule.item_ids.includes(x.id)).map(x => x.id);
                                      handleUpdateRule(rule.id, { item_ids: [...rule.item_ids, ...toAdd] });
                                    } else {
                                      const toRemove = enabledVisibleItems.map(x => x.id);
                                      handleUpdateRule(rule.id, { item_ids: rule.item_ids.filter(id => !toRemove.includes(id)) });
                                    }
                                  }}
                                  className="border-slate-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500 data-[state=checked]:text-white focus-visible:ring-orange-500 cursor-pointer"
                                />
                                <span className="text-xs font-normal text-slate-700">{t('staff.commission.select_all', 'Chọn tất cả')}</span>
                              </label>
                            )}

                            {grouped.map(group => {
                              // Filter out configured items to see what is enabled in this group
                              const groupEnabledItems = group.items.filter(x => !rules.some(r => r.id !== rule.id && r.item_ids.includes(x.id)));
                              const isGroupAllSelected = groupEnabledItems.length > 0 && groupEnabledItems.every(x => rule.item_ids.includes(x.id));
                              
                              return (
                                <div key={group.id} className="space-y-1">
                                  {/* Group Header Checkbox */}
                                  <label className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg cursor-pointer select-none">
                                    <Checkbox 
                                      checked={isGroupAllSelected}
                                      disabled={groupEnabledItems.length === 0}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          const toAdd = groupEnabledItems.filter(x => !rule.item_ids.includes(x.id)).map(x => x.id);
                                          handleUpdateRule(rule.id, { item_ids: [...rule.item_ids, ...toAdd] });
                                        } else {
                                          const toRemove = groupEnabledItems.map(x => x.id);
                                          handleUpdateRule(rule.id, { item_ids: rule.item_ids.filter(id => !toRemove.includes(id)) });
                                        }
                                      }}
                                      className="border-slate-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500 data-[state=checked]:text-white focus-visible:ring-orange-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                    />
                                    <span className="text-xs font-bold text-slate-800">{group.name}</span>
                                  </label>

                                  {/* Group Items */}
                                  <div className="pl-6 space-y-1">
                                    {group.items.map(x => {
                                      const isChecked = rule.item_ids.includes(x.id);
                                      const isAlreadyConfigured = rules.some(r => r.id !== rule.id && r.item_ids.includes(x.id));
                                      
                                      return (
                                        <label 
                                          key={x.id} 
                                          className={`flex items-center justify-between px-2.5 py-1.5 hover:bg-slate-50/80 rounded-xl transition-colors select-none ${isAlreadyConfigured ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                                        >
                                          <div className="flex items-center gap-2.5 min-w-0">
                                            <Checkbox 
                                              checked={isChecked}
                                              disabled={isAlreadyConfigured}
                                              onCheckedChange={(checked) => {
                                                if (checked) {
                                                  handleUpdateRule(rule.id, { item_ids: [...rule.item_ids, x.id] });
                                                } else {
                                                  handleUpdateRule(rule.id, { item_ids: rule.item_ids.filter(id => id !== x.id) });
                                                }
                                              }}
                                              className="border-slate-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500 data-[state=checked]:text-white focus-visible:ring-orange-500 cursor-pointer disabled:cursor-not-allowed"
                                            />
                                            <span className="text-xs font-normal text-slate-700 truncate max-w-[210px]">{x.name}</span>
                                            
                                            {/* Warning info icon for already configured services */}
                                            {isAlreadyConfigured && (
                                              <div className="relative group flex items-center shrink-0">
                                                <AlertCircle className="w-3.5 h-3.5 text-amber-500 cursor-pointer ml-1" />
                                                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1 bg-slate-900 text-white text-[10px] rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap pointer-events-none z-50 font-medium">
                                                  {t('staff.commission.item_configured', 'Dịch vụ đã được cài đặt')}
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                          <span className="text-[10px] text-slate-400 font-medium shrink-0 ml-2">
                                            {formatVND(x.price || x.face_value || 0)}
                                          </span>
                                        </label>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </>
                        );
                      })()}
                    </div>

                    {/* Bottom Actions */}
                    <div className="flex justify-end gap-2.5 border-t border-slate-100 pt-3">
                      <button 
                        type="button" 
                        onClick={() => setActiveItemDrop(null)}
                        className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        {t('staff.scheduler.cancel', 'Huỷ')}
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setActiveItemDrop(null)}
                        className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-sm transition-colors"
                      >
                        {t('staff.commission.apply_btn', 'Áp dụng')}
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Rates Table Configuration */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t('staff.commission.rate_setting', 'Cài đặt tỉ lệ hoa hồng')}</span>
                
                {/* Threshold vs Tiered Mode Toggles */}
                <div className="flex rounded-lg bg-slate-100 p-0.5 border border-slate-150 shadow-xs">
                  <button
                    type="button"
                    onClick={() => handleUpdateRule(rule.id, { mechanism: 'threshold' })}
                    className={`px-3 py-1 text-[10.5px] font-bold rounded-md transition-colors ${rule.mechanism === 'threshold' ? 'bg-orange-500 text-white shadow-xs' : 'text-slate-400 hover:text-slate-650'}`}
                  >
                    {t('staff.commission.mech_threshold', 'Mốc doanh thu')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateRule(rule.id, { mechanism: 'tiered' })}
                    className={`px-3 py-1 text-[10.5px] font-bold rounded-md transition-colors ${rule.mechanism === 'tiered' ? 'bg-orange-500 text-white shadow-xs' : 'text-slate-400 hover:text-slate-655'}`}
                  >
                    {t('staff.commission.mech_tiered', 'Bậc thang')}
                  </button>
                </div>
              </div>

              {/* Table Headers */}
              <div className="border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/50 shadow-sm p-4 space-y-3">
                <div className="grid grid-cols-12 gap-3 text-[10px] text-slate-400 font-bold uppercase tracking-wider pb-1 px-1.5">
                  <div className="col-span-8">{t('staff.commission.revenue_level', 'Mức doanh thu')}</div>
                  <div className="col-span-3 text-right">{t('staff.commission.revenue_rate', 'Tỉ lệ hoa hồng')}</div>
                  <div className="col-span-1"></div>
                </div>

                <div className="space-y-2.5">
                  {rule.ranges.map((range, index) => (
                    <div key={index} className="grid grid-cols-12 gap-3 items-center">
                      
                      {/* Revenue Bounds Inputs */}
                      <div className="col-span-8 flex items-center gap-2">
                        <span className="text-[10px] text-slate-450 font-bold shrink-0">{t('staff.commission.from', 'Từ')}</span>
                        <input 
                          type="text"
                          placeholder={t("staff.commission.enter_value", "nhập giá trị")}
                          value={range.from ? new Intl.NumberFormat('vi-VN').format(range.from) : (range.from === 0 ? '0' : '')}
                          onChange={(e) => {
                            let rawVal = e.target.value.replace(/\./g, '');
                            rawVal = rawVal.replace(/,/g, '.');
                            const val = Number(rawVal);
                            if (!isNaN(val)) {
                              handleUpdateRule(rule.id, {
                                ranges: rule.ranges.map((rg, idx) => idx === index ? { ...rg, from: Math.max(0, val || 0) } : rg)
                              });
                            } else if (e.target.value === '') {
                              handleUpdateRule(rule.id, {
                                ranges: rule.ranges.map((rg, idx) => idx === index ? { ...rg, from: 0 } : rg)
                              });
                            }
                          }}
                          className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-normal text-slate-700 bg-white outline-none focus:border-orange-500 w-full shadow-sm placeholder:text-slate-400/40 placeholder:font-normal placeholder:lowercase"
                        />
                        <span className="text-[10px] text-slate-450 font-bold shrink-0">{t('staff.commission.to', 'Đến')}</span>
                        <input 
                          type="text"
                          placeholder={t("staff.commission.enter_value", "nhập giá trị")}
                          value={range.to ? new Intl.NumberFormat('vi-VN').format(range.to) : (range.to === 0 ? '0' : '')}
                          onChange={(e) => {
                            let rawVal = e.target.value.replace(/\./g, '');
                            rawVal = rawVal.replace(/,/g, '.');
                            const val = Number(rawVal);
                            if (!isNaN(val)) {
                              handleUpdateRule(rule.id, {
                                ranges: rule.ranges.map((rg, idx) => idx === index ? { ...rg, to: Math.max(0, val || 0) } : rg)
                              });
                            } else if (e.target.value === '') {
                              handleUpdateRule(rule.id, {
                                ranges: rule.ranges.map((rg, idx) => idx === index ? { ...rg, to: 0 } : rg)
                              });
                            }
                          }}
                          className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-normal text-slate-700 bg-white outline-none focus:border-orange-500 w-full shadow-sm placeholder:text-slate-400/40 placeholder:font-normal placeholder:lowercase"
                        />
                      </div>

                      {/* Reward Surcharges Inputs */}
                      <div className="col-span-3">
                        <div className="flex items-center border border-slate-200 rounded-xl bg-white px-4 py-2 w-full shadow-sm focus-within:border-orange-500 transition-all">
                          <input 
                            type="text"
                            placeholder="0"
                            value={range.type === 'vnd' && range.value ? new Intl.NumberFormat('vi-VN').format(range.value) : (range.value || '')}
                            onChange={(e) => {
                              const rawVal = range.type === 'vnd' 
                                ? e.target.value.replace(/\./g, '').replace(/,/g, '.') 
                                : e.target.value.replace(/,/g, '.');
                              const val = Number(rawVal);
                              if (!isNaN(val)) {
                                handleUpdateRule(rule.id, {
                                  ranges: rule.ranges.map((rg, idx) => idx === index ? { ...rg, value: Math.max(0, val || 0) } : rg)
                                });
                              } else if (e.target.value === '') {
                                handleUpdateRule(rule.id, {
                                  ranges: rule.ranges.map((rg, idx) => idx === index ? { ...rg, value: 0 } : rg)
                                });
                              }
                            }}
                            className="bg-transparent border-none outline-none text-xs text-slate-700 w-full text-right focus:ring-0 focus:outline-none pr-2.5 placeholder:text-slate-400/45 placeholder:font-normal"
                          />
                          <div className="relative flex items-center shrink-0 pr-1 pl-2 border-l border-slate-100">
                            <select 
                              value={range.type}
                              onChange={(e) => {
                                handleUpdateRule(rule.id, {
                                  ranges: rule.ranges.map((rg, idx) => idx === index ? { ...rg, type: e.target.value } : rg)
                                });
                              }}
                              className="bg-transparent border-none outline-none text-xs font-bold text-slate-500 cursor-pointer focus:ring-0 focus:outline-none appearance-none pr-4 select-none"
                              style={{ background: 'none' }}
                            >
                              <option value="percent">%</option>
                              <option value="vnd">đ</option>
                            </select>
                            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-0 pointer-events-none" />
                          </div>
                        </div>
                      </div>

                      {/* Trash Delete Column */}
                      <div className="col-span-1 flex justify-center">
                        <button 
                          onClick={() => {
                            handleUpdateRule(rule.id, {
                              ranges: rule.ranges.filter((_, idx) => idx !== index)
                            });
                          }}
                          className="w-7 h-7 rounded-xl bg-white hover:bg-red-50 text-slate-400 hover:text-red-500 border border-slate-200 hover:border-red-150 transition-colors shadow-sm flex items-center justify-center shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => {
                      handleUpdateRule(rule.id, {
                        ranges: [...rule.ranges, { from: 0, to: 0, type: 'percent', value: 0 }]
                      });
                    }}
                    className="flex items-center justify-center gap-1 w-full py-2 rounded-xl border border-dashed border-slate-200 hover:border-orange-500 text-slate-400 hover:text-orange-600 font-bold text-xs transition-colors bg-white shadow-xs mt-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {t('staff.commission.add_new', 'Thêm mới')}
                  </button>
                </div>
              </div>
            </div>

          </div>
        );
      })}

      {/* Add new option config block */}
      <button
        onClick={handleAddRuleOption}
        className="flex items-center justify-center gap-1.5 w-full py-3.5 rounded-2xl border border-dashed border-slate-200 hover:border-orange-500 text-slate-450 hover:text-orange-600 font-bold text-xs transition-colors bg-slate-50/50 shadow-sm"
      >
        <Plus className="w-4 h-4" />
        {t('staff.commission.add_revenue_option', 'Thêm tùy chọn hoa hồng')}
      </button>
    </div>
  );
}
