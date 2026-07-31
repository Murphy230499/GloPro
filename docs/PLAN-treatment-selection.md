# Kế hoạch Triển khai: Chọn Dịch vụ khi Sử dụng Liệu trình (Treatment Session Customization)

## Mục tiêu (Goal)
Khác với Gói dịch vụ (các dịch vụ được định sẵn cố định cho mỗi lần dùng), Liệu trình hoạt động như một "túi dịch vụ" mà khách hàng mua trước (ví dụ: liệu trình 10 buổi). Mỗi buổi đến làm, tuỳ thuộc vào tình trạng thực tế của khách, kỹ thuật viên sẽ chọn ra các dịch vụ cụ thể trong danh sách dịch vụ của liệu trình đó để thực hiện. 

Kế hoạch này thay đổi luồng chọn của **Liệu trình** tại `PackageUsageModal.jsx`: thay vì tự động thêm toàn bộ dịch vụ của liệu trình vào giỏ hàng, hệ thống sẽ cho phép nhân viên tích chọn các dịch vụ cụ thể mà khách muốn thực hiện trong buổi hôm nay.

## User Review Required
> [!IMPORTANT]
> - Luồng của **Dùng gói** vẫn được giữ nguyên (tự động thêm toàn bộ dịch vụ của gói vào giỏ hàng).
> - Luồng của **Dùng liệu trình** sẽ thay đổi: khi bấm vào một liệu trình, một danh sách dịch vụ đi kèm của liệu trình đó sẽ hiển thị kèm checkbox để tích chọn trước khi đưa vào giỏ hàng.
> - Nếu liệu trình không có dịch vụ con được định nghĩa sẵn, hệ thống sẽ mặc định chọn chính liệu trình đó làm dịch vụ thực hiện (tương thích ngược với dữ liệu cũ).

## Proposed Changes

### 1. Cập nhật giao diện `PackageUsageModal.jsx`
- **[MODIFY] [PackageUsageModal.jsx](file:///Volumes/Coding/GloPro/src/components/pos/PackageUsageModal.jsx)**
  - Thêm state `selectedTreatment` để lưu trữ liệu trình đang được tích chọn cấu hình dịch vụ.
  - Thêm state `selectedServices` (mảng chứa các ID dịch vụ được chọn từ liệu trình).
  - Khi người dùng click vào nút "Sử dụng" của một **Liệu trình**:
    - Không gọi `handleSelectTreatment` lập tức. Thay vào đó, thiết lập `selectedTreatment` thành liệu trình đó.
    - Hiển thị danh sách các dịch vụ con thuộc liệu trình đó (`trt.services`) kèm theo ô Checkbox để người dùng tích chọn.
    - Có nút "Xác nhận dùng" để gom các dịch vụ đã tích chọn thành các item giỏ hàng (giá 0đ, có cờ `is_from_package: true` và `customer_treatment_id`), sau đó gọi `onSelect` để đưa vào giỏ hàng.
    - Nút "Hủy" để quay lại danh sách gói/liệu trình ban đầu.

### 2. Cập nhật hiển thị giỏ hàng `TicketColumn.jsx`
- Đảm bảo các dịch vụ được chọn riêng lẻ này khi đưa vào giỏ hàng vẫn được nhóm chính xác vào nhóm **`DÙNG LIỆU TRÌNH: [Tên liệu trình]`** nhờ vào trường `customer_treatment_id` và `package_name` (đã được cấu hình ở refactor trước).

## Verification Plan

### Manual Verification
1. Chọn khách hàng đã mua liệu trình (có chứa nhiều dịch vụ con).
2. Bấm vào nút **"Gói & Liệu trình đã mua"**.
3. Bấm vào một liệu trình bất kỳ. Hệ thống hiển thị danh sách các dịch vụ con của liệu trình đó kèm checkbox.
4. Tích chọn 2 trên 4 dịch vụ, bấm **"Xác nhận"**.
5. Kiểm tra xem trong giỏ hàng chỉ hiển thị đúng 2 dịch vụ được tích chọn dưới đề mục **DÙNG LIỆU TRÌNH**.
6. Thực hiện thanh toán và kiểm tra xem database có trừ đúng số buổi tương ứng với số dịch vụ đã dùng hay không.
