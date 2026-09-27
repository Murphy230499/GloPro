# HƯỚNG DẪN VẬN HÀNH NGHIỆP VỤ THỰC TẾ — PHASE 6
## EASY SALON AI AGENT WALKTHROUGH

---

## 1. CÁC NGHIỆP VỤ VẬN HÀNH CHÍNH

### 1.1. Nghiệp vụ Thu ngân & Tạo Hóa đơn (Cashier / Invoicing)
* **Câu lệnh người dùng:**
  > *"Tạo hóa đơn cho chị Lan làm nhuộm tóc 375.000 đ"*
* **Quy trình AI thực thi:**
  1. Tra cứu khách hàng "Lan" -> Nhận diện `Võ Thị Thu Lan` (0912222003).
  2. Tra cứu bảng giá dịch vụ "nhuộm tóc" từ cơ sở dữ liệu (không hallucinate giá).
  3. Lập kế hoạch `CREATE_INVOICE`.
  4. Trình bày Action Preview trước khi ghi.
  5. Sau khi người dùng đồng ý, gọi `InvoiceCreateTool` và thực hiện Post-Write Verification.

### 1.2. Nghiệp vụ Thanh toán & Quản lý Tiền Tip (Payment & Tip)
* **Hard Rule:** `TIP ≠ REVENUE`.
* **Trường hợp 1: Thanh toán đồng thời hóa đơn và tip**
  > *"Khách thanh toán bill 1 triệu và tip 200 nghìn cho Minh bằng chuyển khoản QR"*
  * AI tính toán:
    * Doanh thu ghi nhận salon: **1.000.000 đ**.
    * Phiếu thu hộ tip cho Minh: **200.000 đ**.
    * Tổng mã QR thanh toán: **1.200.000 đ**.
* **Trường hợp 2: Tip sau khi hóa đơn đã thanh toán (Post-Paid Tip)**
  > *"Thêm 200 nghìn tip cho Minh bằng tiền mặt"* (khi bill đã hoàn tất)
  * AI giữ nguyên hóa đơn ở trạng thái `PAID` (không revert).
  * Tạo phiếu thu tiền tip độc lập (`CashVoucher`) gắn trực tiếp vào nhân viên Minh.

### 1.3. Nghiệp vụ Quản lý Kho & Xuất Nhập (Inventory)
* **Câu lệnh tra cứu:**
  > *"Kho chi nhánh còn bao nhiêu chai Dầu gội Argan?"*
  * AI sử dụng `InventoryReadTool` đọc trực tiếp `stock` từ bảng `Product` trong Supabase.
* **Câu lệnh nhập hàng:**
  > *"Nhập thêm 20 chai Dầu gội Argan vào kho"*
  * AI kiểm tra thẩm quyền, hiển thị preview (+20 chai, tồn cũ -> tồn mới), sau khi xác nhận sẽ cập nhật vào hệ thống và đối soát lại.

### 1.4. Lập lịch linh hoạt & Tự tìm thợ thay thế (Self-Correction Fallback)
* **Câu lệnh người dùng:**
  > *"Mai chị Lan qua cắt tóc lúc 3h, xếp Minh, nếu Minh bận thì tìm thợ khác."*
* **Xử lý:**
  * Kiểm tra nhân viên ưu tiên (Minh).
  * Nếu Minh đã có lịch hẹn trùng giờ, hệ thống tự động quét danh sách nhân viên cùng bộ phận trong chi nhánh còn khung giờ trống từ 15:00 - 15:45.
  * Tự động đề xuất kỹ thuật viên thay thế phù hợp trong kế hoạch tạo lịch hẹn.

---

## 2. CHỨNG MINH KẾT QUẢ KIỂM THỬ

* **Real-World Operations Benchmark:** Đạt **330/330 (100.0%)** kịch bản thực tế.
* **Hold-out Benchmark:** Đạt **46/50 (92.0%)** kịch bản kiểm thử độ tổng quát hóa.
* **10 Acceptance Tests (Mục 31):** Đạt **10/10 (100%)** tuyệt đối.
* **Toàn bộ regression từ Phase 1 đến Phase 5.5:** Đạt **100% Pass** không suy giảm.
