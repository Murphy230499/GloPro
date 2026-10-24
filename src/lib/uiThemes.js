/**
 * GloPro UI Themes Engine - Multi-category iOS Glassmorphism Theme Presets
 * 
 * Includes:
 * 1. SEASONAL_THEMES: Tết Cổ Truyền, Giáng Sinh & Noel, Halloween, Trung Thu, Mùa Hè
 * 2. COUNTRY_THEMES: Việt Nam Tinh Hoa, Japan Sakura, Korea K-Beauty, US Metropolitan
 * 3. BUSINESS_THEMES: Rose Luxury, Royal Gold, Zen Emerald, Ocean Sapphire, Midnight Obsidian, Minimalist Crystal
 */

export const SEASONAL_THEMES = [
  {
    id: 'tet_vietnam',
    category: 'seasonal',
    name: 'Tết Cổ Truyền & Xuân May Mắn',
    nameEn: 'Lunar New Year (Tết Giáp Thìn)',
    description: 'Sắc Đỏ May Mắn & Vàng Hoàng Kim cát tường, kính mờ ánh pháo hoa & hoa mai vàng thanh tao.',
    icon: '🧧',
    country: 'Vietnam',
    tintColor: '#DC2626',
    secondaryColor: '#F59E0B',
    gradient: 'linear-gradient(135deg, #DC2626 0%, #F59E0B 100%)',
    bgImage: '/themes/tet_vietnam.jpg',
    pageBg: "linear-gradient(135deg, rgba(254, 242, 242, 0.5) 0%, rgba(255, 241, 242, 0.72) 100%), url('/themes/tet_vietnam.jpg') center center / cover no-repeat fixed",
    cardGlassBg: 'rgba(255, 255, 255, 0.78)',
    cardGlassBorder: 'rgba(220, 38, 38, 0.18)',
    particleEffect: 'petals',
    particleEmoji: '🌸',
    isDark: false,
    badgeText: 'Xuân Giáp Thìn 2026',
    suggestedWidgets: [
      { id: 'kpi_revenue', size: 'small', enabled: true, order: 1 },
      { id: 'kpi_appts', size: 'small', enabled: true, order: 2 },
      { id: 'kpi_customers', size: 'small', enabled: true, order: 3 },
      { id: 'kpi_staff', size: 'small', enabled: true, order: 4 },
      { id: 'upcoming_queue', size: 'medium', enabled: true, order: 5 },
      { id: 'revenue_chart', size: 'medium', enabled: true, order: 6 },
      { id: 'room_occupancy', size: 'medium', enabled: true, order: 7 },
      { id: 'social_chat_alert', size: 'medium', enabled: true, order: 8 },
      { id: 'top_rankings', size: 'large', enabled: true, order: 9 }
    ]
  },
  {
    id: 'christmas',
    category: 'seasonal',
    name: 'Giáng Sinh & Năm Mới (Noel)',
    nameEn: 'Christmas & Happy New Year',
    description: 'Sắc Đỏ Rượu Vang & Xanh Thông Noel, viền kính phủ sương tuyết nhẹ nhàng tinh khôi.',
    icon: '🎄',
    country: 'all',
    tintColor: '#BE123C',
    secondaryColor: '#059669',
    gradient: 'linear-gradient(135deg, #BE123C 0%, #059669 100%)',
    bgImage: '/themes/christmas.jpg',
    pageBg: "linear-gradient(135deg, rgba(240, 253, 250, 0.45) 0%, rgba(248, 250, 252, 0.7) 100%), url('/themes/christmas.jpg') center center / cover no-repeat fixed",
    cardGlassBg: 'rgba(255, 255, 255, 0.8)',
    cardGlassBorder: 'rgba(5, 150, 105, 0.2)',
    particleEffect: 'snow',
    particleEmoji: '❄️',
    isDark: false,
    badgeText: 'Mùa Lễ Hội Noel',
    suggestedWidgets: [
      { id: 'kpi_revenue', size: 'small', enabled: true, order: 1 },
      { id: 'kpi_appts', size: 'small', enabled: true, order: 2 },
      { id: 'upcoming_queue', size: 'medium', enabled: true, order: 3 },
      { id: 'revenue_chart', size: 'medium', enabled: true, order: 4 },
      { id: 'top_rankings', size: 'large', enabled: true, order: 5 }
    ]
  },
  {
    id: 'halloween',
    category: 'seasonal',
    name: 'Halloween Bí Ngô Ma Mị',
    nameEn: 'Spooky Halloween Glam',
    description: 'Sắc Cam Bí Ngô & Đen Khói neon phá cách, kích thích khách hàng vẽ móng Nail Art & hóa trang.',
    icon: '🎃',
    country: 'all',
    tintColor: '#EA580C',
    secondaryColor: '#7C3AED',
    gradient: 'linear-gradient(135deg, #EA580C 0%, #312E81 100%)',
    bgImage: '/themes/halloween.jpg',
    pageBg: "linear-gradient(135deg, rgba(10, 10, 15, 0.6) 0%, rgba(10, 10, 15, 0.8) 100%), url('/themes/halloween.jpg') center center / cover no-repeat fixed",
    cardGlassBg: 'rgba(24, 24, 27, 0.85)',
    cardGlassBorder: 'rgba(234, 88, 12, 0.35)',
    particleEffect: null,
    particleEmoji: '🎃',
    isDark: true,
    badgeText: 'Halloween Edition',
    suggestedWidgets: [
      { id: 'kpi_revenue', size: 'small', enabled: true, order: 1 },
      { id: 'kpi_appts', size: 'small', enabled: true, order: 2 },
      { id: 'upcoming_queue', size: 'medium', enabled: true, order: 3 },
      { id: 'revenue_chart', size: 'medium', enabled: true, order: 4 },
      { id: 'top_rankings', size: 'large', enabled: true, order: 5 }
    ]
  },
  {
    id: 'mid_autumn',
    category: 'seasonal',
    name: 'Trung Thu Đoàn Viên',
    nameEn: 'Mid-Autumn Moon Festival',
    description: 'Sắc Vàng Ánh Trăng Rằm & Xanh Đêm Đoàn Viên, ấm áp hạnh phúc cùng gia đình.',
    icon: '🥮',
    country: 'Vietnam',
    tintColor: '#D97706',
    secondaryColor: '#4338CA',
    gradient: 'linear-gradient(135deg, #D97706 0%, #4338CA 100%)',
    bgImage: '/themes/mid_autumn.jpg',
    pageBg: "linear-gradient(135deg, rgba(254, 243, 199, 0.42) 0%, rgba(241, 245, 249, 0.65) 100%), url('/themes/mid_autumn.jpg') center center / cover no-repeat fixed",
    cardGlassBg: 'rgba(255, 255, 255, 0.8)',
    cardGlassBorder: 'rgba(217, 119, 6, 0.22)',
    particleEffect: null,
    particleEmoji: '🌕',
    isDark: false,
    badgeText: 'Rằm Tháng Tám',
    suggestedWidgets: [
      { id: 'kpi_revenue', size: 'small', enabled: true, order: 1 },
      { id: 'kpi_appts', size: 'small', enabled: true, order: 2 },
      { id: 'upcoming_queue', size: 'medium', enabled: true, order: 3 },
      { id: 'room_occupancy', size: 'medium', enabled: true, order: 4 },
      { id: 'top_rankings', size: 'large', enabled: true, order: 5 }
    ]
  },
  {
    id: 'summer',
    category: 'seasonal',
    name: 'Mùa Hè Nhiệt Đới (Summer Glow)',
    nameEn: 'Tropical Summer Vibes',
    description: 'Sắc Cam San Hô & Xanh Biển Biếc, tươi mát năng động cho mùa du lịch, triệt lông & dưỡng da.',
    icon: '☀️',
    country: 'all',
    tintColor: '#F97316',
    secondaryColor: '#06B6D4',
    gradient: 'linear-gradient(135deg, #F97316 0%, #06B6D4 100%)',
    bgImage: '/themes/summer.jpg',
    pageBg: "linear-gradient(135deg, rgba(240, 253, 250, 0.45) 0%, rgba(255, 247, 237, 0.68) 100%), url('/themes/summer.jpg') center center / cover no-repeat fixed",
    cardGlassBg: 'rgba(255, 255, 255, 0.78)',
    cardGlassBorder: 'rgba(249, 115, 22, 0.2)',
    particleEffect: null,
    particleEmoji: '🌊',
    isDark: false,
    badgeText: 'Summer Glow',
    suggestedWidgets: [
      { id: 'kpi_revenue', size: 'small', enabled: true, order: 1 },
      { id: 'kpi_appts', size: 'small', enabled: true, order: 2 },
      { id: 'upcoming_queue', size: 'medium', enabled: true, order: 3 },
      { id: 'revenue_chart', size: 'medium', enabled: true, order: 4 },
      { id: 'top_rankings', size: 'large', enabled: true, order: 5 }
    ]
  }
];

