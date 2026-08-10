/**
 * Seeders Index — Central export for all sample data seeders.
 * Used by individual pages and the global "Seed All" utility.
 */

export { seedServiceData } from './serviceSeeder';
export { seedCustomerData } from './customerSeeder';
export { seedAppointmentData } from './appointmentSeeder';
export { seedInvoiceData } from './invoiceSeeder';
export { seedStaffData } from './staffSeeder';
import { base44 } from '../../api/base44Client';

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

  // Fetch branch language if branchId is specific, otherwise default to vi
  let lang = 'vi';
  if (branchId && branchId !== 'all') {
    try {
      const branches = await base44.entities.Branch.filter({ id: branchId });
      if (branches.length > 0 && branches[0].language) {
        lang = branches[0].language.substring(0, 2).toLowerCase(); // 'en', 'vi', 'en-US' -> 'en'
      }
    } catch (e) {
      console.warn("Could not fetch branch language, defaulting to vi");
    }
  }

  const step = (label, fn) => {
    onProgress?.(label);
    return fn();
  };

  results.services  = await step('Đang seed Dịch vụ & Sản phẩm...', () => import('./serviceSeeder').then(m => m.seedServiceData(branchId, onProgress, lang)));
  results.staff     = await step('Đang seed Nhân viên...', () => import('./staffSeeder').then(m => m.seedStaffData(branchId, onProgress, lang)));
  results.customers = await step('Đang seed Khách hàng...', () => import('./customerSeeder').then(m => m.seedCustomerData(branchId, onProgress, lang)));
  results.appointments = await step('Đang seed Lịch hẹn...', () => import('./appointmentSeeder').then(m => m.seedAppointmentData(branchId, onProgress, lang)));
  results.invoices  = await step('Đang seed Hoá đơn...', () => import('./invoiceSeeder').then(m => m.seedInvoiceData(branchId, onProgress, lang)));

  onProgress?.(null);
  return results;
}
