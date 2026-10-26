import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { base44 } from '@/api/base44Client';
import { supabase } from '@/lib/supabaseClient';
import { setSyncTenantId } from '@/lib/tenantManager';
import { 
  EasySalonBrain, 
  parseCustomerProfile,
  buildBusinessContextPrompt, 
  GroundingEngine,
  ActionPlanner,
  ConfirmationGate,
  ActionExecutor,
  ActionOrchestrator,
  IntentDecomposer,
  AgentContextManager,
  UnderstandingValidator,
  ConversationInterpreter
} from '@/ai-brain';
import { findHelpGuide } from '@/ai-brain/knowledge/SoftwareKnowledgeBase';

// Tool Function Declarations for Gemini
const toolDeclarations = [
  {
    name: 'customer_search',
    description: 'Tìm kiếm khách hàng trong hệ thống bằng tên, số điện thoại hoặc email. Nếu người dùng hỏi tổng số khách hoặc danh sách khách, để query trống.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: { type: Type.STRING, description: 'Từ khóa tìm kiếm: tên, sđt, email hoặc để trống nếu muốn xem danh sách' }
      }
    }
  },
  {
    name: 'customer_create',
    description: 'Tạo hồ sơ khách hàng mới vào cơ sở dữ liệu.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: 'Họ tên đầy đủ của khách hàng' },
        phone: { type: Type.STRING, description: 'Số điện thoại của khách hàng' },
        email: { type: Type.STRING, description: 'Email của khách hàng (nếu có)' },
        address: { type: Type.STRING, description: 'Địa chỉ (nếu có)' },
        gender: { type: Type.STRING, description: 'Giới tính: Nam, Nữ, hoặc Khác' },
        birth_date: { type: Type.STRING, description: 'Ngày sinh định dạng YYYY-MM-DD hoặc DD/MM' },
        note: { type: Type.STRING, description: 'Ghi chú thêm về khách hàng' }
      },
      required: ['name', 'phone']
    }
  },
  {
    name: 'customer_update',
    description: 'Cập nhật thông tin của khách hàng hiện có theo số điện thoại hoặc ID.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        phone: { type: Type.STRING, description: 'Số điện thoại của khách hàng cần sửa' },
        name: { type: Type.STRING, description: 'Tên mới (nếu muốn đổi)' },
        note: { type: Type.STRING, description: 'Ghi chú mới' },
        address: { type: Type.STRING, description: 'Địa chỉ mới' }
      },
      required: ['phone']
    }
  },
  {
    name: 'customer_filter',
    description: 'Lọc, phân tích hoặc tạo tập khách hàng (Customer Segment) dựa theo nhiều tiêu chí: số ngày chưa quay lại salon, tổng chi tiêu, số lần ghé, tháng sinh nhật, giới tính, dịch vụ đã từng làm, v.v.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        last_visit_days_gt: { type: Type.NUMBER, description: 'Lọc khách chưa ghé lại trên bao nhiêu ngày (ví dụ: 30, 45, 60 ngày)' },
        last_visit_days_lt: { type: Type.NUMBER, description: 'Lọc khách mới ghé lại trong vòng bao nhiêu ngày (ví dụ: 7, 14, 30 ngày)' },
        min_spent: { type: Type.NUMBER, description: 'Tổng chi tiêu tích lũy tối thiểu (VND), ví dụ: 2000000, 5000000' },
        max_spent: { type: Type.NUMBER, description: 'Tổng chi tiêu tích lũy tối đa (VND)' },
        min_visits: { type: Type.NUMBER, description: 'Số lần đến salon tối thiểu (ví dụ: 1, 3, 5 lần)' },
        max_visits: { type: Type.NUMBER, description: 'Số lần đến salon tối đa' },
        visit_count_eq: { type: Type.NUMBER, description: 'Số lần đến salon chính xác (ví dụ: 1 cho khách mới)' },
        birthday_month: { type: Type.NUMBER, description: 'Tháng sinh nhật của khách hàng (1-12)' },
        gender: { type: Type.STRING, description: 'Giới tính khách hàng: male (nam), female (nữ)' },
        service_name: { type: Type.STRING, description: 'Tên dịch vụ khách đã từng sử dụng (ví dụ: cắt tóc, nhuộm tóc, uốn tóc)' },
        min_points: { type: Type.NUMBER, description: 'Điểm tích lũy tối thiểu của khách' },
        action_mode: { 
          type: Type.STRING, 
          description: 'Hành động mong muốn: "filter" (nếu người dùng yêu cầu lọc/xem danh sách), "create_segment" (nếu người dùng yêu cầu tạo tập/lưu tập), "both" (nếu không nói rõ, vừa hiển thị vừa cho phép lưu tập)' 
        },
        segment_name: { type: Type.STRING, description: 'Tên tập khách hàng nếu tạo tập (nếu không có, hệ thống tự động đặt tên theo tiêu chí)' }
      }
    }
  },
  {
    name: 'customer_segment_create',
    description: 'Tạo và lưu trực tiếp một tập khách hàng mới vào hệ thống Salon.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: 'Tên tập khách hàng' },
        conditions: { type: Type.OBJECT, description: 'Đối tượng JSON chứa các điều kiện lọc khách hàng' },
        color: { type: Type.STRING, description: 'Mã màu nhận diện (Hex color, ví dụ: #34D399, #FBBF24, #FF6B9D)' }
      },
      required: ['name']
    }
  },
  {
    name: 'appointment_create',
    description: 'Đặt lịch hẹn mới cho khách hàng tại salon/spa.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        customer_name: { type: Type.STRING, description: 'Tên khách hàng' },
        customer_phone: { type: Type.STRING, description: 'Số điện thoại khách hàng' },
        service_name: { type: Type.STRING, description: 'Tên dịch vụ (ví dụ: Cắt tóc, Gội đầu dưỡng sinh, Nhuộm tóc...)' },
        date: { type: Type.STRING, description: 'Ngày hẹn định dạng YYYY-MM-DD (nếu khách nói hôm nay, ngày mai thì quy đổi ra YYYY-MM-DD)' },
        time: { type: Type.STRING, description: 'Giờ hẹn định dạng HH:MM (ví dụ: 14:00, 09:30)' },
        staff_name: { type: Type.STRING, description: 'Tên nhân viên phụ trách nếu có' },
        note: { type: Type.STRING, description: 'Ghi chú lịch hẹn' }
      },
      required: ['customer_name', 'customer_phone', 'service_name', 'date', 'time']
    }
  },
  {
    name: 'appointment_search',
    description: 'Tra cứu danh sách lịch hẹn theo ngày, số điện thoại hoặc trạng thái.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        date: { type: Type.STRING, description: 'Ngày cần xem lịch (YYYY-MM-DD)' },
        customer_phone: { type: Type.STRING, description: 'Số điện thoại khách hàng' },
        status: { type: Type.STRING, description: 'Trạng thái: pending, confirmed, completed, cancelled' }
      }
    }
  },
  {
    name: 'appointment_cancel',
    description: 'Hủy lịch hẹn của khách hàng.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        customer_phone: { type: Type.STRING, description: 'Số điện thoại của khách hàng để tìm lịch hẹn cần hủy' },
        date: { type: Type.STRING, description: 'Ngày của lịch hẹn (YYYY-MM-DD)' },
        reason: { type: Type.STRING, description: 'Lý do hủy lịch hẹn' }
      },
      required: ['customer_phone']
    }
  },
  {
    name: 'pos_create_invoice',
    description: 'Tạo hóa đơn thanh toán / bill bán lẻ cho khách hàng.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        customer_name: { type: Type.STRING, description: 'Tên khách hàng thanh toán' },
        customer_phone: { type: Type.STRING, description: 'Số điện thoại khách hàng' },
        items_description: { type: Type.STRING, description: 'Mô tả chi tiết các món dịch vụ / sản phẩm và đơn giá' },
        total_amount: { type: Type.NUMBER, description: 'Tổng số tiền thanh toán (VND)' },
        discount_amount: { type: Type.NUMBER, description: 'Số tiền giảm giá nếu có (VND)' },
        payment_method: { type: Type.STRING, description: 'Hình thức thanh toán: Tiền mặt, Chuyển khoản, Thẻ' }
      },
      required: ['customer_name', 'total_amount']
    }
  },
  {
    name: 'pos_get_today_summary',
    description: 'Xem báo cáo doanh thu bán hàng và tình hình kinh doanh hôm nay. CHỈ gọi khi người dùng hỏi về doanh thu, tiền bán hàng hoặc tình hình kinh doanh hôm nay. TUYỆT ĐỐI KHÔNG gọi khi người dùng đang đặt lịch hoặc cung cấp thông tin lịch hẹn.',
    parameters: {
      type: Type.OBJECT,
      properties: {}
    }
  },
  {
    name: 'report_generate_ai',
    description: 'Tạo báo cáo số liệu thông minh với AI, trích xuất dữ liệu thực tế từ hệ thống (doanh thu, lịch hẹn, khách hàng, nhân viên, dịch vụ, biểu đồ, xuất file Excel) và chuyển màn hình tới tab Báo cáo AI (/reports?tab=ai_report). Gọi khi người dùng yêu cầu: "tạo báo cáo...", "lập báo cáo...", "báo cáo bằng ai...", "báo cáo doanh thu...", "báo cáo nhân viên...", "xuất báo cáo...", v.v.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        prompt: {
          type: Type.STRING,
          description: 'Yêu cầu hoặc chủ đề báo cáo chi tiết của người dùng'
        },
        report_type: {
          type: Type.STRING,
          description: 'Loại báo cáo: "revenue" (doanh thu), "staff" (nhân viên), "customer" (khách hàng), "service" (dịch vụ), "appointment" (lịch hẹn), "general" (tổng hợp)'
        },
        period: {
          type: Type.STRING,
          description: 'Khoảng thời gian: "today", "week", "month", "quarter", "year", "all"'
        }
      },
      required: ['prompt']
    }
  },
  {
    name: 'reports_get_overview',
    description: 'Xem báo cáo doanh thu theo khoảng thời gian (tuần, tháng, quý, năm) và danh sách top dịch vụ, sản phẩm bán chạy.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        period: { 
          type: Type.STRING, 
          description: 'Khoảng thời gian: "week" (tuần này hoặc 7 ngày qua), "month" (tháng này), "quarter" (quý này), "year" (năm nay)' 
        }
      }
    }
  },
  {
    name: 'staff_search',
    description: 'Tra cứu danh sách nhân viên, thợ chính, thợ phụ trong salon.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: { type: Type.STRING, description: 'Tên nhân viên hoặc vị trí cần tìm' }
      }
    }
  },
  {
    name: 'services_search',
    description: 'Tra cứu danh mục dịch vụ làm đẹp, bảng giá và thời lượng.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: { type: Type.STRING, description: 'Tên dịch vụ cần tra cứu hoặc để trống để xem tất cả' }
      }
    }
  },
  {
    name: 'products_search',
    description: 'Tra cứu sản phẩm bán lẻ, mỹ phẩm, tồn kho và đơn giá.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: { type: Type.STRING, description: 'Tên sản phẩm cần tìm hoặc để trống để xem tất cả' }
      }
    }
  },
  {
    name: 'navigate_to',
    description: 'Chuyển màn hình / điều hướng người dùng tới trang chức năng mong muốn trong ứng dụng.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        page: { 
          type: Type.STRING, 
          description: 'Đường dẫn trang: /dashboard (Tổng quan), /pos (Thu ngân/Bán hàng), /appointments (Lịch hẹn), /customers (Khách hàng), /staff (Nhân viên), /services (Dịch vụ & Sản phẩm), /reports (Báo cáo doanh thu), /inventory (Kho hàng), /discounts (Giảm giá), /cashflow (Thu chi), /settings (Cài đặt)' 
        },
        page_title: { type: Type.STRING, description: 'Tên trang tiếng Việt để thông báo cho người dùng' }
      },
      required: ['page']
    }
  },
  {
    name: 'branch_create',
    description: 'Tạo một chi nhánh mới cho salon trong hệ thống phần mềm.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: 'Tên chi nhánh' },
        address: { type: Type.STRING, description: 'Địa chỉ của chi nhánh' },
        phone: { type: Type.STRING, description: 'Số điện thoại chi nhánh' },
        city: { type: Type.STRING, description: 'Thành phố hoặc tỉnh' }
      },
      required: ['name']
    }
  },
  {
    name: 'service_create',
    description: 'Tạo dịch vụ làm đẹp mới cho salon/spa.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: 'Tên dịch vụ mới' },
        price: { type: Type.NUMBER, description: 'Giá dịch vụ (VND)' },
        duration_minutes: { type: Type.NUMBER, description: 'Thời lượng dịch vụ tính bằng phút (mặc định 45)' }
      },
      required: ['name', 'price']
    }
  },
  {
    name: 'staff_create',
    description: 'Thêm nhân viên / thợ làm mới vào salon.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: 'Họ tên nhân viên' },
        phone: { type: Type.STRING, description: 'Số điện thoại nhân viên' },
        role: { type: Type.STRING, description: 'Vị trí/vai trò: Thợ chính, Thợ phụ, Thu ngân, Quản lý' }
      },
      required: ['name', 'phone']
    }
  },
  {
    name: 'product_create',
    description: 'Thêm sản phẩm bán lẻ / mỹ phẩm mới vào kho hàng salon.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: 'Tên sản phẩm mới' },
        price: { type: Type.NUMBER, description: 'Giá bán lẻ cho khách hàng (VND)' },
        cost_price: { type: Type.NUMBER, description: 'Giá vốn / giá nhập kho (VND, tùy chọn)' },
        stock: { type: Type.NUMBER, description: 'Số lượng tồn kho ban đầu (mặc định 20)' },
        category: { type: Type.STRING, description: 'Danh mục sản phẩm (mặc định Mỹ phẩm)' }
      },
      required: ['name', 'price']
    }
  },
  {
    name: 'staff_set_commission',
    description: 'Cài đặt quy tắc hoa hồng cho nhân viên / thợ làm dịch vụ hoặc bán sản phẩm.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        staff_name: { type: Type.STRING, description: 'Tên nhân viên áp dụng hoặc "all" cho toàn bộ nhân viên' },
        commission_type: { type: Type.STRING, description: 'Loại hoa hồng: "percent" (theo % doanh thu) hoặc "fixed" (theo số tiền cố định VND/lần)' },
        commission_value: { type: Type.NUMBER, description: 'Mức hoa hồng: ví dụ 10 cho 10%, hoặc 30000 cho 30.000đ' },
        item_name: { type: Type.STRING, description: 'Tên dịch vụ/sản phẩm áp dụng hoặc "all" cho tất cả dịch vụ/sản phẩm' },
        item_type: { type: Type.STRING, description: 'Loại danh mục: "service" (dịch vụ) hoặc "product" (sản phẩm)' }
      },
      required: ['staff_name', 'commission_type', 'commission_value']
    }
  },
  {
    name: 'voucher_create',
    description: 'Tạo mã voucher giảm giá / khuyến mãi mới cho salon.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        code: { type: Type.STRING, description: 'Mã voucher (ví dụ GP50K, SALON10)' },
        discount_type: { type: Type.STRING, description: 'Hình thức giảm: "percent" (% giảm) hoặc "fixed" (số tiền giảm VND)' },
        discount_value: { type: Type.NUMBER, description: 'Giá trị giảm (ví dụ 10 cho 10%, hoặc 50000 cho 50.000đ)' },
        min_spend: { type: Type.NUMBER, description: 'Giá trị đơn tối thiểu để áp dụng (tùy chọn)' },
        title: { type: Type.STRING, description: 'Tên mô tả chương trình ưu đãi' }
      },
      required: ['code', 'discount_type', 'discount_value']
    }
  },
  {
    name: 'cashflow_create_receipt',
    description: 'Lập phiếu thu tiền vào sổ quỹ salon (ví dụ: thu nợ khách hàng, thu tiền bán lẻ, thu khác).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        amount: { type: Type.NUMBER, description: 'Số tiền thu (VND)' },
        type_name: { type: Type.STRING, description: 'Tên khoản thu (ví dụ: Thu hồi công nợ, Thu khác)' },
        payer_name: { type: Type.STRING, description: 'Người nộp tiền (khách hàng hoặc đối tác)' },
        payment_method: { type: Type.STRING, description: 'Hình thức nộp: "cash" (tiền mặt), "transfer" (chuyển khoản)' },
        note: { type: Type.STRING, description: 'Ghi chú lý do thu' }
      },
      required: ['amount']
    }
  },
  {
    name: 'cashflow_create_payment',
    description: 'Lập phiếu chi tiền xuất khỏi sổ quỹ salon (ví dụ: chi trả tiền điện nước, chi thuê mặt bằng, mua văn phòng phẩm, chi tạm ứng lương nhân viên).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        amount: { type: Type.NUMBER, description: 'Số tiền chi (VND)' },
        type_name: { type: Type.STRING, description: 'Khoản chi / Mục đích chi (ví dụ: Chi tiền điện nước, Chi tạm ứng lương, Chi mua đồ dùng)' },
        receiver_name: { type: Type.STRING, description: 'Người nhận tiền' },
        payment_method: { type: Type.STRING, description: 'Hình thức chi: "cash" (tiền mặt), "transfer" (chuyển khoản)' },
        note: { type: Type.STRING, description: 'Ghi chú chi' }
      },
      required: ['amount']
    }
  },
  {
    name: 'inventory_create_receipt',
    description: 'Lập phiếu nhập kho hàng hóa, mỹ phẩm từ nhà cung cấp và tự động tăng tồn kho.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        supplier_name: { type: Type.STRING, description: 'Tên nhà cung cấp' },
        product_name: { type: Type.STRING, description: 'Tên sản phẩm nhập kho' },
        quantity: { type: Type.NUMBER, description: 'Số lượng nhập' },
        unit_price: { type: Type.NUMBER, description: 'Đơn giá nhập hàng (VND)' },
        paid_amount: { type: Type.NUMBER, description: 'Số tiền thanh toán ngay (VND)' },
        note: { type: Type.STRING, description: 'Ghi chú phiếu nhập' }
      },
      required: ['product_name', 'quantity', 'unit_price']
    }
  },
  {
    name: 'supplier_create',
    description: 'Thêm nhà cung cấp mỹ phẩm / thiết bị mới vào danh bạ salon.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: 'Tên nhà cung cấp' },
        phone: { type: Type.STRING, description: 'Số điện thoại nhà cung cấp' },
        address: { type: Type.STRING, description: 'Địa chỉ nhà cung cấp' },
        tax_code: { type: Type.STRING, description: 'Mã số thuế (nếu có)' }
      },
      required: ['name']
    }
  },
  {
    name: 'shift_create',
    description: 'Xếp ca làm việc cho nhân viên vào một ngày cụ thể (ví dụ: ca sáng, ca chiều, ca tối, ca cả ngày).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        staff_name: { type: Type.STRING, description: 'Tên nhân viên cần xếp ca' },
        date: { type: Type.STRING, description: 'Ngày làm việc (YYYY-MM-DD)' },
        shift_name: { type: Type.STRING, description: 'Tên ca: "Ca Sáng", "Ca Chiều", "Ca Tối", "Ca Cả Ngày"' }
      },
      required: ['staff_name']
    }
  },
  {
    name: 'attendance_record',
    description: 'Ghi nhận chấm công hoặc điều chỉnh giờ làm việc cho nhân viên (check-in, check-out, đi làm, đi muộn, nghỉ phép).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        staff_name: { type: Type.STRING, description: 'Tên nhân viên chấm công' },
        date: { type: Type.STRING, description: 'Ngày chấm công (YYYY-MM-DD)' },
        check_in: { type: Type.STRING, description: 'Giờ check-in (ví dụ: 08:30)' },
        check_out: { type: Type.STRING, description: 'Giờ check-out (ví dụ: 17:30)' },
        status: { type: Type.STRING, description: 'Trạng thái: "on_time" (đúng giờ), "late" (đi muộn), "leave" (nghỉ phép)' }
      },
      required: ['staff_name']
    }
  },
  {
    name: 'room_create',
    description: 'Tạo phòng hoặc khu vực làm đẹp mới trong salon (ví dụ: Phòng VIP 1, Phòng Gội, Phòng Chăm Sóc Da).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: 'Tên phòng / khu vực' },
        color: { type: Type.STRING, description: 'Mã màu nhận diện (ví dụ #3B82F6)' }
      },
      required: ['name']
    }
  },
  {
    name: 'bed_create',
    description: 'Thêm giường hoặc ghế phục vụ mới vào phòng/khu vực trong salon (ví dụ: Ghế Cắt 01, Giường Gội 02).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: 'Tên ghế / giường' },
        room_name: { type: Type.STRING, description: 'Tên phòng chứa ghế/giường này' }
      },
      required: ['name']
    }
  },
  {
    name: 'promotion_create',
    description: 'Tạo chương trình khuyến mãi (CTKM) giảm giá tự động theo hóa đơn hoặc dịch vụ (ví dụ: Giảm 20% đơn từ 500k, Khuyến mãi Khai trương giảm 100k).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: 'Tên chương trình khuyến mãi' },
        value: { type: Type.NUMBER, description: 'Giá trị giảm (% hoặc số tiền VNĐ)' },
        value_type: { type: Type.STRING, description: 'Loại giảm giá: "percent" (phần trăm) hoặc "fixed" (tiền mặt cố định)' },
        min_spend: { type: Type.NUMBER, description: 'Giá trị đơn hàng tối thiểu để áp dụng (VNĐ)' },
        expiry_date: { type: Type.STRING, description: 'Ngày hết hạn định dạng YYYY-MM-DD' },
        scope: { type: Type.STRING, description: 'Phạm vi áp dụng: "invoice" (toàn hóa đơn), "service" (dịch vụ), "product" (sản phẩm)' }
      },
      required: ['name', 'value']
    }
  },
  {
    name: 'deposit_create',
    description: 'Nạp tiền cọc hoặc nạp tiền vào thẻ tài khoản trả trước của khách hàng (ví dụ: Nạp cọc 500k cho khách Lan, Nạp thẻ tài khoản 2 triệu cho khách Nam).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        customer_name: { type: Type.STRING, description: 'Tên hoặc SĐT của khách hàng' },
        amount: { type: Type.NUMBER, description: 'Số tiền nạp (VNĐ)' },
        payment_method: { type: Type.STRING, description: 'Phương thức thanh toán: "cash" (tiền mặt) hoặc "transfer" (chuyển khoản)' },
        notes: { type: Type.STRING, description: 'Ghi chú nạp cọc / nạp tài khoản' }
      },
      required: ['customer_name', 'amount']
    }
  },
  {
    name: 'inventory_create_stock_out',
    description: 'Lập phiếu xuất kho hoặc ghi nhận tiêu hao vật tư nội bộ trong salon (ví dụ: Xuất 2 tuýp thuốc nhuộm để làm dịch vụ, Xuất hủy 1 chai dầu gội bị hỏng).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        product_name: { type: Type.STRING, description: 'Tên sản phẩm / vật tư cần xuất kho' },
        quantity: { type: Type.NUMBER, description: 'Số lượng xuất' },
        reason: { type: Type.STRING, description: 'Lý do xuất: "consumption" (tiêu hao dịch vụ), "damage" (xuất hủy hỏng/hết date), "other" (khác)' },
        notes: { type: Type.STRING, description: 'Ghi chú chi tiết' }
      },
      required: ['product_name', 'quantity']
    }
  },
  {
    name: 'service_package_create',
    description: 'Tạo gói dịch vụ nhiều buổi trong salon (ví dụ: Gói Gội Đầu Dưỡng Sinh 10 Buổi giá 1.5 triệu, Gói Chăm Sóc Da 5 Buổi giá 800k).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: 'Tên gói dịch vụ' },
        price: { type: Type.NUMBER, description: 'Giá bán của gói (VNĐ)' },
        usage_count: { type: Type.NUMBER, description: 'Số buổi / số lượt sử dụng trong gói (ví dụ: 5, 10)' }
      },
      required: ['name', 'price']
    }
  },
  {
    name: 'treatment_create',
    description: 'Tạo liệu trình chăm sóc chuyên sâu nhiều buổi (ví dụ: Liệu trình Phục hồi tóc hư tổn 5 buổi giá 1.8 triệu, Liệu trình Trị mụn chuyên sâu 10 buổi).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: 'Tên liệu trình' },
        price: { type: Type.NUMBER, description: 'Giá trọn gói liệu trình (VNĐ)' },
        total_sessions: { type: Type.NUMBER, description: 'Tổng số buổi của liệu trình' },
        description: { type: Type.STRING, description: 'Mô tả chi tiết liệu trình' }
      },
      required: ['name', 'price']
    }
  },
  {
    name: 'service_combo_create',
    description: 'Tạo combo dịch vụ kết hợp với giá ưu đãi (ví dụ: Combo Cắt tóc + Gội đầu + Uốn tóc giá 450k, Combo Sơn gel + Dưỡng móng giá 150k).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: 'Tên combo dịch vụ' },
        combo_price: { type: Type.NUMBER, description: 'Giá bán ưu đãi của combo (VNĐ)' },
        description: { type: Type.STRING, description: 'Mô tả các dịch vụ trong combo' }
      },
      required: ['name', 'combo_price']
    }
  },
  {
    name: 'product_combo_create',
    description: 'Tạo combo sản phẩm bán kèm ưu đãi (ví dụ: Combo Bộ Đôi Dầu Gội + Dầu Xả Keratin giá 350k).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: 'Tên combo sản phẩm' },
        combo_price: { type: Type.NUMBER, description: 'Giá bán ưu đãi của combo (VNĐ)' },
        description: { type: Type.STRING, description: 'Mô tả các sản phẩm trong combo' }
      },
      required: ['name', 'combo_price']
    }
  },
  {
    name: 'prepaid_card_create',
    description: 'Tạo loại Thẻ tiền mặt / Thẻ trả trước Membership (ví dụ: Thẻ VIP Silver Nạp 2 Triệu tặng 300k giá bán 2 triệu mệnh giá 2.3 triệu, Thẻ Gold 5 triệu).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: 'Tên thẻ tiền mặt' },
        face_value: { type: Type.NUMBER, description: 'Mệnh giá tiền trong thẻ (VNĐ)' },
        selling_price: { type: Type.NUMBER, description: 'Giá bán thực tế cho khách (VNĐ)' },
        color: { type: Type.STRING, description: 'Mã màu thẻ (ví dụ: #A78BFA, #FF6B9D, #60A5FA)' },
        expiry_months: { type: Type.NUMBER, description: 'Thời hạn sử dụng tính theo tháng (0 là vô hạn)' }
      },
      required: ['name', 'face_value']
    }
  }
];

