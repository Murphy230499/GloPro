# Kế hoạch phát triển chi tiết: Module Quản lý Giường / Phòng (Bed & Room Management)

## 1. Mục tiêu & Phạm vi phát triển
Xây dựng module **Quản lý Giường / Phòng** chuyên biệt cho salon/spa, đáp ứng đầy đủ các yêu cầu theo mockup và các quyết định thiết kế đã thống nhất với người dùng:

1. **Sơ đồ vị trí (Live Tracking)**:
   - Theo dõi trạng thái thời gian thực của từng giường:
     - 🟢 **Đang trống**: Sẵn sàng đón khách.
     - 🔴 **Đang bận**: Đang phục vụ khách (hiển thị tên khách, giờ bắt đầu, giờ kết thúc, thời gian đã qua, thanh % tiến độ).
     - 🟡 **Sắp trống**: Tự động chuyển màu vàng/cam khi thời gian phục vụ còn lại **<= 10 phút**.
   - Công thức tính thời gian:
     - `Thời gian ra (Kết thúc) = Thời điểm Bắt đầu phục vụ (Check-in) + Tổng thời lượng các dịch vụ`.
     - `Thời gian đã qua = Hiện tại - Thời điểm Bắt đầu`.
     - `Tiến độ (%) = (Thời gian đã qua / Tổng thời lượng) * 100%`.
   - Cơ chế kích hoạt:
     - Nút **"Bắt đầu phục vụ"** trực tiếp trên thẻ giường hoặc popup xếp giường.
     - Đồng bộ với trạng thái `checked_in` / `in_progress` của Lịch hẹn.
   - Thao tác tương tác trực tiếp:
     - **Click Giường trống**: Mở popup nhanh "Nhận khách / Xếp vào giường này" (tự động gán giường, chọn khách, dịch vụ, KTV và bắt đầu phục vụ).
     - **Click Giường bận**: Mở Right Slide-over Drawer xem chi tiết đầy đủ (Avatar khách, SĐT, ngày sinh, danh sách dịch vụ kèm giá & KTV, thanh thời gian, nút Hoàn thành / Thanh toán sang POS).

2. **Cài đặt vị trí (Quản lý Danh mục Giường & Phòng)**:
   - Bảng danh sách hiển thị: Giường, Phòng, Dịch vụ áp dụng, nút Sửa & Xoá, kèm phân trang.
   - **Modal Thêm phòng**: Nhập tên phòng (`name`).
   - **Modal Thêm vị trí / Chỉnh sửa vị trí**:
     - Tên giường / vị trí (*).
     - Dropdown chọn Phòng (*).
     - Popup Multi-select Dịch vụ áp dụng (*) có ô tìm kiếm và nhóm theo danh mục.
     - Switch bật/tắt **"Cho phép đặt trùng lịch"**.
     - Xử lý khi tắt trùng lịch: **Cảnh báo xung đột (Conflict Warning)** khi chọn giường đã có khách trùng giờ, nhưng vẫn cho phép linh hoạt xác nhận nếu muốn.
   - **Modal Xác nhận xoá vị trí**: Hộp thoại cảnh báo huỷ an toàn.

3. **Tích hợp đa chiều (Lịch hẹn & Thu ngân POS)**:
   - **Tại Lịch hẹn (`/appointments`)**:
     - Trong modal "Đặt lịch hẹn": Mỗi dòng dịch vụ của Khách #1, Khách #2... có ô chọn Vị trí (Giường/Phòng) trực quan.
     - Trên màn hình Lịch hẹn: Tab chuyển đổi `[View khách hàng] [View nhân viên] [View vị trí]`. Chế độ `View vị trí` hiển thị các cột theo từng Phòng / Giường và lưới thời gian dọc kèm vạch thời gian hiện tại màu đỏ.
   - **Tại Thu ngân (`/pos` & `POSInvoiceModal.jsx`)**:
     - Trên từng dịch vụ trong hoá đơn / giỏ hàng POS, bổ sung ô gán Vị trí (Giường/Phòng) để thu ngân có thể xếp giường ngay khi khách vào làm trực tiếp.

4. **Cam kết tuân thủ hệ thống**:
   - Tuyệt đối không thay đổi layout hoặc làm ảnh hưởng UI/UX của các trang hiện hữu.
   - Tái sử dụng trọn vẹn Design System của ứng dụng: Lucide icons, Sonner toast, Tailwind tokens, Avatar, modal backdrop, switch, custom-scrollbar.

---

## 2. Kiến trúc Dữ liệu & Database Schema

