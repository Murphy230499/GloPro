# BÁO CÁO KIỂM TOÁN KIẾN TRÚC VÀ ĐÁNH GIÁ TRƯỚC TRIỂN KHAI PHASE 5
## EASY SALON AI AGENT: AGENT INTELLIGENCE & REAL-WORLD EVALUATION AUDIT

---

### 1. KIẾN TRÚC HIỆN TẠI (CURRENT ARCHITECTURE OVERVIEW)
Sau khi hoàn thành 4 giai đoạn, kiến trúc của EasySalon AI Agent gồm các tầng:
```text
USER REQUEST
    ↓
BUSINESS BRAIN (EasySalonBrain / IntentDecomposer)
    ↓
STRUCTURED INTENT & ENTITY RESOLUTION (EntityResolver, DateTimeParser)
    ↓
AMBIGUITY GATE (AmbiguityGate & defaultBusinessRulesRegistry)
    ↓
READ & PERMISSION GATE (GroundingEngine, PermissionGate)
    ↓
ACTION PLANNER (ActionPlanner - Single & Multi-step DAG)
    ↓
PRECONDITION VALIDATION (ActionPreconditionValidator, BusinessRuleEngine)
    ↓
ACTION PREVIEW (ActionPreview - Unified Card)
    ↓
CONFIRMATION GATE (ConfirmationGate - Plan & Action Level, TTL 10m)
    ↓
ACTION ORCHESTRATOR (ActionOrchestrator - Kahn Topological Sort, Parameter Piping)
    ↓
SAFE WRITE ENGINE (ActionExecutor - IdempotencyGuard, Stale State Detection)
    ↓
WRITE TOOLS (CustomerCreateTool, CustomerUpdateTool, AppointmentCreateTool, AppointmentCancelTool)
    ↓
DATABASE (Supabase PostgreSQL / Base44 Service Layer)
    ↓
POST-WRITE VERIFICATION & AUDIT LOG (ActionAuditLog)
    ↓
FINAL RESPONSE (Grounded Response)
```

---

### 2. TÌNH TRẠNG CÁC GIAI ĐOẠN 1–4 (INDEPENDENT AUDIT VERIFICATION)

Đã kiểm thử thực tế toàn bộ các test cases hiện hữu:
- **Phase 1 (Business Brain & Ambiguity Gate):** `10 / 10 PASSED (100%)`
- **Phase 2 (Read & Grounding Engine, Permissions):** `15 / 15 PASSED (100%)`
- **Phase 3 (Safe Write Engine & Confirmation Gate):** `40 / 40 PASSED (100%)`
- **Phase 4 (Multi-Step DAG & Action Orchestration):** `60 / 60 PASSED (100%)`
- **TypeScript Typecheck (`npm run typecheck`):** `0 errors`
- **Tổng cộng:** `125 / 125 PASSED (100%)`.

---

### 3. NĂNG LỰC HIỂU NGÔN NGỮ HIỆN TẠI & NHỮNG HẠN CHẾ CẦN NÂNG CẤP TRONG PHASE 5

Mặc dù hệ thống Action Engine và Write Pipeline rất an toàn và đạt 100% test case, tầng **Agent Intelligence (Hiểu & Phân giải Ngôn ngữ Tự nhiên)** vẫn còn những điểm yếu khi đối mặt với ngôn ngữ hội thoại salon thực tế:

#### 3.1. Entity Resolution (Phân giải thực thể)
- **Hiện tại:** `EntityResolver.ts` dựa vào một số regex trực tiếp (`khách X`, `chị X`, `anh X`, v.v.).
- **Điểm yếu:**
  - Chưa hỗ trợ tốt các biến thể xưng hô đa dạng: *"cô Hoa"*, *"bác Nam"*, *"em Trang"*, *"bé Linh"*.
  - Chưa xử lý tìm kiếm mờ (Fuzzy matching) khi tên không dấu (*"Nguyen Thi Lan"* vs *"Nguyễn Thị Lan"*), viết tắt hoặc sai chính tả nhẹ.
  - Chưa có bảng xếp hạng ứng viên (Confidence Tiers: HIGH, MEDIUM, LOW) mà đang chọn theo quy tắc cứng.
  - Chưa phân giải các thực thể phụ trợ khác: dịch vụ (service), sản phẩm (product), gói liệu trình (treatment/package), phương thức thanh toán.

