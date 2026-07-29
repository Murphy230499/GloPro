'use client';
import React, { useState } from 'react';
import { Search, Plus, Building2, Phone, Mail, MapPin, Edit3, Trash2, DollarSign, FileText } from 'lucide-react';
import { formatVND } from '@/lib/format';
import { toast } from '@/components/Layout';
import SupplierModal from './SupplierModal';

export default function SuppliersTab({ suppliers, onSaveSupplier, onDeleteSupplier }) {
  const [search, setSearch] = useState('');
  const [modalSupplier, setModalSupplier] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const filtered = (suppliers || []).filter(s => {
    const q = search.toLowerCase();
    return !q || (s.name || '').toLowerCase().includes(q) || (s.code || '').toLowerCase().includes(q) || (s.phone || '').includes(q);
  });

  const totalDebt = (suppliers || []).reduce((sum, s) => sum + (s.debt || 0), 0);
  const totalImported = (suppliers || []).reduce((sum, s) => sum + (s.total_imported || 0), 0);

  const handleOpenAdd = () => {
    setModalSupplier(null);
    setShowModal(true);
  };

  const handleOpenEdit = (s) => {
    setModalSupplier(s);
    setShowModal(true);
  };

  const handleSave = (formData) => {
    onSaveSupplier(formData);
    setShowModal(false);
  };

  return (
    <div className="space-y-4 font-sans text-left">
      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-2xs">
          <div className="text-xs text-slate-400 font-medium">Tổng Nhà Cung Cấp</div>
          <div className="text-xl font-bold text-slate-800 mt-1">{suppliers.length} đối tác</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-2xs">
          <div className="text-xs text-slate-400 font-medium">Tổng Tiền Đã Nhập Hàng</div>
          <div className="text-xl font-bold text-purple-600 mt-1">{formatVND(totalImported)}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-2xs">
          <div className="text-xs text-slate-400 font-medium">Tổng Công Nợ Phải Trả</div>
          <div className="text-xl font-bold text-red-500 mt-1">{formatVND(totalDebt)}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-white p-3 rounded-2xl border border-slate-100 shadow-2xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input 
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên, mã NCC, số điện thoại..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-purple-500 text-slate-800"
          />
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Thêm Nhà Cung Cấp
        </button>
      </div>

      {/* Grid Suppliers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filtered.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl p-12 text-center border border-slate-100">
            <p className="text-slate-400 text-sm font-medium">Không tìm thấy Nhà cung cấp nào phù hợp</p>
          </div>
        ) : (
          filtered.map((s) => (
            <div key={s.id} className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-100">
                    {s.code || 'NCC'}
                  </span>
                  {s.debt > 0 ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100">
                      Còn nợ: {formatVND(s.debt)}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                      Hết nợ
                    </span>
                  )}
                </div>

                <div className="font-bold text-sm text-slate-900 leading-snug">{s.name}</div>

                {s.contact_person && (
                  <div className="text-xs text-slate-500 font-medium">
                    Liên hệ: <span className="font-semibold text-slate-700">{s.contact_person}</span>
                  </div>
                )}

                <div className="space-y-1 pt-1 text-xs text-slate-400 border-t border-slate-50">
                  {s.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-slate-700 font-medium">{s.phone}</span>
                    </div>
                  )}
                  {s.email && (
                    <div className="flex items-center gap-1.5 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-slate-600 truncate">{s.email}</span>
                    </div>
                  )}
                  {s.address && (
                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="text-slate-600 line-clamp-2">{s.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Toolbar Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div className="text-[11px] text-slate-400 font-medium">
                  Đã nhập: <span className="font-bold text-purple-700">{formatVND(s.total_imported || 0)}</span>
                </div>

                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => handleOpenEdit(s)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    title="Chỉnh sửa"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => onDeleteSupplier(s.id)}
                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Xóa nhà cung cấp"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Popup */}
      {showModal && (
        <SupplierModal 
          supplier={modalSupplier}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
