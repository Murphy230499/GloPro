# BÁO CÁO KIỂM TOÁN KIẾN TRÚC & NĂNG LỰC LLM — PHASE 6.5
## EASY SALON AI AGENT: ĐÁNH GIÁ TRÍ TUỆ NGÔN NGỮ TỰ NHIÊN THỰC THỰC CỦA LLM

---

## 1. TỔNG QUAN KIỂM TOÁN

Báo cáo này được thực hiện trước khi viết bất kỳ dòng mã nào cho Phase 6.5, nhằm bóc tách ranh giới rõ ràng giữa **Deterministic Intelligence** (Logic quy tắc, biểu thức chính quy, heuristic tokens) và **LLM Intelligence** (Khả năng hiểu thực thụ của mô hình ngôn ngữ lớn từ tiếng Việt tự nhiên sang cấu trúc nghiệp vụ salon).

---

## 2. TRẢ LỜI 8 CÂU HỎI KIỂM TOÁN CỐT LÕI (SECTION 2)

### 2.1. LLM hiện đang tham gia ở đâu?
* **Thực tế:** Trong pipeline xử lý chính (`src/app/api/copilot/route.js`), LLM (Google Gemini) hiện chỉ được gọi ở **bước cuối cùng** (sau dòng 1080) để:
  1. Diễn đạt phản hồi tự nhiên (Natural Language Response Generation) từ dữ liệu đã được xác thực (Grounded Data Block).
  2. Xử lý câu hỏi trò chuyện thông thường (`GENERAL_CONVERSATION` / `UNKNOWN`).
  3. Gọi Function Calling dự phòng nếu tin nhắn chưa bị chặn bởi Business Brain hay Action Planner.
* **Hạn chế:** LLM chưa được đóng vai trò là **Bộ hiểu ngữ nghĩa tiên quyết (Primary Semantic Reasoner)** để phân loại intent, trích xuất thực thể phức tạp, theo dõi giả định ngầm hay phát hiện tính mơ hồ trong ngữ cảnh nhiều lượt thoại.

### 2.2. Rule-based logic đang tham gia ở đâu?
* **Thực tế:** Rule-based logic đang chiếm quyền chi phối tại:
  1. `EasySalonBrain.detectIntent`: Chứa chuỗi if/else regex kiểm tra từ khóa (`thanh toán bill`, `kho còn`, `bảng lương`, `tip`, `doanh thu`, v.v.).
  2. `IntentDecomposer.decompose`: Phân tách intent đơn/kép bằng regex patterns cố định.
  3. `EntityResolver` & `RobustEntityResolver`: Trích xuất tên khách, thợ, dịch vụ bằng regex tìm từ xưng hô (`chị`, `anh`, `thợ`, `xếp`).
  4. `TimeResolver`: Parse thời gian qua danh mục từ khóa (`hôm nay`, `mai`, `15h`, `chiều mai`).
  5. `AmbiguityDetector`: Kiểm tra thiếu slot bằng mảng `requiredFields`.
  6. `ActionPreconditionValidator`: Kiểm tra xung đột lịch và nhân viên trùng tên.

### 2.3. Có chỗ nào LLM chỉ được gọi sau khi parser đã quyết định intent không?
* **CÓ, hầu như toàn bộ pipeline:**
  * Tại dòng 842 `route.js`, `decomposed.originalDecision` hoặc `EasySalonBrain.processRequest` đã chốt intent trước.
  * Nếu intent là `CLARIFY` hoặc `DISAMBIGUATE`, hệ thống return ngay lập tức (dòng 846), LLM hoàn toàn không được gọi.
  * Nếu intent là write (`CREATE_APPOINTMENT`, `CANCEL_APPOINTMENT`, `CREATE_CUSTOMER`), hệ thống lập plan và return `PENDING_CONFIRMATION` (dòng 888) mà không qua LLM.
  * Nếu intent là read (`QUERY_REVENUE`, `SEARCH_CUSTOMER`, v.v.), `GroundingEngine` truy vấn DB trước, sau đó mới nạp chuỗi JSON vào system instruction của Gemini để Gemini viết lại văn bản.

### 2.4. Có chỗ nào benchmark đang vô tình test parser thay vì LLM?
* **CÓ, ở toàn bộ các benchmark Phase 1 → Phase 6:**
  * `EvaluationRunner.ts` (Phase 5: 120 cases): Gọi `ConversationInterpreter.interpret` và `IntentDecomposer.decompose`. Cả hai module này đều là parser thuần TypeScript chạy offline, không hề gửi request đến Gemini API.
  * `run_phase6_evaluation.ts` (Phase 6: 330 cases): Đo lường trực tiếp output của `EasySalonBrain` và `IntentDecomposer`.
  * `run_adversarial_redteam.ts` (Phase 5.5: 230 cases): Đo lường khả năng phòng thủ của parser và security regex.
