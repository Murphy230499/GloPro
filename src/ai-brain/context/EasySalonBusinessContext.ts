/**
 * EasySalon Business Context Module
 * 
 * Provides domain-specific business definitions, entity relationships,
 * and accounting/operational principles for the EasySalon platform.
 */

export interface IEasySalonModule {
  name: string;
  vietnameseName: string;
  description: string;
  keyEntities: string[];
  businessPrinciples: string[];
}

export const EASYSALON_MODULES: Record<string, IEasySalonModule> = {
  customer: {
    name: 'Customer Management',
    vietnameseName: 'Khách hàng & Hội viên',
    description: 'Quản lý hồ sơ khách hàng, phân hạng thành viên, tích lũy điểm thưởng và công nợ.',
    keyEntities: ['customer', 'customertier', 'loyaltyrule', 'membership'],
    businessPrinciples: [
      'Mỗi khách hàng được định danh duy nhất qua ID hoặc Số điện thoại (10 số chuẩn VN).',
      'Nếu có nhiều khách hàng trùng họ tên, bắt buộc phải hỏi lại người dùng kèm SĐT để xác định.',
      'Khách hàng có thể có công nợ (debt) khi chưa thanh toán xong dịch vụ/sản phẩm.',
      'Điểm tích lũy (points) được dùng để giảm trừ hóa đơn hoặc đổi quà theo tỷ lệ quy định.'
    ]
  },
  appointment: {
    name: 'Appointment Scheduling',
    vietnameseName: 'Lịch hẹn & Xếp lịch',
    description: 'Quản lý đặt lịch, điều phối khung giờ, phân bổ nhân viên thực hiện dịch vụ cho khách.',
    keyEntities: ['appointment', 'shift', 'staffschedule'],
    businessPrinciples: [
      'Một lịch hẹn hợp lệ BẮT BUỘC phải có: Khách hàng, Dịch vụ, Ngày làm và Giờ hẹn cụ thể.',
      'Không được tự ý điền giờ hoặc dịch vụ nếu người dùng chưa cung cấp.',
      'Các cụm từ thời gian như "sáng mai", "chiều mai" là khoảng thời gian (time range), KHÔNG phải giờ hẹn cụ thể.',
      'Trạng thái lịch hẹn gồm: pending (chờ xác nhận), confirmed (đã xác nhận), checked_in (đã đến), in_progress (đang làm), completed (hoàn thành), cancelled (đã hủy).',
      'Hủy lịch hẹn phải có lý do hủy và cần kiểm tra kỹ thông tin lịch trước khi thực hiện.'
    ]
  },
  services: {
    name: 'Services & Catalog',
    vietnameseName: 'Dịch vụ Làm đẹp & Liệu trình',
    description: 'Danh mục dịch vụ làm tóc, spa, nail, chăm sóc da cùng bảng giá và thời lượng.',
    keyEntities: ['service', 'servicegroup', 'servicepackage', 'treatment'],
    businessPrinciples: [
      'Mỗi dịch vụ có tên, đơn giá (price) và thời lượng dự kiến (duration_minutes).',
      'Nếu người dùng nói tên dịch vụ chung chung ("cắt tóc", "nhuộm") mà salon có nhiều gói dịch vụ con, phải hỏi lại để chọn gói cụ thể.',
      'Dịch vụ có thể kèm theo hoa hồng (commission) cho nhân viên thực hiện.'
    ]
  },
  products: {
    name: 'Retail & Inventory',
    vietnameseName: 'Sản phẩm Bán lẻ & Kho hàng',
    description: 'Quản lý mỹ phẩm, dầu gội, thuốc nhuộm, quản lý tồn kho và nhập xuất kho.',
    keyEntities: ['product', 'productcombo'],
    businessPrinciples: [
      'Mỗi sản phẩm có đơn giá bán, giá vốn và số lượng tồn kho (stock).',
      'Không được bán hoặc xuất kho khi số lượng vượt quá tồn kho thực tế nếu salon bật chặn âm kho.'
    ]
  },
  staff: {
    name: 'Staff & Commission',
    vietnameseName: 'Nhân viên, Thợ & Hoa hồng',
    description: 'Quản lý thợ chính, thợ phụ, thu ngân, xếp ca, tính hoa hồng và lương.',
    keyEntities: ['staff', 'shift', 'staffcommissionrule', 'staffattendance'],
    businessPrinciples: [
      'Nhân viên gồm các vai trò: Quản lý, Thợ chính, Thợ phụ, Thu ngân, Lễ tân.',
      'Khi người dùng hỏi doanh thu theo tên nhân viên (vd: "doanh thu của Nam"), AI phải nhận diện Nam là nhân viên thực hiện, không nhầm sang khách hàng.',
      'Hoa hồng của nhân viên được tính theo % dịch vụ hoặc số tiền cố định sau khi bill hoàn thành.'
    ]
  },
  pos: {
    name: 'POS & Invoices',
    vietnameseName: 'Thu ngân & Hóa đơn (POS)',
    description: 'Tạo hóa đơn thanh toán cho dịch vụ và sản phẩm, áp dụng giảm giá, voucher và điểm thưởng.',
    keyEntities: ['invoice', 'deposit', 'voucher'],
    businessPrinciples: [
      'Hóa đơn phải có danh sách món hàng/dịch vụ (items) và tổng tiền cụ thể.',
      'Phương thức thanh toán gồm: Tiền mặt, Chuyển khoản, Thẻ, Trừ ví/thẻ trả trước.',
      'Không được tự ý tạo hóa đơn nếu người dùng chưa cung cấp đủ số tiền hoặc dịch vụ cần thanh toán.'
    ]
  },
  tip: {
    name: 'Tip Management',
    vietnameseName: 'Tiền Tip / Tiền bồi dưỡng',
    description: 'Quản lý tiền tip khách hàng gửi riêng cho thợ/nhân viên.',
    keyEntities: ['invoice.tip', 'invoice.tip_splits'],
    businessPrinciples: [
      'NGUYÊN TẮC CỐT LÕI: Tiền TIP là khoản thu hộ cho nhân viên, KHÔNG PHẢI doanh thu của Salon.',
      'Tiền TIP được cộng vào tổng số tiền khách cần trả, nhưng khi hạch toán KPI/Báo cáo doanh thu thì phải tách riêng tiền Tip ra khỏi Doanh thu thuần của salon.',
      'Tip có thể chỉ định cho một nhân viên cụ thể hoặc chia đều cho kíp thợ thực hiện.'
    ]
  },
  branch: {
    name: 'Branch Management',
    vietnameseName: 'Chi nhánh & Chuỗi Salon',
    description: 'Quản lý hoạt động độc lập hoặc liên chi nhánh của chuỗi salon.',
    keyEntities: ['branch', 'facility'],
    businessPrinciples: [
      'Dữ liệu hóa đơn, lịch hẹn, doanh thu thường gắn liền với branch_id của chi nhánh đang chọn.',
      'Nếu người dùng chọn "Toàn chuỗi" (all), số liệu sẽ được tổng hợp từ tất cả các chi nhánh.'
    ]
  }
};

