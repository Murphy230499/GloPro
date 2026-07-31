# Kế hoạch Bổ sung Hàng loạt Tích hợp Bên thứ 3 (Giai đoạn 2)

## 🎯 Mục tiêu
Cập nhật màn hình **Tích hợp (Integrations)** trong Cài đặt hệ thống để bổ sung toàn bộ các nền tảng thiết yếu cho một phần mềm Salon/Spa như đã tư vấn. 

Do đây là một danh sách lớn, chúng ta sẽ bắt đầu bằng việc **xây dựng giao diện cấu hình (UI)** cho tất cả các dịch vụ này để người dùng có thể nhập API Key / Cấu hình. 

> [!WARNING] User Review Required
> Vui lòng xác nhận danh sách các tích hợp và các trường cấu hình (Fields) cần thiết cho mỗi loại trước khi tôi bắt đầu code giao diện. Các logic thực thi thực tế (vd: gọi API MoMo khi thanh toán) sẽ được thực hiện khi làm chức năng tương ứng (POS).

## ❓ Open Questions
> [!IMPORTANT]
> 1. Có nền tảng nào trong danh sách dưới đây bạn thấy chưa cần thiết trong phiên bản hiện tại và muốn ẩn đi không?
> 2. VietQR hiện tại có thể tạo mã tự động dựa trên Số tài khoản + Ngân hàng (chỉ cần nhập thông tin tài khoản là đủ). MoMo/VNPay thì cần API Key doanh nghiệp. Bạn muốn hỗ trợ cả hai hay chỉ VietQR trước cho đơn giản?

## 📋 Đề xuất Thay đổi (Proposed Changes)

### [MODIFY] `src/components/settings/IntegrationsTab.jsx`
Sửa đổi hằng số `INTEGRATION_APPS` để thêm các nhóm tích hợp sau (với icon SVG tương ứng):

**Nhóm Thanh toán (Payments):**
- **MoMo:** Cần nhập `Partner Code`, `Access Key`, `Secret Key`.
- **VietQR:** Cần nhập `Tên Ngân Hàng` (Mã BIN), `Số Tài Khoản`, `Tên Chủ Tài Khoản`.

**Nhóm Kênh Đặt lịch (Booking):**
- **Reserve with Google:** Cần xác nhận liên kết `Merchant ID`.

**Nhóm Chăm sóc Khách hàng (CRM):**
- **SMS Brandname:** Cần `API Url`, `API Key`, `Secret Key`, `Brandname`.
- **Mailchimp:** Cần `API Key` và `Audience ID` (List ID).

**Nhóm Kế toán & Lưu trữ:**
- **MISA (Kế toán):** `App ID`, `Access Token`.
- **AWS S3 / Cloudinary (Lưu ảnh liệu trình):** `Bucket Name`, `Access Key`, `Secret Key`, `Region`.

*(Lưu ý: Dữ liệu cấu hình vẫn sẽ được lưu an toàn dưới dạng JSON vào bảng `Integration` đã tạo ở bước trước).*

## 🧪 Kế hoạch Kiểm tra (Verification Plan)
- Mở danh sách Tích hợp, giao diện sẽ xuất hiện thêm 7-8 Card mới với các Icon tương ứng.
- Bấm "Cấu hình" vào MoMo hoặc VietQR và thử nhập thông tin giả.
- Lưu lại và tải lại trang, đảm bảo trạng thái "Đã kết nối" được giữ nguyên.