### 2.1 Bảng `room` (Phòng)
```sql
CREATE TABLE IF NOT EXISTS public.room (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    branch_id UUID,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.2 Bảng `facility` (Giường / Vị trí)
```sql
CREATE TABLE IF NOT EXISTS public.facility (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    room_id UUID REFERENCES public.room(id) ON DELETE SET NULL,
    branch_id UUID,
    applicable_services TEXT[] DEFAULT '{}',
    allow_overlap BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.3 Mở rộng thực thể `Appointment` & `Invoice`
- `facility_id`: UUID
- `room_id`: UUID
- `checkin_time`: TIMESTAMPTZ / TEXT (Mốc bắt đầu phục vụ thực tế)
- `services`: Mỗi item lưu `{ service_id, staff_id, facility_id, price, duration }`
- Giỏ hàng hoá đơn POS (`invoice.items`): Lưu thêm trường `facility_id` và `facility_name` trên từng dịch vụ.

---

## 3. Danh sách Công việc triển khai (Work Breakdown Structure)

### Giai đoạn 1: Database & Client API Adapters
- [ ] Tạo file migration `supabase/migrations/0120_room_and_facility_enhancements.sql`.
- [ ] Cập nhật `src/api/supabaseClient.js`:
  - Thêm `Room: createEntityAdapter('room')`.
  - Tối ưu `Facility: createEntityAdapter('facility')` hỗ trợ lọc theo `branch_id`, `room_id`.
  - Hỗ trợ fallback mượt mà nếu bảng chưa được migrate trên môi trường người dùng.

### Giai đoạn 2: Module Cài đặt Giường / Phòng (Tab "Cài đặt vị trí")
- [ ] Thêm mục **Giường / Phòng** vào menu điều hướng `NAV` trong `src/components/Layout.jsx`.
- [ ] Tạo route `src/app/(protected)/rooms-beds/page.jsx` và View `src/views/RoomsBeds.jsx`.
- [ ] Xây dựng giao diện Tab 2 ("Cài đặt vị trí"):
  - Bảng danh sách Giường, Phòng, Dịch vụ áp dụng, Sửa, Xoá kèm phân trang.
  - Modal "Thêm phòng" (`RoomModal`).
  - Modal "Thêm vị trí" / "Chỉnh sửa vị trí" (`BedModal`) kèm switch "Cho phép đặt trùng lịch".
  - Popup chọn dịch vụ áp dụng đa tầng (Grouped Category, Tìm kiếm, Checkbox Tất cả dịch vụ).
  - Modal cảnh báo xác nhận xoá vị trí.

### Giai đoạn 3: Sơ đồ vị trí & Live Tracking (Tab "Sơ đồ vị trí")
- [ ] Xây dựng giao diện Tab 1 ("Sơ đồ vị trí"):
  - Thanh chú thích Legend: Đang trống (🟢), Đang bận (🔴), Sắp trống (🟡).
  - Lưới card giường phân nhóm theo Phòng (Phòng 1, Phòng 2...).
  - Thẻ giường (Bed Card):
    - Đang trống: Hiển thị "Sẵn sàng đón khách", nút hoặc click để nhận khách.
    - Đang bận: Hiển thị Khách hàng, Giờ vào, Giờ ra, Thời gian đã qua, Thanh % tiến độ.
    - Sắp trống: Tự động đổi style khi thời gian còn lại `<= 10 phút`.
- [ ] Tích hợp đồng hồ thời gian thực (Live timer tick mỗi 30s) tự động tính toán lại thời gian đã qua, % tiến độ và chuyển trạng thái thẻ giường.
- [ ] Xây dựng Slide-over Drawer chi tiết giường:
  - Header tên giường + badge trạng thái.
  - Thông tin khách hàng (Avatar, Họ tên, SĐT, Ngày sinh).
  - Chi tiết từng dịch vụ, giá tiền, nhân viên phụ trách.
  - Tiến độ thời gian trực quan.
  - Các action: "Bắt đầu phục vụ", "Hoàn thành", "Thanh toán (chuyển sang POS)".
- [ ] Xây dựng Modal "Xếp khách vào giường" khi click vào giường trống.

### Giai đoạn 4: Tích hợp với Lịch Hẹn (Appointments)
- [ ] Cập nhật `src/components/AppointmentModal.jsx`:
  - Thêm ô chọn Giường / Phòng cho từng dịch vụ của Khách #1, Khách #2...
  - Kiểm tra điều kiện `allow_overlap` và hiển thị cảnh báo nhẹ nếu giường đã có người đặt trong cùng khung giờ.
- [ ] Cập nhật `src/components/appointments/AppointmentHeader.jsx` & `src/views/Appointments.jsx`:
  - Bổ sung nút chọn chế độ xem `View vị trí` bên cạnh `View khách hàng` và `View nhân viên`.
- [ ] Cập nhật Timeline/Calendar view:
  - Khi chọn `View vị trí`: Hiển thị các cột theo "Chưa xếp vị trí", "Phòng 1", "Phòng 2"...
  - Hiển thị card lịch hẹn theo đúng cột giường và khung giờ.

### Giai đoạn 5: Tích hợp với Thu Ngân POS (`/pos` & `POSInvoiceModal.jsx`)
- [ ] Trong `src/views/POS.jsx` và `POSInvoiceModal.jsx`: Bổ sung chọn Giường / Vị trí cho từng dòng dịch vụ trong giỏ hàng.
- [ ] Khi lập hoá đơn dịch vụ tại quầy, vị trí được lưu vào hoá đơn và tự động kích hoạt trạng thái "Đang bận" cho giường tương ứng trên Sơ đồ vị trí.

### Giai đoạn 6: Kiểm thử toàn diện & Verification
- [ ] Kiểm thử tạo mới Phòng và tạo Giường gán vào Phòng.
- [ ] Kiểm thử gán Dịch vụ áp dụng và bật/tắt Cho phép đặt trùng lịch.
- [ ] Kiểm thử xếp khách từ Sơ đồ vị trí, từ Lịch hẹn, và từ Thu ngân POS.
- [ ] Kiểm thử công thức tính giờ vào, giờ ra và ngưỡng 10 phút chuyển sang "Sắp trống".
- [ ] Kiểm thử responsive trên các kích thước màn hình.
- [ ] Rà soát lại tất cả các trang khác để cam đoan 100% không ảnh hưởng UI hiện tại.
