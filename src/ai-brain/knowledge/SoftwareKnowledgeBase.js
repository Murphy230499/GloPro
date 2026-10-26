/**
 * GloPro Software Knowledge Base
 * 
 * Bộ cẩm nang tri thức hướng dẫn sử dụng toàn diện cho tất cả các phân hệ của phần mềm GloPro.
 * Hỗ trợ AI trả lời câu hỏi hướng dẫn từng bước (Step-by-Step), điều hướng màn hình và đề xuất thao tác thay.
 */

export const SOFTWARE_KNOWLEDGE_BASE = [
  // 1. POS & BÁN HÀNG
  {
    id: 'pos_create_bill',
    title: 'Tạo hóa đơn & Tính tiền tại quầy (POS)',
    category: 'Bán hàng & Thu ngân',
    keywords: ['tạo bill', 'tính tiền', 'thanh toán', 'tạo hóa đơn', 'lập bill', 'bán hàng', 'pos', 'thu ngân', 'in bill', 'tính bill'],
    route: '/pos',
    requiredRole: 'all',
    steps: [
      'Truy cập màn hình **Bán hàng (POS)** từ thanh menu bên trái.',
      'Tìm và chọn khách hàng (theo Tên hoặc Số điện thoại). Nếu là khách vãng lai, hệ thống sẽ để mặc định là Khách lẻ.',
      'Chọn các **Dịch vụ** hoặc **Sản phẩm** khách sử dụng từ danh mục bên phải để thêm vào hóa đơn.',
      'Chỉ định **Nhân viên thực hiện** cho từng dịch vụ để hệ thống tự động ghi nhận hoa hồng cho thợ.',
      'Chọn giường/ghế phục vụ (nếu có sử dụng phòng/giường spa).',
      'Nhập mã giảm giá, chiết khấu hoặc tiền tip nếu có.',
      'Bấm **Thanh toán**, chọn phương thức (Tiền mặt, Chuyển khoản QR, Quẹt thẻ, Điểm tích lũy hoặc Trừ ví nạp) và xác nhận hoàn tất để in hóa đơn.'
    ],
    tips: 'Bạn có thể chọn cùng lúc nhiều nhân viên làm chung một dịch vụ để chia đều hoa hồng cho thợ.',
    sampleCommand: 'Tạo bill khách Anh Tuấn sđt 0988123456 cắt tóc 100k thợ Nam làm'
  },
  {
    id: 'pos_commission_split',
    title: 'Cách chia hoa hồng cho thợ trên hóa đơn',
    category: 'Bán hàng & Thu ngân',
    keywords: ['chia hoa hồng', 'hoa hồng thợ', 'thợ làm dịch vụ', 'chia tiền thợ', 'chỉ định thợ', 'hoa hồng nhân viên'],
    route: '/pos',
    requiredRole: 'all',
    steps: [
      'Tại màn hình **Bán hàng (POS)**, sau khi chọn dịch vụ vào hóa đơn.',
      'Nhấp vào biểu tượng **Nhân viên / Thợ làm** bên cạnh tên dịch vụ.',
      'Chọn thợ chính và thợ phụ (nếu có).',
      'Hệ thống sẽ tự động tính tỷ lệ hoa hồng dựa trên cấu hình bảng lương của từng nhân viên.',
      'Bấm **Lưu** để áp dụng vào hóa đơn.'
    ],
    tips: 'Để điều chỉnh tỷ lệ % hoa hồng cố định của nhân viên, Chủ salon vào mục **Nhân viên > Cấu hình hoa hồng**.',
    sampleCommand: null
  },

  // 2. LỊCH HẸN & ĐẶT LỊCH
  {
    id: 'appointment_booking',
    title: 'Đặt lịch hẹn cho khách hàng',
    category: 'Lịch hẹn & Xếp thợ',
    keywords: ['đặt lịch', 'tạo lịch', 'hẹn khách', 'lên lịch', 'xếp lịch', 'thêm lịch hẹn', 'booking'],
    route: '/appointments',
    requiredRole: 'all',
    steps: [
      'Mở màn hình **Lịch hẹn** từ menu bên trái.',
      'Nhấp vào nút **+ Đặt lịch mới** ở góc trên hoặc nhấp trực tiếp vào khung giờ trống trên bảng lịch timeline.',
      'Nhập họ tên và số điện thoại của khách hàng.',
      'Chọn **Dịch vụ** khách muốn làm và **Nhân viên phụ trách**.',
      'Chọn **Ngày** và **Khung giờ hẹn** bắt đầu (hệ thống sẽ tự tính giờ kết thúc dựa trên thời lượng dịch vụ).',
      'Thêm ghi chú đặc biệt (ví dụ: khách thích uốn lọn to, khách đi cùng bạn) và bấm **Xác nhận đặt lịch**.'
    ],
    tips: 'Màu sắc lịch hẹn thể hiện trạng thái: Vàng (Chờ xác nhận), Xanh dương (Đã xác nhận), Xanh lá (Đang làm), Xám (Hoàn tất).',
    sampleCommand: 'Đặt lịch cho chị Lan sđt 0912345678 gội đầu dưỡng sinh 14h ngày mai'
  },
  {
    id: 'appointment_cancel_reschedule',
    title: 'Đổi giờ hoặc Hủy lịch hẹn',
    category: 'Lịch hẹn & Xếp thợ',
    keywords: ['đổi lịch', 'hủy lịch', 'dời lịch', 'chuyển giờ hẹn', 'hủy hẹn', 'đổi ngày hẹn'],
    route: '/appointments',
    requiredRole: 'all',
    steps: [
      'Vào màn hình **Lịch hẹn**, tìm lịch hẹn của khách cần sửa.',
      'Nhấp vào thẻ lịch hẹn để mở khung chi tiết.',
      'Nếu muốn **Đổi giờ/ngày**: Bấm nút **Chỉnh sửa**, chọn thời gian mới và lưu lại.',
      'Nếu muốn **Hủy lịch**: Bấm nút **Hủy lịch hẹn**, nhập lý do hủy (ví dụ: khách bận việc) và xác nhận.'
    ],
    tips: 'Bạn cũng có thể kéo thả thẻ lịch hẹn trực tiếp trên timeline để dời giờ nhanh chóng.',
    sampleCommand: 'Hủy lịch hẹn của số 0912345678'
  },

  // 3. KHÁCH HÀNG & CRM
  {
    id: 'customer_management',
    title: 'Thêm & Quản lý thông tin khách hàng',
    category: 'Khách hàng & Hội viên',
    keywords: ['thêm khách', 'tạo khách', 'quản lý khách', 'sửa khách', 'thông tin khách', 'hồ sơ khách', 'crm'],
    route: '/customers',
    requiredRole: 'all',
    steps: [
      'Vào menu **Khách hàng**.',
      'Bấm nút **+ Thêm khách hàng** ở góc phải màn hình.',
      'Điền đầy đủ Họ tên, Số điện thoại (bắt buộc), Giới tính, Ngày sinh, Địa chỉ và Ghi chú sở thích.',
      'Bấm **Lưu thông tin** để hoàn tất hồ sơ.'
    ],
    tips: 'Nhập ngày sinh nhật để hệ thống tự động nhắc tặng quà hoặc gửi ưu đãi vào tháng sinh nhật của khách.',
    sampleCommand: 'Tạo khách hàng mới Nguyễn Văn A số điện thoại 0988123456'
  },
  {
    id: 'customer_segments_guide',
    title: 'Lọc & Tạo tập khách hàng (Customer Segments)',
    category: 'Khách hàng & Hội viên',
    keywords: ['tập khách hàng', 'phân nhóm khách', 'lọc khách hàng', 'nhóm khách', 'segment', 'khách ngủ đông', 'khách sinh nhật'],
    route: '/customers?tab=segments',
    requiredRole: 'all',
    steps: [
      'Vào menu **Khách hàng**, chọn tab **Tập khách hàng**.',
      'Bấm nút **+ Tạo tập khách hàng mới** (hoặc chọn các mẫu có sẵn: Khách ngủ đông > 30 ngày, Khách VIP chi tiêu cao, Khách sinh nhật tháng này).',
      'Thiết lập các điều kiện lọc: Số ngày chưa quay lại, Tổng chi tiêu tối thiểu, Số lần ghé, Giới tính, Tháng sinh.',
      'Chọn màu sắc đại diện và bấm **Lưu tập khách hàng**.',
      'Hệ thống sẽ tự động quét toàn bộ cơ sở dữ liệu và phân loại khách hàng phù hợp vào tập này.'
    ],
    tips: 'Bạn có thể ra lệnh trực tiếp cho AI trong khung chat để AI tự động lọc và tạo tập trong 1 giây!',
    sampleCommand: 'Tạo tập khách hàng chưa quay lại 30 ngày'
  },
  {
    id: 'customer_loyalty_tiers',
    title: 'Quản lý Hạng thành viên & Tích điểm (Loyalty)',
    category: 'Khách hàng & Hội viên',
    keywords: ['hạng thành viên', 'tích điểm', 'thẻ vip', 'hạng vàng', 'hạng bạc', 'kim cương', 'điểm thưởng', 'đổi điểm'],
    route: '/customers?tab=tiers',
    requiredRole: 'owner',
    steps: [
      'Vào menu **Khách hàng**, chọn tab **Hạng thành viên** hoặc **Tích điểm**.',
      'Bấm **Cấu hình hạng** để thiết lập mức chi tiêu hoặc số điểm cần đạt để nâng hạng (ví dụ: Bạc đạt 1tr, Vàng đạt 5tr, Kim cương đạt 15tr).',
      'Cài đặt mức ưu đãi giảm giá (%) cho từng hạng thẻ khi thanh toán.',
      'Hệ thống sẽ tự động nâng hạng cho khách hàng ngay khi hóa đơn đạt ngưỡng.'
    ],
    tips: 'Khách hàng có thể dùng điểm tích lũy để thanh toán trừ trực tiếp vào hóa đơn tại quầy POS.',
    sampleCommand: null
  },
  {
    id: 'customer_deposits_packages',
    title: 'Quản lý Ví nạp tiền & Thẻ liệu trình dịch vụ',
    category: 'Khách hàng & Hội viên',
    keywords: ['thẻ liệu trình', 'gói dịch vụ', 'nạp tiền', 'ví nạp', 'mua gói', 'trừ liệu trình', 'thẻ tài khoản'],
    route: '/customers',
    requiredRole: 'all',
    steps: [
      'Vào menu **Khách hàng**, tìm và nhấp vào khách hàng cần thao tác.',
      'Mở tab **Gói dịch vụ / Liệu trình** để xem các gói khách đã mua.',
      'Để bán gói mới: Vào màn hình POS, chọn dịch vụ dạng Gói hoặc Thẻ liệu trình để thanh toán cho khách.',
      'Mỗi lần khách đến làm dịch vụ trong gói, thu ngân chỉ cần chọn **Trừ liệu trình** mà không phải tính tiền lại.'
    ],
    tips: 'Tiền nạp vào ví khách hàng giúp salon giữ chân khách hàng và thu dòng tiền trước hiệu quả.',
    sampleCommand: null
  },

  // 4. BẢNG GIÁ & DỊCH VỤ
  {
    id: 'services_management',
    title: 'Thêm & Cập nhật Bảng giá dịch vụ',
    category: 'Dịch vụ & Bảng giá',
    keywords: ['thêm dịch vụ', 'sửa dịch vụ', 'bảng giá', 'giá dịch vụ', 'tạo dịch vụ', 'dịch vụ mới', 'thời lượng dịch vụ'],
    route: '/services',
    requiredRole: 'manager',
    steps: [
      'Mở menu **Dịch vụ** từ thanh bên trái.',
      'Bấm nút **+ Thêm dịch vụ mới**.',
      'Nhập Tên dịch vụ (ví dụ: Cắt uốn tạo kiểu, Gội đầu dưỡng sinh collagen).',
      'Chọn Danh mục dịch vụ (Tóc, Nail, Spa, Massage...).',
      'Điền **Đơn giá (VND)** và **Thời lượng thực hiện (phút)** để hệ thống tính lịch hẹn chính xác.',
      'Bấm **Lưu dịch vụ**.'
    ],
    tips: 'Bạn có thể tải lên ảnh đại diện cho dịch vụ để hiển thị trực quan trên trang đặt lịch online của khách.',
    sampleCommand: 'Thêm dịch vụ mới Nhuộm tóc thời trang giá 350000 thời lượng 60 phút'
  },
  {
    id: 'services_combos',
    title: 'Tạo Combo dịch vụ tiết kiệm',
    category: 'Dịch vụ & Bảng giá',
    keywords: ['tạo combo', 'combo dịch vụ', 'gói combo', 'combo', 'khuyến mãi combo'],
    route: '/services',
    requiredRole: 'manager',
    steps: [
      'Vào menu **Dịch vụ**, chọn tab **Combo dịch vụ**.',
      'Bấm nút **+ Tạo combo mới**.',
      'Nhập Tên combo và chọn các dịch vụ thành phần cấu thành combo.',
      'Nhập giá trọn gói ưu đãi của combo.',
      'Bấm **Lưu combo**.'
    ],
    tips: 'Combo giúp nâng cao giá trị trung bình trên mỗi hóa đơn (AOV) của salon.',
    sampleCommand: null
  },

  // 5. KHO HÀNG & SẢN PHẨM
  {
    id: 'inventory_management',
    title: 'Quản lý Sản phẩm & Nhập hàng vào kho',
    category: 'Kho hàng & Sản phẩm',
    keywords: ['nhập kho', 'quản lý kho', 'tồn kho', 'thêm sản phẩm', 'nhập hàng', 'kiểm kho', 'sản phẩm mới', 'kho'],
    route: '/inventory',
    requiredRole: 'manager',
    steps: [
      'Truy cập menu **Kho hàng**.',
      'Để thêm sản phẩm mới: Bấm **+ Thêm sản phẩm**, nhập Tên, Mã vạch (Barcode), Đơn vị tính, Giá nhập, Giá bán lẻ và Số lượng tồn kho ban đầu.',
      'Để tạo phiếu nhập hàng: Bấm **Nhập kho**, chọn nhà cung cấp, thêm các sản phẩm cần nhập kèm số lượng và đơn giá, sau đó bấm **Xác nhận nhập kho**.',
      'Số lượng tồn kho sẽ được tự động cộng vào hệ thống ngay lập tức.'
    ],
    tips: 'Khi bán sản phẩm tại quầy POS, hệ thống sẽ tự động trừ tồn kho theo thời gian thực.',
    sampleCommand: 'Tra cứu sản phẩm dầu gội trong kho'
  },
  {
    id: 'inventory_low_stock',
    title: 'Kiểm tra cảnh báo sản phẩm sắp hết hàng',
    category: 'Kho hàng & Sản phẩm',
    keywords: ['hết hàng', 'cảnh báo hết hàng', 'sắp hết hàng', 'tồn kho thấp', 'kiểm tra kho', 'hàng tồn'],
    route: '/inventory',
    requiredRole: 'all',
    steps: [
      'Vào menu **Kho hàng**.',
      'Sử dụng bộ lọc **Tồn kho thấp / Sắp hết hàng**.',
      'Hệ thống sẽ liệt kê các sản phẩm có số lượng tồn kho chạm mức báo động (dưới định mức an toàn).',
      'Bấm nút **Tạo phiếu nhập** trực tiếp cho các sản phẩm này.'
    ],
    tips: 'Bạn có thể hỏi AI bất kỳ lúc nào: "Sản phẩm nào trong kho sắp hết?" để AI tổng hợp ngay.',
    sampleCommand: 'Kiểm tra sản phẩm sắp hết hàng'
  },

  // 6. NHÂN SỰ, HOA HỒNG & BẢNG LƯƠNG
  {
    id: 'staff_management',
    title: 'Thêm nhân viên & Phân quyền tài khoản',
    category: 'Nhân sự & Bảng lương',
    keywords: ['thêm nhân viên', 'thêm thợ', 'tạo nhân viên', 'phân quyền', 'vai trò', 'thợ chính', 'thợ phụ', 'nhân sự'],
    route: '/staff',
    requiredRole: 'manager',
    steps: [
      'Vào menu **Nhân viên**.',
      'Bấm nút **+ Thêm nhân viên**.',
      'Điền Họ tên, Số điện thoại, Email và chọn **Chức danh / Vai trò** (Chủ salon, Quản lý, Thu ngân, Thợ chính, Thợ phụ).',
      'Chọn Chi nhánh làm việc của nhân viên.',
      'Thiết lập mật khẩu đăng nhập ban đầu và bấm **Lưu nhân viên**.'
    ],
    tips: 'Mỗi chức danh sẽ có quyền hạn truy cập riêng biệt nhằm bảo mật số liệu tài chính của salon.',
    sampleCommand: 'Thêm nhân viên mới Nguyễn Văn Hùng số điện thoại 0911222333 vai trò Thợ chính'
  },
  {
    id: 'staff_commission_setup',
    title: 'Cấu hình tỷ lệ % Hoa hồng cho nhân viên',
    category: 'Nhân sự & Bảng lương',
    keywords: ['cấu hình hoa hồng', 'tính hoa hồng', 'cài đặt hoa hồng', 'hoa hồng thợ', 'phần trăm hoa hồng', 'chia hoa hồng'],
    route: '/staff',
    requiredRole: 'owner',
    steps: [
      'Vào menu **Nhân viên**, nhấp vào nhân viên cần cấu hình.',
      'Mở tab **Cấu hình hoa hồng / Lương**.',
      'Thiết lập **% Hoa hồng dịch vụ** (ví dụ: Thợ chính 15%, Thợ phụ 5%).',
      'Thiết lập **% Hoa hồng bán sản phẩm** (ví dụ: 10% doanh số bán mỹ phẩm/dầu gội).',
      'Bấm **Lưu cấu hình** để áp dụng tự động cho mọi hóa đơn kể từ thời điểm này.'
    ],
    tips: 'Bạn có thể thiết lập hoa hồng theo từng dịch vụ riêng biệt hoặc áp dụng chung toàn salon.',
    sampleCommand: null
  },
  {
    id: 'staff_payroll_run',
    title: 'Chấm công & Tính lương nhân viên',
    category: 'Nhân sự & Bảng lương',
    keywords: ['tính lương', 'bảng lương', 'chấm công', 'trả lương', 'hoa hồng tháng', 'phiếu lương', 'lương thợ'],
    route: '/staff',
    requiredRole: 'owner',
    steps: [
      'Vào menu **Nhân viên**, chọn tab **Bảng lương & Chấm công**.',
      'Chọn tháng cần tính lương.',
      'Hệ thống tự động tổng hợp: Lương cơ bản + Tổng tiền hoa hồng dịch vụ + Hoa hồng sản phẩm + Tiền Tip - Các khoản trừ/tạm ứng.',
      'Bấm **Chốt bảng lương** và in phiếu lương (Payslip) gửi cho nhân viên.'
    ],
    tips: 'Tiền Tip thu từ khách sẽ được cộng nguyên vẹn cho nhân viên và tách biệt khỏi doanh thu của Salon.',
    sampleCommand: null
  },

  // 7. PHÒNG & GIƯỜNG SPA / SALON
  {
    id: 'rooms_beds_management',
    title: 'Quản lý Phòng & Giường Spa / Salon',
    category: 'Phòng & Giường',
    keywords: ['phòng giường', 'xếp giường', 'giường spa', 'quản lý phòng', 'giường trống', 'xếp phòng', 'dọn giường'],
    route: '/rooms-beds',
    requiredRole: 'all',
    steps: [
      'Vào menu **Phòng & Giường**.',
      'Màn hình hiển thị sơ đồ phòng và các giường theo trạng thái thời gian thực: Xanh lá (Trống), Đỏ (Đang có khách), Vàng (Cần dọn dẹp vệ sinh).',
      'Khi khách đến làm dịch vụ: Nhấp vào giường trống để gán khách hàng và kỹ thuật viên phụ trách.',
      'Sau khi khách hoàn tất dịch vụ: Chuyển trạng thái sang "Đang dọn dẹp" rồi hoàn trả về "Sẵn sàng đón khách".'
    ],
    tips: 'Tại màn hình POS Bán hàng, bạn có thể chọn phòng/giường trực tiếp khi thanh toán dịch vụ.',
    sampleCommand: null
  },

  // 8. BÁO CÁO & DOANH THU
  {
    id: 'reports_overview',
    title: 'Xem Báo cáo Doanh thu & Hiệu suất kinh doanh',
    category: 'Báo cáo & Thống kê',
    keywords: ['báo cáo', 'doanh thu', 'lợi nhuận', 'doanh số', 'báo cáo ngày', 'báo cáo tháng', 'thống kê', 'doanh thu thợ'],
    route: '/reports',
    requiredRole: 'manager',
    steps: [
      'Vào menu **Báo cáo** từ thanh điều hướng.',
      'Chọn mốc thời gian: Hôm nay, Hôm qua, 7 ngày qua, Tháng này hoặc Tùy chọn khoảng ngày.',
      'Xem các chỉ số cốt lõi: Tổng doanh thu thuần, Số lượng hóa đơn, Giá trị đơn trung bình (AOV), Doanh thu theo thợ, Dịch vụ bán chạy nhất.',
      'Bấm **Xuất Excel** nếu muốn lưu trữ hoặc chia sẻ số liệu.'
    ],
    tips: 'Nhân viên thu ngân chỉ có quyền xem doanh thu ca làm việc của mình, chỉ Chủ salon/Quản lý mới xem được toàn bộ lợi nhuận.',
    sampleCommand: 'Tổng kết doanh thu hôm nay thế nào?'
  },
  {
    id: 'reports_ai_generator',
    title: 'Tạo Báo cáo Số liệu Thông minh bằng AI',
    category: 'Báo cáo & Thống kê',
    keywords: ['báo cáo ai', 'báo cáo bằng ai', 'tạo báo cáo', 'lập báo cáo', 'xuất báo cáo', 'báo cáo tự động', 'ai report'],
    route: '/reports?tab=ai_report',
    requiredRole: 'manager',
    steps: [
      'Vào menu **Báo cáo** > chọn tab **Báo cáo bằng AI** (hoặc ra lệnh trực tiếp cho AI Copilot).',
      'Nhập yêu cầu báo cáo bất kỳ bằng ngôn ngữ tự nhiên (Ví dụ: "Báo cáo doanh thu tháng này theo từng nhân viên").',
      'AI sẽ tự động truy xuất dữ liệu từ hệ thống, phân tích KPI và vẽ biểu đồ trực quan.',
      'Sử dụng thanh bộ lọc để đổi nhanh mốc thời gian hoặc chi nhánh.',
      'Bấm **Xuất Excel (.xlsx)** để tải file bảng tính hoặc **In / Lưu PDF**.'
    ],
    tips: 'Bạn có thể chat trực tiếp với AI Copilot ở bất kỳ trang nào với câu lệnh "Tạo báo cáo..." để được tự động chuyển hướng và kết xuất báo cáo ngay lập tức.',
    sampleCommand: 'Tạo báo cáo doanh thu tuần này'
  },

  // 9. KHUYẾN MÃI & GIẢM GIÁ
  {
    id: 'discounts_promotions',
    title: 'Tạo Mã giảm giá & Chương trình Khuyến mãi',
    category: 'Khuyến mãi & Marketing',
    keywords: ['tạo khuyến mãi', 'mã giảm giá', 'voucher', 'tạo voucher', 'giảm giá', 'chương trình ưu đãi', 'promo'],
    route: '/discounts',
    requiredRole: 'manager',
    steps: [
      'Mở menu **Khuyến mãi**.',
      'Bấm **+ Tạo chương trình mới**.',
      'Chọn hình thức: Giảm theo % giá trị đơn, Giảm số tiền cố định, hoặc Tặng dịch vụ đi kèm.',
      'Đặt tên chương trình, mã Voucher (ví dụ: SALON20, TRIANKHACH2026).',
      'Thiết lập ngày bắt đầu, ngày hết hạn và điều kiện áp dụng (áp dụng cho toàn bộ khách hay chỉ khách VIP).',
      'Bấm **Kích hoạt khuyến mãi**.'
    ],
    tips: 'Mã voucher sau khi tạo có thể nhập trực tiếp tại quầy POS khi thanh toán hóa đơn.',
    sampleCommand: null
  },

  // 10. CÀI ĐẶT & CHI NHÁNH
  {
    id: 'settings_branch_printer',
    title: 'Cài đặt Chi nhánh & Máy in hóa đơn',
    category: 'Hệ thống & Cài đặt',
    keywords: ['cài đặt', 'chi nhánh', 'thêm chi nhánh', 'máy in', 'cài máy in', 'in hóa đơn', 'mẫu in', 'logo'],
    route: '/settings',
    requiredRole: 'owner',
    steps: [
      'Vào menu **Cài đặt** ở góc dưới cùng.',
      'Để thêm chi nhánh mới: Chọn tab **Chi nhánh**, bấm **+ Thêm chi nhánh**, nhập tên, địa chỉ và số hotline.',
      'Để cấu hình in hóa đơn: Chọn tab **Máy in & Mẫu in**, chọn khổ giấy (K80 hoặc K57), tải lên Logo salon, số tài khoản nhận tiền chuyển khoản và lời cảm ơn chân trang.',
      'Bấm **In thử** để kiểm tra máy in nhiệt kết nối thành công.'
    ],
    tips: 'Chủ salon có thể chuyển đổi linh hoạt giữa các chi nhánh ngay tại thanh chọn chi nhánh ở góc trên màn hình.',
    sampleCommand: 'Tạo chi nhánh mới Chi nhánh Quận 7 địa chỉ 123 Nguyễn Thị Thập'
  }
];

