'use client';
import React, { useState, useEffect } from 'react';
import { Info, Save, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useBranch } from '@/lib/BranchContext';
import { toast } from '@/components/Layout';
import PreferencesTab from '@/components/booking/PreferencesTab';
import PagesTab from '@/components/booking/PagesTab';
import ServicesTab from '@/components/booking/ServicesTab';
import EmployeesTab from '@/components/booking/EmployeesTab';
import { useT } from '@/lib/i18n';

const DEFAULT_SETTING = {
  slug: '',
  is_active: true,
  slot_duration_minutes: 30,
  working_hours: {
    mon: { open: '09:00', close: '18:00', enabled: true },
    tue: { open: '09:00', close: '18:00', enabled: true },
    wed: { open: '09:00', close: '18:00', enabled: true },
    thu: { open: '09:00', close: '18:00', enabled: true },
    fri: { open: '09:00', close: '18:00', enabled: true },
    sat: { open: '09:00', close: '17:00', enabled: true },
    sun: { open: '09:00', close: '17:00', enabled: false },
  },
  allow_double_booking: false,
  max_double_bookings: 1,
  enable_advance_limit: false,
  max_advance_days: 90,
  min_advance_hours: 1,
  allow_self_cancel: false,
  self_cancel_hours: 2,
  limit_booking_slots: false,
  max_slots_per_hour: 3,
  primary_identifier: 'email',
  allow_group_appointments: false,
  require_staff_selection: true,
  show_service_prices: true,
  auto_confirm: true,
  blocked_dates: [],
  // Pages
  online_appointment_enabled: true,
  book_tab_name: '',
  book_tab_description: '',
  show_top_banner: true,
  cover_image_url: '',
  show_gallery: false,
  gallery_images: [],
  // Appearance
  primary_color: '#3B82F6',
  salon_name: '',
  salon_description: '',
  salon_address: '',
  salon_phone: '',
  logo_url: '',
  // Services & Staff
  enabled_service_ids: [],
  enabled_staff_ids: [],
};

export default function Booking() {
  const t = useT();
  const { currentBranchId } = useBranch();
  const [activeTab, setActiveTab] = useState('preferences');
  const [setting, setSetting] = useState(null);
  const [localSetting, setLocalSetting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const TABS = [
    { id: 'preferences', label: t('booking.tab_preferences', 'Settings') },
    { id: 'pages', label: t('booking.tab_pages', 'Interface') },
    { id: 'services', label: t('booking.tab_services', 'Services') },
    { id: 'employees', label: t('booking.tab_employees', 'Staff') },
  ];

  useEffect(() => { loadSetting(); }, [currentBranchId]);

  const loadSetting = async () => {
    setLoading(true);
    try {
      const all = await base44.entities.BookingSetting.list();
      const branchFilter = currentBranchId && currentBranchId !== 'all' ? currentBranchId : null;
      const foundBranch = branchFilter ? (all || []).find(s => s.branch_id === branchFilter) : null;
      const foundGlobal = (all || []).find(s => !s.branch_id) || (all || [])[0];
      const found = foundBranch || foundGlobal;
      if (found) { setSetting(found); setLocalSetting({ ...DEFAULT_SETTING, ...found }); }
      else { setSetting(null); setLocalSetting({ ...DEFAULT_SETTING, branch_id: branchFilter }); }
    } catch { setLocalSetting({ ...DEFAULT_SETTING }); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!localSetting) return;
    setSaving(true);
    try {
      const payload = {
        ...localSetting,
        branch_id: (currentBranchId && currentBranchId !== 'all') ? currentBranchId : null,
      };
      const saved = setting?.id
        ? await base44.entities.BookingSetting.update(setting.id, payload)
        : await base44.entities.BookingSetting.create(payload);
      setSetting(saved);
      setLocalSetting({ ...DEFAULT_SETTING, ...saved });
      toast.success(t('booking.saved_success', 'Booking settings saved!'));
    } catch (e) { toast.error(t('booking.save_error', 'Error: ') + (e.message || e)); }
    finally { setSaving(false); }
  };

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://glopro.app';
  const bookingUrl = localSetting?.slug
    ? `${origin}/book/${localSetting.slug}`
    : null;

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-7 h-7 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-full bg-slate-50 -m-4 md:-m-6">
      {/* Info banner */}
      <div className="bg-pink-50 border-b border-pink-100 px-6 py-2.5 flex items-center gap-2.5">
        <Info className="w-4 h-4 text-pink-400 shrink-0" />
        <p className="text-sm text-slate-600">
          {t('booking.link_banner', 'Your booking link: ')}{' '}
          {bookingUrl
            ? <a href={bookingUrl} target="_blank" rel="noreferrer" className="text-pink-500 font-medium hover:underline">{bookingUrl}</a>
            : <span className="text-slate-400 italic">{t('booking.link_not_configured', 'Not configured — please enter a slug in the "Interface" tab')}</span>
          }
        </p>
      </div>

      <div className="px-6 pt-5 pb-8 max-w-4xl">
        {/* Page header */}
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-bold text-slate-900">{t('booking.title', 'Online Booking')}</h1>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-pink-500 hover:bg-pink-600 text-white text-sm font-semibold transition-all disabled:opacity-60 shadow-sm"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {saving ? t('booking.saving', 'Saving...') : t('booking.save_btn', 'Save Changes')}
          </button>
        </div>

        {/* Tabs — system standard pill style */}
        <div className="flex overflow-x-auto gap-1 bg-white border border-slate-100 rounded-2xl p-1 shadow-sm mb-5">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-pink-500 text-white shadow-sm font-bold'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div>
          {activeTab === 'preferences' && (
            <PreferencesTab setting={localSetting} onChange={setLocalSetting} />
          )}
          {activeTab === 'pages' && (
            <PagesTab setting={localSetting} onChange={setLocalSetting} />
          )}
          {activeTab === 'services' && (
            <ServicesTab setting={localSetting} onChange={setLocalSetting} branchId={currentBranchId} />
          )}
          {activeTab === 'employees' && (
            <EmployeesTab setting={localSetting} onChange={setLocalSetting} branchId={currentBranchId} />
          )}
        </div>
      </div>
    </div>
  );
}
