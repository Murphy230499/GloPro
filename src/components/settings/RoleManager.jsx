'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Shield, User, Info, ChevronDown, ChevronRight, Plus, Trash2, Edit3 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/Layout';

const slugify = (str) => {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "_");
};

export default function RoleManager({ accounts = [], roles = [], onRefresh, onClose }) {
  const [expandedRole, setExpandedRole] = useState(null);
  
  // Form states for adding/editing role
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState(null);

  // Group accounts by role
  const membersByRole = (roleCode) => {
    return accounts.filter(acc => acc.role === roleCode);
  };

  const toggleExpand = (roleCode) => {
    setExpandedRole(expandedRole === roleCode ? null : roleCode);
  };

  // Save role (Create or Update)
  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Vui lòng nhập tên vai trò');
    
    // Auto-generate code from name
    const normalizedCode = slugify(name.trim());
    if (!editingId && !normalizedCode) {
      return toast.error('Tên vai trò không hợp lệ');
    }

    const payload = {
      name: name.trim(),
      description: description.trim(),
      ...(editingId ? {} : { code: normalizedCode, is_system: false })
    };

    try {
      if (editingId) {
        await base44.entities.Role.update(editingId, payload);
        toast.success('Đã cập nhật thông tin vai trò');
      } else {
        // Check if code already exists
        const exists = roles.some(r => r.code === normalizedCode);
        if (exists) {
          return toast.error('Mã vai trò đã tồn tại trong hệ thống');
        }
        await base44.entities.Role.create(payload);
        toast.success('Đã thêm vai trò mới thành công');
      }
      resetForm();
      onRefresh?.();
    } catch (err) {
      toast.error('Lỗi khi lưu vai trò: ' + (err.message || err));
    }
  };

  // Set up form to edit role
  const handleEdit = (role) => {
    setEditingId(role.id);
    setName(role.name);
    setDescription(role.description || '');
  };

  // Delete role
  const handleDelete = async (role) => {
    const members = membersByRole(role.code);
    if (members.length > 0) {
      return toast.error(`Vai trò này đang được gán cho ${members.length} tài khoản. Vui lòng chuyển vai trò của họ trước khi xóa!`);
    }

    if (!window.confirm(`Bạn có chắc chắn muốn xóa vai trò "${role.name}"?`)) return;

    try {
      await base44.entities.Role.delete(role.id);
      toast.success('Đã xóa vai trò thành công');
      onRefresh?.();
    } catch (err) {
      toast.error('Lỗi khi xóa vai trò: ' + (err.message || err));
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setEditingId(null);
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-body animate-fade-in" onClick={onClose}>
      <div 
        className="relative bg-white w-full md:max-w-md rounded-3xl p-6 shadow-2xl text-left flex flex-col max-h-[90vh] overflow-hidden" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Shield className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-800">
              Vai trò hệ thống & Tự định nghĩa
            </h2>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-slate-200/50 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 py-1">
          {/* Add/Edit Role Form */}
          <form onSubmit={handleSave} className="bg-slate-50 p-4 border border-slate-100 rounded-2xl space-y-3">
            <h4 className="text-xs font-bold text-slate-700">
              {editingId ? 'Chỉnh sửa vai trò' : 'Thêm vai trò mới'}
            </h4>
            
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-500">Tên vai trò *</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="Lễ tân" 
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white outline-none focus:border-emerald-450 text-slate-700"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-500">Mô tả chi tiết</label>
              <input 
                type="text" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="Chào đón khách hàng, thu ngân quầy phụ..." 
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white outline-none focus:border-emerald-450 text-slate-700"
              />
            </div>

            <div className="flex gap-2 justify-end pt-1">
              {editingId && (
                <button 
                  type="button" 
                  onClick={resetForm} 
                  className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-250 text-[11px] font-bold text-slate-600 transition-colors"
                >
                  Hủy
                </button>
              )}
              <button 
                type="submit" 
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-[11px] font-bold text-white transition-colors"
              >
                {editingId ? 'Cập nhật' : 'Thêm vai trò'}
              </button>
            </div>
          </form>

          {/* Roles List */}
          <div className="space-y-3">
            {roles.map((role) => {
              const members = membersByRole(role.code);
              const isExpanded = expandedRole === role.code;

              return (
                <div 
                  key={role.code} 
                  className={`border rounded-2xl transition-all duration-200 overflow-hidden ${
                    isExpanded 
                      ? 'border-slate-200 shadow-sm bg-slate-50/20' 
                      : 'border-slate-100 hover:border-slate-200 hover:shadow-xs bg-white'
                  }`}
                >
                  {/* Header Row */}
                  <div className="flex items-center justify-between p-4">
                    <button
                      onClick={() => toggleExpand(role.code)}
                      className="flex items-center gap-3 text-left focus:outline-none flex-1 min-w-0"
                    >
                      <Shield className={`w-5 h-5 ${role.is_system ? 'text-amber-500' : 'text-emerald-500'} shrink-0`} />
                      <div className="min-w-0">
                        <h3 className="font-bold text-sm text-slate-800 leading-tight flex items-center gap-1.5">
                          <span className="truncate">{role.name}</span>
                          {role.is_system && (
                            <span className="bg-slate-100 text-slate-500 text-[8px] px-1 py-0.5 rounded scale-90 origin-left">Hệ thống</span>
                          )}
                        </h3>
                        <span className="text-[11px] text-slate-400 font-medium mt-0.5 block">
                          {members.length} tài khoản
                        </span>
                      </div>
                    </button>
                    
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      {!role.is_system && (
                        <>
                          <button 
                            onClick={() => handleEdit(role)} 
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-450 hover:text-slate-650 transition-colors"
                            title="Chỉnh sửa vai trò"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDelete(role)} 
                            className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-650 transition-colors"
                            title="Xóa vai trò"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                      <button onClick={() => toggleExpand(role.code)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expandable Details */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 border-t border-slate-100/50 space-y-3">
                      <p className="text-xs text-slate-500 leading-relaxed font-medium">
                        {role.description || 'Chưa có mô tả chi tiết cho vai trò này.'}
                      </p>

                      {/* Members List */}
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Thành viên sở hữu
                        </h4>
                        {members.length === 0 ? (
                          <div className="text-xs text-slate-400 font-medium py-1 italic">
                            Chưa có thành viên nào
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 gap-2">
                            {members.map(member => (
                              <div key={member.id} className="flex items-center gap-2 bg-slate-50/80 p-2 rounded-xl border border-slate-100/50">
                                <div className="w-7 h-7 rounded-full bg-slate-200 overflow-hidden shrink-0 flex items-center justify-center border border-slate-300/40">
                                  {member.avatar_url ? (
                                    <img src={member.avatar_url} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <User className="w-4 h-4 text-slate-450" />
                                  )}
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="text-xs font-semibold text-slate-700 truncate leading-tight">
                                    {member.full_name || member.email}
                                  </span>
                                  <span className="text-[9px] text-slate-450 truncate mt-0.5">
                                    {member.email}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 pt-4 border-t border-slate-150/50 mt-4 shrink-0">
          <button 
            onClick={onClose} 
            className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors font-bold text-xs text-slate-600 text-center"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
