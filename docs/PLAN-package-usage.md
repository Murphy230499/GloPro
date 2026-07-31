# PLAN: Use Purchased Packages and Treatments at POS

## 1. Context & Goal
- **User Request:** Cho phép khách hàng sử dụng các Gói dịch vụ (Packages) và Liệu trình (Treatments) đã mua trước đó tại màn hình Thu ngân (POS) và popup Tạo hoá đơn trực tiếp.
- **Current State:** The POS system allows selling packages and treatments, but there is no mechanism to track a customer's purchased packages, their remaining usage, or to apply them to a new invoice with a 0đ price.
- **Goal:**
  1. Add database tables to track purchased packages/treatments and their usage history.
  2. Update the POS and Checkout UI to allow selecting and applying purchased packages to the cart.
  3. Ensure services within an applied package have a price of 0đ.
  4. Automatically deduct remaining usage and log history upon successful checkout.

## 2. Task Breakdown

### Phase 1: Database Schema & Logic (Backend)
- **Create new tables via Supabase migration:**
  - `customer_package`: Tracks packages owned by a customer (`id`, `customer_id`, `package_id`, `total_usage`, `remaining_usage`, `status`, `expires_at`).
  - `customer_treatment`: Tracks treatments owned by a customer.
  - `usage_history`: Logs every usage (`id`, `customer_id`, `reference_id` (package/treatment), `invoice_id`, `used_at`, `deducted_count`).
- **Update Invoice Creation Logic:**
  - Add logic (trigger or application level) that when an invoice containing a package/treatment is PAID, it inserts a new record into `customer_package` or `customer_treatment`.
  - Add logic that when an invoice applying a pre-purchased package is PAID, it deducts the `remaining_usage` and inserts into `usage_history`.

### Phase 2: POS UI - Displaying Available Packages
- **`src/views/POS.jsx` & `src/components/pos/CheckoutModal.jsx`**:
  - When a customer is selected, fetch their active `customer_package` and `customer_treatment` records.
  - Show a prominent button "Sử dụng Gói/Liệu trình" if the customer has available items.
  - Clicking the button opens a selection modal listing available packages (showing remaining usages).

### Phase 3: POS UI - Cart Logic (Frontend)
- **Cart Data Structure:**
  - When a package is selected for use, add its constituent services to the cart.
  - Mark these cart items with special flags: `is_from_package: true`, `package_id`, and set their `price` to `0`.
- **Cart Rendering:**
  - Update the cart UI to group services under their parent package name (similar to the provided image's logic, but fitting the current GloPro UI).
  - Show the original price crossed out, and the applied price as `0đ`.

### Phase 4: Checkout & Integration
- **`handleCheckout` modification:**
  - Ensure the 0đ services don't affect the subtotal.
  - Pass the package usage data in the invoice payload so the backend can deduct the usage correctly.

## 3. Verification Plan
- Create a test customer and sell them a Package (e.g., usage = 5). Verify `customer_package` is created.
- Open POS, select the customer. Verify the "Sử dụng Gói" button appears.
- Apply the package to the cart. Verify the services are added at 0đ and grouped logically.
- Complete the checkout. Verify the invoice is created successfully with 0đ for those services.
- Verify the `remaining_usage` drops to 4, and a `usage_history` record is created.

## 4. Affected Files
- `supabase/migrations/[new_migration].sql` (Create tables)
- `src/views/POS.jsx` (Add package selection logic)
- `src/components/pos/CheckoutModal.jsx` (Cart grouping and 0đ logic)
- API/SDK clients to handle new entities (`CustomerPackage`, `UsageHistory`).

## 5. Agent Assignments
- **`backend-specialist`**: Create the database migrations and update the invoice processing logic to handle package issuance and usage deduction securely.
- **`frontend-specialist`**: Build the UI for package selection, update the cart rendering logic, and modify the checkout payload.
