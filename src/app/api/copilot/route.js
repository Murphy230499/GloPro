import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { base44 } from '@/api/base44Client';
import { supabase } from '@/lib/supabaseClient';
import { 
  EasySalonBrain, 
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
  }
];

// Tool Execution Logic with Rich Human-like Vietnamese Responses
async function executeTool(name, args = {}, context = {}) {
  try {
    const branchId = context.salonBranch?.id;

    switch (name) {
      case 'customer_search': {
        const list = await base44.entities.Customer.list().catch(() => []);
        const q = (args.query || '').toLowerCase().trim();
        let matched = list;
        if (q && q !== 'all' && q !== 'tất cả') {
          matched = list.filter(c => 
            (c.name && c.name.toLowerCase().includes(q)) ||
            (c.phone && c.phone.includes(q)) ||
            (c.email && c.email.toLowerCase().includes(q))
          );
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

      case 'customer_create': {
        const rawGender = (args.gender || '').toLowerCase();
        const cleanGender = rawGender.includes('nam') ? 'male' : (rawGender.includes('nữ') ? 'female' : 'other');
        const payload = {
          name: args.name,
          phone: args.phone,
          email: args.email || null,
          address: args.address || null,
          gender: cleanGender,
          birthday: args.birth_date || args.birthday || null,
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
        return { success: true, service: res, message: `💇‍♀️ Đã tạo dịch vụ mới: **${args.name}** (${payload.price.toLocaleString('vi-VN')} đ)` };
      }

      case 'staff_create': {
        const payload = {
          name: args.name,
          full_name: args.name,
          phone: args.phone,
          role: args.role || 'Thợ chính',
          is_active: true
        };
        const res = await base44.entities.Staff.create(payload);
        return { success: true, staff: res, message: `🧑‍💼 Đã thêm nhân viên mới: **${args.name}** (${payload.role})` };
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

  if (q.includes('doanh thu') || q.includes('doanh so') || q.includes('tiền hôm nay') || q.includes('bán được bao nhiêu')) {
    const res = await executeTool('pos_get_today_summary', {}, context);
    return { content: res.message, executedTools: [{ name: 'pos_get_today_summary', result: res }] };
  }

  if (q.includes('tuần này') || q.includes('tháng này') || q.includes('7 ngày') || q.includes('báo cáo')) {
    const period = q.includes('tháng') ? 'month' : 'week';
    const res = await executeTool('reports_get_overview', { period }, context);
    return { content: res.message, executedTools: [{ name: 'reports_get_overview', args: { period }, result: res }] };
  }

  if (q.includes('khách hàng') || q.includes('tìm khách') || q.includes('bao nhiêu khách')) {
    const phoneMatch = q.match(/\d{9,11}/);
    const searchParam = phoneMatch ? phoneMatch[0] : '';
    const res = await executeTool('customer_search', { query: searchParam }, context);
    return { content: res.message, executedTools: [{ name: 'customer_search', args: { query: searchParam }, result: res }] };
  }

  if (q.includes('lịch hẹn') || q.includes('xem lịch')) {
    const todayStr = new Date().toISOString().split('T')[0];
    const res = await executeTool('appointment_search', { date: todayStr }, context);
    return { content: res.message, executedTools: [{ name: 'appointment_search', args: { date: todayStr }, result: res }] };
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

        return {
          actorId: user.id,
          tenantId: profile?.tenant_id || user.user_metadata?.tenant_id || 'default_tenant',
          branchId: profile?.branch_id || clientContext.salonBranch?.id,
          role: profile?.role || user.user_metadata?.role || 'staff',
          permissions: profile?.role === 'owner' ? 'all' : (clientContext.currentPermissions || 'read_only'),
          isVerifiedAuth: true
        };
      }
    }
  } catch (err) {
    // Auth fallback for test / unauthenticated requests
  }

  return {
    actorId: clientContext.currentUser?.id || 'anon_user',
    tenantId: clientContext.currentUser?.tenant_id || 'default_tenant',
    branchId: clientContext.salonBranch?.id || 'default_branch',
    role: clientContext.currentUser?.role || 'owner',
    permissions: clientContext.currentPermissions || 'all',
    isVerifiedAuth: false
  };
}

export async function POST(req) {
  try {
    const { message, history = [], context = {} } = await req.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Nội dung tin nhắn không hợp lệ.' }, { status: 400 });
    }

    const trustedActor = await resolveTrustedActor(req, context);
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
      'CANCEL_APPOINTMENT'
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

    const systemInstruction = `${businessContextPrompt}
${groundedDataBlock}
DỮ LIỆU THỰC TẾ TRÊN PHẦN MỀM HIỆN TẠI:
- Chi nhánh đang chọn: ${context.salonBranch?.name || 'Chi nhánh chính'} (ID: ${context.salonBranch?.id || 'default'})
- Trang người dùng đang xem: ${context.currentPage || '/dashboard'}
- Người dùng đang đăng nhập: ${context.currentUser?.name || 'Quản trị viên'} (${context.currentUser?.role || 'owner'})
- Doanh thu hôm nay: ${todayRev.toLocaleString('vi-VN')} đ (${todayInvs.length} hóa đơn)
- Lịch hẹn hôm nay: ${todayAppts.length} lịch hẹn
- Tổng số khách hàng trên hệ thống: ${liveCustomers.length} khách hàng
${context.selectedCustomer ? `- Khách hàng đang chọn: ${context.selectedCustomer.name} (SĐT: ${context.selectedCustomer.phone})` : ''}
${context.selectedAppointment ? `- Lịch hẹn đang chọn: ID ${context.selectedAppointment.id}` : ''}

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
    const candidateModels = ['gemini-3.5-flash', 'gemini-flash-latest', 'gemini-2.5-flash', 'gemini-3.6-flash'];
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

      return NextResponse.json({
        content: finalContent,
        executedTools,
        navigateTo,
        model: selectedModel
      });
    }

    const cleanDirectText = cleanAiText(response.text || '');
    return NextResponse.json({
      content: cleanDirectText || 'Tôi có thể hỗ trợ gì thêm cho bạn?',
      executedTools: [],
      navigateTo: null,
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
