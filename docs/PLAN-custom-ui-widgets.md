# Kế Hoạch Triển Khai: Tùy Biến Giao Diện & Widget Chuẩn iOS Glassmorphism (GloPro iOS Glass Studio)

## 📌 1. Tổng Quan Dự Án & Định Hướng Phong Cách iOS Glass
Theo đúng định hướng mở rộng của người dùng: 
1. **"Giao diện & Widget kiểu iPhone / iOS với phong cách kính mờ Liquid Glass (Glassmorphism)"**.
2. **"Tạo sẵn các bộ Chủ Đề (Pre-built Themes) để người dùng chỉ cần vào bấm chọn 1 chạm là xong"**.
3. **"Bổ sung Chủ Đề Sự Kiện Trong Năm (Tết, Halloween, Giáng Sinh, Trung Thu...) & Chủ Đề Riêng Biệt Theo Quốc Gia Của Từng Chi Nhánh (Việt Nam 🇻🇳, Nhật Bản 🇯🇵, Hàn Quốc 🇰🇷, Mỹ 🇺🇸...)"**.

Phân hệ mới được tích hợp vào **Cài đặt (`/settings`)** -> tab mới **✦ Giao diện & Widgets (iOS Glass Studio)**, mang lại trải nghiệm thị giác siêu sang trọng, mềm mại và đẳng cấp như hệ điều hành iOS:

- **Bộ Sưu Tập Chủ Đề Đa Tầng 1-Chạm (Multi-Category 1-Click Themes):**
  - Danh mục 1: 🌟 **Chủ đề Mô hình Tiệm** (Hair Salon, Nail, Spa VIP, Thảo mộc, Barber...).
  - Danh mục 2: 🏮 **Chủ đề Lễ Hội & Sự Kiện Theo Mùa** (Tết Cổ Truyền, Giáng Sinh Noel, Halloween, Trung Thu, Mùa Hè...).
  - Danh mục 3: 🌏 **Chủ đề Bản Sắc Quốc Gia & Chi Nhánh** (Việt Nam Tinh Hoa, Nhật Bản Sakura Zen, Hàn Quốc K-Beauty, Mỹ & Singapore Metropolitan...).
- **Cơ Chế Phân Cấp Theo Chi Nhánh (Branch-Aware Theming):**
  - Hệ thống tự động nhận diện `branch.country` để ưu tiên hiển thị và gợi ý chủ đề phù hợp với quốc gia của chi nhánh đó.
  - Cho phép cấu hình: **Chỉ áp dụng cho Chi nhánh hiện tại** (ví dụ: Chi nhánh TP.HCM chọn Tết Việt Nam 🇻🇳, Chi nhánh California chọn Valentine/New Year 🇺🇸) HOẶC **Áp dụng cho toàn chuỗi**.
- **Thẩm mỹ Kính mờ Siêu thực (iOS Frosted Glassmorphism):**
  - Lớp nền kính mờ xuyên thấu tinh tế (`backdrop-filter: blur(20px) saturate(180%)`), viền kính bắt sáng thanh mảnh, bo góc squircle chuẩn Apple (`rounded-[24px]` và `rounded-[32px]`).
- **Lưu Trữ & Đồng Bộ Đa Tầng (Multi-tier Sync):**
  - Lưu tức thì 0ms trên máy (`localStorage`) + Đồng bộ Supabase Cloud theo từng `branch_id`.

---

## 🎨 2. Thư Viện Chủ Đề Phong Phú Theo 3 Nhóm Lớn

### 🏮 NHÓM 1: LỄ HỘI & SỰ KIỆN TRONG NĂM (SEASONAL & HOLIDAY THEMES)

