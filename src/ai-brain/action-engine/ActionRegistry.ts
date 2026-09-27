/**
 * Action Registry
 * 
 * Central registry for authorized Write Tools (Phase 3).
 * Guarantees that only strictly registered write tools can be called.
 */

import { ActionType, WriteTool } from './ActionContracts';
import { CustomerCreateTool } from './write-tools/CustomerCreateTool';
import { CustomerUpdateTool } from './write-tools/CustomerUpdateTool';
import { AppointmentCreateTool } from './write-tools/AppointmentCreateTool';
import { AppointmentCancelTool } from './write-tools/AppointmentCancelTool';
import { InvoiceCreateTool } from './write-tools/InvoiceCreateTool';
import { InvoiceCheckoutTool } from './write-tools/InvoiceCheckoutTool';
import { TipRecordTool } from './write-tools/TipRecordTool';
import { StockAdjustTool } from './write-tools/StockAdjustTool';

export class ActionRegistry {
  private static tools: Map<ActionType, WriteTool> = new Map();

  static {
    this.register(new CustomerCreateTool());
    this.register(new CustomerUpdateTool());
    this.register(new AppointmentCreateTool());
    this.register(new AppointmentCancelTool());
    this.register(new InvoiceCreateTool());
    this.register(new InvoiceCheckoutTool());
    this.register(new TipRecordTool());
    this.register(new StockAdjustTool());
  }

  static register(tool: WriteTool): void {
    this.tools.set(tool.actionType, tool);
  }

  static get(actionType: ActionType): WriteTool | undefined {
    return this.tools.get(actionType);
  }

  static has(actionType: ActionType): boolean {
    return this.tools.has(actionType);
  }

  static getAll(): WriteTool[] {
    return Array.from(this.tools.values());
  }
}