* **Kết luận:** Tỷ lệ 330/330 (100%) của Phase 6 thực chất là **100% Deterministic Rule Coverage**, chưa hề đo lường năng lực suy luận thực tế của LLM khi đối mặt với tiếng Việt tự nhiên không theo khuôn mẫu.

### 2.5. Structured output hiện tại có đủ biểu diễn ambiguity không?
* **Chưa đủ toàn diện:**
  * Giao diện hiện tại (`IStructuredIntent`) chỉ có mảng `missingRequired: string[]` và `ambiguities: string[]`.
  * Thiếu trường phân tách rõ ràng giữa:
    * **Explicit Fact:** Thông tin do người dùng trực tiếp nói ra (ví dụ: "Lan").
    * **Inferred Assumption:** Giả định mà hệ thống/LLM tự suy luận (ví dụ: đoán Lan là khách quen có lịch cũ).
    * **Unknown:** Thông tin hoàn toàn chưa biết (ví dụ: dịch vụ làm gì).
  * Chưa có cấu trúc lưu trữ `contextReferences` (tham chiếu đại từ "chị ấy", "lịch đó") và `businessReasoning` (lập luận vì sao tip không phải doanh thu).

### 2.6. Có confidence từ LLM hay chỉ confidence từ deterministic layer?
* **Hiện tại chỉ có deterministic confidence:**
  * Trong `EasySalonBrain.ts`, confidence được gán cứng (`0.95` hoặc `0.98`).
  * `ConfidenceScorer.ts` chấm điểm dựa trên số lượng slot được điền bởi regex.
  * Chưa có cơ chế lấy `logprobs` hoặc yêu cầu LLM tự đánh giá mức độ chắc chắn (`self-assessed confidence: 0.0 - 1.0`) kèm căn cứ lý giải.

### 2.7. Có lưu raw LLM reasoning/output để evaluation không?
* **Chưa có kho lưu trữ riêng biệt:**
  * `auditLogger.ts` ghi nhận các sự kiện hành động (`AI_ACTION_VERIFIED`, `AI_PERMISSION_DENIED`).
  * Các prompt thô gửi lên Gemini, token usage, độ trễ và raw JSON output từ LLM chưa được ghi thành log có cấu trúc để phục vụ replay hoặc phân tích lỗi.

### 2.8. Có thể replay cùng một scenario không?
* **Hiện tại chưa thể replay đối soát LLM:**
  * Benchmark hiện tại chỉ chạy lại mã TypeScript cục bộ.
  * Không thể chạy một kịch bản với cùng một `promptVersion`, cố định `temperature`, và so sánh kết quả giữa các phiên bản mô hình (ví dụ: Gemini 3.6 Flash vs Gemini 2.5 Pro) hoặc giữa Prompt A và Prompt B.

---

## 3. RỦI RO & ĐỀ XUẤT KIẾN TRÚC PHASE 6.5

### 3.1. Rủi ro nếu giữ nguyên hiện trạng
1. **Ảo tưởng về chất lượng (Illusion of Intelligence):** 100% test pass nhưng khi nhân viên salon gõ tiếng lóng ("bữa nay tiệm làm ăn sao rồi", "cho con bé lan cắt quả đầu", "thối lại tiền thừa kẹp tip cho minh"), parser regex sẽ trượt và trả về `UNKNOWN` hoặc gán nhầm intent.
2. **Fragility (Dễ vỡ):** Mỗi khi thêm một cách diễn đạt mới, lập trình viên lại phải thêm `if (lower.includes(...))` khiến code ngày càng phình to và dễ sinh xung đột.

### 3.2. Đề xuất Kiến trúc Tách đôi (Dual-Engine Evaluation Pipeline)

```
                       [ USER REQUEST / TEST SCENARIO ]
                                      │
            ┌─────────────────────────┴─────────────────────────┐
            ▼                                                   ▼
┌───────────────────────────────┐               ┌───────────────────────────────┐
│     PIPELINE A: DETERMINISTIC │               │     PIPELINE B: LLM REAL      │
│  - Heuristic Token Matcher    │               │  - LLMProvider Abstraction    │
│  - Regex Entity Extractor     │               │  - Structured LLM Contract    │
│  - Time Keyword Resolver      │               │  - Assumption Tracker         │
│  - Instant Baseline Guard     │               │  - Ambiguity Reasoner         │
│                               │               │  - Replay & Telemetry Logger  │
└───────────────┬───────────────┘               └───────────────┬───────────────┘
                │                                               │
                ▼                                               ▼
     [ Deterministic Score ]                         [ LLM Intelligence Score ]
```

Backend vẫn giữ thẩm quyền kiểm duyệt tối cao (Validation, Safety, Confirmation, Permission, Idempotency), nhưng LLM sẽ được đánh giá độc lập về khả năng nhận thức và cấu trúc hóa ngôn ngữ tự nhiên.
