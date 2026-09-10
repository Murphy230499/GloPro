import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { base44 } from '@/api/base44Client';

// Tool Function Declarations for Gemini
const toolDeclarations = [
  {
    name: 'customer_search',
    description: 'Tìm kiếm khách hàng trong hệ thống bằng tên, số điện thoại hoặc email.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: { type: Type.STRING, description: 'Từ khóa tìm kiếm: tên, sđt, hoặc email' }
      },
      required: ['query']
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
    description: 'Xem tổng kết doanh thu, số lượng đơn và khách hàng trong ngày hôm nay.',
    parameters: {
      type: Type.OBJECT,
      properties: {}
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
        query: { type: Type.STRING, description: 'Tên dịch vụ cần tra cứu' }
      }
    }
  },
  {
    name: 'products_search',
    description: 'Tra cứu sản phẩm bán lẻ, mỹ phẩm, tồn kho và đơn giá.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: { type: Type.STRING, description: 'Tên sản phẩm cần tìm' }
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
          description: 'Đường dẫn trang cần chuyển tới: /pos (Bán hàng), /appointments (Lịch hẹn), /customers (Khách hàng), /staff (Nhân viên), /services (Dịch vụ & Sản phẩm), /reports (Báo cáo doanh thu), /settings (Cài đặt)' 
        },
        page_title: { type: Type.STRING, description: 'Tên trang tiếng Việt để thông báo cho người dùng' }
      },
      required: ['page']
    }
  }
];

