# Kế hoạch triển khai: Tính năng sao chép và cài đặt hoa hồng nhóm

Kế hoạch thiết kế và hiện thực hóa tính năng "Sao chép" và "Cài đặt hoa hồng nhóm" trong mô-đun quản lý cấu hình hoa hồng của nhân viên.

## 1. Thiết kế Giao diện (UI/UX)

- **Vị trí nút bấm**: Nút **Sao chép** và **Cài đặt hoa hồng nhóm** sẽ được đặt cùng hàng với thanh tìm kiếm ở góc bên phải của mỗi tab thuộc `CommissionMatrix.jsx` (Dịch vụ, Sản phẩm, Gói dịch vụ, Liệu trình, Combo dịch vụ, Combo sản phẩm, Thẻ tiền mặt).
- **Giao diện nút**: Thiết kế nút gọn gàng bằng Lucide Icons (`Copy`, `Settings`), sử dụng màu sắc đồng bộ (`bg-purple-50 hover:bg-purple-100 text-purple-600` hoặc tương tự).

### A. Modal "Cài đặt hoa hồng nhóm" (Group Commission Setup Modal)
- **Chọn nhân viên**: Danh sách checkbox/dropdown cho phép chọn nhiều nhân viên áp dụng (có nút "Chọn tất cả").
- **Chọn phạm vi áp dụng**: Hỗ trợ 3 tùy chọn:
  - **Tất cả**: Áp dụng cho mọi vật phẩm trong tab hiện tại.
  - **Theo nhóm**: Dropdown hiển thị danh sách các nhóm tương ứng (ví dụ: nhóm "Gội đầu", "Skincare") để người dùng chọn. Hệ thống sẽ áp dụng cho tất cả dịch vụ thuộc nhóm đó.
  - **Vật phẩm lẻ**: Chọn thủ công danh sách các vật phẩm cụ thể.
- **Giá trị hoa hồng**: Ô nhập số (bên trái) và bộ chọn đơn vị `%`/`đ` (bên phải, bo góc `rounded-xl` chuẩn như thiết kế mới).
- **Cập nhật**: Bấm xác nhận sẽ cập nhật hàng loạt và tự động ghi đè lên các cấu hình lẻ đã tồn tại trước đó.

### B. Modal "Sao chép hoa hồng" (Copy Commission Modal)
- **Nhân viên nguồn**: Chọn 1 nhân viên muốn sao chép cấu hình (dropdown).
- **Nhân viên đích**: Danh sách checkbox cho phép chọn nhiều nhân viên nhận cấu hình (có nút "Chọn tất cả").
- **Phạm vi tác động**: Chỉ sao chép các cấu hình hoa hồng thuộc tab hiện tại (Ví dụ: đang ở tab Dịch vụ thì chỉ sao chép hoa hồng dịch vụ, không ảnh hưởng các tab khác).
- **Ghi đè**: Ghi đè cấu hình hoa hồng tương ứng của nhân viên đích bằng cấu hình của nhân viên nguồn.

---

## 2. Thiết kế Luồng Dữ liệu & API

- **Bảng dữ liệu**: Sử dụng bảng `StaffCommissionRule` hiện tại.
- **Thuật toán xử lý**:
  - Đối với cấu hình hàng loạt theo nhóm:
    1. Lọc ra danh sách `item_ids` phù hợp dựa theo lựa chọn (Tất cả / Theo Nhóm / Lẻ).
    2. Với mỗi nhân viên được chọn và mỗi `item_id` tương ứng, kiểm tra xem đã tồn tại rule tương ứng (`staff_id`, `item_type`, `item_id`) trong danh sách hiện tại chưa.
    3. Nếu đã tồn tại, gọi `base44.entities.StaffCommissionRule.update()`.
    4. Nếu chưa tồn tại, gọi `base44.entities.StaffCommissionRule.create()`.
  - Đối với sao chép:
    1. Lấy tất cả `StaffCommissionRule` của nhân viên nguồn thuộc `item_type` hiện tại.
    2. Duyệt qua danh sách nhân viên đích được chọn.
    3. Với mỗi nhân viên đích và mỗi rule của nhân viên nguồn: cập nhật nếu đã có cấu hình, hoặc tạo mới nếu chưa có.
- **Tối ưu hóa**: Sử dụng `Promise.all` để thực hiện cập nhật hàng loạt song song, sau đó làm mới state bằng cách gọi lại hàm tải dữ liệu chính.

---

## 3. Các File Cần Chỉnh Sửa

### [MODIFY] [CommissionMatrix.jsx](file:///Volumes/Coding/GloPro/src/components/staff/CommissionMatrix.jsx)
- Thêm state điều khiển trạng thái mở của 2 Modal mới.
- Bố trí 2 nút bấm mới cùng hàng với thanh tìm kiếm.
- Tích hợp 2 Modal popup mới:
  - `<GroupCommissionModal />` (Cài đặt hoa hồng nhóm)
  - `<CopyTabCommissionModal />` (Sao chép hoa hồng theo tab)
- Truyền các callback tải lại dữ liệu sau khi cập nhật thành công.

---

## 4. Kế hoạch Kiểm thử & Xác minh

### Kiểm thử Tự động
- Chạy `npx eslint` trên file `CommissionMatrix.jsx` để đảm bảo không lỗi cú pháp.

### Xác minh Thủ công
- **Cài đặt nhóm**: Chọn 3 nhân viên, chọn áp dụng cho nhóm "Gội đầu", nhập `15%`, bấm cập nhật và kiểm tra xem toàn bộ các dịch vụ thuộc nhóm "Gội đầu" của 3 nhân viên đó trong bảng ma trận có chuyển thành `15%` hay không.
- **Sao chép**: Cài đặt hoa hồng dịch vụ cho Nhân viên A. Chọn sao chép từ Nhân viên A sang Nhân viên B và C. Xác minh cấu hình của Nhân viên B và C được cập nhật giống hệt Nhân viên A trong tab hiện tại.
