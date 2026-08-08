'use client';

import { useT } from '@/lib/i18n';
import React, { useState, useEffect } from 'react';
import { X, ChevronDown, CheckSquare } from 'lucide-react';
import Avatar from '@/components/Avatar';
import { Checkbox } from '@/components/ui/checkbox';

export default function GroupCommissionModal({
  isOpen,
  onClose,
  staff,
  activeTab,
  items,
  groups,
  onSave
}) {
  const { t } = useT();
  const [selectedStaffIds, setSelectedStaffIds] = useState([]);
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [value, setValue] = useState(0);
  const [type, setType] = useState('percent');
  const [saving, setSaving] = useState(false);
  const [staffSearch, setStaffSearch] = useState('');
  const [itemSearch, setItemSearch] = useState('');

  const [isStaffDropdownOpen, setIsStaffDropdownOpen] = useState(false);
  const [isItemDropdownOpen, setIsItemDropdownOpen] = useState(false);

  // Reset states on open
  useEffect(() => {
    if (isOpen) {
      setSelectedStaffIds([]);
      setSelectedItemIds([]);
      setValue(0);
      setType('percent');
      setStaffSearch('');
      setItemSearch('');
      setIsStaffDropdownOpen(false);
      setIsItemDropdownOpen(false);
    }
  }, [isOpen]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.staff-dropdown-container')) {
        setIsStaffDropdownOpen(false);
      }
      if (!e.target.closest('.item-dropdown-container')) {
        setIsItemDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  if (!isOpen) return null;

  // --- Staff helpers ---
  const handleSelectAllStaff = () => {
    if (selectedStaffIds.length === staff.length) {
      setSelectedStaffIds([]);
    } else {
      setSelectedStaffIds(staff.map(s => s.id));
    }
  };

  const handleToggleStaff = (id) => {
    if (selectedStaffIds.includes(id)) {
      setSelectedStaffIds(selectedStaffIds.filter(x => x !== id));
    } else {
      setSelectedStaffIds([...selectedStaffIds, id]);
    }
  };

  const translateRole = (role) => {
    const rolesMap = {
      manager: 'Quản lý',
      receptionist: 'Lễ tân',
      stylist: 'Thợ chính',
      barber: 'Barber',
      therapist: 'Chuyên viên Spa',
      nail_tech: 'Nail tech',
      technician: 'Kỹ thuật viên',
      cashier: 'Thu ngân',
    };
    return rolesMap[role] || 'Nhóm khác';
  };

  // Group staff by translated role
  const groupedStaff = staff.reduce((acc, curr) => {
    const roleName = translateRole(curr.role || 'technician');
    if (!acc[roleName]) acc[roleName] = [];
    acc[roleName].push(curr);
    return acc;
  }, {});

  const handleToggleStaffGroup = (groupStaffList) => {
    const groupIds = groupStaffList.map(s => s.id);
    const allSelected = groupIds.every(id => selectedStaffIds.includes(id));
    if (allSelected) {
      setSelectedStaffIds(selectedStaffIds.filter(id => !groupIds.includes(id)));
    } else {
      const nextIds = [...selectedStaffIds];
      groupIds.forEach(id => {
        if (!nextIds.includes(id)) nextIds.push(id);
      });
      setSelectedStaffIds(nextIds);
    }
  };

  // --- Item helpers ---
  const tabLabel = {
    service: 'dịch vụ',
    product: 'sản phẩm',
    package: 'gói dịch vụ',
    treatment: 'liệu trình',
    service_combo: 'combo dịch vụ',
    product_combo: 'combo sản phẩm',
    prepaid_card: 'thẻ tiền mặt',
    customer_req: 'dịch vụ theo yêu cầu'
  }[activeTab] || 'vật phẩm';

  // Group items by their group_id name
  const getGroupedItems = () => {
    const grouped = {};
    items.forEach(item => {
      const groupObj = groups.find(g => g.id === item.group_id);
      const groupName = groupObj ? groupObj.name : 'Chưa phân nhóm';
      if (!grouped[groupName]) grouped[groupName] = [];
      grouped[groupName].push(item);
    });
    return grouped;
  };

  const groupedItems = getGroupedItems();

  const handleSelectAllItems = () => {
    if (selectedItemIds.length === items.length) {
      setSelectedItemIds([]);
    } else {
      setSelectedItemIds(items.map(i => i.id));
    }
  };

  const handleToggleItem = (id) => {
    if (selectedItemIds.includes(id)) {
      setSelectedItemIds(selectedItemIds.filter(x => x !== id));
    } else {
      setSelectedItemIds([...selectedItemIds, id]);
    }
  };

  const handleToggleItemGroup = (groupItemsList) => {
    const groupIds = groupItemsList.map(i => i.id);
    const allSelected = groupIds.every(id => selectedItemIds.includes(id));
    if (allSelected) {
      setSelectedItemIds(selectedItemIds.filter(id => !groupIds.includes(id)));
    } else {
      const nextIds = [...selectedItemIds];
      groupIds.forEach(id => {
        if (!nextIds.includes(id)) nextIds.push(id);
      });
      setSelectedItemIds(nextIds);
    }
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (selectedStaffIds.length === 0) {
      alert('Vui lòng chọn ít nhất một nhân viên!');
      return;
    }
    if (selectedItemIds.length === 0) {
      alert(`Vui lòng chọn ít nhất một ${tabLabel}!`);
      return;
    }

    setSaving(true);
    try {
      await onSave({
        selectedStaffIds,
        scope: 'items',
        selectedGroupId: '',
        selectedItemIds,
        value: Number(value) || 0,
        type
      });
      onClose();
    } catch (err) {
      console.error(err);
      alert('Lỗi cấu hình hoa hồng: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-xs" onClick={onClose} />
      <div className="relative bg-white w-full md:max-w-md rounded-3xl p-6 shadow-2xl text-left flex flex-col max-h-[90vh] overflow-visible">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-800 font-sans">{t('staff.commission.group_settings_title', 'Cài đặt hoa hồng nhóm')}</h2>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full bg-slate-200/50 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-visible space-y-4">
          {/* Step 1: Select Staff Dropdown */}
          <div className="space-y-1.5 staff-dropdown-container relative">
            <label className="text-[11px] font-normal text-slate-500 block">{t('staff.commission.step_1_staff', '1. Chọn nhân viên áp dụng')}</label>
            <button
              type="button"
              onClick={() => { setIsStaffDropdownOpen(!isStaffDropdownOpen); setIsItemDropdownOpen(false); }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-normal text-slate-700 focus:border-orange-500 shadow-sm"
            >
              <span className="truncate font-normal text-slate-650">
                {selectedStaffIds.length === 0 
                  ? t('staff.commission.select_staff', 'Chọn nhân viên áp dụng') 
                  : selectedStaffIds.length === staff.length 
                    ? 'Tất cả nhân viên' 
                    : `Đã chọn ${selectedStaffIds.length} nhân viên`}
              </span>
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
            </button>

            {isStaffDropdownOpen && (
              <div className="absolute left-0 right-0 mt-1 bg-white rounded-2xl border border-slate-200 shadow-2xl z-30 flex flex-col max-h-60 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                {/* Search Input */}
                <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 border-b border-slate-100">
                  <input
                    type="text"
                    placeholder="tìm kiếm nhân viên..."
                    value={staffSearch}
                    onChange={(e) => setStaffSearch(e.target.value)}
                    className="w-full bg-transparent text-xs font-medium outline-none text-slate-700 placeholder:text-slate-400/50 placeholder:font-normal placeholder:lowercase"
                  />
                </div>
                {/* Scrollable list */}
                <div className="overflow-y-auto p-2 space-y-2">
                  {/* Select All */}
                  <label className="flex items-center gap-2.5 px-2 py-1.5 hover:bg-slate-50 rounded-xl cursor-pointer select-none">
                    <Checkbox 
                      checked={selectedStaffIds.length === staff.length && staff.length > 0}
                      onCheckedChange={handleSelectAllStaff}
                      className="border-slate-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500 data-[state=checked]:text-white focus-visible:ring-orange-500 cursor-pointer"
                    />
                    <span className="text-xs font-normal text-slate-755">Chọn tất cả</span>
                  </label>

                  {/* Groups and members */}
                  {Object.entries(groupedStaff).map(([roleName, members]) => {
                    const visibleMembers = members.filter(m => m.full_name.toLowerCase().includes(staffSearch.toLowerCase()));
                    if (visibleMembers.length === 0) return null;

                    const isGroupAllSelected = visibleMembers.every(m => selectedStaffIds.includes(m.id));

                    return (
                      <div key={roleName} className="space-y-0.5">
                        <label className="flex items-center gap-2.5 px-2 py-1.5 hover:bg-slate-50 rounded-xl cursor-pointer select-none">
                          <Checkbox 
                            checked={isGroupAllSelected}
                            onCheckedChange={() => handleToggleStaffGroup(visibleMembers)}
                            className="border-slate-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500 data-[state=checked]:text-white focus-visible:ring-orange-500 cursor-pointer"
                          />
                          <span className="text-[10px] font-normal text-slate-400 uppercase tracking-wider">{roleName}</span>
                        </label>
                        
                        <div className="space-y-0.5 pl-4">
                          {visibleMembers.map(m => {
                            const isSelected = selectedStaffIds.includes(m.id);
                            return (
                              <label
                                key={m.id}
                                className={`flex items-center gap-2.5 px-2 py-1.5 hover:bg-slate-50 rounded-xl cursor-pointer select-none ${isSelected ? 'bg-slate-100/60 font-medium' : ''}`}
                              >
                                <Checkbox 
                                  checked={isSelected}
                                  onCheckedChange={() => handleToggleStaff(m.id)}
                                  className="border-slate-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500 data-[state=checked]:text-white focus-visible:ring-orange-500 cursor-pointer"
                                />
                                <Avatar src={m.avatar_url} name={m.full_name} size={20} color={m.avatar_color} />
                                <span className="text-xs font-normal text-slate-700">{m.full_name}</span>
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

          {/* Step 2: Select Items Dropdown */}
          <div className="space-y-1.5 item-dropdown-container relative">
            <label className="text-[11px] font-normal text-slate-500 block">2. Chọn {tabLabel}</label>
            <button
              type="button"
              onClick={() => { setIsItemDropdownOpen(!isItemDropdownOpen); setIsStaffDropdownOpen(false); }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-normal text-slate-700 focus:border-orange-500 shadow-sm"
            >
              <span className="truncate font-normal text-slate-650">
                {selectedItemIds.length === 0 
                  ? `Chọn ${tabLabel} áp dụng` 
                  : selectedItemIds.length === items.length 
                    ? `Tất cả ${tabLabel}` 
                    : `Đã chọn ${selectedItemIds.length} ${tabLabel}`}
              </span>
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
            </button>

            {isItemDropdownOpen && (
              <div className="absolute left-0 right-0 mt-1 bg-white rounded-2xl border border-slate-200 shadow-2xl z-30 flex flex-col max-h-60 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                {/* Search Input */}
                <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 border-b border-slate-100">
                  <input
                    type="text"
                    placeholder={`tìm kiếm ${tabLabel}...`}
                    value={itemSearch}
                    onChange={(e) => setItemSearch(e.target.value)}
                    className="w-full bg-transparent text-xs font-medium outline-none text-slate-700 placeholder:text-slate-400/50 placeholder:font-normal placeholder:lowercase"
                  />
                </div>
                {/* Scrollable list */}
                <div className="overflow-y-auto p-2 space-y-2">
                  {/* Select All */}
                  <button
                    type="button"
                    onClick={handleSelectAllItems}
                    className="w-full flex items-center gap-2.5 text-left py-1.5 hover:bg-slate-55 rounded-lg transition-colors px-2"
                  >
                    <div className="shrink-0">
                      {selectedItemIds.length === items.length ? (
                        <div className="w-4 h-4 rounded-md bg-orange-500 text-white flex items-center justify-center"><CheckSquare className="w-4 h-4" /></div>
                      ) : (
                        <div className="w-4 h-4 rounded-md border border-slate-300 bg-white" />
                      )}
                    </div>
                    <span className="text-xs font-normal text-slate-755">Chọn tất cả</span>
                  </button>

                  {/* Groups and child items */}
                  {Object.entries(groupedItems).map(([groupName, groupItems]) => {
                    const visibleItems = groupItems.filter(i => i.name.toLowerCase().includes(itemSearch.toLowerCase()));
                    if (visibleItems.length === 0) return null;

                    const isGroupAllSelected = visibleItems.every(i => selectedItemIds.includes(i.id));

                    return (
                      <div key={groupName} className="space-y-0.5">
                        <button
                          type="button"
                          onClick={() => handleToggleItemGroup(visibleItems)}
                          className="w-full flex items-center gap-2.5 text-left py-1 hover:bg-slate-55 rounded-lg transition-colors px-2"
                        >
                          <div className="shrink-0">
                            {isGroupAllSelected ? (
                              <div className="w-4 h-4 rounded-md bg-orange-500 text-white flex items-center justify-center"><CheckSquare className="w-4 h-4" /></div>
                            ) : (
                              <div className="w-4 h-4 rounded-md border border-slate-300 bg-white" />
                            )}
                          </div>
                          <span className="text-[10px] font-normal text-slate-400 uppercase tracking-wider">{groupName}</span>
                        </button>
                        
                        <div className="space-y-0.5 pl-4">
                          {visibleItems.map(item => {
                            const isSelected = selectedItemIds.includes(item.id);
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => handleToggleItem(item.id)}
                                className={`w-full flex items-center gap-2.5 text-left py-1.5 px-2 rounded-lg hover:bg-slate-55 transition-colors ${isSelected ? 'bg-slate-100/60 font-medium' : ''}`}
                              >
                                <div className="shrink-0">
                                  {isSelected ? (
                                    <div className="w-4 h-4 rounded-md bg-orange-500 text-white flex items-center justify-center"><CheckSquare className="w-3.5 h-3.5" /></div>
                                  ) : (
                                    <div className="w-4 h-4 rounded-md border border-slate-200 bg-white" />
                                  )}
                                </div>
                                <span className="text-xs font-normal text-slate-700">{item.name}</span>
                              </button>
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

          {/* Step 3: Commission Value */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 block">{t('staff.commission.step_3_amount', '3. Thiết lập mức hoa hồng')}</label>
            <div className="flex items-center border border-slate-200 rounded-xl bg-white px-4 py-2.5 w-full shadow-sm focus-within:border-orange-500 transition-all">
              <input 
                type="text"
                placeholder="0"
                value={type === 'vnd' && value ? new Intl.NumberFormat('vi-VN').format(value) : (value || '')}
                onChange={(e) => {
                  const rawVal = type === 'vnd' 
                    ? e.target.value.replace(/\./g, '').replace(/,/g, '.') 
                    : e.target.value.replace(/,/g, '.');
                  const numVal = Number(rawVal);
                  if (!isNaN(numVal)) {
                    setValue(Math.max(0, numVal || 0));
                  } else if (e.target.value === '') {
                    setValue(0);
                  }
                }}
                className="bg-transparent border-none outline-none text-sm text-slate-700 w-full text-right focus:ring-0 focus:outline-none pr-2.5 font-bold"
              />
              <div className="relative flex items-center shrink-0 pr-1 pl-2 border-l border-slate-100">
                <select 
                  value={type}
                  onChange={(e) => setType(e.target.value)}
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
        </form>

        {/* Footer Actions */}
        <div className="flex gap-2 pt-4 border-t border-slate-150/50 mt-4 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-slate-200/50 hover:bg-slate-250 transition-colors font-bold text-xs text-slate-650 font-sans"
          >
            {t('staff.scheduler.cancel', 'Hủy')}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-orange-500 text-white font-bold text-xs shadow-sm hover:opacity-95 transition-all font-sans"
          >
            {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Lưu'}
          </button>
        </div>
      </div>
    </div>
  );
}
