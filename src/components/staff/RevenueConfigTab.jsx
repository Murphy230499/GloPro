'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Trash2, Check, Search, ChevronDown, UserCheck, X, FolderCheck 
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { formatVND } from '@/lib/format';
import { toast } from '@/components/Layout';
import Avatar from '@/components/Avatar';

export default function RevenueConfigTab({ 
  staff, 
  services, 
  products, 
  packages, 
  treatments, 
  serviceCombos, 
  productCombos, 
  prepaidCards 
}) {
  const [rules, setRules] = useState([]);
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
        console.error('Lỗi tải cấu hình thưởng doanh thu:', e);
        const local = localStorage.getItem('glopro_revenue_bonus_rules');
        setRules(local ? JSON.parse(local) : []);
      }
      setLoading(false);
    };
    loadRules();
  }, []);

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
      name: 'Thưởng doanh thu mới',
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
      toast.success('Đã xóa cấu hình thưởng doanh thu!');
    } catch (e) {
      toast.error('Lỗi khi xóa: ' + (e.message || e));
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      for (const rule of rules) {
        // Validate
        if (!rule.name.trim()) {
          toast.error("Vui lòng nhập tên cho cấu hình thưởng!");
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

        if (String(rule.id).startsWith('new_')) {
          await base44.entities.RevenueBonusRule.create(payload);
        } else {
          await base44.entities.RevenueBonusRule.update(rule.id, payload);
        }
      }
      
      const list = await base44.entities.RevenueBonusRule.list();
      setRules(list || []);
      toast.success('Cập nhật cấu hình thưởng doanh thu thành công!');
    } catch (e) {
      console.error('Lỗi khi lưu cấu hình thưởng doanh thu:', e);
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

  const allCatalogItems = [
    ...services.map(s => ({ ...s, type: 'service' })),
    ...products.map(p => ({ ...p, type: 'product' })),
    ...packages.map(p => ({ ...p, type: 'package' })),
    ...treatments.map(t => ({ ...t, type: 'treatment' })),
    ...serviceCombos.map(sc => ({ ...sc, type: 'service_combo' })),
    ...productCombos.map(pc => ({ ...pc, type: 'product_combo' })),
    ...prepaidCards.map(c => ({ ...c, type: 'prepaid_card' }))
  ];

  if (loading) {
    return <div className="text-center py-20"><div className="w-8 h-8 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin mx-auto" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header Block */}
      <div className="flex justify-between items-center bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="font-bold text-slate-800 text-sm">Thưởng theo doanh thu</h2>
          <p className="text-[10px] text-slate-400 mt-1">Nhân viên sẽ được thưởng khi tổng doanh thu kỳ lương đạt mức đã cài đặt</p>
        </div>
        <button 
          onClick={handleSaveAll}
          disabled={saving}
          className="px-5 py-2.5 bg-primary text-white font-bold text-xs rounded-xl shadow-sm hover:opacity-95 transition-opacity disabled:opacity-50"
        >
          {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Cập nhật'}
        </button>
      </div>

      {rules.map((rule) => {
        const isStaffDropOpen = activeStaffDrop === rule.id;
        const isItemDropOpen = activeItemDrop === rule.id;

        return (
          <div key={rule.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-5 relative">
            
            {/* Rule Header Card */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <input 
                type="text" 
                value={rule.name}
                onChange={(e) => handleUpdateRule(rule.id, { name: e.target.value })}
                className="text-sm font-bold text-slate-800 outline-none border-b border-transparent hover:border-slate-200 focus:border-primary pb-0.5 bg-transparent w-72"
              />
              <button 
                onClick={() => handleDeleteRule(rule.id)}
                className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 border border-slate-150 hover:border-red-200 flex items-center justify-center transition-colors shadow-xs"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Selector Fields */}
            <div className="grid grid-cols-2 gap-6 relative" ref={dropdownRef}>
              
              {/* Staff Select Dropdown */}
              <div className="space-y-1.5 relative">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><UserCheck className="w-3.5 h-3.5 text-purple-500" /> Nhân viên áp dụng</span>
                <button
                  type="button"
                  onClick={() => { setActiveStaffDrop(isStaffDropOpen ? null : rule.id); setActiveItemDrop(null); }}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-sm"
                >
                  <span className="truncate">
                    {rule.staff_ids.length === 0 
                      ? 'Chọn nhân viên áp dụng' 
                      : staff.filter(s => rule.staff_ids.includes(s.id)).map(s => s.full_name).join(', ')
                    }
                  </span>
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                </button>

                {isStaffDropOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl border border-slate-250/70 shadow-2xl p-3 z-30 max-h-72 overflow-y-auto space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 focus-within:border-primary transition-all">
                      <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <input 
                        type="text"
                        placeholder="tìm kiếm nhân viên..."
                        value={staffSearch}
                        onChange={(e) => setStaffSearch(e.target.value)}
                        className="bg-transparent text-xs font-medium outline-none w-full text-slate-700 placeholder:text-slate-400"
                      />
                    </div>

                    <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                      {/* Check all option */}
                      <label className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded-xl cursor-pointer select-none">
                        <input 
                          type="checkbox"
                          checked={rule.staff_ids.length === staff.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              handleUpdateRule(rule.id, { staff_ids: staff.map(s => s.id) });
                            } else {
                              handleUpdateRule(rule.id, { staff_ids: [] });
                            }
                          }}
                          className="w-4 h-4 text-primary border-slate-250 rounded focus:ring-0 cursor-pointer"
                        />
                        <span className="text-xs font-bold text-slate-650">Tất cả nhân viên</span>
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
                                <input 
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      handleUpdateRule(rule.id, { staff_ids: [...rule.staff_ids, s.id] });
                                    } else {
                                      handleUpdateRule(rule.id, { staff_ids: rule.staff_ids.filter(id => id !== s.id) });
                                    }
                                  }}
                                  className="w-4 h-4 text-primary border-slate-250 rounded focus:ring-0 cursor-pointer"
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
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><FolderCheck className="w-3.5 h-3.5 text-blue-500" /> Danh mục áp dụng</span>
                <button
                  type="button"
                  onClick={() => { setActiveItemDrop(isItemDropOpen ? null : rule.id); setActiveStaffDrop(null); }}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-sm"
                >
                  <span className="truncate">
                    {rule.item_ids.length === 0 
                      ? 'Chọn dịch vụ / sản phẩm áp dụng' 
                      : `Đã chọn ${rule.item_ids.length} mục`
                    }
                  </span>
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                </button>

                {isItemDropOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl border border-slate-250/70 shadow-2xl p-4.5 z-30 max-h-96 overflow-y-auto space-y-3.5 animate-in fade-in slide-in-from-top-2 duration-200 w-[450px] -left-20">
                    
                    {/* Item categories navigation tabs */}
                    <div className="flex border-b border-slate-100 overflow-x-auto whitespace-nowrap scrollbar-none gap-2 pb-1.5">
                      {[
                        { id: 'service', label: 'Dịch vụ' },
                        { id: 'product', label: 'Sản phẩm' },
                        { id: 'package', label: 'Gói' },
                        { id: 'treatment', label: 'Liệu trình' },
                        { id: 'service_combo', label: 'Combo DV' },
                        { id: 'product_combo', label: 'Combo SP' },
                        { id: 'prepaid_card', label: 'Thẻ' }
                      ].map(t => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => { setActiveItemTab(t.id); setItemSearch(''); }}
                          className={`px-3 py-1.5 text-[10.5px] font-bold rounded-lg transition-colors ${activeItemTab === t.id ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>

                    {/* Search inside catalog dropdown */}
                    <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 focus-within:border-primary transition-all">
                      <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <input 
                        type="text"
                        placeholder={`tìm kiếm trong danh mục...`}
                        value={itemSearch}
                        onChange={(e) => setItemSearch(e.target.value)}
                        className="bg-transparent text-xs font-medium outline-none w-full text-slate-700 placeholder:text-slate-400"
                      />
                    </div>

                    {/* Scrollable list with checkbox */}
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {getCatalogItemsByTab()
                        .filter(x => x.name.toLowerCase().includes(itemSearch.toLowerCase()))
                        .map(x => {
                          const isChecked = rule.item_ids.includes(x.id);
                          return (
                            <label key={x.id} className="flex items-center justify-between px-2.5 py-1.5 hover:bg-slate-50 rounded-xl cursor-pointer select-none">
                              <div className="flex items-center gap-2.5">
                                <input 
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      handleUpdateRule(rule.id, { item_ids: [...rule.item_ids, x.id] });
                                    } else {
                                      handleUpdateRule(rule.id, { item_ids: rule.item_ids.filter(id => id !== x.id) });
                                    }
                                  }}
                                  className="w-4 h-4 text-primary border-slate-250 rounded focus:ring-0 cursor-pointer"
                                />
                                <span className="text-xs font-semibold text-slate-700 truncate max-w-[260px]">{x.name}</span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-semibold">{formatVND(x.price || x.face_value || 0)}</span>
                            </label>
                          );
                        })}
                    </div>

                    {/* Bottom Actions */}
                    <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                      <button 
                        type="button" 
                        onClick={() => setActiveItemDrop(null)}
                        className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-[10.5px] font-bold text-slate-500 hover:bg-slate-50"
                      >
                        Hủy
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setActiveItemDrop(null)}
                        className="px-3.5 py-1.5 rounded-lg bg-primary text-white text-[10.5px] font-bold hover:opacity-95"
                      >
                        Áp dụng
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Rates Table Configuration */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cài đặt tỉ lệ thưởng</span>
                
                {/* Threshold vs Tiered Mode Toggles */}
                <div className="flex rounded-lg bg-slate-100 p-0.5 border border-slate-150 shadow-xs">
                  <button
                    type="button"
                    onClick={() => handleUpdateRule(rule.id, { mechanism: 'threshold' })}
                    className={`px-3 py-1 text-[10.5px] font-bold rounded-md transition-colors ${rule.mechanism === 'threshold' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Mốc doanh thu
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateRule(rule.id, { mechanism: 'tiered' })}
                    className={`px-3 py-1 text-[10.5px] font-bold rounded-md transition-colors ${rule.mechanism === 'tiered' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Bậc thang
                  </button>
                </div>
              </div>

              {/* Table Headers */}
              <div className="border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/50 shadow-sm p-4 space-y-3">
                <div className="grid grid-cols-12 gap-3 text-[10px] text-slate-400 font-bold uppercase tracking-wider pb-1 px-1.5">
                  <div className="col-span-8">Mức doanh thu</div>
                  <div className="col-span-3 text-right">Tỉ lệ thưởng</div>
                  <div className="col-span-1"></div>
                </div>

                <div className="space-y-2.5">
                  {rule.ranges.map((range, index) => (
                    <div key={index} className="grid grid-cols-12 gap-3 items-center">
                      
                      {/* Revenue Bounds Inputs */}
                      <div className="col-span-8 flex items-center gap-2">
                        <span className="text-[10px] text-slate-450 font-bold shrink-0">Từ</span>
                        <input 
                          type="number"
                          placeholder="Nhập giá trị"
                          value={range.from || ''}
                          onChange={(e) => {
                            const val = Math.max(0, Number(e.target.value) || 0);
                            handleUpdateRule(rule.id, {
                              ranges: rule.ranges.map((rg, idx) => idx === index ? { ...rg, from: val } : rg)
                            });
                          }}
                          className="px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-white outline-none focus:border-primary w-full shadow-sm"
                        />
                        <span className="text-[10px] text-slate-450 font-bold shrink-0">Đến</span>
                        <input 
                          type="number"
                          placeholder="Nhập giá trị"
                          value={range.to || ''}
                          onChange={(e) => {
                            const val = Math.max(0, Number(e.target.value) || 0);
                            handleUpdateRule(rule.id, {
                              ranges: rule.ranges.map((rg, idx) => idx === index ? { ...rg, to: val } : rg)
                            });
                          }}
                          className="px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-white outline-none focus:border-primary w-full shadow-sm"
                        />
                      </div>

                      {/* Reward Surcharges Inputs */}
                      <div className="col-span-3">
                        <div className="flex items-center border border-slate-200 rounded-xl bg-white overflow-hidden px-2 py-1 w-full shadow-sm focus-within:border-primary">
                          <input 
                            type="number"
                            placeholder="Nhập giá trị"
                            value={range.value || ''}
                            onChange={(e) => {
                              const val = Math.max(0, Number(e.target.value) || 0);
                              handleUpdateRule(rule.id, {
                                ranges: rule.ranges.map((rg, idx) => idx === index ? { ...rg, value: val } : rg)
                              });
                            }}
                            className="bg-transparent border-none outline-none text-xs text-slate-700 w-full text-right focus:ring-0 focus:outline-none pr-1 placeholder:text-slate-400/40"
                          />
                          <select 
                            value={range.type}
                            onChange={(e) => {
                              handleUpdateRule(rule.id, {
                                ranges: rule.ranges.map((rg, idx) => idx === index ? { ...rg, type: e.target.value } : rg)
                              });
                            }}
                            className="bg-transparent border-none outline-none text-[11px] font-bold text-slate-500 cursor-pointer pr-1 focus:ring-0 focus:outline-none w-8 select-none"
                          >
                            <option value="percent">%</option>
                            <option value="vnd">đ</option>
                          </select>
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
                    className="flex items-center justify-center gap-1 w-full py-2 rounded-xl border border-dashed border-slate-200 hover:border-primary text-slate-400 hover:text-primary font-bold text-xs transition-colors bg-white shadow-xs mt-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Thêm mới
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
        className="flex items-center justify-center gap-1.5 w-full py-3.5 rounded-2xl border border-dashed border-slate-200 hover:border-primary text-slate-450 hover:text-primary font-bold text-xs transition-colors bg-slate-50/50 shadow-sm"
      >
        <Plus className="w-4 h-4" />
        Thêm tùy chọn thưởng
      </button>
    </div>
  );
}