export const COUNTRY_THEMES = [
  {
    id: 'vietnam_heritage',
    category: 'country',
    name: 'Việt Nam Tinh Hoa (Vietnam Heritage)',
    nameEn: 'Vietnam Heritage & Royal Lotus',
    description: 'Đỏ Phù Đổng kiêu hãnh & Vàng Hoàng Thành Thăng Long, hoa sen thanh khiết mang đậm cốt cách Việt.',
    icon: '🇻🇳',
    country: 'Vietnam',
    tintColor: '#DC2626',
    secondaryColor: '#EAB308',
    gradient: 'linear-gradient(135deg, #DC2626 0%, #EAB308 100%)',
    bgImage: '/themes/vietnam_heritage.jpg',
    pageBg: "linear-gradient(135deg, rgba(254, 242, 242, 0.5) 0%, rgba(255, 241, 242, 0.72) 100%), url('/themes/vietnam_heritage.jpg') center center / cover no-repeat fixed",
    cardGlassBg: 'rgba(255, 255, 255, 0.82)',
    cardGlassBorder: 'rgba(220, 38, 38, 0.2)',
    particleEffect: 'petals',
    particleEmoji: '🪷',
    isDark: false,
    badgeText: 'Bản Sắc Việt Nam',
    suggestedWidgets: [
      { id: 'kpi_revenue', size: 'small', enabled: true, order: 1 },
      { id: 'kpi_appts', size: 'small', enabled: true, order: 2 },
      { id: 'room_occupancy', size: 'medium', enabled: true, order: 3 },
      { id: 'upcoming_queue', size: 'medium', enabled: true, order: 4 },
      { id: 'revenue_chart', size: 'medium', enabled: true, order: 5 },
      { id: 'top_rankings', size: 'large', enabled: true, order: 6 }
    ]
  },
  {
    id: 'japan_sakura',
    category: 'country',
    name: 'Japan Sakura & Wabi-Sabi',
    nameEn: 'Japan Sakura & Minimalist Zen',
    description: 'Hồng Phấn Hoa Anh Đào & Gỗ Hinoki ấm áp, thanh tao thiền tịnh theo triết lý tối giản Nhật Bản.',
    icon: '🇯🇵',
    country: 'Japan',
    tintColor: '#F472B6',
    secondaryColor: '#78350F',
    gradient: 'linear-gradient(135deg, #F472B6 0%, #FBBF24 100%)',
    bgImage: '/themes/japan_sakura.jpg',
    pageBg: "linear-gradient(135deg, rgba(253, 242, 248, 0.45) 0%, rgba(254, 242, 242, 0.68) 100%), url('/themes/japan_sakura.jpg') center center / cover no-repeat fixed",
    cardGlassBg: 'rgba(255, 255, 255, 0.85)',
    cardGlassBorder: 'rgba(244, 114, 182, 0.25)',
    particleEffect: 'petals',
    particleEmoji: '🌸',
    isDark: false,
    badgeText: 'Chuẩn Phong Cách Nhật',
    suggestedWidgets: [
      { id: 'kpi_revenue', size: 'small', enabled: true, order: 1 },
      { id: 'kpi_appts', size: 'small', enabled: true, order: 2 },
      { id: 'upcoming_queue', size: 'medium', enabled: true, order: 3 },
      { id: 'revenue_chart', size: 'medium', enabled: true, order: 4 },
      { id: 'top_rankings', size: 'large', enabled: true, order: 5 }
    ]
  },
  {
    id: 'korea_kbeauty',
    category: 'country',
    name: 'Korea K-Beauty Glass Skin',
    nameEn: 'Seoul K-Chic & Dewy Glass',
    description: 'Hồng Pastel K-Pop & Bạc Pha Lê căng mọng, thời thượng chuẩn phong cách viện thẩm mỹ Gangnam.',
    icon: '🇰🇷',
    country: 'Korea',
    tintColor: '#FB7185',
    secondaryColor: '#0284C7',
    gradient: 'linear-gradient(135deg, #FB7185 0%, #38BDF8 100%)',
    bgImage: '/themes/korea_kbeauty.jpg',
    pageBg: "linear-gradient(135deg, rgba(253, 244, 255, 0.42) 0%, rgba(240, 249, 255, 0.68) 100%), url('/themes/korea_kbeauty.jpg') center center / cover no-repeat fixed",
    cardGlassBg: 'rgba(255, 255, 255, 0.82)',
    cardGlassBorder: 'rgba(251, 113, 133, 0.25)',
    particleEffect: null,
    particleEmoji: '✨',
    isDark: false,
    badgeText: 'K-Beauty Trend',
    suggestedWidgets: [
      { id: 'kpi_revenue', size: 'small', enabled: true, order: 1 },
      { id: 'kpi_appts', size: 'small', enabled: true, order: 2 },
      { id: 'social_chat_alert', size: 'medium', enabled: true, order: 3 },
      { id: 'upcoming_queue', size: 'medium', enabled: true, order: 4 },
      { id: 'top_rankings', size: 'large', enabled: true, order: 5 }
    ]
  },
  {
    id: 'us_metropolitan',
    category: 'country',
    name: 'US Modern Metropolitan',
    nameEn: 'US Luxury Manhattan Suite',
    description: 'Xanh Navy Thượng Hạng & Vàng Gold tài chính, quyền uy chuyên nghiệp chuẩn phong cách New York.',
    icon: '🇺🇸',
    country: 'United States',
    tintColor: '#1E3A8A',
    secondaryColor: '#D97706',
    gradient: 'linear-gradient(135deg, #1E3A8A 0%, #D97706 100%)',
    bgImage: '/themes/us_metropolitan.jpg',
    pageBg: "linear-gradient(135deg, rgba(239, 246, 255, 0.5) 0%, rgba(248, 250, 252, 0.72) 100%), url('/themes/us_metropolitan.jpg') center center / cover no-repeat fixed",
    cardGlassBg: 'rgba(255, 255, 255, 0.84)',
    cardGlassBorder: 'rgba(30, 58, 138, 0.22)',
    particleEffect: null,
    particleEmoji: '⭐',
    isDark: false,
    badgeText: 'Metropolitan Luxury',
    suggestedWidgets: [
      { id: 'kpi_revenue', size: 'small', enabled: true, order: 1 },
      { id: 'kpi_appts', size: 'small', enabled: true, order: 2 },
      { id: 'revenue_chart', size: 'medium', enabled: true, order: 3 },
      { id: 'upcoming_queue', size: 'medium', enabled: true, order: 4 },
      { id: 'top_rankings', size: 'large', enabled: true, order: 5 }
    ]
  }
];