| Tên Chủ Đề | Màu Tint & Kính Mờ | Hiệu Ứng Thị Giác Đặc Trưng | Bố Cục Widget & Khuyến Nghị Nghiệp Vụ |
|------------|--------------------|----------------------------|---------------------------------------|
| 🧧 **Tết Cổ Truyền / Xuân Giáp Thìn** *(Dành riêng Việt Nam)* | `#DC2626` (Đỏ May Mắn) & `#F59E0B` (Vàng Kim) | Kính mờ ánh pháo hoa, viền vàng champagne, hoa mai/đào chìm thanh tao | Ưu tiên hàng đầu: Lịch hẹn làm đẹp đón Tết -> Top dịch vụ Uốn/Nhuộm/Nail -> Bán voucher lì xì |
| 🎄 **Giáng Sinh & Năm Mới (Noel & New Year)** | `#BE123C` (Đỏ Rượu Vang) & `#059669` (Xanh Thông) | Kính mờ phủ sương tuyết nhẹ, viền ngọc lục bảo, chuông vàng lung linh | Ưu tiên: Combo gói quà tặng Giáng Sinh -> Lịch hẹn dự tiệc tất niên -> Top sản phẩm dưỡng ẩm |
| 🎃 **Halloween Bí Ngô Ma Mị (Spooky Glam)** | `#EA580C` (Cam Bí Ngô) & `#18181B` (Đen Khói Neon) | Kính tối màu viền neon cam phát sáng, huyền bí, thời thượng | Ưu tiên: Hàng chờ làm móng Nail Art Halloween -> Dịch vụ trang điểm hóa trang -> Báo cáo ca thợ |
| 🥮 **Trung Thu Rằm Tháng Tám (Mid-Autumn Moon)** | `#F59E0B` (Vàng Ánh Trăng) & `#4338CA` (Xanh Đêm Rằm) | Kính mờ ánh trăng rằm, viền vàng ấm áp, họa tiết lồng đèn | Ưu tiên: Lịch hẹn gia đình mẹ & bé -> Gói chăm sóc da thư giãn cuối tuần |
| ☀️ **Mùa Hè Nhiệt Đới (Summer Glow & Beach)** | `#F97316` (Cam San Hô) & `#06B6D4` (Xanh Biển Biếc) | Kính trong vắt ánh sóng biển nhiệt đới, tươi trẻ tràn đầy năng lượng | Ưu tiên: Dịch vụ triệt lông/tắm trắng mùa đi biển -> Chăm sóc da chống nắng |

---

### 🌏 NHÓM 2: BẢN SẮC QUỐC GIA THEO TỪNG CHI NHÁNH (COUNTRY & CULTURAL HERITAGE)

| Quốc Gia | Tên Chủ Đề | Màu Tint & Phong Cách | Ý Nghĩa Văn Hóa & Ứng Dụng |
|----------|------------|-----------------------|----------------------------|
| 🇻🇳 **Việt Nam** | **Việt Nam Tinh Hoa (Vietnam Heritage)** | `#DC2626` (Đỏ Phù Đổng) & `#EAB308` (Vàng Hoàng Thành) | Nền kính mờ hoa sen thanh khiết hoặc trống đồng Đông Sơn chìm. Rất phù hợp cho Spa dưỡng sinh, gội đầu thảo dược truyền thống tại VN. |
| 🇯🇵 **Nhật Bản** | **Japan Sakura & Wabi-Sabi** | `#F472B6` (Hồng Hoa Anh Đào) & `#78350F` (Gỗ Hinoki) | Tinh tế, thiền tịnh, trang nhã. Phù hợp cho chi nhánh tại Tokyo/Osaka hoặc salon chuẩn phong cách Nhật Bản. |
| 🇰🇷 **Hàn Quốc** | **K-Beauty Seoul Glass Skin** | `#FB7185` (Hồng Phấn K-Pop) & `#E2E8F0` (Bạc Pha Lê) | Hiệu ứng căng bóng như làn da "Glass skin", hiện đại chuẩn Gangnam. Dành cho clinic chăm sóc da, viện thẩm mỹ phong cách Hàn. |
| 🇺🇸 **Mỹ & Quốc Tế**| **US Modern Metropolitan** | `#1E3A8A` (Xanh Navy New York) & `#D97706` (Vàng Tài Chính) | Chuyên nghiệp, hiện đại, uy quyền. Phù hợp chuỗi chi nhánh tại California, Texas, Singapore. |