/**
 * Tìm kiếm bài hướng dẫn phù hợp nhất dựa trên câu hỏi của người dùng
 */
export function findHelpGuide(query) {
  if (!query || typeof query !== 'string') return null;
  const q = query.toLowerCase().trim();
  const cleanQ = q.replace(/[%.,?!;:\-_/()]/g, ' ').replace(/\s+/g, ' ');

  let bestMatch = null;
  let highestScore = 0;

  for (const item of SOFTWARE_KNOWLEDGE_BASE) {
    let score = 0;

    // Khớp tiêu đề chính xác
    if (cleanQ.includes(item.title.toLowerCase())) {
      score += 15;
    }

    // Khớp từ khóa trong danh sách
    for (const kw of item.keywords) {
      const cleanKw = kw.toLowerCase().trim();
      if (cleanQ.includes(cleanKw)) {
        score += 8;
      } else {
        // Kiểm tra nếu tất cả các từ đơn trong từ khóa đều xuất hiện trong câu hỏi
        const words = cleanKw.split(' ').filter(w => w.length >= 2);
        if (words.length > 1 && words.every(w => cleanQ.includes(w))) {
          score += 6;
        }
      }
    }

    // Khớp danh mục
    if (cleanQ.includes(item.category.toLowerCase())) {
      score += 3;
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = item;
    }
  }

  // Ngưỡng khớp tối thiểu
  if (highestScore >= 5) {
    return bestMatch;
  }

  return null;
}
