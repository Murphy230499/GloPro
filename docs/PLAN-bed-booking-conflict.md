# Kế hoạch Triển khai: Ràng buộc Xung đột Giờ Giữa Khách Vãng Lai & Lịch Hẹn Đặt Trước Tại Giường Phòng

> **Mã kế hoạch:** `PLAN-bed-booking-conflict`  
> **Phiên bản:** 1.0  
> **Ngày lập:** 27/09/2026  
> **Trạng thái:** Chờ phê duyệt (Ready for `/create`)

---

## 1. Tổng quan & Mục tiêu

### 1.1. Bối cảnh & Vấn đề
- Tại salon, nhiều khách hàng đặt lịch hẹn trước và đã được nhân viên/lễ tân sắp xếp giường cụ thể vào một khung giờ trong ngày (ví dụ: Chị Lan hẹn 10:30 - 11:30 tại **Giường 01 - Phòng Body**).
- Lúc 09:30, khách vãng lai (walk-in) đến salon và được xếp vào **Giường 01**. Tại thời điểm 09:30, giường này đang trống.
- Tuy nhiên, dịch vụ của khách vãng lai kéo dài 75 phút (dự kiến xong lúc 10:45) cộng thêm 15 phút dọn dẹp vệ sinh. Do đó, thời gian sử dụng thực tế sẽ **đè vào lịch hẹn của khách đặt trước** (10:30).
- Hệ thống hiện tại chưa tự động phát hiện khoảng giao thoa thời gian này, dẫn đến nguy cơ xung đột (double booking), khách hẹn đến không có giường hoặc nhân viên bị động.

### 1.2. Giải pháp theo yêu cầu người dùng
1. **Kiểm tra xung đột thời gian (Time Conflict Detection) có tính thời gian đệm (Buffer Time = 15 phút):**
   - Hệ thống tự động tính toán: $\text{Giờ kết thúc ca mới} + 15\text{ phút dọn dẹp} > \text{Giờ bắt đầu lịch hẹn tiếp theo}$.
2. **Hiển thị thông minh thời gian khả dụng (Smart Availability Badge):**
   - Trên ô giường (Sơ đồ vị trí) và trong menu chọn giường (Thu ngân POS): Nếu giường đang trống nhưng có lịch hẹn trong ngày, hiển thị rõ: `🟢 Trống đến 10:30 (còn 60p)`.
3. **Cơ chế Cảnh báo xung đột & Cho phép ghi đè (Warning with Override):**
   - Khi thời gian dịch vụ khách vãng lai vượt quá khung giờ trống: Bật popup cảnh báo màu đỏ chi tiết về khách hẹn bị ảnh hưởng (Tên, SĐT, Dịch vụ, Giờ hẹn).
   - Cung cấp 2 lựa chọn xử lý cho lễ tân:
     - **Lựa chọn A (Khuyến nghị):** Chọn ngay một giường khác đang trống hoàn toàn.
     - **Lựa chọn B (Ghi đè - Override):** Xác nhận vẫn xếp khách vãng lai vào giường này, hệ thống sẽ tự động dời lịch hẹn của khách đặt trước sang trạng thái *"Chưa gán giường"* hoặc chuyển sang một giường trống tương đương trong cùng phòng.

---

## 2. Kiến trúc & Mô hình Dữ liệu

```
┌────────────────────────────────────────────────────────┐
│               DỮ LIỆU ĐẦU VÀO (DATA INPUTS)             │
├──────────────────────────┬─────────────────────────────┤
│ 1. Lịch hẹn đặt trước    │ Appointment (Hôm nay,       │
│    (Chờ phục vụ/Đã xác   │ status: confirmed/pending,  │
│    nhận)                 │ facility_id = bed.id)       │
├──────────────────────────┼─────────────────────────────┤
│ 2. Dịch vụ xếp ca mới    │ Tổng duration (phút)        │
│    (Khách vãng lai/POS)  │ + 15 phút Buffer Time       │
├──────────────────────────┼─────────────────────────────┤
│ 3. Phiên giường hiện tại │ gp_active_bed_sessions      │
└──────────────────────────┴─────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────┐
│     MODULE TÍNH TOÁN XUNG ĐỘT (bedConflictHelper.js)    │
│  - getNextUpcomingAppointment(bedId, appointments)     │
│  - calculateBedAvailableWindow(bed, nextAppt, nowTime) │
│  - detectTimeConflict(walkinDuration, availableWindow) │
└────────────────────────────────────────────────────────┘
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
   [HỢP LỆ / ĐỦ THỜI GIAN]           [XUNG ĐỘT THỜI GIAN]
    - Cho phép xếp ngay               - Bật Modal Cảnh báo Đỏ
    - Cập nhật phiên giường           - Hiển thị khách hẹn bị đè
                                      - Nút: "Đổi giường khác"
                                      - Nút: "Ghi đè & Tự dời lịch"
```