---

### 🌟 NHÓM 3: MÔ HÌNH KINH DOANH CHUYÊN BIỆT (SALON BUSINESS MODELS)

| Tên Chủ Đề | Màu Tint | Mô Hình Tiệm | Bố Cục Widget Mặc Định |
|------------|----------|--------------|------------------------|
| 🌸 **Rose Luxury (Hồng Thời Thượng)** | `#FF3B7A` | Hair Salon, Tiệm Nail, Nối Mi | 4 Thẻ KPI -> Lịch hẹn sắp tới -> Biểu đồ tuần -> Top thợ |
| 👑 **Royal Gold & Amber (Vàng Hoàng Gia)** | `#F59E0B` | Thẩm mỹ viện VIP, Spa 5 sao | Doanh thu VIP -> Top khách chi tiêu cao -> Lịch hẹn VIP |
| 🌿 **Zen Emerald (Dưỡng Sinh Thảo Mộc)** | `#10B981` | Spa Gội đầu dưỡng sinh, Massage Đông Y | **Sơ đồ công suất Giường/Phòng đưa lên đầu** -> Ca kỹ thuật viên |
| 💎 **Ocean Sapphire (Đại Dương Công Nghệ)** | `#0EA5E9` | Clinic Da Liễu, Viện Thẩm Mỹ Laser | Biểu đồ doanh thu tuần -> Lịch bác sĩ -> Hộp thư MXH |
| 🌌 **Midnight Obsidian (Đêm Huyền Bí - Dark)**| `#6366F1` & `#F43F5E` | Barber Shop Quý Ông, Studio Tattoo | KPI tối giản -> Lịch thợ cạo -> Doanh thu sáp/pomade |
| 🤍 **Minimalist Crystal (Bạch Kim Tối Giản)** | `#334155` | Studio phong cách Hàn/Nhật tối giản | Thẻ vuông đều đặn, màu sắc tinh khôi, thoáng đãng |

---

## 🏗️ 3. Kiến Trúc Kỹ Thuật (Architecture & Data Schema)

### 3.1. Cấu Trúc Dữ Liệu Cấu Hình Theo Chi Nhánh (`BranchAwareUIConfig`)
```typescript
interface GloProBranchUIConfig {
  version: '2.2-multinational-glass';
  branchId: string;                  // ID chi nhánh hiện tại ('all' hoặc UUID chi nhánh)
  branchCountry: string;             // 'Vietnam' | 'United States' | 'Singapore' | 'Japan' | 'Korea'
  applyScope: 'branch_only' | 'global_chain'; // Chỉ áp dụng cho chi nhánh này hay toàn chuỗi
  activeThemeId: string;             // ID chủ đề đang chọn (ví dụ: 'tet_vietnam', 'christmas', 'rose_luxury', v.v.)
  themeCategory: 'seasonal' | 'country' | 'business' | 'custom';
  lastUpdated: string;
  theme: {
    tintColor: string;               // Mã màu HEX chủ đạo
    accentSecondary: string;         // Màu phụ (ví dụ: Vàng Kim đi kèm Đỏ Tết)
    glassIntensity: 'subtle' | 'medium' | 'high'; // Độ mờ kính: 12px | 20px | 30px
    badgeIcon: string;               // Icon lễ hội nhỏ (ví dụ: 🧧, 🎄, 🎃, 🌸, 🇻🇳)
    enableHolidayParticles: boolean; // Bật hạt tuyết rơi hoặc hoa mai rơi nhẹ mờ (tùy chọn)
    layoutDensity: 'comfortable' | 'compact';
  };
  dashboard: {
    gridColumns: 4;
    widgets: Array<{
      id: string;
      title: string;
      size: 'small' | 'medium' | 'large';
      enabled: boolean;
      order: number;
    }>;
  };
}
```

