# Kế hoạch Thiết kế & Triển khai Sơ đồ 3D Không Gian Salon / Store (3D Store Layout)

> **Mục tiêu:** Nâng cấp chế độ hiển thị 3D của trang **Giường / Phòng** (`RoomsBeds`) từ dạng khối kỹ thuật cơ bản thành một **không gian Store/Salon hoàn chỉnh, hiện đại, trẻ trung và trực quan**: Bước vào sẽ thấy sảnh đón tiếp/quầy thu ngân phía trước, theo lối đi là các phòng giường dịch vụ được bài trí ấm cúng, sang trọng và cực kỳ dễ thao tác.

---

## I. Phân tích Hiện trạng & Định hướng Thiết kế

### 1. Hiện trạng (`Bed3DViewer.jsx`)
* Đã có nền tảng Three.js + OrbitControls + CSS2DRenderer + bóng đổ mềm (contact shadows).
* Tuy nhiên, các phòng hiện tại đang là các cụm hộp vuông rời rạc nằm trên lưới phẳng, chưa có cảm giác như một "cửa hàng/salon thực tế" (thiếu sảnh, quầy thu ngân, lối đi, vách kính/gỗ trang trí, cây xanh, nội thất phụ trợ).

### 2. Định hướng Thiết kế Không gian Store ("Boutique Salon Storefront")
* **Phong cách (Aesthetics):** Modern Japandi / Scandinavian Warm Boutique — Tông màu gỗ sồi sáng (Light Oak), vách kem/be trang nhã, cây xanh mini, ánh sáng vàng ấm (Warm Ambient 3200K) kết hợp ánh sáng tự nhiên.
* **Bố cục mặt bằng (Spatial Layout):**
  1. **Lối vào & Quầy Thu Ngân / Tiếp Tân (Front Desk & Reception Zone):**
     * Nằm ngay góc nhìn chính khi bước vào.
     * Quầy tính tiền cong mềm mại (Curved Reception Counter), máy POS mini, ghế chờ của khách (Waiting Sofa), cây cảnh đón khách.
     * **Tính năng tương tác:** Click vào quầy thu ngân -> mở nhanh màn hình Thu ngân POS hoặc danh sách chờ thanh toán.
  2. **Lối đi trung tâm (Main Aisle / Corridor):**
     * Kết nối từ quầy tiếp tân dẫn thẳng vào các khu vực dịch vụ.
  3. **Các phòng điều trị & Giường dịch vụ (Treatment Rooms & Beds):**
     * Tường bán lửng hoặc vách lam gỗ / kính mờ tạo không gian sang trọng, thoáng đãng.
     * Giường đệm êm ái, gối ôm, bàn kệ dụng cụ spa mini cạnh giường.
     * Vòng hào quang LED hiển thị trạng thái giường (Xanh: Trống, Hồng: Đang bận, Vàng: Sắp xong, Cam: Quá giờ, Xanh ngọc: Đang dọn dẹp).
* **Trải nghiệm Thân thiện (UX & Ease of Use):**
  * Thẻ thông tin khách & dịch vụ CSS2D nổi bật phía trên mỗi giường, dễ đọc, không che khuất góc nhìn.
  * Nút chuyển nhanh góc nhìn camera:
    * 🏪 **Góc Vào Cửa (Store Entry View):** Góc nhìn nghiêng từ cửa tiệm nhìn vào quầy thu ngân và toàn cảnh.
    * 📐 **Góc Mặt Bằng (Top-down 2D/3D Plan):** Nhìn từ trên cao xuống để bao quát toàn bộ giường phòng trong 1 giây.
    * 🔍 **Góc Tiêu Điểm (Focus Bed):** Click vào giường bất kỳ, camera bay mượt mà đến giường đó.

---

## II. Kế hoạch Chi tiết các Giai đoạn (Task Breakdown)

### Phase 1: Thiết kế Mặt bằng & Khối Kiến trúc Store (Store Architecture)
- [ ] **Task 1.1: Tạo Sảnh Lễ Tân & Quầy Thu Ngân 3D (`ReceptionCounterZone`)**
  * Dựng khối quầy tiếp tân bo cong mềm mại với mặt đá marble / gỗ ấm.
  * Thêm màn hình POS mini, ghế chờ khách bọc nệm, cây xanh trang trí lối vào.
  * Gắn nhãn CSS2D "Quầy Thu Ngân / Tiếp Tân" kèm badge số đơn chờ thanh toán.
