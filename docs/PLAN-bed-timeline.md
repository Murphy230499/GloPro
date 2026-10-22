# Kế hoạch Triển khai: Chế độ Xem Timeline Giường Phòng (Bed Timeline View)

> **Mã công việc:** `PLAN-bed-timeline`  
> **Module ảnh hưởng:** `src/views/RoomsBeds.jsx`, `src/components/rooms-beds/`  
> **Mục tiêu:** Bổ sung giao diện Dòng thời gian (Timeline View) cho phân hệ Sơ đồ vị trí Giường/Phòng, hợp nhất hiển thị đồng thời cả khách đặt trước (Appointments) và khách đến trực tiếp / vãng lai (Walk-in / Direct check-in), cho phép theo dõi chi tiết Giờ bắt đầu, Giờ kết thúc, Khách hàng, Kỹ thuật viên và Dịch vụ trên từng giường.

---

## 1. Phân tích hiện trạng & Kiến trúc giải pháp

### 1.1 Hiện trạng
- Tab **Sơ đồ vị trí** (`RoomsBeds.jsx` -> `activeTab === 'diagram'`) hiện hiển thị dạng thẻ lưới (Grid) phân theo phòng, chỉ thể hiện trạng thái tức thời tại thời điểm thực (Trống, Đang làm, Cần dọn, Bảo trì).
- Tab **Lịch hẹn Timeline** (`AppointmentTimelineView.jsx`) có trục thời gian theo Giường (`targetEntity === 'facility'`), tuy nhiên chỉ lọc từ bảng `appointments` của lịch hẹn, chưa tích hợp các phiên phục vụ khách vãng lai/trực tiếp phát sinh tại quầy hoặc qua nút "Gán nhanh giường".
- Dữ liệu khách vãng lai và phiên đang phục vụ trực tiếp hiện được quản lý qua `gp_active_bed_sessions` (`bedSessions`), lưu trữ thông tin `customer`, `services`, `staff`, `start_time`, `end_time`.

### 1.2 Giải pháp thiết kế
- Bổ sung nút chuyển đổi hiển thị (View Switcher) ngay tại toolbar Sơ đồ vị trí:
  - `[Sơ đồ lưới / Grid Card]` (Giao diện hiện tại)
  - `[Dòng thời gian / Timeline]` (Giao diện mới)
- **Quyết định thiết kế đã xác nhận (Confirmed Design Decisions):**
  1. **Vị trí nút chuyển:** Nút chuyển chế độ `[Lưới ⊞ | Timeline ⏱]` dạng Segmented Control đặt ngay trên thanh công cụ của tab Sơ đồ vị trí.
  2. **Khung giờ hiển thị:** Cố định theo giờ mở cửa chuẩn của salon từ **07:00 đến 22:00** (giúp giao diện tối ưu bề ngang, tránh khoảng trống lãng phí lúc đóng cửa).
  3. **Tương tác slot trống:** Khi bấm vào khoảng trống bất kỳ trên timeline của giường, tự động mở modal **Gán nhanh giường (Quick Assign)** với giường và giờ bắt đầu tương ứng được điền sẵn.
- Xây dựng component mới: `src/components/rooms-beds/BedTimelineView.jsx`:
  - **Trục dọc (Y-Axis):** Danh sách Giường phân nhóm theo Từng phòng (hoặc lọc theo Phòng/Chi nhánh).
  - **Trục ngang (X-Axis):** Trục thời gian trong ngày (khung giờ hoạt động salon, ví dụ: 07:00 – 22:00, bước nhảy 30 phút, có vạch đỏ thời gian thực).
  - **Data Merging Layer:** Hợp nhất 2 nguồn dữ liệu trong ngày:
    1. Lịch hẹn đã đặt có chỉ định giường (`appointments` matching `facility_id` / `bed_id`).
    2. Khách vãng lai / trực tiếp (`bedSessions` & active/completed sessions).
  - **Khối sự kiện (Timeline Blocks):** Thể hiện rõ:
    - Badge nguồn khách: `[Lịch hẹn]` (xanh dương/tím) vs `[Trực tiếp / Vãng lai]` (cam/emerald).
    - Tên khách hàng & SĐT.
    - Kỹ thuật viên (Staff) & Avatar.
    - Tên dịch vụ & Thời lượng.
    - Khung giờ (Start – End).
    - Trạng thái (Đang thực hiện, Quá giờ, Sắp tới, Hoàn tất).
  - **Tương tác trực quan:**
    - Click vào block sự kiện -> Mở Drawer chi tiết (`BedDetailDrawer`) hoặc chuyển hướng nhanh đến POS thanh toán.
    - Click vào slot trống -> Mở modal `QuickAssignBedModal` với giường và giờ đã chọn sẵn.

