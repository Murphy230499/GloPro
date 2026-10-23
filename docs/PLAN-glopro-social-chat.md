# Kế hoạch Triển khai: GloPro Social Chat & AI Concierge (Hộp Thư Mạng Xã Hội Hợp Nhất & Trợ Lý Chốt Lịch AI)

## 📌 Tổng Quan Dự Án
Xây dựng phân hệ **GloPro Social Chat** chuyên biệt cho ngành Salon/Spa cao cấp trên GloPro. Phân hệ cho phép chủ tiệm và nhân viên quản lý toàn bộ tin nhắn từ các mạng xã hội hàng đầu gồm **Facebook Messenger, Zalo OA, WhatsApp Business, Instagram Direct, Telegram** trong **một giao diện duy nhất (Unified Inbox 3 cột chuẩn quốc tế)**.

Hệ thống tích hợp **AI Dịch song ngữ 2 chiều thời gian thực**, **AI Trợ lý tư vấn tự động (AI Concierge)**, **AI Trích xuất phiếu đặt lịch thông minh (Smart Booking Draft)** và **Chấm điểm tiềm năng chốt lịch (Lead Scoring)** theo đúng mô hình CRM/Booking tiên tiến như hình ảnh mẫu đính kèm.

---

## 🎯 Mục Tiêu & Giá Trị Cốt Lõi
1. **Hộp thư mạng xã hội tập trung (GloPro Social Chat Inbox):** Không cần mở 5 ứng dụng riêng lẻ. Mọi tin nhắn từ Facebook Fanpage, Zalo OA, WhatsApp, Instagram, Telegram đều đổ về GloPro.
2. **Dịch song ngữ 2 chiều thời gian thực:** Khách nước ngoài gõ tiếng Nhật/Anh/Hàn/Trung ➔ AI tự dịch sang tiếng Việt cho nhân viên. Nhân viên gõ tiếng Việt ➔ AI tự dịch sang đúng ngôn ngữ của khách trước khi gửi. Hiển thị song song bản dịch & bản gốc.
3. **Trích xuất lịch hẹn tự động (AI Booking Draft Engine):** Tự động phân tích ngữ cảnh chat, bóc tách Dịch vụ, KTV/Stylist yêu thích, Ngày giờ hẹn, nhận diện thông tin còn thiếu và **1-Click tạo lịch hẹn** vào hệ thống GloPro.
4. **Chấm điểm chốt lịch & Gắn nhãn tự động:** Xác suất chốt lịch (55% - 80% - 100%), gắn nhãn trạng thái (AI đã trả lời, Cần người tiếp nhận, Đã xác nhận giá...).
5. **Ghi chú nội bộ (Internal Sticky Notes):** Nhân viên lưu ý sở thích, chất tóc, da nhạy cảm ngay giữa luồng chat (chỉ nội bộ thấy).

---

## 🏗️ Kiến Trúc Giao Diện 3 Cột (GloPro Social Chat Layout)

```
+---------------------------+-----------------------------------+-----------------------------+
| CỘT 1: SOCIAL INBOX (25%) | CỘT 2: KHUNG CHAT & SONG NGỮ (50%)| CỘT 3: SMART BOOKING & CRM (25%) |
+---------------------------+-----------------------------------+-----------------------------+
| - Thanh tìm kiếm          | - Header: Khách, Kênh (ZL, FB...),| - PHIẾU NHÁP LỊCH HẸN (AI)  |
| - Bộ lọc kênh/tag         |   Badge SĐT, Thao tác nhanh       |   + Khách hàng & SĐT        |
| - Danh sách chat:         | - Luồng tin nhắn:                 |   + Dịch vụ phát hiện       |
|   + Avatar + Kênh MXH     |   + Khách nói (Bản dịch + Gốc)    |   + Stylist / KTV ưu tiên   |
|   + Tên + SĐT             |   + AI Bot tư vấn (Dịch vụ/Giá)   |   + Ngày & Giờ hẹn          |
|   + Tin nhắn mới          |   + Ghi chú nội bộ (Màu vàng)     |   + Cảnh báo thiếu thông tin|
|   + Xác suất chốt         | - Thanh gợi ý câu trả lời AI (3 mẫu)|   + [NÚT VÀNG: TẠO HẸN NGAY]|
|     (55%, 80%, 100%)      | - Thanh nhập liệu:                | - THẺ KHÁCH HÀNG 360 CRM:   |
|   + Badges trạng thái      |   + Chế độ: Khách / Nội bộ        |   + Lịch sử chi tiêu / Thẻ  |
|                           |   + Nút gửi kèm Thẻ Dịch vụ/Sản phẩm| + Ảnh mẫu tóc trước đây   |
+---------------------------+-----------------------------------+-----------------------------+
```

