'use client';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Sparkles, Check, CheckCircle2, RotateCcw,
  Building, Palette, ChevronDown, SunMoon, Moon, Sun, Monitor
} from 'lucide-react';
import { useBranch } from '@/lib/BranchContext';
import { 
  APPEARANCE_MODES, SEASONAL_THEMES, COUNTRY_THEMES, BUSINESS_THEMES 
} from '@/lib/uiThemes.js';
import { 
  getUIPreferences, saveUIPreferences, resetUIPreferences, 
  applyThemeToDom, DEFAULT_AVAILABLE_WIDGETS 
} from '@/lib/uiPreferences.js';
import { toast } from '@/components/Layout';
import { useT } from '@/lib/i18n';

// Danh sách các hiệu ứng hạt rơi lễ hội, may mắn & tài lộc
export const PARTICLE_PRESETS = [
  { id: 'gold_bars', label: 'Vàng Thỏi', icon: '🪙', emoji: '🪙,💰,✨', desc: 'Vàng thỏi kim bảo & tài lộc dồi dào' },
  { id: 'us_dollar', label: 'Tiền Đô ($)', icon: '💵', emoji: '💵,💲,🤑', desc: 'Đô la Mỹ may mắn & vượng phát' },
  { id: 'money_fall', label: 'Tiền Rơi', icon: '💸', emoji: '💸,💵,🧧', desc: 'Tiền bay phát tài phát lộc' },
  { id: 'lucky_cat', label: 'Mèo Chiêu Tài', icon: '🐱', emoji: '🐱,🏮,🐾', desc: 'Mèo Maneki-neko đón khách & tài lộc' },
  { id: 'fortune', label: 'May Mắn', icon: '🍀', emoji: '🍀,🧧,✨', desc: 'Cỏ 4 lá & Lì xì may mắn' },
  { id: 'diamond', label: 'Kim Cương', icon: '💎', emoji: '💎,✨,💍', desc: 'Kim cương lấp lánh sang trọng' },
  { id: 'tet_mai', label: 'Hoa Mai Tết', icon: '🌸', emoji: '🌸,🧧,✨', desc: 'Hoa mai vàng ngày Tết truyền thống' },
  { id: 'noel_snow', label: 'Tuyết Noel', icon: '❄️', emoji: '❄️,⛄,✨', desc: 'Tuyết rơi mùa Giáng Sinh' },
  { id: 'halloween', label: 'Bí Ngô', icon: '🎃', emoji: '🎃,🦇,✨', desc: 'Bí ngô ma mị Halloween' },
];

/**
 * Công tắc iOS Toggle Switch hiện đại chuẩn Apple UI
 */