---

## 2. Danh sách công việc (Task Breakdown)

- [x] **Task 1: Xây dựng hàm hợp nhất dữ liệu sự kiện giường (Bed Timeline Events Aggregator)**
  - Tệp: `src/lib/bedTimelineHelper.js`
  - Kết quả: Đã hoàn thành logic gộp danh sách lịch hẹn (`appointments`) và các phiên khách vãng lai (`bedSessions` / `bed_logs`), chuẩn hóa thành cấu trúc `BedTimelineEvent` với tính toán `start_minutes`, `duration_minutes` và vị trí CSS.

- [x] **Task 2: Xây dựng Component `BedTimelineView.jsx`**
  - Tệp: `src/components/rooms-beds/BedTimelineView.jsx`
  - Kết quả: Đã xây dựng hoàn chỉnh giao diện Timeline với cột cố định Phòng & Giường bên trái (240px), trục ngang thời gian salon 07:00 – 22:00, cuộn đồng bộ, vạch đỏ thời gian thực và các khối sự kiện thẻ bài trực quan.

- [x] **Task 3: Tích hợp View Switcher & Bộ lọc ngày vào `RoomsBeds.jsx`**
  - Tệp: `src/views/RoomsBeds.jsx`
  - Kết quả: Đã tích hợp nút chuyển đổi Segmented Control `[Sơ đồ lưới ⊞ | Timeline giường ⏱]` ngay trên thanh điều hướng tab, thanh chọn ngày (Hôm nay / Trước / Sau / Date Picker) và dropdown Lọc theo phòng.

- [x] **Task 4: Xây dựng tương tác Click & Hover Card trên Timeline**
  - Tệp: `src/components/rooms-beds/BedTimelineView.jsx`
  - Kết quả: Click vào block khách đang phục vụ mở ngay `BedDetailDrawer` (chi tiết, đổi giường, thanh toán POS); click vào slot thời gian trống của giường tự động mở `QuickAssignBedModal` tiếp nhận khách; hover hiển thị popover thông tin chi tiết.

- [x] **Task 5: Xử lý các trường hợp biên (Edge Cases) & Tối ưu hiển thị**
  - Tệp: `src/components/rooms-beds/BedTimelineView.jsx`, `src/lib/bedTimelineHelper.js`
  - Kết quả: Đã xử lý phân biệt trực quan Khách đặt trước (`[Lịch hẹn]`, thẻ viền xanh sky) vs Khách vãng lai (`[Vãng lai]`, thẻ viền xanh emerald), hiệu ứng cảnh báo ca làm quá giờ (`Overtime`), tự động cuộn đến khung giờ hiện tại khi tải trang.

- [x] **Task 6: Kiểm thử tổng thể & Đánh giá UX (Verification & Audit)**
  - Tệp: Toàn bộ module Rooms & Beds
  - Kết quả: `npm run typecheck` chạy qua không lỗi; Next.js dev server biên dịch thành công HTTP 200 OK trên `/rooms-beds`.

---

## 3. Tiêu chí hoàn thành (Done When)

- [x] Người dùng có thể chuyển đổi linh hoạt giữa chế độ **Sơ đồ lưới (Grid)** và **Dòng thời gian (Timeline)** ngay trong phần Sơ đồ vị trí của trang Giường & Phòng.
- [x] Timeline hiển thị đầy đủ và rõ ràng: Giờ bắt đầu, Giờ kết thúc, Tên khách hàng, Tên KTV thực hiện, Tên dịch vụ trên từng giường.
- [x] Phân biệt trực quan rõ ràng giữa khách đặt trước qua lịch hẹn (`Appointment`) và khách đến trực tiếp / vãng lai (`Walk-in`).
- [x] Bấm vào block mở được chi tiết / thao tác tiếp nhận / POS; bấm vào slot trống cho phép gán khách nhanh vào giường.
- [x] Hoàn toàn tương thích với hệ thống phân quyền chi nhánh và đa ngôn ngữ hiện tại của GloPro.
