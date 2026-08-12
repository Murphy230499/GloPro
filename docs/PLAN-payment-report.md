# Kế hoạch phát triển: Báo cáo Phương Thức Thanh Toán (Payment Methods Report)

Dựa trên yêu cầu của bạn, hệ thống sẽ được thiết kế để cung cấp cái nhìn tổng quan và trực quan nhất về dòng tiền thu vào theo từng phương thức thanh toán.

## 1. Đăng ký Module Báo Cáo Mới
- **File:** `src/components/reports/ReportLayout.jsx`
- **Nhiệm vụ:** Thêm module mới vào danh sách menu báo cáo bên trái.
  - Tên: Phương Thức Thanh Toán.
  - Icon: `Wallet` hoặc `CreditCard`.
  - ID: `payment_methods`.

## 2. Thiết kế Giao diện (UI/UX)
Tạo file mới `src/components/reports/PaymentMethodReport.jsx` với cấu trúc sau:
- **Phần 1 - Tổng quan (Cards):** Hiển thị thẻ tóm tắt (Tổng doanh thu thu vào, Tổng tiền mặt, Tổng chuyển khoản, Tổng công nợ).
- **Phần 2 - Biểu đồ trực quan:** Sử dụng biểu đồ tròn (Donut Chart) từ thư viện Recharts để thể hiện tỷ trọng (%). Giúp chủ salon nhìn ngay được phương thức nào khách hàng ưa chuộng nhất.
- **Phần 3 - Bảng dữ liệu chi tiết (Data Table):** Hiển thị chi tiết số liệu: Tên phương thức, Tổng số giao dịch, Tổng tiền, Tỉ lệ (%).

## 3. Xử lý Dữ Liệu (Data Logic)
- **Truy vấn:** Lấy dữ liệu từ bảng `invoice` trong khoảng thời gian đã chọn (DateRange) và lọc theo chi nhánh (Branch).
- **Tính toán:** Phân nhóm hóa đơn theo trường `payment_method`. (VD: `cash`, `transfer`, `card`, `debt`). Cộng dồn tổng tiền `final_amount` hoặc `total_amount`.
- **Lưu ý nghiệp vụ:** Nếu có xử lý thanh toán chia đợt (Split payments) trong hệ thống, sẽ lấy dựa trên lịch sử giao dịch (nếu có bảng `transaction`) hoặc dựa trên trạng thái hóa đơn. Để tối ưu nhanh nhất cho giai đoạn này, sẽ gom nhóm dựa trên `payment_method` chính của hóa đơn.

---
*Khi bạn phê duyệt (Proceed), tôi sẽ tự động tạo các file code và thêm giao diện này vào hệ thống báo cáo.*
