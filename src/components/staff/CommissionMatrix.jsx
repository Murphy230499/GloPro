'use client';
import { useT } from '@/lib/i18n';
import React, { useState, useEffect } from 'react';
import { Save, Loader2, Search, Plus, Trash2, ChevronDown, Copy, Settings } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { formatVND } from '@/lib/format';
import { toast } from '@/components/Layout';
import Avatar from '@/components/Avatar';
import RevenueConfigTab from '@/components/staff/RevenueConfigTab';
import GroupCommissionModal from './GroupCommissionModal';
import CopyTabCommissionModal from './CopyTabCommissionModal';

export default function CommissionMatrix({ branchId }) {
  const { t } = useT();

  const TABS = [
    { id: 'service', label: t('staff.commission.tabs.service', 'Dịch vụ') },
    { id: 'product', label: t('staff.commission.tabs.product', 'Sản phẩm') },
    { id: 'package', label: t('staff.commission.tabs.package', 'Gói dịch vụ') },
    { id: 'treatment', label: t('staff.commission.tabs.treatment', 'Liệu trình') },
    { id: 'service_combo', label: t('staff.commission.tabs.service_combo', 'Combo dịch vụ') },
    { id: 'product_combo', label: t('staff.commission.tabs.product_combo', 'Combo sản phẩm') },
    { id: 'prepaid_card', label: t('staff.commission.tabs.prepaid_card', 'Thẻ tiền mặt') },
    { id: 'customer_req', label: t('staff.commission.tabs.customer_req', 'Khách yêu cầu') },
    { id: 'overtime', label: t('staff.commission.tabs.overtime', 'Theo khung giờ') },
    { id: 'revenue', label: t('staff.commission.tabs.revenue', 'Doanh thu') }
  ];

  const translateRole = (role) => {
    switch (role) {
      case 'primary': return 'Thợ chính';
      case 'assistant': return 'Thợ phụ';
      case 'technician': return 'Kỹ thuật viên';
      case 'cashier': return 'Thu ngân';
      case 'manager': return 'Quản lý';
      case 'partner': return 'Đối tác';
      default: return 'Nhân viên';
    }
  };

  const [activeTab, setActiveTab] = useState('service');
  const [staff, setStaff] = useState([]);
  
  // Overtime states
  const [selectedStaffId, setSelectedStaffId] = useState(null);
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [tempSlots, setTempSlots] = useState([]);
  const [savingOvertime, setSavingOvertime] = useState(false);
  
  // Catalog states
  const [services, setServices] = useState([]);
  const [products, setProducts] = useState([]);
  const [packages, setPackages] = useState([]);
  const [treatments, setTreatments] = useState([]);
  const [serviceCombos, setServiceCombos] = useState([]);
  const [productCombos, setProductCombos] = useState([]);
  const [prepaidCards, setPrepaidCards] = useState([]);
  
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [groups, setGroups] = useState([]);
  const [showGroupCommissionModal, setShowGroupCommissionModal] = useState(false);
  const [showCopyTabModal, setShowCopyTabModal] = useState(false);
  
  // Cell-specific saving status state
  const [savingKey, setSavingKey] = useState(null); // "itemId_staffId"
  
  // Local edits state: edits["itemId_staffId"] = { type: 'percent'|'vnd', value: number }
  const [edits, setEdits] = useState({});

  const loadData = async () => {
    setLoading(true);
    const filter = branchId === 'all' ? {} : { branch_id: branchId };
    try {
      const [
        stList, svcs, prods, pkgs, treatList, svcCombos, prodCombos, cards, ruleList
      ] = await Promise.all([
        base44.entities.Staff.filter(filter),
        base44.entities.Service.filter({ is_active: true }),
        base44.entities.Product.filter({ is_active: true }),
        base44.entities.ServicePackage.list(),
        base44.entities.Treatment.list(),
        base44.entities.ServiceCombo.list(),
        base44.entities.ProductCombo.list(),
        base44.entities.PrepaidCard.list(),
        base44.entities.StaffCommissionRule.list()
      ]);

      setStaff(stList.filter(x => x.is_active !== false));
      setServices(svcs);
      setProducts(prods);
      setPackages(pkgs);
      setTreatments(treatList);
      setServiceCombos(svcCombos);
      setProductCombos(prodCombos);
      setPrepaidCards(cards);
      setRules(ruleList || []);

      let groupList = [];
      try {
        groupList = await base44.entities.ServiceGroup.list();
      } catch (err) {
        console.warn("Failed to load groups in CommissionMatrix, trying filter", err);
        try {
          groupList = await base44.entities.ServiceGroup.filter(filter);
        } catch (filterErr) {
          console.error("Failed to load groups in CommissionMatrix entirely", filterErr);
          const local = localStorage.getItem('glopro_service_groups');
          groupList = local ? JSON.parse(local) : [];
        }
      }
      setGroups(groupList || []);
    } catch (e) {
      console.error(t('staff.commission.load_error', 'Lỗi tải danh mục cấu hình hoa hồng:'), e);
      const localRules = localStorage.getItem('glopro_staff_commission_rules');
      setRules(localRules ? JSON.parse(localRules) : []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [branchId]);

  // Set default selection when staff or services load
  useEffect(() => {
    if (staff.length > 0 && !selectedStaffId) {
      setSelectedStaffId(staff[0].id);
    }
  }, [staff, selectedStaffId]);

  useEffect(() => {
    if (services.length > 0 && !selectedServiceId) {
      setSelectedServiceId(services[0].id);
    }
  }, [services, selectedServiceId]);

  // Sync tempSlots from rules
  useEffect(() => {
    if (activeTab === 'overtime' && selectedStaffId && selectedServiceId) {
      const matched = rules.filter(r => r.staff_id === selectedStaffId && r.item_type === 'overtime_service' && r.item_id === selectedServiceId);
      const mapped = matched.map(r => {
        const parts = r.commission_type.split('_');
        const type = parts[0] || 'percent';
        const from = parts[1] || '18:00';
        const to = parts[2] || '19:00';
        return {
          id: r.id,
          from,
          to,
          type,
          value: r.commission_value
        };
      });
      setTempSlots(mapped);
    }
  }, [activeTab, selectedStaffId, selectedServiceId, rules]);

  const handleSaveOvertimeSlots = async () => {
    setSavingOvertime(true);
    
    // Validation: overlap and logical checks
    for (let i = 0; i < tempSlots.length; i++) {
      const a = tempSlots[i];
      if (!a.from || !a.to) {
        toast.error("Vui lòng điền đầy đủ thời gian Từ và Đến!");
        setSavingOvertime(false);
        return;
      }
      if (a.from >= a.to) {
        toast.error(`Giờ Từ (${a.from}) phải nhỏ hơn giờ Đến (${a.to})!`);
        setSavingOvertime(false);
        return;
      }
      for (let j = i + 1; j < tempSlots.length; j++) {
        const b = tempSlots[j];
        if (a.from < b.to && b.from < a.to) {
          toast.error(`Khung giờ trùng lặp: ${a.from}-${a.to} và ${b.from}-${b.to}!`);
          setSavingOvertime(false);
          return;
        }
      }
    }

    try {
      const matched = rules.filter(r => r.staff_id === selectedStaffId && r.item_type === 'overtime_service' && r.item_id === selectedServiceId);
      for (const rule of matched) {
        if (rule.id && !String(rule.id).startsWith('local_')) {
          await base44.entities.StaffCommissionRule.delete(rule.id);
        }
      }
      for (const slot of tempSlots) {
        const payload = {
          staff_id: selectedStaffId,
          item_type: 'overtime_service',
          item_id: selectedServiceId,
          commission_type: `${slot.type}_${slot.from}_${slot.to}`,
          commission_value: Number(slot.value) || 0
        };
        await base44.entities.StaffCommissionRule.create(payload);
      }
      const updatedRules = await base44.entities.StaffCommissionRule.list();
      setRules(updatedRules);
      toast.success(t('staff.commission.save_time_success', 'Đã lưu cấu hình khung giờ thành công!'));
    } catch (e) {
      console.error('Error saving overtime rules:', e);
      toast.error(t('staff.commission.save_error', 'Lỗi khi lưu cấu hình: ') + (e.message || e));
    }
    setSavingOvertime(false);
  };

  // Sync edits state when rules or catalogs load
  useEffect(() => {
    const nextEdits = {};

    // 1. Setup matrix edits for normal items (service, product, etc.)
    const getActiveItems = () => {
      if (activeTab === 'service') return services.map(s => ({ id: s.id, type: 'service' }));
      if (activeTab === 'product') return products.map(p => ({ id: p.id, type: 'product' }));
      if (activeTab === 'package') return packages.map(p => ({ id: p.id, type: 'package' }));
      if (activeTab === 'treatment') return treatments.map(t => ({ id: t.id, type: 'treatment' }));
      if (activeTab === 'service_combo') return serviceCombos.map(sc => ({ id: sc.id, type: 'service_combo' }));
      if (activeTab === 'product_combo') return productCombos.map(pc => ({ id: pc.id, type: 'product_combo' }));
      if (activeTab === 'prepaid_card') return prepaidCards.map(c => ({ id: c.id, type: 'prepaid_card' }));
      if (activeTab === 'customer_req') return services.map(s => ({ id: s.id, type: 'customer_req_service' }));
      return [];
    };

    const items = getActiveItems();
    const columns = staff.map(s => s.id);

    items.forEach(item => {
      columns.forEach(staffId => {
        const match = rules.find(r => r.staff_id === staffId && r.item_id === item.id && r.item_type === item.type);
        nextEdits[`${item.id}_${staffId}`] = {
          type: match ? match.commission_type : 'percent',
          value: match ? match.commission_value : 0
        };
      });
    });

    // 2. Setup edits for custom employee-specific tabs (overtime, revenue)
    if (['overtime', 'revenue'].includes(activeTab)) {
      staff.forEach(s => {
        const match = rules.find(r => r.staff_id === s.id && r.item_type === activeTab && r.item_id === activeTab);
        nextEdits[`${activeTab}_${s.id}`] = {
          type: match ? match.commission_type : 'percent',
          value: match ? match.commission_value : 0
        };
      });
    }

    setEdits(nextEdits);
  }, [activeTab, rules, staff, services, products, packages, treatments, serviceCombos, productCombos, prepaidCards]);

  const handleUpdateEdit = (key, patch) => {
    setEdits(prev => ({
      ...prev,
      [key]: { ...prev[key], ...patch }
    }));
  };

  const handleSaveCell = async (itemId, staffId, itemType, valueOverride, typeOverride) => {
    const key = `${itemId}_${staffId}`;
    setSavingKey(key);
    
    const editVal = edits[key] || { type: 'percent', value: 0 };
    const finalType = typeOverride !== undefined ? typeOverride : editVal.type;
    const finalValue = valueOverride !== undefined ? Number(valueOverride) : Number(editVal.value);

    const payload = {
      staff_id: staffId,
      item_type: itemType,
      item_id: itemId,
      commission_type: finalType,
      commission_value: finalValue || 0
    };

    const existing = rules.find(r => r.staff_id === staffId && r.item_id === itemId && r.item_type === itemType);

    try {
      if (existing) {
        await base44.entities.StaffCommissionRule.update(existing.id, payload);
      } else {
        await base44.entities.StaffCommissionRule.create(payload);
      }
      // Reload rules
      const updatedRules = await base44.entities.StaffCommissionRule.list();
      setRules(updatedRules);
    } catch (e) {
      console.error('Error saving rule:', e);
      // Local fallback
      const local = localStorage.getItem('glopro_staff_commission_rules');
      let list = local ? JSON.parse(local) : [];
      if (existing) {
        list = list.map(r => r.id === existing.id ? { ...r, ...payload } : r);
      } else {
        list.push({ id: 'local_' + Date.now(), ...payload });
      }
      // Synchronized via Supabase API
      await Promise.all(updatedRules.map(r => r.id ? base44.entities.StaffCommissionRule.update(r.id, r) : base44.entities.StaffCommissionRule.create(r)));
      setRules(list);
    }
    setSavingKey(null);
  };

  const handleSaveGroupCommission = async ({
    selectedStaffIds,
    scope,
    selectedGroupId,
    selectedItemIds,
    value,
    type
  }) => {
    let targetItemIds = [];
    const displayItems = getDisplayItems();

    if (scope === 'all') {
      targetItemIds = displayItems.map(i => i.id);
    } else if (scope === 'group') {
      targetItemIds = displayItems.filter(i => i.group_id === selectedGroupId).map(i => i.id);
    } else if (scope === 'items') {
      targetItemIds = selectedItemIds;
    }

    if (targetItemIds.length === 0) {
      toast.success('Không có vật phẩm nào phù hợp để áp dụng.');
      return;
    }

    const itemType = activeTab;
    const local = localStorage.getItem('glopro_staff_commission_rules');
    let localList = local ? JSON.parse(local) : [];
    const operations = [];

    for (const staffId of selectedStaffIds) {
      for (const itemId of targetItemIds) {
        const payload = {
          staff_id: staffId,
          item_type: itemType,
          item_id: itemId,
          commission_type: type,
          commission_value: value
        };

        const existing = rules.find(r => r.staff_id === staffId && r.item_id === itemId && r.item_type === itemType);

        const op = (async () => {
          try {
            if (existing) {
              await base44.entities.StaffCommissionRule.update(existing.id, payload);
            } else {
              await base44.entities.StaffCommissionRule.create(payload);
            }
          } catch (err) {
            console.warn("API bulk update failed, syncing to local store", err);
            if (existing) {
              localList = localList.map(r => r.id === existing.id ? { ...r, ...payload } : r);
            } else {
              localList.push({ id: 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5), ...payload });
            }
          }
        })();
        operations.push(op);
      }
    }

    await Promise.all(operations);

    try {
      const updatedRules = await base44.entities.StaffCommissionRule.list();
      setRules(updatedRules && updatedRules.length > 0 ? updatedRules : localList);
      // Synchronized via Supabase API
      await Promise.all(updatedRules.map(r => r.id ? base44.entities.StaffCommissionRule.update(r.id, r) : base44.entities.StaffCommissionRule.create(r)));
    } catch {
      setRules(localList);
      // Synchronized via Supabase API
      await Promise.all(updatedRules.map(r => r.id ? base44.entities.StaffCommissionRule.update(r.id, r) : base44.entities.StaffCommissionRule.create(r)));
    }

    toast.success(t('staff.commission.group_update_success', 'Cập nhật hoa hồng nhóm thành công!'));
  };

  const handleSaveCopyTabCommission = async ({
    sourceStaffId,
    targetStaffIds
  }) => {
    const itemType = activeTab;
    const sourceRules = rules.filter(r => r.staff_id === sourceStaffId && r.item_type === itemType);

    if (sourceRules.length === 0) {
      toast.error('Nhân viên nguồn không có cấu hình hoa hồng nào ở tab này!');
      return;
    }

    const local = localStorage.getItem('glopro_staff_commission_rules');
    let localList = local ? JSON.parse(local) : [];
    const operations = [];

    for (const targetId of targetStaffIds) {
      for (const srcRule of sourceRules) {
        const payload = {
          staff_id: targetId,
          item_type: itemType,
          item_id: srcRule.item_id,
          commission_type: srcRule.commission_type,
          commission_value: srcRule.commission_value
        };

        const existing = rules.find(r => r.staff_id === targetId && r.item_id === srcRule.item_id && r.item_type === itemType);

        const op = (async () => {
          try {
            if (existing) {
              await base44.entities.StaffCommissionRule.update(existing.id, payload);
            } else {
              await base44.entities.StaffCommissionRule.create(payload);
            }
          } catch (err) {
            console.warn("API copy failed, syncing to local store", err);
            if (existing) {
              localList = localList.map(r => r.id === existing.id ? { ...r, ...payload } : r);
            } else {
              localList.push({ id: 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5), ...payload });
            }
          }
        })();
        operations.push(op);
      }
    }

    await Promise.all(operations);

    try {
      const updatedRules = await base44.entities.StaffCommissionRule.list();
      setRules(updatedRules && updatedRules.length > 0 ? updatedRules : localList);
      // Synchronized via Supabase API
      await Promise.all(updatedRules.map(r => r.id ? base44.entities.StaffCommissionRule.update(r.id, r) : base44.entities.StaffCommissionRule.create(r)));
    } catch {
      setRules(localList);
      // Synchronized via Supabase API
      await Promise.all(updatedRules.map(r => r.id ? base44.entities.StaffCommissionRule.update(r.id, r) : base44.entities.StaffCommissionRule.create(r)));
    }

    toast.success(t('staff.commission.copy_success', 'Sao chép hoa hồng thành công!'));
  };

  const getDisplayItems = () => {
    if (activeTab === 'service') return services.map(s => ({ ...s, type: 'service', price: s.price }));
    if (activeTab === 'product') return products.map(p => ({ ...p, type: 'product', price: p.price }));
    if (activeTab === 'package') return packages.map(p => ({ ...p, type: 'package', price: p.price }));
    if (activeTab === 'treatment') return treatments.map(t => ({ ...t, type: 'treatment', price: t.price }));
    if (activeTab === 'service_combo') return serviceCombos.map(sc => ({ ...sc, type: 'service_combo', price: sc.price }));
    if (activeTab === 'product_combo') return productCombos.map(pc => ({ ...pc, type: 'product_combo', price: pc.price }));
    if (activeTab === 'prepaid_card') return prepaidCards.map(c => ({ ...c, type: 'prepaid_card', price: c.face_value || c.price }));
    if (activeTab === 'customer_req') return services.map(s => ({ ...s, type: 'customer_req_service', price: s.price }));
    return [];
  };

  const filteredItems = getDisplayItems().filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isMatrixTab = !['overtime', 'revenue'].includes(activeTab);

  return (
    <div className="space-y-5">
      {/* Tab Navigation */}
      <div className="flex items-center gap-5 border-b border-slate-200/80 overflow-x-auto whitespace-nowrap scrollbar-none px-1 font-body">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => { setActiveTab(t.id); setSearchQuery(''); }}
            className={`py-2 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === t.id
                ? 'border-orange-500 text-orange-500'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {/* Filter and search bar with action buttons */}
      {isMatrixTab && (
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 bg-white px-3 py-2.5 rounded-xl border border-slate-200 focus-within:border-orange-500 shadow-sm w-full max-w-sm transition-all">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input 
              type="text"
              placeholder={
                activeTab === 'customer_req'
                  ? t('staff.commission.search_service', 'tìm kiếm dịch vụ...')
                  : TABS.find(t => t.id === activeTab)
                    ? t('staff.commission.search_dynamic', 'tìm kiếm {tab}...').replace('{tab}', TABS.find(t => t.id === activeTab).label.toLowerCase())
                    : t('staff.commission.search_generic', 'tìm kiếm...')
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs font-normal outline-none bg-transparent text-slate-700 placeholder:text-slate-400/70"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowGroupCommissionModal(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-orange-50 hover:bg-orange-100 text-orange-600 font-bold text-xs rounded-xl shadow-xs transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              {t('staff.commission.group_settings', 'Cài đặt nhóm')}
            </button>
            <button
              onClick={() => setShowCopyTabModal(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-orange-50 hover:bg-orange-100 text-orange-600 font-bold text-xs rounded-xl shadow-xs transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              {t('staff.commission.copy', 'Sao chép')}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-100"><div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto" /></div>
      ) : isMatrixTab ? (
        /* Render Matrix Grid View */
        filteredItems.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 text-slate-400 text-xs font-medium">Không tìm thấy vật phẩm nào trong danh mục này</div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse table-fixed font-sans">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold text-xs">
                    <th className="py-2 sm:py-4 px-2 sm:px-5 w-[33vw] min-w-[33vw] max-w-[33vw] sm:w-[220px] sm:min-w-[220px] sm:max-w-none sticky left-0 bg-slate-50 z-10 border-r border-slate-100 font-semibold align-middle text-[10px] sm:text-xs text-center sm:text-left">
                      {activeTab === 'customer_req' ? 'Dịch vụ' : (TABS.find(t => t.id === activeTab)?.label || 'Dịch vụ / Sản phẩm')}
                    </th>
                    {staff.map(s => (
                      <th key={s.id} className="py-4 px-3 text-center w-[160px] border-r border-slate-100 min-w-[160px] font-semibold">
                        <div className="flex flex-col items-center gap-1">
                          <Avatar src={s.avatar_url} name={s.full_name} size={24} color={s.avatar_color} />
                          <span className="text-[10px] truncate max-w-[140px] font-semibold text-slate-600">{s.full_name}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/20 transition-colors">
                      {/* Item Info (Sticky Left) */}
                      <td className="py-2 sm:py-3 px-2 sm:px-5 sticky left-0 bg-white z-10 border-r border-slate-100 w-[33vw] min-w-[33vw] max-w-[33vw] sm:w-[220px] sm:min-w-[220px] sm:max-w-none align-top sm:align-middle">
                        <div className="font-semibold text-[10px] sm:text-xs text-slate-750 line-clamp-2 sm:line-clamp-none sm:truncate w-full sm:max-w-[180px] leading-tight sm:leading-normal text-center sm:text-left">{item.name}</div>
                        <div className="text-[9px] sm:text-[10px] text-slate-400 font-medium mt-0.5 sm:mt-0.5 text-center sm:text-left">{formatVND(item.price || 0)}</div>
                      </td>

                      {/* Employee Columns */}
                      {staff.map(s => {
                        const cellKey = `${item.id}_${s.id}`;
                        const editObj = edits[cellKey] || { type: 'percent', value: 0 };
                        const isSaving = savingKey === cellKey;

                        // Check system default value as fallback helper text
                        const systemRule = rules.find(r => r.staff_id === 'all' && r.item_id === item.id && r.item_type === item.type);
                        const placeholderText = systemRule 
                          ? `${systemRule.commission_value}${systemRule.commission_type === 'percent' ? '%' : 'đ'}`
                          : '0%';

                        return (
                          <td key={s.id} className="py-2.5 px-3 border-r border-slate-100">
                            <div className="relative flex justify-center">
                              <div className="flex items-center border border-slate-200 rounded-xl focus-within:border-orange-500 bg-white px-2.5 py-1 w-28 shadow-sm transition-all">
                                <input
                                  type="text"
                                  placeholder={placeholderText}
                                  value={editObj.type === 'vnd' && editObj.value ? new Intl.NumberFormat('vi-VN').format(editObj.value) : (editObj.value || '')}
                                  onChange={(e) => {
                                    const rawVal = editObj.type === 'vnd' 
                                      ? e.target.value.replace(/\./g, '').replace(/,/g, '.') 
                                      : e.target.value.replace(/,/g, '.');
                                    const numVal = Number(rawVal);
                                    if (!isNaN(numVal)) {
                                      handleUpdateEdit(cellKey, { value: Math.max(0, numVal || 0) });
                                    } else if (e.target.value === '') {
                                      handleUpdateEdit(cellKey, { value: 0 });
                                    }
                                  }}
                                  onBlur={() => handleSaveCell(item.id, s.id, item.type)}
                                  className="bg-transparent border-none outline-none text-xs text-slate-700 w-full text-right focus:ring-0 focus:outline-none pr-1.5 placeholder:text-slate-400/50 placeholder:font-normal"
                                />
                                <div className="relative flex items-center shrink-0 pr-1 pl-1.5 border-l border-slate-100">
                                  <select 
                                    value={editObj.type}
                                    onChange={(e) => {
                                      handleUpdateEdit(cellKey, { type: e.target.value });
                                      handleSaveCell(item.id, s.id, item.type, editObj.value, e.target.value);
                                    }}
                                    className="bg-transparent border-none outline-none text-xs font-semibold text-slate-500 cursor-pointer focus:ring-0 focus:outline-none appearance-none pr-3 select-none"
                                    style={{ background: 'none' }}
                                  >
                                    <option value="percent">%</option>
                                    <option value="vnd">đ</option>
                                  </select>
                                  <ChevronDown className="w-3 h-3 text-slate-400 absolute right-0 pointer-events-none" />
                                </div>
                              </div>
                              {isSaving && <Loader2 className="absolute -right-3 top-2.5 w-3 h-3 text-orange-500 animate-spin" />}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : activeTab === 'overtime' ? (
        /* Render Overtime Time-based 3-Column Layout */
        <div className="grid grid-cols-12 gap-5 items-start font-sans">
          {/* Column 1: Staff list (grouped by role) */}
          <div className="col-span-3 bg-white rounded-3xl border border-slate-100 shadow-sm p-4 h-[550px] flex flex-col">
            <h3 className="font-bold text-slate-800 text-xs px-2 mb-3">{t("staff.commission.staff_col", "Nhân viên")}</h3>
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {Object.entries(
                staff.reduce((acc, s) => {
                  const roleName = translateRole(s.role || 'Nhân viên');
                  if (!acc[roleName]) acc[roleName] = [];
                  acc[roleName].push(s);
                  return acc;
                }, {})
              ).map(([roleName, members]) => (
                <div key={roleName} className="space-y-1">
                  <div className="text-[9px] font-bold text-slate-400 uppercase px-2 py-1 tracking-wider bg-slate-50 rounded-lg">{roleName} ({members.length})</div>
                  <div className="space-y-0.5">
                    {members.map(s => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSelectedStaffId(s.id)}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-colors text-xs font-semibold ${selectedStaffId === s.id ? 'bg-orange-50 text-orange-600' : 'hover:bg-slate-50 text-slate-655'}`}
                      >
                        <Avatar src={s.avatar_url} name={s.full_name} size={22} color={s.avatar_color} />
                        <span className="truncate">{s.full_name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 2: Services list */}
          <div className="col-span-3 bg-white rounded-3xl border border-slate-100 shadow-sm p-4 h-[550px] flex flex-col">
            <h3 className="font-bold text-slate-800 text-xs px-2 mb-3">{t("staff.commission.service_col", "Dịch vụ")}</h3>
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {Object.entries(
                services.reduce((acc, s) => {
                  const catName = s.category ? (s.category === 'hair' ? 'Uốn/Duỗi/Nhuộm' : s.category === 'nail' ? 'Nail & Móng' : s.category === 'massage' ? 'Spa & Massage' : s.category) : 'Dịch vụ khác';
                  if (!acc[catName]) acc[catName] = [];
                  acc[catName].push(s);
                  return acc;
                }, {})
              ).map(([catName, list]) => (
                <div key={catName} className="space-y-1">
                  <div className="text-[9px] font-bold text-slate-400 uppercase px-2 py-1 tracking-wider bg-slate-50 rounded-lg">{catName} ({list.length})</div>
                  <div className="space-y-0.5">
                    {list.map(s => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSelectedServiceId(s.id)}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition-colors text-xs font-semibold ${selectedServiceId === s.id ? 'bg-orange-50 text-orange-600' : 'hover:bg-slate-50 text-slate-655'}`}
                      >
                        <span className="truncate max-w-[130px]">{s.name}</span>
                        <span className="text-[10px] text-slate-400 font-medium shrink-0">{formatVND(s.price || 0)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 3: Slots configurations */}
          <div className="col-span-6 bg-white rounded-3xl border border-slate-100 shadow-sm p-5 h-[550px] flex flex-col">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="font-bold text-slate-800 text-xs">{t("staff.commission.overtime_title", "Hoa hồng theo khung giờ")}</h3>
                <p className="text-[9px] text-slate-400 font-medium mt-0.5">{t("staff.commission.overtime_subtitle", "Thiết lập hoa hồng tăng ca cộng thêm")}</p>
              </div>
              <button 
                onClick={handleSaveOvertimeSlots}
                disabled={savingOvertime}
                className="flex items-center gap-1 px-3 py-1.5 bg-orange-500 text-white font-bold text-[11px] rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 shadow-sm shrink-0"
              >
                {savingOvertime ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                {t('staff.scheduler.save', 'Lưu')}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
              {tempSlots.length === 0 ? (
                <div className="text-center py-20 text-xs text-slate-400 font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  {t("staff.commission.overtime_empty", 'Chưa cấu hình khung giờ nào. Bấm "+ Thêm mới" để thiết lập.')}
                </div>
              ) : (
                tempSlots.map((slot, index) => (
                  <div key={slot.id} className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-2xl p-3 shadow-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-bold shrink-0">{t("staff.commission.from", "Từ")}</span>
                      <input 
                        type="time" 
                        value={slot.from}
                        onChange={(e) => setTempSlots(tempSlots.map((s, j) => j === index ? { ...s, from: e.target.value } : s))}
                        className="px-2 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-white outline-none focus:border-orange-500 w-24 shrink-0"
                      />
                      <span className="text-[10px] text-slate-400 font-bold shrink-0">{t("staff.commission.to", "Đến")}</span>
                      <input 
                        type="time" 
                        value={slot.to}
                        onChange={(e) => setTempSlots(tempSlots.map((s, j) => j === index ? { ...s, to: e.target.value } : s))}
                        className="px-2 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-white outline-none focus:border-orange-500 w-24 shrink-0"
                      />
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="flex items-center border border-slate-200 rounded-xl bg-white px-3 py-1 w-32 shadow-sm focus-within:border-orange-500 transition-all">
                        <input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={slot.value || ''}
                          onChange={(e) => setTempSlots(tempSlots.map((s, j) => j === index ? { ...s, value: Math.max(0, Number(e.target.value) || 0) } : s))}
                          className="bg-transparent border-none outline-none text-xs text-slate-700 w-full text-right focus:ring-0 focus:outline-none pr-1.5 placeholder:text-slate-400/40"
                        />
                        <div className="relative flex items-center shrink-0 pr-1 pl-1.5 border-l border-slate-100">
                          <select 
                            value={slot.type}
                            onChange={(e) => setTempSlots(tempSlots.map((s, j) => j === index ? { ...s, type: e.target.value } : s))}
                            className="bg-transparent border-none outline-none text-xs font-semibold text-slate-500 cursor-pointer focus:ring-0 focus:outline-none appearance-none pr-3 select-none"
                            style={{ background: 'none' }}
                          >
                            <option value="percent">%</option>
                            <option value="vnd">đ</option>
                          </select>
                          <ChevronDown className="w-3 h-3 text-slate-400 absolute right-0 pointer-events-none" />
                        </div>
                      </div>
                      <button 
                        onClick={() => setTempSlots(tempSlots.filter((_, j) => j !== index))}
                        className="w-7 h-7 rounded-xl bg-white hover:bg-red-50 text-slate-400 hover:text-red-500 flex items-center justify-center border border-slate-200 hover:border-red-150 transition-colors shrink-0 shadow-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}

              <button 
                onClick={() => setTempSlots([...tempSlots, { id: 'new_' + Date.now(), from: '18:00', to: '19:00', type: 'percent', value: 0 }])}
                className="flex items-center justify-center gap-1 w-full py-2.5 rounded-2xl border border-dashed border-slate-200 hover:border-orange-500 text-slate-450 hover:text-orange-600 font-bold text-xs transition-colors bg-slate-50/50"
              >
                <Plus className="w-3.5 h-3.5" />
                {t("staff.commission.add_new", "Thêm mới")}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Render Revenue Config Tab Component */
        <RevenueConfigTab
          branchId={branchId}
          staff={staff}
          services={services}
          products={products}
          packages={packages}
          treatments={treatments}
          serviceCombos={serviceCombos}
          productCombos={productCombos}
          prepaidCards={prepaidCards}
        />
      )}

      {/* Group Commission Modal */}
      <GroupCommissionModal
        isOpen={showGroupCommissionModal}
        onClose={() => setShowGroupCommissionModal(false)}
        staff={staff}
        activeTab={activeTab}
        items={getDisplayItems()}
        groups={groups}
        onSave={handleSaveGroupCommission}
      />

      {/* Copy Commission Tab Modal */}
      <CopyTabCommissionModal
        isOpen={showCopyTabModal}
        onClose={() => setShowCopyTabModal(false)}
        staff={staff}
        activeTab={activeTab}
        onSave={handleSaveCopyTabCommission}
      />
    </div>
  );
}