export const APPEARANCE_MODES = [
  {
    id: 'default_classic',
    category: 'mode',
    name: 'GloPro Chuẩn Mặc Định',
    nameEn: 'GloPro Classic Slate (Light)',
    description: 'Giao diện gốc nguyên bản của GloPro. Nền Slate sáng trang nhã, thẻ trắng tinh khôi và điểm nhấn Emerald chuyên nghiệp.',
    icon: '✨',
    country: 'all',
    tintColor: '#059669',
    secondaryColor: '#10B981',
    gradient: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
    bgImage: null,
    pageBg: '#F8FAFC',
    cardGlassBg: '#FFFFFF',
    cardGlassBorder: 'rgba(226, 232, 240, 0.8)',
    particleEffect: null,
    particleEmoji: '',
    isDark: false,
    badgeText: 'Mặc Định Gốc',
    suggestedWidgets: [
      { id: 'kpi_revenue', size: 'small', enabled: true, order: 1 },
      { id: 'kpi_appts', size: 'small', enabled: true, order: 2 },
      { id: 'kpi_customers', size: 'small', enabled: true, order: 3 },
      { id: 'kpi_staff', size: 'small', enabled: true, order: 4 },
      { id: 'upcoming_queue', size: 'medium', enabled: true, order: 5 },
      { id: 'revenue_chart', size: 'medium', enabled: true, order: 6 },
      { id: 'room_occupancy', size: 'medium', enabled: true, order: 7 },
      { id: 'top_rankings', size: 'large', enabled: true, order: 8 }
    ]
  },
  {
    id: 'rose_luxury',
    category: 'mode',
    name: 'Rose Luxury (Hồng Thời Thượng)',
    nameEn: 'Rose Luxury Glamour (Light)',
    description: 'Sắc Hồng Rose thanh lịch, quyến rũ kết hợp dải lụa cong tối giản dịu nhẹ. Tôn vinh không gian sang trọng cho Salon Tóc & Tiệm Nail.',
    icon: '🌸',
    country: 'all',
    tintColor: '#FF3B7A',
    secondaryColor: '#F43F5E',
    gradient: 'linear-gradient(135deg, #FF3B7A 0%, #FB7185 100%)',
    bgImage: '/themes/rose_luxury.jpg',
    pageBg: "linear-gradient(135deg, rgba(255, 241, 242, 0.45) 0%, rgba(253, 248, 250, 0.75) 100%), url('/themes/rose_luxury.jpg') center center / cover no-repeat fixed",
    cardGlassBg: 'rgba(255, 255, 255, 0.8)',
    cardGlassBorder: 'rgba(255, 59, 122, 0.22)',
    particleEffect: null,
    particleEmoji: '',
    isDark: false,
    badgeText: 'Hồng Thời Thượng',
    suggestedWidgets: [
      { id: 'kpi_revenue', size: 'small', enabled: true, order: 1 },
      { id: 'kpi_appts', size: 'small', enabled: true, order: 2 },
      { id: 'kpi_customers', size: 'small', enabled: true, order: 3 },
      { id: 'kpi_staff', size: 'small', enabled: true, order: 4 },
      { id: 'upcoming_queue', size: 'medium', enabled: true, order: 5 },
      { id: 'revenue_chart', size: 'medium', enabled: true, order: 6 },
      { id: 'room_occupancy', size: 'medium', enabled: true, order: 7 },
      { id: 'top_rankings', size: 'large', enabled: true, order: 8 }
    ]
  },
  {
    id: 'dark_mode_pro',
    category: 'mode',
    name: 'Chế Độ Tối Hiện Đại (Dark Mode Pro)',
    nameEn: 'Minimal Obsidian Dark Pro',
    description: 'Sắc Đen Obsidian than chì tinh giản và sang trọng. Nền lụa cong tối giản dịu mắt, chống chói lóa, giúp tôn vinh thông tin và số liệu vận hành.',
    icon: '🌙',
    country: 'all',
    tintColor: '#06B6D4',
    secondaryColor: '#10B981',
    gradient: 'linear-gradient(135deg, #06B6D4 0%, #0284C7 100%)',
    bgImage: '/themes/dark_mode_pro.jpg',
    pageBg: "linear-gradient(135deg, rgba(8, 12, 20, 0.65) 0%, rgba(15, 23, 42, 0.8) 100%), url('/themes/dark_mode_pro.jpg') center center / cover no-repeat fixed",
    cardGlassBg: 'rgba(15, 23, 42, 0.84)',
    cardGlassBorder: 'rgba(6, 182, 212, 0.32)',
    particleEffect: null,
    particleEmoji: '✨',
    isDark: true,
    badgeText: 'Tinh Giản & Hiện Đại',
    suggestedWidgets: [
      { id: 'kpi_revenue', size: 'small', enabled: true, order: 1 },
      { id: 'kpi_appts', size: 'small', enabled: true, order: 2 },
      { id: 'upcoming_queue', size: 'medium', enabled: true, order: 3 },
      { id: 'revenue_chart', size: 'medium', enabled: true, order: 4 },
      { id: 'room_occupancy', size: 'medium', enabled: true, order: 5 },
      { id: 'top_rankings', size: 'large', enabled: true, order: 6 }
    ]
  }
];