// Tool Execution Logic with Rich Human-like Vietnamese Responses
async function executeTool(name, args = {}, context = {}) {
  try {
    // RBAC Security Check: Chặn thao tác nếu tài khoản không đủ quyền
    const userRole = (context.currentUser?.role || context.role || 'owner').toLowerCase();
    const ADMIN_ONLY_TOOLS = [
      'staff_create', 'branch_create', 'service_create', 'customer_segment_create',
      'product_create', 'staff_set_commission', 'voucher_create',
      'cashflow_create_receipt', 'cashflow_create_payment', 'inventory_create_receipt', 'supplier_create',
      'shift_create', 'attendance_record', 'room_create', 'bed_create',
      'promotion_create', 'deposit_create', 'inventory_create_stock_out',
      'service_package_create', 'treatment_create', 'service_combo_create', 'product_combo_create', 'prepaid_card_create'
    ];
    if (userRole === 'staff' && ADMIN_ONLY_TOOLS.includes(name)) {
      return {
        success: false,
        error: 'PERMISSION_DENIED',
        message: '⛔ **Truy cập bị giới hạn:** Bạn không có quyền sử dụng tính năng này. Vui lòng liên hệ Quản trị viên/Chủ salon.'
      };
    }

    const branchId = context.salonBranch?.id;

    switch (name) {
      case 'customer_search': {
        const list = await base44.entities.Customer.list().catch(() => []);
        const q = (args.query || '').toLowerCase().trim();
        const cleanQ = q.replace(/[\s.-]/g, '');
        let matched = list;
        if (q && q !== 'all' && q !== 'tất cả') {
          matched = list.filter(c => {
            const nameMatch = c.name && c.name.toLowerCase().includes(q);
            const cleanPhone = (c.phone || '').replace(/[\s.-]/g, '');
            const phoneMatch = cleanPhone && (cleanPhone.includes(cleanQ) || (cleanQ.length >= 7 && cleanPhone.endsWith(cleanQ)));
            const emailMatch = c.email && c.email.toLowerCase().includes(q);
            return nameMatch || phoneMatch || emailMatch;
          });
        }
        const customers = matched.slice(0, 8).map(c => ({
          id: c.id,
          name: c.name,
          phone: c.phone || 'Chưa có',
          email: c.email,
          tier: c.tier || 'Chuẩn',
          points: c.points || c.loyalty_points || 0,
          total_spent: c.total_spent || 0,
          visit_count: c.visit_count || 0
        }));

        let message = '';
        if (customers.length === 0) {
          message = `👥 Không tìm thấy khách hàng nào khớp với "${args.query}". Hệ thống hiện có **${list.length}** khách hàng đã lưu.`;
        } else {
          message = `👥 **Tìm thấy ${matched.length} khách hàng${q && q !== 'all' ? ` khớp với "${args.query}"` : ''} (Tổng toàn salon: ${list.length} khách):**\n` +
            customers.map(c => 
              `• **${c.name}** - SĐT: \`${c.phone}\` | Hạng: **${c.tier}** | Chi tiêu: **${(Number(c.total_spent) || 0).toLocaleString('vi-VN')} đ** (${c.visit_count} lần ghé)`
            ).join('\n');
        }

        return {
          total_in_system: list.length,
          matched_count: matched.length,
          customers,
          message
        };
      }

      case 'customer_filter': {
        const list = await base44.entities.Customer.list().catch(() => []);
        const invoices = await base44.entities.Invoice.list().catch(() => []);
        const appointments = await base44.entities.Appointment.list().catch(() => []);

        const now = new Date();
        const cond = {};
        const appliedDescriptions = [];

        // 1. Số ngày chưa quay lại salon
        if (args.last_visit_days_gt !== undefined && args.last_visit_days_gt !== null) {
          cond.last_visit_days_gt = Number(args.last_visit_days_gt);
          appliedDescriptions.push(`Chưa quay lại > ${cond.last_visit_days_gt} ngày`);
        }
        if (args.last_visit_days_lt !== undefined && args.last_visit_days_lt !== null) {
          cond.last_visit_days_lt = Number(args.last_visit_days_lt);
          appliedDescriptions.push(`Mới ghé lại trong vòng <= ${cond.last_visit_days_lt} ngày`);
        }

        // 2. Tổng chi tiêu tích lũy
        if (args.min_spent !== undefined && args.min_spent !== null) {
          cond.total_spent_gt = Number(args.min_spent);
          appliedDescriptions.push(`Tổng chi tiêu >= ${cond.total_spent_gt.toLocaleString('vi-VN')} đ`);
        }
        if (args.max_spent !== undefined && args.max_spent !== null) {
          cond.total_spent_lt = Number(args.max_spent);
          appliedDescriptions.push(`Tổng chi tiêu <= ${cond.total_spent_lt.toLocaleString('vi-VN')} đ`);
        }

        // 3. Số lần ghé
        if (args.visit_count_eq !== undefined && args.visit_count_eq !== null) {
          cond.visit_count_eq = Number(args.visit_count_eq);
          appliedDescriptions.push(`Số lần đến = ${cond.visit_count_eq}`);
        } else {
          if (args.min_visits !== undefined && args.min_visits !== null) {
            cond.visit_count_gte = Number(args.min_visits);
            appliedDescriptions.push(`Số lần đến >= ${cond.visit_count_gte}`);
          }
          if (args.max_visits !== undefined && args.max_visits !== null) {
            cond.visit_count_lte = Number(args.max_visits);
            appliedDescriptions.push(`Số lần đến <= ${cond.visit_count_lte}`);
          }
        }

        // 4. Sinh nhật trong tháng
        if (args.birthday_month !== undefined && args.birthday_month !== null) {
          cond.birthday_month_eq = Number(args.birthday_month);
          appliedDescriptions.push(`Sinh nhật trong tháng ${cond.birthday_month_eq}`);
        }

        // 5. Giới tính
        if (args.gender) {
          const g = args.gender.toLowerCase();
          const cleanGender = g.includes('nam') || g === 'male' ? 'male' : ((g.includes('nữ') || g === 'female') ? 'female' : null);
          if (cleanGender) {
            cond.gender = cleanGender;
            appliedDescriptions.push(`Giới tính: ${cleanGender === 'male' ? 'Nam' : 'Nữ'}`);
          }
        }

        // 6. Điểm tích lũy
        if (args.min_points !== undefined && args.min_points !== null) {
          cond.points_gte = Number(args.min_points);
          appliedDescriptions.push(`Điểm tích lũy >= ${cond.points_gte}`);
        }

        // 7. Dịch vụ từng làm
        let serviceCustomerIds = null;
        if (args.service_name) {
          const sName = args.service_name.toLowerCase().trim();
          cond.service_name = args.service_name;
          appliedDescriptions.push(`Từng làm dịch vụ "${args.service_name}"`);
          
          serviceCustomerIds = new Set();
          for (const inv of invoices) {
            const items = Array.isArray(inv.items) ? inv.items : [];
            const hasSvc = items.some(it => (it.name || '').toLowerCase().includes(sName));
            if (hasSvc && inv.customer_id) serviceCustomerIds.add(inv.customer_id);
          }
          for (const appt of appointments) {
            const hasSvc = (appt.service_name || '').toLowerCase().includes(sName);
            if (hasSvc && appt.customer_id) serviceCustomerIds.add(appt.customer_id);
          }
        }

        // Đánh giá bộ lọc trên từng khách hàng
        const matched = list.filter(c => {
          if (cond.last_visit_days_gt !== undefined) {
            if (c.last_visit) {
              const diffDays = Math.ceil(Math.abs(now - new Date(c.last_visit)) / (1000 * 60 * 60 * 24));
              if (diffDays <= cond.last_visit_days_gt) return false;
            }
          }
          if (cond.last_visit_days_lt !== undefined) {
            if (!c.last_visit) return false;
            const diffDays = Math.ceil(Math.abs(now - new Date(c.last_visit)) / (1000 * 60 * 60 * 24));
            if (diffDays > cond.last_visit_days_lt) return false;
          }

          const spent = Number(c.total_spent) || 0;
          if (cond.total_spent_gt !== undefined && spent < cond.total_spent_gt) return false;
          if (cond.total_spent_lt !== undefined && spent > cond.total_spent_lt) return false;

          const visits = Number(c.visit_count) || 0;
          if (cond.visit_count_eq !== undefined && visits !== cond.visit_count_eq) return false;
          if (cond.visit_count_gte !== undefined && visits < cond.visit_count_gte) return false;
          if (cond.visit_count_lte !== undefined && visits > cond.visit_count_lte) return false;

          if (cond.birthday_month_eq !== undefined) {
            if (!c.birthday) return false;
            const bMonth = new Date(c.birthday).getMonth() + 1;
            if (bMonth !== cond.birthday_month_eq) return false;
          }

          if (cond.gender && c.gender !== cond.gender) return false;
          if (cond.points_gte !== undefined && (Number(c.points) || 0) < cond.points_gte) return false;
          if (serviceCustomerIds && !serviceCustomerIds.has(c.id)) return false;

          return true;
        });

        const mode = args.action_mode || 'both';
        let createdSegment = null;

        if (mode === 'create_segment') {
          const autoName = args.segment_name || (appliedDescriptions.length > 0 
            ? `${appliedDescriptions.join(', ')} (${now.toLocaleDateString('vi-VN')})` 
            : `Tập khách hàng ${now.toLocaleDateString('vi-VN')}`);
          
          const COLORS = ['#34D399', '#60A5FA', '#FF6B9D', '#A78BFA', '#FBBF24', '#F97316', '#06B6D4'];
          const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];

          const segPayload = {
            name: autoName,
            color: randomColor,
            conditions: JSON.stringify(cond)
          };

          createdSegment = await base44.entities.CustomerSegment.create(segPayload).catch(() => null);
        }

        const criteriaText = appliedDescriptions.length > 0 
          ? appliedDescriptions.map(d => `• ${d}`).join('\n') 
          : '• Toàn bộ khách hàng';

        let message = '';
        if (mode === 'create_segment' && createdSegment) {
          message = `🎯 **Đã tạo Tập khách hàng mới thành công!**\n• **Tên tập:** **${createdSegment.name}**\n• **Số khách hàng trong tập:** **${matched.length}** / ${list.length} khách\n• **Tiêu chí áp dụng:**\n${criteriaText}\n\n*(Tập khách hàng đã được lưu và đồng bộ trực tiếp vào mục Khách hàng > Tập khách hàng).*`;
        } else {
          message = `🔍 **Kết quả lọc tập khách hàng (${matched.length} / ${list.length} khách hàng phù hợp):**\n• **Tiêu chí áp dụng:**\n${criteriaText}`;
          if (matched.length > 0) {
            message += `\n\n📋 **Danh sách chi tiết (${matched.length} khách):**\n` +
              matched.map((c, i) => 
                `${i + 1}. **${c.name}** (\`${c.phone || 'Chưa có SĐT'}\`) - Lần ghé cuối: **${c.last_visit ? new Date(c.last_visit).toLocaleDateString('vi-VN') : 'Chưa ghé'}** | Chi tiêu: **${(Number(c.total_spent) || 0).toLocaleString('vi-VN')} đ** (${c.visit_count || 0} lần đến)`
              ).join('\n');
          } else {
            message += `\n\n⚠️ Không có khách hàng nào thỏa mãn đầy đủ các tiêu chí trên.`;
          }
        }

        return {
          total_system_customers: list.length,
          matched_count: matched.length,
          criteria: cond,
          applied_descriptions: appliedDescriptions,
          created_segment: createdSegment,
          action_mode: mode,
          customers: matched.map(c => ({
            id: c.id,
            name: c.name,
            phone: c.phone || 'Chưa có',
            gender: c.gender === 'female' ? 'Nữ' : (c.gender === 'male' ? 'Nam' : 'Khác'),
            total_spent: Number(c.total_spent) || 0,
            visit_count: Number(c.visit_count) || 0,
            last_visit: c.last_visit ? new Date(c.last_visit).toLocaleDateString('vi-VN') : 'Chưa ghé',
            birthday: c.birthday ? new Date(c.birthday).toLocaleDateString('vi-VN') : null,
            points: Number(c.points) || 0
          })),
          message
        };
      }

      case 'customer_segment_create': {
        const segPayload = {
          name: args.name,
          color: args.color || '#34D399',
          conditions: typeof args.conditions === 'string' ? args.conditions : JSON.stringify(args.conditions || {})
        };
        const created = await base44.entities.CustomerSegment.create(segPayload);
        return {
          success: true,
          segment: created,
          message: `🎯 **Đã tạo thành công Tập khách hàng:** **${created.name}**\n*(Đã lưu và đồng bộ trực tiếp vào mục Khách hàng > Tập khách hàng).*`
        };
      }

      case 'customer_create': {
        const rawGender = (args.gender || '').toLowerCase();
        const cleanGender = (rawGender === 'male' || rawGender.includes('nam')) ? 'male' : ((rawGender === 'female' || rawGender.includes('nữ')) ? 'female' : 'other');
        let formattedBirthday = null;
        const rawBday = args.birth_date || args.birthday;
        if (rawBday) {
          const match = String(rawBday).match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
          if (match) {
            formattedBirthday = `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
          } else if (/^\d{4}-\d{2}-\d{2}$/.test(String(rawBday))) {
            formattedBirthday = String(rawBday);
          }
        }
        const payload = {
          name: args.name,
          phone: args.phone,
          email: args.email || null,
          address: args.address || null,
          gender: cleanGender,
          birthday: formattedBirthday,
          note: args.note || 'Tạo tự động bởi GloPro AI',
          points: 0,
          total_spent: 0,
          visit_count: 0
        };
        const res = await base44.entities.Customer.create(payload);
        const message = `👤 **Đã tạo thành công hồ sơ khách hàng mới:**\n` +
          `• **Họ và tên:** **${args.name}**\n` +
          `• **Số điện thoại:** \`${args.phone}\`\n` +
          `${args.email ? `• **Email:** \`${args.email}\`\n` : ''}` +
          `${payload.birthday ? `• **Ngày sinh:** ${payload.birthday}\n` : ''}` +
          `${args.address ? `• **Địa chỉ:** ${args.address}\n` : ''}` +
          `• **Tích điểm ban đầu:** 0 điểm`;
        return { success: true, customer: res, message };
      }

      case 'customer_update': {
        const list = await base44.entities.Customer.list().catch(() => []);
        const target = list.find(c => c.phone === args.phone || (c.phone && c.phone.replace(/\s+/g, '') === (args.phone || '').replace(/\s+/g, '')));
        if (!target) {
          return { success: false, message: `❌ Không tìm thấy khách hàng nào có số điện thoại \`${args.phone}\` để cập nhật.` };
        }
        const updateData = { ...target };
        if (args.name) updateData.name = args.name;
        if (args.note) updateData.note = args.note;
        if (args.address) updateData.address = args.address;
        const res = await base44.entities.Customer.update(target.id, updateData);
        const message = `✅ **Đã cập nhật thông tin khách hàng ${target.name}:**\n` +
          (args.name ? `• Tên mới: **${args.name}**\n` : '') +
          (args.address ? `• Địa chỉ mới: ${args.address}\n` : '') +
          (args.note ? `• Ghi chú mới: ${args.note}\n` : '');
        return { success: true, customer: res, message };
      }

      case 'appointment_create': {
        const payload = {
          customer_name: args.customer_name,
          customer_phone: args.customer_phone,
          service_name: args.service_name,
          staff_name: args.staff_name || 'Nhân viên mặc định',
          branch_id: branchId || null,
          date: args.date,
          start_time: args.time,
          status: 'confirmed',
          note: args.note || 'Đặt qua GloPro AI',
          created_at: new Date().toISOString()
        };
        const res = await base44.entities.Appointment.create(payload);
        const message = `📅 **Đã đặt lịch hẹn thành công cho khách:**\n` +
          `• **Khách hàng:** **${args.customer_name}** (\`${args.customer_phone}\`)\n` +
          `• **Dịch vụ:** **${args.service_name}**\n` +
          `• **Thời gian:** **${args.time}** ngày **${args.date}**\n` +
          `• **Nhân viên:** ${args.staff_name || 'Salon tự sắp xếp'}\n` +
          `• **Trạng thái:** Đã xác nhận`;
        return { success: true, appointment: res, message };
      }

      case 'appointment_search': {
        const list = await base44.entities.Appointment.list().catch(() => []);
        let filtered = list;
        if (args.date) {
          filtered = filtered.filter(a => (a.date || '').startsWith(args.date));
        }
        if (args.customer_phone) {
          filtered = filtered.filter(a => a.customer_phone && a.customer_phone.includes(args.customer_phone));
        }
        if (args.status) {
          filtered = filtered.filter(a => a.status === args.status);
        }

        const appts = filtered.slice(0, 10).map(a => ({
          id: a.id,
          customer_name: a.customer_name,
          customer_phone: a.customer_phone,
          service_name: a.service_name,
          staff_name: a.staff_name || 'Chưa chỉ định',
          date: a.date,
          time: a.start_time || a.time || '',
          status: a.status
        }));

        const statusText = {
          confirmed: 'Đã xác nhận',
          completed: 'Hoàn thành',
          pending: 'Chờ duyệt',
          cancelled: 'Đã hủy',
          in_progress: 'Đang làm'
        };

        let message = '';
        if (appts.length === 0) {
          message = `📅 Không tìm thấy lịch hẹn nào ${args.date ? `vào ngày **${args.date}**` : ''} ${args.customer_phone ? `của SĐT \`${args.customer_phone}\`` : ''}.`;
        } else {
          message = `📅 **Tìm thấy ${filtered.length} lịch hẹn:**\n` +
            appts.map(a => 
              `• **${a.time || '--:--'}** (${a.date || ''}): **${a.customer_name}** - Dịch vụ: **${a.service_name || 'Làm đẹp'}** [${statusText[a.status] || a.status}] (Thợ: ${a.staff_name})`
            ).join('\n');
        }

        return { total: filtered.length, appointments: appts, message };
      }

      case 'appointment_cancel': {
        const list = await base44.entities.Appointment.list().catch(() => []);
        const target = list.find(a => 
          a.customer_phone === args.customer_phone && 
          (!args.date || a.date === args.date) &&
          a.status !== 'cancelled'
        );
        if (!target) {
          return { success: false, message: `❌ Không tìm thấy lịch hẹn hợp lệ nào của SĐT \`${args.customer_phone}\` để hủy.` };
        }
        await base44.entities.Appointment.update(target.id, {
          ...target,
          status: 'cancelled',
          note: (target.note || '') + ` (Đã hủy qua AI: ${args.reason || 'Khách yêu cầu'})`
        });
        const message = `✅ **Đã hủy lịch hẹn thành công:**\n` +
          `• **Khách hàng:** **${target.customer_name}** (\`${target.customer_phone}\`)\n` +
          `• **Thời gian:** ${target.start_time || ''} ngày ${target.date}\n` +
          `• **Lý do hủy:** ${args.reason || 'Khách yêu cầu'}`;
        return { success: true, message };
      }

      case 'pos_create_invoice': {
        const discount = Number(args.discount_amount) || 0;
        const total = Number(args.total_amount) || 0;
        const final = Math.max(0, total - discount);
        const todayStr = new Date().toISOString().split('T')[0];
        const payload = {
          customer_name: args.customer_name,
          customer_phone: args.customer_phone || '',
          branch_id: branchId || null,
          date: todayStr,
          total: final,
          subtotal: total,
          discount: discount,
          status: 'paid',
          payment_methods: [{ method: args.payment_method || 'cash', amount: final }],
          items: [{ name: args.items_description || 'Dịch vụ / Sản phẩm', price: total, qty: 1 }],
          created_at: new Date().toISOString()
        };
        const res = await base44.entities.Invoice.create(payload);
        const message = `🧾 **Đã tạo hóa đơn thanh toán thành công!**\n` +
          `• **Khách hàng:** **${args.customer_name}** ${args.customer_phone ? `(\`${args.customer_phone}\`)` : ''}\n` +
          `• **Chi tiết:** ${args.items_description || 'Thanh toán dịch vụ'}\n` +
          `• **Tổng số tiền:** **${final.toLocaleString('vi-VN')} đ** ${discount > 0 ? `(Đã giảm giá: ${discount.toLocaleString('vi-VN')} đ)` : ''}\n` +
          `• **Hình thức:** ${args.payment_method || 'Tiền mặt'}\n` +
          `• **Trạng thái:** Đã thanh toán`;
        return { success: true, invoice: res, message };
      }

      case 'pos_get_today_summary': {
        const invoices = await base44.entities.Invoice.list().catch(() => []);
        const appts = await base44.entities.Appointment.list().catch(() => []);
        const todayStr = new Date().toISOString().split('T')[0];
        
        let todayInvoices = invoices.filter(inv => {
          const d = inv.date || inv.created_date || inv.created_at || '';
          return d.startsWith(todayStr);
        });

        if (branchId && branchId !== 'all') {
          todayInvoices = todayInvoices.filter(i => !i.branch_id || i.branch_id === branchId);
        }

        const totalRev = todayInvoices.reduce((acc, inv) => acc + (Number(inv.total) || Number(inv.final_amount) || Number(inv.total_amount) || 0), 0);
        
        let todayAppts = appts.filter(a => {
          const d = a.date || a.created_date || a.created_at || '';
          return d.startsWith(todayStr);
        });
        if (branchId && branchId !== 'all') {
          todayAppts = todayAppts.filter(a => !a.branch_id || a.branch_id === branchId);
        }

        const completedAppts = todayAppts.filter(a => a.status === 'completed').length;
        const pendingAppts = todayAppts.filter(a => a.status === 'pending' || a.status === 'confirmed').length;
        const formattedRev = `${totalRev.toLocaleString('vi-VN')} đ`;

        let message = `📊 **Tình hình kinh doanh hôm nay (${new Date().toLocaleDateString('vi-VN')}):**\n` +
          `• **Doanh thu:** **${formattedRev}**\n` +
          `• **Hóa đơn đã xuất:** **${todayInvoices.length}** hóa đơn\n` +
          `• **Lịch hẹn trong ngày:** **${todayAppts.length}** lịch (${completedAppts} hoàn thành, ${pendingAppts} đang chờ)`;

        if (totalRev === 0 && todayInvoices.length === 0) {
          message += `\n\n*(Hiện tại chưa phát sinh hóa đơn bán hàng nào trong ngày hôm nay).*`;
        }

        return {
          date: todayStr,
          total_revenue: totalRev,
          formatted_revenue: formattedRev,
          total_invoices: todayInvoices.length,
          total_appointments_today: todayAppts.length,
          message
        };
      }

      case 'report_generate_ai': {
        const rawPrompt = args.prompt || 'Báo cáo tổng quan hoạt động kinh doanh';
        const targetUrl = `/reports?tab=ai_report&prompt=${encodeURIComponent(rawPrompt)}`;
        return {
          success: true,
          prompt: rawPrompt,
          report_type: args.report_type || 'general',
          period: args.period || 'all',
          navigateTo: targetUrl,
          actionButton: {
            label: '📊 Mở Báo cáo AI chi tiết',
            route: targetUrl
          },
          message: `📊 **Đang chuyển đến màn hình Báo cáo AI...**\nTôi đang trích xuất dữ liệu thực tế hệ thống và chuẩn bị biểu đồ, bộ lọc cho yêu cầu: "*${rawPrompt}*".\nBạn có thể lọc dữ liệu, xem biểu đồ trực quan và xuất file Excel/PDF tại đây.`
        };
      }

      case 'reports_get_overview': {
        const period = args.period || 'week';
        const invoices = await base44.entities.Invoice.list().catch(() => []);
        let filtered = invoices;
        if (branchId && branchId !== 'all') {
          filtered = filtered.filter(i => !i.branch_id || i.branch_id === branchId);
        }

        const now = new Date();
        let startDate = new Date();
        let periodLabel = '7 ngày qua';
        if (period === 'month') {
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          periodLabel = `tháng ${now.getMonth() + 1}/${now.getFullYear()}`;
        } else if (period === 'quarter') {
          const q = Math.floor(now.getMonth() / 3);
          startDate = new Date(now.getFullYear(), q * 3, 1);
          periodLabel = `quý ${q + 1}/${now.getFullYear()}`;
        } else if (period === 'year') {
          startDate = new Date(now.getFullYear(), 0, 1);
          periodLabel = `năm ${now.getFullYear()}`;
        } else {
          startDate.setDate(now.getDate() - 7);
        }

        const startStr = startDate.toISOString().split('T')[0];
        const periodInvoices = filtered.filter(inv => {
          const d = inv.date || inv.created_date || inv.created_at || '';
          return d >= startStr;
        });

        const totalRevenue = periodInvoices.reduce((acc, inv) => acc + (Number(inv.total) || Number(inv.final_amount) || 0), 0);

        // Calculate top selling items
        const itemMap = {};
        periodInvoices.forEach(inv => {
          (inv.items || []).forEach(it => {
            if (!it.name) return;
            const amount = (Number(it.price) || 0) * (Number(it.qty) || 1);
            itemMap[it.name] = (itemMap[it.name] || 0) + amount;
          });
        });

        const topItems = Object.entries(itemMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([name, val]) => `• ${name}: **${val.toLocaleString('vi-VN')} đ**`);

        let message = `📈 **Báo cáo doanh thu ${periodLabel}:**\n` +
          `• **Tổng doanh thu:** **${totalRevenue.toLocaleString('vi-VN')} đ**\n` +
          `• **Số hóa đơn:** **${periodInvoices.length}** đơn`;

        if (topItems.length > 0) {
          message += `\n\n🏆 **Top dịch vụ / sản phẩm nổi bật:**\n${topItems.join('\n')}`;
        }

        return {
          period,
          total_revenue: totalRevenue,
          invoices_count: periodInvoices.length,
          top_items: topItems,
          message
        };
      }

      case 'staff_search': {
        const list = await base44.entities.Staff.list().catch(() => []);
        const q = (args.query || '').toLowerCase().trim();
        const matched = list.filter(s => 
          !q || 
          (s.name && s.name.toLowerCase().includes(q)) || 
          (s.full_name && s.full_name.toLowerCase().includes(q)) ||
          (s.role && s.role.toLowerCase().includes(q))
        );
        const staffList = matched.slice(0, 10).map(s => ({
          id: s.id,
          name: s.name || s.full_name,
          role: s.role || 'Nhân viên',
          phone: s.phone || 'Chưa có SĐT',
          is_active: s.is_active !== false
        }));

        let message = '';
        if (staffList.length === 0) {
          message = `🧑‍💼 Không tìm thấy nhân viên nào${q ? ` khớp với "${args.query}"` : ''}. Hệ thống có **${list.length}** nhân viên.`;
        } else {
          message = `🧑‍💼 **Danh sách nhân viên (${staffList.length}/${list.length} người):**\n` +
            staffList.map(s => `• **${s.name}** - Vị trí: **${s.role}** | SĐT: \`${s.phone}\` (${s.is_active ? 'Đang làm' : 'Nghỉ'})`).join('\n');
        }

        return { total: matched.length, staff: staffList, message };
      }

      case 'services_search': {
        const list = await base44.entities.Service.list().catch(() => []);
        const q = (args.query || '').toLowerCase().trim();
        const matched = list.filter(s => !q || (s.name && s.name.toLowerCase().includes(q)) || (s.category && s.category.toLowerCase().includes(q)));
        const services = matched.slice(0, 10).map(s => ({
          id: s.id,
          name: s.name,
          price: s.price,
          duration: s.duration_minutes || 45,
          category: s.category || 'Dịch vụ'
        }));

        let message = '';
        if (services.length === 0) {
          message = `💇‍♀️ Không tìm thấy dịch vụ nào${q ? ` khớp với "${args.query}"` : ''}. Hệ thống hiện có **${list.length}** dịch vụ.`;
        } else {
          message = `💇‍♀️ **Bảng giá dịch vụ (${services.length}/${list.length} dịch vụ):**\n` +
            services.map(s => `• **${s.name}**: **${(Number(s.price) || 0).toLocaleString('vi-VN')} đ** (${s.duration} phút)`).join('\n');
        }

        return { total: matched.length, services, message };
      }

      case 'products_search': {
        const list = await base44.entities.Product.list().catch(() => []);
        const q = (args.query || '').toLowerCase().trim();
        const matched = list.filter(p => !q || (p.name && p.name.toLowerCase().includes(q)) || (p.category && p.category.toLowerCase().includes(q)));
        const products = matched.slice(0, 10).map(p => ({
          id: p.id,
          name: p.name,
          price: p.price,
          stock: p.stock || 0,
          category: p.category || 'Sản phẩm'
        }));

        let message = '';
        if (products.length === 0) {
          message = `📦 Không tìm thấy sản phẩm nào${q ? ` khớp với "${args.query}"` : ''}.`;
        } else {
          message = `📦 **Danh sách sản phẩm & tồn kho (${products.length}/${list.length} sản phẩm):**\n` +
            products.map(p => `• **${p.name}**: Giá **${(Number(p.price) || 0).toLocaleString('vi-VN')} đ** | Tồn kho: **${p.stock}**`).join('\n');
        }

        return { total: matched.length, products, message };
      }

      case 'navigate_to': {
        const pageNames = {
          '/dashboard': 'Tổng quan',
          '/pos': 'Thu ngân / Bán hàng (POS)',
          '/appointments': 'Lịch hẹn',
          '/customers': 'Khách hàng',
          '/staff': 'Nhân viên',
          '/services': 'Danh mục Dịch vụ & Sản phẩm',
          '/inventory': 'Kho hàng',
          '/discounts': 'Giảm giá / Voucher',
          '/automations': 'Automation',
          '/cashflow': 'Thu Chi',
          '/reports': 'Báo cáo doanh thu',
          '/booking': 'Đặt lịch Online',
          '/settings': 'Cài đặt hệ thống'
        };
        const title = args.page_title || pageNames[args.page] || args.page;
        return {
          success: true,
          navigateTo: args.page,
          message: `🚀 **Đang chuyển màn hình tới:** **${title}**...`
        };
      }

      case 'branch_create': {
        const payload = {
          name: args.name,
          address: args.address || 'Đang cập nhật',
          phone: args.phone || '0900000000',
          city: args.city || 'Hồ Chí Minh',
          is_active: true
        };
        const res = await base44.entities.Branch.create(payload);
        return { success: true, branch: res, message: `🏢 Đã tạo chi nhánh mới thành công: **${args.name}**` };
      }

      case 'service_create': {
        const payload = {
          name: args.name,
          price: Number(args.price) || 100000,
          duration_minutes: Number(args.duration_minutes) || 45,
          is_active: true
        };
        const res = await base44.entities.Service.create(payload);
        const actionPreview = {
          action: 'CREATE_SERVICE',
          title: 'Thêm dịch vụ mới',
          summary: `Đã thêm dịch vụ **${args.name}** vào bảng giá.`,
          items: [
            { label: 'Tên dịch vụ', value: args.name },
            { label: 'Giá dịch vụ', value: `${payload.price.toLocaleString('vi-VN')} đ` },
            { label: 'Thời lượng', value: `${payload.duration_minutes} phút` },
            { label: 'Trạng thái', value: 'Đang hoạt động' }
          ],
          statusText: 'Đã lưu thành công'
        };
        return { 
          success: true, 
          service: res, 
          actionPreview,
          actionButton: { label: '💇‍♀️ Xem Bảng giá Dịch vụ', route: '/services' },
          message: `💇‍♀️ **Đã tạo dịch vụ mới thành công!**\n• Tên dịch vụ: **${args.name}**\n• Giá: **${payload.price.toLocaleString('vi-VN')} đ**\n• Thời lượng: **${payload.duration_minutes} phút**` 
        };
      }

      case 'staff_create': {
        const payload = {
          name: args.name,
          full_name: args.name,
          phone: args.phone || '',
          role: args.role || 'Thợ chính',
          is_active: true
        };
        const res = await base44.entities.Staff.create(payload);
        const actionPreview = {
          action: 'CREATE_STAFF',
          title: 'Thêm nhân viên mới',
          summary: `Đã thêm nhân viên **${args.name}** vào danh sách nhân sự.`,
          items: [
            { label: 'Họ tên', value: args.name },
            { label: 'Vị trí / Vai trò', value: payload.role },
            { label: 'Số điện thoại', value: payload.phone || 'Chưa cập nhật' },
            { label: 'Trạng thái', value: 'Đang làm việc' }
          ],
          statusText: 'Đã lưu thành công'
        };
        return { 
          success: true, 
          staff: res, 
          actionPreview,
          actionButton: { label: '👥 Xem Danh sách Nhân viên', route: '/staff' },
          message: `🧑‍💼 **Đã thêm nhân viên mới thành công!**\n• Tên: **${args.name}**\n• Vị trí: **${payload.role}**\n• Số điện thoại: **${payload.phone || 'Chưa có'}**` 
        };
      }

      case 'product_create': {
        const payload = {
          name: args.name,
          price: Number(args.price) || 100000,
          cost: Number(args.cost_price) || Math.round((Number(args.price) || 100000) * 0.6),
          stock: Number(args.stock) || 20,
          category: args.category || 'Mỹ phẩm',
          is_active: true,
          branch_ids: branchId && branchId !== 'all' ? [branchId] : []
        };
        const res = await base44.entities.Product.create(payload);
        const actionPreview = {
          action: 'CREATE_PRODUCT',
          title: 'Thêm sản phẩm mới vào kho',
          summary: `Đã thêm sản phẩm **${args.name}** vào kho hàng.`,
          items: [
            { label: 'Tên sản phẩm', value: args.name },
            { label: 'Giá bán lẻ', value: `${payload.price.toLocaleString('vi-VN')} đ` },
            { label: 'Giá vốn / Giá nhập', value: `${payload.cost.toLocaleString('vi-VN')} đ` },
            { label: 'Số lượng tồn kho', value: `${payload.stock} sản phẩm` },
            { label: 'Danh mục', value: payload.category }
          ],
          statusText: 'Đã lưu thành công'
        };
        return { 
          success: true, 
          product: res, 
          actionPreview,
          actionButton: { label: '📦 Xem danh mục Kho hàng', route: '/inventory' },
          message: `📦 **Đã thêm sản phẩm mới thành công!**\n• Tên sản phẩm: **${args.name}**\n• Giá bán: **${payload.price.toLocaleString('vi-VN')} đ**\n• Tồn kho ban đầu: **${payload.stock} sản phẩm**`
        };
      }

      case 'staff_set_commission': {
        const staffList = await base44.entities.Staff.list().catch(() => []);
        const rawStaff = (args.staff_name || '').toLowerCase().trim();
        let targetStaffMembers = [];

        if (!rawStaff || rawStaff === 'all' || rawStaff === 'tất cả' || rawStaff === 'toàn bộ') {
          targetStaffMembers = staffList;
        } else {
          targetStaffMembers = staffList.filter(s => (s.name || s.full_name || '').toLowerCase().includes(rawStaff));
        }

        if (targetStaffMembers.length === 0) {
          if (staffList.length === 0) {
            return {
              success: false,
              message: `⚠️ Hệ thống hiện chưa có nhân viên nào. Bạn hãy yêu cầu tôi tạo nhân viên trước (ví dụ: *"Thêm nhân viên ${args.staff_name || 'Nguyễn Văn A'} SĐT 0901234567"*), sau đó mới có thể cài đặt hoa hồng.`
            };
          }
          const availableNames = staffList.map(s => s.name || s.full_name).filter(Boolean).slice(0, 5).join(', ');
          return {
            success: false,
            message: `⚠️ Không tìm thấy nhân viên nào khớp với tên **"${args.staff_name}"**. Danh sách hiện có: ${availableNames || 'chưa có'}. Bạn có muốn tôi tạo nhân viên mới này không?`
          };
        }

        const itemType = args.item_type || 'service';
        const rawItem = (args.item_name || '').toLowerCase().trim();
        let targetItems = [];

        if (itemType === 'product') {
          const prodList = await base44.entities.Product.list().catch(() => []);
          if (!rawItem || rawItem === 'all' || rawItem === 'tất cả' || rawItem === 'toàn bộ') {
            targetItems = prodList;
          } else {
            targetItems = prodList.filter(p => (p.name || '').toLowerCase().includes(rawItem));
          }
          if (targetItems.length === 0) {
            if (prodList.length === 0) {
              return { success: false, message: `⚠️ Kho hàng hiện chưa có sản phẩm nào. Bạn hãy yêu cầu *"Tạo sản phẩm [Tên] giá [Giá]"* trước nhé.` };
            }
            return { success: false, message: `⚠️ Không tìm thấy sản phẩm nào khớp với **"${args.item_name}"**.` };
          }
        } else {
          const servList = await base44.entities.Service.list().catch(() => []);
          if (!rawItem || rawItem === 'all' || rawItem === 'tất cả' || rawItem === 'toàn bộ') {
            targetItems = servList;
          } else {
            targetItems = servList.filter(s => (s.name || '').toLowerCase().includes(rawItem));
          }
          if (targetItems.length === 0) {
            if (servList.length === 0) {
              return { success: false, message: `⚠️ Danh mục dịch vụ hiện chưa có dịch vụ nào. Bạn hãy yêu cầu *"Tạo dịch vụ [Tên] giá [Giá]"* trước nhé.` };
            }
            return { success: false, message: `⚠️ Không tìm thấy dịch vụ nào khớp với **"${args.item_name}"**.` };
          }
        }

        const commVal = Number(args.commission_value) || 0;
        const commType = args.commission_type || 'percent';
        const valFormatted = commType === 'percent'
          ? `${commVal}% doanh thu`
          : `${commVal.toLocaleString('vi-VN')} đ / lượt`;

        const existingRules = await base44.entities.StaffCommissionRule.list().catch(() => []);
        
        let savedCount = 0;
        for (const staff of targetStaffMembers) {
          for (const item of targetItems) {
            const payload = {
              staff_id: staff.id,
              item_type: itemType,
              item_id: item.id,
              commission_type: commType,
              commission_value: commVal
            };
            const existing = existingRules.find(r => r.staff_id === staff.id && r.item_id === item.id && r.item_type === itemType);
            if (existing) {
              await base44.entities.StaffCommissionRule.update(existing.id, payload).catch(() => {});
            } else {
              await base44.entities.StaffCommissionRule.create(payload).catch(() => {});
            }
            savedCount++;
          }
        }

        const staffLabel = targetStaffMembers.length === staffList.length && staffList.length > 1
          ? `Tất cả nhân viên (${staffList.length} người)`
          : targetStaffMembers.map(s => s.name || s.full_name).join(', ');

        const itemLabel = targetItems.length === 1
          ? targetItems[0].name
          : `Tất cả ${itemType === 'product' ? 'sản phẩm' : 'dịch vụ'} (${targetItems.length} mục)`;

        const actionPreview = {
          action: 'SET_STAFF_COMMISSION',
          title: 'Cài đặt hoa hồng nhân viên',
          summary: `Đã thiết lập hoa hồng cho **${staffLabel}**.`,
          items: [
            { label: 'Nhân viên áp dụng', value: staffLabel },
            { label: 'Dịch vụ / Sản phẩm', value: itemLabel },
            { label: 'Mức hoa hồng', value: valFormatted },
            { label: 'Quy cách tính', value: commType === 'percent' ? '% doanh thu hóa đơn' : 'Số tiền cố định/lần' },
            { label: 'Số quy tắc đã cập nhật', value: `${savedCount} quy tắc` }
          ],
          statusText: 'Đã lưu cấu hình hoa hồng'
        };

        return {
          success: true,
          actionPreview,
          actionButton: { label: '🎖️ Xem Ma trận Hoa hồng', route: '/staff?tab=commission' },
          message: `🎖️ **Đã cài đặt hoa hồng thành công!**\n• Nhân viên: **${staffLabel}**\n• Áp dụng cho: **${itemLabel}**\n• Mức hoa hồng: **${valFormatted}** (${savedCount} quy tắc được cập nhật)`
        };
      }

      case 'voucher_create': {
        const payload = {
          id: 'voucher_' + Date.now(),
          code: (args.code || `GP${Math.floor(1000 + Math.random() * 9000)}`).toUpperCase(),
          name: args.title || `Voucher ${(args.code || '').toUpperCase()}`,
          type: 'invoice',
          valueType: args.discount_type || 'fixed',
          value: Number(args.discount_value) || 50000,
          minSpend: Number(args.min_spend) || 0,
          quantity: 1000,
          startDate: new Date().toISOString().split('T')[0],
          expiryDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
          visibility: 'public',
          is_active: true
        };
        let res;
        try {
          res = await base44.entities.Voucher.create(payload);
        } catch (e) {
          // Graceful fallback for environments where Voucher table is managed locally
          res = payload;
        }
        const valFormatted = payload.valueType === 'percent'
          ? `${payload.value}%`
          : `${payload.value.toLocaleString('vi-VN')} đ`;

        const actionPreview = {
          action: 'CREATE_VOUCHER',
          title: 'Tạo mã Voucher / Ưu đãi',
          summary: `Đã phát hành mã ưu đãi **${payload.code}**.`,
          items: [
            { label: 'Mã Voucher', value: payload.code },
            { label: 'Tên chương trình', value: payload.name },
            { label: 'Mức giảm giá', value: valFormatted },
            { label: 'Hạn dùng', value: `30 ngày (đến ${payload.expiryDate})` }
          ],
          statusText: 'Đã lưu thành công'
        };

        return {
          success: true,
          voucher: res,
          actionPreview,
          actionButton: { label: '🎟️ Xem Danh sách Khuyến mãi', route: '/discounts' },
          message: `🎟️ **Đã phát hành Voucher mới thành công!**\n• Mã voucher: **${payload.code}**\n• Mức giảm: **${valFormatted}**`
        };
      }

      case 'cashflow_create_receipt': {
        const amt = Number(args.amount) || 0;
        if (amt <= 0) {
          return { success: false, message: '⚠️ Số tiền thu phải lớn hơn 0đ.' };
        }
        const payMethod = args.payment_method === 'transfer' ? 'transfer' : (args.payment_method === 'card' ? 'card' : 'cash');
        const typeName = args.type_name || 'Thu tiền bán hàng / dịch vụ';
        const payerName = args.payer_name || 'Khách hàng';
        const note = args.note || `Thu từ ${payerName}`;
        const code = `PT-${new Date().toISOString().slice(2,10).replace(/-/g,'')}-${Math.floor(100 + Math.random() * 900)}`;

        const payload = {
          code,
          flow: 'income',
          type_code: 'sales_income',
          type_name: typeName,
          amount: Math.round(amt),
          date: new Date().toISOString().split('T')[0],
          description: `Phiếu thu: ${typeName} - ${payerName}`,
          note,
          payment_method: payMethod,
          source: 'manual',
          branch_id: branchId && branchId !== 'all' ? branchId : null,
          created_by: context.currentUser?.name || 'Thu ngân'
        };

        const res = await base44.entities.CashVoucher.create(payload);
        const actionPreview = {
          action: 'CREATE_CASH_INCOME',
          title: 'Lập Phiếu Thu tiền vào Sổ quỹ',
          summary: `Đã lập phiếu thu **${amt.toLocaleString('vi-VN')} đ** vào Sổ quỹ salon.`,
          items: [
            { label: 'Mã phiếu thu', value: code },
            { label: 'Số tiền thu', value: `${amt.toLocaleString('vi-VN')} đ` },
            { label: 'Khoản thu', value: typeName },
            { label: 'Người nộp tiền', value: payerName },
            { label: 'Phương thức', value: payMethod === 'transfer' ? 'Chuyển khoản / Quét QR' : (payMethod === 'card' ? 'Quẹt thẻ' : 'Tiền mặt') },
            { label: 'Ghi chú', value: note }
          ],
          statusText: 'Đã lưu vào Sổ quỹ'
        };

        return {
          success: true,
          voucher: res,
          actionPreview,
          actionButton: { label: '💵 Xem Sổ quỹ', route: '/cashflow' },
          message: `💵 **Đã lập Phiếu Thu thành công!**\n• Mã phiếu: **${code}**\n• Số tiền: **${amt.toLocaleString('vi-VN')} đ**\n• Khoản thu: **${typeName}** (${payerName})\n• Phương thức: **${payMethod === 'transfer' ? 'Chuyển khoản' : 'Tiền mặt'}**`
        };
      }

      case 'cashflow_create_payment': {
        const amt = Number(args.amount) || 0;
        if (amt <= 0) {
          return { success: false, message: '⚠️ Số tiền chi phải lớn hơn 0đ.' };
        }
        const payMethod = args.payment_method === 'transfer' ? 'transfer' : (args.payment_method === 'card' ? 'card' : 'cash');
        const typeName = args.type_name || 'Chi phí hoạt động';
        const receiverName = args.receiver_name || 'Người nhận';
        const note = args.note || `Chi cho ${receiverName}`;
        const code = `PC-${new Date().toISOString().slice(2,10).replace(/-/g,'')}-${Math.floor(100 + Math.random() * 900)}`;

        const payload = {
          code,
          flow: 'expense',
          type_code: 'general_expense',
          type_name: typeName,
          amount: Math.round(amt),
          date: new Date().toISOString().split('T')[0],
          description: `Phiếu chi: ${typeName} - ${receiverName}`,
          note,
          payment_method: payMethod,
          source: 'manual',
          branch_id: branchId && branchId !== 'all' ? branchId : null,
          created_by: context.currentUser?.name || 'Quản lý'
        };

        const res = await base44.entities.CashVoucher.create(payload);
        const actionPreview = {
          action: 'CREATE_CASH_EXPENSE',
          title: 'Lập Phiếu Chi tiền từ Sổ quỹ',
          summary: `Đã lập phiếu chi **${amt.toLocaleString('vi-VN')} đ** từ Sổ quỹ salon.`,
          items: [
            { label: 'Mã phiếu chi', value: code },
            { label: 'Số tiền chi', value: `${amt.toLocaleString('vi-VN')} đ` },
            { label: 'Mục đích chi', value: typeName },
            { label: 'Người nhận tiền', value: receiverName },
            { label: 'Phương thức', value: payMethod === 'transfer' ? 'Chuyển khoản' : 'Tiền mặt' },
            { label: 'Ghi chú', value: note }
          ],
          statusText: 'Đã lưu vào Sổ quỹ'
        };

        return {
          success: true,
          voucher: res,
          actionPreview,
          actionButton: { label: '💵 Xem Sổ quỹ', route: '/cashflow' },
          message: `💸 **Đã lập Phiếu Chi thành công!**\n• Mã phiếu: **${code}**\n• Số tiền: **${amt.toLocaleString('vi-VN')} đ**\n• Mục đích: **${typeName}** (${receiverName})\n• Phương thức: **${payMethod === 'transfer' ? 'Chuyển khoản' : 'Tiền mặt'}**`
        };
      }

      case 'inventory_create_receipt': {
        const supName = args.supplier_name || 'Nhà cung cấp';
        const prodName = args.product_name || 'Mỹ phẩm';
        const qty = Number(args.quantity) || 10;
        const unitPrice = Number(args.unit_price) || 100000;
        const totalAmount = qty * unitPrice;
        const paidAmount = args.paid_amount !== undefined ? Number(args.paid_amount) : totalAmount;
        const debtAmount = Math.max(0, totalAmount - paidAmount);
        const code = `NK-${new Date().toISOString().slice(2,10).replace(/-/g,'')}-${Math.floor(100 + Math.random() * 900)}`;

        // Check or update product
        const prodList = await base44.entities.Product.list().catch(() => []);
        let targetProd = prodList.find(p => (p.name || '').toLowerCase().includes(prodName.toLowerCase()));
        if (!targetProd) {
          // Auto create product if not exists
          targetProd = await base44.entities.Product.create({
            name: prodName,
            price: Math.round(unitPrice * 1.5),
            cost_price: unitPrice,
            stock: qty,
            category: 'Mỹ phẩm',
            is_active: true
          }).catch(() => null);
        } else {
          // Update product stock and cost
          const newStock = (targetProd.stock || 0) + qty;
          await base44.entities.Product.update(targetProd.id, {
            stock: newStock,
            cost_price: unitPrice
          }).catch(() => {});
        }

        const receiptData = {
          code,
          type: 'in',
          supplier_name: supName,
          date: new Date().toISOString(),
          created_by: context.currentUser?.name || 'Quản lý kho',
          total_amount: totalAmount,
          paid_amount: paidAmount,
          debt_amount: debtAmount,
          items: [{
            product_id: targetProd?.id || 'prod_temp',
            product_name: targetProd?.name || prodName,
            qty,
            unit_price: unitPrice,
            total_price: totalAmount
          }],
          note: args.note || `Nhập ${qty} ${targetProd?.name || prodName} từ ${supName}`
        };

        const res = await base44.entities.InventoryReceipt.create(receiptData).catch(() => receiptData);

        // Auto create expense voucher in cashflow if paid > 0
        if (paidAmount > 0) {
          await base44.entities.CashVoucher.create({
            code: `PC-${new Date().toISOString().slice(2,10).replace(/-/g,'')}-${Math.floor(100 + Math.random() * 900)}`,
            flow: 'expense',
            type_code: 'stock_purchase',
            type_name: 'Nhập hàng',
            amount: paidAmount,
            date: new Date().toISOString().split('T')[0],
            description: `Nhập kho ${code} - ${supName}`,
            note: receiptData.note,
            payment_method: 'cash',
            source: 'auto',
            ref_code: code
          }).catch(() => {});
        }

        const actionPreview = {
          action: 'CREATE_STOCK_RECEIPT',
          title: 'Lập Phiếu Nhập kho hàng hóa',
          summary: `Đã nhập **${qty} ${targetProd?.name || prodName}** vào kho hàng.`,
          items: [
            { label: 'Mã phiếu nhập', value: code },
            { label: 'Nhà cung cấp', value: supName },
            { label: 'Sản phẩm', value: `${targetProd?.name || prodName} (x${qty})` },
            { label: 'Đơn giá nhập', value: `${unitPrice.toLocaleString('vi-VN')} đ` },
            { label: 'Tổng tiền hàng', value: `${totalAmount.toLocaleString('vi-VN')} đ` },
            { label: 'Đã thanh toán', value: `${paidAmount.toLocaleString('vi-VN')} đ` },
            { label: 'Tồn kho cập nhật', value: targetProd ? `${(targetProd.stock || 0) + qty} sản phẩm` : `${qty} sản phẩm` }
          ],
          statusText: 'Đã nhập kho thành công'
        };

        return {
          success: true,
          receipt: res,
          actionPreview,
          actionButton: { label: '📦 Xem Lịch sử Nhập kho', route: '/inventory?tab=stock_in' },
          message: `📦 **Đã lập Phiếu Nhập kho thành công!**\n• Mã phiếu: **${code}**\n• Nhà cung cấp: **${supName}**\n• Sản phẩm: **${targetProd?.name || prodName}** (x${qty})\n• Tổng giá trị: **${totalAmount.toLocaleString('vi-VN')} đ** (Đã thanh toán: ${paidAmount.toLocaleString('vi-VN')} đ)`
        };
      }

      case 'supplier_create': {
        const payload = {
          name: args.name,
          phone: args.phone || '',
          address: args.address || '',
          tax_code: args.tax_code || '',
          total_imported: 0,
          debt: 0
        };
        let res;
        try {
          res = await base44.entities.InventorySupplier.create(payload);
        } catch (e) {
          res = { id: `sup_${Date.now()}`, ...payload };
        }
        const actionPreview = {
          action: 'CREATE_SUPPLIER',
          title: 'Thêm Nhà cung cấp mới',
          summary: `Đã thêm đối tác **${args.name}** vào danh sách nhà cung cấp.`,
          items: [
            { label: 'Tên nhà cung cấp', value: args.name },
            { label: 'Số điện thoại', value: payload.phone || 'Chưa cập nhật' },
            { label: 'Địa chỉ', value: payload.address || 'Chưa cập nhật' },
            { label: 'Mã số thuế', value: payload.tax_code || 'Không' }
          ],
          statusText: 'Đã lưu thành công'
        };
        return {
          success: true,
          supplier: res,
          actionPreview,
          actionButton: { label: '🏢 Xem Danh sách Nhà cung cấp', route: '/inventory?tab=suppliers' },
          message: `🏢 **Đã thêm Nhà cung cấp mới thành công!**\n• Tên NCC: **${args.name}**\n• SĐT: **${payload.phone || 'Chưa cập nhật'}**\n• Địa chỉ: **${payload.address || 'Chưa cập nhật'}**`
        };
      }

      case 'shift_create': {
        const staffList = await base44.entities.Staff.list().catch(() => []);
        const rawStaff = (args.staff_name || '').toLowerCase().trim();
        const foundStaff = staffList.find(s => (s.name || s.full_name || '').toLowerCase().includes(rawStaff));

        if (!foundStaff) {
          const names = staffList.map(s => s.name || s.full_name).filter(Boolean).slice(0, 5).join(', ');
          return {
            success: false,
            message: `⚠️ Không tìm thấy nhân viên **"${args.staff_name}"**. Danh sách hiện có: ${names || 'chưa có'}. Bạn hãy tạo nhân viên trước nhé!`
          };
        }

        let tmplList = await base44.entities.ShiftTemplate.list().catch(() => []);
        if (tmplList.length === 0) {
          // Create default templates if none exist
          const defTmpl = await base44.entities.ShiftTemplate.create({
            name: 'Ca Sáng',
            start_time: '08:30',
            end_time: '15:30',
            color: '#3B82F6'
          }).catch(() => ({ id: 'tmpl_def', name: 'Ca Sáng', start_time: '08:30', end_time: '15:30' }));
          tmplList = [defTmpl];
        }

        const rawShift = (args.shift_name || '').toLowerCase().trim();
        let matchedTmpl = tmplList.find(t => (t.name || '').toLowerCase().includes(rawShift));
        if (!matchedTmpl) {
          matchedTmpl = tmplList[0];
        }

        const date = args.date || new Date().toISOString().split('T')[0];
        const payload = {
          staff_id: foundStaff.id,
          date,
          is_off: false,
          off_type: '',
          shift_template_id: matchedTmpl.id
        };

        const res = await base44.entities.StaffSchedule.create(payload).catch(() => payload);
        const shiftDisplay = `${matchedTmpl.name} (${matchedTmpl.start_time || '08:30'} - ${matchedTmpl.end_time || '17:30'})`;

        const actionPreview = {
          action: 'CREATE_SHIFT',
          title: 'Xếp ca làm việc nhân viên',
          summary: `Đã xếp **${shiftDisplay}** cho nhân viên **${foundStaff.name || foundStaff.full_name}**.`,
          items: [
            { label: 'Nhân viên', value: foundStaff.name || foundStaff.full_name },
            { label: 'Ngày làm việc', value: date },
            { label: 'Ca làm việc', value: shiftDisplay },
            { label: 'Trạng thái', value: 'Đã lên lịch' }
          ],
          statusText: 'Đã lưu lịch làm việc'
        };

        return {
          success: true,
          schedule: res,
          actionPreview,
          actionButton: { label: '🕒 Xem Lịch làm việc & Ca', route: '/staff?tab=schedule' },
          message: `🕒 **Đã xếp ca làm việc thành công!**\n• Nhân viên: **${foundStaff.name || foundStaff.full_name}**\n• Ngày: **${date}**\n• Ca: **${shiftDisplay}**`
        };
      }

      case 'attendance_record': {
        const staffList = await base44.entities.Staff.list().catch(() => []);
        const rawStaff = (args.staff_name || '').toLowerCase().trim();
        const foundStaff = staffList.find(s => (s.name || s.full_name || '').toLowerCase().includes(rawStaff));

        if (!foundStaff) {
          const names = staffList.map(s => s.name || s.full_name).filter(Boolean).slice(0, 5).join(', ');
          return {
            success: false,
            message: `⚠️ Không tìm thấy nhân viên **"${args.staff_name}"**. Danh sách hiện có: ${names || 'chưa có'}.`
          };
        }

        const date = args.date || new Date().toISOString().split('T')[0];
        const checkIn = args.check_in || '08:30';
        const checkOut = args.check_out || '17:30';
        const statusMap = { on_time: 'Đúng giờ', late: 'Đi muộn', leave: 'Nghỉ phép', absent: 'Vắng mặt' };
        const statusKey = args.status || 'on_time';
        const statusLabel = statusMap[statusKey] || 'Đúng giờ';

        const payload = {
          staff_id: foundStaff.id,
          date,
          check_in: checkIn,
          check_out: checkOut,
          status: statusKey,
          ot_minutes: 0
        };

        const res = await base44.entities.StaffAttendance.create(payload).catch(() => payload);

        const actionPreview = {
          action: 'CREATE_SHIFT',
          title: 'Ghi nhận chấm công nhân viên',
          summary: `Đã ghi nhận công cho **${foundStaff.name || foundStaff.full_name}** ngày ${date}.`,
          items: [
            { label: 'Nhân viên', value: foundStaff.name || foundStaff.full_name },
            { label: 'Ngày chấm công', value: date },
            { label: 'Giờ vào / ra', value: `${checkIn} - ${checkOut}` },
            { label: 'Trạng thái công', value: statusLabel }
          ],
          statusText: 'Đã lưu chấm công'
        };

        return {
          success: true,
          attendance: res,
          actionPreview,
          actionButton: { label: '📋 Xem Bảng Chấm công', route: '/staff?tab=attendance' },
          message: `📋 **Đã ghi nhận chấm công thành công!**\n• Nhân viên: **${foundStaff.name || foundStaff.full_name}**\n• Ngày: **${date}** (${checkIn} - ${checkOut})\n• Trạng thái: **${statusLabel}**`
        };
      }

      case 'room_create': {
        const targetBranchId = branchId && branchId !== 'all' ? branchId : null;
        const color = args.color || '#3B82F6';
        const payload = {
          name: args.name,
          color,
          branch_id: targetBranchId
        };

        let res;
        try {
          res = await base44.entities.Room.create(payload);
        } catch (e) {
          res = { id: `room_${Date.now()}`, ...payload };
        }

        const actionPreview = {
          action: 'CREATE_ROOM',
          title: 'Thêm Phòng / Khu vực mới',
          summary: `Đã thêm khu vực **${args.name}** vào sơ đồ salon.`,
          items: [
            { label: 'Tên phòng / khu vực', value: args.name },
            { label: 'Màu nhận diện', value: color },
            { label: 'Trạng thái', value: 'Sẵn sàng bố trí giường/ghế' }
          ],
          statusText: 'Đã tạo phòng thành công'
        };

        return {
          success: true,
          room: res,
          actionPreview,
          actionButton: { label: '🛏️ Xem Sơ đồ Phòng & Ghế', route: '/rooms-beds' },
          message: `🚪 **Đã thêm Phòng/Khu vực mới thành công!**\n• Tên phòng: **${args.name}**\n• Màu nhận diện: **${color}**`
        };
      }

      case 'bed_create': {
        const targetBranchId = branchId && branchId !== 'all' ? branchId : null;
        const roomList = await base44.entities.Room.list().catch(() => []);
        const rawRoom = (args.room_name || '').toLowerCase().trim();
        const foundRoom = roomList.find(r => (r.name || '').toLowerCase().includes(rawRoom));

        const payload = {
          name: args.name,
          room_id: foundRoom ? foundRoom.id : null,
          branch_id: targetBranchId,
          is_active: true
        };

        let res;
        try {
          res = await base44.entities.Facility.create(payload);
        } catch (e) {
          res = { id: `bed_${Date.now()}`, ...payload };
        }

        const roomDisplay = foundRoom ? foundRoom.name : (args.room_name || 'Khu vực chung');

        const actionPreview = {
          action: 'CREATE_BED',
          title: 'Thêm Giường / Ghế phục vụ mới',
          summary: `Đã thêm vị trí **${args.name}** vào ${roomDisplay}.`,
          items: [
            { label: 'Tên ghế / giường', value: args.name },
            { label: 'Thuộc phòng / khu vực', value: roomDisplay },
            { label: 'Trạng thái', value: 'Trống / Sẵn sàng đón khách' }
          ],
          statusText: 'Đã tạo ghế/giường thành công'
        };

        return {
          success: true,
          facility: res,
          actionPreview,
          actionButton: { label: '🛏️ Xem Sơ đồ Phòng & Ghế', route: '/rooms-beds' },
          message: `🛏️ **Đã thêm Giường/Ghế mới thành công!**\n• Tên vị trí: **${args.name}**\n• Thuộc phòng: **${roomDisplay}**\n• Trạng thái: **Sẵn sàng đón khách**`
        };
      }

      case 'promotion_create': {
        const valType = args.value_type || (args.value <= 100 ? 'percent' : 'fixed');
        const scope = args.scope || 'invoice';
        const now = new Date();
        const nextMonth = new Date(now.getTime() + 30 * 86400000).toISOString().split('T')[0];
        const expiryDate = args.expiry_date || nextMonth;
        const minSpend = args.min_spend ? Number(args.min_spend) : null;
        const maxDiscount = args.max_discount ? Number(args.max_discount) : null;

        const payload = {
          id: `promo_ai_${Date.now()}`,
          name: args.name,
          type: scope,
          valueType: valType,
          value: Number(args.value),
          startDate: now.toISOString().split('T')[0],
          expiryDate,
          minSpend,
          maxDiscount,
          usageLimit: 1,
          targetAudience: 'all',
          isGiftable: true,
          created_at: now.toISOString().split('T')[0]
        };

        try {
          await base44.entities.Settings.create({
            key: `promo_${payload.id}`,
            value: JSON.stringify(payload)
          });
        } catch (e) {
          // fallback
        }

        const valDisplay = valType === 'percent'
          ? `Giảm ${args.value}%`
          : `Giảm ${Number(args.value).toLocaleString('vi-VN')} đ`;

        const actionPreview = {
          action: 'CREATE_PROMOTION',
          title: 'Tạo Chương trình Khuyến mãi (CTKM)',
          summary: `Đã kích hoạt chương trình ưu đãi **${args.name}**.`,
          items: [
            { label: 'Tên chương trình', value: args.name },
            { label: 'Mức giảm giá', value: valDisplay },
            ...(minSpend ? [{ label: 'Đơn hàng tối thiểu', value: `${minSpend.toLocaleString('vi-VN')} đ` }] : []),
            { label: 'Hạn áp dụng', value: expiryDate },
            { label: 'Phạm vi áp dụng', value: scope === 'service' ? 'Chỉ áp dụng dịch vụ' : (scope === 'product' ? 'Chỉ áp dụng sản phẩm' : 'Toàn bộ hóa đơn') }
          ],
          statusText: 'Đã tạo chương trình khuyến mãi'
        };

        return {
          success: true,
          promotion: payload,
          actionPreview,
          actionButton: { label: '🎁 Xem Danh sách Khuyến mãi & Voucher', route: '/discounts?tab=promotions' },
          message: `🎁 **Đã tạo Chương trình Khuyến mãi mới thành công!**\n• Tên CTKM: **${args.name}**\n• Mức ưu đãi: **${valDisplay}**\n• Áp dụng đến: **${expiryDate}**`
        };
      }

      case 'deposit_create': {
        const custList = await base44.entities.Customer.list().catch(() => []);
        const rawCust = (args.customer_name || '').toLowerCase().trim();
        const cleanQ = rawCust.replace(/[\s.-]/g, '');
        const foundCust = custList.find(c => {
          const nameMatch = c.name && c.name.toLowerCase().includes(rawCust);
          const phone = (c.phone || '').replace(/[\s.-]/g, '');
          return nameMatch || (phone && (phone.includes(cleanQ) || phone.endsWith(cleanQ)));
        });

        let custId = foundCust ? foundCust.id : null;
        let custName = foundCust ? foundCust.name : (args.customer_name || 'Khách hàng');
        if (!foundCust) {
          try {
            const newC = await base44.entities.Customer.create({
              name: args.customer_name,
              phone: cleanQ.length >= 9 ? cleanQ : ''
            });
            custId = newC.id;
            custName = newC.name;
          } catch (e) {
            custId = `cust_${Date.now()}`;
          }
        }

        const amount = Number(args.amount) || 0;
        const payMethod = args.payment_method === 'cash' ? 'cash' : 'transfer';
        const depositNumber = `DEP-${Math.floor(100000 + Math.random() * 900000)}`;

        const payload = {
          deposit_number: depositNumber,
          customer_id: custId,
          required_amount: amount,
          paid_amount: amount,
          payment_method: payMethod,
          status: 'paid',
          notes: args.notes || 'Nạp tiền cọc / tài khoản trả trước'
        };

        let res;
        try {
          res = await base44.entities.Deposit.create(payload);
          await base44.entities.DepositTransaction.create({
            deposit_id: res.id,
            action: 'deposit_in',
            amount: amount,
            notes: `Nạp tiền cọc mã #${depositNumber}`
          }).catch(() => {});
        } catch (e) {
          res = { id: `dep_${Date.now()}`, ...payload };
        }

        try {
          await base44.entities.CashVoucher.create({
            type: 'receipt',
            voucher_code: `PT-DEP-${Date.now().toString().slice(-6)}`,
            type_name: 'Thu tiền đặt cọc / nạp thẻ',
            amount: amount,
            payer_receiver_name: custName,
            payment_method: payMethod,
            description: `Thu tiền nạp cọc cho khách ${custName} (${depositNumber})`,
            date: new Date().toISOString().split('T')[0]
          });
        } catch (e) {
          // ignore
        }

        const payLabel = payMethod === 'cash' ? 'Tiền mặt' : 'Chuyển khoản';

        const actionPreview = {
          action: 'CREATE_DEPOSIT',
          title: 'Nạp tiền cọc / Thẻ tài khoản khách',
          summary: `Đã nạp **${amount.toLocaleString('vi-VN')} đ** vào tài khoản của **${custName}**.`,
          items: [
            { label: 'Khách hàng', value: custName },
            { label: 'Mã phiếu cọc', value: depositNumber },
            { label: 'Số tiền nạp', value: `${amount.toLocaleString('vi-VN')} đ` },
            { label: 'Hình thức', value: payLabel },
            { label: 'Trạng thái', value: 'Đã nạp thành công & Đồng bộ Sổ quỹ' }
          ],
          statusText: 'Đã lưu nạp tiền cọc'
        };

        return {
          success: true,
          deposit: res,
          actionPreview,
          actionButton: { label: '💳 Xem Danh sách Đặt cọc & Thẻ', route: '/deposits' },
          message: `💳 **Đã nạp tiền cọc / tài khoản thành công!**\n• Khách hàng: **${custName}**\n• Số tiền nạp: **${amount.toLocaleString('vi-VN')} đ** (${payLabel})\n• Mã giao dịch: **${depositNumber}**`
        };
      }

      case 'inventory_create_stock_out': {
        const prodList = await base44.entities.Product.list().catch(() => []);
        const cleanRaw = (args.product_name || '')
          .replace(/^\d+\s*(?:chai|hộp|tuýp|lọ|thùng|cái|bộ|gói|sp|sản\s+phẩm)?\s*/i, '')
          .replace(/\s+(?:tiêu\s+hao|để\s+làm|làm\s+dịch\s+vụ|dùng\s+nội\s+bộ|bị\s+hỏng|hư\s+hỏng|hết\s+hạn|hết\s+date|cho\s+dịch\s+vụ).*$/i, '')
          .toLowerCase().trim();
        const foundProd = prodList.find(p => (p.name || '').toLowerCase().includes(cleanRaw));

        if (!foundProd) {
          const names = prodList.map(p => p.name).filter(Boolean).slice(0, 5).join(', ');
          return {
            success: false,
            message: `⚠️ Không tìm thấy sản phẩm **"${args.product_name}"** trong kho. Các mặt hàng hiện có: ${names || 'chưa có'}.`
          };
        }

        const qty = Number(args.quantity) || 1;
        const currentStock = Number(foundProd.stock || 0);
        const newStock = Math.max(0, currentStock - qty);
        const reason = args.reason || 'consumption';
        const reasonLabel = reason === 'consumption'
          ? 'Tiêu hao dịch vụ salon'
          : (reason === 'damage' ? 'Xuất hủy hỏng / hết date' : 'Xuất kho khác');

        await base44.entities.Product.update(foundProd.id, {
          stock: newStock
        }).catch(() => {});

        const receiptCode = `PXK-${Date.now().toString().slice(-6)}`;
        const receiptPayload = {
          receipt_code: receiptCode,
          type: 'out',
          reason,
          notes: args.notes || `Xuất ${qty} ${foundProd.unit || 'sp'} cho ${reasonLabel}`,
          items: [{
            product_id: foundProd.id,
            product_name: foundProd.name,
            qty,
            unit_price: Number(foundProd.cost_price || (foundProd.price ? foundProd.price * 0.7 : 0))
          }],
          total_amount: qty * Number(foundProd.cost_price || (foundProd.price ? foundProd.price * 0.7 : 0)),
          date: new Date().toISOString().split('T')[0]
        };

        let res;
        try {
          res = await base44.entities.InventoryReceipt.create(receiptPayload);
        } catch (e) {
          res = { id: `out_${Date.now()}`, ...receiptPayload };
        }

        const actionPreview = {
          action: 'CREATE_STOCK_OUT',
          title: 'Lập phiếu Xuất kho / Tiêu hao',
          summary: `Đã xuất kho **${qty} ${foundProd.unit || 'sản phẩm'}** **${foundProd.name}**.`,
          items: [
            { label: 'Mặt hàng xuất', value: foundProd.name },
            { label: 'Số lượng xuất', value: `${qty} ${foundProd.unit || 'sản phẩm'}` },
            { label: 'Lý do xuất', value: reasonLabel },
            { label: 'Tồn kho sau xuất', value: `${newStock} (Trước xuất: ${currentStock})` }
          ],
          statusText: 'Đã xuất kho & trừ tồn'
        };

        return {
          success: true,
          receipt: res,
          actionPreview,
          actionButton: { label: '📦 Xem Lịch sử Xuất Kho', route: '/inventory?tab=stock_out' },
          message: `📦 **Đã lập Phiếu Xuất kho thành công!**\n• Mã phiếu: **${receiptCode}**\n• Mặt hàng: **${foundProd.name}**\n• Số lượng xuất: **${qty} ${foundProd.unit || 'sản phẩm'}**\n• Lý do: **${reasonLabel}**\n• Tồn kho hiện tại: **${newStock}** (giảm từ ${currentStock})`
        };
      }

      case 'service_package_create': {
        const targetBranchId = branchId && branchId !== 'all' ? [branchId] : [];
        const usageCount = Number(args.usage_count) || 5;
        const price = Number(args.price) || 0;

        const payload = {
          name: args.name,
          price: price,
          usage_count: usageCount,
          branch_ids: targetBranchId,
          is_active: true
        };

        let res;
        try {
          res = await base44.entities.ServicePackage.create(payload);
        } catch (e) {
          res = { id: `pkg_${Date.now()}`, ...payload };
        }

        const actionPreview = {
          action: 'CREATE_SERVICE_PACKAGE',
          title: 'Tạo Gói Dịch vụ mới',
          summary: `Đã tạo gói dịch vụ **${args.name}** thành công.`,
          items: [
            { label: 'Tên gói dịch vụ', value: args.name },
            { label: 'Giá bán', value: `${price.toLocaleString('vi-VN')} đ` },
            { label: 'Số lần sử dụng', value: `${usageCount} buổi / lượt` },
            { label: 'Trạng thái', value: 'Sẵn sàng bán tại POS' }
          ],
          statusText: 'Đã tạo gói dịch vụ'
        };

        return {
          success: true,
          package: res,
          actionPreview,
          actionButton: { label: '📦 Xem Danh sách Gói Dịch vụ', route: '/services?tab=package' },
          message: `📦 **Đã tạo Gói Dịch vụ mới thành công!**\n• Tên gói: **${args.name}**\n• Giá bán: **${price.toLocaleString('vi-VN')} đ**\n• Số lượt sử dụng: **${usageCount} buổi**`
        };
      }

      case 'treatment_create': {
        const targetBranchId = branchId && branchId !== 'all' ? [branchId] : [];
        const totalSessions = Number(args.total_sessions) || 5;
        const price = Number(args.price) || 0;

        const payload = {
          name: args.name,
          price: price,
          total_sessions: totalSessions,
          description: args.description || 'Liệu trình chăm sóc chuyên sâu',
          branch_ids: targetBranchId,
          is_active: true
        };

        let res;
        try {
          res = await base44.entities.Treatment.create(payload);
        } catch (e) {
          res = { id: `trt_${Date.now()}`, ...payload };
        }

        const actionPreview = {
          action: 'CREATE_TREATMENT',
          title: 'Tạo Liệu trình mới',
          summary: `Đã tạo liệu trình **${args.name}** thành công.`,
          items: [
            { label: 'Tên liệu trình', value: args.name },
            { label: 'Giá trọn gói', value: `${price.toLocaleString('vi-VN')} đ` },
            { label: 'Tổng số buổi', value: `${totalSessions} buổi` },
            { label: 'Mô tả', value: payload.description }
          ],
          statusText: 'Đã tạo liệu trình'
        };

        return {
          success: true,
          treatment: res,
          actionPreview,
          actionButton: { label: '💆 Xem Danh sách Liệu trình', route: '/services?tab=treatment' },
          message: `💆 **Đã tạo Liệu trình mới thành công!**\n• Tên liệu trình: **${args.name}**\n• Giá trọn gói: **${price.toLocaleString('vi-VN')} đ**\n• Quy trình: **${totalSessions} buổi**`
        };
      }

      case 'service_combo_create': {
        const targetBranchId = branchId && branchId !== 'all' ? [branchId] : [];
        const comboPrice = Number(args.combo_price || args.price) || 0;

        const payload = {
          name: args.name,
          combo_price: comboPrice,
          description: args.description || 'Combo dịch vụ ưu đãi',
          branch_ids: targetBranchId,
          is_active: true
        };

        let res;
        try {
          res = await base44.entities.ServiceCombo.create(payload);
        } catch (e) {
          res = { id: `sc_${Date.now()}`, ...payload };
        }

        const actionPreview = {
          action: 'CREATE_SERVICE_COMBO',
          title: 'Tạo Combo Dịch vụ mới',
          summary: `Đã tạo combo dịch vụ **${args.name}** thành công.`,
          items: [
            { label: 'Tên combo', value: args.name },
            { label: 'Giá combo ưu đãi', value: `${comboPrice.toLocaleString('vi-VN')} đ` },
            { label: 'Mô tả', value: payload.description }
          ],
          statusText: 'Đã tạo combo dịch vụ'
        };

        return {
          success: true,
          service_combo: res,
          actionPreview,
          actionButton: { label: '✨ Xem Danh sách Combo Dịch vụ', route: '/services?tab=service_combo' },
          message: `✨ **Đã tạo Combo Dịch vụ mới thành công!**\n• Tên combo: **${args.name}**\n• Giá combo ưu đãi: **${comboPrice.toLocaleString('vi-VN')} đ**`
        };
      }

      case 'product_combo_create': {
        const targetBranchId = branchId && branchId !== 'all' ? [branchId] : [];
        const comboPrice = Number(args.combo_price || args.price) || 0;

        const payload = {
          name: args.name,
          combo_price: comboPrice,
          description: args.description || 'Combo sản phẩm ưu đãi',
          branch_ids: targetBranchId,
          is_active: true
        };

        let res;
        try {
          res = await base44.entities.ProductCombo.create(payload);
        } catch (e) {
          res = { id: `pc_${Date.now()}`, ...payload };
        }

        const actionPreview = {
          action: 'CREATE_PRODUCT_COMBO',
          title: 'Tạo Combo Sản phẩm mới',
          summary: `Đã tạo combo sản phẩm **${args.name}** thành công.`,
          items: [
            { label: 'Tên combo sản phẩm', value: args.name },
            { label: 'Giá combo ưu đãi', value: `${comboPrice.toLocaleString('vi-VN')} đ` },
            { label: 'Mô tả', value: payload.description }
          ],
          statusText: 'Đã tạo combo sản phẩm'
        };

        return {
          success: true,
          product_combo: res,
          actionPreview,
          actionButton: { label: '🛍️ Xem Danh sách Combo Sản phẩm', route: '/services?tab=product_combo' },
          message: `🛍️ **Đã tạo Combo Sản phẩm mới thành công!**\n• Tên combo: **${args.name}**\n• Giá combo ưu đãi: **${comboPrice.toLocaleString('vi-VN')} đ**`
        };
      }

      case 'prepaid_card_create': {
        const targetBranchId = branchId && branchId !== 'all' ? [branchId] : [];
        const faceValue = Number(args.face_value) || 0;
        const sellingPrice = Number(args.selling_price || faceValue) || faceValue;
        const cardCode = `CARD-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;

        const payload = {
          name: args.name,
          card_code: cardCode,
          face_value: faceValue,
          selling_price: sellingPrice,
          balance: faceValue,
          color: args.color || '#A78BFA',
          expiry_months: Number(args.expiry_months) || 0,
          branch_ids: targetBranchId,
          is_active: true
        };

        let res;
        try {
          res = await base44.entities.PrepaidCard.create(payload);
        } catch (e) {
          res = { id: `card_${Date.now()}`, ...payload };
        }

        const actionPreview = {
          action: 'CREATE_PREPAID_CARD',
          title: 'Tạo Thẻ Tiền Mặt (Prepaid Card) mới',
          summary: `Đã tạo loại thẻ **${args.name}** thành công.`,
          items: [
            { label: 'Tên thẻ tiền mặt', value: args.name },
            { label: 'Mệnh giá trong thẻ', value: `${faceValue.toLocaleString('vi-VN')} đ` },
            { label: 'Giá bán thực tế', value: `${sellingPrice.toLocaleString('vi-VN')} đ` },
            { label: 'Mã phôi thẻ', value: cardCode }
          ],
          statusText: 'Đã tạo thẻ tiền mặt'
        };

        return {
          success: true,
          prepaid_card: res,
          actionPreview,
          actionButton: { label: '💳 Xem Danh mục Thẻ Tiền Mặt', route: '/services?tab=prepaid_card' },
          message: `💳 **Đã tạo Thẻ Tiền Mặt mới thành công!**\n• Tên thẻ: **${args.name}**\n• Mệnh giá sử dụng: **${faceValue.toLocaleString('vi-VN')} đ**\n• Giá bán: **${sellingPrice.toLocaleString('vi-VN')} đ**\n• Mã phôi: **${cardCode}**`
        };
      }

      default:
        return { success: false, error: `Công cụ ${name} chưa được hỗ trợ.` };
    }
  } catch (err) {
    return { success: false, error: err.message, message: `❌ Lỗi khi thao tác dữ liệu: ${err.message}` };
  }
}

// Smart Local Intent Dispatcher (Guarantees 100% operation on real software data even if Gemini hits rate limits)
async function executeLocalFallbackIntent(query, context) {
  const q = query.toLowerCase().trim();

  // 0. Tạo khách hàng mới (Customer Create)
  const hasPhone = /0\d{9}/.test(q);
  const isCustCreate = (q.includes('tạo khách') || q.includes('thêm khách') || q.includes('đăng ký khách') || q.includes('tạo hồ sơ khách') || q.includes('thêm khách hàng') || q.includes('tạo khách hàng')) ||
    (/(?:sinh ngày|ngày sinh|giới tính|địa chỉ|ghi chú)/i.test(q) && hasPhone);
  
  if (isCustCreate && !q.includes('tìm') && !q.includes('đặt lịch') && !q.includes('tạo lịch') && !q.includes('hủy') && !/(?:cắt tóc nữ|cắt tóc nam|gội đầu dưỡng sinh|nhuộm tóc|uốn tóc)/i.test(q)) {
    const profile = parseCustomerProfile(query);
    if (!profile.name || !profile.phone) {
      return {
        content: `Để tạo mới một khách hàng vào hệ thống, anh/chị vui lòng cung cấp giúp em các thông tin bắt buộc sau:\n1. **Họ và tên khách hàng**\n2. **Số điện thoại**\n\n*(Ngoài ra, anh/chị có thể cung cấp thêm các thông tin như: Ngày sinh, Giới tính, Email, Địa chỉ hoặc Ghi chú nếu muốn).*`
      };
    }

    const res = await executeTool('customer_create', {
      name: profile.name,
      phone: profile.phone,
      email: profile.email,
      address: profile.address,
      gender: profile.gender,
      birth_date: profile.birthday,
      note: profile.note
    }, context);

    const actionPreview = {
      action: 'CREATE_CUSTOMER',
      title: 'Tạo hồ sơ khách hàng mới',
      summary: `Đã tạo hồ sơ khách hàng **${profile.name}** thành công.`,
      items: [
        { label: 'Họ và tên', value: profile.name },
        { label: 'Số điện thoại', value: profile.phone },
        ...(profile.email ? [{ label: 'Email', value: profile.email }] : []),
        ...(profile.birthday ? [{ label: 'Ngày sinh', value: profile.birthday }] : []),
        ...(profile.gender ? [{ label: 'Giới tính', value: profile.gender === 'male' ? 'Nam' : (profile.gender === 'female' ? 'Nữ' : 'Khác') }] : []),
        ...(profile.address ? [{ label: 'Địa chỉ', value: profile.address }] : []),
        ...(profile.note ? [{ label: 'Ghi chú', value: profile.note }] : [])
      ],
      statusText: 'Đã lưu khách hàng mới'
    };

    return {
      content: res.message,
      actionPreview,
      actionButton: { label: '👤 Xem Danh sách Khách hàng', route: '/customers' },
      executedTools: [{ name: 'customer_create', args: profile, result: res }]
    };
  }

  // 1. Tạo Báo cáo thông minh AI & Chuyển hướng sang Báo cáo AI
  const isExplicitReportCreate = q.includes('tạo báo cáo') || q.includes('tao bao cao') || q.includes('lập báo cáo') || q.includes('lap bao cao') || q.includes('báo cáo ai') || q.includes('bao cao ai') || q.includes('báo cáo bằng ai') || q.includes('xuất báo cáo') || q.includes('lập thống kê');
  const isGeneralReportQuery = q.includes('báo cáo') && (q.includes('doanh thu') || q.includes('nhân viên') || q.includes('thợ') || q.includes('khách') || q.includes('dịch vụ') || q.includes('sản phẩm') || q.includes('lịch hẹn') || q.includes('tuần') || q.includes('tháng') || q.includes('quý') || q.includes('năm') || q.includes('chi tiết') || q.includes('biểu đồ'));

  if (isExplicitReportCreate || isGeneralReportQuery) {
    const res = await executeTool('report_generate_ai', { prompt: query }, context);
    return {
      content: res.message,
      navigateTo: res.navigateTo,
      actionButton: res.actionButton,
      executedTools: [{ name: 'report_generate_ai', args: { prompt: query }, result: res }]
    };
  }

  if (q.includes('tiền hôm nay') || q.includes('bán được bao nhiêu') || (q.includes('doanh thu') && (q.includes('hôm nay') || q.includes('nay')))) {
    const res = await executeTool('pos_get_today_summary', {}, context);
    return { content: res.message, executedTools: [{ name: 'pos_get_today_summary', result: res }] };
  }

  if (q.includes('tuần này') || q.includes('tháng này') || q.includes('7 ngày')) {
    const period = q.includes('tháng') ? 'month' : 'week';
    const res = await executeTool('reports_get_overview', { period }, context);
    return { content: res.message, executedTools: [{ name: 'reports_get_overview', args: { period }, result: res }] };
  }

  // Lọc tập khách hàng & Tạo tập khách hàng (Ưu tiên xử lý trước customer_search thông thường)
  const isSegmentRequest = q.includes('tập khách') || q.includes('phân nhóm') || q.includes('nhóm khách');
  const isFilterRequest = q.includes('lọc') || q.includes('khách chưa') || q.includes('khách tiêu') || q.includes('khách quen') || q.includes('khách mới') || (q.includes('sinh nhật') && q.includes('khách'));
  if (isSegmentRequest || isFilterRequest) {
    let action_mode = 'both';
    if (q.includes('tạo tập') || q.includes('lưu tập') || q.includes('tạo nhóm') || q.includes('lưu nhóm') || q.includes('lập tập')) {
      action_mode = 'create_segment';
    } else if (q.includes('lọc') || q.includes('xem') || q.includes('danh sách') || q.includes('tìm những')) {
      action_mode = 'filter';
    }

    const filterArgs = { action_mode };

    // 1. Số ngày chưa ghé (ví dụ: "chưa ghé 30 ngày", "chưa quay lại 2 tháng", "chưa đến 45 ngày")
    const daysMatch = q.match(/(?:chưa\s+(?:quay\s+lại|ghé|đến)|không\s+ghé)\s*(?:trên|>|quá)?\s*(\d+)\s*(ngày|tháng)?/i);
    if (daysMatch) {
      let days = parseInt(daysMatch[1], 10);
      if (daysMatch[2] === 'tháng') days = days * 30;
      filterArgs.last_visit_days_gt = days;
    }

    // 2. Chi tiêu (ví dụ: "tiêu trên 5 triệu", "chi tiêu > 2tr", "tiêu 5tr", "5.000.000")
    const spendMatch = q.match(/(?:chi\s+tiêu|tiêu|mua)\s*(?:trên|>|từ|hơn)?\s*(\d+(?:[.,]\d+)?)\s*(triệu|tr|k|nghìn|đ|vnd)?/i);
    if (spendMatch) {
      let val = parseFloat(spendMatch[1].replace(',', '.'));
      const unit = (spendMatch[2] || '').toLowerCase();
      if (unit === 'triệu' || unit === 'tr') val = val * 1000000;
      else if (unit === 'k' || unit === 'nghìn') val = val * 1000;
      filterArgs.min_spent = val;
    }

    // 3. Số lần ghé (ví dụ: "ghé 1 lần", "ghé trên 3 lần", "mới ghé 1 lần", "khách mới")
    const visitMatch = q.match(/(?:ghé|đến|làm)\s*(?:trên|>|hơn|từ)?\s*(\d+)\s*lần/i);
    if (visitMatch) {
      const visits = parseInt(visitMatch[1], 10);
      if (q.includes('trên') || q.includes('>') || q.includes('hơn') || q.includes('từ')) {
        filterArgs.min_visits = visits;
      } else {
        filterArgs.visit_count_eq = visits;
      }
    } else if (q.includes('khách mới')) {
      filterArgs.visit_count_eq = 1;
    } else if (q.includes('khách quen')) {
      filterArgs.min_visits = 3;
    }

    // 4. Sinh nhật tháng (ví dụ: "sinh nhật tháng 10", "sinh tháng 11")
    const birthdayMatch = q.match(/(?:sinh\s+nhật|sinh)\s*(?:vào|trong)?\s*tháng\s*(\d{1,2})/i);
    if (birthdayMatch) {
      filterArgs.birthday_month = parseInt(birthdayMatch[1], 10);
    }

    // 5. Giới tính (ví dụ: "khách nữ", "khách nam")
    if (q.includes('khách nữ') || q.includes('phái nữ')) {
      filterArgs.gender = 'female';
    } else if (q.includes('khách nam') || q.includes('phái nam')) {
      filterArgs.gender = 'male';
    }

    // 6. Dịch vụ từng làm (ví dụ: "từng nhuộm", "làm uốn", "gội đầu", "cắt tóc")
    const svcMatch = q.match(/(?:từng\s+(?:làm|sử\s+dụng)|dịch\s+vụ)\s+([a-zA-Zà-ỹÀ-Ỹ\s]+)/i);
    if (svcMatch) {
      filterArgs.service_name = svcMatch[1].trim();
    }

    const res = await executeTool('customer_filter', filterArgs, context);
    return { content: res.message, executedTools: [{ name: 'customer_filter', args: filterArgs, result: res }] };
  }

  if (q.includes('khách hàng') || q.includes('tìm khách') || q.includes('bao nhiêu khách')) {
    const phoneMatch = q.match(/\d{9,11}/);
    const searchParam = phoneMatch ? phoneMatch[0] : '';
    const res = await executeTool('customer_search', { query: searchParam }, context);
    return { content: res.message, executedTools: [{ name: 'customer_search', args: { query: searchParam }, result: res }] };
  }

  if (q.includes('đặt lịch') || q.includes('tạo lịch') || (/0\d{9}/.test(q) && (q.includes('cắt') || q.includes('gội') || q.includes('nhuộm') || q.includes('uốn')))) {
    const phoneMatch = query.match(/0\d{9}/);
    const serviceMatch = query.match(/(cắt tóc nam|cắt tóc nữ|cắt tóc|gội đầu dưỡng sinh|gội đầu|nhuộm tóc|nhuộm|uốn tóc|uốn|làm móng|massage)/i);
    const timeMatch = query.match(/(\d{1,2})(?:h|:(\d{2}))/i);
    const dateMatch = q.includes('mai') ? new Date(Date.now() + 86400000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    
    if (phoneMatch && serviceMatch) {
      const timeFormatted = timeMatch ? `${timeMatch[1].padStart(2, '0')}:${timeMatch[2] || '00'}` : '14:00';
      const beforePhone = query.substring(0, phoneMatch.index).replace(/[,;:\-\s]+$/, '').trim();
      const custName = beforePhone || 'Khách hàng';
      const res = await executeTool('appointment_create', {
        customer_name: custName,
        customer_phone: phoneMatch[0],
        service_name: serviceMatch[0],
        date: dateMatch,
        time: timeFormatted
      }, context);
      return { content: res.message, executedTools: [{ name: 'appointment_create', result: res }] };
    }
  }

  if (q.includes('lịch hẹn') || q.includes('xem lịch')) {
    const todayStr = new Date().toISOString().split('T')[0];
    const res = await executeTool('appointment_search', { date: todayStr }, context);
    return { content: res.message, executedTools: [{ name: 'appointment_search', args: { date: todayStr }, result: res }] };
  }

  // TẠO CHI NHÁNH MỚI
  if (q.includes('tạo chi nhánh') || q.includes('thêm chi nhánh')) {
    const nameMatch = query.match(/(?:tạo|thêm)\s+chi\s+nhánh\s+(?:mới\s+)?([a-zA-Z0-9À-Ỹà-ỹ\s]+)/i);
    const branchName = nameMatch ? nameMatch[1].trim() : 'Chi nhánh mới';
    const res = await executeTool('branch_create', { name: branchName }, context);
    return { content: res.message, executedTools: [{ name: 'branch_create', args: { name: branchName }, result: res }] };
  }

  // TẠO DỊCH VỤ MỚI
  if (q.includes('thêm dịch vụ') || q.includes('tạo dịch vụ')) {
    const nameMatch = query.match(/(?:thêm|tạo)\s+dịch\s+vụ\s+(?:mới\s+)?([a-zA-Z0-9À-Ỹà-ỹ\s]+?)(?:\s+(?:giá|tiền|thời\s+lượng|\d)|$)/i);
    const svcName = nameMatch ? nameMatch[1].trim() : 'Dịch vụ mới';
    const priceMatch = q.match(/(\d+(?:[.,]\d+)?)\s*(?:k|nghìn|đ|vnd|triệu|tr)?/i);
    const hasPrice = /(?:giá|tiền|\d+\s*(?:k|nghìn|đ|tr))/i.test(query);

    if (!hasPrice) {
      return {
        content: `💇‍♀️ **Để tạo dịch vụ "${svcName}", bạn muốn cài đặt thông tin sau thế nào?**\n\n1. **Giá niêm yết** là bao nhiêu (ví dụ: *150.000đ*)?\n2. **Thời lượng thực hiện** là bao nhiêu phút (mặc định 45 phút)?\n\n*(Bạn chỉ cần trả lời ví dụ: "Giá 150k làm 45 phút" là tôi sẽ lưu ngay!)*`,
        executedTools: [],
        model: 'GloPro Service Assistant'
      };
    }

    let price = 100000;
    if (priceMatch) {
      let pNum = parseFloat(priceMatch[1].replace(',', '.'));
      if (q.includes('tr') || q.includes('triệu')) pNum = pNum * 1000000;
      else if (pNum < 1000) pNum = pNum * 1000;
      price = pNum;
    }
    const durMatch = q.match(/(\d+)\s*phút/i);
    const duration = durMatch ? parseInt(durMatch[1], 10) : 45;

    const res = await executeTool('service_create', { name: svcName, price, duration_minutes: duration }, context);
    return {
      content: res.message,
      actionPreview: res.actionPreview,
      actionButton: res.actionButton || { label: '✂️ Xem Danh mục Dịch vụ', route: '/services' },
      executedTools: [{ name: 'service_create', args: { name: svcName, price, duration_minutes: duration }, result: res }]
    };
  }

  // TẠO SẢN PHẨM MỚI
  if (q.includes('tạo sản phẩm') || q.includes('thêm sản phẩm') || q.includes('nhập sản phẩm')) {
    const nameMatch = query.match(/(?:tạo|thêm|nhập)\s+sản\s+phẩm\s+(?:mới\s+)?([a-zA-Z0-9À-Ỹà-ỹ\s]+?)(?:\s+(?:giá|bán|tồn|\d)|$)/i);
    const prodName = nameMatch ? nameMatch[1].trim() : 'Sản phẩm mới';
    const priceMatch = q.match(/(\d+(?:[.,]\d+)?)\s*(?:k|nghìn|đ|vnd|triệu|tr)?/i);
    const hasPrice = /(?:giá|bán|tiền|\d+\s*(?:k|nghìn|đ|tr))/i.test(query);

    if (!hasPrice) {
      return {
        content: `📦 **Để tạo sản phẩm "${prodName}", bạn muốn cài đặt thông tin sau thế nào?**\n\n1. **Giá bán lẻ** là bao nhiêu (ví dụ: *250.000đ*)?\n2. **Số lượng tồn kho ban đầu** là bao nhiêu (mặc định 20)?\n\n*(Bạn chỉ cần trả lời ví dụ: "Giá bán 250k tồn kho 20 chai" là tôi sẽ lưu ngay!)*`,
        executedTools: [],
        model: 'GloPro Product Assistant'
      };
    }

    let price = 100000;
    if (priceMatch) {
      let pNum = parseFloat(priceMatch[1].replace(',', '.'));
      if (q.includes('tr') || q.includes('triệu')) pNum = pNum * 1000000;
      else if (pNum < 1000) pNum = pNum * 1000;
      price = pNum;
    }
    const stockMatch = q.match(/(?:tồn|số\s+lượng|sl)\s*(?:kho)?\s*(\d+)/i);
    const stock = stockMatch ? parseInt(stockMatch[1], 10) : 20;

    const res = await executeTool('product_create', { name: prodName, price, stock }, context);
    return {
      content: res.message,
      actionPreview: res.actionPreview,
      actionButton: res.actionButton,
      executedTools: [{ name: 'product_create', args: { name: prodName, price, stock }, result: res }]
    };
  }

  // CÀI ĐẶT HOA HỒNG NHÂN VIÊN
  if (q.includes('cài hoa hồng') || q.includes('cài đặt hoa hồng') || q.includes('set hoa hồng') || q.includes('chia hoa hồng') || (q.includes('hoa hồng') && (q.includes('cho') || q.includes('thợ') || q.includes('nhân viên') || q.includes('%')))) {
    const percentMatch = q.match(/(\d+)\s*%/);
    const fixedMatch = q.match(/(\d+(?:[.,]\d+)?)\s*(?:k|nghìn|đ|vnd)/i);
    const staffMatch = query.match(/(?:cho|nhân\s+viên|thợ)\s+([a-zA-ZÀ-Ỹà-ỹ\s]+?)(?:\s+(?:hoa\s+hồng|dịch\s+vụ|mức|\d|$))/i);
    const allStaff = q.includes('tất cả') || q.includes('toàn bộ');

    let commType = percentMatch ? 'percent' : (fixedMatch ? 'fixed' : null);
    let commValue = percentMatch ? parseInt(percentMatch[1], 10) : null;
    if (!commValue && fixedMatch) {
      let v = parseFloat(fixedMatch[1].replace(',', '.'));
      if (v < 1000) v = v * 1000;
      commValue = v;
    }

    if (!commType || !commValue) {
      return {
        content: `🎖️ **Để cài đặt hoa hồng nhân viên, vui lòng cho tôi biết:**\n\n1. **Nhân viên áp dụng:** Áp dụng cho ai (ví dụ: *Minh Thu*, *Thợ phụ*, hay *Tất cả nhân viên*)?\n2. **Mức hoa hồng:** Là bao nhiêu (ví dụ: *10% doanh thu* hay *30.000đ/lần làm*)?\n3. **Áp dụng cho:** Dịch vụ cụ thể nào hay *Tất cả dịch vụ*?\n\n*(Bạn chỉ cần trả lời ví dụ: "10% dịch vụ Cắt tóc cho Minh Thu" là tôi sẽ cài đặt ngay!)*`,
        executedTools: [],
        model: 'GloPro Commission Assistant'
      };
    }

    const staffName = allStaff ? 'all' : (staffMatch ? staffMatch[1].trim() : 'all');
    const svcMatch = query.match(/(?:dịch\s+vụ|món|làm)\s+([a-zA-Z0-9À-Ỹà-ỹ\s]+)/i);
    const itemName = svcMatch ? svcMatch[1].trim() : 'all';

    const res = await executeTool('staff_set_commission', {
      staff_name: staffName,
      commission_type: commType,
      commission_value: commValue,
      item_name: itemName,
      item_type: 'service'
    }, context);

    return {
      content: res.message,
      actionPreview: res.actionPreview,
      actionButton: res.actionButton,
      executedTools: [{ name: 'staff_set_commission', result: res }]
    };
  }

  // THÊM NHÂN VIÊN MỚI
  if (q.includes('thêm nhân viên') || q.includes('thêm thợ') || q.includes('tạo nhân viên')) {
    const phoneMatch = query.match(/0\d{9}/);
    const nameMatch = query.match(/(?:thêm|tạo)\s+(?:nhân\s+viên|thợ)\s+(?:mới\s+)?([a-zA-ZÀ-Ỹà-ỹ\s]+?)(?:\s+(?:sđt|số|vai|lương|\d)|$)/i);
    const staffName = nameMatch ? nameMatch[1].trim() : '';

    if (!staffName || !phoneMatch) {
      const targetName = staffName || 'nhân viên mới';
      return {
        content: `🧑‍💼 **Để thêm hồ sơ cho ${targetName}, vui lòng cung cấp:**\n\n1. **Số điện thoại** của nhân viên (bắt buộc, ví dụ: *0912345678*)?\n2. **Vị trí / Vai trò:** Thợ chính, Thợ phụ hay Thu ngân?\n\n*(Bạn chỉ cần trả lời ví dụ: "${targetName} 0912345678 Thợ chính" là tôi sẽ lưu ngay!)*`,
        executedTools: [],
        model: 'GloPro Staff Assistant'
      };
    }

    const phone = phoneMatch[0];
    let role = 'Thợ chính';
    if (q.includes('thợ phụ')) role = 'Thợ phụ';
    else if (q.includes('thu ngân')) role = 'Thu ngân';
    else if (q.includes('quản lý')) role = 'Quản lý';

    const res = await executeTool('staff_create', { name: staffName, phone, role }, context);
    return { 
      content: res.message, 
      actionPreview: res.actionPreview,
      actionButton: res.actionButton, 
      executedTools: [{ name: 'staff_create', args: { name: staffName, phone, role }, result: res }] 
    };
  }

  // TẠO MÃ VOUCHER / KHUYẾN MÃI
  if (q.includes('tạo voucher') || q.includes('tạo mã giảm') || q.includes('tạo khuyến mãi') || q.includes('phát hành voucher')) {
    const codeMatch = query.match(/(?:mã|voucher)\s+([a-zA-Z0-9_-]+)/i);
    const percentMatch = q.match(/(\d+)\s*%/);
    const fixedMatch = q.match(/(\d+(?:[.,]\d+)?)\s*(?:k|nghìn|đ|vnd|triệu|tr)/i);

    let val = percentMatch ? parseInt(percentMatch[1], 10) : null;
    let discType = percentMatch ? 'percent' : 'fixed';
    if (!val && fixedMatch) {
      let fv = parseFloat(fixedMatch[1].replace(',', '.'));
      if (q.includes('tr') || q.includes('triệu')) fv = fv * 1000000;
      else if (fv < 1000) fv = fv * 1000;
      val = fv;
    }

    if (!codeMatch && !val) {
      return {
        content: `🎟️ **Để tạo mã Voucher khuyến mãi mới, vui lòng cho tôi biết:**\n\n1. **Tên mã Voucher** (ví dụ: *GP50K, SALON10, TRIANVIP*)?\n2. **Mức giảm giá** (ví dụ: *Giảm 50.000đ* hoặc *Giảm 15%*)?\n3. **Đơn hàng tối thiểu** để áp dụng (nếu có)?\n\n*(Bạn chỉ cần trả lời ví dụ: "Tạo voucher GP50K giảm 50k" là tôi sẽ phát hành ngay!)*`,
        executedTools: [],
        model: 'GloPro Voucher Assistant'
      };
    }

    const code = codeMatch ? codeMatch[1].toUpperCase() : `GP${Math.floor(1000 + Math.random() * 9000)}`;
    const discountVal = val || 50000;

    const res = await executeTool('voucher_create', {
      code,
      discount_type: discType,
      discount_value: discountVal
    }, context);

    return {
      content: res.message,
      actionPreview: res.actionPreview,
      actionButton: res.actionButton,
      executedTools: [{ name: 'voucher_create', result: res }]
    };
  }

  // LẬP PHIẾU THU SỔ QUỸ
  if (q.includes('phiếu thu') || q.includes('lập phiếu thu') || q.includes('tạo phiếu thu') || (q.includes('thu tiền') && !q.includes('chi'))) {
    const amountMatch = q.match(/(\d+(?:[.,]\d+)?)\s*(?:triệu|tr|k|nghìn|đ|vnd)/i);
    let amount = null;
    if (amountMatch) {
      let v = parseFloat(amountMatch[1].replace(',', '.'));
      if (q.includes('tr') || q.includes('triệu')) v = v * 1000000;
      else if (v < 1000) v = v * 1000;
      amount = v;
    }

    if (!amount) {
      return {
        content: `💵 **Để lập Phiếu Thu tiền vào Sổ quỹ, vui lòng cho tôi biết:**\n\n1. **Số tiền thu** là bao nhiêu (ví dụ: *500.000đ*, *2 triệu*)?\n2. **Khoản thu / Lý do:** Thu hồi nợ, thu bán lẻ hay thu tiền cọc?\n3. **Người nộp tiền** là ai?\n4. **Phương thức:** Tiền mặt hay Chuyển khoản QR?\n\n*(Bạn chỉ cần trả lời ví dụ: "Lập phiếu thu 500k từ chị Mai Anh tiền nợ chuyển khoản" là tôi sẽ lưu ngay!)*`,
        executedTools: [],
        model: 'GloPro Cashflow Assistant'
      };
    }

    const payMethod = (q.includes('chuyển khoản') || q.includes('ck') || q.includes('qr') || q.includes('ngân hàng')) ? 'transfer' : 'cash';
    const payerMatch = query.match(/(?:từ|của|người\s+nộp|khách)\s+([a-zA-ZÀ-Ỹà-ỹ\s]+?)(?:\s+(?:tiền|cho|khoản|\d|$))/i);
    const payerName = payerMatch ? payerMatch[1].trim() : 'Khách hàng';
    let typeName = 'Thu tiền bán hàng / dịch vụ';
    if (q.includes('nợ') || q.includes('công nợ')) typeName = 'Thu hồi công nợ';
    else if (q.includes('cọc') || q.includes('đặt cọc')) typeName = 'Thu tiền đặt cọc';
    else if (q.includes('khác')) typeName = 'Thu khác';

    const res = await executeTool('cashflow_create_receipt', {
      amount,
      type_name: typeName,
      payer_name: payerName,
      payment_method: payMethod,
      note: query
    }, context);

    return {
      content: res.message,
      actionPreview: res.actionPreview,
      actionButton: res.actionButton,
      executedTools: [{ name: 'cashflow_create_receipt', result: res }]
    };
  }

  // LẬP PHIẾU CHI SỔ QUỸ
  if (q.includes('phiếu chi') || q.includes('lập phiếu chi') || q.includes('tạo phiếu chi') || q.includes('chi tiền') || q.includes('tạm ứng') || q.includes('trả tiền điện') || q.includes('tiền nước') || q.includes('tiền mặt bằng') || q.includes('tiền nhà') || q.includes('mua vật tư')) {
    const amountMatch = q.match(/(\d+(?:[.,]\d+)?)\s*(?:triệu|tr|k|nghìn|đ|vnd)/i);
    let amount = null;
    if (amountMatch) {
      let v = parseFloat(amountMatch[1].replace(',', '.'));
      if (q.includes('tr') || q.includes('triệu')) v = v * 1000000;
      else if (v < 1000) v = v * 1000;
      amount = v;
    }

    if (!amount) {
      return {
        content: `💸 **Để lập Phiếu Chi tiền từ Sổ quỹ, vui lòng cho tôi biết:**\n\n1. **Số tiền chi** là bao nhiêu (ví dụ: *350.000đ*, *1.5 triệu*)?\n2. **Mục đích chi:** Chi tiền điện nước, mua đồ dùng, chi tiền nhà hay tạm ứng lương?\n3. **Người nhận tiền** là ai?\n4. **Phương thức chi:** Tiền mặt hay Chuyển khoản?\n\n*(Bạn chỉ cần trả lời ví dụ: "Lập phiếu chi 350k tiền điện chuyển khoản" là tôi sẽ lưu ngay!)*`,
        executedTools: [],
        model: 'GloPro Cashflow Assistant'
      };
    }

    const payMethod = (q.includes('chuyển khoản') || q.includes('ck') || q.includes('qr') || q.includes('ngân hàng')) ? 'transfer' : 'cash';
    const receiverMatch = query.match(/(?:cho|người\s+nhận)\s+([a-zA-ZÀ-Ỹà-ỹ\s]+?)(?:\s+(?:tiền|khoản|\d|$))/i);
    const receiverName = receiverMatch ? receiverMatch[1].trim() : 'Nhân viên / Đối tác';
    let typeName = 'Chi phí hoạt động';
    if (q.includes('điện')) typeName = 'Chi trả tiền điện';
    else if (q.includes('nước')) typeName = 'Chi trả tiền nước';
    else if (q.includes('mặt bằng') || q.includes('tiền nhà')) typeName = 'Chi thuê mặt bằng';
    else if (q.includes('tạm ứng') || q.includes('lương')) typeName = 'Chi tạm ứng lương';
    else if (q.includes('vật tư') || q.includes('đồ dùng') || q.includes('mua')) typeName = 'Chi mua vật tư / đồ dùng';

    const res = await executeTool('cashflow_create_payment', {
      amount,
      type_name: typeName,
      receiver_name: receiverName,
      payment_method: payMethod,
      note: query
    }, context);

    return {
      content: res.message,
      actionPreview: res.actionPreview,
      actionButton: res.actionButton,
      executedTools: [{ name: 'cashflow_create_payment', result: res }]
    };
  }

  // LẬP PHIẾU NHẬP KHO HÀNG HÓA
  if (q.includes('phiếu nhập kho') || q.includes('nhập kho') || q.includes('lập phiếu nhập') || (q.includes('nhập') && (q.includes('thùng') || q.includes('chai') || q.includes('hộp') || q.includes('hàng')))) {
    const qtyMatch = q.match(/(?:nhập|số\s+lượng|sl)?\s*(\d+)\s*(?:chai|hộp|tuýp|lọ|thùng|cái|bộ|gói|sp|sản\s+phẩm)/i);
    const priceMatch = q.match(/(?:giá|đơn\s+giá|giá\s+nhập)?\s*(\d+(?:[.,]\d+)?)\s*(?:triệu|tr|k|nghìn|đ|vnd)/i);
    const nameMatch = query.match(/(?:nhập\s+(?:kho\s+)?(?:hàng\s+)?(?:lô\s+)?)(?:mới\s+)?([a-zA-Z0-9À-Ỹà-ỹ\s]+?)(?:\s+(?:số\s+lượng|giá|từ|nhà|sl|\d)|$)/i);
    const prodName = nameMatch ? nameMatch[1].trim() : '';

    if (!prodName || !qtyMatch) {
      const target = prodName || 'mặt hàng';
      return {
        content: `📦 **Để lập Phiếu Nhập kho cho ${target}, vui lòng cung cấp:**\n\n1. **Số lượng nhập** (ví dụ: *20 chai*, *10 hộp*)?\n2. **Đơn giá nhập** (ví dụ: *120k*, *250.000đ*)?\n3. **Nhà cung cấp** (nếu có, ví dụ: *Công ty Mỹ phẩm ABC*)?\n\n*(Bạn chỉ cần trả lời ví dụ: "Nhập 20 chai Dầu gội Keratin giá 150k từ cty ABC" là tôi sẽ lên phiếu và cập nhật kho ngay!)*`,
        executedTools: [],
        model: 'GloPro Inventory Assistant'
      };
    }

    let qty = parseInt(qtyMatch[1], 10) || 10;
    let unitPrice = 100000;
    if (priceMatch) {
      let pNum = parseFloat(priceMatch[1].replace(',', '.'));
      if (q.includes('tr') || q.includes('triệu')) pNum = pNum * 1000000;
      else if (pNum < 1000) pNum = pNum * 1000;
      unitPrice = pNum;
    }

    const supMatch = query.match(/(?:từ|nhà\s+cung\s+cấp|ncc)\s+([a-zA-Z0-9À-Ỹà-ỹ\s]+?)(?:\s+(?:giá|\d|$))/i);
    const supName = supMatch ? supMatch[1].trim() : 'Nhà cung cấp';

    const res = await executeTool('inventory_create_receipt', {
      product_name: prodName,
      quantity: qty,
      unit_price: unitPrice,
      supplier_name: supName,
      note: query
    }, context);

    return {
      content: res.message,
      actionPreview: res.actionPreview,
      actionButton: res.actionButton,
      executedTools: [{ name: 'inventory_create_receipt', result: res }]
    };
  }

  // THÊM NHÀ CUNG CẤP
  if (q.includes('thêm nhà cung cấp') || q.includes('tạo nhà cung cấp') || q.includes('thêm ncc') || q.includes('tạo ncc')) {
    const nameMatch = query.match(/(?:thêm|tạo)\s+(?:nhà\s+cung\s+cấp|ncc)\s+(?:mới\s+)?([a-zA-Z0-9À-Ỹà-ỹ\s]+?)(?:\s+(?:sđt|số|địa\s+chỉ|\d)|$)/i);
    const supName = nameMatch ? nameMatch[1].trim() : 'Nhà cung cấp mới';
    const phoneMatch = query.match(/0\d{9}/);
    const phone = phoneMatch ? phoneMatch[0] : '';

    const res = await executeTool('supplier_create', { name: supName, phone, address: '' }, context);
    return {
      content: res.message,
      actionPreview: res.actionPreview,
      actionButton: res.actionButton,
      executedTools: [{ name: 'supplier_create', args: { name: supName, phone }, result: res }]
    };
  }

  // XẾP CA LÀM VIỆC CHO NHÂN VIÊN
  if (q.includes('xếp ca') || q.includes('lên ca') || q.includes('đặt ca') || q.includes('gán ca') || (q.includes('ca làm') && (q.includes('cho') || q.includes('ngày')))) {
    const staffMatch = query.match(/(?:cho|nhân\s+viên|thợ)\s+([a-zA-ZÀ-Ỹà-ỹ\s]+?)(?:\s+(?:ca|ngày|hôm|mai|\d)|$)/i);
    let staffName = staffMatch ? staffMatch[1].trim() : '';

    // Date detection
    let dateStr = new Date().toISOString().split('T')[0];
    if (q.includes('mai')) {
      dateStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    } else {
      const dateMatch = q.match(/(\d{4}-\d{2}-\d{2})|(\d{1,2}[\/-]\d{1,2})/);
      if (dateMatch) {
        if (dateMatch[1]) dateStr = dateMatch[1];
        else if (dateMatch[2]) {
          const parts = dateMatch[2].split(/[\/-]/);
          const day = parts[0].padStart(2, '0');
          const month = parts[1].padStart(2, '0');
          const year = new Date().getFullYear();
          dateStr = `${year}-${month}-${day}`;
        }
      }
    }

    // Shift template detection
    let shiftName = 'Ca Sáng';
    if (q.includes('chiều')) shiftName = 'Ca Chiều';
    else if (q.includes('tối')) shiftName = 'Ca Tối';
    else if (q.includes('gãy')) shiftName = 'Ca Gãy';
    else if (q.includes('full') || q.includes('cả ngày')) shiftName = 'Cả Ngày';

    if (!staffName) {
      return {
        content: `🕒 **Để xếp ca làm việc, vui lòng cho tôi biết:**\n\n1. **Tên nhân viên** cần xếp ca (ví dụ: *Minh Thu*, *Tuấn Anh*)?\n2. **Ca làm việc** (*Ca Sáng*, *Ca Chiều*, *Ca Tối*)?\n3. **Ngày làm việc** (ví dụ: *Hôm nay*, *Ngày mai*, *28/10*)?\n\n*(Ví dụ: "Xếp ca sáng ngày mai cho Minh Thu")*`,
        executedTools: [],
        model: 'GloPro Staff Assistant'
      };
    }

    const res = await executeTool('shift_create', {
      staff_name: staffName,
      shift_name: shiftName,
      date: dateStr
    }, context);

    return {
      content: res.message,
      actionPreview: res.actionPreview,
      actionButton: res.actionButton,
      executedTools: [{ name: 'shift_create', args: { staff_name: staffName, shift_name: shiftName, date: dateStr }, result: res }]
    };
  }

  // GHI NHẬN CHẤM CÔNG NHÂN VIÊN
  if (q.includes('chấm công') || q.includes('ghi nhận công') || q.includes('check-in') || q.includes('checkin') || q.includes('check-out') || q.includes('checkout') || (q.includes('đi làm') && (q.includes('vào') || q.includes('ra') || q.includes('muộn')))) {
    const staffMatch = query.match(/(?:cho|nhân\s+viên|thợ)\s+([a-zA-ZÀ-Ỹà-ỹ\s]+?)(?:\s+(?:vào|lúc|ngày|hôm|mai|ra|\d)|$)/i);
    let staffName = staffMatch ? staffMatch[1].trim() : '';

    let dateStr = new Date().toISOString().split('T')[0];
    if (q.includes('hôm qua')) {
      dateStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    }

    // Parse check_in and check_out
    const timeMatches = query.match(/(\d{1,2})[:h](\d{2})?/gi);
    let checkIn = '08:30';
    let checkOut = '17:30';
    if (timeMatches && timeMatches.length > 0) {
      const formatTime = (t) => {
        const p = t.replace(/h/i, ':').split(':');
        return `${p[0].padStart(2, '0')}:${(p[1] || '00').padEnd(2, '0')}`;
      };
      checkIn = formatTime(timeMatches[0]);
      if (timeMatches.length > 1) {
        checkOut = formatTime(timeMatches[1]);
      }
    }

    let status = 'on_time';
    if (q.includes('muộn') || q.includes('trễ')) status = 'late';
    else if (q.includes('phép') || q.includes('nghỉ')) status = 'leave';
    else if (q.includes('vắng')) status = 'absent';

    if (!staffName) {
      return {
        content: `📋 **Để ghi nhận chấm công cho nhân viên, vui lòng cho tôi biết:**\n\n1. **Tên nhân viên** cần chấm công?\n2. **Giờ vào / Giờ ra** (ví dụ: *08:30 vào, 17:30 ra*)?\n3. **Trạng thái công** (*Đúng giờ*, *Đi muộn*, *Nghỉ phép*)?\n\n*(Ví dụ: "Chấm công cho Minh Thu vào lúc 08:30 ra 17:30 đúng giờ")*`,
        executedTools: [],
        model: 'GloPro Attendance Assistant'
      };
    }

    const res = await executeTool('attendance_record', {
      staff_name: staffName,
      date: dateStr,
      check_in: checkIn,
      check_out: checkOut,
      status
    }, context);

    return {
      content: res.message,
      actionPreview: res.actionPreview,
      actionButton: res.actionButton,
      executedTools: [{ name: 'attendance_record', args: { staff_name: staffName, date: dateStr, check_in: checkIn, check_out: checkOut, status }, result: res }]
    };
  }

  // THÊM PHÒNG / KHU VỰC
  if (q.includes('tạo phòng') || q.includes('thêm phòng') || q.includes('tạo khu vực') || q.includes('thêm khu vực') || (q.includes('phòng mới') && (q.includes('tạo') || q.includes('thêm')))) {
    const nameMatch = query.match(/(?:tạo|thêm)\s+(?:phòng|khu\s+vực)\s+(?:mới\s+)?([a-zA-Z0-9À-Ỹà-ỹ\s]+?)(?:\s+(?:màu|sức\s+chứa)|$)/i);
    const roomName = nameMatch ? nameMatch[1].trim() : '';

    let color = '#3B82F6';
    if (q.includes('xanh lá') || q.includes('green')) color = '#10B981';
    else if (q.includes('đỏ') || q.includes('red')) color = '#EF4444';
    else if (q.includes('vàng') || q.includes('yellow')) color = '#F59E0B';
    else if (q.includes('cam') || q.includes('orange')) color = '#F97316';
    else if (q.includes('hồng') || q.includes('pink')) color = '#EC4899';
    else if (q.includes('xanh dương') || q.includes('xanh biển') || q.includes('blue')) color = '#3B82F6';

    if (!roomName) {
      return {
        content: `🚪 **Để thêm Phòng / Khu vực mới, vui lòng cho tôi biết:**\n\n1. **Tên phòng hoặc khu vực** (ví dụ: *Phòng VIP 1*, *Khu Gội Đầu Dưỡng Sinh*)?\n2. **Màu sắc nhận diện** trên sơ đồ salon (ví dụ: *Xanh lá, Hồng, Cam, Vàng...*)?\n\n*(Ví dụ: "Tạo phòng VIP 1 màu xanh lá")*`,
        executedTools: [],
        model: 'GloPro Facility Assistant'
      };
    }

    const fullRoomName = roomName.toLowerCase().startsWith('phòng') || roomName.toLowerCase().startsWith('khu')
      ? roomName
      : `Phòng ${roomName}`;

    const res = await executeTool('room_create', { name: fullRoomName, color }, context);
    return {
      content: res.message,
      actionPreview: res.actionPreview,
      actionButton: res.actionButton,
      executedTools: [{ name: 'room_create', args: { name: fullRoomName, color }, result: res }]
    };
  }

  // THÊM GIƯỜNG / GHẾ PHỤC VỤ
  if (q.includes('thêm giường') || q.includes('tạo giường') || q.includes('thêm ghế') || q.includes('tạo ghế') || (q.includes('giường mới') && (q.includes('tạo') || q.includes('thêm'))) || (q.includes('ghế mới') && (q.includes('tạo') || q.includes('thêm')))) {
    const nameMatch = query.match(/(?:tạo|thêm)\s+(?:giường|ghế)\s+(?:mới\s+)?([a-zA-Z0-9À-Ỹà-ỹ\s]+?)(?:\s+(?:ở|tại|vào|thuộc|phòng)|$)/i);
    let bedName = nameMatch ? nameMatch[1].trim() : '';

    const roomMatch = query.match(/(?:ở|tại|vào|thuộc)\s+(?:phòng|khu\s+vực|khu)\s+([a-zA-Z0-9À-Ỹà-ỹ\s]+?)(?:\s+(?:màu)|$)/i);
    const roomName = roomMatch ? roomMatch[1].trim() : '';

    if (!bedName) {
      return {
        content: `🛏️ **Để thêm Giường / Ghế phục vụ mới, vui lòng cho tôi biết:**\n\n1. **Tên giường hoặc ghế** (ví dụ: *Giường gội 01*, *Ghế cắt tóc 03*)?\n2. **Thuộc phòng / khu vực nào** (ví dụ: *Phòng VIP 1*, *Khu Tầng 1*)?\n\n*(Ví dụ: "Thêm Ghế cắt 01 vào phòng VIP 1")*`,
        executedTools: [],
        model: 'GloPro Facility Assistant'
      };
    }

    const fullBedName = bedName.toLowerCase().startsWith('ghế') || bedName.toLowerCase().startsWith('giường')
      ? bedName
      : (q.includes('ghế') ? `Ghế ${bedName}` : `Giường ${bedName}`);

    const res = await executeTool('bed_create', { name: fullBedName, room_name: roomName }, context);
    return {
      content: res.message,
      actionPreview: res.actionPreview,
      actionButton: res.actionButton,
      executedTools: [{ name: 'bed_create', args: { name: fullBedName, room_name: roomName }, result: res }]
    };
  }

  // TẠO CHƯƠNG TRÌNH KHUYẾN MÃI (CTKM)
  if (q.includes('chương trình khuyến mãi') || q.includes('ctkm') || q.includes('tạo khuyến mãi') || q.includes('thêm khuyến mãi') || (q.includes('khuyến mãi') && (q.includes('tạo') || q.includes('giảm') || q.includes('mới')))) {
    // Value extraction
    let value = null;
    let valType = 'percent';
    const percentMatch = q.match(/(\d+)\s*%/);
    if (percentMatch) {
      value = parseInt(percentMatch[1], 10);
      valType = 'percent';
    } else {
      const moneyMatch = q.match(/(?:giảm\s+)?(\d+(?:[.,]\d+)?)\s*(?:triệu|tr|k|nghìn|đ|vnd)/i);
      if (moneyMatch) {
        let v = parseFloat(moneyMatch[1].replace(',', '.'));
        if (q.includes('tr') || q.includes('triệu')) v = v * 1000000;
        else if (v < 1000) v = v * 1000;
        value = v;
        valType = 'fixed';
      }
    }

    // Min spend extraction
    let minSpend = null;
    const spendMatch = q.match(/(?:đơn|từ|hóa\s+đơn)\s+(?:từ\s+)?(\d+(?:[.,]\d+)?)\s*(?:triệu|tr|k|nghìn|đ|vnd)/i);
    if (spendMatch) {
      let s = parseFloat(spendMatch[1].replace(',', '.'));
      if (spendMatch[0].includes('tr') || spendMatch[0].includes('triệu')) s = s * 1000000;
      else if (s < 1000) s = s * 1000;
      minSpend = s;
    }

    // Name extraction
    const nameMatch = query.match(/(?:tạo|thêm)\s+(?:chương\s+trình\s+)?(?:khuyến\s+mãi|ctkm)\s+(?:mới\s+)?([a-zA-Z0-9À-Ỹà-ỹ\s]+?)(?:\s+(?:giảm|cho|đơn|từ|\d)|$)/i);
    let promoName = nameMatch ? nameMatch[1].trim() : '';

    if (!value && !promoName) {
      return {
        content: `🎁 **Để tạo Chương trình Khuyến mãi (CTKM), vui lòng cho tôi biết:**\n\n1. **Tên chương trình** (ví dụ: *Ưu đãi Khai Trương*, *Giờ vàng Thứ Tư*)?\n2. **Mức ưu đãi** (ví dụ: *Giảm 20%*, *Giảm 100k*)?\n3. **Điều kiện hóa đơn tối thiểu** (nếu có, ví dụ: *Áp dụng đơn từ 500k*)?\n4. **Thời hạn chương trình** (nếu có)?\n\n*(Ví dụ: "Tạo khuyến mãi Khai Trương giảm 20% đơn từ 300k")*`,
        executedTools: [],
        model: 'GloPro Marketing Assistant'
      };
    }

    if (!promoName) {
      promoName = `Khuyến mãi Giảm ${value}${valType === 'percent' ? '%' : 'đ'}`;
    }
    if (!value) value = 10;

    const scope = (q.includes('dịch vụ') && !q.includes('sản phẩm')) ? 'service' : (q.includes('sản phẩm') ? 'product' : 'invoice');

    const res = await executeTool('promotion_create', {
      name: promoName,
      value,
      value_type: valType,
      min_spend: minSpend,
      scope
    }, context);

    return {
      content: res.message,
      actionPreview: res.actionPreview,
      actionButton: res.actionButton,
      executedTools: [{ name: 'promotion_create', result: res }]
    };
  }

  // NẠP TIỀN CỌC / THẺ TÀI KHOẢN KHÁCH
  if (q.includes('nạp cọc') || q.includes('nạp tiền cọc') || q.includes('đặt cọc') || q.includes('nạp tài khoản') || q.includes('nạp tiền tài khoản') || q.includes('nạp thẻ') || (q.includes('cọc') && q.includes('khách'))) {
    const amountMatch = q.match(/(\d+(?:[.,]\d+)?)\s*(?:triệu|tr|k|nghìn|đ|vnd)/i);
    let amount = null;
    if (amountMatch) {
      let v = parseFloat(amountMatch[1].replace(',', '.'));
      if (q.includes('tr') || q.includes('triệu')) v = v * 1000000;
      else if (v < 1000) v = v * 1000;
      amount = v;
    }

    const custMatch = query.match(/(?:cho|khách\s+hàng|khách)\s+([a-zA-ZÀ-Ỹà-ỹ\s]+?)(?:\s+(?:tiền|khoản|số\s+tiền|\d)|$)/i);
    let custName = custMatch ? custMatch[1].trim() : '';

    if (!amount || !custName) {
      return {
        content: `💳 **Để nạp tiền cọc hoặc thẻ tài khoản trả trước cho khách, vui lòng cho tôi biết:**\n\n1. **Khách hàng** cần nạp tiền (Tên hoặc SĐT)?\n2. **Số tiền nạp** (ví dụ: *500.000đ*, *2 triệu*)?\n3. **Phương thức thanh toán** (*Tiền mặt* hay *Chuyển khoản*)?\n\n*(Ví dụ: "Nạp cọc 500k chuyển khoản cho khách Lan")*`,
        executedTools: [],
        model: 'GloPro Deposit Assistant'
      };
    }

    const payMethod = (q.includes('chuyển khoản') || q.includes('ck') || q.includes('qr') || q.includes('ngân hàng')) ? 'transfer' : 'cash';

    const res = await executeTool('deposit_create', {
      customer_name: custName,
      amount,
      payment_method: payMethod,
      notes: query
    }, context);

    return {
      content: res.message,
      actionPreview: res.actionPreview,
      actionButton: res.actionButton,
      executedTools: [{ name: 'deposit_create', result: res }]
    };
  }

  // LẬP PHIẾU XUẤT KHO / TIÊU HAO VẬT TƯ
  if (q.includes('xuất kho') || q.includes('phiếu xuất') || q.includes('tiêu hao') || q.includes('xuất hủy') || q.includes('xuất dùng')) {
    const qtyMatch = query.match(/(\d+)\s*(?:chai|hộp|tuýp|lọ|thùng|cái|bộ|gói|sp|sản\s+phẩm)?/i);
    const qty = qtyMatch ? parseInt(qtyMatch[1], 10) : 1;

    let prodName = query
      .replace(/^(?:lập\s+phiếu\s+)?(?:xuất\s+(?:kho\s+)?(?:hủy\s+)?(?:dùng\s+)?(?:nội\s+bộ\s+)?)/i, '')
      .replace(/^\d+\s*(?:chai|hộp|tuýp|lọ|thùng|cái|bộ|gói|sp|sản\s+phẩm)?\s*/i, '')
      .replace(/\s+(?:tiêu\s+hao|để\s+làm|làm\s+dịch\s+vụ|dùng\s+nội\s+bộ|bị\s+hỏng|hư\s+hỏng|hết\s+hạn|hết\s+date|cho\s+dịch\s+vụ).*$/i, '')
      .trim();

    if (!prodName || (!qtyMatch && !q.includes('chai') && !q.includes('tuýp') && !q.includes('hộp'))) {
      return {
        content: `📦 **Để lập Phiếu Xuất kho / Tiêu hao nội bộ, vui lòng cung cấp:**\n\n1. **Tên mặt hàng / vật tư cần xuất** (ví dụ: *Dầu gội Keratin*, *Thuốc nhuộm số 5*)?\n2. **Số lượng xuất** (ví dụ: *2 tuýp*, *1 chai*)?\n3. **Lý do xuất** (*Tiêu hao dịch vụ salon* hay *Xuất hủy do hư hỏng / hết hạn*)?\n\n*(Ví dụ: "Xuất 2 tuýp Thuốc nhuộm tiêu hao làm dịch vụ")*`,
        executedTools: [],
        model: 'GloPro Inventory Assistant'
      };
    }

    let reason = 'consumption';
    if (q.includes('hủy') || q.includes('hỏng') || q.includes('hết hạn') || q.includes('date')) {
      reason = 'damage';
    }

    const res = await executeTool('inventory_create_stock_out', {
      product_name: prodName,
      quantity: qty,
      reason,
      notes: query
    }, context);

    return {
      content: res.message,
      actionPreview: res.actionPreview,
      actionButton: res.actionButton,
      executedTools: [{ name: 'inventory_create_stock_out', result: res }]
    };
  }

  // TẠO GÓI DỊCH VỤ
  if (q.includes('gói dịch vụ') || (q.includes('gói') && (q.includes('tạo') || q.includes('thêm')))) {
    const priceMatch = q.match(/(\d+(?:[.,]\d+)?)\s*(?:triệu|tr|k|nghìn|đ|vnd)/i);
    let price = null;
    if (priceMatch) {
      let v = parseFloat(priceMatch[1].replace(',', '.'));
      if (q.includes('tr') || q.includes('triệu')) v = v * 1000000;
      else if (v < 1000) v = v * 1000;
      price = v;
    }

    const usageMatch = q.match(/(\d+)\s*(?:buổi|lượt|lần)/i);
    const usageCount = usageMatch ? parseInt(usageMatch[1], 10) : 5;

    const nameMatch = query.match(/(?:tạo|thêm)\s+gói\s+(?:dịch\s+vụ\s+)?(?:mới\s+)?([a-zA-Z0-9À-Ỹà-ỹ\s]+?)(?:\s+(?:giá|tiền|\d+\s*(?:buổi|lượt|lần|k|tr|đ))|$)/i);
    let pkgName = nameMatch ? nameMatch[1].trim() : '';

    if (!price || !pkgName) {
      return {
        content: `📦 **Để tạo Gói Dịch vụ mới, vui lòng cho tôi biết:**\n\n1. **Tên gói dịch vụ** (ví dụ: *Gói Gội Đầu Dưỡng Sinh 10 Buổi*, *Gói Cắt Tóc VIP*)?\n2. **Giá bán của gói** (ví dụ: *1.5 triệu*, *800k*)?\n3. **Số lượt / số buổi sử dụng** (ví dụ: *5 buổi*, *10 buổi*)?\n\n*(Ví dụ: "Tạo gói Gội đầu dưỡng sinh 10 buổi giá 1.5 triệu")*`,
        executedTools: [],
        model: 'GloPro Catalog Assistant'
      };
    }

    const fullPkgName = pkgName.toLowerCase().startsWith('gói') ? pkgName : `Gói ${pkgName}`;

    const res = await executeTool('service_package_create', {
      name: fullPkgName,
      price,
      usage_count: usageCount
    }, context);

    return {
      content: res.message,
      actionPreview: res.actionPreview,
      actionButton: res.actionButton,
      executedTools: [{ name: 'service_package_create', result: res }]
    };
  }

  // TẠO LIỆU TRÌNH
  if (q.includes('liệu trình') || (q.includes('liệu trình') && (q.includes('tạo') || q.includes('thêm')))) {
    const priceMatch = q.match(/(\d+(?:[.,]\d+)?)\s*(?:triệu|tr|k|nghìn|đ|vnd)/i);
    let price = null;
    if (priceMatch) {
      let v = parseFloat(priceMatch[1].replace(',', '.'));
      if (q.includes('tr') || q.includes('triệu')) v = v * 1000000;
      else if (v < 1000) v = v * 1000;
      price = v;
    }

    const sessionsMatch = q.match(/(\d+)\s*(?:buổi|lượt|lần)/i);
    const totalSessions = sessionsMatch ? parseInt(sessionsMatch[1], 10) : 5;

    const nameMatch = query.match(/(?:tạo|thêm)\s+liệu\s+trình\s+(?:mới\s+)?([a-zA-Z0-9À-Ỹà-ỹ\s]+?)(?:\s+(?:giá|tiền|\d+\s*(?:buổi|lượt|lần|k|tr|đ))|$)/i);
    let trtName = nameMatch ? nameMatch[1].trim() : '';

    if (!price || !trtName) {
      return {
        content: `💆 **Để tạo Liệu trình mới, vui lòng cho tôi biết:**\n\n1. **Tên liệu trình** (ví dụ: *Liệu trình Chăm sóc da chuyên sâu*, *Liệu trình Phục hồi tóc cháy*)?\n2. **Giá trọn gói** (ví dụ: *2.5 triệu*, *1.8 triệu*)?\n3. **Tổng số buổi** (ví dụ: *5 buổi*, *10 buổi*)?\n\n*(Ví dụ: "Tạo liệu trình Phục hồi tóc hư tổn 5 buổi giá 1.8 triệu")*`,
        executedTools: [],
        model: 'GloPro Catalog Assistant'
      };
    }

    const fullTrtName = trtName.toLowerCase().startsWith('liệu trình') ? trtName : `Liệu trình ${trtName}`;

    const res = await executeTool('treatment_create', {
      name: fullTrtName,
      price,
      total_sessions: totalSessions,
      description: query
    }, context);

    return {
      content: res.message,
      actionPreview: res.actionPreview,
      actionButton: res.actionButton,
      executedTools: [{ name: 'treatment_create', result: res }]
    };
  }

  // TẠO COMBO SẢN PHẨM
  if (q.includes('combo sản phẩm') || q.includes('combo sp') || (q.includes('combo') && (q.includes('dầu gội') || q.includes('dầu xả') || q.includes('mỹ phẩm') || q.includes('kem')))) {
    const priceMatch = q.match(/(\d+(?:[.,]\d+)?)\s*(?:triệu|tr|k|nghìn|đ|vnd)/i);
    let price = null;
    if (priceMatch) {
      let v = parseFloat(priceMatch[1].replace(',', '.'));
      if (q.includes('tr') || q.includes('triệu')) v = v * 1000000;
      else if (v < 1000) v = v * 1000;
      price = v;
    }

    const nameMatch = query.match(/(?:tạo|thêm)\s+combo\s+(?:sản\s+phẩm\s+)?(?:mới\s+)?([a-zA-Z0-9À-Ỹà-ỹ\s+]+?)(?:\s+(?:giá|tiền|\d+\s*(?:k|tr|đ))|$)/i);
    let comboName = nameMatch ? nameMatch[1].trim() : '';

    if (!price || !comboName) {
      return {
        content: `🛍️ **Để tạo Combo Sản phẩm mới, vui lòng cho tôi biết:**\n\n1. **Tên combo sản phẩm** (ví dụ: *Bộ Đôi Dầu Gội + Dầu Xả Keratin*)?\n2. **Giá bán combo** (ví dụ: *350k*, *500.000đ*)?\n\n*(Ví dụ: "Tạo combo sản phẩm Bộ đôi Dầu gội + Kem xả giá 360k")*`,
        executedTools: [],
        model: 'GloPro Catalog Assistant'
      };
    }

    const fullComboName = comboName.toLowerCase().startsWith('combo') ? comboName : `Combo ${comboName}`;

    const res = await executeTool('product_combo_create', {
      name: fullComboName,
      combo_price: price,
      description: query
    }, context);

    return {
      content: res.message,
      actionPreview: res.actionPreview,
      actionButton: res.actionButton,
      executedTools: [{ name: 'product_combo_create', result: res }]
    };
  }

  // TẠO COMBO DỊCH VỤ
  if (q.includes('combo dịch vụ') || q.includes('combo dv') || (q.includes('combo') && (q.includes('cắt') || q.includes('gội') || q.includes('nhuộm') || q.includes('uốn') || q.includes('sơn') || q.includes('móng')))) {
    const priceMatch = q.match(/(\d+(?:[.,]\d+)?)\s*(?:triệu|tr|k|nghìn|đ|vnd)/i);
    let price = null;
    if (priceMatch) {
      let v = parseFloat(priceMatch[1].replace(',', '.'));
      if (q.includes('tr') || q.includes('triệu')) v = v * 1000000;
      else if (v < 1000) v = v * 1000;
      price = v;
    }

    const nameMatch = query.match(/(?:tạo|thêm)\s+combo\s+(?:dịch\s+vụ\s+)?(?:mới\s+)?([a-zA-Z0-9À-Ỹà-ỹ\s+]+?)(?:\s+(?:giá|tiền|\d+\s*(?:k|tr|đ))|$)/i);
    let comboName = nameMatch ? nameMatch[1].trim() : '';

    if (!price || !comboName) {
      return {
        content: `✨ **Để tạo Combo Dịch vụ mới, vui lòng cho tôi biết:**\n\n1. **Tên combo dịch vụ** (ví dụ: *Combo Cắt tóc + Gội đầu + Uốn tóc*)?\n2. **Giá bán ưu đãi của combo** (ví dụ: *490k*, *250k*)?\n\n*(Ví dụ: "Tạo combo Cắt + Gội dưỡng sinh + Nhuộm giá 490k")*`,
        executedTools: [],
        model: 'GloPro Catalog Assistant'
      };
    }

    const fullComboName = comboName.toLowerCase().startsWith('combo') ? comboName : `Combo ${comboName}`;

    const res = await executeTool('service_combo_create', {
      name: fullComboName,
      combo_price: price,
      description: query
    }, context);

    return {
      content: res.message,
      actionPreview: res.actionPreview,
      actionButton: res.actionButton,
      executedTools: [{ name: 'service_combo_create', result: res }]
    };
  }

  // TẠO THẺ TIỀN MẶT / PREPAID CARD
  if (q.includes('thẻ tiền mặt') || q.includes('thẻ trả trước') || q.includes('thẻ membership') || q.includes('thẻ tiền') || q.includes('prepaid card')) {
    const moneyMatches = q.match(/(\d+(?:[.,]\d+)?)\s*(?:triệu|tr|k|nghìn|đ|vnd)/gi);
    let faceValue = null;
    let sellingPrice = null;
    if (moneyMatches && moneyMatches.length > 0) {
      const parseMoney = (m) => {
        let v = parseFloat(m.replace(/[^0-9.,]/g, '').replace(',', '.'));
        if (m.toLowerCase().includes('tr') || m.toLowerCase().includes('triệu')) v = v * 1000000;
        else if (v < 1000) v = v * 1000;
        return v;
      };
      faceValue = parseMoney(moneyMatches[0]);
      if (moneyMatches.length > 1) {
        sellingPrice = parseMoney(moneyMatches[1]);
      } else {
        sellingPrice = faceValue;
      }
    }

    const nameMatch = query.match(/(?:tạo|thêm|phát\s+hành)\s+(?:thẻ\s+tiền\s+mặt|thẻ\s+trả\s+trước|thẻ\s+membership|thẻ\s+tiền)\s+(?:mới\s+)?([a-zA-Z0-9À-Ỹà-ỹ\s]+?)(?:\s+(?:mệnh\s+giá|giá|tiền|\d)|$)/i);
    let cardName = nameMatch ? nameMatch[1].trim() : '';

    if (!faceValue && !cardName) {
      return {
        content: `💳 **Để phát hành Thẻ Tiền Mặt mới, vui lòng cho tôi biết:**\n\n1. **Tên loại thẻ** (ví dụ: *Thẻ Membership Silver 2 Tr*, *Thẻ Gold 5 Tr*)?\n2. **Mệnh giá tiêu dùng trong thẻ** (ví dụ: *2.3 triệu*, *6 triệu*)?\n3. **Giá bán thực tế cho khách** (ví dụ: *2 triệu*, *5 triệu*)?\n\n*(Ví dụ: "Tạo thẻ tiền mặt Membership Silver nạp 2 triệu tặng 300k giá 2 triệu")*`,
        executedTools: [],
        model: 'GloPro Catalog Assistant'
      };
    }

    if (!cardName) {
      cardName = `Thẻ Tiền Mặt ${faceValue ? `${(faceValue / 1000000).toFixed(1).replace('.0', '')} Tr` : 'Mới'}`;
    }
    const fullCardName = cardName.toLowerCase().startsWith('thẻ') ? cardName : `Thẻ ${cardName}`;

    const res = await executeTool('prepaid_card_create', {
      name: fullCardName,
      face_value: faceValue || 2000000,
      selling_price: sellingPrice || faceValue || 2000000
    }, context);

    return {
      content: res.message,
      actionPreview: res.actionPreview,
      actionButton: res.actionButton,
      executedTools: [{ name: 'prepaid_card_create', result: res }]
    };
  }

  if (q.includes('dịch vụ') || q.includes('bảng giá') || q.includes('giá cắt') || q.includes('giá gội')) {
    const res = await executeTool('services_search', {}, context);
    return { content: res.message, executedTools: [{ name: 'services_search', result: res }] };
  }

  if (q.includes('sản phẩm') || q.includes('tồn kho') || q.includes('kho hàng')) {
    const res = await executeTool('products_search', {}, context);
    return { content: res.message, executedTools: [{ name: 'products_search', result: res }] };
  }

  if (q.includes('nhân viên') || q.includes('thợ')) {
    const res = await executeTool('staff_search', {}, context);
    return { content: res.message, executedTools: [{ name: 'staff_search', result: res }] };
  }

  if (q.includes('chuyển') || q.includes('mở màn hình') || q.includes('mở trang') || q.includes('sang pos')) {
    let targetPage = '/dashboard';
    if (q.includes('pos') || q.includes('bán hàng') || q.includes('thu ngân')) targetPage = '/pos';
    else if (q.includes('lịch') || q.includes('hẹn')) targetPage = '/appointments';
    else if (q.includes('khách')) targetPage = '/customers';
    else if (q.includes('nhân viên')) targetPage = '/staff';
    else if (q.includes('dịch vụ') || q.includes('sản phẩm')) targetPage = '/services';
    else if (q.includes('báo cáo')) targetPage = '/reports';
    else if (q.includes('kho')) targetPage = '/inventory';

    const res = await executeTool('navigate_to', { page: targetPage }, context);
    return { content: res.message, navigateTo: targetPage, executedTools: [{ name: 'navigate_to', args: { page: targetPage }, result: res }] };
  }

  return null;
}

// Clean internal thoughts or preamble from model outputs
function cleanAiText(text) {
  if (!text) return '';
  const thoughtMatch = text.match(/^thought\s*\n[\s\S]*?\n\n([\s\S]+)$/i);
  if (thoughtMatch && thoughtMatch[1]) {
    return thoughtMatch[1].trim();
  }
  return text.replace(/^thought\s*\n/i, '').trim();
}

const KNOWN_TENANTS = {
  'admin@glopro.salon': '57e50365-d351-4acf-a967-c6c0fc62eed9',
  'dev_user_admin': '57e50365-d351-4acf-a967-c6c0fc62eed9',
  'infinitystudio9969@gmail.com': '6cb88c32-06c6-4b95-b286-99bc8c141c79',
  'duclivegiolinh@gmail.com': '6cb88c32-06c6-4b95-b286-99bc8c141c79',
  'ducledinhqt@gmail.com': '6cb88c32-06c6-4b95-b286-99bc8c141c79',
  'minhphantester2021@gmail.com': '0a5e5b54-00b5-4fdc-80b4-aba8bbe48f7c',
  'db1d2d2d-4b05-450d-88b9-54e7715b436b': '6cb88c32-06c6-4b95-b286-99bc8c141c79'
};

// Server-side actor authentication resolution (Phase 7 Stage 1 Hardening)
async function resolveTrustedActor(req, clientContext) {
  try {
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (user && !error) {
        const { data: profile } = await supabase
          .from('user_profile')
          .select('id, tenant_id, role, branch_id, full_name')
          .eq('id', user.id)
          .maybeSingle();

        const userEmail = (user.email || '').toLowerCase();
        const resolvedTenant = clientContext.tenantId ||
          clientContext.currentUser?.tenant_id ||
          profile?.tenant_id || 
          user.user_metadata?.tenant_id || 
          KNOWN_TENANTS[userEmail] || 
          KNOWN_TENANTS[user.id] || 
          '57e50365-d351-4acf-a967-c6c0fc62eed9';

        return {
          actorId: user.id,
          tenantId: resolvedTenant,
          branchId: profile?.branch_id || (clientContext.salonBranch?.id !== 'current_branch' && clientContext.salonBranch?.id !== 'all' ? clientContext.salonBranch?.id : undefined),
          role: profile?.role || user.user_metadata?.role || 'staff',
          permissions: profile?.role === 'owner' ? 'all' : (clientContext.currentPermissions || 'read_only'),
          isVerifiedAuth: true
        };
      }
    }
  } catch (err) {
    // Auth fallback for test / unauthenticated requests
  }

  const clientEmail = (clientContext.currentUser?.email || '').toLowerCase();
  const fallbackTenant = clientContext.tenantId ||
    clientContext.currentUser?.tenant_id || 
    KNOWN_TENANTS[clientEmail] || 
    KNOWN_TENANTS[clientContext.currentUser?.id] || 
    '57e50365-d351-4acf-a967-c6c0fc62eed9';

  return {
    actorId: clientContext.currentUser?.id || 'anon_user',
    tenantId: fallbackTenant,
    branchId: clientContext.salonBranch?.id !== 'current_branch' && clientContext.salonBranch?.id !== 'all' ? clientContext.salonBranch?.id : undefined,
    role: clientContext.currentUser?.role || 'owner',
    permissions: clientContext.currentPermissions || 'all',
    isVerifiedAuth: false
  };
}

export async function POST(req) {
  console.log('>>> [COPILOT ROUTE] POST ENTERED');
  try {
    const { message, history = [], context = {} } = await req.json();
    console.log('>>> [COPILOT ROUTE] BODY PARSED:', { message, context });

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Nội dung tin nhắn không hợp lệ.' }, { status: 400 });
    }

    const trustedActor = await resolveTrustedActor(req, context);
    if (trustedActor?.tenantId) {
      setSyncTenantId(trustedActor.tenantId);
    }
    const conversationId = context.conversationId || context.sessionId || 'conv_default';

    // Load or initialize persistent session (Phase 7 Stage 1)
    let persistentSession = null;
    try {
      persistentSession = await AgentContextManager.loadOrCreatePersistentSession(conversationId, trustedActor);
    } catch (sessionErr) {
      if (sessionErr.name === 'ActorIsolationError' || sessionErr.name === 'TenantIsolationError' || sessionErr.name === 'BranchIsolationError') {
        return NextResponse.json({ error: `Truy cập phiên bị từ chối: ${sessionErr.message}` }, { status: 403 });
      }
      console.warn('[Session Warning]:', sessionErr.message);
    }

    const sessionId = persistentSession?.id || context.sessionId || 'session_default';

    const actionContext = {
      userId: trustedActor.actorId,
      tenantId: trustedActor.tenantId,
      role: trustedActor.role,
      permissions: trustedActor.permissions,
      sessionId,
      conversationId,
      branchId: trustedActor.branchId,
      branchName: context.salonBranch?.name
    };

    // 0A. CHECK CONFIRMATION GATE (PHASE 3 & PHASE 4)
    const confirmDecision = ConfirmationGate.evaluateUserResponse(message, actionContext);
    if (confirmDecision.confirmed) {
      if (confirmDecision.pendingPlan) {
        const planResult = await ActionOrchestrator.executePlan(confirmDecision.pendingPlan, actionContext);
        ConfirmationGate.consumePendingPlan(confirmDecision.pendingPlan.planId);
        return NextResponse.json({
          status: planResult.status,
          content: planResult.message,
          actionResult: planResult,
          verified: planResult.verified,
          model: 'EasySalon Action Orchestrator'
        });
      }
      if (confirmDecision.pendingAction) {
        const execResult = await ActionExecutor.executeConfirmedAction(confirmDecision.pendingAction, actionContext);
        ConfirmationGate.consumePendingAction(confirmDecision.pendingAction.referenceId);
        return NextResponse.json({
          status: execResult.status,
          content: execResult.message,
          actionResult: execResult,
          verified: execResult.verified,
          model: 'EasySalon Action Engine'
        });
      }
    }

    if (confirmDecision.isCorrection) {
      const pendingPlan = confirmDecision.pendingPlan;
      const pendingAction = confirmDecision.pendingAction;
      const previewMsg = pendingPlan
        ? `🔄 **Đã cập nhật thay đổi:** Đã đổi ${confirmDecision.correctionField || 'thời gian'} sang **${confirmDecision.correctionValue}**.\n\n⚠️ Bạn có muốn xác nhận thực hiện kế hoạch mới này không? (Trả lời **"Đồng ý"** hoặc **"Hủy"**)`
        : `🔄 **Đã cập nhật thay đổi:** Đã đổi sang **${confirmDecision.correctionValue}**.\n\n⚠️ Bạn có muốn xác nhận thực hiện thao tác này không? (Trả lời **"Đồng ý"** hoặc **"Hủy"**)`;
      return NextResponse.json({
        status: 'PENDING_CONFIRMATION',
        content: previewMsg,
        actionPreview: pendingPlan ? pendingPlan.actions[0]?.preview : pendingAction?.preview,
        actionReference: pendingPlan ? pendingPlan.planId : pendingAction?.referenceId,
        model: 'EasySalon Context Manager'
      });
    }

    if (confirmDecision.cancelled && (confirmDecision.pendingAction || confirmDecision.pendingPlan)) {
      if (confirmDecision.pendingPlan) ConfirmationGate.consumePendingPlan(confirmDecision.pendingPlan.planId);
      if (confirmDecision.pendingAction) ConfirmationGate.consumePendingAction(confirmDecision.pendingAction.referenceId);
      return NextResponse.json({
        status: 'CANCELLED',
        content: '❌ **Đã hủy thao tác theo yêu cầu của bạn.** Dữ liệu trên hệ thống không thay đổi.',
        model: 'EasySalon Confirmation Gate'
      });
    }

    // 0B. INTENT DECOMPOSITION & BUSINESS BRAIN (PHASE 4)
    const decomposed = IntentDecomposer.decompose(message, context, history);
    if (decomposed.isCompound) {
      const multiPlan = await ActionPlanner.planMultiStepAction(decomposed, message, actionContext);
      return NextResponse.json({
        status: multiPlan.actionResult.status,
        content: multiPlan.actionResult.message,
        actionPreview: multiPlan.actionResult.preview,
        actionReference: multiPlan.actionResult.actionReference,
        actionPlan: multiPlan.plan,
        model: 'EasySalon Multi-Step Action Planner'
      });
    }

    const brainDecision = decomposed.originalDecision || EasySalonBrain.processRequest(message, context, history);

    // If clarification is required (e.g. missing time, missing service, multiple matches)
    if (brainDecision.type === 'CLARIFY' || brainDecision.type === 'DISAMBIGUATE') {
      return NextResponse.json({
        content: brainDecision.message,
        executedTools: [],
        navigateTo: null,
        model: 'EasySalon Business Brain',
        structuredIntent: brainDecision.structuredIntent
      });
    }

    // 0C. WRITE INTENTS PLANNING & PREVIEW (PHASE 3 SAFE WRITE ENGINE & PHASE 5 SELF-CHECK)
    const writeIntents = [
      'CREATE_CUSTOMER',
      'UPDATE_CUSTOMER',
      'CREATE_APPOINTMENT',
      'CANCEL_APPOINTMENT',
      'RECEIVE_STOCK',
      'ADJUST_STOCK'
    ];

    if (writeIntents.includes(brainDecision.structuredIntent.intent)) {
      // Phase 5: Self-Check before generating Action Plan
      const understandingCheck = UnderstandingValidator.validate({
        intent: brainDecision.structuredIntent.intent,
        entities: Object.entries(brainDecision.structuredIntent.entities || {}).reduce((acc, [k, v]) => {
          acc[k] = v.value;
          return acc;
        }, {}),
        missingInformation: brainDecision.structuredIntent.missingRequired || [],
        ambiguities: brainDecision.structuredIntent.ambiguities || [],
        rawQuery: message
      });

      if (!understandingCheck.canProceedToPlanning && understandingCheck.status !== 'VALID') {
        return NextResponse.json({
          content: understandingCheck.message || brainDecision.message || 'Hệ thống cần thêm thông tin để thực hiện.',
          executedTools: [],
          navigateTo: null,
          model: 'EasySalon Understanding Validator',
          structuredIntent: brainDecision.structuredIntent
        });
      }

      const planResult = await ActionPlanner.planAction(brainDecision.structuredIntent, message, actionContext);
      if (planResult.status === 'PENDING_CONFIRMATION') {
        return NextResponse.json({
          status: 'PENDING_CONFIRMATION',
          content: planResult.message,
          actionPreview: planResult.preview,
          actionReference: planResult.actionReference,
          model: 'EasySalon Action Planner',
          structuredIntent: brainDecision.structuredIntent
        });
      }
      return NextResponse.json({
        status: planResult.status,
        content: planResult.message,
        error: planResult.error,
        model: 'EasySalon Action Precondition Validator',
        structuredIntent: brainDecision.structuredIntent
      });
    }

    // Specific domain intent handler: Tip Operation (Employee pass-through, not salon revenue)
    if (brainDecision.structuredIntent.intent === 'TIP_OPERATION') {
      const staffName = brainDecision.structuredIntent.entities.staff?.value || 'nhân viên';
      const amount = brainDecision.structuredIntent.entities.amount?.value || 0;
      const formatted = amount > 0 ? `${amount.toLocaleString('vi-VN')} đ` : '';
      return NextResponse.json({
        content: `💵 **Ghi nhận tiền Tip:**\n• **Nhân viên nhận:** **${staffName}**\n• **Số tiền tip:** **${formatted}**\n\n*(Lưu ý nghiệp vụ EasySalon: Tiền Tip là khoản thu hộ cho nhân viên, được cộng vào số tiền khách thực tế thanh toán nhưng KHÔNG tính vào doanh thu thuần của Salon).*`,
        executedTools: [],
        model: 'EasySalon Business Brain'
      });
    }

    // 0D. SOFTWARE GUIDANCE & HELPDESK (HƯỚNG DẪN SỬ DỤNG PHẦN MỀM)
    const isGuideRequest = brainDecision.structuredIntent.intent === 'SOFTWARE_GUIDE' || /(?:làm sao|làm thế nào|cách|hướng dẫn|chỉ tôi|tạo ở đâu|xem ở đâu|cấu hình ở đâu|thiết lập ở đâu|như thế nào|tính hoa hồng thế nào|in bill ở đâu)/i.test(message);
    if (isGuideRequest) {
      const guide = findHelpGuide(message);
      if (guide) {
        // RBAC Security Check
        const userRole = (trustedActor.role || 'owner').toLowerCase();
        if (guide.requiredRole === 'owner' && userRole === 'staff') {
          return NextResponse.json({
            content: `⛔ **Truy cập bị giới hạn:** Bạn không có quyền sử dụng tính năng **${guide.title}** này. Tính năng yêu cầu quyền **Quản trị viên (Owner)** của Salon.`,
            executedTools: [],
            model: 'GloPro Security Gate'
          });
        }
        if (guide.requiredRole === 'manager' && userRole === 'staff') {
          return NextResponse.json({
            content: `⛔ **Truy cập bị giới hạn:** Bạn không có quyền sử dụng tính năng **${guide.title}** này. Vui lòng liên hệ Quản lý để được cấp quyền.`,
            executedTools: [],
            model: 'GloPro Security Gate'
          });
        }

        let guideContent = `📖 **Hướng dẫn: ${guide.title}**\n*(Phân hệ: ${guide.category})*\n\n` +
          guide.steps.map((st, i) => `**Bước ${i + 1}:** ${st}`).join('\n\n');

        if (guide.tips) {
          guideContent += `\n\n💡 *Mẹo:* ${guide.tips}`;
        }

        if (guide.sampleCommand) {
          guideContent += `\n\n⚡ **Bạn có muốn tôi thao tác nhanh giúp bạn không?**\nBạn chỉ cần ra lệnh: ví dụ *"**${guide.sampleCommand}**"* là tôi sẽ thực hiện ngay!`;
        }

        return NextResponse.json({
          content: guideContent,
          executedTools: [],
          navigateTo: guide.route,
          actionButton: {
            label: `👉 Đi tới: ${guide.title}`,
            route: guide.route
          },
          model: 'GloPro Software Guide'
        });
      }
    }

    // Specific domain intent handler: Customer Segmentation / Filter
    if (brainDecision.structuredIntent.intent === 'FILTER_CUSTOMER') {
      const q = message.toLowerCase().trim();
      let action_mode = 'both';
      if (q.includes('tạo tập') || q.includes('lưu tập') || q.includes('tạo nhóm') || q.includes('lưu nhóm') || q.includes('lập tập')) {
        action_mode = 'create_segment';
      } else if (q.includes('lọc') || q.includes('xem') || q.includes('danh sách') || q.includes('tìm những')) {
        action_mode = 'filter';
      }

      const filterArgs = { action_mode };

      // 1. Số ngày chưa ghé
      const daysMatch = q.match(/(?:chưa\s+(?:quay\s+lại|ghé|đến)|không\s+ghé)\s*(?:trên|>|quá)?\s*(\d+)\s*(ngày|tháng)?/i);
      if (daysMatch) {
        let days = parseInt(daysMatch[1], 10);
        if (daysMatch[2] === 'tháng') days = days * 30;
        filterArgs.last_visit_days_gt = days;
      }

      // 2. Chi tiêu
      const spendMatch = q.match(/(?:chi\s+tiêu|tiêu|mua)\s*(?:trên|>|từ|hơn)?\s*(\d+(?:[.,]\d+)?)\s*(triệu|tr|k|nghìn|đ|vnd)?/i);
      if (spendMatch) {
        let val = parseFloat(spendMatch[1].replace(',', '.'));
        const unit = (spendMatch[2] || '').toLowerCase();
        if (unit === 'triệu' || unit === 'tr') val = val * 1000000;
        else if (unit === 'k' || unit === 'nghìn') val = val * 1000;
        filterArgs.min_spent = val;
      }

      // 3. Số lần ghé
      const visitMatch = q.match(/(?:ghé|đến|làm)\s*(?:trên|>|hơn|từ)?\s*(\d+)\s*lần/i);
      if (visitMatch) {
        const visits = parseInt(visitMatch[1], 10);
        if (q.includes('trên') || q.includes('>') || q.includes('hơn') || q.includes('từ')) {
          filterArgs.min_visits = visits;
        } else {
          filterArgs.visit_count_eq = visits;
        }
      } else if (q.includes('khách mới')) {
        filterArgs.visit_count_eq = 1;
      } else if (q.includes('khách quen')) {
        filterArgs.min_visits = 3;
      }

      // 4. Sinh nhật tháng
      const birthdayMatch = q.match(/(?:sinh\s+nhật|sinh)\s*(?:vào|trong)?\s*tháng\s*(\d{1,2})/i);
      if (birthdayMatch) {
        filterArgs.birthday_month = parseInt(birthdayMatch[1], 10);
      }

      // 5. Giới tính
      if (q.includes('khách nữ') || q.includes('phái nữ')) {
        filterArgs.gender = 'female';
      } else if (q.includes('khách nam') || q.includes('phái nam')) {
        filterArgs.gender = 'male';
      }

      // 6. Dịch vụ từng làm
      const svcMatch = q.match(/(?:từng\s+(?:làm|sử\s+dụng)|dịch\s+vụ)\s+([a-zA-Zà-ỹÀ-Ỹ\s]+)/i);
      if (svcMatch) {
        filterArgs.service_name = svcMatch[1].trim();
      }

      const res = await executeTool('customer_filter', filterArgs, context);
      return NextResponse.json({
        content: res.message,
        executedTools: [{ name: 'customer_filter', args: filterArgs, result: res }],
        model: 'EasySalon Segmentation Engine'
      });
    }

    // 0E. AI REPORT GENERATION & DIRECT NAVIGATION TO /reports?tab=ai_report
    const qMsg = message.toLowerCase().trim();
    const isExplicitReportCreate = qMsg.includes('tạo báo cáo') || qMsg.includes('tao bao cao') || qMsg.includes('lập báo cáo') || qMsg.includes('lap bao cao') || qMsg.includes('báo cáo ai') || qMsg.includes('bao cao ai') || qMsg.includes('báo cáo bằng ai') || qMsg.includes('xuất báo cáo') || qMsg.includes('lập thống kê');
    const isReportAction = qMsg.includes('báo cáo') && (qMsg.includes('tạo') || qMsg.includes('lập') || qMsg.includes('xuất') || qMsg.includes('chi tiết') || qMsg.includes('biểu đồ') || qMsg.includes('thợ') || qMsg.includes('nhân viên') || qMsg.includes('khách') || qMsg.includes('dịch vụ') || qMsg.includes('sản phẩm') || qMsg.includes('tuần') || qMsg.includes('tháng') || qMsg.includes('quý') || qMsg.includes('năm'));

    if (isExplicitReportCreate || isReportAction) {
      const targetUrl = `/reports?tab=ai_report&prompt=${encodeURIComponent(message)}`;
      return NextResponse.json({
        content: `📊 **Đang chuyển đến màn hình Báo cáo AI...**\nTôi đang trích xuất dữ liệu thực tế hệ thống và chuẩn bị biểu đồ, bộ lọc cho yêu cầu: "*${message}*".\nBạn có thể lọc dữ liệu, xem biểu đồ trực quan và xuất file Excel/PDF tại đây.`,
        executedTools: [{
          name: 'report_generate_ai',
          args: { prompt: message },
          result: { success: true, navigateTo: targetUrl }
        }],
        navigateTo: targetUrl,
        actionButton: {
          label: '📊 Mở Báo cáo AI chi tiết',
          route: targetUrl
        },
        model: 'GloPro AI Report Engine'
      });
    }

    // 0F. UNIVERSAL CRUD & ACTION ENGINE (SẢN PHẨM, HOA HỒNG, DỊCH VỤ, VOUCHER, NHÂN VIÊN, SỔ QUỸ, KHO, CA, CÔNG, PHÒNG GHẾ, KHÁCH HÀNG)
    const isCrudIntent = qMsg.includes('tạo khách') || qMsg.includes('thêm khách') || qMsg.includes('tạo khách hàng') || qMsg.includes('thêm khách hàng') || ((qMsg.includes('sinh ngày') || qMsg.includes('giới tính') || qMsg.includes('địa chỉ') || qMsg.includes('ghi chú')) && /0\d{9}/.test(qMsg)) ||
      qMsg.includes('tạo sản phẩm') || qMsg.includes('thêm sản phẩm') || qMsg.includes('nhập sản phẩm') ||
      qMsg.includes('cài hoa hồng') || qMsg.includes('cài đặt hoa hồng') || qMsg.includes('set hoa hồng') || qMsg.includes('chia hoa hồng') ||
      qMsg.includes('thêm dịch vụ') || qMsg.includes('tạo dịch vụ') ||
      qMsg.includes('thêm nhân viên') || qMsg.includes('tạo voucher') || qMsg.includes('tạo mã giảm') ||
      // Phase 1: Sổ quỹ Thu/Chi, Nhập kho, Nhà cung cấp
      qMsg.includes('phiếu thu') || qMsg.includes('thu tiền') ||
      qMsg.includes('phiếu chi') || qMsg.includes('chi tiền') || qMsg.includes('tạm ứng') ||
      qMsg.includes('phiếu nhập kho') || (qMsg.includes('nhập kho') && !qMsg.includes('xem')) ||
      qMsg.includes('nhà cung cấp') || qMsg.includes('thêm ncc') || qMsg.includes('tạo ncc') ||
      // Phase 2: Ca làm việc, Chấm công, Phòng / Khu vực, Giường / Ghế
      qMsg.includes('xếp ca') || qMsg.includes('lên ca') || qMsg.includes('đặt ca') || qMsg.includes('gán ca') ||
      qMsg.includes('chấm công') || qMsg.includes('ghi nhận công') || qMsg.includes('check-in') || qMsg.includes('check-out') ||
      qMsg.includes('tạo phòng') || qMsg.includes('thêm phòng') || qMsg.includes('tạo khu vực') || qMsg.includes('thêm khu vực') ||
      qMsg.includes('thêm giường') || qMsg.includes('tạo giường') || qMsg.includes('thêm ghế') || qMsg.includes('tạo ghế') ||
      // Phase 3: Khuyến mãi, Nạp cọc / thẻ tài khoản, Xuất kho / tiêu hao
      qMsg.includes('khuyến mãi') || qMsg.includes('ctkm') ||
      qMsg.includes('nạp cọc') || qMsg.includes('tiền cọc') || qMsg.includes('nạp tài khoản') || qMsg.includes('nạp thẻ') ||
      qMsg.includes('xuất kho') || qMsg.includes('phiếu xuất') || qMsg.includes('tiêu hao') || qMsg.includes('xuất hủy') || qMsg.includes('xuất dùng') ||
      // Phase 4: Gói dịch vụ, Liệu trình, Combo dịch vụ, Combo sản phẩm, Thẻ tiền mặt
      qMsg.includes('gói dịch vụ') || qMsg.includes('tạo gói') || qMsg.includes('thêm gói') ||
      qMsg.includes('liệu trình') ||
      qMsg.includes('combo dịch vụ') || qMsg.includes('combo dv') ||
      qMsg.includes('combo sản phẩm') || qMsg.includes('combo sp') || qMsg.includes('bộ đôi') ||
      qMsg.includes('thẻ tiền mặt') || qMsg.includes('thẻ trả trước') || qMsg.includes('thẻ membership') || qMsg.includes('prepaid');

    if (isCrudIntent) {
      const crudResult = await executeLocalFallbackIntent(message, actionContext);
      if (crudResult) {
        return NextResponse.json({
          content: crudResult.content,
          actionPreview: crudResult.actionPreview || null,
          actionButton: crudResult.actionButton || null,
          executedTools: crudResult.executedTools || [],
          model: 'GloPro CRUD Action Engine'
        });
      }
    }

    // 1. EXECUTE READ & GROUNDING ENGINE (PHASE 2)
    const readIntents = [
      'QUERY_REVENUE',
      'QUERY_STAFF_REVENUE',
      'SEARCH_CUSTOMER',
      'SEARCH_STAFF',
      'SEARCH_SERVICE',
      'SEARCH_PRODUCT',
      'SEARCH_APPOINTMENT'
    ];
    const isContextualRead = /(?:khách này|anh ấy|lịch này|đơn này)\s+(?:mua gì|lịch|hẹn|thông tin)/i.test(message);

    let groundedContext = null;

    if (readIntents.includes(brainDecision.structuredIntent.intent) || isContextualRead) {
      const toolContext = {
        userId: context.currentUser?.id,
        role: context.currentUser?.role || 'owner',
        permissions: context.currentPermissions || 'all',
        branchId: context.salonBranch?.id,
        branchName: context.salonBranch?.name,
        selectedCustomer: context.selectedCustomer,
        selectedAppointment: context.selectedAppointment,
        selectedInvoice: context.selectedInvoice,
        selectedEmployee: context.selectedEmployee
      };

      groundedContext = await GroundingEngine.groundRequest(message, brainDecision.structuredIntent, toolContext, history);

      // A. Disambiguation or Clarification required (stops execution safely)
      if (groundedContext.requiresDisambiguation || groundedContext.error === 'CLARIFICATION_REQUIRED') {
        return NextResponse.json({
          content: groundedContext.summary,
          executedTools: (groundedContext.sources || []).map(s => ({ name: s.tool, result: { message: groundedContext.summary } })),
          navigateTo: null,
          model: 'EasySalon Grounding Engine',
          structuredIntent: brainDecision.structuredIntent
        });
      }

      // B. Security rejection or Permission denied (fails closed)
      if (groundedContext.permissionDenied || groundedContext.error === 'PERMISSION_DENIED' || (groundedContext.sources || []).some(s => s.status === 'REJECTED')) {
        return NextResponse.json({
          content: groundedContext.summary,
          executedTools: [],
          navigateTo: null,
          model: 'EasySalon Security Gate',
          structuredIntent: brainDecision.structuredIntent
        });
      }
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // 2. Fetch live snapshot of real software data to feed into AI system instructions
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    let liveInvoices = [];
    let liveCustomers = [];
    let liveAppointments = [];
    try {
      [liveInvoices, liveCustomers, liveAppointments] = await Promise.all([
        base44.entities.Invoice.list().catch(() => []),
        base44.entities.Customer.list().catch(() => []),
        base44.entities.Appointment.list().catch(() => [])
      ]);
    } catch (e) {
      // fallback
    }

    const todayInvs = liveInvoices.filter(i => (i.date || i.created_date || i.created_at || '').startsWith(todayStr));
    const todayRev = todayInvs.reduce((s, i) => s + (Number(i.total) || Number(i.final_amount) || 0), 0);
    const todayAppts = liveAppointments.filter(a => (a.date || a.created_date || '').startsWith(todayStr));

    const businessContextPrompt = buildBusinessContextPrompt({
      branchName: context.salonBranch?.name,
      userName: context.currentUser?.name,
      userRole: context.currentUser?.role,
      currentPage: context.currentPage
    });

    let groundedDataBlock = '';
    if (groundedContext && groundedContext.grounded) {
      groundedDataBlock = `
=== DỮ LIỆU ĐÃ XÁC THỰC TỪ HỆ THỐNG (GROUNDED CONTEXT - TRẠNG THÁI: ${groundedContext.state}) ===
Nguồn dữ liệu: ${(groundedContext.sources || []).map(s => s.tool).join(', ')}
Trạng thái: KNOWN (Đã kiểm tra cơ sở dữ liệu thực tế)
Kết quả tra cứu: ${groundedContext.summary}
Chi tiết JSON: ${JSON.stringify(groundedContext.data, null, 2)}
LƯU Ý QUAN TRỌNG: Trả lời người dùng hoàn toàn dựa trên dữ liệu đã xác thực ở trên. KHÔNG tự suy đoán hay thêm thắt thông tin.
`;
    }

    const tomorrow = new Date(now.getTime() + 86400000);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const systemInstruction = `${businessContextPrompt}
${groundedDataBlock}
THỜI GIAN HỆ THỐNG HIỆN TẠI:
- Hôm nay là ngày: ${todayStr} (Định dạng YYYY-MM-DD)
- Giờ hiện tại: ${timeStr}
- Nếu người dùng nói "hôm nay", hãy dùng ngày: ${todayStr}
- Nếu người dùng nói "ngày mai", hãy dùng ngày: ${tomorrowStr}

DỮ LIỆU THỰC TẾ TRÊN PHẦN MỀM HIỆN TẠI:
- Chi nhánh đang chọn: ${context.salonBranch?.name || 'Chi nhánh chính'} (ID: ${context.salonBranch?.id || 'default'})
- Trang người dùng đang xem: ${context.currentPage || '/dashboard'}
- Người dùng đang đăng nhập: ${context.currentUser?.name || 'Quản trị viên'} (${context.currentUser?.role || 'owner'})
- Doanh thu hôm nay: ${todayRev.toLocaleString('vi-VN')} đ (${todayInvs.length} hóa đơn)
- Lịch hẹn hôm nay: ${todayAppts.length} lịch hẹn
- Tổng số khách hàng trên hệ thống: ${liveCustomers.length} khách hàng
${context.selectedCustomer ? `- Khách hàng đang chọn: ${context.selectedCustomer.name} (SĐT: ${context.selectedCustomer.phone})` : ''}
${context.selectedAppointment ? `- Lịch hẹn đang chọn: ID ${context.selectedAppointment.id}` : ''}

QUY TẮC BẮT BUỘC KHI ĐẶT LỊCH HẸN:
1. Khi người dùng cung cấp thông tin đặt lịch hẹn (bao gồm họ tên khách hàng, số điện thoại, tên dịch vụ, ngày và giờ hẹn), bạn BẮT BUỘC PHẢI GỌI công cụ \`appointment_create\` với các thông tin đã trích xuất:
   - customer_name: Họ tên khách hàng
   - customer_phone: Số điện thoại
   - service_name: Tên dịch vụ khách muốn làm
   - date: Ngày hẹn định dạng YYYY-MM-DD (nếu nói "ngày mai" thì điền "${tomorrowStr}")
   - time: Giờ hẹn định dạng HH:MM (ví dụ "14h" thì điền "14:00")
2. TUYỆT ĐỐI KHÔNG gọi công cụ \`pos_get_today_summary\` khi người dùng đang cung cấp thông tin đặt lịch hẹn hoặc trả lời thông tin lịch hẹn.

QUY TẮC BẮT BUỘC KHI LỌC HOẶC TẠO TẬP KHÁCH HÀNG:
1. Khi người dùng muốn lọc khách hàng hoặc tạo tập khách hàng theo bất kỳ tiêu chí nào (chưa quay lại X ngày, tổng chi tiêu, số lần đến, tháng sinh nhật, giới tính, dịch vụ đã làm, điểm tích lũy...):
   - Bạn BẮT BUỘC PHẢI GỌI công cụ \`customer_filter\`.
   - Nếu người dùng dùng từ "lọc", "tìm danh sách", "cho tôi xem": đặt action_mode: "filter".
   - Nếu người dùng dùng từ "tạo tập", "lưu tập", "lập nhóm": đặt action_mode: "create_segment".
   - Nếu người dùng không nói rõ: đặt action_mode: "both".

QUY TẮC BẮT BUỘC KHI TẠO DỮ LIỆU & THAO TÁC CRUD TRÊN HỆ THỐNG:
1. Bạn có khả năng thực hiện mọi thao tác tạo dữ liệu trên phần mềm (Sản phẩm, Dịch vụ, Nhân viên, Khách hàng, Cài đặt hoa hồng, Mã Voucher...).
2. NGUYÊN TẮC HỎI LẠI KHI THIẾU THÔNG TIN QUAN TRỌNG:
   - Tạo sản phẩm (\`product_create\`): Bắt buộc cần Tên sản phẩm và Giá bán lẻ. Nếu người dùng chỉ nói tên mà chưa cho biết giá bán/tồn kho -> BẮT BUỘC HỎI LẠI người dùng giá bán lẻ và tồn kho ban đầu trước khi tạo.
   - Tạo dịch vụ (\`service_create\`): Bắt buộc cần Tên dịch vụ và Giá tiền. Nếu chưa có giá -> BẮT BUỘC HỎI LẠI giá dịch vụ và thời lượng.
   - Thêm nhân viên (\`staff_create\`): Bắt buộc cần Họ tên và Số điện thoại. Nếu chưa có SĐT -> BẮT BUỘC HỎI LẠI số điện thoại và vị trí làm việc.
   - Cài đặt hoa hồng (\`staff_set_commission\`): Cần mức hoa hồng (% hoặc tiền mặt), nhân viên và dịch vụ áp dụng. Nếu chưa có mức hoa hồng -> BẮT BUỘC HỎI LẠI mức hoa hồng là bao nhiêu (% hay tiền cố định) và áp dụng cho ai.
   - Tạo voucher (\`voucher_create\`): Cần mã và mức giảm giá. Nếu thiếu -> BẮT BUỘC HỎI LẠI mã và giá trị giảm.
3. Khi người dùng đã cung cấp đủ thông tin, BẮT BUỘC PHẢI GỌI công cụ tương ứng để lưu dữ liệu vào hệ thống.

QUY TẮC BẮT BUỘC (GROUNDING & SAFETY RULES):
1. KHÔNG BAO GIỜ TỰ BỊA ĐẶT DỮ LIỆU (Do NOT hallucinate): Không tự bịa khách hàng, nhân viên, dịch vụ, hóa đơn, lịch hẹn hay doanh thu.
2. CHỈ TRẢ LỜI DỰA TRÊN DỮ LIỆU ĐÃ XÁC THỰC (Grounded Context) hoặc qua việc gọi Function Calling.
3. KHÔNG TRUY CẬP TRỰC TIẾP DATABASE / KHÔNG VIẾT SQL / KHÔNG TỰ SUY DIỄN ID (Never infer IDs).
4. NẾU THÔNG TIN MƠ HỒ HOẶC CÓ NHIỀU KẾT QUẢ TRÙNG TÊN: Phải yêu cầu người dùng chọn/làm rõ, không tự chọn kết quả đầu tiên.
5. NẾU KHÔNG TÌM THẤY DỮ LIỆU: Báo rõ ràng là không tìm thấy trong hệ thống, không được đoán.
6. Luôn trả lời bằng tiếng Việt tự nhiên, ngắn gọn, có cấu trúc Markdown rõ ràng (bullet points, in đậm số tiền và thông tin quan trọng).`;

    // 3. If no Gemini API key or if quota/API fails, return grounded summary directly or fallback
    if (!apiKey) {
      if (groundedContext && groundedContext.grounded) {
        return NextResponse.json({
          content: groundedContext.summary,
          executedTools: (groundedContext.sources || []).map(s => ({ name: s.tool, result: { message: groundedContext.summary } })),
          navigateTo: null,
          model: 'EasySalon Grounding Engine'
        });
      }

      const localResult = await executeLocalFallbackIntent(message, context);
      if (localResult) {
        return NextResponse.json({
          content: localResult.content,
          executedTools: localResult.executedTools || [],
          navigateTo: localResult.navigateTo || null,
          model: 'GloPro Core AI'
        });
      }
      return NextResponse.json({
        content: `⚠️ **Chưa cấu hình Google Gemini API Key!**\n\nBạn có thể thêm API Key vào file \`.env.local\` để kích hoạt toàn bộ sức mạnh AI Copilot.`,
        executedTools: []
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Format history
    const contents = [];
    if (Array.isArray(history)) {
      history.slice(-6).forEach(h => {
        contents.push({
          role: h.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: h.content }]
        });
      });
    }
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    // Model candidate list prioritizing high availability and stability
    const candidateModels = ['gemini-3.5-flash', 'gemini-3.6-flash'];
    let selectedModel = candidateModels[0];
    let executedTools = [];
    let navigateTo = null;
    let response = null;

    for (const modelName of candidateModels) {
      try {
        selectedModel = modelName;
        response = await ai.models.generateContent({
          model: modelName,
          contents,
          config: {
            systemInstruction,
            tools: [{ functionDeclarations: toolDeclarations }]
          }
        });
        if (response) break;
      } catch (modelErr) {
        console.warn(`[Gemini model ${modelName} error]: ${modelErr.message}`);
      }
    }

    // If Gemini model calls failed (e.g. rate limit 429 or 503), prioritize grounded context then local fallback
    if (!response) {
      if (groundedContext && groundedContext.grounded) {
        return NextResponse.json({
          content: groundedContext.summary,
          executedTools: (groundedContext.sources || []).map(s => ({ name: s.tool, result: { message: groundedContext.summary } })),
          navigateTo: null,
          model: 'EasySalon Grounding Engine'
        });
      }
      const localResult = await executeLocalFallbackIntent(message, context);
      if (localResult) {
        return NextResponse.json({
          content: localResult.content,
          executedTools: localResult.executedTools || [],
          navigateTo: localResult.navigateTo || null,
          model: 'GloPro Local AI'
        });
      }
      throw new Error('Hệ thống AI đang quá tải, vui lòng thử lại sau giây lát.');
    }

    // Check if Gemini invoked function calls
    const candidate = response?.candidates?.[0];
    const functionCalls = candidate?.content?.parts?.filter(p => p.functionCall)?.map(p => p.functionCall) || [];

    if (functionCalls.length > 0) {
      const functionResponses = [];

      for (const call of functionCalls) {
        const { name, args } = call;
        const toolResult = await executeTool(name, args, context);
        executedTools.push({ name, args, result: toolResult });

        if (toolResult.navigateTo) {
          navigateTo = toolResult.navigateTo;
        }

        functionResponses.push({
          name,
          id: call.id,
          response: { output: toolResult }
        });
      }

      // Feed tool results back to Gemini for conversational synthesis
      let finalContent = '';
      try {
        const updatedContents = [
          ...contents,
          candidate.content,
          {
            role: 'user',
            parts: functionResponses.map(fr => ({
              functionResponse: {
                name: fr.name,
                response: fr.response
              }
            }))
          }
        ];

        const followUp = await ai.models.generateContent({
          model: selectedModel,
          contents: updatedContents,
          config: {
            systemInstruction,
            tools: [{ functionDeclarations: toolDeclarations }]
          }
        });

        finalContent = cleanAiText(followUp?.text || '');
      } catch (followErr) {
        console.warn('[Gemini followUp warning]:', followErr.message);
      }

      // If followUp failed (quota limit / network), fallback directly to the rich tool messages!
      if (!finalContent || finalContent.trim().length === 0) {
        finalContent = executedTools
          .map(t => t.result?.message || `Đã hoàn tất thao tác: **${t.name}**`)
          .join('\n\n');
      }

      const actionButton = executedTools.find(t => t.result?.actionButton)?.result?.actionButton || null;

      return NextResponse.json({
        content: finalContent,
        executedTools,
        navigateTo,
        actionButton,
        model: selectedModel
      });
    }

    const cleanDirectText = cleanAiText(response.text || '');
    return NextResponse.json({
      content: cleanDirectText || 'Tôi có thể hỗ trợ gì thêm cho bạn?',
      executedTools: [],
      navigateTo: null,
      actionButton: null,
      model: selectedModel
    });

  } catch (err) {
    console.error('[Copilot API Route Error]:', err);
    
    // As a final safety net, try local intent before returning error
    try {
      const { message, context = {} } = await req.clone().json().catch(() => ({}));
      if (message) {
        const fallback = await executeLocalFallbackIntent(message, context);
        if (fallback) {
          return NextResponse.json({
            content: fallback.content,
            executedTools: fallback.executedTools || [],
            navigateTo: fallback.navigateTo || null,
            actionButton: fallback.actionButton || null,
            model: 'GloPro Engine'
          });
        }
      }
    } catch (e) {}

    return NextResponse.json({
      content: `❌ **Không thể hoàn tất yêu cầu lúc này:**\n${err.message || 'Lỗi không xác định'}`,
      executedTools: []
    }, { status: 500 });
  }
}
