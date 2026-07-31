# Deposit Management Module Implementation Plan

## Goal Description
Build a complete Deposit Management module for a Salon, Spa, and Tattoo management system. The module will support collecting, managing, applying, refunding, and reporting deposits while integrating seamlessly with the existing Appointment, Customer, POS, Cash Flow, Notification, and Reporting modules. 

The implementation will follow a clean, modular architecture that supports multi-branch operations and adheres to SOLID principles.

## 🛑 Socratic Gate (Open Questions)
Before writing any code, we need to clarify the following business logic and edge cases:

1. **Deposit Policy Precedence**: If a service requires a 20% deposit but the specific customer type has a "No Deposit Required" rule, which rule takes precedence?
2. **Partial Payments**: Are customers allowed to pay a deposit in multiple small installments before the appointment, or is it typically a one-time required payment?
3. **Refunds on Cancellation**: Should the system automatically trigger a Stripe/Banking API refund for cancellations meeting the 100% refund criteria, or should it just mark it as "Refund Owed" for manual processing by the cashier?
4. **Deposit Forfeiture**: When a deposit is marked as "Forfeited" (e.g. No-show), should the forfeited amount be automatically recorded as business revenue in the Cash Flow module?

---

## Proposed Changes

### Database Schema & API Layer
*This component defines the core Supabase schema, RLS policies, and the Base44 API extensions.*

- **Deposit Table**: `id`, `deposit_number`, `customer_id`, `appointment_id`, `branch_id`, `required_amount`, `paid_amount`, `status`, `payment_method`, `expiration_date`, `notes`, `created_at`, `updated_at`, `created_by`.
- **Deposit Policy Table**: `id`, `entity_type` (service, category, staff), `entity_id`, `rule_type` (fixed, percentage, none), `value`.
- **Deposit Transaction Table**: Logs every status change and payment/refund applied.
- Register `Deposit`, `DepositPolicy`, and `DepositTransaction` entities in the `createEntityAdapter`.

### UI/UX: Deposit Management Dashboard
*This component provides the frontend interface for managers and receptionists.*

- Main Dashboard: Datatable with Pagination, Filtering (by Status, Branch, Date, Customer), and Searching.
- Metrics cards: Total Deposits, Outstanding Deposits, Forfeited Deposits.
- UI to create, edit, collect, and refund deposits. 
- Integrated payment method selection.
- Admin UI to configure fixed, percentage, or no-deposit rules based on services, staff, or branches.

### Integrations (Appointment & POS)
*This component connects the deposit module with existing workflows.*

- Display automatically calculated required deposit amount when selecting services.
- Prevent confirmation if "require deposit" policy is strictly enabled but no payment is logged.
- Show "Deposit Paid" status visually on the appointment block.
- Automatically detect available deposits for the linked customer/appointment during POS checkout.
- Deduct deposit from the total invoice.
- Generate deposit application transactions when the invoice is completed.
- Integrate deposit payments, refunds, and forfeitures into the cash flow ledger correctly (e.g., Liability until Applied or Forfeited).

### Notifications & Reporting
*This component handles automated alerts and data visualization.*

- Trigger alerts for: Deposit Overdue, Deposit Received, Deposit Refunded.
- Charts for Deposit Trends, Collection Rates, Refund Rates, and No-show forfeiture rates.
- Export to Excel/PDF functionality.

---

## Agent Assignments & Workflow
If approved, the following agents will collaborate on the execution:
1. **backend-specialist**: Database schemas, API endpoints, RLS policies, and core deposit logic.
2. **frontend-specialist**: `Deposit Dashboard`, `Deposit Policies` UI, and `DepositModal`.
3. **cashier-agent**: POS checkout integration and Cash Flow ledger updates.
4. **analytics-agent**: Deposit reporting and dashboard charts.

## Verification Plan

### Automated Tests
- Unit tests for deposit policy calculation logic (checking precedence and percentages).
- Integration tests ensuring POS checkout correctly consumes the deposit and updates the deposit status to `Applied`.

### Manual Verification
- Deploy to local/staging.
- Create an appointment with a 50% deposit policy -> verify UI blocks confirmation without payment.
- Pay the deposit -> Verify cash flow logs it as a liability.
- Checkout the appointment -> Verify the invoice deducts the deposit and cash flow realizes the revenue.
- Cancel the appointment -> Verify refund/forfeit logic applies correctly based on the 48-hour rule.