---

## 🌟 Các Tính Năng Đỉnh Cao Của GloPro Social Chat

### 1. AI Real-time Bilingual Translation Engine (Dịch Thuật 2 Chiều Chuẩn Salon)
- **Tự động nhận diện ngôn ngữ nguồn (Auto-detect):** Nhận biết tức thì Tiếng Nhật (ja), Tiếng Anh (en), Tiếng Hàn (ko), Tiếng Trung (zh), Tiếng Pháp (fr)...
- **Hiển thị 2 tầng (Bilingual Bubble):**
  - Tầng trên: Bản dịch rõ ràng, ngữ điệu tự nhiên, từ ngữ chuẩn ngành tóc/spa (*như "Hair color" -> "Nhuộm tóc", "Natural brown tone" -> "Tone nâu tự nhiên"*).
  - Tầng dưới: `原文: ...` (Chữ nguyên bản mờ hơn để đối chiếu khi cần).
- **Soạn tin 1 chạm:** Nhân viên gõ tiếng Việt, bấm `[Dịch & Gửi]` ➔ AI tự chuyển sang đúng ngôn ngữ của khách hàng.

### 2. AI Smart Booking Draft & Missing Info Detector (Phát Hiện Thông Tin Đặt Lịch & Thiếu Sót)
- AI liên tục lắng nghe và điền vào form nháp bên cột phải:
  - **Khách hàng:** Thảo Lý · 0901 111 222
  - **Dịch vụ:** Nhuộm tóc (Hair Color)
  - **Stylist:** Ken Trấn
  - **Ngày hẹn:** Thứ 2 tuần tới (Next Monday)
  - **Giờ hẹn:** `Chưa rõ (不明)` ➔ Gắn nhãn **"Thông tin còn thiếu (不足情報): Cần hỏi giờ cụ thể"**.
- **Tự động hỏi dồn thông tin:** AI bot tự động phản hồi: *"Dạ em ghi nhận chị muốn stylist Ken Trấn nhuộm tóc vào Thứ 2 tuần tới. Chị muốn chọn khung giờ buổi sáng hay chiều để em kiểm tra chỗ trống cho chị ạ?"*.
- **Nút vàng `[Tạo Lịch Hẹn / 予約を作成]`:** Click là mở form tạo lịch của GloPro với đầy đủ trường đã điền sẵn, tự động kiểm tra trống ghế/giường và xung đột lịch.

### 3. AI Lead Scoring & Intent Tagging (Chấm Điểm Chốt Khách & Phân Loại)
- AI tính điểm xác suất đặt lịch theo thời gian thực:
  - `100% 予約見込み (Xanh lá)`: Khách đã chốt dịch vụ + giờ hẹn cụ thể.
  - `80% (Xanh dương)`: Khách hỏi giá, stylist, đang chọn ngày.
  - `55% (Vàng cam)`: Khách mới chào hỏi, hỏi bảng giá sơ bộ.
- Nhãn thông minh:
  - `AI返信済み` (AI đã trả lời tự động)
  - `有人対応` (Chuyển giao cho người thật xử lý)
  - `料金確認` (Đang hỏi bảng giá dịch vụ)
  - `フォローアップ` (Khách cũ cần chăm sóc / tái hẹn)

### 4. Hybrid AI Co-pilot & Seamless Human Takeover (Người Thật & AI Phối Hợp)
- **Công tắc AI Auto-Pilot:** Bật/tắt cho từng khách hoặc theo khung giờ ngoài giờ làm việc.
- **Auto-Takeover Trigger:** Khi khách nhắn từ khóa *"gặp nhân viên"*, *"khiếu nại"*, *"chủ tiệm"* hoặc phân tích cảm xúc (Sentiment Analysis) thấy khách khó chịu ➔ AI lập tức dừng tự động trả lời, bật cảnh báo đỏ `(!)` và báo chuông cho quản lý.
- **Smart Suggestion Chips (返信案を使う):** AI gợi ý sẵn 3 phương án trả lời bằng 1 cú nhấp chuột (ví dụ: xác nhận giờ, gửi bảng giá combo, thông báo chương trình khuyến mãi).

