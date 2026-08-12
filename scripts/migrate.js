import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import WebSocket from 'ws';
globalThis.WebSocket = WebSocket;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createSupabaseClient(supabaseUrl, supabaseKey);

const BASE44_APP_ID = "6a4735b4c553e403102d4a69";
const BASE44_API_KEY = "1326ad962f25440c9e4559736d8aec18";
const BASE44_BASE_URL = process.env.NEXT_PUBLIC_BASE44_APP_BASE_URL || "https://cryptic-zen-groom-flow.base44.app";

const ENTITY_MAP = {
  CustomerGroup: 'customergroup',
  CustomerSegment: 'customersegment',
  CustomerTier: 'customertier',
  CustomerTierHistory: 'customertierhistory',
  Branch: 'branch',
  Customer: 'customer',
  StaffGroup: 'staffgroup',
  Shift: 'shift',
  ShiftTemplate: 'shifttemplate',
  Staff: 'staff',
  StaffSchedule: 'staffschedule',
  StaffAttendance: 'staffattendance',
  ServiceGroup: 'servicegroup',
  Service: 'service',
  ServiceCombo: 'servicecombo',
  ServicePackage: 'servicepackage',
  Product: 'product',
  ProductCombo: 'productcombo',
  Treatment: 'treatment',
  Appointment: 'appointment',
  Invoice: 'invoice',
  Voucher: 'voucher',
  PrepaidCard: 'prepaidcard',
  Membership: 'membership',
  LoyaltyRule: 'loyaltyrule'
};

async function migrateEntity(entityName, tableName) {
  console.log(`\n--- Bắt đầu Migrate bảng ${entityName} ---`);
  try {
    const url = `${BASE44_BASE_URL}/api/apps/${BASE44_APP_ID}/entities/${entityName}`;
    console.log(`Đang tải dữ liệu từ ${url}...`);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "api_key": BASE44_API_KEY
      }
    });

    if (!response.ok) {
      throw new Error(`Base44 API Error: ${response.status} ${response.statusText}`);
    }

    const records = await response.json();

    if (!records || records.length === 0) {
      console.log(`Không tìm thấy dữ liệu ${entityName} nào.`);
      return;
    }

    console.log(`Đã tải xong ${records.length} bản ghi. Bắt đầu Insert vào Supabase...`);
    
    // Clean records
    const cleanRecords = records.map(r => {
      const clean = { ...r };
      if (clean._id) {
         if (!clean.id) clean.id = clean._id;
         delete clean._id;
      }
      
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      
      const objectIdToUuid = (id) => {
        if (typeof id !== 'string' || id.length !== 24) return id;
        const hex = id + '00000000'; // Pad to 32 chars
        return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20,32)}`;
      };

      for (const key of Object.keys(clean)) {
        let value = clean[key];
        
        if (typeof value === 'string' && value === '') {
          value = null;
        }

        if (key === 'id' || key.endsWith('_id')) {
          if (typeof value === 'string') {
            if (value === 'all') {
              value = '00000000-0000-0000-0000-000000000000'; // Dummy UUID for 'all'
            } else if (value.length === 24) {
              value = objectIdToUuid(value);
            } else if (!uuidRegex.test(value)) {
              value = null; // Any other non-UUID is nullified
            }
          }
        }
        if (key === 'group_id' && ['service', 'product', 'servicepackage', 'treatment'].includes(tableName)) {
          value = null; // Bỏ qua group_id sai lệch FK trỏ nhầm sang customergroup
        }
        
        // Sửa lỗi NOT NULL trên invoice.customer_name
        if (tableName === 'invoice' && key === 'customer_name' && !value) {
          value = 'Khách vãng lai';
        }
        
        // Sửa lỗi NOT NULL trên invoice.branch_id
        if (tableName === 'invoice' && key === 'branch_id' && !value) {
          value = '00000000-0000-0000-0000-000000000000';
        }

        clean[key] = value;
      }
      
      // Remove system fields to avoid schema mismatch
      delete clean.created_by_id;
      delete clean.updated_by_id;
      delete clean.created_date;
      delete clean.updated_date;
      delete clean.createdAt;
      delete clean.updatedAt;
      delete clean.is_sample;
      delete clean.status_history;
      
      // Map 'name' from Base44 Staff to 'full_name' for Supabase Staff
      if (tableName === 'staff' && clean.name) {
        clean.full_name = clean.name;
        delete clean.name;
      }

      return clean;
    });

    const BATCH_SIZE = 500;
    for (let i = 0; i < cleanRecords.length; i += BATCH_SIZE) {
      const batch = cleanRecords.slice(i, i + BATCH_SIZE);
      const { error } = await supabase.from(tableName).upsert(batch, { onConflict: 'id', ignoreDuplicates: false });
      
      if (error) {
        console.error(`Lỗi khi insert vào Supabase ở batch ${i}:`, error);
        throw error;
      }
    }
    
    console.log(`✅ Hoàn tất! Đã chuyển thành công ${records.length} bản ghi vào bảng '${tableName}' trên Supabase.`);
  } catch (error) {
    console.error(`❌ Quá trình Migrate thất bại:`, error);
  }
}

async function run() {
  console.log('Bắt đầu công cụ chuyển đổi dữ liệu Base44 -> Supabase...\n');
  
  // Tạo các bản ghi dummy để map giá trị "all" nhằm tránh lỗi Foreign Key
  console.log('Tạo dummy records cho "all"...');
  
  const dummyBranch = await supabase.from('branch').upsert({ id: '00000000-0000-0000-0000-000000000000', name: 'Tất cả chi nhánh' }, { onConflict: 'id' });
  if (dummyBranch.error) console.error("Lỗi tạo dummy branch:", dummyBranch.error);

  const dummyCustomer = await supabase.from('customer').upsert({ id: '00000000-0000-0000-0000-000000000000', name: 'Khách vãng lai', phone: '0000000000' }, { onConflict: 'id' });
  if (dummyCustomer.error) console.error("Lỗi tạo dummy customer:", dummyCustomer.error);

  const dummyStaff = await supabase.from('staff').upsert({ id: '00000000-0000-0000-0000-000000000000', full_name: 'Không xác định' }, { onConflict: 'id' });
  if (dummyStaff.error) console.error("Lỗi tạo dummy staff:", dummyStaff.error);

  const dummyService = await supabase.from('service').upsert({ id: '00000000-0000-0000-0000-000000000000', name: 'Dịch vụ khác' }, { onConflict: 'id' });
  if (dummyService.error) console.error("Lỗi tạo dummy service:", dummyService.error);

  for (const [entityName, tableName] of Object.entries(ENTITY_MAP)) {
    await migrateEntity(entityName, tableName);
  }
}

run().catch(console.error);
