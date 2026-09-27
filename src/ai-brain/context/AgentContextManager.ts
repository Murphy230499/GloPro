/**
 * AgentContextManager (Phase 4 & Phase 7 Production Persistent Runtime)
 * 
 * Manages conversational context across multi-turn interactions, tracks recent entities,
 * resolves pronouns ("khách này", "chị ấy", "lịch này"), detects context switches,
 * handles user corrections ("Không, 4 giờ"), and provides a persistent session bridge
 * with tenant isolation, actor binding, and optimistic concurrency versioning.
 */

import { ActionPlan, PendingAction } from '../action-engine/ActionContracts';
import { parseVietnameseDateTime } from '../intent/DateTimeParser';
import {
  AgentSession,
  IAgentSessionStore,
  TrustedActorContext,
  validateSessionStateSize
} from './AgentSessionContracts';
import { AgentSessionStoreFactory } from './AgentSessionStoreFactory';

export interface RecentEntity {
  type: 'customer' | 'staff' | 'appointment' | 'service';
  id?: string;
  name: string;
  phone?: string;
  data?: any;
  timestamp: number;
}

export interface SessionContext {
  sessionId: string;
  actorId?: string;
  actorRole?: string;
  branchId?: string;
  branchName?: string;
  currentCustomer?: {
    id?: string;
    name: string;
    phone?: string;
    tier?: string;
  };
  currentStaff?: {
    id?: string;
    name: string;
  };
  currentAppointment?: {
    id?: string;
    customerName?: string;
    date?: string;
    time?: string;
    serviceName?: string;
    staffName?: string;
    status?: string;
  };
  currentService?: {
    id?: string;
    name: string;
    price?: number;
  };
  pendingPlan?: ActionPlan | null;
  pendingAction?: PendingAction | null;
  recentEntities: RecentEntity[];
  recentActions: Array<{ actionType: string; status: string; timestamp: number }>;
  conversationTopic?: string;
  updatedAt: number;
}

export type InteractionType =
  | 'NEW_INTENT'
  | 'FOLLOW_UP'
  | 'CONFIRMATION'
  | 'CANCELLATION'
  | 'CORRECTION'
  | 'CLARIFICATION';

export class AgentContextManager {
  private static sessions: Map<string, SessionContext> = new Map();
  private static readonly DEFAULT_TTL_MS = 15 * 60 * 1000; // 15 minutes

  /**
   * Configures or retrieves the persistent session store adapter
   */
  static getStore(): IAgentSessionStore {
    return AgentSessionStoreFactory.getStore();
  }

  static setStore(store: IAgentSessionStore | null): void {
    AgentSessionStoreFactory.setStore(store);
  }

  /**
   * Loads a persistent session from the configured store with strict isolation checks,
   * syncing it into active request memory.
   */
  static async loadPersistentSession(
    sessionId: string,
    trusted: TrustedActorContext
  ): Promise<AgentSession | null> {
    const store = this.getStore();
    const session = await store.getSession(sessionId, trusted);
    if (session) {
      this.sessions.set(session.id, session.state);
    }
    return session;
  }

  /**
   * Retrieves or creates a persistent session bound to a conversation and trusted actor/tenant
   */
  static async loadOrCreatePersistentSession(
    conversationId: string,
    trusted: TrustedActorContext
  ): Promise<AgentSession> {
    const store = this.getStore();
    let session = await store.getSessionByConversation(conversationId, trusted);
    if (!session) {
      session = await store.createSession({
        conversationId,
        actorId: trusted.actorId,
        tenantId: trusted.tenantId,
        branchId: trusted.branchId
      });
    }
    this.sessions.set(session.id, session.state);
    return session;
  }

  /**
   * Flushes and commits session state to the persistent store with optimistic concurrency
   */
  static async savePersistentSession(
    session: AgentSession,
    expectedVersion: number,
    trusted: TrustedActorContext
  ): Promise<AgentSession> {
    const store = this.getStore();
    const activeState = this.sessions.get(session.id) || session.state;
    validateSessionStateSize(activeState);

    const updated = await store.updateSession(
      {
        ...session,
        state: activeState
      },
      expectedVersion,
      trusted
    );

    this.sessions.set(updated.id, updated.state);
    return updated;
  }