### 5. Thẻ Dịch Vụ, Sản Phẩm & Voucher Trực Quan (Interactive Rich Cards)
- Nhân viên hoặc AI có thể gửi trực tiếp một thẻ card đẹp mắt vào khung chat:
  - Card Dịch vụ: Tên, ảnh minh họa, giá tiền, thời lượng, nút `[Chọn dịch vụ này]`.
  - Card Sản phẩm dưỡng tóc / mỹ phẩm tại nhà: Kèm mã giảm giá riêng.
  - Card Đặt cọc giữ chỗ (nếu dịch vụ cao cấp đòi hỏi cọc trước).

### 6. Ghi Chú Nội Bộ Màu Vàng (Internal Sticky Notes)
- Nhân viên có thể chuyển tab nhập liệu sang chế độ **"Nội bộ (内部)"**.
- Tin nhắn hiển thị nền vàng ấm áp trong luồng chat:
  - Chỉ nhân viên, lễ tân và KTV xem được, tuyệt đối không gửi sang cho khách hàng.
  - Dùng để dặn dò ca sau: *"Khách da đầu nhạy cảm, thích uống trà nhài ấm, ưu tiên bạn Ken phục vụ"*.

---

## 🗄️ Cấu Trúc Cơ Sở Dữ Liệu Dự Kiến (Database Entities)

### 1. Entity `SocialAccount` (Quản lý kết nối kênh MXH)
- `id`: string (UUID)
- `branch_id`: string (Chi nhánh salon)
- `channel_type`: `'facebook' | 'zalo' | 'whatsapp' | 'instagram' | 'telegram'`
- `account_name`: string (Tên Fanpage, Zalo OA...)
- `account_id`: string (Page ID, OA ID...)
- `access_token`: string (Mã hóa an toàn)
- `is_active`: boolean
- `auto_ai_reply`: boolean (Bật/tắt AI trả lời tự động cho kênh này)

### 2. Entity `SocialConversation` (Cuộc hội thoại mạng xã hội)
- `id`: string (UUID)
- `social_account_id`: string
- `external_sender_id`: string (User ID trên Facebook / Zalo...)
- `customer_id`: string (Liên kết với bảng `Customer` của GloPro)
- `customer_name`: string
- `customer_avatar`: string
- `customer_phone`: string
- `lead_score`: number (55, 80, 100...)
- `status`: `'ai_handling' | 'human_handling' | 'resolved' | 'waiting'`
- `tags`: array (`['booking_ready', 'price_check', 'needs_human']`)
- `detected_language`: string (`'vi'`, `'en'`, `'ja'`, `'ko'`, `'zh'`)
- `booking_draft`: JSONB ({ service_id, staff_id, date, time, missing_fields })
- `last_message_at`: timestamp
- `unread_count`: number

### 3. Entity `SocialMessage` (Chi tiết từng tin nhắn)
- `id`: string (UUID)
- `conversation_id`: string
- `sender_type`: `'customer' | 'staff' | 'ai' | 'system'`
- `is_internal_note`: boolean (true = Ghi chú nội bộ vàng)
- `content`: string (Nội dung hiển thị chính / bản dịch)
- `original_content`: string (Nội dung gốc nếu có dịch)
- `source_language`: string
- `target_language`: string
- `payload`: JSONB (Nếu là thẻ dịch vụ, ảnh, voucher, file)
- `created_at`: timestamp

---

## 🛠️ Lộ Trình Triển Khai Chi Tiết (Phased Execution)

### Phase 1: Giao Diện 3 Cột GloPro Social Chat (Frontend Prototype)
- Tạo route mới: `/social-chat` trên thanh điều hướng chính của GloPro.
- Xây dựng component 3 cột chuẩn Responsive:
  - Cột 1: `SocialConversationList.jsx` (Lọc theo kênh Facebook/Zalo/WhatsApp/Instagram/Telegram, tìm kiếm, tag, thanh điểm chốt lịch 55-80-100%).
  - Cột 2: `SocialChatThread.jsx` (Bong bóng tin nhắn song ngữ 2 tầng, AI response, ghi chú nội bộ vàng, thanh gợi ý trả lời 3 mẫu).
  - Cột 3: `SocialBookingDraftSidebar.jsx` (Phiếu đặt lịch thông minh, phát hiện trường thiếu, nút vàng Tạo lịch hẹn).
