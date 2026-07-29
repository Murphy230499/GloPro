export interface IProductItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  quantityInStock: number;
  minThreshold: number;
  costPrice: number;
  sellingPrice: number;
  expiryDate?: string; // YYYY-MM-DD
  supplierName?: string;
}

export interface IStockMovement {
  id: string;
  productId: string;
  productName: string;
  type: 'in' | 'out';
  quantity: number;
  reason: 'import' | 'sale' | 'usage' | 'damaged' | 'expired';
  created_at: string;
}

export interface ISupplier {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  suppliedProducts?: string[];
}

export interface IPurchaseOrder {
  id: string;
  orderNumber: string;
  supplierId: string;
  supplierName: string;
  items: Array<{ productName: string; quantity: number; unitPrice: number; total: number }>;
  totalAmount: number;
  status: 'draft' | 'ordered' | 'received' | 'cancelled';
  created_at: string;
}

// Tool Inputs
export interface ICheckStockInput {
  query?: string;
  category?: string;
  lowStockOnly?: boolean;
}

export interface IStockInInput {
  productId: string;
  quantity: number;
  costPrice?: number;
  supplierName?: string;
  expiryDate?: string;
  note?: string;
}

export interface IStockOutInput {
  productId: string;
  quantity: number;
  reason: 'sale' | 'usage' | 'damaged' | 'expired';
  note?: string;
}

export interface IManageSupplierInput {
  action: 'create' | 'update' | 'list';
  supplierId?: string;
  name?: string;
  phone?: string;
  address?: string;
}

export interface IManagePurchaseOrderInput {
  action: 'create' | 'approve' | 'cancel';
  supplierId: string;
  supplierName: string;
  items: Array<{ productName: string; quantity: number; unitPrice: number }>;
}

export interface ICheckExpiryInput {
  daysThreshold?: number; // e.g. 30 days
}

export interface ICheckLowStockAlertsInput {
  thresholdRatio?: number;
}

export interface IGetInventoryReportInput {
  timeframe?: 'month' | 'quarter' | 'year';
}
