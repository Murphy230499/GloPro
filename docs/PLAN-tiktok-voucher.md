# Kế hoạch nâng cấp tính năng Voucher (TikTok Style)

Mục tiêu: Nâng cấp tính năng quản lý Voucher hiện tại của phần mềm để mang lại sức mạnh và sự linh hoạt tương tự như hệ thống quản lý Voucher của TikTok Shop. 

## 1. Phân tích tính năng Voucher của TikTok Shop
Hệ thống voucher của TikTok Shop rất mạnh mẽ vì nó cho phép người bán kiểm soát dòng tiền và nhắm đúng đối tượng mục tiêu. Các tính năng chính bao gồm:
- **Thời gian áp dụng cụ thể**: Có thời gian bắt đầu và kết thúc (hiện tại phần mềm chỉ có ngày hết hạn).
- **Ngưỡng áp dụng (Min Spend)**: Đơn hàng hoặc dịch vụ phải đạt giá trị tối thiểu mới được áp dụng.
- **Giới hạn số lượng dùng trên mỗi người**: Ví dụ 1 người chỉ được xài mã này 1 lần duy nhất, ngăn chặn trục lợi.
- **Mức giảm tối đa (Max Discount)**: Dành riêng cho voucher phần trăm (Ví dụ: Giảm 20% nhưng tối đa 50k).
- **Kênh hiển thị (Visibility/Channel)**: 
  - *Công khai*: Tự động hiển thị trên trang đặt lịch/thanh toán để mọi người cùng thấy.
  - *Riêng tư (Mã ẩn)*: Chỉ ai nhập đúng mã code mới được giảm (dành cho Seeding, Livestream, KOC).
- **Đối tượng áp dụng (Targeting)**: Tất cả khách hàng, Khách hàng mới, hoặc Khách hàng thuộc Hạng (Tier) nhất định.

## 2. Các thay đổi đề xuất cho hệ thống hiện tại

Dựa vào phân tích trên, để "TikTok hóa" tính năng voucher của phần mềm, chúng ta cần bổ sung các trường dữ liệu sau vào popup **"Tạo Voucher"** (`src/views/Discounts.jsx`):

### Cơ sở dữ liệu (Schema)
Cần bổ sung các trường mới vào bảng/đối tượng Voucher:
- `start_date`: Ngày bắt đầu.
- `min_spend`: Giá trị đơn hàng/dịch vụ tối thiểu để áp dụng.
- `max_discount_amount`: Số tiền giảm tối đa (nếu voucher là kiểu `%`).
- `usage_limit_per_user`: Giới hạn số lần dùng / 1 khách hàng (Mặc định: 1).
- `visibility`: `public` (Công khai) hoặc `private` (Mã ẩn).
- `target_audience`: `all` (Tất cả), `new_customer` (Khách mới), `specific_tiers` (Hạng cụ thể).

### Giao diện người dùng (UI - `Discounts.jsx`)
Cập nhật form "Phát hành Voucher mới" để chia thành các nhóm cấu hình (tương tự UX của TikTok Shop):
1. **Thông tin cơ bản**: Tên Voucher, Mã Voucher (Code).
2. **Cài đặt giảm giá**: Kiểu giảm giá (Số tiền/Phần trăm), Mức giảm, Mức giảm tối đa (nếu là %), Giá trị đơn tối thiểu.
3. **Cài đặt thời gian & Số lượng**: Thời gian Bắt đầu - Kết thúc, Tổng số lượng phát hành, Giới hạn số lần dùng/khách hàng.
4. **Cài đặt hiển thị & Đối tượng**: Phạm vi áp dụng (Hóa đơn/Sản phẩm/Dịch vụ), Loại voucher (Công khai/Mã ẩn), Đối tượng áp dụng.

## 3. Hướng dẫn sử dụng tính năng mới (Dự kiến)

Khi tính năng hoàn tất, hướng dẫn sử dụng cho nhân sự/quản lý sẽ như sau:

- **Tạo chiến dịch chốt sale Livestream/Video**: Tạo voucher với thiết lập "Mã ẩn (Private)" và cấu hình "Giới hạn 1 lần/người". Trong Livestream, bạn đọc mã Code (VD: `LIVESALE50`). Khách hàng phải tự nhập mã để được giảm.
- **Voucher kích cầu chung**: Tạo voucher "Công khai (Public)" với "Đơn tối thiểu 500k". Voucher sẽ tự hiển thị, khuyến khích khách mua thêm sản phẩm/dịch vụ để đủ 500k nhằm hưởng khuyến mãi.
- **Voucher phần trăm an toàn**: Bạn muốn giảm 50% để thu hút, nhưng sợ lỗ? Chọn kiểu giảm `%`, nhập 50%, và nhập "Mức giảm tối đa là 100,000đ". Khách mua 1 triệu cũng chỉ được giảm tối đa 100k.

---

## 4. Socratic Gate (Câu hỏi mở)

Trước khi thực hiện (bằng lệnh `/create`), xin hãy xác nhận:
1. Bạn có muốn áp dụng TOÀN BỘ các thuộc tính nâng cao này (Min spend, Max discount, Per-user limit, Target audience, Visibility), hay chỉ muốn áp dụng một vài thuộc tính quan trọng nhất?
2. Với tính năng "Giới hạn mỗi người dùng 1 lần", phần mềm hiện tại đã có cơ chế lưu trữ lịch sử áp dụng mã giảm giá của từng khách hàng để kiểm tra chưa?
3. Bạn có muốn đổi thiết kế form Tạo Voucher từ dạng "Một cột dài" sang dạng "Các bước" (Step-by-step) hoặc chia "Tab" để giống giao diện TikTok Seller Center hơn không?
