# Kế Hoạch Triển Khai: Module Tracking Đánh Giá Khách Hàng (Feedback Tracking Module)

## 1. Mục Tiêu Tổng Quan
Xây dựng một module quản trị chuyên sâu **Feedback / Đánh giá & Phản hồi Khách hàng** giúp chủ salon và quản lý:
- Theo dõi toàn bộ kết quả khách hàng chấm điểm KTV và dịch vụ từ link quét mã QR theo thời gian thực.
- Thống kê xếp hạng chất lượng phục vụ và tổng tiền Tip của từng nhân viên.
- Nhận cảnh báo và xử lý ngay các phản hồi tiêu cực (đánh giá Kém 😫) để nâng cao dịch vụ CSKH.

---

## 2. Thiết Kế Giao Diện & Tính Năng Chi Tiết

### A. Chỉ Số Tổng Quan (KPI Metric Cards)
1. **Tổng lượt đánh giá**: Số lượt khách quét mã và gửi phản hồi.
2. **Tỷ lệ hài lòng (%)**: Tỷ lệ đánh giá Rất tốt 😍 & Tốt 😚 trên tổng số.
3. **Tổng tiền Tip qua Review**: Tổng số tiền khách thưởng thêm cho nhân viên qua luồng đánh giá.
4. **Phản hồi cần xử lý (Kém)**: Số đánh giá tiêu cực kèm lý do khiếu nại chưa được CSKH giải quyết.

### B. Bảng Xếp Hạng & Đánh Giá Từng Nhân Viên (Staff Rating Leaderboard)
- Danh sách KTV kèm Avatar, số ca làm, số lượt đánh giá.
- Phân bổ chi tiết: Số lượng Rất tốt (😍), Tốt (😚), Bình thường (😐), Quá tệ (😫).
- Điểm trung bình (CSAT Score) & Tổng tiền Tip nhận được.
- Huy hiệu khen thưởng Top KTV xuất sắc nhất tháng/tuần.

### C. Danh Sách & Dòng Thời Gian Đánh Giá (Feedback Activity Log)
- Bộ lọc nâng cao:
  - Theo **Chi nhánh** (Tất cả hoặc từng chi nhánh cụ thể).
  - Theo **Khoảng thời gian** (Hôm nay, Hôm qua, 7 ngày qua, Tháng này, Tuỳ chọn).
  - Theo **Kỹ thuật viên**.
  - Theo **Mức độ hài lòng** (Tất cả, Rất tốt, Tốt, Bình thường, Quá tệ).
- Bảng chi tiết từng lượt đánh giá:
  - **Thời gian & Hoá đơn**: Mã HĐ (click mở chi tiết đơn), ngày giờ đánh giá.
  - **Khách hàng**: Tên, Số điện thoại (phân loại Khách quen / Khách vãng lai).
  - **Nhân viên & Dịch vụ**: Tên KTV phục vụ + dịch vụ đã làm.
  - **Mức độ hài lòng & Lý do**: Icon cảm xúc + danh sách các lý do khiếu nại (ví dụ: Chờ quá lâu, KTV thao tác đau, Thái độ chưa tốt...) + ý kiến đóng góp khác.
  - **Tiền Tip**: Số tiền thưởng cho KTV.
  - **Trạng thái CSKH**: `Chờ xử lý` / `Đã liên hệ hỗ trợ` kèm ghi chú giải quyết khiếu nại.

### D. Tích Hợp Hệ Thống
1. **Menu Sidebar Navigation**:
   - Thêm mục **Đánh giá khách hàng** (icon `MessageSquareHeart` / `Star`) trong Sidebar chính.
2. **Tích hợp Realtime**:
   - Tự động cập nhật ngay khi có khách hàng vừa hoàn tất đánh giá từ điện thoại qua Supabase Broadcast & Database.
3. **Xuất Báo Cáo (Export)**:
   - Cho phép xuất file Excel / CSV danh sách phản hồi để báo cáo nội bộ.

---

## 3. Kiến Trúc Dữ Liệu & Triển Khai Kỹ Thuật

| Thành phần | File / Module | Nhiệm vụ |
|---|---|---|
| **Route & Page** | `src/app/(protected)/feedback/page.jsx` & `_client.jsx` | Trang Route chính được bảo vệ bởi auth |
| **View Component** | `src/views/Feedback.jsx` | Giao diện tổng quan KPI, Leaderboard, Bảng lọc & chi tiết đánh giá |
| **Menu Sidebar** | `src/components/Layout.jsx` | Thêm mục Menu "Đánh giá & Phản hồi" |
| **Database Adapter** | `src/api/supabaseClient.js` | Tận dụng dữ liệu `review_data`, `tip`, `tip_splits` từ bảng `invoice` |
| **Ngôn ngữ (i18n)** | `src/lib/i18n.jsx` | Đầy đủ từ khoá song ngữ Tiếng Việt & Tiếng Anh |

---

## 4. Kế Hoạch Xác Minh & Kiểm Thử (Verification Plan)
1. **Kiểm tra hiển thị**: Mở trang `/feedback`, xác nhận các thẻ KPI, biểu đồ phân bổ đánh giá và bảng chi tiết load mượt mà.
2. **Kiểm tra bộ lọc**: Thử lọc theo KTV, mức đánh giá (Chỉ xem đánh giá Kém), theo ngày và chi nhánh.
3. **Kiểm tra Realtime**: Mở quầy POS hoặc quét link review trên điện thoại ➔ Gửi đánh giá ➔ Xác nhận module Feedback cập nhật ngay lập tức.
4. **Kiểm tra Build**: Chạy `npm run build` đảm bảo không có lỗi cú pháp hay routing.
