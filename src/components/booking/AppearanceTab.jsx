'use client';
import React from 'react';
import { Save, Loader2, Palette, Image, Phone, MapPin, FileText } from 'lucide-react';

const COLOR_PRESETS = [
  '#EC4899', '#F97316', '#EAB308', '#10B981',
  '#3B82F6', '#8B5CF6', '#14B8A6', '#F43F5E',
];

export default function AppearanceTab({ setting, onChange, onSave, saving }) {
  const update = (field, value) => onChange({ ...setting, [field]: value });
  const primaryColor = setting?.primary_color || '#EC4899';

  return (
    <div className="space-y-5">
      {/* Preview banner */}
      <div
        className="relative rounded-3xl overflow-hidden h-32 flex items-end p-4"
        style={{ background: setting?.cover_image_url ? `url(${setting.cover_image_url}) center/cover` : `linear-gradient(135deg, ${primaryColor}dd, ${primaryColor}88)` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="relative z-10 flex items-end gap-3">
          {setting?.logo_url && (
            <img src={setting.logo_url} alt="Logo" className="w-12 h-12 rounded-xl object-cover border-2 border-white shadow-lg" />
          )}
          <div>
            <p className="text-white font-bold text-base drop-shadow">{setting?.salon_name || 'Tên salon của bạn'}</p>
            {setting?.salon_address && <p className="text-white/80 text-xs drop-shadow">{setting.salon_address}</p>}
          </div>
        </div>
        <div className="absolute top-3 right-3 z-10 bg-white/90 rounded-xl px-3 py-1">
          <span className="text-xs font-semibold" style={{ color: primaryColor }}>Preview</span>
        </div>
      </div>

      {/* Images */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Image className="w-4 h-4 text-pink-500" /> Hình ảnh
        </h3>
        <div>
          <label className="text-xs font-semibold text-slate-600 mb-1 block">URL ảnh bìa (Cover)</label>
          <input
            value={setting?.cover_image_url || ''}
            onChange={e => update('cover_image_url', e.target.value)}
            placeholder="https://..."
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-pink-400"
          />
          <p className="text-xs text-slate-400 mt-1">Kích thước khuyến nghị: 1200×400px</p>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600 mb-1 block">URL Logo</label>
          <input
            value={setting?.logo_url || ''}
            onChange={e => update('logo_url', e.target.value)}
            placeholder="https://..."
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-pink-400"
          />
          <p className="text-xs text-slate-400 mt-1">Kích thước khuyến nghị: 200×200px</p>
        </div>
      </div>

      {/* Primary color */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-3">
          <Palette className="w-4 h-4 text-pink-500" /> Màu chủ đạo
        </h3>
        <div className="flex items-center gap-3 flex-wrap">
          {COLOR_PRESETS.map(c => (
            <button
              key={c}
              onClick={() => update('primary_color', c)}
              className={`w-8 h-8 rounded-full border-4 transition-all ${primaryColor === c ? 'border-slate-800 scale-110' : 'border-transparent scale-100'}`}
              style={{ background: c }}
            />
          ))}
          <input
            type="color"
            value={primaryColor}
            onChange={e => update('primary_color', e.target.value)}
            className="w-8 h-8 rounded-full border-2 border-slate-200 cursor-pointer"
            title="Chọn màu tùy chỉnh"
          />
          <span className="text-xs text-slate-500 font-mono">{primaryColor}</span>
        </div>
      </div>

      {/* Salon info */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <FileText className="w-4 h-4 text-pink-500" /> Thông tin salon
        </h3>

        {[
          { field: 'salon_name', label: 'Tên salon', placeholder: 'GloPro Beauty & Spa', icon: null },
          { field: 'salon_description', label: 'Mô tả ngắn', placeholder: 'Salon làm đẹp chuyên nghiệp...', icon: null },
          { field: 'salon_address', label: 'Địa chỉ', placeholder: '123 Nguyễn Huệ, Q1, TP.HCM', icon: MapPin },
          { field: 'salon_phone', label: 'Số điện thoại', placeholder: '0901 234 567', icon: Phone },
        ].map(({ field, label, placeholder, icon: Icon }) => (
          <div key={field}>
            <label className="text-xs font-semibold text-slate-600 mb-1 block flex items-center gap-1">
              {Icon && <Icon className="w-3 h-3" />} {label}
            </label>
            <input
              value={setting?.[field] || ''}
              onChange={e => update(field, e.target.value)}
              placeholder={placeholder}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-pink-400"
            />
          </div>
        ))}
      </div>

      <button
        onClick={onSave}
        disabled={saving}
        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold text-sm shadow-lg shadow-pink-200 hover:from-pink-600 hover:to-rose-600 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {saving ? 'Đang lưu...' : 'Lưu giao diện'}
      </button>
    </div>
  );
}