### 3.2. Cơ Chế Nhận Diện Quốc Gia Thông Minh (Smart Country Detector)
1. Khi người dùng mở tab **✦ Giao diện & Widgets**:
   - Hệ thống đọc `currentBranch.country` từ `BranchContext`.
   - Nếu chi nhánh thuộc **Việt Nam (`Vietnam`)** ➔ Tự động gắn nhãn huy hiệu **"🇻🇳 Dành riêng cho chi nhánh Việt Nam"** và ưu tiên đẩy chủ đề **Tết Cổ Truyền**, **Việt Nam Tinh Hoa**, **Trung Thu** lên đầu danh sách để chọn ngay trong 1 click!
   - Nếu chi nhánh thuộc **Mỹ (`United States`)** ➔ Ưu tiên các chủ đề **Giáng Sinh / New Year**, **Halloween**, **US Modern**.
   - Nếu chi nhánh thuộc **Nhật Bản (`Japan`)** ➔ Ưu tiên chủ đề **Sakura & Wabi-Sabi**.

---

## 🖼️ 4. Thiết Kế Giao Diện Tab Cài Đặt (Wireframe Multi-Tab Theme Studio)

```
====================================================================================================
 CÀI ĐẶT HỆ THỐNG / TÙY BIẾN GIAO DIỆN & WIDGETS
====================================================================================================
 [Chi nhánh]   [Tài khoản]   [Phân quyền]   [Tích hợp]   [✦ Giao diện & Widgets] (ĐANG MỞ)
----------------------------------------------------------------------------------------------------

 [ Phạm vi áp dụng: (●) Chỉ chi nhánh hiện tại (Chi nhánh Quận 1 - 🇻🇳 Việt Nam)  ( ) Áp dụng toàn chuỗi ]

 +------------------------------------------------------------------------------------------------+
 | 🌟 BỘ SƯU TẬP CHỦ ĐỀ GIAO DIỆN CHUẨN IOS GLASSMORPHISM                                         |
 |                                                                                                |
 | [ 🏮 Sự Kiện & Lễ Hội (5) ]   [ 🌏 Theo Quốc Gia & Bản Sắc (4) ]   [ 💇 Mô Hình Tiệm (6) ]     |
 +------------------------------------------------------------------------------------------------+
 | ĐANG XEM: [ 🏮 SỰ KIỆN & LỄ HỘI TRONG NĂM ]                                                    |
 |                                                                                                |
 |  +-----------------------+  +-----------------------+  +-----------------------+               |
 |  | 🧧 TẾT CỔ TRUYỀN      |  | 🎄 GIÁNG SINH & NOEL  |  | 🎃 HALLOWEEN BÍ NGÔ   |               |
 |  | [Badge: 🇻🇳 Ưu tiên VN] |  | [Đỏ Rượu & Xanh Thông]|  | [Cam Bí Ngô & Đen Khói|               |
 |  | Đỏ May Mắn & Vàng Kim |  | Tuyết sương kính mờ   |  | Neon bí ẩn phát sáng] |               |
 |  | [ 1-CHẠM ÁP DỤNG ]    |  | [ 1-CHẠM ÁP DỤNG ]    |  | [ 1-CHẠM ÁP DỤNG ]    |               |
 |  +-----------------------+  +-----------------------+  +-----------------------+               |
 |                                                                                                |
 |  +-----------------------+  +-----------------------+                                          |
 |  | 🥮 TRUNG THU ĐOÀN VIÊN|  | ☀️ MÙA HÈ NHIỆT ĐỚI   |                                          |
 |  | Vàng Ánh Trăng & Xanh |  | Cam San Hô & Xanh Biển|                                          |
 |  | [ 1-CHẠM ÁP DỤNG ]    |  | [ 1-CHẠM ÁP DỤNG ]    |                                          |
 |  +-----------------------+  +-----------------------+                                          |
 +------------------------------------------------------------------------------------------------+

 +------------------------------------------------------------------------------------------------+
 | ⚙️ TINH CHỈNH CHI TIẾT (Tùy chọn độ mờ kính, màu tint, hạt hiệu ứng lễ hội...)                  |
 +------------------------------------------------------------------------------------------------+
 | - Hiệu ứng kính mờ (Glassmorphism): [ BẬT ● ]      - Độ mờ kính: ( ) 12px  (●) 20px  ( ) 30px   |
 | - Hiệu ứng hạt lễ hội (Tuyết rơi / Mai vàng nhẹ):   [ BẬT HIỆU ỨNG ● ]                          |
 +------------------------------------------------------------------------------------------------+

 +------------------------------------------------------------------------------------------------+
 | 📱 BỐ CỤC WIDGET DASHBOARD THEO CHỦ ĐỀ ĐÃ CHỌN                                                 |
 | Tự động sắp xếp tối ưu cho mùa lễ hội (ví dụ Tết: Lịch hẹn & Bán voucher lì xì lên đầu)        |
 +------------------------------------------------------------------------------------------------+
 | [x] 📅 Lịch hẹn làm đẹp lễ hội       | Kích cỡ: [Medium (2x1) ▼] | [▲] [▼] | [Bật ●]           |
 | [x] 💵 Doanh thu & Bán voucher Tết   | Kích cỡ: [Medium (2x1) ▼] | [▲] [▼] | [Bật ●]           |
 | [x] 🛏️ Sơ đồ công suất Giường/Ghế   | Kích cỡ: [Medium (2x1) ▼] | [▲] [▼] | [Bật ●]           |
 | [x] 🏆 Top Thợ & Dịch vụ hot nhất    | Kích cỡ: [Large (2x2) ▼]  | [▲] [▼] | [Bật ●]           |
 +------------------------------------------------------------------------------------------------+

 +------------------------------------------------------------------------------------------------+
 | [ ↺ Khôi phục mặc định ban đầu ]                                [ 💾 Lưu & Áp Dụng Ngay ]      |
 +------------------------------------------------------------------------------------------------+
```