#### 3.2. Time & Date Resolution (Phân giải thời gian)
- **Hiện tại:** `DateTimeParser.ts` đã phân biệt tốt exact time vs vague range (sáng, chiều).
- **Điểm yếu:**
  - Chưa hỗ trợ các cách nói thời gian tự nhiên của người Việt như: *"3 rưỡi"*, *"3h30"*, *"khoảng 3h"*, *"sau 4h"*, *"trước 5h"*, *"tối mai"*, *"thứ hai tuần sau"*, *"cuối tuần"*.
  - Timezone cần đảm bảo đồng bộ hoàn toàn với application context (Asia/Ho_Chi_Minh).

#### 3.3. Intent Understanding & Context Tracking (Đa lượt & Hiệu chỉnh)
- **Hiện tại:** `AgentContextManager.ts` đã phân giải được các đại từ đơn giản (*"khách này"*, *"lịch này"*).
- **Điểm yếu:**
  - Khi hội thoại kéo dài 4–5 turns (User: *"Đặt lịch chị Lan"* → AI: *"Dịch vụ gì?"* → User: *"Cắt tóc"* → AI: *"Ngày nào?"* → User: *"Mai"* → AI: *"Mấy giờ?"* → User: *"4h"*), hệ thống cần tích lũy và tổng hợp toàn bộ state một cách liền mạch mà không làm rơi rụng thông tin.
  - Xử lý hiệu chỉnh đa thực thể (Correction): ví dụ người dùng nói *"Không phải chị Lan, chị Hoa"* hoặc *"Đổi sang thợ Minh"*, cần thay thế đúng thực thể mà vẫn giữ nguyên các thực thể đã xác nhận khác (ngày, giờ, dịch vụ).
  - Xử lý từ chối/hủy bỏ (*"Thôi"*, *"Hủy đi"*, *"Không đặt nữa"*): cần nhận diện chính xác ý định hủy thao tác chờ thay vì hiểu nhầm là lệnh tìm kiếm hay câu nói chung chung.

#### 3.4. Thiếu Tầng Kiểm Tra Tự Thân (Understanding Validator & Self-Check Before Action)
- Chưa có tầng trung gian độc lập kiểm tra tính nhất quán trước khi chuyển sang `ActionPlanner`:
  - Ý định có hợp lệ không?
  - Các entity bắt buộc đã được resolve chưa?
  - Có mâu thuẫn giữa câu lệnh và ngữ cảnh không?
  - Tỷ lệ tự tin (Deterministic Confidence Score) có đủ để tạo plan không?

#### 3.5. Thiếu Bộ Framework Đánh Giá & Benchmark Khách Quan (Evaluation Framework)
- Hiện tại chưa có bộ benchmark chuyên biệt gồm 100+ kịch bản ngôn ngữ tự nhiên tiếng Việt thực tế của salon để đo lường các chỉ số cốt lõi: Intent Accuracy, Entity Accuracy, Time Accuracy, Context Accuracy, Ambiguity Safety, Hallucination Rate, Safety Score.

---

### 4. ĐỀ XUẤT KIẾN TRÚC PHASE 5 (PROPOSED CHANGES & ARCHITECTURE)

Không phá vỡ cấu trúc Phase 1–4, xây dựng thêm 2 module chính trong `src/ai-brain/`:

#### 4.1. Module `src/ai-brain/intelligence/`
1. **`IntentUnderstanding.ts`**: Phân loại ý định mở rộng, hỗ trợ các mẫu câu tự nhiên không cần cú pháp cứng nhắc, phân tích cấu trúc đa ý định.
2. **`EntityResolver.ts` (Nâng cấp / Chuyên sâu)**: Phân giải Customer, Staff, Service, Product với Fuzzy Matching (bỏ dấu tiếng Việt, xử lý xưng hô: cô, chú, bác, anh, chị, em, bé), phân cấp độ tin cậy HIGH / MEDIUM / LOW, tuyệt đối không đoán bừa.
3. **`TimeResolver.ts`**: Chuẩn hóa biểu thức thời gian tiếng Việt (*"3 rưỡi"*, *"3h chiều"*, *"sau 4h"*, *"tuần sau"*, v.v.) dựa trên deterministic date logic và application timezone.
4. **`AmbiguityDetector.ts`**: Phát hiện sự mơ hồ chi tiết (thiếu thông tin nào, có bao nhiêu ứng viên trùng tên) và tạo câu hỏi làm rõ tự nhiên, cụ thể.
5. **`ConfidenceScorer.ts`**: Mô hình chấm điểm tin cậy xác định (Deterministic formula kết hợp Intent, Entity, Time, Context, Rule confidence).
6. **`UnderstandingValidator.ts`**: Tầng Self-check kiểm duyệt toàn bộ đầu ra hiểu trước khi giao cho `ActionPlanner`.
7. **`ConversationInterpreter.ts`**: Phối hợp toàn diện giữa đa lượt hỏi đáp (multi-turn), nhận diện tương tác (`NEW_INTENT`, `FOLLOW_UP`, `CORRECTION`, `CANCELLATION`, `CLARIFICATION`).

