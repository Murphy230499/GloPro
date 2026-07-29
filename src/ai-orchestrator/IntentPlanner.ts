import { IExecutionPlan, IExecutionStep } from './types';

export class IntentPlanner {
  plan(prompt: string): IExecutionPlan {
    const text = prompt.toLowerCase();
    const steps: IExecutionStep[] = [];
    let stepIndex = 1;

    // Detect Multi-Step Execution Scenarios (e.g., "Book Lan tomorrow at 2PM. After checkout send a voucher. Add loyalty points.")
    const isMultiStep = text.includes('after') || text.includes('rồi') || text.includes('sau đó') || text.includes('đồng thời') || text.includes('checkout') || text.includes('voucher') || text.includes('điểm');

    if (isMultiStep || text.includes('lan')) {
      // Step 1: Customer Agent -> Verify/Search Customer
      steps.push({
        stepIndex: stepIndex++,
        agentId: 'agent_customer_management',
        agentName: 'Customer Management Agent',
        toolName: 'customer_search',
        query: 'Tìm thông tin khách hàng Lan',
        args: { query: 'Lan' },
        requiresConfirmation: false,
        status: 'pending'
      });

      // Step 2: Appointment Agent -> Book Appointment
      steps.push({
        stepIndex: stepIndex++,
        agentId: 'agent_appointment_management',
        agentName: 'Appointment Specialist Agent',
        toolName: 'appointment_book',
        query: 'Đặt lịch hẹn cho Lan vào 14:00 ngày mai',
        args: { customerName: 'Lan', customerPhone: '0912345678', serviceName: 'Gội đầu dưỡng sinh', date: '2026-07-23', startTime: '14:00' },
        requiresConfirmation: false,
        status: 'pending'
      });

      // Step 3: Cashier Agent -> Checkout Invoice
      if (text.includes('checkout') || text.includes('thanh toán') || text.includes('hóa đơn')) {
        steps.push({
          stepIndex: stepIndex++,
          agentId: 'agent_cashier_pos',
          agentName: 'Cashier & POS Agent',
          toolName: 'cashier_create_invoice',
          query: 'Tạo hóa đơn & thanh toán checkout cho lượt hẹn',
          args: { customerName: 'Lan', customerPhone: '0912345678' },
          requiresConfirmation: true,
          status: 'pending'
        });
      }

      // Step 4: Membership / Loyalty Points (Customer Agent)
      if (text.includes('loyalty') || text.includes('điểm') || text.includes('tích điểm')) {
        steps.push({
          stepIndex: stepIndex++,
          agentId: 'agent_customer_management',
          agentName: 'Customer Membership Agent',
          toolName: 'customer_loyalty_points',
          query: 'Cộng điểm thưởng tích lũy cho Lan',
          args: { customerId: 'cust_lan', action: 'add', points: 100, reason: 'Tích điểm sau dịch vụ' },
          requiresConfirmation: false,
          status: 'pending'
        });
      }

      // Step 5: Marketing Agent -> Send Voucher
      if (text.includes('voucher') || text.includes('khuyến mãi') || text.includes('gửi voucher')) {
        steps.push({
          stepIndex: stepIndex++,
          agentId: 'agent_marketing_engagement',
          agentName: 'Marketing Engagement Agent',
          toolName: 'marketing_issue_voucher',
          query: 'Tạo & gửi voucher tri ân cho Lan',
          args: { code: 'TRIAN100K', discountType: 'fixed', discountValue: 100000, expiryDate: '2026-08-31' },
          requiresConfirmation: true,
          status: 'pending'
        });
      }
    } else {
      // Single-step fallback intent mapping
      let agentId = 'agent_customer_management';
      let agentName = 'Customer Agent';
      let toolName = 'customer_search';

      if (text.includes('lịch') || text.includes('hẹn')) {
        agentId = 'agent_appointment_management';
        agentName = 'Appointment Agent';
        toolName = 'appointment_book';
      } else if (text.includes('hóa đơn') || text.includes('thanh toán')) {
        agentId = 'agent_cashier_pos';
        agentName = 'Cashier Agent';
        toolName = 'cashier_create_invoice';
      }

      steps.push({
        stepIndex: 1,
        agentId,
        agentName,
        toolName,
        query: prompt,
        args: {},
        requiresConfirmation: false,
        status: 'pending'
      });
    }

    return {
      planId: `plan_${Date.now()}`,
      originalPrompt: prompt,
      steps,
      status: 'planning'
    };
  }
}
