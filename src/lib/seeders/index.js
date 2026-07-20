/**
 * Seeders Index — Central export for all sample data seeders.
 * Used by individual pages and the global "Seed All" utility.
 */

export { seedServiceData } from './serviceSeeder';
export { seedCustomerData } from './customerSeeder';
export { seedAppointmentData } from './appointmentSeeder';
export { seedInvoiceData } from './invoiceSeeder';
export { seedStaffData } from './staffSeeder';

/**
 * seedAll — Seeds all modules in dependency order.
 * 1. Services (no deps)
 * 2. Staff (no deps)
 * 3. Customers (no deps)
 * 4. Appointments (needs Staff + Services)
 * 5. Invoices (needs Customers + Services)
 */
export async function seedAll(branchId, onProgress) {
  const results = {};

  const step = (label, fn) => {
    onProgress?.(label);
    return fn();
  };

  results.services  = await step('Đang seed Dịch vụ & Sản phẩm...', () => import('./serviceSeeder').then(m => m.seedServiceData(branchId, onProgress)));
  results.staff     = await step('Đang seed Nhân viên...', () => import('./staffSeeder').then(m => m.seedStaffData(branchId, onProgress)));
  results.customers = await step('Đang seed Khách hàng...', () => import('./customerSeeder').then(m => m.seedCustomerData(branchId, onProgress)));
  results.appointments = await step('Đang seed Lịch hẹn...', () => import('./appointmentSeeder').then(m => m.seedAppointmentData(branchId, onProgress)));
  results.invoices  = await step('Đang seed Hoá đơn...', () => import('./invoiceSeeder').then(m => m.seedInvoiceData(branchId, onProgress)));

  onProgress?.(null);
  return results;
}
