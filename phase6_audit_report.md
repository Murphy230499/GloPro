# BÁO CÁO KIỂM TOÁN HỆ THỐNG & ĐÁNH GIÁ KHOẢNG TRỐNG KIẾN TRÚC — PHASE 6
## COMPREHENSIVE ARCHITECTURE & BUSINESS OPERATIONS AUDIT REPORT

**Dự án:** EasySalon AI Agent  
**Pha phát triển:** Phase 6 — Real Business Operations  
**Thời gian kiểm toán:** 2026-09-10  
**Vai trò:** Lead AI Architect, AI Safety Engineer, Business Analyst, Senior Full-Stack Engineer  

---

## 1. TỔNG QUAN KIỂM TOÁN (AUDIT OVERVIEW)

EasySalon đã hoàn thành vững chắc từ Phase 1 đến Phase 5.5 với:
- **Phase 1:** Business Brain, Phân loại Intent, Phân giải Entity, Ambiguity Gate.
- **Phase 2:** Read & Grounding Engine, Permission Gate, Chống ảo giác dữ liệu DB.
- **Phase 3:** Action Planner, Action Preview, Confirmation Gate, Safe Write Engine, Idempotency Guard, Stale State Detection, Post-Write Verification.
- **Phase 4:** Multi-Step Reasoning, Action Orchestrator, Partial Failure Handling, Conditional Staff Assignment.
- **Phase 5:** Natural Language Intelligence, TimeResolver, ConversationInterpreter, Đánh giá 120 Benchmark Scenarios.
- **Phase 5.5:** Red-Team Adversarial Evaluation, 230 kịch bản đối nghịch (200 development + 30 hold-out), Cổng an ninh PASS (0 Critical Security Failures), 0% Hallucination, 100% Regression Pass.

Mục tiêu của **Phase 6** là nâng cấp Agent từ khả năng *"hiểu và lập kế hoạch an toàn"* thành **"khả năng vận hành nghiệp vụ salon thực tế end-to-end"** trên dữ liệu thật của EasySalon:
1. Thu ngân & Hóa đơn (Cashier / Invoice).
2. Thanh toán đa phương thức (Payment & Split Payment).
3. **Tiền Tip & Thu hộ nhân viên (Tip Operations: TIP ≠ REVENUE)**, kể cả sau khi hóa đơn đã đóng.
4. Kho hàng & Xuất nhập tồn (Inventory & Stock Movements).
5. Nhân sự, Lịch làm việc & Tự sửa kế hoạch (Staff Availability & Self-Correction Fallback).
6. Bảng lương & Thu nhập nhân viên (Payroll & Commission Breakdown).
7. Báo cáo & Lớp ngữ nghĩa chỉ số kinh doanh (Reports & Metric Semantic Layer).

---

## 2. HIỆN TRẠNG KIẾN TRÚC & KHẢ NĂNG TÁI SỬ DỤNG (WHAT EXISTS & CAN BE REUSED)

