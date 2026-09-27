const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, serviceKey);

async function run() {
  const tables = [
    'customer', 'customergroup', 'customersegment', 
    'invoice', 'invoice_item', 'appointment',
    'staff', 'staffgroup', 'branch', 'servicecombo',
    'servicegroup', 'servicepackage', 'treatment',
    'shift', 'shifttemplate', 'staffattendance',
    'staffcommissionrule', 'staffschedule', 'user_profile',
    'service', 'product', 'customertier', 'customertierhistory'
  ];

  for (const table of tables) {
    const { error } = await supabase.rpc('execute_sql', {
      query: `ALTER TABLE public."${table}" ALTER COLUMN tenant_id SET DEFAULT auth.uid();`
    });
    if (error) {
      // If RPC doesn't exist, we can't do this from REST easily unless we have an rpc
      console.log(`Failed for ${table}:`, error.message);
      break;
    } else {
      console.log(`Set default for ${table}`);
    }
  }
}

run();