#### 4.2. Module `src/ai-brain/evaluation/`
1. **`EvaluationCase.ts`**: Định nghĩa contract cho 1 kịch bản kiểm thử (id, category, input, conversation history, context, expected output).
2. **`ScenarioRegistry.ts` & `scenarios/`**: Chứa hơn 100 kịch bản tiếng Việt thực tế chia thành 8 nhóm nghiệp vụ:
   - `intent.scenarios.ts` (>= 20 ca)
   - `entity.scenarios.ts` (>= 20 ca)
   - `datetime.scenarios.ts` (>= 15 ca)
   - `context.scenarios.ts` (>= 15 ca)
   - `correction.scenarios.ts` (>= 10 ca)
   - `ambiguity.scenarios.ts` (>= 10 ca)
   - `multistep.scenarios.ts` (>= 10 ca)
   - `safety.scenarios.ts` (>= 10 ca)
3. **`EvaluationRunner.ts`**: Công cụ chạy tự động toàn bộ scenario và so sánh chi tiết Actual vs Expected.
4. **`EvaluationScorer.ts`**: Tính toán các chỉ số: Intent Accuracy, Entity Accuracy, Time Accuracy, Context Accuracy, Ambiguity Safety, Hallucination Rate, Safety Accuracy, Overall Score.
5. **`FailureAnalyzer.ts`**: Phân tích sâu nguyên nhân thất bại của từng ca (Category, Missing entity, Time mismatch, v.v.).
6. **`EvaluationReport.ts`**: Xuất báo cáo tự động ra file `phase5_evaluation_report.md`.

---

### 5. DANH SÁCH FILE DỰ KIẾN TẠO MỚI & THAY ĐỔI
- **Tạo mới:**
  - `src/ai-brain/intelligence/TimeResolver.ts`
  - `src/ai-brain/intelligence/EntityResolver.ts` (hoặc nâng cấp tích hợp)
  - `src/ai-brain/intelligence/AmbiguityDetector.ts`
  - `src/ai-brain/intelligence/ConfidenceScorer.ts`
  - `src/ai-brain/intelligence/UnderstandingValidator.ts`
  - `src/ai-brain/intelligence/ConversationInterpreter.ts`
  - `src/ai-brain/evaluation/EvaluationCase.ts`
  - `src/ai-brain/evaluation/ScenarioRegistry.ts`
  - `src/ai-brain/evaluation/EvaluationRunner.ts`
  - `src/ai-brain/evaluation/EvaluationScorer.ts`
  - `src/ai-brain/evaluation/FailureAnalyzer.ts`
  - `src/ai-brain/evaluation/scenarios/*.scenarios.ts`
- **Cập nhật nhẹ (giữ 100% backward compatibility):**
  - `src/ai-brain/index.ts`
  - `src/ai-brain/EasySalonBrain.ts`
  - `src/app/api/copilot/route.js` (kết nối UnderstandingValidator)
- **Báo cáo:**
  - `phase5_audit_report.md` (file này)
  - `phase5_evaluation_report.md`
  - `phase5_implementation_report.md`
  - `walkthrough.md`

---

### 6. QUẢN LÝ RỦI RO & CHIẾN LƯỢC TƯƠNG THÍCH (COMPATIBILITY STRATEGY)
1. **Zero Database Changes:** Tuyệt đối không thay đổi schema PostgreSQL hay migrations.
2. **Zero Breaking Changes to Write Pipeline:** Mọi ActionPlan, ConfirmationGate, ActionOrchestrator, WriteTools và PostWriteVerification của Phase 3 & 4 được bảo tồn nguyên vẹn.
3. **Regression Safety:** Đảm bảo toàn bộ 125 test cases cũ tiếp tục PASS 100% sau khi bổ sung Intelligence layer.