// Tool Execution Logic
async function executeTool(name, args, context) {
  try {
    switch (name) {
      case 'customer_search': {
        const list = await base44.entities.Customer.list().catch(() => []);
        const q = (args.query || '').toLowerCase().trim();
        const matched = list.filter(c => 
          (c.name && c.name.toLowerCase().includes(q)) ||
          (c.phone && c.phone.includes(q)) ||
          (c.email && c.email.toLowerCase().includes(q))
        );
        return {
          total: matched.length,
          customers: matched.slice(0, 10).map(c => ({
            id: c.id,
            name: c.name,
            phone: c.phone,
            email: c.email,
            tier: c.tier || 'Thường',
            loyalty_points: c.loyalty_points || c.points || 0,
            debt: c.debt || 0,
            address: c.address
          }))
        };
      }

      case 'customer_create': {
        const payload = {
          name: args.name,
          phone: args.phone,
          email: args.email || null,
          address: args.address || null,
          gender: args.gender || 'Khác',
          birth_date: args.birth_date || null,
          note: args.note || 'Tạo tự động bởi AI Copilot',
          loyalty_points: 0,
          tier: 'Thường'
        };
        const res = await base44.entities.Customer.create(payload);
        return { success: true, customer: res, message: `Đã tạo khách hàng mới: ${args.name} (${args.phone})` };
      }

      case 'customer_update': {
        const list = await base44.entities.Customer.list().catch(() => []);
        const target = list.find(c => c.phone === args.phone);
        if (!target) {
          return { success: false, message: `Không tìm thấy khách hàng với số điện thoại ${args.phone}` };
        }
        const updateData = { ...target };
        if (args.name) updateData.name = args.name;
        if (args.note) updateData.note = args.note;
        if (args.address) updateData.address = args.address;
        const res = await base44.entities.Customer.update(target.id, updateData);
        return { success: true, customer: res, message: `Đã cập nhật thông tin khách hàng ${target.name}` };
      }

      case 'appointment_create': {
        const payload = {
          customer_name: args.customer_name,
          customer_phone: args.customer_phone,
          service_name: args.service_name,
          staff_name: args.staff_name || 'Nhân viên mặc định',
          date: args.date,
          start_time: args.time,
          status: 'confirmed',
          note: args.note || 'Đặt qua AI Copilot'
        };
        const res = await base44.entities.Appointment.create(payload);
        return { success: true, appointment: res, message: `Đã tạo lịch hẹn thành công cho ${args.customer_name} lúc ${args.time} ngày ${args.date}` };
      }

      case 'appointment_search': {
        const list = await base44.entities.Appointment.list().catch(() => []);
        let filtered = list;
        if (args.date) {
          filtered = filtered.filter(a => a.date === args.date);
        }
        if (args.customer_phone) {
          filtered = filtered.filter(a => a.customer_phone && a.customer_phone.includes(args.customer_phone));
        }
        if (args.status) {
          filtered = filtered.filter(a => a.status === args.status);
        }
        return {
          total: filtered.length,
          appointments: filtered.slice(0, 15).map(a => ({
            id: a.id,
            customer_name: a.customer_name,
            customer_phone: a.customer_phone,
            service_name: a.service_name,
            staff_name: a.staff_name,
            date: a.date,
            time: a.start_time || a.time,
            status: a.status
          }))
        };
      }

      case 'appointment_cancel': {
        const list = await base44.entities.Appointment.list().catch(() => []);
        const target = list.find(a => 
          a.customer_phone === args.customer_phone && 
          (!args.date || a.date === args.date) &&
          a.status !== 'cancelled'
        );
        if (!target) {
          return { success: false, message: `Không tìm thấy lịch hẹn nào chưa hủy của SĐT ${args.customer_phone}` };
        }
        const updated = await base44.entities.Appointment.update(target.id, {
          ...target,
          status: 'cancelled',
          cancel_reason: args.reason || 'Khách yêu cầu hủy qua AI'
        });
        return { success: true, message: `Đã hủy lịch hẹn của khách ${target.customer_name} ngày ${target.date}` };
      }

      case 'pos_create_invoice': {
        const discount = Number(args.discount_amount) || 0;
        const total = Number(args.total_amount) || 0;
        const final = Math.max(0, total - discount);
        const payload = {
          customer_name: args.customer_name,
          customer_phone: args.customer_phone || '',
          note: args.items_description || 'Hóa đơn tạo qua AI Copilot',
          total_amount: total,
          discount_amount: discount,
          final_amount: final,
          payment_method: args.payment_method || 'Tiền mặt',
          status: 'paid',
          created_date: new Date().toISOString()
        };
        const res = await base44.entities.Invoice.create(payload);
        return { success: true, invoice: res, message: `Đã tạo hóa đơn thanh toán cho ${args.customer_name} với số tiền ${final.toLocaleString('vi-VN')} đ` };
      }

      case 'pos_get_today_summary': {
        const invoices = await base44.entities.Invoice.list().catch(() => []);
        const appts = await base44.entities.Appointment.list().catch(() => []);
        const todayStr = new Date().toISOString().split('T')[0];
        
        const todayInvoices = invoices.filter(inv => {
          const d = inv.created_date || inv.created_at || '';
          return d.startsWith(todayStr);
        });

        const totalRev = todayInvoices.reduce((acc, inv) => acc + (Number(inv.final_amount) || Number(inv.total_amount) || 0), 0);
        const todayAppts = appts.filter(a => a.date === todayStr);

        return {
          date: todayStr,
          total_revenue: totalRev,
          formatted_revenue: `${totalRev.toLocaleString('vi-VN')} đ`,
          total_invoices: todayInvoices.length,
          total_appointments_today: todayAppts.length
        };
      }

      case 'staff_search': {
        const list = await base44.entities.Staff.list().catch(() => []);
        const q = (args.query || '').toLowerCase();
        const matched = list.filter(s => 
          !q || 
          (s.name && s.name.toLowerCase().includes(q)) || 
          (s.full_name && s.full_name.toLowerCase().includes(q)) ||
          (s.role && s.role.toLowerCase().includes(q))
        );
        return {
          total: matched.length,
          staff: matched.map(s => ({
            id: s.id,
            name: s.name || s.full_name,
            role: s.role,
            phone: s.phone,
            is_active: s.is_active !== false
          }))
        };
      }

      case 'services_search': {
        const list = await base44.entities.Service.list().catch(() => []);
        const q = (args.query || '').toLowerCase();
        const matched = list.filter(s => !q || (s.name && s.name.toLowerCase().includes(q)));
        return {
          total: matched.length,
          services: matched.slice(0, 15).map(s => ({
            id: s.id,
            name: s.name,
            price: s.price,
            duration: s.duration_minutes || s.duration,
            formatted_price: `${(Number(s.price) || 0).toLocaleString('vi-VN')} đ`
          }))
        };
      }

      case 'products_search': {
        const list = await base44.entities.Product.list().catch(() => []);
        const q = (args.query || '').toLowerCase();
        const matched = list.filter(p => !q || (p.name && p.name.toLowerCase().includes(q)));
        return {
          total: matched.length,
          products: matched.slice(0, 15).map(p => ({
            id: p.id,
            name: p.name,
            price: p.price,
            stock: p.stock_quantity || p.stock || 0,
            formatted_price: `${(Number(p.price) || 0).toLocaleString('vi-VN')} đ`
          }))
        };
      }

      case 'navigate_to': {
        return {
          success: true,
          navigateTo: args.page,
          message: `Đang chuyển màn hình tới: ${args.page_title || args.page}`
        };
      }

      default:
        return { success: false, error: `Công cụ ${name} chưa được hỗ trợ.` };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function POST(req) {
  try {
    const { message, history = [], context = {} } = await req.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Nội dung tin nhắn không hợp lệ.' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        content: `⚠️ **Chưa cấu hình Google Gemini API Key!**\n\nĐể kích hoạt AI Copilot thông minh với Gemini 2.5 Pro, bạn vui lòng:\n1. Lấy API Key miễn phí từ [Google AI Studio](https://aistudio.google.com/).\n2. Mở file \`.env.local\` trong thư mục dự án và thêm dòng:\n\`\`\`env\nGEMINI_API_KEY=your_gemini_api_key_here\n\`\`\`\n3. Khởi động lại dự án và trải nghiệm ngay!`,
        executedTools: []
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Build rich dynamic system instructions based on context
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const systemInstruction = `Bạn là GloPro AI Copilot - Trợ lý trí tuệ nhân tạo chuyên nghiệp điều hành hệ thống phần mềm Quản lý Salon & Spa GloPro.
Người dùng là chủ salon hoặc nhân viên đang thao tác trực tiếp trên phần mềm.
Hôm nay là: ${todayStr}, lúc ${timeStr}.

THÔNG TIN NGỮ CẢNH HIỆN TẠI TRÊN MÀN HÌNH CỦA NGƯỜI DÙNG:
- Trang hiện tại: ${context.currentPage || 'Trang chủ'}
- Chi nhánh đang chọn: ${context.salonBranch?.name || 'Chi nhánh mặc định'} (ID: ${context.salonBranch?.id || 'default'})
- Người dùng đang đăng nhập: ${context.currentUser?.name || 'Quản trị viên'} (Vai trò: ${context.currentUser?.role || 'owner'})
${context.selectedCustomer ? `- Khách hàng đang được chọn: ${context.selectedCustomer.name} (SĐT: ${context.selectedCustomer.phone})` : ''}
${context.selectedAppointment ? `- Lịch hẹn đang được chọn: ID ${context.selectedAppointment.id}` : ''}
${context.selectedInvoice ? `- Hóa đơn đang xem: ID ${context.selectedInvoice.id}` : ''}

QUY TẮC HOẠT ĐỘNG:
1. Bạn có toàn quyền thực thi tự động (Autonomous Execution) các tác vụ thông qua việc gọi các công cụ (Function Calling).
2. Khi người dùng yêu cầu thực hiện hành động (tạo bill, đặt lịch hẹn, tạo/sửa khách hàng, tra cứu doanh thu, hủy lịch, v.v.), hãy GỌI NGAY CÔNG CỤ TƯƠNG ỨNG. KHÔNG CHỈ HỎI LẠI nếu đã có đủ dữ liệu cơ bản.
3. Nếu người dùng nói các từ như "chuyển trang", "mở màn hình POS", "xem danh sách khách hàng", hãy gọi công cụ \`navigate_to\`.
4. Nếu người dùng chỉ định các từ ngữ chỉ thời gian như "hôm nay", "ngày mai", "thứ 2 tới", hãy tự động tính toán ra ngày cụ thể theo định dạng YYYY-MM-DD dựa trên ngày hôm nay (${todayStr}).
5. Phản hồi bằng tiếng Việt tự nhiên, ngắn gọn, súc tích, định dạng Markdown rõ ràng (sử dụng bullet points, in đậm số tiền và thông tin quan trọng).`;

    // Convert history to contents format
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

    // Dynamic Model Selection with automatic fallback
    const candidateModels = ['gemini-3.6-flash', 'gemini-3-flash-preview', 'gemini-3.1-pro-preview'];
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
        console.warn(`[Gemini model ${modelName} error]: ${modelErr.message}. Trying next candidate...`);
      }
    }

    if (!response) {
      throw new Error('Tất cả các mô hình Gemini đều không thể xử lý yêu cầu lúc này.');
    }

    // Check if Gemini invoked function calls
    let candidate = response?.candidates?.[0];
    let functionCalls = candidate?.content?.parts?.filter(p => p.functionCall)?.map(p => p.functionCall) || [];

    if (functionCalls.length > 0) {
      // Execute each function call
      const functionResponses = [];

      for (const call of functionCalls) {
        const { name, args } = call;
        const toolResult = await executeTool(name, args, context);
        executedTools.push({ name, args, result: toolResult });

        if (toolResult.navigateTo) {
          navigateTo = toolResult.navigateTo;
        }

        functionResponses.push({
          response: {
            name,
            content: toolResult
          }
        });
      }

      // Feed tool results back to Gemini for the final response
      const updatedContents = [
        ...contents,
        candidate.content,
        {
          role: 'user',
          parts: functionResponses.map(fr => ({
            functionResponse: fr.response
          }))
        }
      ];

      const followUp = await ai.models.generateContent({
        model: selectedModel,
        contents: updatedContents,
        config: {
          systemInstruction
        }
      });

      const finalContent = followUp?.text || 'Đã thực hiện xong thao tác của bạn.';

      return NextResponse.json({
        content: finalContent,
        executedTools,
        navigateTo,
        model: selectedModel
      });
    }

    return NextResponse.json({
      content: response.text || 'Tôi có thể hỗ trợ gì thêm cho bạn?',
      executedTools: [],
      navigateTo: null,
      model: selectedModel
    });

  } catch (err) {
    console.error('[Copilot API Route Error]:', err);
    return NextResponse.json({
      content: `❌ **Đã xảy ra lỗi khi gọi Gemini AI:**\n${err.message || 'Lỗi không xác định'}`,
      executedTools: []
    }, { status: 500 });
  }
}
