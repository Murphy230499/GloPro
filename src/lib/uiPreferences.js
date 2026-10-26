/**
 * GloPro UI Preferences & State Manager
 * 
 * Manages:
 * - Reading & Saving theme & widget configurations
 * - Branch-scoped theming (branch-specific vs global chain)
 * - Applying CSS custom variables (--theme-color, --primary in HSL, etc.)
 * - Dispatching real-time update events without requiring page reload
 */

import { getThemeById, ALL_THEMES, getSuggestedThemesForCountry } from './uiThemes.js';

export const STORAGE_PREFIX = 'glopro_ui_pref_';
export const GLOBAL_STORAGE_KEY = 'glopro_ui_pref_global';

export const DEFAULT_AVAILABLE_WIDGETS = [
  { id: 'kpi_revenue', title: 'Doanh thu hôm nay', defaultSize: 'small' },
  { id: 'kpi_appts', title: 'Lịch hẹn hôm nay', defaultSize: 'small' },
  { id: 'kpi_customers', title: 'Khách hàng toàn chuỗi', defaultSize: 'small' },
  { id: 'kpi_staff', title: 'Nhân viên ca trực', defaultSize: 'small' },
  { id: 'upcoming_queue', title: 'Hàng chờ lịch hẹn sắp tới', defaultSize: 'medium' },
  { id: 'revenue_chart', title: 'Biểu đồ doanh thu 7 ngày', defaultSize: 'medium' },
  { id: 'room_occupancy', title: 'Sơ đồ công suất Giường & Phòng', defaultSize: 'medium' },
  { id: 'social_chat_alert', title: 'Hộp thư MXH & Khách tiềm năng', defaultSize: 'medium' },
  { id: 'top_rankings', title: 'Bảng xếp hạng Top Doanh thu', defaultSize: 'large' },
];

/**
 * Chuyển mã màu HEX sang chuẩn HSL (H S% L%) để cấp cho biến --primary của Tailwind
 */