### 2.1. Tầng Dữ liệu & Dịch vụ Kinh doanh (Business Services & Data Layer)
- **Supabase & Base44 Client:**
  - `base44.entities.Invoice`: Đã có sẵn API CRUD cho hóa đơn, quản lý `items`, `subtotal`, `discount`, `tip`, `tip_splits`, `total`, `status` (`draft`, `paid`, `cancelled`).
  - `base44.entities.CashVoucher`: Đã có sẵn trong [`src/lib/cashFlowHelper.js`](file:///Volumes/Coding/GloPro/src/lib/cashFlowHelper.js) hỗ trợ tạo Phiếu thu (`income`) và Phiếu chi (`expense`). Đặc biệt loại phiếu `tip` (`typeCode: 'tip'`, `flow: 'income'`) đã được định nghĩa chuẩn trong hệ thống sổ quỹ dòng tiền!
  - `base44.entities.Product`: Quản lý tồn kho (`stock`), định mức tồn tối thiểu (`min_stock`), giá nhập/giá bán.
  - `base44.entities.Staff`: Quản lý danh sách kỹ thuật viên, chức vụ (`role`), chi nhánh (`branch_id`).
  - `base44.entities.StaffCommissionRule`: Đã có trong [`src/lib/commissionHelper.js`](file:///Volumes/Coding/GloPro/src/lib/commissionHelper.js) hỗ trợ tính hoa hồng dịch vụ, sản phẩm, yêu cầu thợ, ngoài giờ.
  - `base44.entities.Appointment`: Quản lý lịch hẹn, trạng thái (`pending`, `confirmed`, `completed`, `cancelled`), nhân viên phục vụ, khung giờ bắt đầu/kết thúc.

### 2.2. Tầng An toàn & Điều phối AI Brain (`src/ai-brain/`)
- **`PermissionGate` (Read-Engine):** Kiểm soát phân quyền dựa trên `role` của người dùng (`owner`, `manager`, `technician`, `receptionist`). Kỹ thuật viên không có quyền xem báo cáo tài chính toàn chi nhánh.
- **`ConfirmationGate` (Action-Engine):** Bắt buộc xác nhận của con người trước khi thực thi các hành động ghi tài chính (Thanh toán, Hủy hóa đơn, Refund, Nhập/Xuất kho).
- **`IdempotencyGuard`:** Chống thực thi trùng lặp (`ALREADY_APPLIED`) thông qua hash khóa `idempotencyKey` + `actionReference`.
- **`PostWriteVerification`:** Truy vấn lại cơ sở dữ liệu sau khi ghi để xác thực bản ghi đã thực sự tồn tại với các trường dữ liệu hợp lệ.
- **`ActionOrchestrator`:** Điều phối chuỗi hành động phụ thuộc (Ví dụ: Tạo hóa đơn -> Thêm dịch vụ -> Thanh toán), hỗ trợ báo cáo `PARTIAL_SUCCESS` khi một bước thất bại.

---

## 3. CÁC ĐIỂM THIẾU & KHOẢNG TRỐNG CẦN XÂY DỰNG (ARCHITECTURE GAPS)

| Phân hệ nghiệp vụ | Hiện trạng trong AI Brain | Khoảng trống cần xây dựng trong Phase 6 |
| :--- | :--- | :--- |
| **1. Cashier & Invoice** | Mới có `InvoiceReadTool` (đọc hóa đơn). Chưa có write-tool trong `src/ai-brain/action-engine/write-tools/`. | Cần xây dựng `InvoiceCreateTool`, `InvoiceItemAddTool`, `InvoiceUpdateTool` tương thích với `IActionContract` và `ConfirmationGate`. Giá dịch vụ/sản phẩm bắt buộc phải ground từ DB thật, không được hallucinate. |
| **2. Payment & Checkout** | Chưa có tool thanh toán an toàn trong `src/ai-brain/action-engine/`. | Cần `InvoiceCheckoutTool` & `PaymentAddTool` hỗ trợ tiền mặt, chuyển khoản, thẻ, thanh toán tách dòng (Split Payment) với kiểm tra `stale-state` (tránh thanh toán đè khi hóa đơn đã được thu ngân khác thu). |
| **3. Tip Operations** | `RevenueReadTool` đã tách tip ra khỏi báo cáo. `EasySalonBrain` nhận diện được `TIP_OPERATION`. | Cần `TipRecordTool`: Xử lý ghi nhận tiền tip thu hộ kỹ thuật viên, tạo `CashVoucher` phiếu thu quỹ, **đảm bảo TIP ≠ REVENUE**. Đặc biệt hỗ trợ kịch bản: **Hóa đơn đã thanh toán xong, sau đó khách mới tip** -> Tạo phiếu thu hộ độc lập mà không cần mở lại/sửa đổi hóa đơn doanh thu! |
| **4. Inventory & Stock** | Mới có `ProductReadTool` (đọc sản phẩm). Chưa có tool xuất nhập tồn trong AI Brain. | Cần `StockAdjustTool` & `StockReceiveTool`: Kiểm tra quyền hạn, chốt kho, ghi nhận biến động tồn kho thật, không hallucinate số lượng tồn. |
| **5. Staff Availability & Fallback** | `IntentDecomposer` có cờ `fallbackStrategy: FIND_AVAILABLE_STAFF`. | Cần tích hợp logic kiểm tra lịch thợ thời gian thực: Nếu thợ chỉ định bận -> tự động truy vấn tìm thợ khác khả dụng trong chi nhánh -> lập kế hoạch dự phòng -> thông báo rõ ràng cho khách. |
| **6. Payroll Breakdown** | Chưa có `PayrollReadTool` chuyên trách trong `src/ai-brain/read-engine/`. | Cần `PayrollReadTool` kết nối `commissionHelper.js` và bảng lương để giải trình minh bạch: Lương cơ bản + Hoa hồng + Thưởng - Phạt + Tip thu hộ = Thực nhận. |
| **7. Semantic Metric Layer** | Khái niệm doanh thu phân tán ở một số hàm. | Cần xây dựng một từ điển ngữ nghĩa chuẩn (`MetricSemanticLayer`): Định nghĩa phân biệt tuyệt đối giữa `REVENUE`, `CASH_FLOW`, `TIP`, `PAYMENT`, `COMMISSION`, `OUTSTANDING`. |

---

## 4. BẢN ĐỒ DỊCH VỤ & API CÓ THỂ GỌI TRỰC TIẾP (DIRECT REUSABLE SERVICES)

1. **`src/lib/cashFlowHelper.js`:**
   - `createIncomeVoucher(...)`: Gọi trực tiếp khi ghi nhận dòng tiền vào (bao gồm cả dòng tiền bán hàng `sale` và dòng tiền tip `tip`).
   - `createExpenseVoucher(...)`: Gọi trực tiếp khi xuất quỹ chi trả (chi lương, hoàn tiền).
2. **`src/lib/commissionHelper.js`:**
   - `calculateItemCommission(...)`: Tái sử dụng để tính hoa hồng chính xác theo quy tắc salon mà không tự bịa công thức.
3. **`src/api/base44Client.js` (hoặc `src/api/supabaseClient.js`):**
   - `base44.entities.Invoice`: `create`, `update`, `get`, `list`, `delete`.
   - `base44.entities.Product`: `get`, `list`, `update` (cập nhật tồn kho).
   - `base44.entities.Appointment`: `get`, `list`, `create`, `update`.
   - `base44.entities.Staff`: `list`, `get`.
   - `base44.entities.CashVoucher`: `list`, `create`.

---

## 5. RỦI RO KHI TÍCH HỢP & CHIẾN LƯỢC KIỂM SOÁT (RISKS & MITIGATION)

1. **Rủi ro Trộn lẫn Tiền Tip vào Doanh thu Salon (Financial Integrity Risk):**
   - *Nguy cơ:* Báo cáo doanh thu bị phóng đại sai lệch, dẫn đến tính thuế và chia lợi nhuận sai.
   - *Kiểm soát:* `BusinessRulesRegistry` đặt quy tắc cứng P0: Doanh thu = Tiền hàng + Tiền dịch vụ (sau chiết khấu); Tiền tip hoàn toàn nằm ở tài khoản trung gian thu hộ nhân viên.
2. **Rủi ro Xung đột Trạng thái Hóa đơn (Stale State / Race Condition):**
   - *Nguy cơ:* AI chuẩn bị kế hoạch thanh toán 500k, nhưng trong lúc chờ người dùng nhấn xác nhận, thu ngân tại quầy đã bấm thanh toán hóa đơn đó.
   - *Kiểm soát:* `ActionPreconditionValidator` bắt buộc re-fetch trạng thái hóa đơn tại thời điểm trước khi ghi (Pre-execution check). Nếu `status === 'paid'`, lập tức hủy thao tác với mã `ALREADY_APPLIED`.
3. **Rủi ro Thanh toán Trùng lặp (Duplicate Payment):**
   - *Nguy cơ:* Người dùng bấm 2 lần hoặc mạng chập chờn gửi 2 lệnh thanh toán liên tiếp.
   - *Kiểm soát:* `IdempotencyGuard` tạo mã hash dựa trên `invoiceId` + `actorId` + `timestampWindow` để chặn đứng lệnh thứ hai.
4. **Rủi ro Ảo giác Giá cả & Tồn kho (Hallucination Risk):**
   - *Nguy cơ:* AI tự bịa giá dịch vụ hoặc bịa số lượng chai dầu gội còn trong kho.
   - *Kiểm soát:* Grounding Engine bắt buộc truy vấn dữ liệu thực từ DB. Nếu không tìm thấy sản phẩm/dịch vụ -> Phản hồi `NOT_FOUND` hoặc yêu cầu `CLARIFICATION`, tuyệt đối không tự điền số liệu.

---

## 6. ĐỀ XUẤT KIẾN TRÚC PHASE 6 (PROPOSED ARCHITECTURE)

Giữ nguyên pipeline chuẩn mực:

```text
USER REQUEST
     ↓
ConversationInterpreter / EasySalonBrain
     ↓
Intent & Entity Resolution (Customer, Service, Staff, Product, Amount, Method)
     ↓
Metric Semantic Layer (Xác định đúng bản chất: REVENUE vs TIP vs CASH_FLOW)
     ↓
Data Grounding (Truy vấn DB thật: Giá, Tồn kho, Lịch trống thợ)
     ↓
Self-Correction & Fallback (Nếu thợ bận -> Tìm thợ trống khả dụng)
     ↓
Business Rules Validation (Kiểm tra quy tắc nghiệp vụ, tính toàn vẹn)
     ↓
Action Planner (Sinh Action Plan: BEFORE -> AFTER Preview)
     ↓
Permission Gate & Confirmation Gate (Bắt buộc xác nhận cho giao dịch tài chính)
     ↓
Safe Execution (Thực thi qua Service nghiệp vụ hiện có)
     ↓
Post-Write Verification (Xác minh lại trạng thái DB thực tế)
     ↓
Audit Log & Observability (Ghi nhận lịch sử giao dịch)
     ↓
Final Response to User
```

---

## 7. KẾT LUẬN & ĐIỀU KIỆN TIẾP TỤC

Kiểm toán hoàn tất và cho thấy kiến trúc hiện tại của EasySalon hoàn toàn sẵn sàng để tiếp nhận Phase 6 mà không cần thay đổi cấu trúc cơ sở dữ liệu.

*Báo cáo được lập bởi Lead AI Architect & Senior Full-Stack Engineer.*
