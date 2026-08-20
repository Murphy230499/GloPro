# Plan: Luồng Đánh Giá Khách Hàng Qua QR Code & Đồng Bộ POS Thu Ngân (QR Customer Review & Tipping Flow)

## 1. Mục Tiêu & Tổng Quan
Xây dựng trải nghiệm đánh giá dịch vụ và tip nhân viên chuyên nghiệp dành cho khách hàng của Salon/Spa bằng cách quét mã QR tại quầy thu ngân (POS), đồng thời cập nhật trạng thái thời gian thực (Realtime Status) lên màn hình của thu ngân:
- **Khách hàng**: Quét mã QR -> Xác nhận/Nhập thông tin cá nhân (bao gồm bộ chọn ngày sinh dạng Wheel Picker) -> Xác nhận hóa đơn dịch vụ -> Đánh giá từng KTV (kèm lý do nếu đánh giá kém) -> Thưởng Tip cho từng KTV -> Xem tổng kết & màn hình Cảm ơn.
- **Thu ngân (POS)**: Nhận biết trạng thái khách hàng theo thời gian thực (Chưa đánh giá ⚪ / Đang đánh giá 🟡 / Đã đánh giá xong 🟢) trên cả Tab Bar hoá đơn, Icon đánh giá ở thanh công cụ và Popup QR.

---

## 2. Thiết Kế Luồng Màn Hình Khách Hàng (`/review/[id]`)

Dựa trên bản thiết kế giao diện chuẩn:

### Bước 1: Xác nhận / Đăng ký thông tin khách hàng (Customer Info & Date of Birth)
- **Header**: Đồng hồ thời gian thực (HH:mm:ss DD/MM/YYYY), Tên Salon & Logo lấy từ cài đặt hệ thống (`4RAU Barbershop` / Salon Name), Nút chuyển đổi ngôn ngữ (ENG / VIE).
- **Trường hợp Khách đã có thông tin trên hoá đơn**: Hiển thị Họ tên, Số điện thoại, Email để khách xác nhận nhanh.
- **Trường hợp Khách vãng lai (Walk-in)**: Form nhập thông tin:
  - Họ và tên (Full Name)
  - Số điện thoại (Phone)
  - Email (tuỳ chọn hoặc bắt buộc)
  - Ngày tháng năm sinh (Date of Birth) -> Khi click mở Modal cuộn chọn ngày sinh dạng bánh xe (Wheel/Scroll Picker: Ngày / Tháng / Năm) + Nút Xác nhận.
- Nút **"TIẾP TỤC" (CONTINUE)**.

### Bước 2: Xác nhận thông tin hoá đơn (Confirm Invoice Information)
- Tiêu đề: **CONFIRM INVOICE INFORMATION**
- Thông tin khách hàng & Tổng tiền tạm tính (`Subtotal: xxx.xxx đ`).
- Bảng chi tiết dịch vụ/sản phẩm đã sử dụng:
  - Tên dịch vụ (Services used)
  - Số lượng (Quantity)
  - Đơn giá (Unit price)
  - Thành tiền (Total amount)
- Phần tổng kết: Tổng tiền (Total amount), Khuyến mãi / Giảm giá (Promotion), Thuế (VAT Tax nếu có).
- Lưu ý nhắc nhở: *"Vui lòng báo cho thu ngân nếu phát hiện sai sót trên hoá đơn."*
- Nút **"✓ XÁC NHẬN ĐÚNG" (CONFIRM AS CORRECT)**.

### Bước 3: Đánh giá chất lượng dịch vụ theo KTV (Rate Service Quality)
- Nút quay lại (`←`).
- Danh sách KTV phục vụ được gom nhóm rõ ràng:
  - Tên KTV + Danh sách các dịch vụ KTV đó đã thực hiện cho khách.
  - 4 mức đánh giá biểu cảm (Emoji & Label):
    1. **Quá tệ / Poor** (😫 - Đỏ)
    2. **Bình thường / Average** (😐 - Xám/Vàng)
    3. **Tốt / Good** (😚 - Xám/Xanh nhạt)
    4. **Rất tốt / Very good** (😍 - Xanh/Vàng sáng)
- **Kịch bản đánh giá Kém / Quá tệ (Poor)**: Tự động mở rộng phần "Phản hồi chi tiết" (Feedback section):
  - Danh sách checkbox chọn nhanh lý do (Ví dụ: *Không hài lòng kiểu tóc*, *Thái độ phục vụ chưa tốt*, *Sản phẩm vuốt tóc/uốn nhuộm không ưng ý*, ...).
  - Checkbox & Input "Lý do khác: ..." cho phép khách tự gõ lý do.
- Nút **"TIẾP TỤC →" (CONTINUE →)**.

### Bước 4: Thưởng Tip khích lệ nhân viên (Motivational Tips for Employees)
- Nút quay lại (`←`).
- Hiển thị theo từng KTV đã phục vụ kèm huy hiệu mức đánh giá vừa chọn (Ví dụ: `Reviewed: 😍 Very good` hoặc `😫 Poor`).
- Lựa chọn mức Tip nhanh cho từng KTV:
  - Các nút mệnh giá: `20.000 đ`, `50.000 đ`, `100.000 đ`, `200.000 đ`.
  - Có nút `Deselect` / bỏ chọn khi bấm lại.
  - Nút `Khác` (Other) cho phép nhập số tiền tuỳ ý.
- Nút **"TIẾP TỤC THANH TOÁN →" (PROCEED TO PAYMENT →)** hoặc **"BỎ QUA TIP"**.

