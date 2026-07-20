'use client';
import React, { useState, useEffect } from 'react';
import { Percent, DollarSign, Save, Loader2, Sparkles, Sliders, Search, UserCheck } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { formatVND } from '@/lib/format';
import { toast } from '@/components/Layout';
import Avatar from '@/components/Avatar';

const TABS = [
  { id: 'service', label: 'Dịch vụ' },
  { id: 'product', label: 'Sản phẩm' },
  { id: 'package', label: 'Gói dịch vụ' },
  { id: 'treatment', label: 'Liệu trình' },
  { id: 'service_combo', label: 'Combo dịch vụ' },
  { id: 'product_combo', label: 'Combo sản phẩm' },
  { id: 'prepaid_card', label: 'Thẻ tiền mặt' },
  { id: 'customer_req', label: 'Khách yêu cầu' },
  { id: 'overtime', label: 'Tăng ca' },
  { id: 'revenue', label: 'Doanh thu' }
];

export default function CommissionMatrix({ branchId }) {
  const [activeTab, setActiveTab] = useState('service');
  const [staff, setStaff] = useState([]);
  
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
      setRules(ruleList);
    } catch (e) {
      console.error('Lỗi tải danh mục cấu hình hoa hồng:', e);
      const localRules = localStorage.getItem('glopro_staff_commission_rules');
      setRules(localRules ? JSON.parse(localRules) : []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [branchId]);

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
      localStorage.setItem('glopro_staff_commission_rules', JSON.stringify(list));
      setRules(list);
    }
    setSavingKey(null);
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
      <div className="flex border-b border-slate-100 overflow-x-auto whitespace-nowrap scrollbar-none px-2">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => { setActiveTab(t.id); setSearchQuery(''); }}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors shrink-0 ${activeTab === t.id ? 'border-purple-500 text-purple-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {/* Filter and search bar */}
      {isMatrixTab && (
        <div className="flex items-center gap-2 bg-white px-3 py-2.5 rounded-xl border border-slate-200 focus-within:border-primary shadow-sm max-w-sm transition-all">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input 
            type="text"
            placeholder={TABS.find(t => t.id === activeTab) ? `tìm kiếm ${TABS.find(t => t.id === activeTab).label.toLowerCase()}...` : 'tìm kiếm...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs font-normal outline-none bg-transparent text-slate-700 placeholder:text-slate-400/70"
          />
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-100"><div className="w-8 h-8 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin mx-auto" /></div>
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
                    <th className="py-4 px-5 w-[220px] sticky left-0 bg-slate-50 z-10 border-r border-slate-100 font-semibold">
                      {TABS.find(t => t.id === activeTab)?.label || 'Dịch vụ / Sản phẩm'}
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
                      <td className="py-3 px-5 sticky left-0 bg-white z-10 border-r border-slate-100">
                        <div className="font-semibold text-xs text-slate-750 truncate max-w-[180px]">{item.name}</div>
                        <div className="text-[10px] text-slate-400 font-medium mt-0.5">{formatVND(item.price || 0)}</div>
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
                              <div className="flex items-center border border-slate-200 rounded-xl focus-within:border-primary bg-white overflow-hidden px-2 py-1 w-28 shadow-sm transition-all">
                                <select 
                                  value={editObj.type}
                                  onChange={(e) => {
                                    handleUpdateEdit(cellKey, { type: e.target.value });
                                    handleSaveCell(item.id, s.id, item.type, editObj.value, e.target.value);
                                  }}
                                  className="bg-transparent border-none outline-none text-xs font-semibold text-slate-500 cursor-pointer pr-1 focus:ring-0 focus:outline-none w-8 select-none"
                                >
                                  <option value="percent">%</option>
                                  <option value="vnd">đ</option>
                                </select>
                                <input
                                  type="number"
                                  min="0"
                                  placeholder={placeholderText}
                                  value={editObj.value || ''}
                                  onChange={(e) => handleUpdateEdit(cellKey, { value: Math.max(0, Number(e.target.value) || 0) })}
                                  onBlur={() => handleSaveCell(item.id, s.id, item.type)}
                                  className="bg-transparent border-none outline-none text-xs text-slate-700 w-full text-right focus:ring-0 focus:outline-none pr-0.5 placeholder:text-slate-400/50 placeholder:font-normal"
                                />
                              </div>
                              {isSaving && <Loader2 className="absolute -right-3 top-2.5 w-3 h-3 text-purple-500 animate-spin" />}
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
      ) : (
        /* Render Custom Employee Config Views (customer_req, overtime, revenue) */
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden max-w-xl font-sans">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold text-xs">
                <th className="py-4 px-5 font-semibold">Nhân viên</th>
                <th className="py-4 px-3 text-center w-[200px] font-semibold">Mức hoa hồng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {staff.map(s => {
                const cellKey = `${activeTab}_${s.id}`;
                const editObj = edits[cellKey] || { type: 'percent', value: 0 };
                const isSaving = savingKey === cellKey;

                return (
                  <tr key={s.id} className="hover:bg-slate-50/20 transition-colors">
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-2.5">
                        <Avatar src={s.avatar_url} name={s.full_name} size={28} color={s.avatar_color} />
                        <div>
                          <div className="font-semibold text-xs text-slate-750">{s.full_name}</div>
                          <span className="text-[9px] font-medium text-slate-400 capitalize">{s.role}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="relative flex justify-center">
                        <div className="flex items-center border border-slate-200 rounded-xl focus-within:border-primary bg-white overflow-hidden px-2 py-1 w-28 shadow-sm transition-all">
                          <select 
                            value={editObj.type}
                            onChange={(e) => {
                              handleUpdateEdit(cellKey, { type: e.target.value });
                              handleSaveCell(activeTab, s.id, activeTab, editObj.value, e.target.value);
                            }}
                            className="bg-transparent border-none outline-none text-xs font-semibold text-slate-500 cursor-pointer pr-1 focus:ring-0 focus:outline-none w-8 select-none"
                          >
                            <option value="percent">%</option>
                            <option value="vnd">đ</option>
                          </select>
                          <input
                            type="number"
                            min="0"
                            value={editObj.value}
                            onChange={(e) => handleUpdateEdit(cellKey, { value: Math.max(0, Number(e.target.value) || 0) })}
                            onBlur={() => handleSaveCell(activeTab, s.id, activeTab)}
                            className="bg-transparent border-none outline-none text-xs text-slate-700 w-full text-right focus:ring-0 focus:outline-none pr-0.5"
                          />
                        </div>
                        {isSaving && <Loader2 className="absolute -right-3 top-2.5 w-3 h-3 text-purple-500 animate-spin" />}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
