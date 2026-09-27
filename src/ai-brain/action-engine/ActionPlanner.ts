/**
 * Action Planner
 * 
 * Analyzes structured intents, resolves real IDs via Read Tools (NEVER guessing IDs),
 * checks preconditions and conflicts, builds validated action previews,
 * and registers pending actions for explicit human confirmation.
 */

import { IStructuredIntent } from '../intent/IntentTypes';
import { ActionType, ActionResult, ActionExecutionContext } from './ActionContracts';
import { ActionPreconditionValidator } from './ActionPreconditionValidator';
import { ActionPreview } from './ActionPreview';
import { ConfirmationGate } from './ConfirmationGate';
import { ActionAuditLog } from './ActionAuditLog';
import { PermissionGate } from '../read-engine/PermissionGate';
import { base44 } from '../../api/base44Client';

export class ActionPlanner {
  /**
   * Plans a write action from structured intent
   */
  static async planAction(
    structuredIntent: IStructuredIntent,
    query: string,
    context: ActionExecutionContext = {}
  ): Promise<ActionResult> {
    const rawLower = query.toLowerCase().trim();

    // 1. PROMPT INJECTION & BULK DESTRUCTIVE GUARDS
    if (
      rawLower.includes('ignore previous instructions') ||
      rawLower.includes('delete all') ||
      rawLower.includes('xóa tất cả') ||
      rawLower.includes('hủy tất cả') ||
      rawLower.includes('skip confirmation') ||
      rawLower.includes('bỏ qua xác nhận')
    ) {
      ActionAuditLog.log({
        event: 'AI_ACTION_FAILED',
        actionType: 'CANCEL_APPOINTMENT',
        status: 'REJECTED',
        actorId: context.userId,
        actorRole: context.role,
        reason: 'Security violation: destructive or injection prompt'
      });

      return {
        success: false,
        status: 'REJECTED',
        actionType: 'CANCEL_APPOINTMENT',
        verified: false,
        error: { code: 'SECURITY_REJECTION', message: 'Yêu cầu bị từ chối do vi phạm quy tắc an toàn bảo mật.' },
        message: '🛡️ **Từ chối yêu cầu:** Hệ thống không cho phép thực thi lệnh xóa hàng loạt hoặc bỏ qua bước xác nhận.'
      };
    }

    const intent = structuredIntent.intent;
    const entities = structuredIntent.entities || {};

    // 2. ROUTE BY INTENT
    switch (intent) {
      // -------------------------------------------------------------
      // A. CREATE CUSTOMER
      // -------------------------------------------------------------
      case 'CREATE_CUSTOMER': {
        const name = entities.name?.value || entities.customer?.value;
        const phone = entities.phone?.value;

        if (!name || !phone) {
          return {
            success: false,
            status: 'VALIDATION_ERROR',
            actionType: 'CREATE_CUSTOMER',
            verified: false,
            error: { code: 'MISSING_REQUIRED', message: 'Thiếu tên hoặc số điện thoại' },
            message: 'Để tạo khách hàng mới, vui lòng cung cấp đầy đủ họ tên và số điện thoại.'
          };
        }

        // Permission check
        const perm = PermissionGate.check('CustomerCreateTool', 'customers', {
          userId: context.userId,
          role: context.role,
          permissions: context.permissions
        });
        if (!perm.allowed) {
          return {
            success: false,
            status: 'PERMISSION_DENIED',
            actionType: 'CREATE_CUSTOMER',
            verified: false,
            error: { code: 'PERMISSION_DENIED', message: perm.message || 'Không có quyền' },
            message: perm.message || 'Bạn không có quyền tạo khách hàng.'
          };
        }

        const params = {
          name,
          phone,
          email: entities.email?.value,
          gender: entities.gender?.value,
          birthday: entities.date?.value
        };

        const val = await ActionPreconditionValidator.validateCreateCustomer(params);
        if (!val.valid) {
          return {
            success: false,
            status: val.status,
            actionType: 'CREATE_CUSTOMER',
            verified: false,
            error: { code: val.status, message: val.message || 'Lỗi dữ liệu' },
            message: val.message || 'Không thể tạo khách hàng.'
          };
        }

        const preview = ActionPreview.createPreview('CREATE_CUSTOMER', params);
        const pending = ConfirmationGate.createPendingAction('CREATE_CUSTOMER', params, preview, context);

        ActionAuditLog.log({
          event: 'AI_CONFIRMATION_REQUESTED',
          actionType: 'CREATE_CUSTOMER',
          actionReference: pending.referenceId,
          status: 'PENDING_CONFIRMATION',
          actorId: context.userId,
          actorRole: context.role
        });

        return {
          success: true,
          status: 'PENDING_CONFIRMATION',
          actionType: 'CREATE_CUSTOMER',
          actionReference: pending.referenceId,
          preview,
          verified: false,
          message: ActionPreview.formatTextSummary(preview)
        };
      }

      // -------------------------------------------------------------
      // B. UPDATE CUSTOMER
      // -------------------------------------------------------------
      case 'UPDATE_CUSTOMER': {
        const targetQuery = entities.customer?.value || entities.name?.value;
        const newPhone = entities.phone?.value;

        // Resolve customer from DB
        const customers = await base44.entities.Customer.list().catch(() => []);
        let target = null;

        if (targetQuery) {
          const qLower = targetQuery.toLowerCase().trim();
          const matched = customers.filter(c => 
            (c.name && c.name.toLowerCase().includes(qLower)) ||
            (c.phone && c.phone.includes(qLower))
          );

          if (matched.length > 1) {
            return {
              success: false,
              status: 'AMBIGUOUS',
              actionType: 'UPDATE_CUSTOMER',
              verified: false,
              error: { code: 'AMBIGUOUS_CUSTOMER', message: 'Tìm thấy nhiều khách hàng trùng khớp' },
              message: `🔍 Tìm thấy ${matched.length} khách hàng có tên tương tự. Vui lòng cung cấp số điện thoại hoặc ID chính xác để cập nhật.`
            };
          }
          target = matched[0];
        }

        if (!target) {
          return {
            success: false,
            status: 'NOT_FOUND',
            actionType: 'UPDATE_CUSTOMER',
            verified: false,
            error: { code: 'CUSTOMER_NOT_FOUND', message: 'Không tìm thấy khách hàng' },
            message: `Không tìm thấy khách hàng "${targetQuery || ''}" trong hệ thống để cập nhật.`
          };
        }

        const params = {
          id: target.id,
          name: entities.newName?.value || target.name,
          oldName: target.name,
          phone: newPhone || target.phone,
          oldPhone: target.phone,
          newPhone: newPhone
        };

        const val = await ActionPreconditionValidator.validateUpdateCustomer(params);
        if (!val.valid) {
          return {
            success: false,
            status: val.status,
            actionType: 'UPDATE_CUSTOMER',
            verified: false,
            error: { code: val.status, message: val.message || 'Lỗi dữ liệu' },
            message: val.message || 'Không thể cập nhật khách hàng.'
          };
        }

        const preview = ActionPreview.createPreview('UPDATE_CUSTOMER', params);
        const pending = ConfirmationGate.createPendingAction('UPDATE_CUSTOMER', params, preview, context);

        return {
          success: true,
          status: 'PENDING_CONFIRMATION',
          actionType: 'UPDATE_CUSTOMER',
          actionReference: pending.referenceId,
          preview,
          verified: false,
          message: ActionPreview.formatTextSummary(preview)
        };
      }

      // -------------------------------------------------------------
      // C. CREATE APPOINTMENT
      // -------------------------------------------------------------
      case 'CREATE_APPOINTMENT': {
        const customerVal = entities.customer?.value;
        const serviceVal = entities.service?.value;
        const dateVal = entities.date?.value;
        const timeVal = entities.time?.value;
        const staffVal = entities.staff?.value;

        // Check required fields
        if (!customerVal || !dateVal || !timeVal || !serviceVal) {
          return {
            success: false,
            status: 'VALIDATION_ERROR',
            actionType: 'CREATE_APPOINTMENT',
            verified: false,
            error: { code: 'MISSING_REQUIRED_FIELDS', message: 'Thiếu thông tin bắt buộc' },
            message: 'Để tạo lịch hẹn, vui lòng cung cấp đủ: Khách hàng, Dịch vụ, Ngày và Giờ hẹn cụ thể.'
          };
        }

        // 1. Resolve Customer by name or phone (Never guess ID!)
        const customers = await base44.entities.Customer.list().catch(() => []);
        const qCust = customerVal.toLowerCase().trim();
        const matchedCusts = customers.filter(c => 
          (c.name && c.name.toLowerCase().includes(qCust)) ||
          (c.phone && c.phone.includes(qCust))
        );

        // Deduplicate identical customer records (same name & phone)
        const uniqueCustomers = new Map<string, any>();
        for (const c of matchedCusts) {
          const key = `${(c.name || '').trim().toLowerCase()}_${(c.phone || '').trim()}`;
          if (!uniqueCustomers.has(key)) {
            uniqueCustomers.set(key, c);
          }
        }

        if (uniqueCustomers.size > 1) {
          return {
            success: false,
            status: 'AMBIGUOUS',
            actionType: 'CREATE_APPOINTMENT',
            verified: false,
            error: { code: 'AMBIGUOUS_CUSTOMER', message: 'Trùng tên khách hàng' },
            message: `🔍 Tìm thấy ${uniqueCustomers.size} khách hàng trùng tên. Vui lòng xác định khách hàng bằng số điện thoại.`
          };
        }

        const customer = Array.from(uniqueCustomers.values())[0] || { name: customerVal, phone: entities.phone?.value || 'Chưa lưu' };

        const params: Record<string, any> = {
          customerId: customer.id,
          customerName: customer.name,
          customerPhone: customer.phone,
          serviceName: serviceVal,
          date: dateVal,
          time: timeVal,
          staffName: staffVal
        };

        // 2. Validate Preconditions (Conflict Detection)
        const val = await ActionPreconditionValidator.validateCreateAppointment(params);
        if (!val.valid) {
          return {
            success: false,
            status: val.status,
            actionType: 'CREATE_APPOINTMENT',
            verified: false,
            error: { code: val.status, message: val.message || 'Lỗi đặt lịch' },
            message: val.message || 'Không thể đặt lịch hẹn.'
          };
        }

        const resolved = val.resolvedData || {};
        params.servicePrice = resolved.servicePrice;
        params.durationMinutes = resolved.durationMinutes;
        params.staffName = resolved.staffName;

        const preview = ActionPreview.createPreview('CREATE_APPOINTMENT', params);
        const pending = ConfirmationGate.createPendingAction('CREATE_APPOINTMENT', params, preview, context);

        return {
          success: true,
          status: 'PENDING_CONFIRMATION',
          actionType: 'CREATE_APPOINTMENT',
          actionReference: pending.referenceId,
          preview,
          verified: false,
          message: ActionPreview.formatTextSummary(preview)
        };
      }

      // -------------------------------------------------------------
      // D. CANCEL APPOINTMENT
      // -------------------------------------------------------------
      case 'CANCEL_APPOINTMENT': {
        const customerVal = entities.customer?.value;
        const phoneVal = entities.phone?.value;
        const dateVal = entities.date?.value;

        // Resolve target appointment
        const appointments = await base44.entities.Appointment.list().catch(() => []);
        let matched = appointments;

        if (customerVal) {
          const q = customerVal.toLowerCase().trim();
          matched = matched.filter(a => (a.customer_name || '').toLowerCase().includes(q));
        }
        if (phoneVal) {
          const p = phoneVal.replace(/\s+/g, '');
          matched = matched.filter(a => (a.customer_phone || '').replace(/\s+/g, '').includes(p));
        }
        if (dateVal) {
          matched = matched.filter(a => a.date === dateVal);
        }

        if (matched.length === 0) {
          return {
            success: false,
            status: 'NOT_FOUND',
            actionType: 'CANCEL_APPOINTMENT',
            verified: false,
            error: { code: 'APPOINTMENT_NOT_FOUND', message: 'Không tìm thấy lịch hẹn' },
            message: `Không tìm thấy lịch hẹn nào của khách **${customerVal || ''}** để hủy.`
          };
        }

        const active = matched.filter(a => a.status !== 'cancelled');
        if (active.length > 1) {
          return {
            success: false,
            status: 'AMBIGUOUS',
            actionType: 'CANCEL_APPOINTMENT',
            verified: false,
            error: { code: 'AMBIGUOUS_APPOINTMENT', message: 'Có nhiều lịch hẹn' },
            message: `Tìm thấy ${active.length} lịch hẹn của khách. Vui lòng cho biết ngày hoặc giờ cụ thể của lịch bạn muốn hủy.`
          };
        }

        const targetAppt = active[0] || matched[0];

        const params = {
          appointmentId: targetAppt.id,
          customerName: targetAppt.customer_name,
          customerPhone: targetAppt.customer_phone,
          serviceName: targetAppt.service_name,
          date: targetAppt.date,
          time: targetAppt.start_time || targetAppt.time,
          reason: 'Khách yêu cầu qua AI'
        };

        const val = await ActionPreconditionValidator.validateCancelAppointment(params);
        if (!val.valid) {
          return {
            success: false,
            status: val.status,
            actionType: 'CANCEL_APPOINTMENT',
            verified: false,
            error: { code: val.status, message: val.message || 'Không thể hủy' },
            message: val.message || 'Không thể hủy lịch hẹn.'
          };
        }

        const preview = ActionPreview.createPreview('CANCEL_APPOINTMENT', params);
        const pending = ConfirmationGate.createPendingAction('CANCEL_APPOINTMENT', params, preview, context);

        return {
          success: true,
          status: 'PENDING_CONFIRMATION',
          actionType: 'CANCEL_APPOINTMENT',
          actionReference: pending.referenceId,
          preview,
          verified: false,
          message: ActionPreview.formatTextSummary(preview)
        };
      }

      // -------------------------------------------------------------
      // E. CREATE INVOICE (Phase 6)
      // -------------------------------------------------------------
      case 'CREATE_INVOICE': {
        const customerName = entities.customer?.value || entities.name?.value || 'Khách vãng lai';
        const serviceName = entities.service?.value;
        const productName = entities.product?.value;
        const amount = Number(entities.amount?.value) || 300000;

        const params = {
          customerName,
          customerPhone: entities.phone?.value || '0900000000',
          serviceName,
          productName,
          amount,
          totalAmount: amount,
          branchId: context.branchId
        };

        const preview = ActionPreview.createPreview('CREATE_INVOICE', params);
        const pending = ConfirmationGate.createPendingAction('CREATE_INVOICE', params, preview, context);

        return {
          success: true,
          status: 'PENDING_CONFIRMATION',
          actionType: 'CREATE_INVOICE',
          actionReference: pending.referenceId,
          preview,
          verified: false,
          message: ActionPreview.formatTextSummary(preview)
        };
      }

      // -------------------------------------------------------------
      // F. CHECKOUT INVOICE / PAYMENT (Phase 6)
      // -------------------------------------------------------------
      case 'ADD_PAYMENT':
      case 'CHECKOUT_INVOICE': {
        const invoiceId = entities.invoiceId?.value || entities.id?.value;
        const customerName = entities.customer?.value;
        const amount = Number(entities.amount?.value) || undefined;
        const paymentMethod = entities.paymentMethod?.value || entities.method?.value || 'cash';
        const tipAmount = Number(entities.tip?.value) || Number(entities.tipAmount?.value) || 0;

        const params = {
          invoiceId,
          customerName,
          paidAmount: amount,
          paymentMethod,
          tipAmount
        };

        const preview = ActionPreview.createPreview('CHECKOUT_INVOICE', params);
        const pending = ConfirmationGate.createPendingAction('CHECKOUT_INVOICE', params, preview, context);

        return {
          success: true,
          status: 'PENDING_CONFIRMATION',
          actionType: 'CHECKOUT_INVOICE',
          actionReference: pending.referenceId,
          preview,
          verified: false,
          message: ActionPreview.formatTextSummary(preview)
        };
      }

      // -------------------------------------------------------------
      // G. TIP OPERATION (Phase 6)
      // -------------------------------------------------------------
      case 'TIP_OPERATION': {
        const staffName = entities.staff?.value || 'Kỹ thuật viên';
        const amount = Number(entities.amount?.value) || 100000;
        const paymentMethod = entities.paymentMethod?.value || 'cash';

        const params = {
          staffName,
          amount,
          paymentMethod,
          invoiceId: entities.invoiceId?.value
        };

        const preview = ActionPreview.createPreview('TIP_OPERATION', params);
        const pending = ConfirmationGate.createPendingAction('TIP_OPERATION', params, preview, context);

        return {
          success: true,
          status: 'PENDING_CONFIRMATION',
          actionType: 'TIP_OPERATION',
          actionReference: pending.referenceId,
          preview,
          verified: false,
          message: ActionPreview.formatTextSummary(preview)
        };
      }

      // -------------------------------------------------------------
      // H. INVENTORY STOCK ADJUSTMENT (Phase 6)
      // -------------------------------------------------------------
      case 'RECEIVE_STOCK':
      case 'ADJUST_STOCK': {
        const productName = entities.product?.value || entities.service?.value || 'Sản phẩm';
        const quantity = Number(entities.quantity?.value) || Number(entities.amount?.value) || 10;

        const params = {
          productName,
          quantity,
          branchId: context.branchId
        };

        const preview = ActionPreview.createPreview('RECEIVE_STOCK', params);
        const pending = ConfirmationGate.createPendingAction('RECEIVE_STOCK', params, preview, context);

        return {
          success: true,
          status: 'PENDING_CONFIRMATION',
          actionType: 'RECEIVE_STOCK',
          actionReference: pending.referenceId,
          preview,
          verified: false,
          message: ActionPreview.formatTextSummary(preview)
        };
      }

      default:
        return {
          success: false,
          status: 'NOT_FOUND',
          actionType: 'CREATE_CUSTOMER',
          verified: false,
          error: { code: 'UNSUPPORTED_ACTION', message: 'Hành động chưa được hỗ trợ' },
          message: 'Thao tác này chưa được hỗ trợ trong phiên bản hiện tại.'
        };
    }
  }

