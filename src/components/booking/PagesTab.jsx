'use client';
import React, { useRef } from 'react';
import { UploadCloud, X, Image as ImageIcon, Upload } from 'lucide-react';
import { SettingCard } from './PreferencesTab';
import ImageUpload from '@/components/ImageUpload';
import { toast } from '@/components/Layout';
import { useT } from '@/lib/i18n';

export default function PagesTab({ setting, onChange }) {
  const t = useT();
  const up = (f, v) => onChange({ ...setting, [f]: v });
  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  const bannerInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const handleFileUpload = (file, callback) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error(t('booking.upload_image_too_large', 'Image too large (max 5MB)'));
    try {
      const reader = new FileReader();
      reader.onload = (e) => callback(e.target.result);
      reader.readAsDataURL(file);
    } catch (e) {
      toast.error(t('booking.upload_failed', 'Failed to upload image'));
    }
  };

  return (
    <div className="space-y-3 pb-8">
      {/* Online appointment toggle */}
      <SettingCard
        title={t('booking.enable_online_title', 'Enable Online Booking')}
        description={t('booking.enable_online_desc', 'Allow customers to book appointments via public link')}
        toggle={setting?.online_appointment_enabled !== false}
        onToggle={() => up('online_appointment_enabled', !setting?.online_appointment_enabled)}
      />

      {/* Appointment URL */}
      <SettingCard
        title={t('booking.url_slug_title', 'Booking URL Slug')}
        description={t('booking.url_slug_desc', 'Customize your salon\'s public booking link')}
      >
        <div className="flex items-stretch gap-0 max-w-lg">
          <span className="flex items-center px-3 bg-slate-50 border border-slate-200 border-r-0 rounded-l-lg text-sm text-slate-400 font-mono whitespace-nowrap">
            {origin}/book/
          </span>
          <input
            value={setting?.slug || ''}
            onChange={e => up('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            placeholder={t('booking.url_slug_placeholder', 'your-salon-name')}
            className="flex-1 px-3 py-2 border border-slate-200 rounded-r-lg text-sm focus:outline-none focus:border-pink-400 font-mono min-w-0"
          />
        </div>
        <p className="text-xs text-slate-400 mt-1.5">{t('booking.url_slug_hint', 'e.g. my-salon, spa-flower, glopro-danang')}</p>
      </SettingCard>

      {/* Book tab name */}
      <SettingCard
        title={<span>{t('booking.tab_name_title', 'Booking Page Title')} <span className="text-red-500">*</span></span>}
        description={t('booking.tab_name_desc', 'Title displayed on the public booking page')}
      >
        <input
          value={setting?.book_tab_name || ''}
          onChange={e => up('book_tab_name', e.target.value)}
          placeholder={t('booking.tab_name_placeholder', 'Book Appointment')}
          className="w-full max-w-lg px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-pink-400"
        />
      </SettingCard>

      {/* Appointment tab description */}
      <SettingCard
        title={<span>{t('booking.tab_desc_title', 'Booking Page Description')} <span className="text-red-500">*</span></span>}
        description={t('booking.tab_desc_desc', 'Short description shown on booking page')}
      >
        <input
          value={setting?.book_tab_description || ''}
          onChange={e => up('book_tab_description', e.target.value)}
          placeholder={t('booking.tab_desc_placeholder', 'Quick and convenient beauty service booking')}
          className="w-full max-w-lg px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-pink-400"
        />
      </SettingCard>

      {/* Top banner */}
      <SettingCard
        title={t('booking.banner_title', 'Cover Image (Banner)')}
        description={t('booking.banner_desc', 'Header banner image displayed on booking page')}
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
                <p className="text-xs text-slate-400 font-medium">{t('booking.upload_cover_image', 'Upload cover image')}</p>
                <p className="text-[11px] text-slate-300 mt-1">{t('booking.cover_image_format_hint', 'Formats: PNG, JPG (max 1600×800 px, 5MB)')}</p>
              </div>
            )}
            
            {/* Action buttons if banner already exists */}
            {setting?.cover_image_url && (
              <div className="flex gap-2">
                <button
                  onClick={() => bannerInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 text-sm font-medium text-slate-600 hover:bg-slate-200 transition-all"
                >
                  <Upload className="w-4 h-4" /> {t('booking.change_banner', 'Change Cover Image')}
                </button>
              </div>
            )}
          </div>
        )}
      </SettingCard>

      {/* Salon info */}
      <SettingCard
        title={t('booking.salon_info_title', 'Salon Information')}
        description={t('booking.salon_info_desc', 'Information displayed on booking page')}
      >
        <div className="space-y-4 max-w-lg">
          <div>
            <ImageUpload 
              label={t('booking.salon_logo', 'Salon Logo')} 
              value={setting?.logo_url || ''} 
              onChange={v => up('logo_url', v)} 
              shape="circle" 
            />
          </div>

          <div className="space-y-3">
            {[
              { f: 'salon_name',    label: t('booking.salon_name_label', 'Salon Name'),       ph: 'GloPro Beauty & Spa' },
              { f: 'salon_phone',   label: t('booking.salon_phone_label', 'Phone Number'),   ph: '0901 234 567' },
              { f: 'salon_address', label: t('booking.salon_address_label', 'Address'),         ph: '123 Nguyen Hue, Dist 1, HCMC' },
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
        title={t('booking.gallery_title', 'Photo Gallery')}
        description={t('booking.gallery_desc', 'Display gallery tab on booking page')}
        toggle={!!setting?.show_gallery}
        onToggle={() => up('show_gallery', !setting?.show_gallery)}
      >
        {setting?.show_gallery && (
          <div className="space-y-3 max-w-lg">
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">
                {t('booking.gallery_tab_name', 'Gallery Tab Title')} <span className="text-red-500">*</span>
              </label>
              <input
                value={setting?.gallery_tab_name || t('booking.default_gallery_tab_name', 'Salon Photos')}
                onChange={e => up('gallery_tab_name', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-pink-400"
              />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">{t('booking.gallery_images_title', 'Gallery Images')}</p>
              <p className="text-[11px] text-slate-400 mb-3">{t('booking.gallery_images_desc', 'Images displayed in gallery tab on booking page')}</p>
              
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                ref={galleryInputRef}
                onChange={e => {
                  const files = Array.from(e.target.files);
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
                  {t('booking.add_image', 'Add Image')}
                </button>
              </div>
            </div>
          </div>
        )}
      </SettingCard>
    </div>
  );
}