/**
 * Builds standard system business context instructions for Gemini
 */
export function buildBusinessContextPrompt(context: {
  branchName?: string;
  userName?: string;
  userRole?: string;
  currentPage?: string;
}): string {
  return `
BỐI CẢNH NGHIỆP VỤ HỆ THỐNG QUẢN LÝ SALON & SPA (EASYSALON):
1. PHẠM VI ỨNG DỤNG:
   - Bạn là Trợ lý AI Chuyên viên Điều hành của phần mềm Quản lý Salon & Spa EasySalon.
   - Người sử dụng: Chủ cơ sở, Quản lý, hoặc Thu ngân tại chi nhánh "${context.branchName || 'Chi nhánh hiện tại'}".
   - Tài khoản đăng nhập: ${context.userName || 'Quản trị viên'} (${context.userRole || 'owner'}).
   - Màn hình đang mở: ${context.currentPage || 'Trang chủ'}.

2. ĐẶC THÙ NGHIỆP VỤ QUAN TRỌNG:
   - KHÁCH HÀNG: Có SĐT, tích điểm, phân hạng (Đồng/Bạc/Vàng/Kim Cương) và công nợ. Trùng tên phải hỏi lại SĐT.
   - LỊCH HẸN: Phải đủ 4 yếu tố: Khách hàng + Dịch vụ + Ngày + Giờ cụ thể. Thiếu bất kỳ yếu tố nào → BẮT BUỘC HỎI LẠI.
   - TIỀN TIP: Là khoản THU HỘ cho thợ. KHÔNG ĐƯỢC TÍNH VÀO DOANH THU CỦA SALON.
   - DOANH THU NHÂN VIÊN: Khi người dùng hỏi doanh thu của một người (vd: "doanh thu của Nam"), hiểu là nhân viên/thợ thực hiện dịch vụ.
   - THỜI GIAN: "sáng mai", "chiều mai", "tối nay" là KHOẢNG THỜI GIAN, không phải thời điểm cụ thể để chốt lịch hẹn. Phải hỏi giờ chính xác.

3. QUY TẮC PHÁT NGÔN TRUNG THỰC:
   - KHÔNG ĐƯỢC tự bịa số liệu doanh thu, số khách, tồn kho hoặc ID.
   - KHÔNG ĐƯỢC nói rằng một thao tác đã tạo/hủy thành công nếu hệ thống chưa thực sự thực thi qua Tool thành công.
   - Nếu không tìm thấy thông tin: Nói rõ "Không tìm thấy dữ liệu trong hệ thống", tuyệt đối không suy đoán.
`.trim();
}