export function hexToHsl(hex) {
  if (!hex || typeof hex !== 'string') return '340 100% 62%';
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  if (c.length !== 6) return '340 100% 62%';

  const r = parseInt(c.substring(0, 2), 16) / 255;
  const g = parseInt(c.substring(2, 4), 16) / 255;
  const b = parseInt(c.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/**
 * Chuyển mã màu HEX sang RGB (r, g, b) cho các lớp phủ alpha
 */
export function hexToRgb(hex) {
  if (!hex || typeof hex !== 'string') return '255, 59, 122';
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  if (c.length !== 6) return '255, 59, 122';
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

/**
 * Khởi tạo cấu hình mặc định dựa trên một chủ đề cụ thể
 */
export function createDefaultConfig(themeId = 'default_classic', branchCountry = 'Vietnam') {
  const theme = getThemeById(themeId);
  return {
    version: '2.2-multinational-glass',
    activeThemeId: theme.id,
    applyScope: 'branch_only', // 'branch_only' | 'global_chain'
    lastUpdated: new Date().toISOString(),
    theme: {
      tintColor: theme.tintColor,
      secondaryColor: theme.secondaryColor,
      gradientCss: theme.gradient,
      pageBg: theme.pageBg,
      glassIntensity: 'medium', // 'subtle' (12px) | 'medium' (20px) | 'high' (30px)
      appearanceMode: theme.isDark ? 'dark' : 'light',
      layoutDensity: 'comfortable', // 'comfortable' | 'compact'
      enableGlassmorphism: true,
      enableHolidayParticles: !!theme.particleEffect,
      particleEmoji: theme.particleEmoji || ''
    },
    dashboard: {
      gridColumns: 4,
      defaultPeriod: 'day',
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
}

/**
 * Lấy cấu hình UI cho chi nhánh hiện tại (hỗ trợ phân cấp chi nhánh & global)
 */
export function getUIPreferences(branchId = 'all', branchCountry = 'Vietnam') {
  if (typeof window === 'undefined') {
    return createDefaultConfig('default_classic', branchCountry);
  }

  try {
    // 1. Kiểm tra cấu hình riêng của chi nhánh hiện tại
    if (branchId && branchId !== 'all') {
      const branchKey = `${STORAGE_PREFIX}${branchId}`;
      const branchStored = localStorage.getItem(branchKey);
      if (branchStored) {
        try {
          const parsed = JSON.parse(branchStored);
          if (parsed && parsed.version) return parsed;
        } catch (_) {}
      }
    }

    // 2. Kiểm tra cấu hình chung toàn chuỗi
    const globalStored = localStorage.getItem(GLOBAL_STORAGE_KEY);
    if (globalStored) {
      try {
        const parsed = JSON.parse(globalStored);
        if (parsed && parsed.version) return parsed;
      } catch (_) {}
    }

    // 3. Kiểm tra bất kỳ cấu hình chi nhánh nào đã lưu trước đó nếu đang ở 'all' hoặc chưa có global
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(STORAGE_PREFIX)) {
        try {
          const val = localStorage.getItem(k);
          if (val) {
            const parsed = JSON.parse(val);
            if (parsed && parsed.version && parsed.theme?.tintColor) return parsed;
          }
        } catch (_) {}
      }
    }

    // 4. Kiểm tra mã active theme ID đã lưu
    const savedThemeId = localStorage.getItem('gp_active_theme_id');
    if (savedThemeId) {
      const found = ALL_THEMES.find(t => t.id === savedThemeId);
      if (found) {
        return createDefaultConfig(found.id, branchCountry);
      }
    }

    // 5. Kiểm tra cấu hình legacy gp_theme nếu có
    const legacyTheme = localStorage.getItem('gp_theme');
    if (legacyTheme) {
      const found = ALL_THEMES.find(t => t.tintColor.toLowerCase() === legacyTheme.toLowerCase());
      if (found) {
        return createDefaultConfig(found.id, branchCountry);
      }
    }
  } catch (err) {
    console.warn('[uiPreferences] Error reading preferences from localStorage:', err);
  }

  // 6. Mặc định chuẩn của hệ thống GloPro (Slate-50 & Emerald)
  return createDefaultConfig('default_classic', branchCountry);
}

/**
 * Lưu cấu hình UI (hỗ trợ ghi cho riêng chi nhánh hoặc toàn chuỗi)
 */
export function saveUIPreferences(config, branchId = 'all') {
  if (typeof window === 'undefined' || !config) return;

  try {
    const updated = {
      ...config,
      lastUpdated: new Date().toISOString()
    };
    const json = JSON.stringify(updated);

    // Luôn lưu vào GLOBAL_STORAGE_KEY để làm fallback chắc chắn không bao giờ bị mất giao diện
    localStorage.setItem(GLOBAL_STORAGE_KEY, json);

    // Lưu riêng cho chi nhánh nếu có branchId cụ thể
    if (branchId && branchId !== 'all') {
      localStorage.setItem(`${STORAGE_PREFIX}${branchId}`, json);
    }

    // Đồng bộ active theme ID và legacy tint color
    if (updated.activeThemeId) {
      localStorage.setItem('gp_active_theme_id', updated.activeThemeId);
    }
    if (updated.theme?.tintColor) {
      localStorage.setItem('gp_theme', updated.theme.tintColor);
    }

    // Áp dụng ngay lập tức vào DOM
    applyThemeToDom(updated);

    // Phát sự kiện toàn cục để React components re-render mà không cần reload trang
    window.dispatchEvent(new CustomEvent('glopro-ui-preferences-updated', { detail: updated }));
    window.dispatchEvent(new CustomEvent('theme-change', { detail: updated.theme?.tintColor }));

    // Kích hoạt đồng bộ nền lên Cloud
    syncUIPreferencesToCloud(updated, branchId).catch(() => {});
  } catch (err) {
    console.error('[uiPreferences] Error saving preferences:', err);
  }
}

/**
 * Đồng bộ cấu hình giao diện lên Supabase Cloud trong nền
 */
export async function syncUIPreferencesToCloud(config, branchId = 'all') {
  if (typeof window === 'undefined' || !config) return;
  try {
    const { supabase } = await import('@/api/supabaseClient');
    const { getSyncTenantId } = await import('@/lib/tenantManager');
    const tid = getSyncTenantId();
    if (!tid) return;

    if (branchId && branchId !== 'all') {
      try {
        await supabase
          .from('branch')
          .update({
            description: JSON.stringify({ glopro_ui: config })
          })
          .eq('id', branchId)
          .eq('tenant_id', tid);
      } catch (e) {
        // Non-blocking fallback
      }
    }
  } catch (err) {
    console.warn('[uiPreferences] Background cloud sync skipped:', err);
  }
}

/**
 * Khôi phục cấu hình về mặc định ban đầu của GloPro
 */
export function resetUIPreferences(branchId = 'all', branchCountry = 'Vietnam') {
  if (typeof window === 'undefined') return;
  try {
    // 1. Quét và dọn sạch toàn bộ các key cấu hình UI trong localStorage
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith(STORAGE_PREFIX) || k === GLOBAL_STORAGE_KEY || k === 'gp_theme')) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));

    // 2. Tạo cấu hình mặc định chuẩn ban đầu
    const defaultConfig = createDefaultConfig('default_classic', branchCountry);
    
    // 3. Ghi đè cấu hình mặc định và áp dụng ngay vào DOM
    saveUIPreferences(defaultConfig, branchId);
    applyThemeToDom(defaultConfig);

    // 4. Phát sự kiện toàn cục để toàn bộ ứng dụng cập nhật tức thì
    window.dispatchEvent(new CustomEvent('glopro-ui-preferences-updated', { detail: defaultConfig }));
    window.dispatchEvent(new CustomEvent('theme-change', { detail: defaultConfig.theme.tintColor }));
    return defaultConfig;
  } catch (err) {
    console.error('[uiPreferences] Error resetting preferences:', err);
  }
}

/**
 * Cập nhật các biến CSS toàn cục trên thẻ <html> và áp dụng hiệu ứng kính mờ
 */
