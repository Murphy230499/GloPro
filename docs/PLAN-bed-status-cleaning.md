# Kế hoạch & Đặc tả Thiết kế Chi tiết: Hệ thống Giường Phòng (Status, Hover Card, Nhận khách Gói/Liệu trình & Thanh toán)

> **Mã kế hoạch:** `docs/PLAN-bed-status-cleaning.md`  
> **Cập nhật:** 30/09/2026 (Đã tích hợp Mockup hình ảnh & Đặc tả từ Người dùng)  
> **Trạng thái:** Sẵn sàng triển khai (Ready for Implementation)

---

## 1. Phân tích Chi tiết Mockup từ Người dùng

Từ hình ảnh mockup thực tế ([media_1790763086843.png](file:///Users/minhthu/.gemini/antigravity-ide/brain/b5f9e2e8-d137-4d04-b5b4-5b40e6e1270d/.user_uploaded/media_1790763086843.png)), tính năng gồm 4 khối chức năng chính:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ TOP ROW: POPUP THÔNG TIN KHI HOVER VÀO TỪNG VỊ TRÍ (Hover Card Popover)                │
│                                                                                        │
│ [CHỜ PHỤC VỤ]         [ĐẶT TRƯỚC]         [SẮP TRỐNG]         [ĐANG BẬN]       [QUÁ GIỜ]  │
│ ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐  ┌──────┐ │
│ │🚪 Phòng 1|G1   │  │🚪 Phòng 1|G1   │  │🚪 Phòng 1|G1   │  │🚪 Phòng 1|G1 │  │...   │ │
│ │👤 Hoàng Yến    │  │👤 Hoàng Yến    │  │👤 Hoàng Yến    │  │👤 Hoàng Yến  │  │      │ │
│ │✂️ Cắt tóc nữ   │  │✂️ Cắt tóc nữ   │  │✂️ Cắt tóc nữ   │  │✂️ Cắt tóc nữ │  │      │ │
│ │  Minh Tú 300k  │  │  Minh Tú 300k  │  │  Minh Tú 300k  │  │  Minh Tú 300k│  │      │ │
│ │⏱️ Bắt đầu-Xong  │  │⏱️ Bắt đầu-Xong  │  │⏱️ Bắt đầu-Xong  │  │⏱️ Bắt đầu-Xong│  │      │ │
│ │📊 Progress Bar │  │📊 Progress Bar │  │📊 Progress Bar │  │📊 Progress Bar│  │      │ │
│ │[Chuyển][Bắt đầu│  │[Chuyển][Bắt đầu│  │[Chuyển][Thanh  │  │[Chuyển][Thanh│  │      │ │
│ │ phục vụ][Trả]  │  │ phục vụ][Trả]  │  │ toán]  [Trả]   │  │ toán]  [Trả] │  │      │ │
│ └────────────────┘  └────────────────┘  └────────────────┘  └──────────────┘  └──────┘ │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ BOTTOM ROW: MODAL "NHẬN KHÁCH" (Quick Assign Bed Modal)                                │
│                                                                                        │
│ 1. Tìm kiếm / Chọn khách hàng + Nút "+ Thêm nhanh"                                     │
│ 2. Chọn dịch vụ lẻ & KTV (Dropdowns) + Nút "+" thêm dòng                               │
│ 3. [MỚI] Nút "Dùng Gói / Liệu trình đã mua" (Tích hợp PackageUsageModal như ở POS)     │
│ 4. Khung thời gian: [Giờ vào: 08:00]  [Kết thúc: 10:00] (Tính tự động)                 │
│ 5. Footer Actions:                                                                     │
│    - [Huỷ bỏ]                                                                          │
│    - [Chờ phục vụ] (Nút xanh dương: xếp vào giường, khách chờ, chưa bấm giờ làm)       │
│    - [Bắt đầu phục vụ] (Nút xanh lá: xếp vào giường và bấm giờ bắt đầu làm ngay)       │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Đặc tả Kỹ thuật Từng Thành phần

### 2.1. Popup Hover Thông tin Vị trí (BedHoverCard)
- **Kích hoạt:** Khi di chuột (`onMouseEnter`) vào thẻ giường bất kỳ trên sơ đồ, popup thông tin chi tiết hiển thị mượt mà ngay cạnh hoặc trên thẻ giường (với `onMouseLeave` có độ trễ 200ms để người dùng có thể lướt chuột vào popup bấm các nút action mà không bị tắt đột ngột).
- **Cấu trúc nội dung:**
  1. **Header:**
     - Icon giường/phòng + `Phòng X | Giường Y`.
     - Badge trạng thái góc phải:
       - `CHỜ PHỤC VỤ` (Blue badge)
       - `ĐẶT TRƯỚC` (Amber-yellow badge)
       - `SẮP TRỐNG` (Amber-orange badge)
       - `ĐANG BẬN` (Red badge)
       - `QUÁ GIỜ` (Purple badge)
       - `ĐANG DỌN DẸP` (Purple-cyan badge)
  2. **Khách hàng:**
     - Avatar tròn của khách.
     - Tên khách hàng (chữ đậm).
     - SĐT + Ngày sinh (VD: `0985667845  02/12/1999`).
  3. **Danh sách Dịch vụ đang phục vụ:**
     - Tên dịch vụ + Giá tiền (VND format, hoặc `0đ (Gói/Liệu trình)`).
     - Tên Kĩ thuật viên phụ trách (kèm avatar nhỏ nếu có).
  4. **Thời gian & Tiến độ:**
     - `Bắt đầu: HH:mm` | `Kết thúc: HH:mm`.
     - `Đã qua: X phút` | `Y% (Z phút)` hoặc `100% (quá M phút)`.
     - Thanh Progress bar bo tròn với màu sắc đồng bộ trạng thái.
  5. **Thanh Thao tác (Action Buttons Footer):**
     - Nút 1: `[Chuyển phòng]` (viền xanh / text xanh dương).
     - Nút 2 (Chính):
       - Nếu đang `CHỜ PHỤC VỤ` hoặc `ĐẶT TRƯỚC`: `[Bắt đầu phục vụ]` (nền xanh lá / text trắng).
       - Nếu đang `SẮP TRỐNG`, `ĐANG BẬN`, `QUÁ GIỜ`: `[Thanh toán]` (nền xanh lá / text trắng - có icon hoá đơn).
       - Nếu đang `ĐANG DỌN DẸP`: `[Xong dọn dẹp]` (nền xanh lá / text trắng).
     - Nút 3: `[Trả phòng]` (viền đỏ / text đỏ).

---

### 2.2. Modal "Nhận khách" Nâng cấp (Gói & Liệu trình)
- **Chọn khách hàng:**
  - Ô tìm kiếm khách hàng nhanh (hỗ trợ tìm theo tên, số điện thoại).
  - Nút `+ Thêm nhanh` nếu là khách mới.
- **Chọn dịch vụ:**
  - **Dịch vụ lẻ:** Chọn dịch vụ trong danh mục + Chọn KTV tương ứng. Nút `+` thêm dòng dịch vụ.
  - **Gói / Liệu trình đã mua:** Khi chọn một khách hàng đã có tài khoản, hiển thị nút/badge:
    `🎁 Dùng Gói / Liệu trình đã mua (N)`.
    - Khi bấm vào: mở [PackageUsageModal.jsx](file:///Volumes/Coding/GloPro/src/components/pos/PackageUsageModal.jsx) cho phép chọn các buổi còn lại trong gói hoặc liệu trình của khách.
    - Dịch vụ được đưa vào danh sách với giá `0đ` và ghi rõ nguồn gốc `(Gói: ...) / (Liệu trình: ...)`.
- **Khung thời gian:**
  - Ô xanh `Giờ vào: HH:mm` (mặc định giờ hiện tại, có thể sửa).
  - Ô đỏ `Kết thúc: HH:mm` (tự động tính = Giờ vào + Tổng thời lượng tất cả dịch vụ).
- **Hành động Xác nhận:**
  - `Huỷ bỏ`
  - `[Chờ phục vụ]`: Lưu phiên ở trạng thái `waiting`, chưa kích hoạt đếm ngược thời gian làm, thẻ giường hiển thị màu xanh chờ.
  - `[Bắt đầu phục vụ]`: Lưu phiên ở trạng thái `in_progress`, kích hoạt tính giờ phục vụ ngay.

---

### 2.3. Quy trình "Trả phòng" & "Đang dọn dẹp" (Cleaning Workflow)
1. **Cấu hình thời gian dọn dẹp:**
   - Trong [BedModal.jsx](file:///Volumes/Coding/GloPro/src/components/rooms-beds/BedModal.jsx), thêm trường:
     `Thời gian dọn dẹp (phút)` (Mặc định: `10` phút, cho phép chọn `0, 5, 10, 15, 20, 30` hoặc nhập tùy chỉnh).
   - Lưu vào database `facility` qua [roomBedDbHelper.js](file:///Volumes/Coding/GloPro/src/lib/roomBedDbHelper.js) với tag `__cleaning_time__:<phút>`.
2. **Khi bấm [Trả phòng]:**
   - Đọc cấu hình `cleaning_duration` của giường đó.
   - Nếu `cleaning_duration > 0`:
     - Giường chuyển sang trạng thái `cleaning` (Đang dọn dẹp).
     - Đồng hồ đếm ngược hiển thị thời gian dọn dẹp còn lại.
     - Sau khi hết thời gian dọn dẹp (hoặc khi nhân viên bấm `[Xong dọn dẹp]`), giường tự động chuyển về `available` (Đang trống).
   - Nếu `cleaning_duration === 0`:
     - Giường chuyển ngay lập tức về `available` (Đang trống).

---

### 2.4. Quy trình "Thanh toán" Trực tiếp (Direct POS Invoice)
1. Khi bấm **[Thanh toán]** (trên thẻ giường, hover popup hoặc drawer):
   - Mở trực tiếp [POSInvoiceModal.jsx](file:///Volumes/Coding/GloPro/src/components/POSInvoiceModal.jsx).
   - Truyền sẵn dữ liệu:
     - `customer`: Đối tượng khách hàng đang ngồi giường đó.
     - `initialCart`: Chuyển đổi danh sách dịch vụ của giường (bao gồm dịch vụ lẻ, dịch vụ trong gói `customer_package_id`, dịch vụ trong liệu trình `customer_treatment_id`, KTV phụ trách `staff_id`, và `facility_id` của giường).
2. Khi thanh toán hoàn tất trên modal:
   - Tự động kích hoạt quy trình Trả phòng cho giường đó (chuyển sang `cleaning` nếu có thời gian dọn dẹp, hoặc mở trống giường).

---

### 2.5. Chức năng "Chuyển phòng / Chuyển giường" (Bed Transfer)
- Khi bấm **[Chuyển phòng]**:
  - Mở hộp thoại nhanh hiển thị danh sách các giường đang trống hiện có trong salon.
  - Người dùng chọn phòng và giường mới -> Hệ thống tự động chuyển toàn bộ thông tin phiên khách sang giường mới và giải phóng giường cũ (có kích hoạt dọn dẹp nếu muốn).

---

## 3. Danh sách Công việc Triển khai (WBS)

### Bước 1: Mở rộng [roomBedDbHelper.js](file:///Volumes/Coding/GloPro/src/lib/roomBedDbHelper.js)
- Thêm `cleaning_duration` vào `parseBedFromFacility` và `encodeBedToFacility`.

### Bước 2: Nâng cấp [BedModal.jsx](file:///Volumes/Coding/GloPro/src/components/rooms-beds/BedModal.jsx)
- Bổ sung ô cấu hình "Thời gian dọn dẹp (phút)".

### Bước 3: Nâng cấp [QuickAssignBedModal.jsx](file:///Volumes/Coding/GloPro/src/components/rooms-beds/QuickAssignBedModal.jsx)
- Thêm nút "Dùng Gói / Liệu trình đã mua" tích hợp [PackageUsageModal.jsx](file:///Volumes/Coding/GloPro/src/components/pos/PackageUsageModal.jsx).
- Bổ sung 2 nút hành động: `[Chờ phục vụ]` và `[Bắt đầu phục vụ]`.

### Bước 4: Tạo Component [BedHoverCard.jsx](file:///Volumes/Coding/GloPro/src/components/rooms-beds/BedHoverCard.jsx)
- Thiết kế Floating Popover đúng 100% theo mockup cho cả 6 trạng thái:
  - Chờ phục vụ, Đặt trước, Sắp trống, Đang bận, Quá giờ, Đang dọn dẹp.
  - Đầy đủ avatar, tên khách, SĐT, ngày sinh, dịch vụ kèm giá & KTV, timeline, progress bar, và các action tương ứng.

### Bước 5: Cập nhật [RoomsBeds.jsx](file:///Volumes/Coding/GloPro/src/views/RoomsBeds.jsx)
- Tích hợp `BedHoverCard` vào thẻ giường.
- Tích hợp mở [POSInvoiceModal.jsx](file:///Volumes/Coding/GloPro/src/components/POSInvoiceModal.jsx) khi bấm "Thanh toán".
- Xử lý logic "Trả phòng" -> "Đang dọn dẹp" -> "Đang trống".
- Xử lý modal "Chuyển phòng / Chuyển giường".

---

## 4. Kế hoạch Kiểm thử & Bàn giao
- Kiểm tra hover card mượt mà, không giật lag, click các nút action chính xác.
- Kiểm tra xếp khách bằng dịch vụ lẻ + dịch vụ trong gói/liệu trình.
- Kiểm tra thanh toán tạo hoá đơn POS tự động điền đúng toàn bộ dịch vụ và khách.
- Chạy `npm run build` đảm bảo không lỗi cú pháp.
