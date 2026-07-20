'use client';
import React, { useState, useEffect } from 'react';
import { Percent, DollarSign, Save, Loader2, Sparkles, Sliders } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { formatVND } from '@/lib/format';
import { toast } from '@/components/Layout';

const TABS = [
  { id: 'service', label: 'Dịch vụ' },
  { id: 'product', label: 'Sản phẩm' },
  { id: 'package', label: 'Gói & Liệu trình' },
  { id: 'prepaid', label: 'Thẻ & Combo' }
];

export default function CommissionMatrix({ branchId }) {
  const [activeTab, setActiveTab] = useState('service');
  const [staff, setStaff] = useState([]);
  const [selectedStaffId, setSelectedStaffId] = useState('all');
  
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
  const [savingId, setSavingId] = useState(null);

  // Local rule edits state
  const [edits, setEdits] = useState({}); // { itemId: { type: 'percent'|'vnd', value: number } }

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
      // Fallback local storage rule list
      const localRules = localStorage.getItem('glopro_staff_commission_rules');
      setRules(localRules ? JSON.parse(localRules) : []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [branchId]);

  // Sync edits state when active tab or staffId changes
  useEffect(() => {
    const nextEdits = {};
    const filteredRules = rules.filter(r => r.staff_id === selectedStaffId);
    
    const getActiveItems = () => {
      if (activeTab === 'service') return services.map(s => ({ id: s.id, type: 'service' }));
      if (activeTab === 'product') return products.map(p => ({ id: p.id, type: 'product' }));
      if (activeTab === 'package') return [
        ...packages.map(p => ({ id: p.id, type: 'package' })),
        ...treatments.map(t => ({ id: t.id, type: 'treatment' }))
      ];
      return [
        ...serviceCombos.map(sc => ({ id: sc.id, type: 'service_combo' })),
        ...productCombos.map(pc => ({ id: pc.id, type: 'product_combo' })),
        ...prepaidCards.map(c => ({ id: c.id, type: 'prepaid_card' }))
      ];
    };

    getActiveItems().forEach(item => {
      const match = filteredRules.find(r => r.item_id === item.id && r.item_type === item.type);
      nextEdits[item.id] = {
        type: match ? match.commission_type : 'percent',
        value: match ? match.commission_value : 0
      };
    });

    setEdits(nextEdits);
  }, [activeTab, selectedStaffId, rules, services, products, packages, treatments, serviceCombos, productCombos, prepaidCards]);

  const handleUpdateEdit = (itemId, patch) => {
    setEdits(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], ...patch }
    }));
  };

  const handleSaveRule = async (itemId, itemType) => {
    setSavingId(itemId);
    const editVal = edits[itemId] || { type: 'percent', value: 0 };
    const payload = {
      staff_id: selectedStaffId,
      item_type: itemType,
      item_id: itemId,
      commission_type: editVal.type,
      commission_value: Number(editVal.value) || 0
    };

    const existing = rules.find(r => r.staff_id === selectedStaffId && r.item_id === itemId && r.item_type === itemType);

    try {
      if (existing) {
        await base44.entities.StaffCommissionRule.update(existing.id, payload);
      } else {
        await base44.entities.StaffCommissionRule.create(payload);
      }
      toast.success('Đã lưu quy tắc hoa hồng');
      // Reload rule list
      const updatedRules = await base44.entities.StaffCommissionRule.list();
      setRules(updatedRules);
    } catch (e) {
      // Local fallback for offline mode
      const local = localStorage.getItem('glopro_staff_commission_rules');
      let list = local ? JSON.parse(local) : [];
      if (existing) {
        list = list.map(r => r.id === existing.id ? { ...r, ...payload } : r);
      } else {
        list.push({ id: 'local_' + Date.now(), ...payload });
      }
      localStorage.setItem('glopro_staff_commission_rules', JSON.stringify(list));
      setRules(list);
      toast.success('Đã lưu quy tắc hoa hồng (offline)');
    }
    setSavingId(null);
  };

  // Get active items to display
  const getDisplayItems = () => {
    if (activeTab === 'service') return services.map(s => ({ ...s, type: 'service', price: s.price }));
    if (activeTab === 'product') return products.map(p => ({ ...p, type: 'product', price: p.price }));
    if (activeTab === 'package') return [
      ...packages.map(p => ({ ...p, type: 'package', price: p.price })),
      ...treatments.map(t => ({ ...t, type: 'treatment', price: t.price }))
    ];
    return [
      ...serviceCombos.map(sc => ({ ...sc, type: 'service_combo', price: sc.price })),
      ...productCombos.map(pc => ({ ...pc, type: 'product_combo', price: pc.price })),
      ...prepaidCards.map(c => ({ ...c, type: 'prepaid_card', price: c.face_value || c.price }))
    ];
  };

  const displayItems = getDisplayItems();

  return (
    <div className="space-y-4">
      {/* Configuration Selection Bar */}
      <div className="bg-white rounded-3xl border border-slate-100 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-purple-500 shrink-0" />
          <div>
            <h4 className="text-sm font-bold text-slate-800">Cấu hình Hoa hồng Nhân viên</h4>
            <p className="text-[10px] text-slate-400 mt-0.5">Chọn nhân viên cụ thể hoặc mặc định toàn hệ thống để cài đặt tỷ lệ nhận tiền</p>
          </div>
        </div>

        <select
          value={selectedStaffId}
          onChange={(e) => setSelectedStaffId(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-purple-400 bg-white"
        >
          <option value="all">⭐ Mặc định Toàn hệ thống (Default)</option>
          {staff.map(s => <option key={s.id} value={s.id}>👤 {s.full_name} ({s.role})</option>)}
        </select>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-100 px-3">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors ${activeTab === t.id ? 'border-purple-500 text-purple-600' : 'border-transparent text-slate-400 hover:text-slate-650'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Table List of Items */}
      {loading ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-100"><div className="w-8 h-8 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin mx-auto" /></div>
      ) : displayItems.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 text-slate-400 text-xs">Không tìm thấy vật phẩm nào trong danh mục này</div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold text-xs">
                  <th className="py-4 px-5">Tên Mặt hàng / Dịch vụ</th>
                  <th className="py-4 px-3 text-center">Giá bán niêm yết</th>
                  <th className="py-4 px-3 text-center min-w-[120px]">Kiểu hoa hồng</th>
                  <th className="py-4 px-3 text-center min-w-[120px]">Giá trị hoa hồng</th>
                  <th className="py-4 px-5 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayItems.map((item) => {
                  const editObj = edits[item.id] || { type: 'percent', value: 0 };
                  const isSaving = savingId === item.id;
                  
                  // Check if there is a default rule to show as placeholder/helper when editing specific staff member
                  let defaultHelp = '';
                  if (selectedStaffId !== 'all') {
                    const defRule = rules.find(r => r.staff_id === 'all' && r.item_id === item.id && r.item_type === item.type);
                    if (defRule) {
                      defaultHelp = defRule.commission_type === 'percent' 
                        ? `(Mặc định: ${defRule.commission_value}%)`
                        : `(Mặc định: ${formatVND(defRule.commission_value)})`;
                    }
                  }

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="font-semibold text-xs text-slate-800">{item.name}</div>
                        <div className="text-[10px] text-slate-400 capitalize mt-0.5">{item.type.replace('_', ' ')}</div>
                      </td>
                      <td className="py-3.5 px-3 text-center text-xs font-bold text-slate-700">
                        {formatVND(item.price || 0)}
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="flex justify-center items-center">
                          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-100">
                            <button
                              type="button"
                              onClick={() => handleUpdateEdit(item.id, { type: 'percent' })}
                              className={`p-1 rounded-md transition-colors ${editObj.type === 'percent' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                              title="Tính theo phần trăm (%)"
                            >
                              <Percent className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateEdit(item.id, { type: 'vnd' })}
                              className={`p-1 rounded-md transition-colors ${editObj.type === 'vnd' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                              title="Tính theo số tiền (VNĐ)"
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              value={editObj.value}
                              onChange={(e) => handleUpdateEdit(item.id, { value: Math.max(0, Number(e.target.value) || 0) })}
                              className="w-24 px-2 py-1 rounded-lg border border-slate-200 text-center text-xs font-bold focus:outline-none focus:border-purple-400 bg-white"
                            />
                            <span className="absolute right-2 top-1.5 text-[10px] text-slate-400 font-bold pointer-events-none">
                              {editObj.type === 'percent' ? '%' : 'đ'}
                            </span>
                          </div>
                          {defaultHelp && (
                            <span className="text-[9px] text-slate-400 font-semibold mt-0.5">{defaultHelp}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        <button
                          onClick={() => handleSaveRule(item.id, item.type)}
                          disabled={isSaving}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
                        >
                          {isSaving ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Save className="w-3.5 h-3.5" />
                          )}
                          Lưu
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
