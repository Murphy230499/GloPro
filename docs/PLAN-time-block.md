# Kế hoạch Triển khai Tính năng Time Block (Giờ nghỉ/Khóa lịch)

## 1. Phân tích Yêu cầu (Context Check)
Người dùng muốn thêm tính năng "Time Block" (Khóa khung giờ) để chặn đặt lịch trong các khoảng thời gian nhất định (VD: nghỉ trưa 12:00 - 13:30).
Giao diện bao gồm:
- Nút "Add Appointment" được chuyển thành dạng Split Button (có mũi tên dropdown bên phải), gồm 2 tùy chọn: "Add Appointment" và "Add Time Block".
- Popup `Add Time Block` Modal hiện ra chứa các trường: Title (Tiêu đề), Staff (Nhân viên), Date (Ngày), From/To (Từ giờ/Đến giờ), và Repeats (Lặp lại).
- Tùy chọn Repeats hỗ trợ: Doesn't repeat, Every day, Every week, Every month kèm theo cài đặt kết thúc (Ends: Never, On date, After X occurrences).

## 2. Cổng Socratic (Câu hỏi cần làm rõ)
Trước khi bắt đầu triển khai code, vui lòng xác nhận các thông tin sau:
1. **Lưu trữ dữ liệu (Data Storage):** Time Block sẽ được lưu chung vào bảng `Appointment` (với status = `break` / `time_block`), hay tạo hẳn một bảng mới (ví dụ: `TimeBlock`)? (Tôi khuyên nên lưu chung vào Appointment với status `break` để Calendar dễ dàng render giao diện sọc chéo xám).
2. **Xử lý trùng lịch (Conflict Handling):** Nếu tại thời điểm tạo Time Block (ví dụ 12h) đã có sẵn một lịch hẹn của khách từ trước, hệ thống có báo lỗi/ngăn chặn tạo Time Block không, hay cứ cho phép đè lên?
3. **Logic Lặp lại (Recurrence):** Cấu hình lặp lại "Mỗi ngày/Mỗi tuần" nên được tạo thành nhiều dòng dữ liệu (records) riêng biệt trong Database, hay lưu thành 1 chuỗi quy tắc (RRULE) rồi để Front-end tự tính toán khi render lịch?

## 3. Phân chia Task (Task Breakdown)
**Phase 1: Xây dựng UI (Giao diện)**
- Tạo nút Dropdown "Add Time Block" tại `AppointmentHeader.jsx`.
- Tạo Component `AddTimeBlockModal.jsx` giống hệt Figma (Bao gồm form lặp lại phức tạp).

**Phase 2: Xử lý Logic & Tích hợp**
- Cập nhật state quản lý form (đặc biệt là phần Repeats: Every Day/Week/Month).
- Cập nhật `Appointments.jsx` để hiển thị Modal mới.
- Viết API call để tạo mới Time Block, và render nó dưới dạng khối sọc xám trên Calendar.

## 4. Tệp tin bị ảnh hưởng (Affected Files)
- `src/components/appointments/AppointmentHeader.jsx` (Sửa đổi)
- `src/views/Appointments.jsx` (Sửa đổi)
- `src/components/appointments/AddTimeBlockModal.jsx` (Tạo mới)