- [ ] **Task 1.2: Thiết kế Lối đi & Vách ngăn Phòng Hiện đại (Modern Room Dividers)**
  * Thay thế tường xám hộp cũ bằng vách nan gỗ (slatted wood panels) hoặc vách kính mờ có khung kim loại thanh mảnh.
  * Tạo bảng tên phòng dạng bảng treo sang trọng ở cửa vào từng phòng (Phòng Chăm Sóc Da, Phòng Gội Đầu, Phòng VIP...).
  * Thảm trải sàn theo tông màu thương hiệu cho từng phòng.

### Phase 2: Nâng cấp Chi tiết Giường Spa & Nội thất Phụ trợ (Salon Interior & Props)
- [ ] **Task 2.1: Model Giường Dịch Vụ Mới Thân Thiện, Trẻ Trung**
  * Nâng cấp mô hình giường: Nệm bọc vải da êm ái bo góc, gối tựa mềm, khăn trải giường gấp gọn gàng.
  * Đèn LED hắt chân giường thông minh (ambient floor wash) đổi màu theo trạng thái phục vụ.
- [ ] **Task 2.2: Phụ kiện Nội thất Spa Sinh động**
  * Thêm xe đẩy dụng cụ mini (trolley cart) cạnh mỗi giường.
  * Đèn rọi spa cong (curved treatment lamp) tạo cảm giác không gian chuyên nghiệp cao cấp.

### Phase 3: Tương tác Trực quan & Tích hợp Nghiệp vụ (Interactive UX)
- [ ] **Task 3.1: Tương tác Quầy Thu Ngân (Cashier Quick Access)**
  * Hover vào quầy thu ngân có hiệu ứng sáng nhẹ và con trỏ tương tác.
  * Click vào quầy thu ngân -> Mở modal hóa đơn POS hoặc chuyển nhanh sang tab Thu ngân.
- [ ] **Task 3.2: Thẻ Thông tin CSS2D Tinh gọn, Trẻ trung**
  * Tinh chỉnh kích thước và font chữ của thẻ giường: Hiển thị Avatar khách, Tên KTV, dịch vụ đang làm và thời gian đếm ngược.
  * Các nút thao tác nhanh: [Đổi giường] [Thanh toán] [Xong dịch vụ] xuất hiện khi click/hover.
- [ ] **Task 3.3: Cinematic Camera Modes (Chuyển đổi góc nhìn trực quan)**
  * Bổ sung nút "🏪 Bước vào cửa tiệm" (Store Walk-in View): Đưa người dùng về góc nhìn chào đón ngay quầy lễ tân.
  * Bổ sung nút "🗺️ Mặt bằng tổng thể" (Floor Overview): Góc 75 độ bao quát toàn bộ cửa hàng.

### Phase 4: Kiểm thử, Tối ưu Hiệu năng & Thẩm mỹ (Performance & Polish)
- [ ] **Task 4.1: Tối ưu Render WebGL (InstancedMesh & Texture Optimization)**
  * Đảm bảo tốc độ khung hình 60 FPS mượt mà trên cả laptop thông thường và màn hình retina.
  * Tự động điều chỉnh Level of Detail khi zoom xa/gần.
- [ ] **Task 4.2: Tương thích Mọi Thiết bị & Fallback An toàn**
  * Giữ nguyên cơ chế bọc ErrorBoundary và kiểm tra WebGL an toàn đã hoàn thiện.
- [ ] **Task 4.3: Kiểm thử toàn diện và kiểm tra nghiệp vụ thực tế**
  * Thao tác thử: Đặt khách vào giường -> Giường sáng đèn -> Khách chuyển sang thanh toán -> Quầy thu ngân báo hiệu -> Trả phòng dọn dẹp.

---

## III. Verification Checklist (Tiêu chí Nghiệm thu)

1. **Thẩm mỹ:** Giao diện 3D trông như một cửa hàng/salon cao cấp thực tế, có quầy lễ tân/thu ngân, lối đi, vách ngăn hiện đại và cây xanh.
2. **Nghiệp vụ:** Click vào quầy thu ngân mở được chức năng thu ngân; click vào giường mở được chi tiết khách/KTV và thao tác được trực tiếp.
3. **Hiệu năng:** Tải mượt mà dưới 1.5 giây, xoay lướt camera không giật lag.
4. **Độ ổn định:** Không phát sinh lỗi JavaScript console, tương thích tốt với dữ liệu phòng/giường thực tế của salon.