### 2.1. Tham số & Quy tắc Nghiệp vụ (Business Rules)
- **`BED_BUFFER_MINUTES = 15`**: Thời gian dọn dẹp vệ sinh, thay ga giường giữa 2 lượt khách.
- **`conflictThreshold`**: Nếu $\text{Giờ bắt đầu hẹn} - (\text{Giờ hiện tại} + \text{Duration} + 15) < 0 \implies \text{Xung đột}$.
- **Trạng thái lịch hẹn kiểm tra**: `['confirmed', 'pending', 'checked_in']` của ngày hiện tại (`todayStr()`).

---

## 3. Kế hoạch Triển khai Chi tiết (5 Giai đoạn)

### Giai đoạn 1: Xây dựng Module lõi `bedConflictHelper.js`
- **File tạo mới:** `src/lib/bedConflictHelper.js`
- **Chức năng:**
  - `getNextUpcomingAppointment(bedId, appointments, currentMinutes)`: Tìm lịch hẹn sớm nhất sắp tới trong ngày gán cho giường này.
  - `calculateAvailableTimeForBed(bedId, appointments, nowMinutes, bufferMinutes = 15)`: Trả về số phút khả dụng và thời điểm lịch hẹn kế tiếp bắt đầu.
  - `checkBedAssignmentConflict({ bedId, services, startTime, appointments, bufferMinutes = 15 })`: Kiểm tra xem việc nhận khách vào giường có gây xung đột không. Trả về:
    ```javascript
    {
      hasConflict: boolean,
      availableMinutes: number,
      requiredMinutes: number,
      conflictedAppointment: object | null,
      message: string
    }
    ```
  - `findAlternativeAvailableBeds(beds, allAppointments, bedSessions, requiredMinutes)`: Gợi ý danh sách các giường khác trong salon có đủ thời gian phục vụ.

### Giai đoạn 2: Nâng cấp Sơ đồ Giường Phòng (`RoomsBeds.jsx`)
- **File cập nhật:** `src/views/RoomsBeds.jsx`
- **Chức năng:**
  - Nạp danh sách lịch hẹn hôm nay từ `base44.entities.Appointment`.
  - Trên thẻ mỗi giường trống (Available):
    - Nếu không có lịch hẹn tiếp theo: Giữ badge `🟢 ĐANG TRỐNG`.
    - Nếu có lịch hẹn sắp tới: Hiển thị badge thông minh kèm đồng hồ:  
      `🟢 Trống đến 10:30 (còn 60p)`  
      Hoặc thẻ phụ: `📅 Hẹn kế tiếp: 10:30 - Chị Lan (Gội dưỡng sinh)`.
  - Giúp lễ tân lướt qua sơ đồ là nắm được ngay giường nào tiếp nhận được ca làm dài, giường nào chỉ nhận được ca làm ngắn.

### Giai đoạn 3: Nâng cấp Modal Xếp Giường (`QuickAssignBedModal.jsx` & `AssignBedModal.jsx`)
- **File cập nhật:** 
  - `src/components/rooms-beds/QuickAssignBedModal.jsx`
  - `src/components/rooms-beds/AssignBedModal.jsx`
- **Chức năng:**
  - Khi người dùng chọn/thêm các dịch vụ cho khách vãng lai, hệ thống tính tổng thời gian (ví dụ 60 phút) + 15 phút đệm = 75 phút.
  - Gọi hàm `checkBedAssignmentConflict`:
    - Nếu an toàn: Nút "Xác nhận nhận khách" hiển thị bình thường.
    - Nếu xung đột: Nút chuyển sang trạng thái cảnh báo màu cam/đỏ `⚠️ Xung đột lịch hẹn (Thiếu 15 phút)`.
    - Khi bấm xác nhận: Mở `BedConflictOverrideModal`.

