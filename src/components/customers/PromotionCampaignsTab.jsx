'use client';
import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, Megaphone, Percent, Calendar, Sparkles, ChevronDown, X } from 'lucide-react';
import { formatVND } from '@/lib/format';
import { toast } from '@/components/Layout';
import { reloadPromotions } from '@/utils/promos';

const SCOPES = {
  service: 'Chỉ dịch vụ',
  product: 'Chỉ sản phẩm',
  invoice: 'Toàn hóa đơn'
};

const VALUE_TYPES = {
  percent: 'Giảm theo phần trăm (%)',
  fixed: 'Giảm số tiền cụ thể (đ)'
};

export default function PromotionCampaignsTab({ createTrigger }) {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFormModal, setShowFormModal] = useState(false);

  // Form states
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [scope, setScope] = useState('invoice'); // 'service', 'product', 'invoice'
  const [valueType, setValueType] = useState('percent'); // 'percent', 'fixed'
  const [value, setValue] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  const load = () => {
    setLoading(true);
    try {
      const local = localStorage.getItem('glopro_promotions');
      const parsed = local ? JSON.parse(local) : [];
      setPromotions(parsed);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (createTrigger > 0) {
      resetForm();
      setShowFormModal(true);
    }
  }, [createTrigger]);

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setScope('invoice');
    setValueType('percent');
    setValue('');
    setExpiryDate('');
  };

  const resetFormAndClose = () => {
    resetForm();
    setShowFormModal(false);
  };

  const handleSave = () => {
    if (!name.trim()) return toast.error('Vui lòng nhập tên chương trình');
    if (!value || Number(value) <= 0) return toast.error('Vui lòng nhập giá trị giảm hợp lệ');
    if (valueType === 'percent' && Number(value) > 100) return toast.error('Phần trăm giảm không được lớn hơn 100%');
    if (!expiryDate) return toast.error('Vui lòng chọn ngày hết hạn');

    try {
      const local = localStorage.getItem('glopro_promotions');
      let parsed = local ? JSON.parse(local) : [];

      const payload = {
        id: editingId || 'promo_cam_' + Date.now(),
        name: name.trim(),
        type: scope, // service, product, invoice
        valueType, // percent, fixed
        value: Number(value),
        expiryDate,
        created_at: new Date().toISOString().split('T')[0]
      };

      if (editingId) {
        parsed = parsed.map(p => p.id === editingId ? payload : p);
      } else {
        parsed.push(payload);
      }

      localStorage.setItem('glopro_promotions', JSON.stringify(parsed));
      toast.success(editingId ? 'Đã cập nhật chương trình khuyến mãi' : 'Đã tạo chương trình khuyến mãi');
      
      reloadPromotions();
      resetFormAndClose();
      load();
    } catch (e) {
      console.error(e);
      toast.error('Lỗi khi lưu khuyến mãi');
    }
  };

  const handleEdit = (p) => {
    setEditingId(p.id);
    setName(p.name);
    setScope(p.type);
    setValueType(p.valueType);
    setValue(p.value.toString());
    setExpiryDate(p.expiryDate || '');
    setShowFormModal(true);
  };

  const handleDelete = (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa chương trình khuyến mãi này?')) return;
    try {
      const local = localStorage.getItem('glopro_promotions');
      let parsed = local ? JSON.parse(local) : [];
      parsed = parsed.filter(p => p.id !== id);
      localStorage.setItem('glopro_promotions', JSON.stringify(parsed));
      toast.success('Đã xóa chương trình khuyến mãi');
      reloadPromotions();
      load();
    } catch (e) {
      console.error(e);
      toast.error('Lỗi khi xóa khuyến mãi');
    }
  };

  const isExpired = (dateStr) => {
    if (!dateStr) return false;
    const today = new Date().toISOString().split('T')[0];
    return dateStr < today;
  };

  return (
    <div className="space-y-5">
      {/* Intro Box */}
      <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10 flex flex-wrap items-center justify-between gap-3 text-left">
        <div className="text-left space-y-0.5 font-sans">
          <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
            <Megaphone className="w-4 h-4 text-primary" /> Thiết lập Chương trình Khuyến mãi (CTKM)
          </div>
          <div className="text-[10px] text-slate-400 font-semibold">
            Tạo các gói khuyến mãi giảm giá dịch vụ, sản phẩm hoặc toàn hóa đơn để gửi tặng khách hàng theo tập phân khúc.
          </div>
        </div>
      </div>

      {/* Main List */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4 text-left">
        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
          <h3 className="font-bold text-sm text-slate-800">Danh sách chương trình đã tạo</h3>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Đang tải danh sách...</div>
        ) : promotions.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 font-sans">Chưa có chương trình khuyến mãi tự tạo nào. Hãy nhấn nút "Tạo chương trình" ở góc trên.</div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {promotions.map((p) => {
              const expired = isExpired(p.expiryDate);
              return (
                <div key={p.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50 flex flex-col justify-between gap-3 font-sans relative overflow-hidden">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-start gap-3 min-w-0">
                      <span className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-white ${expired ? 'bg-slate-300' : 'bg-primary'}`}>
                        <Percent className="w-4 h-4" />
                      </span>
                      <div className="text-left min-w-0">
                        <div className="font-bold text-xs text-slate-700 truncate">{p.name}</div>
                        <div className="text-[10px] text-slate-450 mt-1 font-semibold">
                          Mức giảm: <span className="text-primary font-bold">{p.valueType === 'percent' ? `${p.value}%` : formatVND(p.value)}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 font-normal">
                          Phạm vi: <span className="font-semibold text-slate-600">{SCOPES[p.type]}</span>
                        </div>
                      </div>
                    </div>

                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase shrink-0 ${expired ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                      {expired ? 'Hết hạn' : 'Đang chạy'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-200/50 pt-2 mt-1">
                    <div className="text-[9px] text-slate-400 font-medium flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" /> Hết hạn: {p.expiryDate}
                    </div>

                    <div className="flex items-center gap-1">
                      <button onClick={() => handleEdit(p)} className="p-1.5 text-slate-400 hover:text-slate-655 rounded-lg hover:bg-slate-200 transition-colors" title="Sửa"><Edit3 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 text-red-400 hover:text-red-650 rounded-lg hover:bg-red-50 transition-colors" title="Xóa"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Form Modal Popup */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-in fade-in duration-200" onClick={resetFormAndClose}>
          <div className="bg-slate-50 rounded-3xl p-6 max-w-md w-full border border-slate-105 shadow-2xl relative text-left flex flex-col max-h-[90vh] overflow-y-auto animate-in scale-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-150/50 pb-4 mb-4 shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-800 font-sans">{editingId ? 'Chỉnh sửa CTKM' : 'Tạo chương trình khuyến mãi mới'}</h3>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5 font-sans">Cấu hình điều kiện ưu đãi</p>
              </div>
              <button 
                onClick={resetFormAndClose} 
                className="w-8 h-8 rounded-full bg-slate-200/50 flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Content */}
            <div className="space-y-4 font-sans text-xs">
              <div>
                <label className="block font-bold text-slate-500 mb-1">Tên chương trình khuyến mãi</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ví dụ: Tri ân VIP, Khuyến mãi Thu..." className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-primary text-slate-700 bg-white" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-500 mb-1">Phạm vi áp dụng</label>
                  <div className="relative">
                    <select value={scope} onChange={(e) => setScope(e.target.value)} className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs outline-none bg-white text-slate-700 appearance-none">
                      <option value="invoice">Toàn hóa đơn</option>
                      <option value="service">Chỉ dịch vụ</option>
                      <option value="product">Chỉ sản phẩm</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-500 mb-1">Kiểu giảm giá</label>
                  <div className="relative">
                    <select value={valueType} onChange={(e) => setValueType(e.target.value)} className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs outline-none bg-white text-slate-700 appearance-none">
                      <option value="percent">Giảm theo phần trăm (%)</option>
                      <option value="fixed">Giảm số tiền cụ thể (đ)</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-500 mb-1">Giá trị giảm giá</label>
                  <input type="number" value={value} onChange={(e) => setValue(e.target.value)} placeholder={valueType === 'percent' ? 'Ví dụ: 10 (%)' : 'Ví dụ: 50,000 (đ)'} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-primary text-slate-700 bg-white" />
                </div>

                <div>
                  <label className="block font-bold text-slate-500 mb-1">Ngày hết hạn</label>
                  <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-primary text-slate-700 bg-white" />
                </div>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="flex gap-2 pt-4 border-t border-slate-150/50 mt-4 shrink-0">
              <button onClick={resetFormAndClose} className="flex-1 py-2.5 rounded-xl bg-slate-250 hover:bg-slate-300 transition-colors font-bold text-xs text-slate-600 font-sans">Hủy</button>
              <button onClick={handleSave} className="flex-1 py-2.5 rounded-xl bg-primary text-white font-bold text-xs shadow-sm hover:opacity-95 transition-all font-sans">
                {editingId ? 'Cập nhật' : 'Tạo mới'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
