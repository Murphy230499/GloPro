# Update Invoice Operation History for Package Usage

## Mục tiêu (Goal)
Cập nhật cơ chế ghi log (nhật ký thao tác) cho Hóa đơn trong màn hình Thu ngân (POS) để khi người dùng nhấn "Dùng gói", hệ thống sẽ ghi nhận log chính xác là "Sử dụng gói: [Tên gói]" thay vì chỉ ghi log "Thêm vào giỏ hàng" cho từng dịch vụ lẻ.

## User Review Required
> [!IMPORTANT]
> Phương án này sẽ thay đổi cách ghi log. Hiện tại, thêm dịch vụ lẻ sẽ báo "Thêm vào giỏ hàng". Với thay đổi này, nếu khách "Dùng gói", log sẽ gom lại và báo "Sử dụng gói: [Tên gói]".
> Bạn vui lòng xem qua và Xác nhận (Proceed) để tôi bắt đầu code nhé.

## Open Questions
> [!NOTE]
> Khi người dùng xóa gói (bấm icon thùng rác ở dòng tên gói), bạn có muốn ghi log là "Xóa gói: [Tên gói]" không, hay vẫn ghi "Xóa khỏi giỏ hàng" từng dịch vụ lẻ như hiện tại? Kế hoạch bên dưới đề xuất cập nhật cả phần "Xóa gói".

## Proposed Changes

### POS Component (`src/views/POS.jsx`)
- **[MODIFY] [POS.jsx](file:///Volumes/Coding/GloPro/src/views/POS.jsx)**
  - Cập nhật hàm `patchSession` ở khối lệnh bắt sự kiện thay đổi giỏ hàng (`if ('cart' in patch)`).
  - Kiểm tra xem mặt hàng vừa được thêm vào (hoặc danh sách các mặt hàng) có chứa cờ `is_from_package: true` hay không.
  - Nếu có, ghi log: `Sử dụng gói`, chi tiết là tên gói (`package_name`).
  - Cập nhật tương tự cho trường hợp **xóa** (`patch.cart.length < currentSession.cart.length`): Nếu phát hiện xóa nhiều dịch vụ cùng lúc thuộc cùng một gói, ghi log `Xóa gói: [package_name]`.
  - Cập nhật tương tự cho trường hợp thay đổi số lượng sử dụng gói (tăng/giảm số lượng). Ghi log `Thay đổi số lượng gói: [package_name]`.

## Verification Plan

### Manual Verification
- Truy cập vào giao diện Thu ngân.
- Thêm một gói dịch vụ cho khách hàng.
- Xem tab "Lịch sử" trong hoá đơn xem có hiện log "Sử dụng gói: [Tên gói]" không.
- Thử tăng/giảm số lượng gói và xóa gói, kiểm tra xem log có được ghi lại đúng chuẩn không.