### Giai đoạn 4: Xây dựng Modal Cảnh báo & Ghi đè (`BedConflictOverrideModal.jsx`)
- **File tạo mới:** `src/components/rooms-beds/BedConflictOverrideModal.jsx`
- **Giao diện & Trải nghiệm:**
  - Icon cảnh báo đỏ nổi bật, thông báo: *"Thời gian phục vụ ca này sẽ đè vào lịch hẹn đã xếp trước!"*
  - **Chi tiết xung đột:**
    - Khách vãng lai: Xong lúc `10:45` (tính cả 15 phút dọn dẹp).
    - Khách đặt hẹn: Bắt đầu lúc `10:30` (Khách: **Chị Lan** - SĐT: `0985.xxx.xxx` - Dịch vụ: **Gội đầu dưỡng sinh**).
    - Mức độ chồng lấn: Bị đè `15 phút`.
  - **2 Hành động giải quyết trực quan:**
    1. **Nút "Chuyển sang giường khác":** Danh sách các giường trống đủ thời gian (ví dụ: `Giường 03 - Phòng 2 (Trống 120p)`), bấm vào tự động đổi giường và lưu luôn.
    2. **Nút "Tiếp tục & Tự động dời lịch hẹn":** Vẫn nhận khách vào Giường 01; đồng thời cập nhật lịch hẹn của Chị Lan thành `facility_id: null` (về cột *"Chưa xếp giường"* trong Lịch hẹn) hoặc gán sang giường trống phụ, ghi log cảnh báo để lễ tân sắp xếp lại.

### Giai đoạn 5: Đồng bộ với màn hình Thu ngân (`FacilityAssignPicker.jsx` & `TicketColumn.jsx`)
- **File cập nhật:** `src/components/FacilityAssignPicker.jsx`
- **Chức năng:**
  - Khi thu ngân chọn giường cho dịch vụ trong giỏ hàng POS:
    - Menu xổ xuống hiển thị badge thời gian khả dụng: `🟢 Giường 01 (Trống đến 10:30 - còn 60p)`.
    - Nếu thời lượng dịch vụ giỏ hàng > thời gian trống còn lại: Giường đó sẽ hiển thị trạng thái `⚠️ Không đủ giờ (Hẹn 10:30)` và kích hoạt popup xác nhận ghi đè tương tự nếu thu ngân cố tình chọn.

---

## 4. Kịch bản Kiểm thử & Tiêu chí Nghiệm thu (Acceptance Criteria)

| STT | Kịch bản kiểm thử | Kết quả mong đợi |
|-----|-------------------|------------------|
| 1 | Giường trống cả ngày, không có lịch hẹn | Xếp khách bình thường, hiển thị `🟢 Đang trống`. |
| 2 | Giường có lịch hẹn lúc 11:00. Khách vãng lai làm dịch vụ 30p lúc 09:30 | Dịch vụ xong lúc 10:00 + 15p buffer = 10:15 (< 11:00) $\to$ **Hợp lệ, cho phép nhận khách bình thường**. |
| 3 | Giường có lịch hẹn lúc 10:30. Khách vãng lai làm dịch vụ 60p lúc 09:30 | Dịch vụ xong lúc 10:30 + 15p buffer = 10:45 (> 10:30) $\to$ **Bật cảnh báo xung đột đỏ, hiển thị khách hẹn bị đè**. |
| 4 | Lễ tân bấm "Đổi giường khác" trên modal xung đột | Hệ thống tự chuyển khách vãng lai sang giường trống được chọn, không ảnh hưởng lịch hẹn. |
| 5 | Lễ tân bấm "Ghi đè & Tự dời lịch hẹn" | Giường nhận khách vãng lai thành công. Lịch hẹn của khách cũ tự động chuyển về trạng thái *"Chưa xếp giường"* và bắn toast thông báo nhắc lễ tân. |
| 6 | Thao tác chọn giường từ màn hình Thu ngân (POS) | Menu chọn giường hiển thị thời gian khả dụng đến lịch hẹn tiếp theo, không cho xếp đè nếu không xác nhận override. |

---

## 5. Phân công Công việc & Trình tự Thực thi

```
1. [Logic Core]   src/lib/bedConflictHelper.js
2. [UI Modal]     src/components/rooms-beds/BedConflictOverrideModal.jsx
3. [Bed Manager]  src/views/RoomsBeds.jsx
4. [Assign Modal] src/components/rooms-beds/QuickAssignBedModal.jsx
5. [POS Picker]   src/components/FacilityAssignPicker.jsx & TicketColumn.jsx
6. [Verification] Kiểm thử Next.js build & chạy thử nghiệm luồng thực tế
```

---

> Kế hoạch đã hoàn thành và sẵn sàng thực thi. Bạn có thể gõ **/create** hoặc yêu cầu bắt đầu để tiến hành code từng bước!