export function applyThemeToDom(config) {
  if (typeof window === 'undefined' || !config?.theme) return;

  const root = document.documentElement;
  const { tintColor, secondaryColor, gradientCss, glassIntensity, appearanceMode, enableGlassmorphism, enableHolidayParticles, particleEmoji } = config.theme;

  const activeTheme = getThemeById(config.activeThemeId);
  const effectiveTint = tintColor || activeTheme.tintColor || '#FF3B7A';
  const effectiveSecondary = secondaryColor || activeTheme.secondaryColor || '#F43F5E';
  const effectiveGradient = gradientCss || activeTheme.gradient;

  // 1. Cập nhật biến CSS cốt lõi
  root.style.setProperty('--theme-color', effectiveTint);
  root.style.setProperty('--theme-color-rgb', hexToRgb(effectiveTint));
  root.style.setProperty('--theme-secondary', effectiveSecondary);
  root.style.setProperty('--theme-secondary-rgb', hexToRgb(effectiveSecondary));
  root.style.setProperty('--theme-gradient', effectiveGradient);

  // 2. Chuyển đổi sang HSL để gán trực tiếp cho --primary của Tailwind (Button, Badges, Switches)
  const hslPrimary = hexToHsl(effectiveTint);
  root.style.setProperty('--primary', hslPrimary);

  // 3. Độ mờ kính (Glassmorphism Blur)
  const isGlassOn = enableGlassmorphism !== false;
  let blurVal = '20px';
  if (!isGlassOn) {
    blurVal = '0px';
  } else if (glassIntensity === 'subtle') {
    blurVal = '12px';
  } else if (glassIntensity === 'high') {
    blurVal = '28px';
  }
  root.style.setProperty('--glass-blur', blurVal);

  // 4. Nền kính & Viền kính
  const isDark = appearanceMode === 'dark' || (activeTheme && activeTheme.isDark);
  if (isDark) {
    root.classList.add('dark');
    root.style.setProperty('--glass-bg', isGlassOn ? 'rgba(15, 23, 42, 0.78)' : '#0F172A');
    root.style.setProperty('--glass-border', isGlassOn ? `rgba(${hexToRgb(effectiveTint)}, 0.35)` : '#1E293B');
  } else {
    root.classList.remove('dark');
    root.style.setProperty('--glass-bg', isGlassOn ? (activeTheme.cardGlassBg || 'rgba(255, 255, 255, 0.75)') : '#FFFFFF');
    root.style.setProperty('--glass-border', isGlassOn ? (activeTheme.cardGlassBorder || `rgba(${hexToRgb(effectiveTint)}, 0.22)`) : '#E2E8F0');
  }

  // 5. Nền trang theo chủ đề (Themed Page Background)
  const effectivePageBg = config.theme?.pageBg || activeTheme.pageBg || `radial-gradient(circle at 15% 15%, rgba(${hexToRgb(effectiveTint)}, 0.12) 0%, transparent 45%), radial-gradient(circle at 85% 20%, rgba(${hexToRgb(effectiveSecondary)}, 0.09) 0%, transparent 40%), ${isDark ? '#0A0A0F' : '#FDF8FA'}`;
  root.style.setProperty('--theme-page-bg', effectivePageBg);
  if (document.body) {
    document.body.style.background = effectivePageBg;
    document.body.style.backgroundAttachment = 'fixed';
  }

  // 6. Gán theme ID lên thuộc tính dữ liệu
  root.setAttribute('data-glopro-theme', config.activeThemeId || 'default_classic');
  root.setAttribute('data-glass-enabled', enableGlassmorphism !== false ? 'true' : 'false');

  // 6. Xử lý hiệu ứng hạt lễ hội vi mô (hoa mai, tuyết, hoa anh đào)
  updateHolidayParticles(enableHolidayParticles && particleEmoji ? particleEmoji : null);
}

/**
 * Hiệu ứng hạt lễ hội & tài lộc (tiền vàng, tiền đô, mèo chiêu tài, may mắn)
 */
function updateHolidayParticles(emoji) {
  if (typeof window === 'undefined') return;

  const containerId = 'glopro-holiday-particles-container';
  let container = document.getElementById(containerId);

  if (!emoji) {
    if (container) container.remove();
    return;
  }

  if (!container) {
    container = document.createElement('div');
    container.id = containerId;
    container.className = 'fixed inset-0 pointer-events-none z-[9999] overflow-hidden';
    document.body.appendChild(container);
  }

  const emojiList = emoji.includes(',') ? emoji.split(',').map(s => s.trim()).filter(Boolean) : [emoji];

  // Tạo 16 hạt bay nhẹ nhàng tinh tế (không cản trở click hay thao tác người dùng)
  container.innerHTML = '';
  for (let i = 0; i < 16; i++) {
    const p = document.createElement('div');
    p.className = 'glopro-particle';
    p.textContent = emojiList[i % emojiList.length];
    p.style.left = `${(i * 6.2) + (Math.random() * 3.5)}%`;
    p.style.animationDelay = `${(i * 0.45)}s`;
    p.style.animationDuration = `${6.5 + (i % 4) * 2}s`;
    p.style.fontSize = `${18 + (i % 3) * 6}px`;
    p.style.opacity = `${0.55 + (i % 3) * 0.15}`;
    container.appendChild(p);
  }
}