  /**
   * Deletes a persistent session
   */
  static async deletePersistentSession(
    sessionId: string,
    trusted: TrustedActorContext
  ): Promise<boolean> {
    this.sessions.delete(sessionId);
    const store = this.getStore();
    return store.deleteSession(sessionId, trusted);
  }

  /**
   * Synchronous accessor for in-memory context (preserves 100% backward compatibility)
   */
  static getSession(sessionId: string): SessionContext {
    this.cleanExpiredSessions();
    let ctx = this.sessions.get(sessionId);
    if (!ctx) {
      ctx = {
        sessionId,
        recentEntities: [],
        recentActions: [],
        updatedAt: Date.now()
      };
      this.sessions.set(sessionId, ctx);
    }
    return ctx;
  }

  /**
   * Updates an entity into active session context
   */
  static recordEntity(
    sessionId: string,
    entity: Omit<RecentEntity, 'timestamp'>
  ): void {
    const ctx = this.getSession(sessionId);
    const stamped: RecentEntity = { ...entity, timestamp: Date.now() };

    ctx.recentEntities = [stamped, ...ctx.recentEntities.filter(e => !(e.type === entity.type && (e.id === entity.id || e.name === entity.name)))].slice(0, 10);

    if (entity.type === 'customer') {
      ctx.currentCustomer = { id: entity.id, name: entity.name, phone: entity.phone };
    } else if (entity.type === 'staff') {
      ctx.currentStaff = { id: entity.id, name: entity.name };
    } else if (entity.type === 'appointment') {
      ctx.currentAppointment = { id: entity.id, ...entity.data };
    } else if (entity.type === 'service') {
      ctx.currentService = { id: entity.id, name: entity.name, price: entity.data?.price };
    }
    ctx.updatedAt = Date.now();
  }

  /**
   * Resolves pronoun references using active session context
   */
  static resolvePronoun(
    query: string,
    sessionId: string
  ): { resolvedCustomer?: any; resolvedAppointment?: any; resolvedStaff?: any } {
    const ctx = this.getSession(sessionId);
    const lower = query.toLowerCase();

    const result: { resolvedCustomer?: any; resolvedAppointment?: any; resolvedStaff?: any } = {};

    // Customer pronouns
    if (/(?:^|[\s,.:;!?])(khách này|anh này|chị này|ông này|bà này|anh ấy|chị ấy|khách đó|khách vừa rồi|người này|người đó)(?:$|[\s,.:;!?])/i.test(lower)) {
      if (ctx.currentCustomer) {
        result.resolvedCustomer = ctx.currentCustomer;
      } else {
        const lastCust = ctx.recentEntities.find(e => e.type === 'customer');
        if (lastCust) result.resolvedCustomer = { id: lastCust.id, name: lastCust.name, phone: lastCust.phone };
      }
    }

    // Appointment pronouns
    if (/(?:^|[\s,.:;!?])(lịch này|lịch hẹn này|lịch đó|lịch vừa đặt)(?:$|[\s,.:;!?])/i.test(lower)) {
      if (ctx.currentAppointment) {
        result.resolvedAppointment = ctx.currentAppointment;
      } else {
        const lastAppt = ctx.recentEntities.find(e => e.type === 'appointment');
        if (lastAppt) result.resolvedAppointment = { id: lastAppt.id, ...lastAppt.data };
      }
    }

    // Staff pronouns
    if (/(?:^|[\s,.:;!?])(thợ này|nhân viên này|thợ cũ|bạn này|thợ đó)(?:$|[\s,.:;!?])/i.test(lower)) {
      if (ctx.currentStaff) {
        result.resolvedStaff = ctx.currentStaff;
      } else {
        const lastStaff = ctx.recentEntities.find(e => e.type === 'staff');
        if (lastStaff) result.resolvedStaff = { id: lastStaff.id, name: lastStaff.name };
      }
    }

    return result;
  }