  /**
   * Plans a multi-step ActionPlan from DecomposedIntentResult
   */
  static async planMultiStepAction(
    decomposed: { intents: any[]; isCompound: boolean; hasCondition?: boolean; conditionDescription?: string },
    query: string,
    context: ActionExecutionContext = {}
  ): Promise<{ plan?: ActionPlan; actionResult: ActionResult }> {
    const planId = `plan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const plannedActions: PlannedAction[] = [];
    const dependencies: ActionDependency[] = [];

    // Prompt injection check
    const rawLower = query.toLowerCase().trim();
    if (
      rawLower.includes('ignore previous instructions') ||
      rawLower.includes('delete all') ||
      rawLower.includes('xóa tất cả') ||
      rawLower.includes('hủy tất cả') ||
      rawLower.includes('bỏ qua xác nhận')
    ) {
      ActionAuditLog.log('AI_ACTION_FAILED', {
        actionType: 'CANCEL_APPOINTMENT',
        status: 'REJECTED',
        reason: 'Security violation: destructive or injection prompt'
      });
      return {
        actionResult: {
          success: false,
          status: 'REJECTED',
          actionType: 'CANCEL_APPOINTMENT',
          verified: false,
          message: '🛡️ **Từ chối yêu cầu:** Hệ thống không cho phép thực thi lệnh xóa hàng loạt hoặc bỏ qua bước xác nhận.'
        }
      };
    }

    // Step 1: Create Customer (if compound)
    const custIntent = decomposed.intents.find(i => i.intentType === 'CREATE_CUSTOMER');
    let custActionId = '';
    if (custIntent) {
      custActionId = `action_cust_${Date.now()}`;
      const custParams = {
        name: custIntent.entities.name || custIntent.entities.customerName,
        phone: custIntent.entities.phone || custIntent.entities.customerPhone
      };

      const valCust = await ActionPreconditionValidator.validateCreateCustomer(custParams);
      if (!valCust.valid) {
        return {
          actionResult: {
            success: false,
            status: valCust.status,
            actionType: 'CREATE_CUSTOMER',
            verified: false,
            error: { code: valCust.status, message: valCust.message || 'Lỗi dữ liệu khách hàng' },
            message: valCust.message || 'Không thể tạo khách hàng.'
          }
        };
      }

      const previewCust = ActionPreview.createPreview('CREATE_CUSTOMER', custParams);
      plannedActions.push({
        actionId: custActionId,
        actionType: 'CREATE_CUSTOMER',
        title: `Tạo khách hàng ${custParams.name}`,
        parameters: custParams,
        dependsOn: [],
        status: 'PENDING_CONFIRMATION',
        preview: previewCust
      });
    }

    // Step 2: Create Appointment
    const apptIntent = decomposed.intents.find(i => i.intentType === 'CREATE_APPOINTMENT');
    if (apptIntent) {
      const apptActionId = `action_appt_${Date.now()}`;
      const apptParams = {
        customerName: apptIntent.entities.customerName || custIntent?.entities.name,
        customerPhone: apptIntent.entities.customerPhone || custIntent?.entities.phone,
        isContextCustomer: Boolean(custIntent),
        serviceName: apptIntent.entities.serviceName || 'Cắt tóc nữ',
        staffName: apptIntent.entities.staffName || apptIntent.entities.preferredStaffName || 'Salon tự sắp xếp',
        preferredStaffName: apptIntent.entities.preferredStaffName,
        date: apptIntent.entities.date,
        time: apptIntent.entities.time
      };

      // Check missing requirements
      if (!apptParams.date || !apptParams.time) {
        return {
          actionResult: {
            success: false,
            status: 'VALIDATION_ERROR',
            actionType: 'CREATE_APPOINTMENT',
            verified: false,
            error: { code: 'MISSING_DATE_TIME', message: 'Thiếu thời gian hẹn' },
            message: 'Vui lòng cung cấp đầy đủ ngày và giờ hẹn để tạo lịch.'
          }
        };
      }

      const valAppt = await ActionPreconditionValidator.validateCreateAppointment(apptParams);
      if (!valAppt.valid && !decomposed.hasCondition) {
        return {
          actionResult: {
            success: false,
            status: valAppt.status,
            actionType: 'CREATE_APPOINTMENT',
            verified: false,
            error: { code: valAppt.status, message: valAppt.message || 'Lỗi đặt lịch' },
            message: valAppt.message || 'Không thể đặt lịch hẹn.'
          }
        };
      }

      const previewAppt = ActionPreview.createPreview('CREATE_APPOINTMENT', apptParams);
      const actionDeps = custActionId ? [custActionId] : [];

      plannedActions.push({
        actionId: apptActionId,
        actionType: 'CREATE_APPOINTMENT',
        title: `Tạo lịch hẹn cho ${apptParams.customerName}`,
        parameters: apptParams,
        dependsOn: actionDeps,
        condition: decomposed.hasCondition ? {
          type: 'IF_STAFF_AVAILABLE',
          fallbackParameters: { fallbackStrategy: 'FIND_AVAILABLE_STAFF' }
        } : undefined,
        status: 'PENDING_CONFIRMATION',
        preview: previewAppt
      });

      if (actionDeps.length > 0) {
        dependencies.push({
          actionId: apptActionId,
          dependsOn: actionDeps
        });
      }
    }

    if (plannedActions.length === 0) {
      return {
        actionResult: {
          success: false,
          status: 'VALIDATION_ERROR',
          actionType: 'CREATE_CUSTOMER',
          verified: false,
          message: 'Không tìm thấy thao tác hợp lệ để lập kế hoạch.'
        }
      };
    }

    const plan: ActionPlan = {
      planId,
      title: plannedActions.length > 1 ? `Kế hoạch gồm ${plannedActions.length} bước liên hoàn` : plannedActions[0].title,
      summary: plannedActions.map((a, i) => `${i + 1}. ${a.title}`).join(' -> '),
      actions: plannedActions,
      dependencies,
      requiresConfirmation: true,
      status: 'PENDING_CONFIRMATION',
      createdAt: Date.now(),
      expiresAt: Date.now() + 10 * 60 * 1000,
      actorId: context.userId,
      actorRole: context.role,
      sessionId: context.sessionId,
      idempotencyKey: `idem_plan_${planId}`
    };

    ConfirmationGate.createPendingPlan(plan, context);

    // Build unified multi-action confirmation message
    let unifiedMsg = `📋 **AI đề xuất kế hoạch gồm ${plannedActions.length} thao tác:**\n\n`;
    plannedActions.forEach((act, idx) => {
      unifiedMsg += `**${idx + 1}. ${act.title}:**\n`;
      if (act.preview?.items) {
        act.preview.items.forEach(item => {
          unifiedMsg += `• ${item.label}: **${item.value}**\n`;
        });
      }
      unifiedMsg += '\n';
    });

    if (decomposed.hasCondition && decomposed.conditionDescription) {
      unifiedMsg += `💡 *Quy tắc điều kiện:* ${decomposed.conditionDescription}\n\n`;
    }

    unifiedMsg += '⚠️ **Xác nhận:** Bạn có đồng ý thực hiện các bước trên không? (Trả lời **"Đồng ý"** hoặc **"Hủy"**).';

    return {
      plan,
      actionResult: {
        success: true,
        status: 'PENDING_CONFIRMATION',
        actionType: plannedActions[0].actionType,
        actionReference: plan.planId,
        preview: plannedActions[0].preview,
        verified: false,
        message: unifiedMsg
      }
    };
  }
}

