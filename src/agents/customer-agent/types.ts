export interface ICustomer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  gender?: 'male' | 'female' | 'other';
  birthday?: string;
  address?: string;
  tier?: 'Đồng' | 'Bạc' | 'Vàng' | 'Kim Cương';
  loyaltyPoints?: number;
  totalSpent?: number;
  visitCount?: number;
  debtAmount?: number;
  notes?: string[];
  created_at?: string;
  updated_at?: string;
}

// 1. Search
export interface ISearchCustomerInput {
  query: string;
  tier?: string;
  limit?: number;
}

// 2. Create
export interface ICreateCustomerInput {
  name: string;
  phone: string;
  email?: string;
  gender?: 'male' | 'female' | 'other';
  birthday?: string;
  tier?: 'Đồng' | 'Bạc' | 'Vàng' | 'Kim Cương';
  initialNotes?: string;
}

// 3. Update
export interface IUpdateCustomerInput {
  customerId: string;
  name?: string;
  phone?: string;
  email?: string;
  tier?: 'Đồng' | 'Bạc' | 'Vàng' | 'Kim Cương';
  address?: string;
}

// 4. Delete
export interface IDeleteCustomerInput {
  customerId: string;
  reason: string;
}

// 5. Merge
export interface IMergeCustomersInput {
  primaryCustomerId: string;
  secondaryCustomerId: string;
  mergeNotes?: boolean;
  mergePoints?: boolean;
}

// 6. History
export interface IGetCustomerHistoryInput {
  customerId: string;
  limit?: number;
}

// 7. Membership
export interface IManageMembershipInput {
  customerId: string;
  newTier: 'Đồng' | 'Bạc' | 'Vàng' | 'Kim Cương';
  reason?: string;
}

// 8. Loyalty Points
export interface IManageLoyaltyPointsInput {
  customerId: string;
  action: 'add' | 'deduct' | 'set';
  points: number;
  reason: string;
}

// 9. Notes
export interface IManageCustomerNotesInput {
  customerId: string;
  action: 'add' | 'remove';
  noteText: string;
}

// 10. Debt
export interface IManageCustomerDebtInput {
  customerId: string;
  action: 'record_debt' | 'pay_debt';
  amount: number;
  note?: string;
}

// 11. Statistics
export interface IGetCustomerStatisticsInput {
  timeframe?: 'day' | 'week' | 'month' | 'year' | 'all';
  tierFilter?: string;
}
