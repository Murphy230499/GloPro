# Goal: Cấu hình ngôn ngữ theo Chi nhánh

Người dùng muốn có thể chọn ngôn ngữ trong mục **Cài đặt Chi nhánh**. Khi chọn và lưu, ngôn ngữ mặc định của toàn bộ hệ thống (các text mặc định) sẽ ngay lập tức được thay đổi theo ngôn ngữ đã cấu hình.

## Phân tích hiện trạng
- File `src/views/Settings.jsx` đã có sẵn trường `Ngôn ngữ hiển thị` trong form cài đặt chi nhánh (vi, en).
- File `src/lib/i18n.jsx` đã có sẵn `LanguageProvider` sử dụng Context để chuyển đổi ngôn ngữ, và lưu trạng thái ở `localStorage`.
- File `src/lib/BranchContext.jsx` quản lý chi nhánh đang hoạt động (`currentBranch`).

## Open Questions
> [!IMPORTANT]
> 1. Nếu tài khoản đăng nhập có quyền ở nhiều chi nhánh (ví dụ Chủ Salon xem `Tất cả cơ sở`), hệ thống nên ưu tiên hiển thị ngôn ngữ nào? (Mặc định có thể là Tiếng Việt hoặc ngôn ngữ của chi nhánh đầu tiên).
> 2. Hệ thống hiện tại có tiếng Việt (vi), Anh (en), Trung (zh), Hàn (ko), Nhật (ja) trong file i18n, nhưng form Cài đặt chi nhánh mới chỉ cho chọn "vi" và "en". Chúng ta có nên mở rộng danh sách chọn ra tất cả các ngôn ngữ này không?

## Proposed Changes

### 1. Cập nhật `src/views/Settings.jsx`
- **[MODIFY] src/views/Settings.jsx**
  - Mở rộng các option chọn ngôn ngữ trong `BranchForm` (thêm zh, ko, ja).
  - Cập nhật hàm `saveBranch` để gọi hàm thay đổi ngôn ngữ ngay lập tức (thông qua `useT()` -> `setLang()`) nếu người dùng vừa lưu cấu hình cho chi nhánh đang kích hoạt.

### 2. Đồng bộ tự động ngôn ngữ khi đổi Chi nhánh
- **[MODIFY] src/lib/BranchContext.jsx** hoặc **`src/App.jsx`**
  - Khi `currentBranch` thay đổi (chuyển đổi chi nhánh), hệ thống cần tự động gọi `setLang(currentBranch.language || 'vi')` để ngôn ngữ toàn app đi theo cấu hình của chi nhánh đó.

### 3. Cập nhật các bản dịch (Nếu cần)
- **[MODIFY] src/lib/i18n.jsx**
  - Đảm bảo tất cả các text hardcode trên UI được đưa vào danh sách translations (như 'vi', 'en', 'zh', 'ko', 'ja') và sử dụng hàm `t()`. 

## Verification Plan
### Kiểm tra thủ công (Manual Verification)
1. Vào `Cài đặt` > `Chi nhánh`, chỉnh sửa chi nhánh A, đổi ngôn ngữ sang Tiếng Anh, ấn Lưu. Kiểm tra toàn bộ UI có đổi sang Tiếng Anh hay không.
2. Đổi chi nhánh đang chọn trên Header sang chi nhánh B (cấu hình Tiếng Việt). Kiểm tra UI có đổi lại Tiếng Việt không.
3. Chọn "Tất cả cơ sở", kiểm tra ngôn ngữ fallback có hoạt động đúng không.
