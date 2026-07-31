import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/Layout';
import { useBranch } from '@/lib/BranchContext';

export default function FacilityManagementModal({ open, onClose, services = [], onFacilityChange }) {
  const { currentBranchId } = useBranch();
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', applicable_services: [], is_active: true });
  const [dbError, setDbError] = useState(false);

  const loadFacilities = async () => {
    try {
      setLoading(true);
      setDbError(false);
      const branchFilter = currentBranchId === 'all' ? {} : { branch_id: currentBranchId };
      const data = await base44.entities.Facility.filter(branchFilter);
      setFacilities(data || []);
    } catch (err) {
      console.warn('Facility table may not exist yet:', err?.message || err);
      // Table likely doesn\'t exist — show setup prompt, not an error toast
      const isTableMissing = err?.code === '42P01' || err?.message?.includes('does not exist') || err?.message?.includes('relation');
      if (isTableMissing) {
        setDbError(true);
        setFacilities([]);
      } else {
        toast.error('Không thể kết nối database. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) loadFacilities();
  }, [open, currentBranchId]);

  if (!open) return null;

  const handleSave = async () => {
    if (!formData.name) return toast.error('Vui lòng nhập tên vị trí');
    try {
      const payload = {
        name: formData.name,
        is_active: formData.is_active,
        applicable_services: formData.applicable_services,
        branch_id: currentBranchId === 'all' ? null : currentBranchId
      };
      
      if (editingId) {
        await base44.entities.Facility.update(editingId, payload);
        toast.success('Cập nhật thành công');
      } else {
        await base44.entities.Facility.create(payload);
        toast.success('Thêm mới thành công');
      }
      
      setEditingId(null);
      setFormData({ name: '', applicable_services: [], is_active: true });
      loadFacilities();
      onFacilityChange?.();
    } catch (e) {
      console.error('Facility save error:', e);
      const isTableMissing = e?.code === '42P01' || e?.message?.includes('does not exist') || e?.message?.includes('relation');
      if (isTableMissing) {
        setDbError(true);
        toast.error('Bảng facility chưa được tạo. Xem hướng dẫn SQL để thiết lập.');
      } else {
        const msg = e?.message || e?.details || 'Vui lòng thử lại';
        toast.error(`Lỗi khi lưu vị trí: ${msg}`);
      }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xoá vị trí này?')) return;
    try {
      await base44.entities.Facility.delete(id);
      toast.success('Xoá thành công');
      loadFacilities();
      onFacilityChange?.();
    } catch (e) {
      toast.error('Lỗi khi xoá vị trí');
    }
  };

  const toggleService = (serviceId) => {
    setFormData(prev => {
      const isSelected = prev.applicable_services.includes(serviceId);
      if (isSelected) {
        return { ...prev, applicable_services: prev.applicable_services.filter(id => id !== serviceId) };
      } else {
        return { ...prev, applicable_services: [...prev.applicable_services, serviceId] };
      }
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 font-body" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
      <div className="relative bg-white w-full max-w-3xl rounded-2xl shadow-xl flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Quản lý Vị trí (Ghế / Giường)</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden min-h-[450px]">
          {/* Left: List */}
          <div className="w-full md:w-[45%] border-r border-slate-100 flex flex-col bg-slate-50/50">
            <div className="p-4 flex items-center justify-between border-b border-slate-100">
              <h3 className="font-semibold text-slate-700 text-sm">Danh sách vị trí</h3>
              <button 
                onClick={() => {
                  setEditingId(null);
                  setFormData({ name: '', applicable_services: [], is_active: true });
                }}
                className="flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm mới
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2 text-slate-400">
                  <div className="w-5 h-5 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin" />
                  <span className="text-xs">Đang tải...</span>
                </div>
              ) : dbError ? (
                <div className="p-4 flex flex-col gap-3">
                  <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <span className="text-amber-500 text-lg mt-0.5">⚠️</span>
                    <div>
                      <p className="text-xs font-bold text-amber-800 mb-1">Cần thiết lập Database</p>
                      <p className="text-[11px] text-amber-700 leading-relaxed">Bảng <code className="bg-amber-100 px-1 rounded">facility</code> chưa có trong Supabase. Vui lòng chạy SQL migration để khởi tạo.</p>
                    </div>
                  </div>
                  <div className="bg-slate-900 rounded-xl p-3">
                    <p className="text-[10px] text-slate-400 mb-1.5">Chạy trong Supabase SQL Editor:</p>
                    <pre className="text-[10px] text-emerald-400 leading-relaxed whitespace-pre-wrap">{`CREATE TABLE IF NOT EXISTS facility (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  applicable_services TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  branch_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE facility ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON facility FOR ALL USING (true) WITH CHECK (true);`}</pre>
                  </div>
                  <button onClick={loadFacilities} className="text-xs font-medium text-blue-600 bg-blue-50 px-3 py-2 rounded-xl hover:bg-blue-100 transition-colors">
                    Thử tải lại
                  </button>
                </div>
              ) : facilities.length === 0 ? (
                <div className="text-center text-slate-400 text-xs py-8">Chưa có vị trí nào. Thêm mới bên phải ↗</div>
              ) : (
                facilities.map(fac => (
                  <div key={fac.id} className={`group flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${editingId === fac.id ? 'border-blue-500 bg-blue-50/50 shadow-sm' : 'border-slate-200 bg-white hover:border-blue-300'}`} onClick={() => {
                    setEditingId(fac.id);
                    setFormData({ name: fac.name, applicable_services: fac.applicable_services || [], is_active: fac.is_active !== false });
                  }}>
                    <div>
                      <div className="font-bold text-slate-700 text-sm">{fac.name}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {fac.applicable_services?.length ? `${fac.applicable_services.length} dịch vụ áp dụng` : 'Áp dụng mọi dịch vụ'}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(fac.id); }} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          {/* Right: Form */}
          <div className="w-full md:w-[55%] flex flex-col bg-white">
            <div className="p-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-700 text-sm">{editingId ? 'Chỉnh sửa vị trí' : 'Thêm vị trí mới'}</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Tên vị trí (Ghế/Giường)</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="VD: Ghế Nail VIP 1"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:bg-white transition-colors text-slate-700"
                />
              </div>
              
              <div className="flex-1 flex flex-col min-h-[200px]">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Dịch vụ áp dụng</label>
                  <span className="text-[10px] text-slate-400">Nếu không chọn, áp dụng tất cả</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 overflow-y-auto pr-2 custom-scrollbar">
                  {services.map(srv => {
                    const isSelected = formData.applicable_services.includes(srv.id);
                    return (
                      <button
                        key={srv.id}
                        type="button"
                        onClick={() => toggleService(srv.id)}
                        className={`flex items-start gap-3 p-2.5 rounded-xl border text-left transition-colors ${
                          isSelected ? 'border-blue-500 bg-blue-50/30' : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className={`mt-0.5 w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                          isSelected ? 'border-blue-500 bg-blue-500 text-white' : 'border-slate-300 bg-white'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`text-xs font-semibold truncate ${isSelected ? 'text-blue-700' : 'text-slate-700'}`} title={srv.name}>
                            {srv.name}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50">
              <button onClick={onClose} className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-xl transition-colors">
                Đóng
              </button>
              <button onClick={handleSave} className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm shadow-blue-200">
                Lưu vị trí
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
