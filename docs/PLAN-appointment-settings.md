# Cài đặt tính năng Lịch Hẹn (Appointment Settings)

Mục tiêu là thêm nút Cài đặt (biểu tượng bánh răng) cạnh nút "Tạo lịch hẹn" trên module Lịch hẹn, và hiển thị một Popup Cài đặt Lịch hẹn bằng tiếng Việt giống như bản thiết kế.

## User Review Required
- Các cài đặt này tạm thời sẽ được lưu vào **trình duyệt (Local Storage)** để có tác dụng ngay cho thiết bị của bạn. Nếu bạn muốn đồng bộ cài đặt này cho toàn bộ nhân viên (lưu vào Database), xin vui lòng phản hồi lại.
- Các cài đặt này mang tính chất **UI Preferences**, nghĩa là nó sẽ ảnh hưởng đến việc hiển thị lưới lịch hẹn (ví dụ: chia lưới 15 phút, 30 phút). Các tính năng tự động chuyển trạng thái "Không đến" sẽ cần tích hợp thêm logic background nếu lưu database.

## Proposed Changes

### [NEW] `src/components/AppointmentSettingsModal.jsx`
Tạo mới Component hiển thị Popup cài đặt với nội dung đã được dịch sang tiếng Việt:
- **Thời lượng khung giờ**: Thanh kéo chọn khoảng thời gian (5', 10', 15', 30', 60')
- **Đặt lịch trùng**: Bật/tắt và nhập số lượng lịch trùng tối đa.
- **Yêu cầu chọn nhân viên**: Bật/tắt bắt buộc chọn nhân viên khi đặt lịch.
- **Lịch hẹn không đến (No show)**: 
  - Bật/tắt tự động đánh dấu "Không đến"
  - Chọn thời gian chờ (Dropdown: 5 phút, 10 phút, 15 phút...)
  - Checkbox hiển thị thông báo.
- **Thông báo hủy lịch hẹn không đến**:
  - Chọn thời gian giữ lịch hẹn (Dropdown: 30 phút, 60 phút...)
  - Checkbox hiển thị thông báo hủy.

Lưu trữ trạng thái (state) mặc định trong `localStorage` với key `glowpro_appointment_settings`.

### [MODIFY] `src/views/Appointments.jsx`
- Bổ sung nút **Biểu tượng Cài đặt (Settings Icon)** kế bên nút "Tạo lịch hẹn" ở góc trên bên phải màn hình.
- Thêm state `isSettingsOpen` để quản lý việc mở/đóng popup cài đặt.
- Tích hợp component `<AppointmentSettingsModal />` vào giao diện.

## Verification Plan
- Mở trang Lịch hẹn, kiểm tra xem nút Cài đặt có xuất hiện đúng vị trí không.
- Bấm vào nút Cài đặt, xác minh Popup hiển thị đúng giao diện và ngôn ngữ tiếng Việt.
- Thay đổi các giá trị cài đặt, bấm "Lưu", tải lại trang (F5) và mở lại cài đặt để chắc chắn các giá trị đã được lưu và khôi phục thành công.