- Tích hợp mock data mẫu thực tế chuẩn Salon cao cấp để trải nghiệm ngay.

### Phase 2: AI Engine Tích Hợp (Translation, Intent & Booking Draft) [ĐÃ HOÀN TẤT ✅]
- [x] **Module Dịch thuật:** Tích hợp Google Gemini REST API (`/api/social-chat/ai`) hỗ trợ dịch 2 chiều song ngữ thời gian thực chuẩn thuật ngữ salon (Vi <-> Ja / En / Ko / Zh), hỗ trợ chế độ dịch âm thầm 100% khi nhân viên gửi tin.
- [x] **Module Trích xuất lịch & Khớp CSDL:** Pipeline AI tự động phân tích ngữ cảnh chat, khớp trực tiếp với danh mục Dịch vụ (`Service`) và Stylist (`Staff`) thực tế của GloPro, gắn ID, thời lượng, bảng giá chuẩn và tính điểm chốt lịch (Lead Scoring 55% - 80% - 100%).
- [x] **Module Gợi ý câu trả lời & AI Co-pilot:** Tự động sinh 3 gợi ý trả lời ngữ cảnh bằng 1-click (chèn vào ô chat hoặc gửi ngay); kèm công tắc **AI Auto-Pilot** tự động phản hồi khách hàng theo thời gian thực.

### Phase 3: Liên Kết Nghiệp Vụ GloPro (Appointment & CRM Sync) [ĐÃ HOÀN TẤT ✅]
- [x] **1-Click Tạo Lịch Hẹn (`AppointmentModal`):** Nút vàng "Tạo lịch hẹn ngay" tự động quy đổi ngôn ngữ tự nhiên (chiều mai, thứ hai tuần tới...) sang định dạng chuẩn `YYYY-MM-DD` và `HH:MM`, pre-fill toàn bộ dịch vụ, chuyên viên, thời lượng và ghi chú nguồn MXH vào modal lịch hẹn GloPro.
- [x] **Tự Động Đồng Bộ Khách Hàng (CRM Sync):** Tra cứu theo SĐT trong CSDL; tự động tạo mới hồ sơ `Customer` nếu khách liên hệ lần đầu, gắn `client_source` theo kênh (Zalo, Facebook, WhatsApp, Instagram, Telegram).
- [x] **Thẻ Hồ Sơ CRM 360 Thời Gian Thực:** Truy vấn doanh thu thực tế, số lần đến tiệm và cấp bậc thành viên (VIP, Vàng, Bạc) kèm nút liên kết trực tiếp "Xem hồ sơ chi tiết trên CRM".

### Phase 4: Cấu Hình Kết Nối Kênh MXH (Social Channels Hub & Webhook Ingestion) [ĐÃ HOÀN TẤT ✅]
- [x] **Màn hình Social Channels Hub (`SocialChannelsConfigModal.jsx`):** Cung cấp giao diện quản lý cấu hình kết nối API & Webhook tập trung cho 5 kênh hàng đầu: **Zalo OA, Facebook Messenger, Instagram Direct, WhatsApp Business, Telegram Bot** với 1-click sao chép Webhook Callback URL & Verify Token.
- [x] **Bộ Định Tuyến Webhook Tập Trung (`/api/social-chat/webhook`):** Xử lý xác thực Meta GET verification (`hub.challenge`), tiếp nhận webhook POST từ Zalo, Meta, Telegram, WhatsApp và chuẩn hóa thành đối tượng hội thoại `SocialMessage` chuẩn quốc tế.
- [x] **Mô Phỏng & Kiểm Thử Localhost (Simulation Tool):** Tích hợp công cụ gửi tin nhắn mô phỏng trực tiếp trên Modal giúp chủ salon kiểm thử toàn bộ luồng tiếp nhận tin nhắn, kích hoạt AI chào mừng (Welcome Message), tự động dịch và trích xuất lịch hẹn ngay trên môi trường phát triển mà không cần cài đặt Ngrok.