function IosToggle({ id, checked, onChange, tintColor, ariaLabel }) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500/20 ${
        checked ? '' : 'bg-slate-300 dark:bg-slate-700'
      }`}
      style={checked ? { backgroundColor: tintColor || '#059669' } : undefined}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

/**
 * Dropdown chọn hiệu ứng hạt rơi với icon ChevronDown mượt mà và danh sách luôn hiển thị XUỐNG DƯỚI (Downward)
 */
function ParticleEffectDropdown({ activePreset, onSelect, presets = PARTICLE_PRESETS }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('pointerdown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className={`relative w-full ${isOpen ? 'z-40' : 'z-10'}`} ref={dropdownRef}>
      {/* Nút bấm kích hoạt Dropdown */}
      <button
        type="button"
        id="particle-effect-dropdown-trigger"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer bg-white dark:bg-slate-800 border ${
          isOpen
            ? 'border-emerald-500 ring-2 ring-emerald-500/20 text-slate-900 dark:text-white shadow-xs'
            : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600 shadow-2xs'
        }`}
      >
        <div className="flex items-center gap-2 truncate min-w-0">
          <span className="text-base shrink-0 leading-none">{activePreset.icon}</span>
          <span className="truncate">{activePreset.label}</span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 dark:text-slate-400 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-emerald-600 dark:text-emerald-400' : ''
          }`}
        />
      </button>

      {/* Danh sách Dropdown - ÉP BUỘC HIỂN THỊ XUỐNG DƯỚI (top-full mt-1.5) */}
      {isOpen && (
        <div
          role="listbox"
          aria-label="Danh sách hiệu ứng hạt rơi"
          className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-700 shadow-2xl py-1.5 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150 scrollbar-thin"
          style={{ minWidth: '220px' }}
        >
          <div className="px-3 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 mb-1 flex items-center justify-between">
            <span>Chọn hiệu ứng hạt</span>
            <span className="text-[9px] font-normal lowercase">{presets.length} loại</span>
          </div>
          {presets.map((p) => {
            const isSelected = activePreset.id === p.id;
            return (
              <button
                key={p.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onSelect(p);
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-2 text-left flex items-center justify-between text-xs transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <span className="text-base shrink-0 leading-none">{p.icon}</span>
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{p.label}</div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-400 font-normal truncate">
                      {p.desc}
                    </div>
                  </div>
                </div>
                {isSelected && (
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 ml-1.5" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AppearanceWidgetsTab() {
  const { t } = useT();
  const { currentBranchId, currentBranch } = useBranch();
  const branchCountry = currentBranch?.country || 'Vietnam';

  // State cấu hình
  const [config, setConfig] = useState(() => getUIPreferences(currentBranchId, branchCountry));
  const [activeCategory, setActiveCategory] = useState('seasonal'); // 'seasonal' | 'country' | 'business'
  const [saving, setSaving] = useState(false);

  // Hiệu ứng hạt rơi đang kích hoạt
  const activeParticlePreset = useMemo(() => {
    const currentEmoji = config?.theme?.particleEmoji || '';
    return PARTICLE_PRESETS.find(p => p.emoji === currentEmoji) ||
      PARTICLE_PRESETS.find(p => currentEmoji && (p.emoji.includes(currentEmoji) || currentEmoji.includes(p.icon))) ||
      PARTICLE_PRESETS[0];
  }, [config?.theme?.particleEmoji]);

  // Khi người dùng chuyển chi nhánh, tải lại cấu hình của chi nhánh đó
  useEffect(() => {
    const loaded = getUIPreferences(currentBranchId, branchCountry);
    setConfig(loaded);
  }, [currentBranchId, branchCountry]);

  // Danh sách chủ đề hiển thị theo Tab danh mục
  const currentCategoryThemes = useMemo(() => {
    if (activeCategory === 'seasonal') return SEASONAL_THEMES;
    if (activeCategory === 'country') return COUNTRY_THEMES;
    return BUSINESS_THEMES;
  }, [activeCategory]);

  // Xử lý 1-Chạm Chọn Chủ Đề Mới
  const handleSelectTheme = (theme) => {
    const updated = {
      ...config,
      activeThemeId: theme.id,
      theme: {
        ...config.theme,
        tintColor: theme.tintColor,
        secondaryColor: theme.secondaryColor,
        gradientCss: theme.gradient,
        pageBg: theme.pageBg,
        appearanceMode: theme.isDark ? 'dark' : 'light',
        enableHolidayParticles: !!theme.particleEffect,
        particleEmoji: theme.particleEmoji || ''
      },
      dashboard: {
        ...config.dashboard,
        widgets: theme.suggestedWidgets.map((sw, index) => {
          const found = DEFAULT_AVAILABLE_WIDGETS.find(w => w.id === sw.id);
          return {
            id: sw.id,
            title: found ? found.title : sw.id,
            size: sw.size || 'small',
            enabled: sw.enabled !== false,
            order: sw.order || (index + 1)
          };
        })
      }
    };
    setConfig(updated);
    // Tự động lưu ngay lập tức vào bộ nhớ vĩnh viễn và áp dụng tức thì
    saveUIPreferences(updated, currentBranchId);
    applyThemeToDom(updated);
    toast.success(t('settings.theme_applied_saved', `Đã lưu và áp dụng giao diện: ${theme.name}`));
  };

  // Lưu cấu hình chính thức
  const handleSave = () => {
    setSaving(true);
    try {
      saveUIPreferences(config, currentBranchId);
      toast.success(t('settings.ui_preferences_saved', 'Đã lưu và đồng bộ cấu hình giao diện thành công!'), {
        description: config.applyScope === 'global_chain' 
          ? 'Áp dụng cho toàn bộ chuỗi chi nhánh'
          : `Áp dụng riêng cho chi nhánh: ${currentBranch?.name || 'Hiện tại'}`
      });
    } catch {
      toast.error('Lỗi khi lưu cấu hình');
    } finally {
      setSaving(false);
    }
  };

  // Khôi phục mặc định
  const handleReset = () => {
    try {
      const def = resetUIPreferences(currentBranchId, branchCountry);
      if (def) {
        setConfig(def);
        toast.success(t('settings.ui_preferences_reset', 'Đã khôi phục giao diện về mặc định chuẩn gốc GloPro!'));
      }
    } catch {
      toast.error('Lỗi khi khôi phục giao diện mặc định');
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans animate-in fade-in duration-300">
      
      {/* 1. THANH PHẠM VI ÁP DỤNG THEO CHI NHÁNH (SCOPE BAR) */}
      <div className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-md rounded-3xl p-4 md:p-5 border border-slate-200/50 dark:border-slate-800/60 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: `${config.theme?.tintColor || '#059669'}15`, color: config.theme?.tintColor || '#059669' }}>
            <Building className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-800 dark:text-white text-sm md:text-base">
                Phạm Vi Áp Dụng Cấu Hình
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                {currentBranch?.name || 'Tất cả chi nhánh'} ({branchCountry === 'Vietnam' ? '🇻🇳 Việt Nam' : branchCountry})
              </span>
            </div>
            <p className="text-slate-500 dark:text-slate-300 text-xs mt-0.5">
              Tùy chọn áp dụng chủ đề riêng biệt cho cơ sở này hoặc đồng bộ trên toàn chuỗi.
            </p>
          </div>
        </div>

        {/* Radio chọn phạm vi */}
        <div className="flex items-center gap-2 bg-slate-100/80 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setConfig({ ...config, applyScope: 'branch_only' })}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              config.applyScope === 'branch_only'
                ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            Chỉ chi nhánh này
          </button>
          <button
            type="button"
            onClick={() => setConfig({ ...config, applyScope: 'global_chain' })}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              config.applyScope === 'global_chain'
                ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            Toàn bộ chuỗi salon
          </button>
        </div>
      </div>

      {/* 1. MỤC CHẾ ĐỘ HIỂN THỊ (APPEARANCE MODES) */}
      <div className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-md rounded-3xl p-5 md:p-6 border border-slate-200/50 dark:border-slate-800/60 shadow-xs space-y-5 transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <SunMoon className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              <h2 className="text-lg md:text-xl font-bold text-slate-800 dark:text-white tracking-tight">
                Chế độ
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200/70 dark:border-cyan-800">
                Giao diện nền tảng
              </span>
            </div>
            <p className="text-slate-500 dark:text-slate-300 text-xs md:text-sm mt-1">
              Lựa chọn giữa giao diện Sáng chuẩn mặc định, Hồng thời thượng hoặc Chế độ Tối (Dark Mode Pro) chuyên nghiệp với hình nền studio công nghệ cao.
            </p>
          </div>
        </div>

        {/* Lưới 3 thẻ Chế độ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {APPEARANCE_MODES.map((mode) => {
            const isSelected = config.activeThemeId === mode.id;

            return (
              <div
                key={mode.id}
                onClick={() => handleSelectTheme(mode)}
                className={`group relative rounded-3xl p-4 md:p-5 cursor-pointer border transition-all duration-300 overflow-hidden flex flex-col justify-between backdrop-blur-md ${
                  isSelected
                    ? 'border-2 shadow-xl ring-4 ring-cyan-500/20 scale-[1.01] bg-white/95 dark:bg-slate-800/95'
                    : 'border-slate-200/80 dark:border-slate-800/90 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md bg-white/85 dark:bg-slate-900/85'
                }`}
                style={{
                  borderColor: isSelected ? mode.tintColor : undefined,
                }}
              >
                {/* Banner xem trước chế độ */}
                {mode.bgImage ? (
                  <div className="h-28 w-full rounded-2xl mb-3.5 overflow-hidden relative shadow-xs border border-slate-100 dark:border-slate-800 group-hover:shadow-md transition-all">
                    <img 
                      src={mode.bgImage} 
                      alt={mode.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                    {mode.isDark ? (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent pointer-events-none" />
                        <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/80 backdrop-blur-md border border-cyan-500/40 text-cyan-300 text-[10px] font-bold">
                          <Moon className="w-3.5 h-3.5" /> Minimalist Dark Wallpaper
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-t from-rose-950/30 via-transparent to-transparent pointer-events-none" />
                        <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border border-rose-200/80 dark:border-rose-900/80 text-rose-600 dark:text-rose-400 text-[10px] font-bold shadow-xs">
                          <span>🌸</span> Minimalist Rose Wallpaper
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div 
                    className="h-28 w-full rounded-2xl mb-3.5 overflow-hidden relative shadow-xs border border-slate-100 dark:border-slate-800 flex items-center justify-center p-3 transition-all group-hover:shadow-md"
                    style={{ background: mode.pageBg || mode.gradient }}
                  >
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 dark:bg-slate-800/90 shadow-xs border border-slate-200/60 dark:border-slate-700">
                      <span className="text-base">{mode.icon}</span>
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">{mode.badgeText}</span>
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl p-1.5 rounded-2xl bg-white dark:bg-slate-800 shadow-xs border border-slate-100 dark:border-slate-700 flex items-center justify-center">
                        {mode.icon}
                      </span>
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-white text-sm md:text-base leading-tight">
                          {mode.name}
                        </h4>
                        <span className="text-[11px] text-slate-400 dark:text-slate-300 font-medium">
                          {mode.nameEn}
                        </span>
                      </div>
                    </div>

                    {/* Huy hiệu đang dùng */}
                    {isSelected && (
                      <span 
                        className="flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-full text-white shadow-xs animate-in zoom-in-75 duration-200 shrink-0"
                        style={{ background: mode.tintColor }}
                      >
                        <Check className="w-3 h-3" /> Đang Dùng
                      </span>
                    )}
                  </div>

                  <p className="text-slate-600 dark:text-slate-200 text-xs mt-2 leading-relaxed">
                    {mode.description}
                  </p>
                </div>

                {/* Footer của card: Badges & Nút chọn */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span 
                      className="text-[10px] font-bold px-2 py-0.5 rounded-lg text-slate-600 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80"
                    >
                      {mode.badgeText}
                    </span>
                    {mode.isDark && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                        Chế độ tối
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${
                      isSelected
                        ? 'text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                    style={isSelected ? { background: mode.tintColor } : undefined}
                  >
                    {isSelected ? 'Đã Chọn' : 'Áp Dụng'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. BỘ SƯU TẬP CHỦ ĐỀ CÓ SẴN (THEME GALLERY) */}
      <div className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-md rounded-3xl p-5 md:p-6 border border-slate-200/50 dark:border-slate-800/60 shadow-xs space-y-5 transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg md:text-xl font-bold text-slate-800 dark:text-white tracking-tight">
                Chủ đề
              </h2>
            </div>
            <p className="text-slate-500 dark:text-slate-300 text-xs md:text-sm mt-1">
              Nhấp 1-chạm vào chủ đề để tự động áp dụng màu sắc, hiệu ứng kính mờ và bố cục widget tối ưu nhất.
            </p>
          </div>

          {/* Tab danh mục chủ đề */}
          <div className="flex items-center gap-1.5 bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-2xl overflow-x-auto no-scrollbar border border-slate-200/40 dark:border-slate-700/60">
            <button
              type="button"
              onClick={() => setActiveCategory('seasonal')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeCategory === 'seasonal'
                  ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <span>🏮</span> Sự Kiện & Lễ Hội ({SEASONAL_THEMES.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory('country')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeCategory === 'country'
                  ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <span>🌏</span> Bản Sắc Quốc Gia ({COUNTRY_THEMES.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory('business')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeCategory === 'business'
                  ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <span>💇</span> Mô Hình Tiệm ({BUSINESS_THEMES.length})
            </button>
          </div>
        </div>

        {/* Lưới các thẻ chủ đề (Theme Cards Grid) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentCategoryThemes.map((theme) => {
            const isSelected = config.activeThemeId === theme.id;
            const isRecommended = (theme.country === 'Vietnam' && branchCountry === 'Vietnam') ||
                                  (theme.country === 'United States' && branchCountry === 'United States') ||
                                  (theme.country === 'Japan' && branchCountry === 'Japan');

            return (
              <div
                key={theme.id}
                onClick={() => handleSelectTheme(theme)}
                className={`group relative rounded-3xl p-4 md:p-5 cursor-pointer border transition-all duration-300 overflow-hidden flex flex-col justify-between backdrop-blur-md ${
                  isSelected
                    ? 'border-2 shadow-xl ring-4 ring-pink-500/20 scale-[1.01] bg-white/95 dark:bg-slate-800/95'
                    : 'border-slate-200/80 dark:border-slate-800/90 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md bg-white/85 dark:bg-slate-900/85'
                }`}
                style={{
                  borderColor: isSelected ? theme.tintColor : undefined,
                }}
              >
                {/* Banner hình ảnh minh họa chủ đề */}
                {theme.bgImage ? (
                  <div className="h-24 w-full rounded-2xl mb-3.5 overflow-hidden relative shadow-xs border border-slate-100 dark:border-slate-800 group-hover:shadow-md transition-all">
                    <img 
                      src={theme.bgImage} 
                      alt={theme.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                  </div>
                ) : (
                  <div 
                    className="h-24 w-full rounded-2xl mb-3.5 overflow-hidden relative shadow-xs border border-slate-100 dark:border-slate-800 flex items-center justify-center p-3 transition-all group-hover:shadow-md"
                    style={{ background: theme.pageBg || theme.gradient }}
                  >
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 dark:bg-slate-800/90 shadow-xs border border-pink-200/50 dark:border-slate-700">
                      <span className="text-base">{theme.icon || '🌸'}</span>
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">{theme.badgeText || 'Mặc định'}</span>
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl p-1.5 rounded-2xl bg-white dark:bg-slate-800 shadow-xs border border-slate-100 dark:border-slate-700 flex items-center justify-center">
                        {theme.icon}
                      </span>
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-white text-sm md:text-base leading-tight">
                          {theme.name}
                        </h4>
                        <span className="text-[11px] text-slate-400 dark:text-slate-300 font-medium">
                          {theme.nameEn}
                        </span>
                      </div>
                    </div>

                    {/* Huy hiệu đang dùng */}
                    {isSelected && (
                      <span 
                        className="flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-full text-white shadow-xs animate-in zoom-in-75 duration-200"
                        style={{ background: theme.tintColor }}
                      >
                        <Check className="w-3 h-3" /> Đang Dùng
                      </span>
                    )}
                  </div>

                  <p className="text-slate-600 dark:text-slate-200 text-xs mt-2 leading-relaxed">
                    {theme.description}
                  </p>
                </div>

                {/* Footer của card: Badges & Nút chọn */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span 
                      className="text-[10px] font-bold px-2 py-0.5 rounded-lg text-slate-600 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80"
                    >
                      {theme.badgeText}
                    </span>
                    {isRecommended && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-800">
                        🇻🇳 Ưu tiên VN
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${
                      isSelected
                        ? 'text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                    style={isSelected ? { background: theme.tintColor } : undefined}
                  >
                    {isSelected ? 'Đã Chọn' : 'Áp Dụng'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. HIỆU ỨNG */}
      <div className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-md rounded-3xl p-5 md:p-6 border border-slate-200/50 dark:border-slate-800/60 shadow-xs space-y-5 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            <h2 className="text-lg md:text-xl font-bold text-slate-800 dark:text-white tracking-tight">
              Hiệu ứng
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800">
              Kính mờ & Chuyển động
            </span>
          </div>
          {config.theme.enableHolidayParticles && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 animate-pulse">
              <span>{activeParticlePreset.icon}</span>
              <span>Đang rơi: {activeParticlePreset.label}</span>
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Kính mờ Glassmorphism */}
          <div className="bg-slate-50 dark:bg-slate-800/70 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/60 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-xs text-slate-700 dark:text-slate-100">Kính Mờ Liquid Glass</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-300">Hiệu ứng xuyên thấu iOS</div>
              </div>
              <IosToggle
                id="toggle-glass"
                checked={config.theme.enableGlassmorphism !== false}
                tintColor={config.theme?.tintColor}
                ariaLabel="Bật hoặc tắt hiệu ứng kính mờ"
                onChange={(checked) => {
                  const updated = {
                    ...config,
                    theme: { ...config.theme, enableGlassmorphism: checked }
                  };
                  setConfig(updated);
                  applyThemeToDom(updated);
                }}
              />
            </div>
            
            {/* Độ mờ */}
            <div className="flex items-center gap-1.5 pt-1">
              {['subtle', 'medium', 'high'].map((level) => (
                <button
                  key={level}
                  type="button"
                  disabled={config.theme.enableGlassmorphism === false}
                  onClick={() => {
                    const updated = {
                      ...config,
                      theme: { ...config.theme, glassIntensity: level }
                    };
                    setConfig(updated);
                    applyThemeToDom(updated);
                  }}
                  className={`flex-1 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    config.theme.enableGlassmorphism === false
                      ? 'opacity-40 cursor-not-allowed text-slate-400'
                      : config.theme.glassIntensity === level
                      ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-xs border border-slate-200 dark:border-slate-600'
                      : 'text-slate-500 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  {level === 'subtle' ? '12px' : level === 'medium' ? '20px' : '28px'}
                </button>
              ))}
            </div>
          </div>

          {/* Card 2: Hạt Rơi May Mắn & Tài Lộc */}
          <div className="bg-slate-50 dark:bg-slate-800/70 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/60 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-xs text-slate-700 dark:text-slate-100 flex items-center gap-1.5">
                  <span>Hạt Rơi Tài Lộc</span>
                  {config.theme.enableHolidayParticles && (
                    <span className="text-sm">{activeParticlePreset.icon}</span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-300">
                  {config.theme.enableHolidayParticles ? activeParticlePreset.label : 'Tiền rơi, vàng, mèo tài...'}
                </div>
              </div>
              <IosToggle
                id="toggle-particles"
                checked={!!config.theme.enableHolidayParticles}
                tintColor={config.theme?.tintColor}
                ariaLabel="Bật hoặc tắt hiệu ứng hạt rơi"
                onChange={(checked) => {
                  const fallbackEmoji = config.theme.particleEmoji || activeParticlePreset.emoji;
                  const updated = {
                    ...config,
                    theme: { 
                      ...config.theme, 
                      enableHolidayParticles: checked,
                      particleEmoji: fallbackEmoji
                    }
                  };
                  setConfig(updated);
                  applyThemeToDom(updated);
                }}
              />
            </div>

            {config.theme.enableHolidayParticles ? (
              <div className="space-y-2 pt-0.5">
                <ParticleEffectDropdown
                  activePreset={activeParticlePreset}
                  onSelect={(selected) => {
                    const updated = {
                      ...config,
                      theme: { 
                        ...config.theme, 
                        enableHolidayParticles: true, 
                        particleEmoji: selected.emoji 
                      }
                    };
                    setConfig(updated);
                    applyThemeToDom(updated);
                  }}
                />

                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                  {PARTICLE_PRESETS.map((p) => {
                    const isSelected = activeParticlePreset.id === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        title={p.desc}
                        onClick={() => {
                          const updated = {
                            ...config,
                            theme: { 
                              ...config.theme, 
                              enableHolidayParticles: true, 
                              particleEmoji: p.emoji 
                            }
                          };
                          setConfig(updated);
                          applyThemeToDom(updated);
                        }}
                        className={`shrink-0 px-2 py-0.5 rounded-lg text-[10px] font-medium flex items-center gap-1 transition-all ${
                          isSelected
                            ? 'bg-emerald-600 text-white font-bold shadow-xs'
                            : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                        }`}
                      >
                        <span>{p.icon}</span>
                        <span>{p.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-[11px] text-slate-400 dark:text-slate-500 italic py-1">
                Bật toggle để kích hoạt hạt bay may mắn & thịnh vượng
              </div>
            )}
          </div>

          {/* Card 3: Mật Độ Giao Diện */}
          <div className="bg-slate-50 dark:bg-slate-800/70 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/60 flex flex-col justify-between space-y-3">
            <div>
              <div className="font-bold text-xs text-slate-700 dark:text-slate-100">Mật Độ Hiển Thị</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-300">Khoảng cách & khoảng đệm</div>
            </div>
            <div className="flex items-center gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setConfig({ ...config, theme: { ...config.theme, layoutDensity: 'comfortable' } })}
                className={`flex-1 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  config.theme.layoutDensity !== 'compact'
                    ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-xs border border-slate-200 dark:border-slate-600'
                    : 'text-slate-500 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                Tiêu chuẩn
              </button>
              <button
                type="button"
                onClick={() => setConfig({ ...config, theme: { ...config.theme, layoutDensity: 'compact' } })}
                className={`flex-1 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  config.theme.layoutDensity === 'compact'
                    ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-xs border border-slate-200 dark:border-slate-600'
                    : 'text-slate-500 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                Gọn POS
              </button>
            </div>
          </div>

          {/* Card 4: Màu Tint Chủ Đạo Tùy Chọn */}
          <div className="bg-slate-50 dark:bg-slate-800/70 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/60 flex flex-col justify-between space-y-3">
            <div>
              <div className="font-bold text-xs text-slate-700 dark:text-slate-100">Mã Màu Tint HEX</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-300">Tùy biến mã màu riêng</div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="color"
                value={config.theme.tintColor || '#059669'}
                onChange={(e) => {
                  const newTint = e.target.value;
                  const isDark = config.theme.appearanceMode === 'dark';
                  const customPageBg = `radial-gradient(circle at 15% 15%, ${newTint}1f 0%, transparent 45%), radial-gradient(circle at 85% 20%, ${config.theme.secondaryColor || newTint}17 0%, transparent 40%), ${isDark ? '#0A0A0F' : '#F8FAFC'}`;
                  const updated = {
                    ...config,
                    theme: { 
                      ...config.theme, 
                      tintColor: newTint,
                      pageBg: customPageBg
                    }
                  };
                  setConfig(updated);
                  applyThemeToDom(updated);
                }}
                className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0 bg-transparent"
              />
              <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-200 uppercase">
                {config.theme.tintColor || '#059669'}
              </span>
            </div>
          </div>

        </div>

        {/* Thanh chọn nhanh hiệu ứng hạt rơi khi bật toggle */}
        {config.theme.enableHolidayParticles && (
          <div className="p-4 bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-indigo-500/10 dark:from-amber-950/30 dark:via-emerald-950/30 dark:to-indigo-950/30 rounded-2xl border border-amber-200/50 dark:border-amber-700/30 flex flex-col md:flex-row md:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl animate-bounce shrink-0">{activeParticlePreset.icon}</span>
              <div>
                <div className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <span>Hiệu ứng hạt bay:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{activeParticlePreset.label}</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-300">
                  {activeParticlePreset.desc} • Emoji ({activeParticlePreset.emoji})
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {PARTICLE_PRESETS.map((p) => {
                const isSelected = activeParticlePreset.id === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    title={p.desc}
                    onClick={() => {
                      const updated = {
                        ...config,
                        theme: { 
                          ...config.theme, 
                          enableHolidayParticles: true, 
                          particleEmoji: p.emoji 
                        }
                      };
                      setConfig(updated);
                      applyThemeToDom(updated);
                    }}
                    className={`px-2.5 py-1 rounded-xl text-xs flex items-center gap-1.5 transition-all active:scale-95 ${
                      isSelected
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold shadow-md scale-105'
                        : 'bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>{p.icon}</span>
                    <span>{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 4. THANH THAO TÁC CUỐI TRANG (BOTTOM ACTIONS) */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-3xl p-4 md:p-5 border border-slate-200/50 dark:border-slate-800/60 shadow-md flex items-center justify-between gap-3 sticky bottom-4 z-20 transition-colors">
        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 bg-white/50 dark:bg-slate-800/50 font-bold text-xs transition-all active:scale-95"
        >
          <RotateCcw className="w-4 h-4" /> Khôi phục mặc định
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2.5 rounded-2xl text-white font-bold text-xs md:text-sm shadow-md transition-all active:scale-95 hover:opacity-95 disabled:opacity-50"
            style={{ background: config.theme?.tintColor || '#059669' }}
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" /> Lưu & Đồng Bộ Giao Diện
              </>
            )}
          </button>
        </div>
      </div>

    </div>
  );
}
