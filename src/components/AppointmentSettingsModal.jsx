'use client';

import React, { useState, useEffect } from 'react';
import { useT } from '@/lib/i18n';
import { X, Maximize2, Check, ChevronDown, Plus, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const DEFAULT_SETTINGS = {
  timeSlotDuration: '15',
  enableDoubleBooking: false,
  maxDoubleBookings: 5,
  customSlotLimits: [],
  requireStaffSelection: false,
  autoNoShow: false,
  noShowWaitTime: '5',
  showNoShowPrompt: true,
  noShowKeepTime: '30',
  showCancelPrompt: true
};

export default function AppointmentSettingsModal({ open, onClose }) {
  const { t } = useT();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      // Load from Supabase
      base44.entities.BookingSetting.list().then(settingsList => {
         if (settingsList && settingsList.length > 0) {
             const dbSettings = settingsList[0].settings_json || {};
             setSettings({ ...DEFAULT_SETTINGS, ...dbSettings, id: settingsList[0].id });
         } else {
             const stored = localStorage.getItem('glowpro_appointment_settings');
             if (stored) {
               try {
                 setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
               } catch (e) {}
             }
         }
      }).catch(e => console.error(e));
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [open]);

  if (!open) return null;

  const handleSave = async () => {
    try {
        const { id, ...settingsJson } = settings;
        if (id) {
            await base44.entities.BookingSetting.update(id, { settings_json: settingsJson });
        } else {
            await base44.entities.BookingSetting.create({ name: 'Default', settings_json: settingsJson });
        }
        localStorage.setItem('glowpro_appointment_settings', JSON.stringify(settingsJson));
        onClose();
    } catch(e) {
        console.error(e);
        onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 font-body">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="bg-slate-50 w-[550px] max-w-[95vw] h-[90vh] md:max-h-[85vh] rounded-2xl shadow-xl flex flex-col relative z-10 overflow-hidden">
        {/* Header */}
        <div className="bg-white flex items-center justify-between p-4 border-b border-slate-200 shrink-0">
          <h2 className="text-lg font-bold text-slate-800">{t('appointments.settings_title', 'Cài đặt lịch hẹn')}</h2>
          <div className="flex items-center gap-2">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors">
              <Maximize2 className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          
          {/* Time slot duration */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-1">{t('appointments.settings.timeslot_duration', 'Thời lượng khung giờ')}</h3>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">{t('appointments.settings.timeslot_desc', 'Điều chỉnh mức độ chi tiết của lịch. Thời lượng ngắn hơn giúp sắp xếp lịch chính xác hơn.')}</p>
            
            <div className="relative px-2 py-2 mt-2">
              {/* Custom Track Background */}
              <div className="absolute top-4 left-3 right-3 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                {/* White vertical ticks/separators */}
                <div className="absolute inset-0 flex justify-between pointer-events-none">
                  {['5', '10', '15', '30', '60'].map((val, idx) => (
                    <div key={val} className={`w-0.5 h-full bg-white z-10 ${idx === 0 || idx === 4 ? 'opacity-0' : 'opacity-100'}`}></div>
                  ))}
                </div>
              </div>
              
              {/* Custom Track Fill */}
              <div className="absolute top-4 left-3 h-1.5 bg-blue-600 rounded-full transition-all" 
                style={{ width: `calc(${['5', '10', '15', '30', '60'].indexOf(settings.timeSlotDuration) * 25}% - ${['5', '10', '15', '30', '60'].indexOf(settings.timeSlotDuration) * 1.5}px)` }}>
              </div>

              {/* Custom Thumb */}
              <div className="absolute top-[11px] w-[18px] h-[18px] bg-white border-[2.5px] border-blue-600 rounded-full shadow-sm transition-all pointer-events-none z-10"
                   style={{ left: `calc(0.75rem + ${['5', '10', '15', '30', '60'].indexOf(settings.timeSlotDuration) * 25}% - ${['5', '10', '15', '30', '60'].indexOf(settings.timeSlotDuration) * 4.5}px)` }}>
              </div>

              {/* Invisible Range Input for Dragging and Clicking */}
              <input 
                type="range" 
                min="0" 
                max="4" 
                step="1" 
                value={['5', '10', '15', '30', '60'].indexOf(settings.timeSlotDuration)}
                onChange={(e) => {
                  const vals = ['5', '10', '15', '30', '60'];
                  setSettings({...settings, timeSlotDuration: vals[e.target.value]});
                }}
                className="absolute top-2 left-0 right-0 w-full h-8 opacity-0 cursor-pointer z-20 m-0"
              />

              {/* Labels */}
              <div className="relative flex justify-between mt-8">
                {['5', '10', '15', '30', '60'].map((val, idx) => (
                  <span 
                    key={val} 
                    onClick={() => setSettings({...settings, timeSlotDuration: val})}
                    className={`text-xs cursor-pointer relative z-30 w-8 ${idx === 0 ? 'text-left pl-1' : idx === 4 ? 'text-right pr-1' : 'text-center'} ${settings.timeSlotDuration === val ? 'text-slate-800 font-semibold' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    {val}'
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Slot Limits */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800">{t('appointments.settings.limit_title', 'Giới hạn số lượng lịch hẹn')}</h3>
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className={`relative w-9 h-5 rounded-full transition-colors ${settings.enableDoubleBooking ? 'bg-blue-500' : 'bg-slate-200'}`}>
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${settings.enableDoubleBooking ? 'translate-x-4' : 'translate-x-0'} shadow-sm`}></div>
              </div>
              <span className="text-sm text-slate-700">{t('appointments.settings.limit_enable', 'Áp dụng giới hạn số lượng khách tối đa')}</span>
              <input type="checkbox" className="hidden" checked={settings.enableDoubleBooking} onChange={(e) => setSettings({...settings, enableDoubleBooking: e.target.checked})} />
            </label>

            <div className={`pl-12 transition-all duration-300 ${settings.enableDoubleBooking ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
              <div className="text-sm text-slate-500 mb-2">{t('appointments.settings.limit_default', 'Số lượng khách tối đa mặc định mỗi khung giờ')}</div>
              <div className="flex items-center border border-slate-200 rounded-lg w-48 overflow-hidden h-9 mb-6">
                <button onClick={() => setSettings({...settings, maxDoubleBookings: Math.max(1, settings.maxDoubleBookings - 1)})} className="w-10 h-full flex items-center justify-center bg-slate-50 hover:bg-slate-100 text-slate-500 transition-colors border-r border-slate-200 shrink-0">
                  -
                </button>
                <div className="flex-1 text-center text-sm font-medium">{settings.maxDoubleBookings}</div>
                <button onClick={() => setSettings({...settings, maxDoubleBookings: settings.maxDoubleBookings + 1})} className="w-10 h-full flex items-center justify-center bg-slate-50 hover:bg-slate-100 text-slate-500 transition-colors border-l border-slate-200 shrink-0">
                  +
                </button>
              </div>

              <div className="space-y-3">
                <div className="text-sm font-semibold text-slate-700">{t('appointments.settings.limit_custom', 'Cài đặt riêng cho từng khung giờ')}</div>
                <p className="text-xs text-slate-500">{t('appointments.settings.limit_custom_desc', 'Đặt giới hạn khác nhau cho các khoảng thời gian cụ thể trong ngày.')}</p>
                
                {settings.customSlotLimits?.length > 0 && (
                  <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100 bg-white mt-3">
                    {settings.customSlotLimits.map((limit, index) => (
                      <div key={limit.id} className="flex items-center p-2 gap-2 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-1.5 flex-1">
                          <div className="relative flex-1">
                            <select 
                              value={limit.startTime}
                              onChange={(e) => {
                                const newLimits = [...settings.customSlotLimits];
                                newLimits[index].startTime = e.target.value;
                                setSettings({...settings, customSlotLimits: newLimits});
                              }}
                              className="w-full h-7 pl-2 pr-6 border border-slate-200 rounded text-xs bg-white hover:border-slate-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 appearance-none cursor-pointer transition-colors"
                            >
                              {Array.from({length: 24}).map((_, i) => (
                                <option key={i} value={`${i.toString().padStart(2, '0')}:00`}>{`${i.toString().padStart(2, '0')}:00`}</option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                          </div>
                          <span className="text-xs text-slate-400 font-medium px-0.5">-</span>
                          <div className="relative flex-1">
                            <select 
                              value={limit.endTime}
                              onChange={(e) => {
                                const newLimits = [...settings.customSlotLimits];
                                newLimits[index].endTime = e.target.value;
                                setSettings({...settings, customSlotLimits: newLimits});
                              }}
                              className="w-full h-7 pl-2 pr-6 border border-slate-200 rounded text-xs bg-white hover:border-slate-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 appearance-none cursor-pointer transition-colors"
                            >
                              {Array.from({length: 24}).map((_, i) => (
                                <option key={i} value={`${i.toString().padStart(2, '0')}:00`}>{`${i.toString().padStart(2, '0')}:00`}</option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                          </div>
                        </div>
                        
                        <div className="flex items-center border border-slate-200 rounded bg-white overflow-hidden h-7 w-20 shrink-0 ml-1">
                          <button onClick={() => {
                            const newLimits = [...settings.customSlotLimits];
                            newLimits[index].limit = Math.max(1, newLimits[index].limit - 1);
                            setSettings({...settings, customSlotLimits: newLimits});
                          }} className="w-6 h-full flex items-center justify-center bg-slate-50 hover:bg-slate-100 text-slate-500 border-r border-slate-200 transition-colors">
                            -
                          </button>
                          <div className="flex-1 text-center text-xs font-semibold text-slate-700">{limit.limit}</div>
                          <button onClick={() => {
                            const newLimits = [...settings.customSlotLimits];
                            newLimits[index].limit = newLimits[index].limit + 1;
                            setSettings({...settings, customSlotLimits: newLimits});
                          }} className="w-6 h-full flex items-center justify-center bg-slate-50 hover:bg-slate-100 text-slate-500 border-l border-slate-200 transition-colors">
                            +
                          </button>
                        </div>

                        <button 
                          onClick={() => {
                            const newLimits = settings.customSlotLimits.filter(l => l.id !== limit.id);
                            setSettings({...settings, customSlotLimits: newLimits});
                          }}
                          className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors shrink-0 ml-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button 
                  onClick={() => {
                    const newLimit = {
                      id: Date.now().toString(),
                      startTime: '08:00',
                      endTime: '12:00',
                      limit: settings.maxDoubleBookings
                    };
                    setSettings({...settings, customSlotLimits: [...(settings.customSlotLimits || []), newLimit]});
                  }}
                  className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 py-2 px-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {t('appointments.settings.add_custom_slot', 'Thêm khung giờ tùy chỉnh')}
                </button>
              </div>
            </div>
          </div>

          {/* Staff Selection */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-4">{t('appointments.settings.require_staff', 'Yêu cầu chọn nhân viên')}</h3>
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className={`relative w-9 h-5 rounded-full transition-colors ${settings.requireStaffSelection ? 'bg-blue-500' : 'bg-slate-200'}`}>
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${settings.requireStaffSelection ? 'translate-x-4' : 'translate-x-0'} shadow-sm`}></div>
              </div>
              <span className="text-sm text-slate-700">{t('appointments.settings.require_staff_desc', "Bắt buộc 'Chọn nhân viên' cho mỗi lịch hẹn")}</span>
              <input type="checkbox" className="hidden" checked={settings.requireStaffSelection} onChange={(e) => setSettings({...settings, requireStaffSelection: e.target.checked})} />
            </label>
          </div>

          {/* No show */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800">{t('appointments.settings.noshow_title', 'Lịch hẹn không đến (No show)')}</h3>
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className={`relative w-9 h-5 rounded-full transition-colors shrink-0 mt-0.5 ${settings.autoNoShow ? 'bg-blue-500' : 'bg-slate-200'}`}>
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${settings.autoNoShow ? 'translate-x-4' : 'translate-x-0'} shadow-sm`}></div>
              </div>
              <span className="text-sm text-slate-700 leading-relaxed">{t('appointments.settings.noshow_desc', "Tự động đánh dấu lịch hẹn là 'Không đến' nếu chưa check-in sau một khoảng thời gian so với giờ bắt đầu")}</span>
              <input type="checkbox" className="hidden" checked={settings.autoNoShow} onChange={(e) => setSettings({...settings, autoNoShow: e.target.checked})} />
            </label>

            <div className={`pl-12 transition-opacity ${settings.autoNoShow ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
              <div className="text-sm text-slate-500 mb-2">{t('appointments.settings.noshow_wait', 'Thời gian chờ')}</div>
              <div className="relative">
                <select 
                  value={settings.noShowWaitTime}
                  onChange={(e) => setSettings({...settings, noShowWaitTime: e.target.value})}
                  className="w-full h-10 pl-3 pr-10 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors appearance-none cursor-pointer"
                >
                  <option value="5">5 {t('appointments.settings.minutes', 'phút')}</option>
                  <option value="10">10 {t('appointments.settings.minutes', 'phút')}</option>
                  <option value="15">15 {t('appointments.settings.minutes', 'phút')}</option>
                  <option value="30">30 {t('appointments.settings.minutes', 'phút')}</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
              
              <label className="flex items-center gap-2 mt-4 cursor-pointer">
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${settings.showNoShowPrompt ? 'bg-blue-500 border-blue-500' : 'border-slate-300 bg-white'}`}>
                  {settings.showNoShowPrompt && <Check className="w-3 h-3 text-white" />}
                </div>
                <span className="text-sm text-slate-600">{t('appointments.settings.noshow_confirm', 'Hiển thị thông báo xác nhận đánh dấu "Không đến"')}/</span>
                <input type="checkbox" className="hidden" checked={settings.showNoShowPrompt} onChange={(e) => setSettings({...settings, showNoShowPrompt: e.target.checked})} />
              </label>
            </div>
          </div>

          {/* Cancellation prompt */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800">{t('appointments.settings.cancel_title', 'Thông báo hủy lịch hẹn không đến')}</h3>
            
            <div>
              <div className="text-sm text-slate-500 mb-2">{t('appointments.settings.cancel_desc', 'Thời gian giữ lịch hẹn không đến trên lịch')}</div>
              <div className="relative">
                <select 
                  value={settings.noShowKeepTime}
                  onChange={(e) => setSettings({...settings, noShowKeepTime: e.target.value})}
                  className="w-full h-10 pl-3 pr-10 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors appearance-none cursor-pointer"
                >
                  <option value="15">15 {t('appointments.settings.minutes', 'phút')}</option>
                  <option value="30">30 {t('appointments.settings.minutes', 'phút')}</option>
                  <option value="60">60 {t('appointments.settings.minutes', 'phút')}</option>
                  <option value="120">120 {t('appointments.settings.minutes', 'phút')}</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <label className="flex items-center gap-2 mt-4 cursor-pointer">
              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${settings.showCancelPrompt ? 'bg-blue-500 border-blue-500' : 'border-slate-300 bg-white'}`}>
                {settings.showCancelPrompt && <Check className="w-3 h-3 text-white" />}
              </div>
              <span className="text-sm text-slate-600">{t('appointments.settings.cancel_confirm', 'Hiển thị thông báo hủy lịch hẹn không đến')}</span>
              <input type="checkbox" className="hidden" checked={settings.showCancelPrompt} onChange={(e) => setSettings({...settings, showCancelPrompt: e.target.checked})} />
            </label>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="bg-white border-t border-slate-200 p-4 flex items-center gap-3 shrink-0">
          <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors">
            {t('common.cancel', 'Hủy')}
          </button>
          <button onClick={handleSave} className="flex-1 h-10 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors shadow-sm">
            {t('common.save', 'Lưu')}
          </button>
        </div>

      </div>
    </div>
  );
}
