# Kế hoạch triển khai: Tab Bảng Lương (Payroll)

## Mục tiêu
Bổ sung tính năng Quản lý Bảng lương vào module Nhân viên, cho phép quản lý xem báo cáo lương chi tiết của từng nhân viên và xem lại lịch sử các kỳ trả lương trước đó.

## Phân tích thiết kế từ thiết kế (Images)

### 1. Cấu trúc Tab chính
- Cần bổ sung thêm một tab **"Bảng lương" (Payroll)** vào menu chính của trang `Staff.jsx`.
- Khi chọn tab này, màn hình sẽ hiển thị 2 sub-tabs (tab phụ):
  - **Bảng lương (Generate Report & Run payroll)**
  - **Lịch sử thanh toán lương (View past payroll runs)**

### 2. Giao diện "Bảng lương" (Chạy lương)
- **Bộ lọc**: Chọn tháng/năm, và chọn nhóm/tất cả nhân viên.
- **Nút thao tác**: Nút Cài đặt (bánh răng), Nút "Tạo báo cáo" (Generate Report), Nút "Chạy lương" (Run Payroll).
- **Bảng dữ liệu chi tiết**:
  - `Employees`: Avatar và Tên nhân viên
  - `Hours`: Số giờ làm việc
  - `Blocked`: Giờ bị khóa/trừ
  - `Hourly pay`: Lương theo giờ
  - `Salary`: Lương cơ bản/cố định
  - `No.Services`: Số lượng dịch vụ đã làm
  - `Service sales`: Doanh thu dịch vụ
  - `Services com`: Hoa hồng dịch vụ
  - `No. Product`: Số lượng sản phẩm bán ra
  - `Product Sales`: Doanh thu sản phẩm
  - `Product com`: Hoa hồng sản phẩm
  - `Tip`: Tiền Tip
  - `Pay Adjustment`: Điều chỉnh lương (Thưởng/Phạt)
  - `Total`: Tổng nhận
  - Dòng **Total (Tổng cộng)** ở cuối bảng cho tất cả các cột.

### 3. Giao diện "Lịch sử thanh toán lương"
- **Bảng dữ liệu**:
  - `Pay Date`: Ngày trả lương
  - `Pay Period`: Kỳ lương (Từ ngày - Đến ngày)
  - `Status`: Trạng thái (In progress - Đang xử lý, Completed - Hoàn thành)
  - `Total Payroll`: Tổng quỹ lương
  - `View Detail`: Nút xem chi tiết (Biểu tượng con mắt)

---

> [!WARNING] Cổng xác nhận (Socratic Gate)
> Trước khi tiến hành viết code, tôi cần bạn xác nhận một số điểm quan trọng sau để đảm bảo hệ thống hoạt động đúng ý bạn:
>
> 1. **Nguồn dữ liệu thực hay giao diện tĩnh (Mock)?**: Ở giai đoạn này, bạn muốn tôi chỉ tạo **Giao diện (UI)** và dùng dữ liệu giả (Mock data) cho các bảng lương này, hay bạn muốn tôi phải viết logic để **tính toán số liệu thật** từ dữ liệu Hoa hồng và Lịch hẹn (Appointments/Commissions) hiện có trên hệ thống?
> 2. **Chức năng của nút "Generate Report" và "Run Payroll"**: Nút "Generate Report" có phải dùng để tính toán lại số liệu mới nhất không? Nút "Run Payroll" sẽ lưu lại kỳ lương đó sang tab "Lịch sử thanh toán" đúng không?
> 3. **Cột "Pay Adjustment" (Điều chỉnh)**: Bạn có muốn khi click vào số tiền ở cột này, hệ thống sẽ mở ra một popup nhỏ cho phép nhập số tiền Thưởng/Phạt và ghi chú không?

## Kế hoạch triển khai (Task Breakdown)

### Phase 1: Cấu trúc điều hướng
- Cập nhật `src/views/Staff.jsx`:
  - Thêm `payroll` vào `MAIN_TABS`.
  - Khai báo state và UI cho 2 sub-tabs của Payroll.
- Tạo component `src/components/staff/PayrollManager.jsx` đóng vai trò là khung chứa cho 2 tab con.

### Phase 2: Xây dựng tab Bảng Lương (Run Payroll)
- Tạo component `src/components/staff/PayrollRunTab.jsx`.
- Xây dựng phần Bộ lọc (Filter) và các nút thao tác.
- Xây dựng bảng (Table) với đầy đủ các cột thu nhập, hoa hồng như trong thiết kế.
- Thêm dòng tổng cộng (Footer row).

### Phase 3: Xây dựng tab Lịch sử thanh toán
- Tạo component `src/components/staff/PayrollHistoryTab.jsx`.
- Xây dựng bảng lịch sử với các trạng thái bằng badge màu sắc (Ví dụ: màu vàng cho *In progress*, màu xanh cho *Completed*).

### Phase 4: Hoàn thiện UI & Hiệu ứng
- Kiểm tra hiển thị responsive.
- Bo góc, màu sắc, font chữ (sử dụng font-normal cho các dữ liệu) tuân thủ đúng chuẩn giao diện GloPro (Glassmorphism, Tailwind).

## Yêu cầu kiểm duyệt
- Vui lòng trả lời các câu hỏi ở phần **Socratic Gate** và nhấn **Proceed** (nếu dùng Artifact) hoặc nhắn tin xác nhận để tôi bắt đầu viết code!
