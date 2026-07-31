# Thêm tính năng Tích hợp Bên thứ 3 (Facebook, Zalo, WhatsApp, Email)

## 🎯 Mục tiêu
Mở rộng trang **Cài đặt hệ thống (`Settings.jsx`)**, thêm một tab mới tên là **Tích hợp (Integrations)**. Mục đích là cho phép quản trị viên kết nối và quản lý các ứng dụng bên thứ 3 (Facebook, WhatsApp, Zalo, Email) dùng cho các chiến dịch tự động, gửi tin nhắn chăm sóc khách hàng, hoặc gửi thông báo lịch hẹn.

> [!WARNING] User Review Required
> Vui lòng xem xét các câu hỏi mở bên dưới để thống nhất kiến trúc trước khi bắt đầu code.

## ❓ Open Questions (Cần xác nhận)

> [!IMPORTANT]
> 1. **Mô hình lưu trữ:** Cấu hình tích hợp (API Keys, Access Tokens) sẽ được lưu chung cho **toàn hệ thống** (Global) hay lưu riêng biệt cho **từng chi nhánh** (Per-branch)?
> 2. **Cơ chế xác thực:** Đối với Zalo OA và Facebook Fanpage, hệ thống sẽ yêu cầu người dùng tự nhập **Access Token / API Key**, hay cần xây dựng luồng **OAuth 2.0 Login** (nhấn nút để popup cửa sổ đăng nhập của FB/Zalo)? *(Khuyến nghị ban đầu: Cho phép người dùng tự nhập API Key/Token để đơn giản hóa MVP)*
> 3. **Database Schema:** Chúng ta sẽ tạo một entity/table mới trên Base44/Supabase có tên là `Integration` để lưu trữ thông tin này, hay lưu vào bảng `Setting` hiện tại?

## 📋 Đề xuất Thay đổi (Proposed Changes)

### 1. Cấu trúc Database (Supabase / Base44)
- **[NEW] Entity `Integration` (hoặc `AppIntegration`)**:
  - `id`: string (UUID)
  - `provider`: string (vd: 'facebook', 'zalo', 'whatsapp', 'email_smtp')
  - `status`: string ('connected', 'disconnected')
  - `credentials`: JSONB (lưu trữ token, app_id, secret_key...)
  - `branch_id`: tham chiếu (nếu tích hợp theo chi nhánh) hoặc null (toàn hệ thống)

### 2. Giao diện (UI/UX)
#### [MODIFY] `src/views/Settings.jsx`
- **Tab Bar:** Thêm nút tab **Tích hợp** (sử dụng icon `Link` hoặc `Share2`).
- **Nội dung Tab Tích hợp:**
  - Giao diện lưới (Grid) hiển thị các thẻ (Card) ứng dụng:
    - **Zalo ZNS / Zalo OA:** Gửi tin nhắn Zalo chăm sóc khách hàng.
    - **Facebook Messenger:** Tích hợp Fanpage.
    - **WhatsApp:** WhatsApp Business API.
    - **Email SMTP:** Cấu hình email gửi thông báo (vd: SendGrid, Gmail).
  - Mỗi thẻ hiển thị Logo ứng dụng, Tên, Mô tả ngắn, Trạng thái (Đã kết nối / Chưa kết nối).
  - Nút **"Cấu hình"** hoặc **"Kết nối"** mở ra một Modal (Popup).

#### [NEW] `src/components/settings/IntegrationModal.jsx`
- Một component Modal dùng chung để người dùng nhập thông tin cấu hình cho từng dịch vụ.
- Ví dụ khi chọn Zalo: Hiện form nhập `OA ID` và `Access Token`.
- Khi chọn Email: Hiện form nhập `SMTP Host`, `Port`, `Username`, `Password`.

### 3. Tương tác với module Automation (Frontend)
#### [MODIFY] `src/components/automations/EditEventModal.jsx`
- Gọi API (hoặc lấy state) kiểm tra danh sách các dịch vụ đã được kết nối từ bảng `Integration`.
- Tại phần chọn "Kênh phát thông báo" (Email, SMS, WhatsApp, Zalo):
  - **Nếu đã kết nối:** Cho phép bật/tắt (như hiện tại).
  - **Nếu chưa kết nối:** Làm mờ (Disable) nút bật/tắt của kênh đó.
  - Hiển thị thêm dòng cảnh báo nhỏ (VD: *"Chưa kết nối. Vui lòng thiết lập trong Cài đặt"*), và có thể biến nó thành link trỏ thẳng về tab Tích hợp.

### 4. Luồng gửi tin tự động (Backend Logic)
- **Hệ thống chạy ngầm (Cronjob/Worker):** Khi đến thời điểm cần gửi tin (ví dụ: trước 2 giờ lịch hẹn), hệ thống sẽ:
  - Đọc quy tắc thiết lập trong kịch bản Automation.
  - Kiểm tra xem người dùng có kích hoạt kênh gửi tương ứng (Email, SMS) không.
  - Lấy API Key/Token tương ứng từ bảng `Integration` để thực hiện request tới nhà cung cấp dịch vụ (SendGrid, Twilio, Zalo ZNS...).

### 5. Phân quyền (Permissions)
- Cập nhật biến `MODULE_GROUPS` trong `Settings.jsx` để thêm quyền:
  - `setting_integration_view`: Xem cấu hình tích hợp.
  - `setting_integration_edit`: Chỉnh sửa/kết nối các dịch vụ tích hợp.

## 🧪 Kế hoạch Kiểm tra (Verification Plan)
### Bằng tay (Manual)
- Truy cập vào Cài đặt -> Tab Tích hợp.
- Chọn một dịch vụ (VD: Email), điền thông tin và lưu lại.
- Tải lại trang để đảm bảo dữ liệu cấu hình đã được lưu an toàn xuống database và hiển thị đúng trạng thái "Đã kết nối".
