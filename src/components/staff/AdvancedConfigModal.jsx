'use client';

import React, { useState, useEffect } from 'react';
import { X, Settings, ShieldAlert, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/Layout';

const ITEMS = [
  { id: 'service', label: 'Dịch vụ' },
  { id: 'product', label: 'Sản phẩm' },
  { id: 'package', label: 'Gói dịch vụ' },
  { id: 'treatment', label: 'Liệu trình' },
  { id: 'service_combo', label: 'Combo dịch vụ' },
  { id: 'product_combo', label: 'Combo sản phẩm' },
  { id: 'prepaid_card', label: 'Thẻ tiền mặt' }
];

export default function AdvancedConfigModal({ onClose }) {
  const [configs, setConfigs] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadConfigs = async () => {
      try {
        const list = await base44.entities.StaffCommissionConfig.list();
        const map = {};
        list.forEach(c => {
          map[c.item_type] = c;
        });
        setConfigs(map);
      } catch (e) {
        console.error('Lỗi nạp cấu hình nâng cao:', e);
        const local = localStorage.getItem('glopro_staff_commission_config');
        setConfigs(local ? JSON.parse(local) : {});
      }
      setLoading(false);
    };
    loadConfigs();
  }, []);

  const handleToggle = (type, val) => {
    const current = configs[type] || { item_type: type, calc_method: 'before_discount' };
    setConfigs({
      ...configs,
      [type]: { ...current, calc_method: val }
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const logs = [];
      const localList = [];

      for (const item of ITEMS) {
        const config = configs[item.id] || { item_type: item.id, calc_method: 'before_discount' };
        localList.push(config);
        
        // Save to DB
        if (config.id) {
          await base44.entities.StaffCommissionConfig.update(config.id, {
            item_type: config.item_type,
            calc_method: config.calc_method
          });
        } else {
          const created = await base44.entities.StaffCommissionConfig.create({
            item_type: config.item_type,
            calc_method: config.calc_method
          });
          if (created && created.id) {
            config.id = created.id;
          }
        }
        
        const methodStr = config.calc_method === 'before_discount' ? 'Trước giảm giá' : 'Sau giảm giá';
        logs.push(`- ${item.label}: ${methodStr}`);
      }

      // Write Log
      const logPayload = {
        user_name: 'Quản trị viên',
        action_type: 'Cài đặt nâng cao',
        description: `Cập nhật cơ chế tính hoa hồng trước/sau giảm giá:\n${logs.join('\n')}`,
        created_at: new Date().toISOString()
      };

      try {
        await base44.entities.StaffCommissionLog.create(logPayload);
      } catch (logErr) {
        console.warn('Lỗi ghi log:', logErr);
        const localLogs = JSON.parse(localStorage.getItem('glopro_commission_logs') || '[]');
        localLogs.unshift({ id: 'log_' + Date.now(), ...logPayload });
        localStorage.setItem('glopro_commission_logs', JSON.stringify(localLogs));
      }

      localStorage.setItem('glopro_staff_commission_config', JSON.stringify(configs));
      toast.success('Cập nhật cấu hình hoa hồng nâng cao thành công!');
      onClose();
    } catch (e) {
      console.error('Lỗi khi lưu cấu hình nâng cao:', e);
      toast.error('Lỗi khi lưu: ' + (e.message || e));
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-xs" />
      <div className="relative bg-white w-full md:max-w-md rounded-3xl p-6 shadow-2xl relative text-left flex flex-col max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
              <Settings className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-800 font-sans">Cài đặt nâng cao</h2>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-slate-200/50 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-10"><Loader2 className="w-6 h-6 animate-spin text-purple-500 mx-auto" /></div>
        ) : (
          <div className="space-y-5">
            {/* Warning note */}
            <div className="flex gap-2 p-3.5 bg-amber-50/50 border border-amber-100 rounded-2xl text-[11px] text-amber-700 leading-normal font-medium shadow-xs">
              <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <span>Thiết lập này áp dụng toàn hệ thống khi tính toán hoa hồng nhân viên cho các đơn thanh toán tại POS.</span>
            </div>

            {/* List of items configuration */}
            <div className="space-y-3.5">
              {ITEMS.map((item) => {
                const conf = configs[item.id] || { calc_method: 'before_discount' };
                const isAfter = conf.calc_method === 'after_discount';

                return (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-2xl shadow-xs">
                    <span className="text-xs font-bold text-slate-700">{item.label}</span>
                    
                    {/* Toggle Button Select before/after discount */}
                    <div className="flex rounded-lg bg-slate-150 p-0.5 border border-slate-200 shadow-xs">
                      <button
                        type="button"
                        onClick={() => handleToggle(item.id, 'before_discount')}
                        className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-colors ${!isAfter ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-400 hover:text-slate-650'}`}
                      >
                        Trước giảm giá
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggle(item.id, 'after_discount')}
                        className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-colors ${isAfter ? 'bg-white text-slate-850 shadow-xs' : 'text-slate-400 hover:text-slate-650'}`}
                      >
                        Sau giảm giá
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Actions */}
            <div className="flex justify-end gap-2.5 pt-2">
              <button 
                type="button" 
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-205 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors"
              >
                Hủy
              </button>
              <button 
                type="button" 
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:opacity-95 disabled:opacity-50 transition-all font-sans shadow-sm flex items-center justify-center gap-1.5"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Lưu cài đặt
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