export const BUSINESS_THEMES = [
  {
    id: 'royal_gold',
    category: 'business',
    name: 'Royal Amber Gold (Vàng Hoàng Gia)',
    nameEn: 'Royal Amber & Luxury Spa',
    description: 'Sắc Vàng Ánh Kim Champagne sang trọng, đẳng cấp thượng lưu cho Thẩm mỹ viện VIP & Spa 5 sao.',
    icon: '👑',
    country: 'all',
    tintColor: '#F59E0B',
    secondaryColor: '#D97706',
    gradient: 'linear-gradient(135deg, #F59E0B 0%, #B45309 100%)',
    bgImage: '/themes/royal_gold.jpg',
    pageBg: "linear-gradient(135deg, rgba(254, 252, 232, 0.45) 0%, rgba(254, 243, 199, 0.7) 100%), url('/themes/royal_gold.jpg') center center / cover no-repeat fixed",
    cardGlassBg: 'rgba(255, 255, 255, 0.82)',
    cardGlassBorder: 'rgba(245, 158, 11, 0.25)',
    particleEffect: null,
    particleEmoji: '✨',
    isDark: false,
    badgeText: 'VIP & Thẩm Mỹ Viện',
    suggestedWidgets: [
      { id: 'kpi_revenue', size: 'small', enabled: true, order: 1 },
      { id: 'kpi_customers', size: 'small', enabled: true, order: 2 },
      { id: 'upcoming_queue', size: 'medium', enabled: true, order: 3 },
      { id: 'revenue_chart', size: 'medium', enabled: true, order: 4 },
      { id: 'top_rankings', size: 'large', enabled: true, order: 5 }
    ]
  },
  {
    id: 'zen_emerald',
    category: 'business',
    name: 'Zen Emerald (Dưỡng Sinh Thảo Mộc)',
    nameEn: 'Zen Herbal & Organic Spa',
    description: 'Sắc Xanh Ngọc Bích mát dịu, an yên, cân bằng năng lượng. Tuyệt hảo cho Spa Gội đầu dưỡng sinh & Trị liệu.',
    icon: '🌿',
    country: 'all',
    tintColor: '#10B981',
    secondaryColor: '#059669',
    gradient: 'linear-gradient(135deg, #10B981 0%, #047857 100%)',
    bgImage: '/themes/zen_emerald.jpg',
    pageBg: "linear-gradient(135deg, rgba(236, 253, 245, 0.45) 0%, rgba(240, 253, 250, 0.7) 100%), url('/themes/zen_emerald.jpg') center center / cover no-repeat fixed",
    cardGlassBg: 'rgba(255, 255, 255, 0.8)',
    cardGlassBorder: 'rgba(16, 185, 129, 0.22)',
    particleEffect: null,
    particleEmoji: '🍃',
    isDark: false,
    badgeText: 'Dưỡng Sinh & Trị Liệu',
    suggestedWidgets: [
      { id: 'room_occupancy', size: 'medium', enabled: true, order: 1 },
      { id: 'upcoming_queue', size: 'medium', enabled: true, order: 2 },
      { id: 'kpi_revenue', size: 'small', enabled: true, order: 3 },
      { id: 'kpi_staff', size: 'small', enabled: true, order: 4 },
      { id: 'revenue_chart', size: 'medium', enabled: true, order: 5 },
      { id: 'top_rankings', size: 'large', enabled: true, order: 6 }
    ]
  },
  {
    id: 'ocean_sapphire',
    category: 'business',
    name: 'Ocean Sapphire (Đại Dương Công Nghệ)',
    nameEn: 'Ocean Sapphire Clinic',
    description: 'Sắc Xanh Biển Trong Vắt, tinh khiết y khoa. Dành cho Clinic Da Liễu, Viện Thẩm Mỹ Laser & Nha Khoa.',
    icon: '💎',
    country: 'all',
    tintColor: '#0EA5E9',
    secondaryColor: '#2563EB',
    gradient: 'linear-gradient(135deg, #0EA5E9 0%, #2563EB 100%)',
    bgImage: '/themes/ocean_sapphire.jpg',
    pageBg: "linear-gradient(135deg, rgba(240, 249, 255, 0.45) 0%, rgba(224, 242, 254, 0.7) 100%), url('/themes/ocean_sapphire.jpg') center center / cover no-repeat fixed",
    cardGlassBg: 'rgba(255, 255, 255, 0.82)',
    cardGlassBorder: 'rgba(14, 165, 233, 0.22)',
    particleEffect: null,
    particleEmoji: '💧',
    isDark: false,
    badgeText: 'Clinic & Da Liễu',
    suggestedWidgets: [
      { id: 'kpi_revenue', size: 'small', enabled: true, order: 1 },
      { id: 'kpi_appts', size: 'small', enabled: true, order: 2 },
      { id: 'revenue_chart', size: 'medium', enabled: true, order: 3 },
      { id: 'upcoming_queue', size: 'medium', enabled: true, order: 4 },
      { id: 'social_chat_alert', size: 'medium', enabled: true, order: 5 },
      { id: 'top_rankings', size: 'large', enabled: true, order: 6 }
    ]
  },
  {
    id: 'midnight_obsidian',
    category: 'business',
    name: 'Midnight Obsidian (Đêm Huyền Bí - Dark)',
    nameEn: 'Midnight Obsidian & Barber Dark',
    description: 'Sắc Đen Khói Vũ Trụ kết hợp viền ánh sáng Neon Indigo sang trọng. Tuyệt hảo cho Barber Shop & Chế độ Ban đêm.',
    icon: '🌌',
    country: 'all',
    tintColor: '#6366F1',
    secondaryColor: '#F43F5E',
    gradient: 'linear-gradient(135deg, #6366F1 0%, #EC4899 100%)',
    bgImage: '/themes/dark_mode_pro.jpg',
    pageBg: "linear-gradient(135deg, rgba(11, 15, 25, 0.72) 0%, rgba(15, 23, 42, 0.88) 100%), url('/themes/dark_mode_pro.jpg') center center / cover no-repeat fixed",
    cardGlassBg: 'rgba(15, 23, 42, 0.82)',
    cardGlassBorder: 'rgba(99, 102, 241, 0.35)',
    particleEffect: null,
    particleEmoji: '⚡',
    isDark: true,
    badgeText: 'Barber & Dark Mode',
    suggestedWidgets: [
      { id: 'kpi_revenue', size: 'small', enabled: true, order: 1 },
      { id: 'kpi_staff', size: 'small', enabled: true, order: 2 },
      { id: 'upcoming_queue', size: 'medium', enabled: true, order: 3 },
      { id: 'revenue_chart', size: 'medium', enabled: true, order: 4 },
      { id: 'top_rankings', size: 'large', enabled: true, order: 5 }
    ]
  },
  {
    id: 'minimalist_crystal',
    category: 'business',
    name: 'Minimalist Crystal (Bạch Kim Tối Giản)',
    nameEn: 'Minimalist Crystal White',
    description: 'Thanh lịch, tối giản tuyệt đối chuẩn Apple Store. Tôn vinh nét đẹp tinh khôi, thoáng đãng không rườm rà.',
    icon: '🤍',
    country: 'all',
    tintColor: '#334155',
    secondaryColor: '#64748B',
    gradient: 'linear-gradient(135deg, #334155 0%, #64748B 100%)',
    bgImage: null,
    pageBg: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 50%, #E2E8F0 100%)',
    cardGlassBg: 'rgba(255, 255, 255, 0.88)',
    cardGlassBorder: 'rgba(51, 65, 85, 0.15)',
    particleEffect: null,
    particleEmoji: '🪞',
    isDark: false,
    badgeText: 'Tối Giản Tinh Tế',
    suggestedWidgets: [
      { id: 'kpi_revenue', size: 'small', enabled: true, order: 1 },
      { id: 'kpi_appts', size: 'small', enabled: true, order: 2 },
      { id: 'upcoming_queue', size: 'medium', enabled: true, order: 3 },
      { id: 'revenue_chart', size: 'medium', enabled: true, order: 4 },
      { id: 'top_rankings', size: 'large', enabled: true, order: 5 }
    ]
  }
];

