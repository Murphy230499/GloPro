# PHASE 6 BUSINESS RULES SPECIFICATION
## EASY SALON AI AGENT — REAL SALON OPERATIONS

---

## 1. NGUYÊN TẮC BẤT BIẾN (INVIOLABLE PRINCIPLES)

### 🔴 QUY TẮC SỐ 1: TIP ≠ REVENUE (TIỀN TIP KHÔNG PHẢI DOANH THU)
* **Bản chất kế toán:** Tiền tip là khoản tiền thưởng trực tiếp từ khách hàng cho nhân viên kỹ thuật. Salon chỉ đóng vai trò thu hộ và chi trả lại cho nhân viên.
* **Ghi nhận:**
  * Doanh thu thuần của salon = `Tổng tiền dịch vụ + Sản phẩm - Chiết khấu`.
  * Khách thanh toán hóa đơn 1.000.000 đ + 200.000 đ tiền tip:
    * Doanh thu salon: **1.000.000 đ**.
    * Thu hộ nhân viên: **200.000 đ**.
    * Tổng dòng tiền khách đưa: **1.200.000 đ**.
* **Cấm tuyệt đối:**
  * Không bao giờ cộng tip vào doanh thu salon (`isSalonRevenue === false`).
  * Không đưa tip vào báo cáo doanh thu dịch vụ hay báo cáo P&L lợi nhuận salon.

### 🔴 QUY TẮC SỐ 2: TIP SAU THANH TOÁN (POST-PAID TIP)
* Khi khách hàng đã thanh toán hóa đơn (`PAID`), nếu sau đó khách muốn tip thêm cho nhân viên:
  * Không revert hóa đơn về `UNPAID`.
  * Không sửa hóa đơn gốc để tránh sai lệch chứng từ và hóa đơn điện tử.
  * AI phải tạo một phiếu thu hộ độc lập (`CashVoucher` với code `tip`, `flow: 'income'`), gắn đúng `employee_id` và phương thức thanh toán.

### 🔴 QUY TẮC SỐ 3: PHÂN BIỆT PHƯƠNG THỨC THANH TOÁN TÁCH BIỆT
* Khi khách thanh toán hóa đơn bằng một phương thức (ví dụ: Chuyển khoản ngân hàng) và tip bằng phương thức khác (ví dụ: Tiền mặt):
  * Hệ thống phải ghi nhận chính xác 2 dòng tiền riêng biệt.
  * Không được gộp chung thành một giao dịch đơn lẻ gây lệch két tiền mặt hoặc tài khoản ngân hàng.

---

## 2. QUY TẮC NGHIỆP VỤ THU NGÂN & BÁN HÀNG (CASHIER & INVOICE)

1. **Không bịa giá (No Hallucinated Prices):**
   * Giá dịch vụ và sản phẩm phải được lấy trực tiếp từ cơ sở dữ liệu (`base44.entities.Service` và `base44.entities.Product`).
   * Nếu có nhiều dịch vụ trùng tên hoặc có nhiều phân khúc giá, AI phải kích hoạt Ambiguity Gate để hỏi lại người dùng.
2. **Kiểm tra công nợ & trạng thái hóa đơn:**
   * Một hóa đơn đã thanh toán hoàn tất (`PAID`) không thể thanh toán thêm lần nữa.
   * Số tiền thanh toán (`paid_amount`) không được vượt quá số tiền còn lại phải trả (`remaining_amount`) trừ khi có ghi nhận tiền tip.
3. **Idempotency & Double-Submit Protection:**
   * Mọi yêu cầu thanh toán (`CHECKOUT_INVOICE`) hoặc ghi nhận tip phải kèm theo mã giao dịch duy nhất `idempotencyKey = ${actorId}_${actionType}_${referenceId}`.
   * Nếu yêu cầu được gửi lại trong vòng 5 phút, trả về trạng thái `ALREADY_APPLIED` và tuyệt đối không ghi nhận giao dịch kép.

---

## 3. QUY TẮC NGHIỆP VỤ KHO & TỒN KHO (INVENTORY)

1. **Quyền hạn cập nhật kho:**
   * Chỉ nhân viên có vai trò `owner`, `manager` hoặc quyền `inventory` mới được phép thực hiện điều chỉnh kho (`RECEIVE_STOCK`, `ADJUST_STOCK`).
   * Nhân viên phục vụ hoặc khách hàng không được phép thao tác.
2. **Tính toán số lượng tồn thực tế:**
   * AI không được dự đoán hoặc suy diễn số lượng tồn kho.
   * Khi nhập kho (+N sản phẩm): `newStock = currentStock + N`.
   * Khi xuất kho hoặc điều chỉnh giảm: `newStock = Math.max(0, currentStock - N)` (không cho phép tồn âm trừ cấu hình đặc biệt).
3. **Xác thực sau ghi (Post-Write Verification):**
   * Sau khi gọi lệnh update, tool phải đọc lại bản ghi sản phẩm từ cơ sở dữ liệu để đối soát giá trị `stock` thực tế trước khi báo thành công cho người dùng.

---

## 4. QUY TẮC NHÂN SỰ & TÍNH LƯƠNG (STAFF & PAYROLL)

1. **Cơ cấu bảng lương nhân viên:**
   * `Tổng thực nhận = Lương cứng + Hoa hồng dịch vụ/sản phẩm + Thưởng - Khấu trừ phạt + Tiền TIP thu hộ`.
   * Tiền tip phải được liệt kê thành một mục thu hộ riêng biệt, không nhập nhằng vào hoa hồng doanh số (`commission`).
2. **Doanh số thợ (Staff Revenue) vs Doanh thu salon:**
   * Doanh số thợ phản ánh hiệu suất lao động cá nhân của nhân viên đó trên các đầu việc họ trực tiếp đảm nhận.
   * Khi user hỏi: "Hôm nay Minh làm được bao nhiêu tiền?", AI phải trả lời doanh số dịch vụ/sản phẩm của Minh, không cộng dồn tiền tip vào mục này.