  /**
   * Classifies user interaction into Context Flow Types
   */
  static classifyInteraction(message: string, sessionId: string): InteractionType {
    const ctx = this.getSession(sessionId);
    const lower = message.toLowerCase().trim();

    // 1. Check for User Correction to Pending Action / Plan
    const hasPending = Boolean(ctx.pendingPlan || ctx.pendingAction);
    if (hasPending) {
      const isCorrection = /^(?:không,?\s+)?(?:đổi\s+sang|dời\s+sang|chuyển\s+sang|lấy\s+|chọn\s+)?(?:\d{1,2}\s*(?:h|giờ)|\d{4}-\d{2}-\d{2}|thợ\s+[^\s]+)/i.test(lower) ||
        lower.startsWith('không,') || lower.startsWith('không phải') || lower.includes('đổi sang') || lower.includes('dời sang');
      if (isCorrection && !/^(?:không|hủy|thôi|bỏ qua)\s*$/i.test(lower)) {
        return 'CORRECTION';
      }

      // Check confirmation keywords
      if (/^(?:đồng ý|xác nhận|ok|oke|okie|tạo đi|tạo luôn|lưu đi|hủy đi|yes|confirm)\b/i.test(lower)) {
        return 'CONFIRMATION';
      }

      // Check pure cancellation
      if (/^(?:không|hủy|thôi|bỏ qua|đừng tạo|đừng hủy|cancel|no)\b/i.test(lower)) {
        return 'CANCELLATION';
      }
    }

    // 2. Check for Topic Switch
    if (/\b(doanh thu|báo cáo|doanh số|top bán chạy|tiền tip)\b/i.test(lower)) {
      if (ctx.conversationTopic && ctx.conversationTopic !== 'revenue') {
        ctx.conversationTopic = 'revenue';
        return 'NEW_INTENT';
      }
    }

    // 3. Follow-up detection
    if (/\b(khách này|tiếp tục|đặt tiếp|còn lịch không|xem thêm)\b/i.test(lower)) {
      return 'FOLLOW_UP';
    }

    return 'NEW_INTENT';
  }

  /**
   * Applies a correction to an existing pending plan / action
   */
  static applyCorrection(
    sessionId: string,
    correctionText: string
  ): { corrected: boolean; updatedField?: string; newValue?: any } {
    const ctx = this.getSession(sessionId);
    const parsedDt = parseVietnameseDateTime(correctionText);

    if (parsedDt.time && ctx.pendingPlan) {
      for (const action of ctx.pendingPlan.actions) {
        if (action.actionType === 'CREATE_APPOINTMENT' || action.actionType === 'UPDATE_CUSTOMER') {
          action.parameters.time = parsedDt.time.value;
          if (action.preview) {
            const timeItem = action.preview.items.find(i => i.label.toLowerCase().includes('thời gian') || i.label.toLowerCase().includes('giờ'));
            if (timeItem) {
              timeItem.value = `${action.parameters.date || ''} ${parsedDt.time.value}`.trim();
            }
          }
        }
      }
      return { corrected: true, updatedField: 'time', newValue: parsedDt.time.value };
    }

    if (parsedDt.time && ctx.pendingAction) {
      ctx.pendingAction.parameters.time = parsedDt.time.value;
      return { corrected: true, updatedField: 'time', newValue: parsedDt.time.value };
    }

    return { corrected: false };
  }

  /**
   * Sets the active pending plan
   */
  static setPendingPlan(sessionId: string, plan: ActionPlan | null): void {
    const ctx = this.getSession(sessionId);
    ctx.pendingPlan = plan;
    ctx.updatedAt = Date.now();
  }

  /**
   * Clears context on request or when expired
   */
  static clearContext(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  private static cleanExpiredSessions(): void {
    const now = Date.now();
    for (const [id, ctx] of this.sessions.entries()) {
      if (now - ctx.updatedAt > this.DEFAULT_TTL_MS) {
        this.sessions.delete(id);
      }
    }
  }
}
