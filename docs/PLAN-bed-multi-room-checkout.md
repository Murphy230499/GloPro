# Kế hoạch phát triển: Quản lý Luồng Khách Đa Phòng & Gom Chung Hoá Đơn POS
*(Multi-Room Guest Journey & Single Consolidated Invoice)*

---

## 1. Bối cảnh & Quyết định Nghiệp vụ (Business Decisions)

Trong mô hình thẩm mỹ viện, spa và salon thực tế, một khách hàng thường trải qua một **chuỗi dịch vụ liên hoàn (Customer Service Journey)** tại nhiều khu vực chức năng khác nhau trong cùng một buổi ghé tiệm:
* **Ví dụ thực tế**:
  1. *Bước 1 - Phòng Gội (Giường 1)*: Gội đầu dưỡng sinh & thư giãn cổ vai gáy (KTV Lan Anh - 45 phút).
  2. *Bước 2 - Phòng Chăm sóc da (Giường 3)*: Chăm sóc da chuyên sâu & đắp mặt nạ (KTV Minh Châu - 60 phút).
  3. *Bước 3 - Khu Tạo mẫu tóc (Ghế 2)*: Sấy tạo kiểu tóc & phục hồi Nano (KTV Tuấn Kiệt - 30 phút).

### Các quyết định thiết kế đã thống nhất (Socratic Gate Decisions):
1. **Liên kết Lượt phục vụ (Master Session / Visit ID)**:
   - Hệ thống hỗ trợ cả 2 luồng:
     - **Chuyển tiếp giường (Bed Transfer)**: Nút "Chuyển sang giường khác" trong Drawer chi tiết của giường -> Chọn giường đích -> Giường cũ được trả trống ngay, khách và toàn bộ dịch vụ đã làm được chuyển sang giường mới.
     - **Tự động nhận diện gộp lượt (Auto Merge)**: Khi mở modal nhận khách vào giường mới, nếu chọn khách hàng đang có giường/dịch vụ đang chạy, hệ thống sẽ hiện thông báo: *"Khách hàng đang có dịch vụ tại [Giường X - Phòng Y]. Tự động liên kết vào chung lượt phục vụ của khách?"* và gộp các dịch vụ vào chung 1 Master Session.
2. **Cơ chế Gom Bill Đẩy Ra Thu Ngân (Consolidated POS Checkout)**:
   - Khi bấm "Thanh toán POS" ở **bất kỳ giường nào** của khách, hệ thống sẽ tự động quét và gom **toàn bộ các dịch vụ** mà khách đã làm hoặc đang làm ở tất cả các phòng/giường trong lượt này.
   - Trên từng dòng dịch vụ trong giỏ hàng POS sẽ hiển thị nhãn phụ rõ ràng: **Tên phòng, tên giường & KTV thực hiện** (đảm bảo tính hoa hồng chính xác cho từng KTV ở từng khu vực).
3. **Giải phóng giường sau khi Thanh toán (Auto Bed Release)**:
   - Ngay khi thu ngân bấm in hoá đơn / hoàn tất thanh toán cho khách trên POS, hệ thống sẽ tự động phát tín hiệu giải phóng tất cả các giường liên quan đến Master Session của khách đó về trạng thái **Đang trống (Available)**.

---

## 2. Thiết kế Kiến trúc Dữ liệu (Data Architecture)

### 2.1 Cấu trúc Dữ liệu `Master Session` (Lượt phục vụ)
Thay vì các phiên giường hoạt động hoàn toàn cô lập, mỗi phiên sẽ gắn với một `master_session_id` (hoặc `visit_id`):

```typescript
interface BedUsageSession {
  id: string;                    // ID phiên tại giường cụ thể
  master_session_id: string;     // ID Lượt phục vụ chung của khách (UUID)
  bed_id: string;                // ID giường hiện tại
  bed_name: string;              // Tên giường
  room_name?: string;            // Tên phòng
  customer: {
    id: string;
    name: string;
    phone?: string;
    avatar_url?: string;
    is_guest?: boolean;
  };
  start_time: string;            // HH:mm
  end_time: string;              // HH:mm
  total_duration_minutes: number;
  status: 'in_progress' | 'nearly_finished' | 'completed';
  services: Array<{
    id?: string;
    service_id: string;
    name: string;
    price: number;
    duration: number;
    staff_id?: string;
    staff_name?: string;
    bed_id: string;
    bed_name: string;
    room_name?: string;
    completed_at?: string;
  }>;
}
```