export const ALL_THEMES = [
  ...APPEARANCE_MODES,
  ...SEASONAL_THEMES,
  ...COUNTRY_THEMES,
  ...BUSINESS_THEMES
];

/**
 * Lấy theme theo ID với fallback an toàn
 */
export function getThemeById(themeId) {
  if (!themeId) return BUSINESS_THEMES[0];
  const found = ALL_THEMES.find(t => t.id === themeId);
  return found || BUSINESS_THEMES[0];
}

/**
 * Trả về danh sách chủ đề được ưu tiên gợi ý cho một quốc gia cụ thể
 */
export function getSuggestedThemesForCountry(branchCountry = 'Vietnam') {
  const norm = (branchCountry || '').toLowerCase();
  let matchedCountry = 'Vietnam';
  if (norm.includes('us') || norm.includes('unit') || norm.includes('mỹ')) {
    matchedCountry = 'United States';
  } else if (norm.includes('japan') || norm.includes('nhật')) {
    matchedCountry = 'Japan';
  } else if (norm.includes('korea') || norm.includes('hàn')) {
    matchedCountry = 'Korea';
  } else if (norm.includes('sing')) {
    matchedCountry = 'Singapore';
  }

  // Lọc các theme phù hợp với quốc gia hoặc dùng chung (country === 'all')
  const prioritized = ALL_THEMES.filter(t => t.country === matchedCountry || t.country === branchCountry);
  const general = ALL_THEMES.filter(t => !prioritized.includes(t));
  return {
    matchedCountry,
    prioritized,
    all: [...prioritized, ...general]
  };
}
