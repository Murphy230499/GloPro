export interface IInvoiceItem {
  id: string;
  type: 'service' | 'product';
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  staffId?: string;
  staffName?: string;
}

export interface IPaymentSplit {
  method: 'cash' | 'transfer' | 'card' | 'point';
  amount: number;
  referenceNumber?: string;
}

export interface IInvoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  items: IInvoiceItem[];
  subtotal: number;
  discountAmount: number;
  discountPercentage?: number;
  voucherCode?: string;
  voucherDiscount?: number;
  taxAmount?: number;
  totalAmount: number;
  payments: IPaymentSplit[];
  paidAmount: number;
  changeAmount: number;
  status: 'draft' | 'pending_payment' | 'paid' | 'refunded' | 'cancelled';
  created_at: string;
}

// 1. Create Invoice
export interface ICreateInvoiceInput {
  customerId: string;
  customerName: string;
  customerPhone: string;
  initialItems?: Array<{ name: string; type: 'service' | 'product'; unitPrice: number; quantity?: number }>;
}

// 2. Add Service
export interface IAddServiceToInvoiceInput {
  invoiceId: string;
  serviceName: string;
  unitPrice: number;
  quantity?: number;
  staffName?: string;
}

// 3. Add Product
export interface IAddProductToInvoiceInput {
  invoiceId: string;
  productName: string;
  unitPrice: number;
  quantity?: number;
}

// 4. Apply Discount
export interface IApplyDiscountInput {
  invoiceId: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  reason?: string;
}

// 5. Apply Voucher
export interface IApplyVoucherInput {
  invoiceId: string;
  voucherCode: string;
}

// 6. Split Payment
export interface ISplitPaymentInput {
  invoiceId: string;
  splits: IPaymentSplit[];
}

// 7. Multiple Payment Methods
export interface IMultiplePaymentMethodsInput {
  invoiceId: string;
  payments: Array<{ method: 'cash' | 'transfer' | 'card' | 'point'; amount: number; referenceNumber?: string }>;
}

// 8. Checkout
export interface ICheckoutInvoiceInput {
  invoiceId: string;
  confirmPayment: boolean;
}

// 9. Refund
export interface IRefundInvoiceInput {
  invoiceId: string;
  refundAmount: number;
  reason: string;
  refundMethod: 'cash' | 'transfer' | 'card';
}

// 10. Print Invoice
export interface IPrintInvoiceInput {
  invoiceId: string;
  format?: 'thermal_80mm' | 'a5' | 'pdf';
}