### 2.2 Storage & State Synchronization
- **Khóa lưu trữ**: `gp_active_bed_sessions_${branchId}` lưu map `bedId -> BedUsageSession`.
- **Cơ chế liên kết nhanh**: Các giường có cùng `master_session_id` hoặc cùng `customer.id` (khác walk_in) sẽ được nhận diện là một cụm.
- **Prefill sang POS**: `sessionStorage.setItem('gp_pos_prefill_session', ...)` sẽ đóng gói danh sách tổng hợp tất cả dịch vụ từ tất cả các giường của khách.
- **Sự kiện thanh toán xong**: Tại `POSInvoiceModal.jsx` (khi tạo invoice thành công), hệ thống phát sự kiện `window.dispatchEvent(new CustomEvent('gp_bed_session_checkout_completed', { detail: { masterSessionId, customerId } }))` để màn hình Sơ đồ vị trí tự động cập nhật ngay lập tức.

---

## 3. Chi tiết Giao diện & Trải nghiệm Người dùng (UI/UX Workflows)

### 3.1 Luồng 1: Xếp khách đang làm sang thêm giường mới (Auto-Merge)
- **Vị trí**: [QuickAssignBedModal.jsx](file:///Volumes/Coding/GloPro/src/components/rooms-beds/QuickAssignBedModal.jsx)
- **Thao tác**:
  1. Lễ tân chọn khách hàng "Nguyễn Thị Mai".
  2. Hệ thống phát hiện khách Mai đang ngồi ở "Giường 1 (Phòng Gội)".
  3. Hiển thị banner thông minh:
     > 💡 *Khách hàng đang có dịch vụ tại **Giường 1 (Phòng Gội)**. Dịch vụ tại giường này sẽ được gộp chung vào cùng hoá đơn khi thanh toán.*
  4. Người dùng bấm nhận khách -> Giường mới được kích hoạt, liên kết chung `master_session_id`.

### 3.2 Luồng 2: Chuyển tiếp giường (Bed Transfer)
- **Vị trí**: [BedDetailDrawer.jsx](file:///Volumes/Coding/GloPro/src/components/rooms-beds/BedDetailDrawer.jsx)
- **Thao tác**:
  1. Khi xem chi tiết giường đang bận, thêm nút hành động **"Chuyển giường / phòng"** cạnh nút "Thanh toán POS".
  2. Bấm vào mở popup nhanh: Chọn phòng & giường trống đích.
  3. Xác nhận chuyển:
     - Giường nguồn lập tức chuyển về **Đang trống**.
     - Giường đích chuyển sang **Đang bận** với toàn bộ thông tin khách & dịch vụ chuyển giao, thời gian bắt đầu được cập nhật theo giường mới.

### 3.3 Luồng 3: Xem tổng quan hành trình khách trên Drawer
- **Vị trí**: [BedDetailDrawer.jsx](file:///Volumes/Coding/GloPro/src/components/rooms-beds/BedDetailDrawer.jsx)
- **Hiển thị**:
  - Nếu khách có làm dịch vụ ở các giường/phòng khác, hiển thị tab nhỏ hoặc danh sách liên kết:
    - `Giường 1 (Phòng Gội)`: Gội đầu dưỡng sinh (45p) • *Đã xong*
    - `Giường 3 (Phòng Da)` *(Hiện tại)*: Đắp mặt nạ Nano (30p) • *Đang làm*
  - Nút **"Thanh toán POS (Gom X dịch vụ)"**: Hiển thị tổng số tiền và số lượng dịch vụ từ tất cả các phòng.

### 3.4 Luồng 4: Đẩy Bill ra Thu ngân POS & Trả phòng tự động
- **Vị trí**: [POS.jsx](file:///Volumes/Coding/GloPro/src/views/POS.jsx) & [POSInvoiceModal.jsx](file:///Volumes/Coding/GloPro/src/components/POSInvoiceModal.jsx)
- **Hiển thị tại POS**:
  - Tải toàn bộ các dịch vụ từ các phòng khác nhau vào cột Order/Ticket.
  - Mỗi dịch vụ hiển thị rõ nhãn nguồn: `[Phòng Da - Giường 3] KTV: Minh Châu`, `[Phòng Gội - Giường 1] KTV: Lan Anh`.
- **Sau khi hoàn tất thanh toán**:
  - Toàn bộ các giường thuộc lượt phục vụ đó tự động được trả trống.
  - Toast thông báo: *"Đã thanh toán hoá đơn và giải phóng các giường liên quan"*.

---

## 4. Kế hoạch Triển khai (Actionable Tasks)

### Phase 1: Mở rộng Model Dữ liệu & Helper Phục vụ Đa Giường
- [ ] **Task 1.1**: Định nghĩa cấu trúc `master_session_id` và hàm helper `findCustomerActiveSessions(sessions, customerId)` trong `src/lib/bedSessionHelpers.js`.
- [ ] **Task 1.2**: Xây dựng hàm `mergeBedSessions(existingSessions, newSession)` và `transferBedSession(fromBedId, toBedId, sessions)`.

### Phase 2: Nâng cấp Drawer Chi Tiết Giường ([BedDetailDrawer.jsx](file:///Volumes/Coding/GloPro/src/components/rooms-beds/BedDetailDrawer.jsx))
- [ ] **Task 2.1**: Bổ sung hiển thị thông tin các dịch vụ liên phòng của cùng một khách hàng (nếu có).
- [ ] **Task 2.2**: Thêm nút & Modal **"Chuyển giường" (Bed Transfer Modal)** cho phép chọn giường trống đích để chuyển khách.
- [ ] **Task 2.3**: Nâng cấp hàm `handleGoToPOS` để gom tất cả dịch vụ thuộc cùng `master_session_id` hoặc cùng `customer.id` sang `gp_pos_prefill_session`.

### Phase 3: Nâng cấp Modal Nhận Khách ([QuickAssignBedModal.jsx](file:///Volumes/Coding/GloPro/src/components/rooms-beds/QuickAssignBedModal.jsx))
- [ ] **Task 3.1**: Tích hợp kiểm tra khách hàng đã có phiên ở giường khác hay chưa khi chọn khách.
- [ ] **Task 3.2**: Hiển thị thông báo gợi ý liên kết Master Session khi phát hiện khách đang làm dịch vụ ở phòng khác.

### Phase 4: Tích hợp Đồng bộ với Thu Ngân POS ([POS.jsx](file:///Volumes/Coding/GloPro/src/views/POS.jsx) & [POSInvoiceModal.jsx](file:///Volumes/Coding/GloPro/src/components/POSInvoiceModal.jsx))
- [ ] **Task 4.1**: Cập nhật hàm nhận `gp_pos_prefill_session` trong `POS.jsx` để hiển thị nhãn từng phòng/giường và KTV trên từng item giỏ hàng.
- [ ] **Task 4.2**: Phát sự kiện dọn dẹp phiên giường khi tạo hoá đơn thành công ở `POSInvoiceModal.jsx`.
- [ ] **Task 4.3**: Lắng nghe sự kiện tại [RoomsBeds.jsx](file:///Volumes/Coding/GloPro/src/views/RoomsBeds.jsx) để tự động giải phóng giường realtime.

### Phase 5: Kiểm thử & Nghiệm thu (Verification Checklist)
- [ ] **Test Case 1**: Nhận khách A vào Giường 1 (Phòng Gội) làm Gội đầu.
- [ ] **Test Case 2**: Nhận tiếp khách A vào Giường 2 (Phòng Da) làm Chăm sóc da -> Hệ thống tự động liên kết chung lượt.
- [ ] **Test Case 3**: Test tính năng "Chuyển giường" từ Giường 2 sang Giường 3 -> Giường 2 trống, Giường 3 bận và giữ nguyên dịch vụ.
- [ ] **Test Case 4**: Bấm "Thanh toán POS" -> Giỏ hàng POS nhận đủ cả dịch vụ gội đầu + chăm sóc da, đúng KTV và vị trí.
- [ ] **Test Case 5**: Hoàn tất thanh toán trên POS -> Quay lại màn hình Sơ đồ giường, tất cả giường của khách A đều đã được trả trống.
- [ ] **Check build**: `npm run build` không phát sinh lỗi syntax hay bundle.
