import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Package, CheckCircle2, ShieldAlert } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { formatVND } from '@/lib/format';
import { toast } from '@/components/Layout';

export default function PackageUsageModal({ customerId, onClose, onSelect, initialTreatmentId = null, initialServices = [] }) {
  const [packages, setPackages] = useState([]);
  const [treatments, setTreatments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTreatment, setSelectedTreatment] = useState(null);
  const [selectedServices, setSelectedServices] = useState([]);
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    if (!customerId) return;
    
    const fetchData = async () => {
      setLoading(true);
      try {
        if (base44?.entities?.Membership) {
          const mems = await base44.entities.Membership.list();
          const custMems = mems.filter(m => String(m.customer_id) === String(customerId) && (m.type === 'package' || m.type === 'treatment_course' || m.type === 'treatment') && m.status !== 'deleted' && m.sessions_remaining > 0);
          
          const sp = await base44.entities.ServicePackage.list();
          const tr = await base44.entities.Treatment.list();
          const invList = await base44.entities.Invoice.list().catch(() => []);
          const custInvs = invList.filter(inv => String(inv.customer_id) === String(customerId) && inv.status !== 'cancelled');
          
          setInvoices(custInvs);
          
          const pList = [];
          const tList = [];
          
          for (const m of custMems) {
             if (m.type === 'package') {
                const pkg = sp.find(x => x.name.trim() === m.name.trim());
                if (pkg) {
                   pList.push({ ...m, _package: pkg, remaining_usage: m.sessions_remaining, total_usage: m.total_sessions });
                } else {
                   // Fallback
                   pList.push({ ...m, _package: { name: m.name, services: [] }, remaining_usage: m.sessions_remaining, total_usage: m.total_sessions });
                }
             } else {
                const treatment = tr.find(x => x.name.trim() === m.name.trim());
                if (treatment) {
                   let services = [];
                   if (typeof treatment.services === 'string') {
                     try { services = JSON.parse(treatment.services); } catch (e) {}
                   } else if (Array.isArray(treatment.services)) {
                     services = treatment.services;
                   }
                   
                   const enrichedServices = services.map(srv => {
                     let usedQty = 0;
                     custInvs.forEach(inv => {
                       (inv.items || []).forEach(it => {
                         const matchId = it.customer_treatment_id || '';
                         const itName = it.name || '';
                         if (String(matchId) === String(m.id) && (itName === srv.service_name || String(it.id) === String(srv.service_id))) {
                           usedQty += (it.qty || 1);
                         }
                       });
                     });
                     
                     const limit = srv.sessions || 1;
                     const remaining = Math.max(0, limit - usedQty);
                     return { ...srv, remaining, limit };
                   });
                   
                   const enrichedTreatment = { ...treatment, services: enrichedServices };
                   tList.push({ ...m, _treatment: enrichedTreatment, remaining_usage: m.sessions_remaining, total_usage: m.total_sessions });
                } else {
                   tList.push({ ...m, _treatment: { name: m.name, steps: [] }, remaining_usage: m.sessions_remaining, total_usage: m.total_sessions });
                }
             }
          }
          
          setPackages(pList);
          setTreatments(tList);

          if (initialTreatmentId) {
            const matchedCt = tList.find(ct => String(ct.id) === String(initialTreatmentId));
            if (matchedCt) {
              setSelectedTreatment(matchedCt);
              
              let services = [];
              const trt = matchedCt._treatment;
              if (typeof trt.services === 'string') {
                try { services = JSON.parse(trt.services); } catch (e) {}
              } else if (Array.isArray(trt.services)) {
                services = trt.services;
              }
              
              const preSelected = services.map(srv => {
                const matchInCart = (initialServices || []).find(item => String(item.id || item.service_id) === String(srv.id || srv.service_id) || String(item.name) === String(srv.name || srv.service_name));
                if (matchInCart) {
                  return { service: srv, qty: matchInCart.qty || 1 };
                }
                return null;
              }).filter(Boolean);
              
              setSelectedServices(preSelected);
            }
          }
        }
      } catch (e) {
        console.error('Error fetching customer packages', e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [customerId]);

  const handleSelectPackage = (cp) => {
    const pkg = cp._package;
    if (!pkg) return;
    
    const items = (pkg.services && pkg.services.length > 0)
      ? pkg.services.map(srv => ({
          id: srv.id || srv.service_id,
          name: srv.name || srv.service_name,
          type: 'service',
          price: 0,
          originalPrice: srv.price || 0,
          qty: 1,
          is_from_package: true,
          customer_package_id: cp.id,
          package_name: pkg.name
        }))
      : [{
          id: cp.id,
          name: cp.name,
          type: 'service',
          price: 0,
          originalPrice: 0,
          qty: 1,
          is_from_package: true,
          customer_package_id: cp.id,
          package_name: pkg.name
        }];
        
    onSelect(items);
  };

  const handleSelectTreatment = (ct) => {
    const trt = ct._treatment;
    if (!trt) return;
    
    // Parse services if they exist and are an array
    let services = [];
    if (typeof trt.services === 'string') {
      try {
        services = JSON.parse(trt.services);
      } catch (e) {}
    } else if (Array.isArray(trt.services)) {
      services = trt.services;
    }
    
    if (services.length > 0) {
      setSelectedTreatment(ct);
      // Mặc định không chọn cái nào, để nhân viên tự tích chọn theo yêu cầu
      setSelectedServices([]);
    } else {
      // Fallback
      const items = [{
        id: ct.id,
        name: ct.name,
        type: 'service',
        price: 0,
        originalPrice: 0,
        qty: 1,
        is_from_package: true,
        customer_treatment_id: ct.id,
        package_name: trt.name
      }];
      onSelect(items);
    }
  };

  const handleConfirmTreatmentUsage = () => {
    if (!selectedTreatment || selectedServices.length === 0) return;
    const trt = selectedTreatment._treatment;
    
    const items = selectedServices.map(item => ({
      id: item.service.id || item.service.service_id,
      name: item.service.name || item.service.service_name,
      type: 'service',
      price: 0,
      originalPrice: item.service.price || 0,
      qty: item.qty,
      is_from_package: true,
      customer_treatment_id: selectedTreatment.id,
      package_name: trt.name
    }));
    
    onSelect(items);
    setSelectedTreatment(null);
    setSelectedServices([]);
  };

  const handleToggleService = (srv, checked) => {
    const srvId = srv.id || srv.service_id;

    if (checked) {
      if (srv.remaining <= 0) {
        toast.error('Dịch vụ này trong liệu trình đã sử dụng hết');
        return;
      }
      setSelectedServices([...selectedServices, { service: srv, qty: 1 }]);
    } else {
      setSelectedServices(selectedServices.filter(s => (s.service.id || s.service.service_id) !== srvId));
    }
  };

  const handleUpdateQty = (srvId, delta) => {
    setSelectedServices(prev => prev.map(item => {
      const currentId = item.service.id || item.service.service_id;
      if (currentId === srvId) {
        const newQty = item.qty + delta;
        if (newQty <= 0) return null;
        if (delta > 0 && newQty > (item.service.remaining ?? 1)) {
          toast.error(`Đã đạt giới hạn số lượt còn lại của dịch vụ này (${item.service.remaining} lượt)`);
          return item;
        }
        return { ...item, qty: newQty };
      }
      return item;
    }).filter(Boolean));
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
              <Package className="w-4 h-4 text-emerald-600" />
            </div>
            <h2 className="font-bold text-slate-800 text-lg tracking-tight">Gói & Liệu trình đã mua</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto bg-slate-50">
          {loading ? (
            <div className="text-center py-8 text-slate-400 text-sm animate-pulse">
              Đang tải dữ liệu...
            </div>
          ) : selectedTreatment ? (
            <div className="space-y-4">
              {(() => {
                const totalSelectedQty = selectedServices.reduce((sum, item) => sum + item.qty, 0);
                const remainingLimit = selectedTreatment.remaining_usage;
                const sessionsLeftAfter = Math.max(0, remainingLimit - totalSelectedQty);

                let services = [];
                const trt = selectedTreatment._treatment;
                if (typeof trt.services === 'string') {
                  try { services = JSON.parse(trt.services); } catch (e) {}
                } else if (Array.isArray(trt.services)) {
                  services = trt.services;
                }

                return (
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h3 className="font-bold text-slate-800 text-base">{selectedTreatment._treatment?.name}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">Số lần còn lại của liệu trình: {remainingLimit} lần</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          sessionsLeftAfter === 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                        }`}>
                          Sau khi dùng: Còn {sessionsLeftAfter}/{remainingLimit} lần
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3 pt-2">
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Danh sách dịch vụ tùy chọn:</div>
                      {services.length > 0 ? (
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                          {services.map((srv, idx) => {
                            const srvId = srv.id || srv.service_id;
                            const isChecked = selectedServices.some(s => (s.service.id || s.service.service_id) === srvId);
                            const selectedItem = selectedServices.find(s => (s.service.id || s.service.service_id) === srvId);
                            const currentQty = selectedItem ? selectedItem.qty : 0;
                            const remainingShown = Math.max(0, (srv.remaining ?? 1) - currentQty);

                            return (
                              <div key={srvId || idx} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                                <label className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => handleToggleService(srv, e.target.checked)}
                                    className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500"
                                  />
                                  <div className="min-w-0">
                                    <div className="font-semibold text-slate-700 text-sm truncate">{srv.name || srv.service_name}</div>
                                    <div className="text-[11px] text-slate-400 mt-0.5">
                                      Còn lại: <span className="font-medium text-slate-600">{remainingShown}/{srv.limit}</span>
                                    </div>
                                  </div>
                                </label>
                                {isChecked && (
                                  <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-1 border border-slate-100 ml-4 shrink-0">
                                    <button
                                      onClick={() => handleUpdateQty(srvId, -1)}
                                      className="w-6 h-6 flex items-center justify-center bg-white rounded hover:bg-slate-100 text-slate-500 border border-slate-100 active:scale-95 transition-all"
                                    >
                                      -
                                    </button>
                                    <span className="w-6 text-center text-sm font-bold text-slate-700">{currentQty}</span>
                                    <button
                                      onClick={() => handleUpdateQty(srvId, 1)}
                                      className="w-6 h-6 flex items-center justify-center bg-white rounded hover:bg-slate-100 text-slate-500 border border-slate-100 active:scale-95 transition-all"
                                    >
                                      +
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-slate-400 text-sm border border-dashed border-slate-200 rounded-xl">
                          Không tìm thấy dịch vụ con trong liệu trình này
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => setSelectedTreatment(null)}
                        className="px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors"
                      >
                        Quay lại
                      </button>
                      <button
                        onClick={handleConfirmTreatmentUsage}
                        disabled={selectedServices.length === 0}
                        className={`px-5 py-2 text-sm font-semibold rounded-xl text-white shadow-sm transition-all ${
                          selectedServices.length === 0
                            ? 'bg-slate-300 cursor-not-allowed'
                            : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95'
                        }`}
                      >
                        Xác nhận sử dụng
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : packages.length === 0 && treatments.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center">
                <ShieldAlert className="w-6 h-6 text-slate-300" />
              </div>
              <div className="text-slate-400 text-sm">Khách hàng chưa mua gói hay liệu trình nào.</div>
            </div>
          ) : (
            <div className="space-y-6">
              {packages.length > 0 && (
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Thẻ gói dịch vụ ({packages.length})</div>
                  <div className="grid grid-cols-1 gap-3">
                    {packages.map((cp) => (
                      <div key={cp.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:border-emerald-200 hover:shadow-md transition-all">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <h3 className="font-bold text-slate-800 text-base">{cp._package?.name}</h3>
                            <p className="text-xs text-slate-400 mt-1">
                              Ngày mua: {new Date(cp.created_at).toLocaleDateString('vi-VN')}
                            </p>
                          </div>
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600">
                            Còn {cp.remaining_usage}/{cp.total_usage} lần
                          </span>
                        </div>
                        <div className="mt-4 flex justify-end">
                          <button onClick={() => handleSelectPackage(cp)} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700">
                            <CheckCircle2 className="w-4 h-4" /> Sử dụng
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {treatments.length > 0 && (
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Liệu trình ({treatments.length})</div>
                  <div className="grid grid-cols-1 gap-3">
                    {treatments.map((ct) => (
                      <div key={ct.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:border-blue-200 hover:shadow-md transition-all">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <h3 className="font-bold text-slate-800 text-base">{ct._treatment?.name}</h3>
                            <p className="text-xs text-slate-400 mt-1">
                              Ngày mua: {new Date(ct.created_at).toLocaleDateString('vi-VN')}
                            </p>
                          </div>
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-600">
                            Còn {ct.remaining_usage}/{ct.total_usage} lần
                          </span>
                        </div>
                        <div className="mt-4 flex justify-end">
                          <button onClick={() => handleSelectTreatment(ct)} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700">
                            <CheckCircle2 className="w-4 h-4" /> Sử dụng
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
