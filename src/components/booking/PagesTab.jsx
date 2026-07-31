'use client';
import React, { useRef } from 'react';
import { UploadCloud, X, Image as ImageIcon, Upload } from 'lucide-react';
import { SettingCard } from './PreferencesTab';
import ImageUpload from '@/components/ImageUpload';
import { toast } from '@/components/Layout';

export default function PagesTab({ setting, onChange }) {
  const up = (f, v) => onChange({ ...setting, [f]: v });
  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  const bannerInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const handleFileUpload = (file, callback) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error('Ảnh quá lớn (tối đa 5MB)');
    try {
      const reader = new FileReader();
      reader.onload = (e) => callback(e.target.result);
      reader.readAsDataURL(file);
    } catch (e) {
      toast.error('Tải ảnh thất bại');
    }
  };

  return (
    <div className="space-y-3 pb-8">
      {/* Online appointment toggle */}
      <SettingCard
        title="Nhận đặt lịch online"
        description="Cho phép khách hàng đặt lịch hẹn qua link công khai"
        toggle={setting?.online_appointment_enabled !== false}
        onToggle={() => up('online_appointment_enabled', !setting?.online_appointment_enabled)}
      />

      {/* Appointment URL */}
      <SettingCard
        title="Đường dẫn (URL) đặt lịch"
        description="Tuỳ chỉnh địa chỉ link đặt lịch của salon"
      >
        <div className="flex items-stretch gap-0 max-w-lg">
          <span className="flex items-center px-3 bg-slate-50 border border-slate-200 border-r-0 rounded-l-lg text-sm text-slate-400 font-mono whitespace-nowrap">
            {origin}/book/
          </span>
          <input
            value={setting?.slug || ''}
            onChange={e => up('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            placeholder="ten-salon-cua-ban"
            className="flex-1 px-3 py-2 border border-slate-200 rounded-r-lg text-sm focus:outline-none focus:border-pink-400 font-mono min-w-0"
          />
        </div>
        <p className="text-xs text-slate-400 mt-1.5">VD: my-salon, spa-hoa-lan, glopro-quan1</p>
      </SettingCard>

      {/* Book tab name */}
      <SettingCard
        title={<span>Tên trang đặt lịch <span className="text-red-500">*</span></span>}
        description="Tên hiển thị trên tab trang đặt lịch online"
      >
        <input
          value={setting?.book_tab_name || ''}
          onChange={e => up('book_tab_name', e.target.value)}
          placeholder="Đặt lịch hẹn"
          className="w-full max-w-lg px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-pink-400"
        />
      </SettingCard>

      {/* Appointment tab description */}
      <SettingCard
        title={<span>Mô tả trang đặt lịch <span className="text-red-500">*</span></span>}
        description="Mô tả ngắn hiển thị trên trang đặt lịch"
      >
        <input
          value={setting?.book_tab_description || ''}
          onChange={e => up('book_tab_description', e.target.value)}
          placeholder="Đặt lịch dịch vụ làm đẹp nhanh chóng và tiện lợi"
          className="w-full max-w-lg px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-pink-400"
        />
      </SettingCard>

      {/* Top banner */}
      <SettingCard
        title="Ảnh bìa (Banner)"
        description="Ảnh hiển thị phía trên cùng trang đặt lịch"
        toggle={setting?.show_top_banner !== false}
        onToggle={() => up('show_top_banner', !setting?.show_top_banner)}
      >
        {setting?.show_top_banner !== false && (
          <div className="space-y-3 max-w-lg">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={bannerInputRef}
              onChange={e => {
                handleFileUpload(e.target.files[0], (url) => up('cover_image_url', url));
                e.target.value = '';
              }}
            />
            {setting?.cover_image_url ? (
              <div className="relative rounded-xl overflow-hidden border border-slate-200">
                <img
                  src={setting.cover_image_url}
                  alt="Banner"
                  className="w-full h-48 object-cover"
                  onError={e => { e.target.style.display = 'none'; }}
                />
                <button
                  onClick={() => up('cover_image_url', '')}
                  className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-lg flex items-center justify-center hover:bg-red-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => bannerInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center bg-slate-50 cursor-pointer hover:bg-slate-100 hover:border-pink-300 transition-all"
              >
                <UploadCloud className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-400 font-medium">Tải ảnh bìa lên</p>
                <p className="text-[11px] text-slate-300 mt-1">Định dạng: PNG, JPG (tối đa 1600×800 px, 5MB)</p>
              </div>
            )}
            
            {/* Action buttons if banner already exists */}
            {setting?.cover_image_url && (
              <div className="flex gap-2">
                <button
                  onClick={() => bannerInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 text-sm font-medium text-slate-600 hover:bg-slate-200 transition-all"
                >
                  <Upload className="w-4 h-4" /> Đổi ảnh bìa
                </button>
              </div>
            )}
          </div>
        )}
      </SettingCard>

      {/* Salon info */}
      <SettingCard
        title="Thông tin salon"
        description="Thông tin hiển thị trên trang đặt lịch"
      >
        <div className="space-y-4 max-w-lg">
          <div>
            <ImageUpload 
              label="Logo salon" 
              value={setting?.logo_url || ''} 
              onChange={v => up('logo_url', v)} 
              shape="circle" 
            />
          </div>

          <div className="space-y-3">
            {[
              { f: 'salon_name',    label: 'Tên salon',       ph: 'GloPro Beauty & Spa' },
              { f: 'salon_phone',   label: 'Số điện thoại',   ph: '0901 234 567' },
              { f: 'salon_address', label: 'Địa chỉ',         ph: '123 Nguyễn Huệ, Q1, TP.HCM' },
            ].map(({ f, label, ph }) => (
              <div key={f}>
                <label className="text-xs font-medium text-slate-500 block mb-1">{label}</label>
                <input
                  value={setting?.[f] || ''}
                  onChange={e => up(f, e.target.value)}
                  placeholder={ph}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-pink-400"
                />
              </div>
            ))}
          </div>
        </div>
      </SettingCard>

      {/* Gallery */}
      <SettingCard
        title="Bộ sưu tập ảnh (Gallery)"
        description="Hiển thị tab ảnh gallery trên trang đặt lịch"
        toggle={!!setting?.show_gallery}
        onToggle={() => up('show_gallery', !setting?.show_gallery)}
      >
        {setting?.show_gallery && (
          <div className="space-y-3 max-w-lg">
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">
                Tên tab gallery <span className="text-red-500">*</span>
              </label>
              <input
                value={setting?.gallery_tab_name || 'Ảnh salon'}
                onChange={e => up('gallery_tab_name', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-pink-400"
              />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">Ảnh gallery</p>
              <p className="text-[11px] text-slate-400 mb-3">Những ảnh sẽ hiển thị trong tab gallery của trang đặt lịch</p>
              
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                ref={galleryInputRef}
                onChange={e => {
                  const files = Array.from(e.target.files);
                  files.forEach(file => {
                    handleFileUpload(file, (url) => {
                      // Note: We need to use a functional update style or just trust the next render,
                      // but since this is sequential, it's safer to just let up handle the array merging.
                      // Because `up` uses the captured `setting`, multiple rapid calls might overwrite.
                      // Let's modify `onChange` to receive a functional update or we can just accumulate here.
                    });
                  });
                  // Better approach for multiple files:
                  Promise.all(files.map(file => new Promise((resolve) => {
                    if (file.size > 5 * 1024 * 1024) return resolve(null);
                    const reader = new FileReader();
                    reader.onload = ev => resolve(ev.target.result);
                    reader.onerror = () => resolve(null);
                    reader.readAsDataURL(file);
                  }))).then(results => {
                    const validUrls = results.filter(url => url !== null);
                    if (validUrls.length > 0) {
                      up('gallery_images', [...(setting?.gallery_images || []), ...validUrls]);
                    }
                  });

                  e.target.value = '';
                }}
              />

              <div className="flex flex-wrap gap-2">
                {(setting?.gallery_images || []).map((img, i) => (
                  <div key={i} className="relative w-24 h-20 rounded-xl overflow-hidden border border-slate-200">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => up('gallery_images', (setting.gallery_images || []).filter((_, j) => j !== i))}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-lg flex items-center justify-center hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => galleryInputRef.current?.click()}
                  className="w-24 h-20 border-2 border-dashed border-slate-200 hover:border-pink-300 rounded-xl flex flex-col items-center justify-center bg-slate-50 text-slate-400 hover:text-pink-500 hover:bg-slate-100 transition-all text-[10px] gap-1"
                >
                  <ImageIcon className="w-5 h-5" />
                  Thêm ảnh
                </button>
              </div>
            </div>
          </div>
        )}
      </SettingCard>
    </div>
  );
}