---

## 📋 5. Kế Hoạch Triển Khai Chi Tiết (4 Phases)

### 🔹 Phase 1: Nền Tảng Theme Engine Đa Quốc Gia & Lễ Hội (`uiThemes.js` & `uiPreferences.js`)
- **Nhiệm vụ:**
  1. Tạo `src/lib/uiThemes.js` phân loại danh mục:
     - `SEASONAL_THEMES`: Tết Cổ Truyền 🧧, Giáng Sinh 🎄, Halloween 🎃, Trung Thu 🥮, Mùa Hè ☀️.
     - `COUNTRY_THEMES`: Việt Nam Tinh Hoa 🇻🇳, Japan Sakura 🇯🇵, Korea K-Beauty 🇰🇷, US Metropolitan 🇺🇸.
     - `BUSINESS_THEMES`: Rose Luxury 🌸, Royal Gold 👑, Zen Emerald 🌿, Ocean Sapphire 💎, Midnight Obsidian 🌌, Minimalist Crystal 🤍.
  2. Tạo hàm `getSuggestedThemes(branchCountry)` tự động đưa các chủ đề phù hợp với quốc gia của chi nhánh lên đầu.
  3. Bổ sung hỗ trợ lưu theo `branchId` vào `src/lib/uiPreferences.js`.
  4. Tạo hiệu ứng hạt lễ hội vi mô nhẹ nhàng bằng CSS thuần (ví dụ: cánh hoa mai/đào rơi nhẹ ngày Tết hoặc tuyết rơi đêm Noel) không gây lag máy.
- **Phân công:** `frontend-specialist`.

