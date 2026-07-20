'use client';
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, LogOut, UserCog, X, Shield } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/Layout';
import Avatar from '@/components/Avatar';
import ImageUpload from '@/components/ImageUpload';

const ROLE_LABEL = { admin: 'Super Admin', user: 'Nhân viên' };

export default function ProfileMenu() {
  const { user, logout, checkUserAuth } = useAuth();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => {if (ref.current && !ref.current.contains(e.target)) setOpen(false);};
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={ref} className="relative shrink-0">
      <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-2 py-1 rounded-xl hover:bg-slate-100 px-1 ml-4">
        <Avatar src={user?.avatar_url} name={user?.full_name || 'U'} size={36} color="#FF6B9D" ring />
        <div className="hidden sm:block text-left">
          <div className="text-sm font-semibold leading-tight max-w-[140px] truncate">{user?.full_name || 'Tài khoản'}</div>
          <div className="text-[11px] text-slate-400 leading-tight max-w-[140px] truncate">{user?.email}</div>
        </div>
        <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
      </button>

      {open &&
      <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-slate-100 shadow-xl z-50 overflow-hidden">
          <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-pink-50 to-purple-50">
            <Avatar src={user?.avatar_url} name={user?.full_name || 'U'} size={48} color="#FF6B9D" />
            <div className="min-w-0">
              <div className="font-bold truncate">{user?.full_name || 'Tài khoản'}</div>
              <div className="text-xs text-slate-500 truncate">{user?.email}</div>
              {user?.role &&
            <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/70 text-pink-600">
                  <Shield className="w-3 h-3" /> {ROLE_LABEL[user.role] || user.role}
                </span>
            }
            </div>
          </div>
          <div className="p-2">
            <button onClick={() => {setEditing(true);setOpen(false);}} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-slate-50 text-sm font-medium">
              <UserCog className="w-4 h-4 text-slate-500" /> Cập nhật hồ sơ
            </button>
            <button onClick={() => logout(true)} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-red-50 text-sm font-medium text-red-600">
              <LogOut className="w-4 h-4" /> Đăng xuất
            </button>
          </div>
        </div>
      }

      {editing && <ProfileForm user={user} onClose={() => setEditing(false)} onSaved={() => checkUserAuth()} />}
    </div>);

}

function ProfileForm({ user, onClose, onSaved }) {
  const [f, setF] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    avatar_url: user?.avatar_url || ''
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe(f);
      toast.success('Đã cập nhật hồ sơ');
      onSaved();
      onClose();
    } catch (e) {
      toast.error('Lỗi: ' + (e.message || e));
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative bg-white w-full md:max-w-md rounded-t-3xl md:rounded-3xl p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Hồ sơ cá nhân</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex flex-col items-center gap-2 mb-4">
          <Avatar src={f.avatar_url} name={f.full_name || 'U'} size={80} color="#FF6B9D" ring />
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-400">Email</label>
            <input value={user?.email || ''} disabled className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 text-slate-400" />
          </div>
          <input value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} placeholder="Họ tên" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
          <input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="Số điện thoại" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
          <ImageUpload value={f.avatar_url} onChange={(v) => setF({ ...f, avatar_url: v })} label="Ảnh đại diện" shape="circle" />
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-slate-100 font-semibold text-sm">Hủy</button>
          <button onClick={save} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm disabled:opacity-50">
            {saving ? 'Đang lưu...' : 'Lưu'}
          </button>
        </div>
      </div>
    </div>);

}