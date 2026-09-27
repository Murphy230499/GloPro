/**
 * Tool Registry
 * 
 * Central registry for authorized Read Tools.
 * Guarantees that only registered, read-only tools can be executed.
 * Rejects unregistered tool names (NO_AVAILABLE_TOOL).
 */

import { ReadTool } from './contracts/ToolContracts';
import { CustomerReadTool } from './tools/CustomerReadTool';
import { StaffReadTool } from './tools/StaffReadTool';
import { ServiceReadTool } from './tools/ServiceReadTool';
import { ProductReadTool } from './tools/ProductReadTool';
import { AppointmentReadTool } from './tools/AppointmentReadTool';
import { InvoiceReadTool } from './tools/InvoiceReadTool';
import { RevenueReadTool } from './tools/RevenueReadTool';
import { InventoryReadTool } from './tools/InventoryReadTool';
import { PayrollReadTool } from './tools/PayrollReadTool';

export class ToolRegistry {
  private static tools: Map<string, ReadTool> = new Map();

  static {
    this.register(new CustomerReadTool());
    this.register(new StaffReadTool());
    this.register(new ServiceReadTool());
    this.register(new ProductReadTool());
    this.register(new AppointmentReadTool());
    this.register(new InvoiceReadTool());
    this.register(new RevenueReadTool());
    this.register(new InventoryReadTool());
    this.register(new PayrollReadTool());
  }

  static register(tool: ReadTool): void {
    this.tools.set(tool.name, tool);
    // Also register lowercase and snake_case aliases for compatibility
    this.tools.set(tool.name.toLowerCase(), tool);
  }

  static get(toolName: string): ReadTool | undefined {
    if (!toolName) return undefined;
    return this.tools.get(toolName) || this.tools.get(toolName.toLowerCase());
  }

  static has(toolName: string): boolean {
    if (!toolName) return false;
    return this.tools.has(toolName) || this.tools.has(toolName.toLowerCase());
  }

  static getAll(): ReadTool[] {
    // Unique list by actual name
    const unique = new Map<string, ReadTool>();
    for (const tool of this.tools.values()) {
      unique.set(tool.name, tool);
    }
    return Array.from(unique.values());
  }
}