### Bước 5: Tổng kết & Hoàn tất (Summary & Thank You)
- Bảng tổng kết số tiền thanh toán cuối cùng (Tổng hoá đơn + Tổng tiền tip các KTV).
- Nút xác nhận hoàn thành.
- Màn hình Lời cảm ơn (Thank you screen) với biểu tượng thành công và thông điệp cảm kích khách hàng.

---

## 3. Cơ Chế Đồng Bộ Thời Gian Thực (Realtime Sync: Phone ⇋ POS Thu Ngân)

### Trạng thái đánh giá của hoá đơn:
1. `unreviewed` (Mặc định):
   - Tab bar hoá đơn: Bình thường.
   - Icon Smile ở TicketColumn: Màu xám (`text-slate-500`).
   - Popup QR: Hiển thị mã QR và trạng thái *"Đang chờ khách quét..."*.
2. `reviewing` (Khách đã quét QR và đang thao tác trên điện thoại):
   - Ngay khi khách mở link hoặc bấm bắt đầu, client gửi tín hiệu `status: 'reviewing'`.
   - Tab bar hoá đơn: Hiển thị chấm tròn vàng hoặc viền vàng cảnh báo `Đang đánh giá`.
   - Icon Smile ở TicketColumn: Đổi sang màu vàng hổ phách (`text-amber-500 bg-amber-50 animate-pulse`).
   - Popup QR: Cập nhật thành *"Khách hàng đang thực hiện đánh giá..."* (Màu vàng).
3. `reviewed` / `completed` (Khách đã gửi đánh giá và tip xong):
   - Client gửi tín hiệu `status: 'done'`, kèm dữ liệu `ratings`, `reasons`, `tip`, `tipSplits`, `customerInfo`.
   - Tab bar hoá đơn: Hiển thị chấm tròn xanh lá `Đã đánh giá`.
   - Icon Smile ở TicketColumn: Đổi sang màu xanh lá (`text-emerald-500 bg-emerald-50`).
   - Popup QR: Chuyển sang màn hình thành công, hiển thị chi tiết điểm số từng KTV và tự động cộng tiền Tip vào Session POS của thu ngân.

### Kênh truyền dữ liệu:
- **Local Dev / Single Browser**: Sử dụng `localStorage` event listener (`glopro_review_${sessionId}`).
- **Production / Multi-device (Điện thoại khách & Máy tính thu ngân)**: Sử dụng kênh Supabase Realtime Broadcast (`supabase.channel('review_' + sessionId)`) hoặc cập nhật trường `review_status` & `review_data` trong cơ sở dữ liệu Invoice.

---

## 4. Phân Tách Công Việc (Task Breakdown)

### Task 1: Thiết kế giao diện & Logic trang Đánh giá khách hàng (`src/views/CustomerReview.jsx` & `/review/[id]`)
- [ ] Tích hợp Header chuẩn: Đồng hồ thời gian thực, Tên Salon/Logo, Bộ đổi ngôn ngữ (VI/EN).
- [ ] Xây dựng Bước 1: Form thông tin khách hàng + Date of Birth Wheel/Scroll Picker Modal.
- [ ] Xây dựng Bước 2: Màn hình xác nhận bảng kê hoá đơn (Dịch vụ, số lượng, đơn giá, khuyến mãi, tổng tiền).
- [ ] Xây dựng Bước 3: Đánh giá KTV theo dịch vụ với Emoji 4 cấp độ + Khối feedback checkbox & text khi đánh giá Kém.
- [ ] Xây dựng Bước 4: Màn hình Tip từng KTV với các mức 20k, 50k, 100k, 200k, Custom Tip và nút Deselect.
- [ ] Xây dựng Bước 5: Màn hình tổng kết tiền thanh toán kèm Tip & Thông điệp cảm ơn.
- [ ] Bổ sung đa ngôn ngữ (i18n) cho toàn bộ các text trên màn hình đánh giá.

### Task 2: Cập nhật Popup Quét Mã QR tại POS Thu Ngân (`ReviewQRModal` trong `src/views/POS.jsx`)
- [ ] Hỗ trợ 3 trạng thái: `waiting` (Chờ quét), `reviewing` (Đang đánh giá - màu vàng), `done` (Đã xong - màu xanh).
- [ ] Tạo mã QR động trỏ chính xác đến link `/review/${session.id}` (sử dụng component QRCodeSVG hoặc canvas chất lượng cao).
- [ ] Tự động cập nhật tiền tip và phân bổ tip (`tipSplits`) vào giỏ hàng thu ngân khi khách hoàn thành.

### Task 3: Cập nhật Chỉ Báo Trạng Thái Trên POS (`TicketColumn.jsx` & Tab Bar POS)
- [ ] Thêm trạng thái màu sắc cho nút Icon Đánh giá (`Smile`):
  - Xám: Chưa đánh giá.
  - Vàng (nhấp nháy): Đang đánh giá.
  - Xanh lá: Đã đánh giá thành công.
- [ ] Thêm chỉ báo màu sắc (Badge/Dot/Border) trên thanh Tab Bar đại diện cho từng hoá đơn khách hàng đang mở trên màn hình POS.

### Task 4: Kiểm Thử & Xác Minh (Verification)
- [ ] Kiểm thử luồng quét QR trên nhiều tab trình duyệt / thiết bị di động thật.
- [ ] Kiểm thử kịch bản khách quen (có sẵn thông tin) vs khách vãng lai (nhập mới + chọn ngày sinh).
- [ ] Kiểm thử kịch bản đánh giá hài lòng vs đánh giá kém kèm lý do.
- [ ] Kiểm thử phân bổ tiền Tip cho nhiều nhân viên và đồng bộ về hoá đơn thanh toán.
