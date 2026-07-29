import { supabase } from './supabaseClient';
import { base44 } from '@/api/base44Client';
import { loadSuppliersData, loadStockReceiptsData, loadStockTransfersData } from './seeders/inventorySeeder';

const isUUID = (str) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

/**
 * Pushes and synchronizes all system entities & local mock data to Supabase Cloud Database.
 * Matches exact singular table names from Supabase Schema:
 * product, service, customer, staff, invoice, appointment, branch, servicegroup, servicepackage, etc.
 */
export async function syncAllDataToSupabase(onProgress) {
  const log = (msg) => onProgress?.(msg);
  log('Đang kết nối Supabase Cloud Database...');

  let report = {
    services: 0,
    products: 0,
    customers: 0,
    staff: 0,
    invoices: 0,
    appointments: 0,
    suppliers: 0,
    errors: []
  };

  try {
    // 1. Sync Services -> table: service
    log('Đang đẩy dữ liệu Dịch Vụ (table: service)...');
    const svcs = await base44.entities.Service.list().catch(() => []);
    for (const s of svcs) {
      try {
        const payload = { name: s.name };
        if (isUUID(s.id)) payload.id = s.id;
        
        const { error } = await supabase.from('service').insert([payload]);
        if (error) {
          console.warn(`[Supabase service error]:`, error.message);
          report.errors.push(`service: ${error.message}`);
        } else {
          report.services++;
        }
      } catch (e) {
        console.warn('Service sync exception:', e);
      }
    }

    // 2. Sync Products -> table: product
    log('Đang đẩy dữ liệu Sản Phẩm (table: product)...');
    const prods = await base44.entities.Product.list().catch(() => []);
    for (const p of prods) {
      try {
        const payload = { name: p.name };
        if (isUUID(p.id)) payload.id = p.id;

        const { error } = await supabase.from('product').insert([payload]);
        if (error) {
          console.warn(`[Supabase product error]:`, error.message);
          report.errors.push(`product: ${error.message}`);
        } else {
          report.products++;
        }
      } catch (e) {
        console.warn('Product sync exception:', e);
      }
    }

    // 3. Sync Customers -> table: customer
    log('Đang đẩy dữ liệu Khách Hàng (table: customer)...');
    const custs = await base44.entities.Customer.list().catch(() => []);
    for (const c of custs) {
      try {
        const payload = { name: c.name };
        if (isUUID(c.id)) payload.id = c.id;

        const { error } = await supabase.from('customer').insert([payload]);
        if (error) {
          console.warn(`[Supabase customer error]:`, error.message);
          report.errors.push(`customer: ${error.message}`);
        } else {
          report.customers++;
        }
      } catch (e) {}
    }

    // 4. Sync Staff -> table: staff
    log('Đang đẩy dữ liệu Nhân Viên (table: staff)...');
    const staffList = await base44.entities.Staff.list().catch(() => []);
    for (const st of staffList) {
      try {
        const payload = { name: st.name };
        if (isUUID(st.id)) payload.id = st.id;

        const { error } = await supabase.from('staff').insert([payload]);
        if (error) {
          console.warn(`[Supabase staff error]:`, error.message);
          report.errors.push(`staff: ${error.message}`);
        } else {
          report.staff++;
        }
      } catch (e) {}
    }

    // 5. Sync Invoices -> table: invoice
    log('Đang đẩy dữ liệu Hóa Đơn (table: invoice)...');
    const invs = await base44.entities.Invoice.list().catch(() => []);
    for (const inv of invs) {
      try {
        const payload = { name: inv.code || inv.id };
        if (isUUID(inv.id)) payload.id = inv.id;

        const { error } = await supabase.from('invoice').insert([payload]);
        if (!error) report.invoices++;
      } catch (e) {}
    }

    // 6. Sync Appointments -> table: appointment
    log('Đang đẩy dữ liệu Lịch Hẹn (table: appointment)...');
    const appts = await base44.entities.Appointment.list().catch(() => []);
    for (const app of appts) {
      try {
        const payload = { name: app.customer_name || 'Lịch hẹn' };
        if (isUUID(app.id)) payload.id = app.id;

        const { error } = await supabase.from('appointment').insert([payload]);
        if (!error) report.appointments++;
      } catch (e) {}
    }

    // 7. Sync Suppliers
    log('Đang đẩy dữ liệu Nhà Cung Cấp...');
    const suppliers = loadSuppliersData();
    for (const sup of suppliers) {
      try {
        const payload = { name: sup.name };
        if (isUUID(sup.id)) payload.id = sup.id;

        // Try supplier or suppliers
        const { error } = await supabase.from('supplier').insert([payload]);
        if (!error) report.suppliers++;
      } catch (e) {}
    }

    log(null);
    return report;
  } catch (err) {
    console.error('Supabase Sync Error:', err);
    log(null);
    throw err;
  }
}