### 🔹 Phase 2: Giao Diện Tab Cài Đặt Nâng Cao (`AppearanceWidgetsTab.jsx`)
- **Nhiệm vụ:**
  1. Thêm tab `appearance` vào `Settings.jsx`.
  2. Xây dựng bộ lọc 3 danh mục: `[🏮 Sự Kiện & Lễ Hội]`, `[🌏 Theo Quốc Gia]`, `[💇 Mô Hình Tiệm]`.
  3. Tạo nút chuyển đổi phạm vi: **"Chỉ áp dụng cho Chi nhánh này"** vs **"Áp dụng toàn chuỗi"**.
  4. Hiển thị badge cờ quốc gia (🇻🇳, 🇯🇵, 🇰🇷, 🇺🇸) và nút 1-chạm áp dụng chủ đề.
  5. Bộ điều khiển chi tiết: Bật/tắt kính mờ, bật/tắt hạt lễ hội, quản lý danh sách widget Dashboard.
- **Phân công:** `frontend-specialist`.

### 🔹 Phase 3: Dashboard Động Theo Chủ Đề Lễ Hội & Quốc Gia
- **Nhiệm vụ:**
  1. Xây dựng các Widget độc lập phong cách kính mờ:
     - `KPIStatCardWidget.jsx`
     - `UpcomingAppointmentsWidget.jsx`
     - `RevenueChartWidget.jsx`
     - `RoomOccupancyWidget.jsx` (Sơ đồ giường phòng)
     - `TopRevenueRankingsWidget.jsx`
  2. Cập nhật `Dashboard.jsx` tự động nạp màu sắc, gradient, hạt hiệu ứng và bố cục widget tương ứng với chủ đề của chi nhánh đang chọn.
  3. Thêm banner chúc mừng lễ hội tinh tế trên đầu Dashboard (ví dụ: *"🌸 Chúc mừng năm mới - Xuân Giáp Thìn"* khi bật chủ đề Tết).
- **Phân công:** `frontend-specialist`.

### 🔹 Phase 4: Đồng Bộ Supabase Cloud & Kiểm Thử Toàn Diện
- **Nhiệm vụ:**
  1. Lưu cấu hình theo từng `branch_id` trong Supabase table `branches` (cột `ui_settings`).
  2. Đảm bảo khi chuyển đổi giữa Chi nhánh Việt Nam và Chi nhánh nước ngoài trên thanh TopBar, giao diện tự động đổi chủ đề tương ứng trong nháy mắt.
  3. Chạy `npm run build` và kiểm tra toàn diện.
- **Phân công:** `frontend-specialist` & `backend-specialist`.

---

## 🧪 6. Tiêu Chí Kiểm Thử & Nghiệm Thu (Verification Checklist)

- [x] **Chủ Đề Sự Kiện & Lễ Hội Trong Năm:**
  - [x] Chọn Tết Cổ Truyền 🧧: Giao diện chuyển sang tone Đỏ May Mắn & Vàng Hoàng Kim sang trọng, hiệu ứng kính mờ ấm cúng.
  - [x] Chọn Giáng Sinh 🎄: Tone Đỏ Rượu Vang & Xanh Thông, kính mờ sương tuyết.
  - [x] Chọn Halloween 🎃: Tone Cam Bí Ngô & Đen Khói neon phá cách.
- [x] **Chủ Đề Bản Sắc Quốc Gia & Đa Chi Nhánh:**
  - [x] Chi nhánh Việt Nam: Gợi ý và nhận diện chủ đề Tết 🇻🇳 & Việt Nam Tinh Hoa.
  - [x] Đổi chi nhánh trên TopBar: Giao diện tự động chuyển đúng chủ đề đã cài đặt cho chi nhánh đó.
  - [x] Tùy chọn phạm vi: Cho phép cài đặt riêng cho 1 chi nhánh hoặc áp dụng chung cho cả chuỗi.
- [x] **Hiệu Ứng Kính Mờ Chuẩn iOS:**
  - [x] Mọi thẻ widget hiển thị hiệu ứng `backdrop-filter: blur`, bo góc Apple mềm mại, tương tác mượt mà.
- [x] **Khôi Phục Mặc Định & An Toàn:**
  - [x] 1-Click khôi phục về chủ đề mặc định ban đầu.
  - [x] 0 lỗi console, vượt qua kiểm tra typecheck và ESLint 100%.
